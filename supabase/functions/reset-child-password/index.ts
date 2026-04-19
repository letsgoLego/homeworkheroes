import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { z } from "https://esm.sh/zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  password: z.string().min(6),
  childId: z.string().uuid(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { password, childId } = parsed.data;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get child info
    const { data: childData, error: childError } = await adminClient
      .from("children")
      .select("id, family_id, name, username, has_account")
      .eq("id", childId)
      .single();

    if (childError || !childData) {
      return new Response(JSON.stringify({ error: "Child not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!childData.has_account || !childData.username) {
      return new Response(JSON.stringify({ error: "Child has no account" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is a parent in the same family
    const { data: callerRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("family_id", childData.family_id)
      .eq("role", "parent")
      .single();

    if (!callerRole) {
      return new Response(JSON.stringify({ error: "Only parents can reset child passwords" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find child auth user via the user_roles mapping
    const { data: childRole } = await adminClient
      .from("user_roles")
      .select("user_id")
      .eq("child_id", childId)
      .eq("role", "child")
      .maybeSingle();

    let childUserId = childRole?.user_id;

    // Fallback: lookup by email if no role mapping
    if (!childUserId) {
      const email = `${childData.username}@laxhjalpen.child`;
      const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers();
      if (listError) throw listError;
      const existingUser = existingUsers.users.find((u) => u.email?.toLowerCase() === email);
      if (!existingUser) {
        return new Response(JSON.stringify({ error: "Child auth user not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      childUserId = existingUser.id;
    }

    const { error: updateError } = await adminClient.auth.admin.updateUserById(childUserId, {
      password,
    });

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, childName: childData.name }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error resetting child password:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
