import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ReqBody = { appointmentId: string };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Always return responses with CORS headers
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function text(msg: string, status = 200) {
  return new Response(msg, {
    status,
    headers: corsHeaders,
  });
}

function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function getGoogleAccessToken(): Promise<string> {
  const params = new URLSearchParams();
  params.set("client_id", env("GOOGLE_CLIENT_ID"));
  params.set("client_secret", env("GOOGLE_CLIENT_SECRET"));
  params.set("refresh_token", env("GOOGLE_REFRESH_TOKEN"));
  params.set("grant_type", "refresh_token");

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const tokenJson = await r.json();
  if (!r.ok) throw new Error(`Token refresh failed: ${JSON.stringify(tokenJson)}`);
  if (!tokenJson.access_token) throw new Error("No access_token in token response");
  return tokenJson.access_token as string;
}

function pickMeetLink(event: any): string | null {
  if (event?.hangoutLink) return event.hangoutLink;
  const eps = event?.conferenceData?.entryPoints;
  if (Array.isArray(eps)) {
    const video = eps.find((e: any) => e.entryPointType === "video");
    if (video?.uri) return video.uri;
  }
  return null;
}

serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return text("OK");
    }

    if (req.method !== "POST") return text("Method Not Allowed", 405);

    const { appointmentId } = (await req.json()) as ReqBody;
    if (!appointmentId) return text("Missing appointmentId", 400);

    const supabaseUrl = env("SUPABASE_URL");
    const serviceRole = env("SUPABASE_SERVICE_ROLE_KEY");
    const sb = createClient(supabaseUrl, serviceRole);

    // 1) Load appointment
    const { data: appt, error: apptErr } = await sb
      .from("appointments")
      .select("id, user_id, service_type, start_time, end_time, google_calendar_event_id")
      .eq("id", appointmentId)
      .maybeSingle();

    if (apptErr) throw apptErr;
    if (!appt) return text("Appointment not found", 404);

    if (appt.google_calendar_event_id) {
      return json({ ok: true, already: true });
    }

    // 2) Load client profile (email)
    const { data: profile, error: profErr } = await sb
      .from("profiles")
      .select("email, first, last")
      .eq("id", appt.user_id)
      .maybeSingle();

    if (profErr) throw profErr;
    if (!profile?.email) return text("Client email missing", 400);

    const adminEmail = env("GOOGLE_ADMIN_EMAIL");
    const calendarId = env("GOOGLE_CALENDAR_ID"); // "primary"
    const tz = env("DEFAULT_TIMEZONE");

    // 3) Create Calendar event w/ google meet
    const accessToken = await getGoogleAccessToken();
    const requestId = crypto.randomUUID();

    const eventBody = {
      summary: `Grima Financial Session — ${appt.service_type}`,
      description: `Client: ${profile.first ?? ""} ${profile.last ?? ""} (${profile.email})`,
      start: { dateTime: appt.start_time, timeZone: tz },
      end: { dateTime: appt.end_time, timeZone: tz },
      attendees: [{ email: adminEmail }, { email: profile.email }],
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const url =
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}` +
      `/events?conferenceDataVersion=1&sendUpdates=all`;

    const gRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventBody),
    });

    const gEvent = await gRes.json();
    if (!gRes.ok) throw new Error(`Google events.insert failed: ${JSON.stringify(gEvent)}`);

    const meetLink = pickMeetLink(gEvent);
    const eventId = gEvent?.id as string | undefined;

    // 4) Persist back
    const { error: updErr } = await sb
      .from("appointments")
      .update({
        google_meet_link: meetLink,
        google_calendar_event_id: eventId,
      })
      .eq("id", appointmentId);

    if (updErr) throw updErr;

    return json({ ok: true, meetLink, eventId });
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: String((e as any)?.message ?? e) }, 500);
  }
});
