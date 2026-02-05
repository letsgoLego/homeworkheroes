 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers":
     "authorization, x-client-info, apikey, content-type",
 };
 
 Deno.serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
     // Calculate the cutoff date (7 days ago)
     const cutoffDate = new Date();
     cutoffDate.setDate(cutoffDate.getDate() - 7);
     const cutoffDateStr = cutoffDate.toISOString().split("T")[0];
 
     console.log(`Cleaning up homework with due_date before ${cutoffDateStr}`);
 
     // First, get all homework IDs that need to be deleted
     const { data: oldHomework, error: fetchError } = await supabase
       .from("homework")
       .select("id")
       .lt("due_date", cutoffDateStr);
 
     if (fetchError) {
       throw fetchError;
     }
 
     if (!oldHomework || oldHomework.length === 0) {
       console.log("No old homework to clean up");
       return new Response(
         JSON.stringify({ message: "No old homework to clean up", deleted: 0 }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const homeworkIds = oldHomework.map((hw) => hw.id);
     console.log(`Found ${homeworkIds.length} homework entries to delete`);
 
     // Delete associated study tasks first
     const { error: tasksError } = await supabase
       .from("study_tasks")
       .delete()
       .in("homework_id", homeworkIds);
 
     if (tasksError) {
       console.error("Error deleting study tasks:", tasksError);
       throw tasksError;
     }
 
     // Delete the homework entries
     const { error: homeworkError } = await supabase
       .from("homework")
       .delete()
       .in("id", homeworkIds);
 
     if (homeworkError) {
       console.error("Error deleting homework:", homeworkError);
       throw homeworkError;
     }
 
     console.log(`Successfully deleted ${homeworkIds.length} homework entries and their tasks`);
 
     return new Response(
       JSON.stringify({
         message: "Cleanup completed successfully",
         deleted: homeworkIds.length,
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("Cleanup error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
     return new Response(
      JSON.stringify({ error: errorMessage }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });