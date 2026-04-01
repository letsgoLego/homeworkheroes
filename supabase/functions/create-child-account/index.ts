import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { z } from "https://esm.sh/zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-z0-9_]+$/),
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

    const { username, password, childId } = parsed.data;
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

    const { data: callerRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("family_id", childData.family_id)
      .eq("role", "parent")
      .single();

    if (!callerRole) {
      return new Response(JSON.stringify({ error: "Only parents can create child accounts" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (childData.has_account && childData.username === username) {
      return new Response(
        JSON.stringify({ success: true, alreadyExists: true, childName: childData.name }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const email = `${username}@laxhjalpen.child`;
    const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUser = existingUsers.users.find((u) => u.email?.toLowerCase() === email);

    if (existingUser) {
      if (childData.has_account && childData.username === username) {
        return new Response(
          JSON.stringify({ success: true, alreadyExists: true, childName: childData.name }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ error: "Username taken" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        return new Response(JSON.stringify({ error: "Username taken" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw authError;
    }

    const { error: updateChildError } = await adminClient
      .from("children")
      .update({ username, has_account: true })
      .eq("id", childId);

    if (updateChildError) throw updateChildError;

    const { data: existingRole } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", authData.user.id)
      .eq("child_id", childId)
      .eq("role", "child")
      .maybeSingle();

    if (!existingRole) {
      const { error: roleError } = await adminClient.from("user_roles").insert({
        user_id: authData.user.id,
        role: "child",
        family_id: childData.family_id,
        child_id: childId,
      });

      if (roleError) throw roleError;
    }

    return new Response(JSON.stringify({ success: true, childName: childData.name }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error creating child account:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
