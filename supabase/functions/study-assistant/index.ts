import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request body: messages must be an array" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase environment variables are not configured");
      return new Response(
        JSON.stringify({ error: "Backend is not fully configured for AI usage tracking." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const authHeader = req.headers.get("Authorization") ?? "";

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error("Unauthorized study-assistant call", userError);
      return new Response(
        JSON.stringify({ error: "You must be signed in to use the study assistant." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if user has an active premium subscription
    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from("subscriptions")
      .select("id, expires_at, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .gte("expires_at", new Date().toISOString())
      .maybeSingle();

    if (subscriptionError) {
      console.error("Error checking subscription status:", subscriptionError);
    }

    const isPremium = !!subscription;

    const DAILY_LIMIT = 10;

    if (!isPremium) {
      const today = new Date().toISOString().slice(0, 10);

      const { data: usageRow, error: usageError } = await supabaseClient
        .from("ai_usage")
        .select("id, question_count")
        .eq("user_id", user.id)
        .eq("usage_date", today)
        .maybeSingle();

      if (usageError && usageError.code !== "PGRST116") {
        console.error("Error fetching AI usage:", usageError);
      }

      const currentCount = usageRow?.question_count ?? 0;

      if (currentCount >= DAILY_LIMIT) {
        return new Response(
          JSON.stringify({
            errorCode: "AI_DAILY_LIMIT",
            limit: DAILY_LIMIT,
            isPremium: false,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Only increment after we successfully get an AI response below
      // (we'll perform the insert/update after the AI gateway call succeeds)
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!apiKey) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI is not configured for this project." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Optional: model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are an AI-powered study assistant for Alkhader Learn students. " +
              "Explain concepts clearly and step by step when needed. " +
              "Respond in the same language the student uses (Arabic or English). " +
              "Focus on Jordanian high-school curriculum topics like Arabic, English, Biology, Chemistry, and Mathematics where relevant.",
          },
          ...(messages as ChatMessage[]),
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error:
              "AI credits have been used up for this workspace. Please add funds to continue using the study assistant.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();
    const reply =
      data?.choices?.[0]?.message?.content ??
      "I'm sorry, I couldn't generate a response. Please try asking in a different way.";

    // After a successful AI response, increment daily usage for non-premium users
    if (!isPremium) {
      const today = new Date().toISOString().slice(0, 10);

      const { data: existingUsage, error: existingUsageError } = await supabaseClient
        .from("ai_usage")
        .select("id, question_count")
        .eq("user_id", user.id)
        .eq("usage_date", today)
        .maybeSingle();

      if (existingUsageError && existingUsageError.code !== "PGRST116") {
        console.error("Error fetching AI usage for increment:", existingUsageError);
      } else if (existingUsage) {
        const { error: updateError } = await supabaseClient
          .from("ai_usage")
          .update({ question_count: (existingUsage.question_count ?? 0) + 1 })
          .eq("id", existingUsage.id);

        if (updateError) {
          console.error("Error updating AI usage:", updateError);
        }
      } else {
        const { error: insertError } = await supabaseClient
          .from("ai_usage")
          .insert({
            user_id: user.id,
            usage_date: today,
            question_count: 1,
          });

        if (insertError) {
          console.error("Error inserting AI usage:", insertError);
        }
      }
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in study-assistant function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
