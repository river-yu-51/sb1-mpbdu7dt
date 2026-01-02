import { supabase } from "./supabase";

/** =========================
 *  Types (match DB schema)
 *  ========================= */

export interface User {
  id: string;
  email: string;
  first: string | null;
  last: string | null;
  phone: string | null;
  age: number | null;
  role: "user" | "admin";
  consent_signed: boolean;
  consent_signed_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "replied";
  created_at: string;
  updated_at: string;
  replies?: MessageReply[];
}

export interface MessageReply {
  id: string;
  message_id: string;
  sender_type: "admin" | "client";
  sender_name?: string | null;
  content: string;
  created_at: string;
}

export interface Service {
  id: string;
  category: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  is_active: boolean;
  requires_onboarding: boolean;
  is_initial: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SessionNote {
  id: string;
  appointment_id: string;
  title: string;
  content: string;
  file_url: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;

  service_id: string | null; // uuid
  service_type?: string; // legacy (name)

  start_time: string;
  end_time: string;
  status: "scheduled" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;

  google_meet_link?: string | null;
  session_notes?: SessionNote[];

  // optional joined service (if you select it)
  service?: Service;
}

export interface AssessmentScore {
  id: string;
  user_id: string;
  type: "stress" | "literacy";
  score_breakdown: any;
  user_answers: any;
  created_at: string;
}

/** Availability blocks table is start/end timestamps */
export interface AvailabilityBlock {
  id: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

/** =========================
 *  UI helpers
 *  ========================= */

export const generateTimeSlots = (date: Date) => {
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const startHour = isWeekend ? 10 : 9;
  const endHour = 19;

  const slots: string[] = [];

  const start = new Date(date);
  start.setHours(startHour, 0, 0, 0);

  const end = new Date(date);
  end.setHours(endHour, 0, 0, 0);

  for (let t = new Date(start); t < end; t = new Date(t.getTime() + 15 * 60 * 1000)) {
    const hours = t.getHours();
    const minutes = t.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const h12 = ((hours + 11) % 12) + 1;
    const mm = String(minutes).padStart(2, "0");
    slots.push(`${h12}:${mm} ${ampm}`);
  }

  return slots;
};

function parseLocalDateAndTime(dateYYYYMMDD: string, time12h: string): Date {
  const [yearStr, monthStr, dayStr] = dateYYYYMMDD.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const day = Number(dayStr);

  const match = time12h.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) throw new Error(`Invalid time format: ${time12h}`);

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const ampm = match[3].toUpperCase();

  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;

  return new Date(year, month, day, hour, minute, 0, 0);
}

export function toISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const db = {
  async getUser(email: string): Promise<User | null> {
    const { data, error } = await supabase.from("profiles").select("*").eq("email", email).maybeSingle();
    if (error) throw error;
    return (data ?? null) as any;
  },

  async updateUser(userId: string, updateData: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase.from("profiles").update(updateData).eq("id", userId).select("*").single();
    if (error) throw error;
    return data as any;
  },

  async signConsent(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("profiles")
      .update({ consent_signed: true, consent_signed_at: new Date().toISOString() })
      .eq("id", userId)
      .select("*")
      .single();
    if (error) throw error;
    return data as any;
  },

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .neq("role", "admin")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as any;
  },

  /** -------- Messages -------- */

  async createMessage(
    messageData: Omit<Message, "id" | "status" | "created_at" | "updated_at" | "replies">
  ): Promise<Message> {
    const { data, error } = await supabase.from("messages").insert(messageData).select("*").single();
    if (error) throw error;
    return data as any;
  },

  async getUserMessages(userId: string): Promise<Message[]> {
    const { data, error } = await supabase.from("messages").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as any;
  },

