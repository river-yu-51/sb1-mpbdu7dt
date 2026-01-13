// src/lib/database.ts
import { supabase } from "./supabase";
import { DateTime } from "luxon";
import { BUSINESS_TZ, dayRangeInstantISO } from "./time";

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

/** NEW: prerequisites rows (service_prerequisites table) */
export interface ServicePrerequisite {
  service_id: string;
  prereq_service_id: string;
  required_status: "completed" | "scheduled_or_completed";
  created_at?: string;
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

  start_time: string; // timestamptz ISO
  end_time: string;   // timestamptz ISO
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

/**
 * IMPORTANT:
 * Your UI uses "time labels" like "9:00 AM". Those are BUSINESS_TZ labels.
 * These helpers generate and interpret labels consistently in BUSINESS_TZ.
 */

export function toISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function labelFromDT(dt: DateTime): string {
  // Always format in BUSINESS_TZ
  return dt.setZone(BUSINESS_TZ).toFormat("h:mm a");
}

/**
 * Generate 15-min slots for a BUSINESS_TZ day, returned as labels like "9:00 AM".
 * Prefer calling this with a YYYY-MM-DD string for correctness.
 */
export function generateTimeSlotsForISO(dateISO: string): string[] {
  const day = DateTime.fromISO(dateISO, { zone: BUSINESS_TZ });
  const isWeekend = day.weekday === 6 || day.weekday === 7; // Sat/Sun

  const startHour = isWeekend ? 10 : 9;
  const endHour = 19;

  const start = day.set({ hour: startHour, minute: 0, second: 0, millisecond: 0 });
  const end = day.set({ hour: endHour, minute: 0, second: 0, millisecond: 0 });

  const out: string[] = [];
  for (let t = start; t < end; t = t.plus({ minutes: 15 })) {
    out.push(t.toFormat("h:mm a"));
  }
  return out;
}

/**
 * Backwards-compatible wrapper used by your pages currently.
 * NOTE: if the Date is created in a different timezone, the day may be off.
 * Best practice: update pages to pass ISO strings and call generateTimeSlotsForISO.
 */
export const generateTimeSlots = (date: Date) => generateTimeSlotsForISO(toISODateLocal(date));

/**
 * Convert a (dateISO + time label) into a UTC instant ISO string.
 */
function slotStartUTCISO(dateISO: string, time12h: string): string {
  const { hour, minute } = parseTimeLabel12h(time12h);

  const dt = DateTime.fromISO(dateISO, { zone: BUSINESS_TZ }).set({
    hour,
    minute,
    second: 0,
    millisecond: 0,
  });

  if (!dt.isValid) throw new Error(`Invalid slot datetime: ${dt.invalidReason}`);

  return dt.toUTC().toISO()!;
}

function addMinutesUTCISO(startUTCISO: string, minutes: number): string {
  return DateTime.fromISO(startUTCISO, { zone: "utc" }).plus({ minutes }).toISO()!;
}

function parseTimeLabel12h(time12h: string): { hour: number; minute: number } {
  const match = time12h.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) throw new Error(`Invalid time format: ${time12h}`);

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const ampm = match[3].toUpperCase();

  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;

  return { hour, minute };
}

function labelFromBusinessDT(dt: DateTime): string {
  // Always format as your UI labels: "h:mm AM/PM"
  return dt.setZone(BUSINESS_TZ).toFormat("h:mm a");
}


