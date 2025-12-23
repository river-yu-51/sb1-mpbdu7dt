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
  sender_name?: string | null; // Optional, might add later
  content: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  service_type: string;
  start_time: string; // timestamptz ISO
  end_time: string;   // timestamptz ISO
  status: "scheduled" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
  google_meet_link?: string | null; // Optional, might add later
  session_notes?: SessionNote[];
}

export interface SessionNote {
  id: string;
  appointment_id: string;
  title: string;
  content: string;
  file_url: string | null;
  created_at: string;
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

/**
 * Generates 30-min timeslots in 12h format for a given date.
 * (Same as before)
 */
export const generateTimeSlots = (date: Date) => {
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const startHour = isWeekend ? 10 : 9;
  const endHour = 19;

  const slots: string[] = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    const time12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const ampm = hour >= 12 ? "PM" : "AM";
    slots.push(`${time12}:00 ${ampm}`);
    if (hour < endHour) slots.push(`${time12}:30 ${ampm}`);
  }
  return slots;
};

/**
 * Convert (YYYY-MM-DD, "3:30 PM") into a Date.
 * NOTE: This uses the browser locale timezone.
 * Good enough to unblock you; later we can make this timezone-explicit.
 */
function parseLocalDateAndTime(dateYYYYMMDD: string, time12h: string): Date {
  // Safe-ish manual parse
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

export const db = {
  async getUser(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as any;
  },

  async updateUser(userId: string, updateData: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select("*")
      .single();

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
    // RLS allows only admins to select all profiles => this will work only for admins
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .neq("role", "admin")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as any;
  },

  /** -------- Messages -------- */

  async createMessage(messageData: Omit<Message, "id" | "status" | "created_at" | "updated_at" | "replies">): Promise<Message> {
    const { data, error } = await supabase
      .from("messages")
      .insert(messageData)
      .select("*")
      .single();

    if (error) throw error;
    return data as any;
  },

  async getUserMessages(userId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

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

    const { data, error } = await supabase
      .from("message_replies")
      .insert(rest)
      .select("*")
      .single();

    if (error) throw error;
    return data as any;
  },

  /** -------- Appointments -------- */

  async getUserAppointments(userId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", userId)
      .order("start_time", { ascending: false });

    if (error) throw error;
    return (data ?? []) as any;
  },

  async getAppointmentById(id: string): Promise<Appointment | null> {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as any;
  },

  /**
   * Accepts either:
   *  - { user_id, service_type, start_time, end_time, notes? }
   *  - legacy { user_id, service_type, date, time, notes? } and converts to start/end (30 mins)
   */
  async createAppointment(appointmentData: any): Promise<Appointment> {
    const payload =
      appointmentData.start_time && appointmentData.end_time
        ? {
            user_id: appointmentData.user_id,
            service_type: appointmentData.service_type,
            start_time: appointmentData.start_time,
            end_time: appointmentData.end_time,
            notes: appointmentData.notes ?? null,
          }
        : (() => {
            const start = parseLocalDateAndTime(appointmentData.date, appointmentData.time);
            const end = new Date(start.getTime() + 30 * 60 * 1000);
            return {
              user_id: appointmentData.user_id,
              service_type: appointmentData.service_type,
              start_time: start.toISOString(),
              end_time: end.toISOString(),
              notes: appointmentData.notes ?? null,
            };
          })();

    const { data, error } = await supabase
      .from("appointments")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    return data as any;
  },

  async updateAppointmentStatus(appointmentId: string, status: Appointment["status"]): Promise<void> {
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", appointmentId);

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

  /** -------- Session notes -------- */

  async addSessionNote(appointmentId: string, noteData: Omit<SessionNote, "id" | "created_at" | "appointment_id">): Promise<void> {
    const payload = { ...noteData, appointment_id: appointmentId };

    const { error } = await supabase
      .from("session_notes")
      .insert(payload);

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
    const { data, error } = await supabase
      .from("assessment_scores")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as any;
  },

  async addAssessmentScore(scoreData: Omit<AssessmentScore, "id" | "created_at">): Promise<AssessmentScore> {
    const { data, error } = await supabase
      .from("assessment_scores")
      .insert(scoreData)
      .select("*")
      .single();

    if (error) throw error;
    return data as any;
  },

  /**
   * This was a "mock" trick before. In the real DB, do it properly:
   * simplest is just create a placeholder completed appointment using start/end.
   */
  async grantAssessmentRetake(userId: string): Promise<void> {
    const start = new Date();
    const end = new Date(start.getTime() + 1 * 60 * 1000);

    const { error } = await supabase.from("appointments").insert({
      user_id: userId,
      service_type: "Admin-Granted Assessment Retake",
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: "completed",
      notes: "Placeholder appointment to allow retake.",
    });

    if (error) throw error;
  },

  /** -------- Availability -------- */

  /**
   * Returns a list of blocked times ("3:30 PM") + booked times for a given date.
   * Uses:
   *  - availability_blocks (start/end)
   *  - appointments (start/end) where status='scheduled'
   */
  async getAvailabilityForDate(dateYYYYMMDD: string): Promise<string[]> {
    // Compute local day start/end
    const dayStart = new Date(`${dateYYYYMMDD}T00:00:00`);
    const dayEnd = new Date(`${dateYYYYMMDD}T23:59:59.999`);

    // Fetch blocks
    const { data: blocks, error: blocksErr } = await supabase
      .from("availability_blocks")
      .select("*")
      .gte("start_time", dayStart.toISOString())
      .lte("start_time", dayEnd.toISOString());

    if (blocksErr) throw blocksErr;

    // Fetch booked appointments
    const { data: booked, error: apptErr } = await supabase
      .from("appointments")
      .select("*")
      .eq("status", "scheduled")
      .gte("start_time", dayStart.toISOString())
      .lte("start_time", dayEnd.toISOString());

    if (apptErr) throw apptErr;

    const toTimeLabel = (iso: string) => {
      const d = new Date(iso);
      let hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      if (hours === 0) hours = 12;
      const mm = String(minutes).padStart(2, "0");
      return `${hours}:${mm} ${ampm}`;
    };

    const unavailable = new Set<string>();
    (blocks ?? []).forEach((b: any) => unavailable.add(toTimeLabel(b.start_time)));
    (booked ?? []).forEach((a: any) => unavailable.add(toTimeLabel(a.start_time)));

    return Array.from(unavailable);
  },

  /**
   * Toggle a 30-min availability block at the given local date/time.
   * Admin-only under RLS (as per your schema).
   */
  async updateAvailability(dateYYYYMMDD: string, time12h: string, isUnavailable: boolean): Promise<void> {
    const start = parseLocalDateAndTime(dateYYYYMMDD, time12h);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    if (isUnavailable) {
      const { error } = await supabase.from("availability_blocks").insert({
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      });
      if (error) throw error;
    } else {
      // Remove matching block (best-effort exact match)
      const { error } = await supabase
        .from("availability_blocks")
        .delete()
        .eq("start_time", start.toISOString())
        .eq("end_time", end.toISOString());

      if (error) throw error;
    }
  },
};