  async getMessageReplies(messageId: string): Promise<MessageReply[]> {
    const { data, error } = await supabase
      .from("message_replies")
      .select("*")
      .eq("message_id", messageId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as any;
  },

  async addMessageReply(replyData: Omit<MessageReply, "id" | "created_at">): Promise<MessageReply> {
    const { sender_name, ...rest } = replyData as any;
    const { data, error } = await supabase.from("message_replies").insert(rest).select("*").single();
    if (error) throw error;
    return data as any;
  },

  /** -------- Appointments -------- */

  // RECOMMENDED: include joined service in case UI wants it
  async getUserAppointments(userId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from("appointments")
      .select("*, service:services(*)")
      .eq("user_id", userId)
      .order("start_time", { ascending: false });

    if (error) throw error;
    return (data ?? []) as any;
  },

  async getAppointmentById(id: string): Promise<Appointment | null> {
    const { data, error } = await supabase
      .from("appointments")
      .select("*, service:services(*)")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as any;
  },

  async createAppointment(appointmentData: any): Promise<Appointment> {
    let service: Service | null = null;

    if (appointmentData.service_id) {
      const { data, error } = await supabase.from("services").select("*").eq("id", appointmentData.service_id).maybeSingle();
      if (error) throw error;
      service = (data ?? null) as any;
      if (!service) throw new Error("Selected service not found.");
    }

    const durationMinutes =
      Number(appointmentData.duration_minutes) ||
      Number(appointmentData.durationMinutes) ||
      service?.duration_minutes ||
      30;

    const makeStartEnd = () => {
      if (appointmentData.start_time && appointmentData.end_time) {
        return { start_time: appointmentData.start_time, end_time: appointmentData.end_time };
      }
      const start = parseLocalDateAndTime(appointmentData.date, appointmentData.time);
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
      return { start_time: start.toISOString(), end_time: end.toISOString() };
    };

    const { start_time, end_time } = makeStartEnd();

    const payload: any = {
      user_id: appointmentData.user_id,
      service_id: appointmentData.service_id ?? null,
      // keep legacy snapshot during transition:
      service_type: appointmentData.service_type ?? service?.name ?? null,
      start_time,
      end_time,
      notes: appointmentData.notes ?? null,
      status: appointmentData.status ?? "scheduled",
    };

    const { data, error } = await supabase.from("appointments").insert(payload).select("*").single();
    if (error) throw error;
    return data as any;
  },

  async updateAppointmentStatus(appointmentId: string, status: Appointment["status"]): Promise<void> {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", appointmentId);
    if (error) throw error;
  },

  async rescheduleAppointment(id: string, date: string, time: string): Promise<Appointment | null> {
    const start = parseLocalDateAndTime(date, time);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const { data, error } = await supabase
      .from("appointments")
      .update({ start_time: start.toISOString(), end_time: end.toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return data as any;
  },

  /** -------- Services -------- */

  async getServices(activeOnly = true): Promise<Service[]> {
    let q = supabase.from("services").select("*").order("category").order("sort_order").order("name");
    if (activeOnly) q = q.eq("is_active", true);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as any;
  },

  async upsertService(service: Partial<Service> & Pick<Service, "name" | "category" | "duration_minutes">): Promise<Service> {
    const { data, error } = await supabase.from("services").upsert(service).select("*").single();
    if (error) throw error;
    return data as any;
  },

  async deleteService(id: string): Promise<void> {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) throw error;
  },

  /** -------- Session notes -------- */

  async addSessionNote(appointmentId: string, noteData: Omit<SessionNote, "id" | "created_at" | "appointment_id">): Promise<void> {
    const payload = { ...noteData, appointment_id: appointmentId };
    const { error } = await supabase.from("session_notes").insert(payload);
    if (error) throw error;
  },

  async getSessionNotesForAppointment(appointmentId: string): Promise<SessionNote[]> {
    const { data, error } = await supabase
      .from("session_notes")
      .select("*")
      .eq("appointment_id", appointmentId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as any;
  },

  /** -------- Assessment scores -------- */

  async getUserAssessmentScores(userId: string): Promise<AssessmentScore[]> {
    const { data, error } = await supabase.from("assessment_scores").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as any;
  },

  async addAssessmentScore(scoreData: Omit<AssessmentScore, "id" | "created_at">): Promise<AssessmentScore> {
    const { data, error } = await supabase.from("assessment_scores").insert(scoreData).select("*").single();
    if (error) throw error;
    return data as any;
  },

  /** -------- Eligibility -------- */

  async canBookRegularSessions(userId: string): Promise<boolean> {
    // Consent
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("consent_signed")
      .eq("id", userId)
      .maybeSingle();
    if (pErr) throw pErr;
    const consentOk = !!profile?.consent_signed;

    // Initial consult completed:
    // New path: appointment.service_id -> services.is_initial = true
    // Legacy fallback: appointment.service_type === "Initial Consultation"
    const { data: appts, error: aErr } = await supabase
      .from("appointments")
      .select("status, service_type, service:services(is_initial)")
      .eq("user_id", userId)
      .eq("status", "completed");
    if (aErr) throw aErr;

    const introOk =
      (appts ?? []).some((row: any) => row?.service?.is_initial === true) ||
      (appts ?? []).some((row: any) => row?.service_type === "Initial Consultation");

    // Assessments completed
    const { data: scores, error: sErr } = await supabase.from("assessment_scores").select("type").eq("user_id", userId);
    if (sErr) throw sErr;
    const types = new Set((scores ?? []).map((s: any) => s.type));
    const assessmentsOk = types.has("stress") && types.has("literacy");

    return consentOk && introOk && assessmentsOk;
  },

  async grantAssessmentRetake(userId: string): Promise<void> {
    const start = new Date();
    const end = new Date(start.getTime() + 1 * 60 * 1000);

    const { error } = await supabase.from("appointments").insert({
      user_id: userId,
      service_id: null,
      service_type: "Admin-Granted Assessment Retake",
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: "completed",
      notes: "Placeholder appointment to allow retake.",
    });

    if (error) throw error;
  },

  /** -------- Availability -------- */

  async getAvailabilityForDate(dateYYYYMMDD: string): Promise<{ booked: string[]; blocked: string[] }> {
    const [y, m, d] = dateYYYYMMDD.split("-").map(Number);

    const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
    const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);

    const { data: blocks, error: blocksErr } = await supabase
      .from("availability_blocks")
      .select("*")
      .lt("start_time", dayEnd.toISOString())
      .gt("end_time", dayStart.toISOString());
    if (blocksErr) throw blocksErr;

    const { data: bookedAppts, error: apptErr } = await supabase
      .from("appointments")
      .select("*")
      .eq("status", "scheduled")
      .lt("start_time", dayEnd.toISOString())
      .gt("end_time", dayStart.toISOString());
    if (apptErr) throw apptErr;

    const toTimeLabel = (dt: Date) => {
      let hours = dt.getHours();
      const minutes = dt.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      if (hours === 0) hours = 12;
      const mm = String(minutes).padStart(2, "0");
      return `${hours}:${mm} ${ampm}`;
    };

    const addIntervalAs15MinBlocks = (startIso: string, endIso: string, out: Set<string>) => {
      const s = new Date(startIso);
      const e = new Date(endIso);

      const start = s < dayStart ? new Date(dayStart) : s;
      const end = e > dayEnd ? new Date(dayEnd) : e;

      for (let t = new Date(start); t < end; t = new Date(t.getTime() + 15 * 60 * 1000)) {
        out.add(toTimeLabel(t));
      }
    };

    const booked = new Set<string>();
    const blocked = new Set<string>();

    (bookedAppts ?? []).forEach((a: any) => addIntervalAs15MinBlocks(a.start_time, a.end_time, booked));
    (blocks ?? []).forEach((b: any) => addIntervalAs15MinBlocks(b.start_time, b.end_time, blocked));

    return { booked: Array.from(booked), blocked: Array.from(blocked) };
  },

  async updateAvailability(dateYYYYMMDD: string, time12h: string, isUnavailable: boolean): Promise<void> {
    const start = parseLocalDateAndTime(dateYYYYMMDD, time12h);
    const end = new Date(start.getTime() + 15 * 60 * 1000);

    if (isUnavailable) {
      const { error } = await supabase.from("availability_blocks").insert({
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      });
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("availability_blocks")
        .delete()
        .eq("start_time", start.toISOString())
        .eq("end_time", end.toISOString());
      if (error) throw error;
    }
  },
};