/** =========================
 *  DB API
 *  ========================= */

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
    // Load service if service_id provided (for duration + snapshot name)
    let service: Service | null = null;
    if (appointmentData.service_id) {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", appointmentData.service_id)
        .maybeSingle();
      if (error) throw error;
      service = (data ?? null) as any;
      if (!service) throw new Error("Selected service not found.");
    }

    const durationMinutes =
      Number(appointmentData.duration_minutes) ||
      Number(appointmentData.durationMinutes) ||
      service?.duration_minutes ||
      30;

    // Determine start/end (UTC) — always interpret date+time in BUSINESS_TZ
    let start_time: string;
    let end_time: string;

    if (appointmentData.start_time && appointmentData.end_time) {
      // if caller already provides ISO instants, trust them (should be UTC)
      start_time = appointmentData.start_time;
      end_time = appointmentData.end_time;
    } else {
      if (!appointmentData.date || !appointmentData.time) {
        throw new Error("Missing appointment date/time.");
      }
      start_time = slotStartUTCISO(appointmentData.date, appointmentData.time);
      end_time = addMinutesUTCISO(start_time, durationMinutes);
    }

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

  async rescheduleAppointment(id: string, dateISO: string, time12h: string): Promise<Appointment | null> {
    // Load existing appointment (join service for duration)
    const existing = await this.getAppointmentById(id);
    if (!existing) throw new Error("Appointment not found.");

    const durationMinutes = existing.service
      ? existing.service.duration_minutes
      : Math.round(
          (DateTime.fromISO(existing.end_time).toUTC().toMillis() -
            DateTime.fromISO(existing.start_time).toUTC().toMillis()) /
            60000
        );

    const startUTC = slotStartUTCISO(dateISO, time12h);
    const endUTC = addMinutesUTCISO(startUTC, durationMinutes);

    const { data, error } = await supabase
      .from("appointments")
      .update({ start_time: startUTC, end_time: endUTC })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return data as any;
  },

  /** -------- Services -------- */

  async getServices(activeOnly = true): Promise<Service[]> {
    let q = supabase
      .from("services")
      .select("*")
      .order("category")
      .order("sort_order")
      .order("name");
    if (activeOnly) q = q.eq("is_active", true);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as any;
  },

  async upsertService(
    service: Partial<Service> & Pick<Service, "name" | "category" | "duration_minutes">
  ): Promise<Service> {
    const { data, error } = await supabase.from("services").upsert(service).select("*").single();
    if (error) throw error;
    return data as any;
  },

  async deleteService(id: string): Promise<void> {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) throw error;
  },

  /** -------- Service prerequisites -------- */

  async getServicePrereqs(serviceId: string): Promise<ServicePrerequisite[]> {
    const { data, error } = await supabase
      .from("service_prerequisites")
      .select("service_id, prereq_service_id, required_status")
      .eq("service_id", serviceId);

    if (error) throw error;
    return (data ?? []) as any;
  },

  async replaceServicePrereqs(
    serviceId: string,
    prereqs: { prereq_service_id: string; required_status: "completed" | "scheduled_or_completed" }[]
  ): Promise<void> {
    const { error: delErr } = await supabase.from("service_prerequisites").delete().eq("service_id", serviceId);
    if (delErr) throw delErr;

    if (!prereqs || prereqs.length === 0) return;

    const rows = prereqs.map((p) => ({
      service_id: serviceId,
      prereq_service_id: p.prereq_service_id,
      required_status: p.required_status,
    }));

    const { error: insErr } = await supabase.from("service_prerequisites").insert(rows);
    if (insErr) throw insErr;
  },

  /** -------- Session notes -------- */

  async addSessionNote(
    appointmentId: string,
    noteData: Omit<SessionNote, "id" | "created_at" | "appointment_id">
  ): Promise<void> {
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
    const { data, error } = await supabase
      .from("assessment_scores")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
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
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("consent_signed")
      .eq("id", userId)
      .maybeSingle();
    if (pErr) throw pErr;
    const consentOk = !!profile?.consent_signed;

    const { data: appts, error: aErr } = await supabase
      .from("appointments")
      .select("status, service_type, service:services(is_initial)")
      .eq("user_id", userId)
      .eq("status", "completed");
    if (aErr) throw aErr;

    const introOk =
      (appts ?? []).some((row: any) => row?.service?.is_initial === true) ||
      (appts ?? []).some((row: any) => row?.service_type === "Initial Consultation");

    const { data: scores, error: sErr } = await supabase
      .from("assessment_scores")
      .select("type")
      .eq("user_id", userId);
    if (sErr) throw sErr;

    const types = new Set((scores ?? []).map((s: any) => s.type));
    const assessmentsOk = types.has("stress") && types.has("literacy");

    return consentOk && introOk && assessmentsOk;
  },

  async grantAssessmentRetake(userId: string): Promise<void> {
    const start = DateTime.now().toUTC().startOf("minute");
    const end = start.plus({ minutes: 1 });

    const { error } = await supabase.from("appointments").insert({
      user_id: userId,
      service_id: null,
      service_type: "Admin-Granted Assessment Retake",
      start_time: start.toISO(),
      end_time: end.toISO(),
      status: "completed",
      notes: "Placeholder appointment to allow retake.",
    });

    if (error) throw error;
  },

  /** -------- Availability -------- */

  async getAvailabilityForDate(
    dateISO: string
  ): Promise<{ booked: string[]; blocked: string[] }> {
    const { startISO, endISO } = dayRangeInstantISO(dateISO);

    // ✅ Replace direct table selects with RPC
    const { data: intervals, error } = await supabase.rpc("get_busy_intervals", {
      start_ts: startISO,
      end_ts: endISO,
    });
    if (error) throw error;

    const dayStart = DateTime.fromISO(startISO, { zone: "utc" }).setZone(BUSINESS_TZ);
    const dayEnd = DateTime.fromISO(endISO, { zone: "utc" }).setZone(BUSINESS_TZ);

    const clampToDay = (startUtcIso: string, endUtcIso: string) => {
      const s = DateTime.fromISO(startUtcIso, { zone: "utc" }).setZone(BUSINESS_TZ);
      const e = DateTime.fromISO(endUtcIso, { zone: "utc" }).setZone(BUSINESS_TZ);
      return {
        start: s < dayStart ? dayStart : s,
        end: e > dayEnd ? dayEnd : e,
      };
    };

    const addIntervalAs15MinBlocks = (startUtcIso: string, endUtcIso: string, out: Set<string>) => {
      const { start, end } = clampToDay(startUtcIso, endUtcIso);

      // normalize to 15-min grid
      let t = start.startOf("minute");
      const mod = t.minute % 15;
      if (mod !== 0) t = t.plus({ minutes: 15 - mod });

      for (; t < end; t = t.plus({ minutes: 15 })) {
        out.add(t.toFormat("h:mm a")); // or your labelFromBusinessDT(t)
      }
    };

    const booked = new Set<string>();
    const blocked = new Set<string>();

    (intervals ?? []).forEach((row: any) => {
      if (!row?.start_time || !row?.end_time) return;

      if (row.kind === "appointment") {
        addIntervalAs15MinBlocks(row.start_time, row.end_time, booked);
      } else if (row.kind === "block") {
        addIntervalAs15MinBlocks(row.start_time, row.end_time, blocked);
      }
    });

    return { booked: Array.from(booked), blocked: Array.from(blocked) };
  },

  async updateAvailability(dateISO: string, time12h: string, isUnavailable: boolean): Promise<void> {
    const { hour, minute } = parseTimeLabel12h(time12h);

    // Interpret the label in BUSINESS_TZ, then store as UTC instants (timestamptz)
    const start = DateTime.fromISO(dateISO, { zone: BUSINESS_TZ }).set({
      hour,
      minute,
      second: 0,
      millisecond: 0,
    });
    if (!start.isValid) throw new Error(`Invalid slot datetime: ${start.invalidReason}`);

    const end = start.plus({ minutes: 15 });

    const startUTC = start.toUTC().toISO()!;
    const endUTC = end.toUTC().toISO()!;

    if (isUnavailable) {
      const { error } = await supabase.from("availability_blocks").insert({
        start_time: startUTC,
        end_time: endUTC,
      });
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("availability_blocks")
        .delete()
        .eq("start_time", startUTC)
        .eq("end_time", endUTC);
      if (error) throw error;
    }
  },
};
