// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { db, User, Appointment, AssessmentScore, SessionNote, Message } from "../lib/database";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

type AppUser = User & {
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  consentSigned: boolean;
  consentSignDate: string | null;
};

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  age: number;
  phone: string;
}

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<AppUser | null>;
  logout: () => Promise<void>;

  updateUser: (userId: string, data: Partial<User>) => Promise<boolean>;

  appointments: Appointment[];
  assessmentScores: AssessmentScore[];

  loadDataForUser: (userId: string) => Promise<void>;
  refreshAppointments: (userId?: string) => Promise<void>;

  addAppointment: (appointmentData: any) => Promise<Appointment>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
  addAssessmentScore: (scoreData: Omit<AssessmentScore, "id" | "created_at">) => Promise<void>;
  addMessage: (messageData: Omit<Message, "id" | "status" | "created_at" | "updated_at" | "replies">) => Promise<void>;
  signConsent: (userId: string) => Promise<boolean>;
  rescheduleAppointment: (id: string, date: string, time: string) => Promise<Appointment | null>;
  grantAssessmentRetake: (userId: string) => Promise<void>;

  loadAllUsers: () => Promise<User[]>;
  addSessionNote: (
    appointmentId: string,
    note: Omit<SessionNote, "id" | "created_at">,
    forClientId: string
  ) => Promise<void>;
  admin_getAppointmentsForClient: (clientId: string) => Promise<Appointment[]>;
  admin_getScoresForClient: (clientId: string) => Promise<AssessmentScore[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toAppUser = (profile: User): AppUser => ({
  ...profile,
  firstName: profile.first ?? "",
  lastName: profile.last ?? "",
  isAdmin: profile.role === "admin",
  consentSigned: profile.consent_signed ?? false,
  consentSignDate: profile.consent_signed_at ?? null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false); // kept for future UI
  const [assessmentScores, setAssessmentScores] = useState<AssessmentScore[]>([]);

  const mountedRef = useRef(true);

  const clearUserState = () => {
    setUser(null);
    setAppointments([]);
    setAssessmentScores([]);
    localStorage.removeItem("grimaUser");
  };

  /** ✅ NEW: refresh just appointments (fixes "doesn't update until refresh" after booking/cancel/reschedule) */
  const refreshAppointments = async (uid?: string) => {
    const userId = uid ?? user?.id;
    if (!userId) return;

    setAppointmentsLoading(true);
    try {
      const data = await db.getUserAppointments(userId);
      if (!mountedRef.current) return;
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("refreshAppointments failed:", e);
      if (!mountedRef.current) return;
      setAppointments([]);
    } finally {
      if (mountedRef.current) setAppointmentsLoading(false);
    }
  };

  const loadDataForUser = async (userId: string) => {
    const [apptsRes, scoresRes] = await Promise.allSettled([
      db.getUserAppointments(userId),
      db.getUserAssessmentScores(userId),
    ]);

    if (!mountedRef.current) return;

    if (apptsRes.status === "fulfilled") setAppointments(Array.isArray(apptsRes.value) ? apptsRes.value : []);
    else {
      console.error("getUserAppointments failed:", apptsRes.reason);
      setAppointments([]);
    }

    if (scoresRes.status === "fulfilled") setAssessmentScores(Array.isArray(scoresRes.value) ? scoresRes.value : []);
    else {
      console.error("getUserAssessmentScores failed:", scoresRes.reason);
      setAssessmentScores([]);
    }
  };

  const fetchProfile = async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

    if (error) {
      console.error("[auth] fetchProfile error:", error);
      return null;
    }
    return (data ?? null) as User | null;
  };

  // Only auto-create/upsert the profile on register, not login
  const ensureProfileRow = async (params: {
    id: string;
    email: string | null;
    first?: string | null;
    last?: string | null;
    phone?: string | null;
    age?: number | null;
    role?: "user" | "admin";
  }) => {
    const payload = {
      id: params.id,
      email: params.email,
      first: params.first ?? null,
      last: params.last ?? null,
      phone: params.phone ?? null,
      age: params.age ?? null,
      role: params.role ?? "user",
    };

    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (error) console.error("[auth] ensureProfileRow upsert error:", error);
  };

  const hydrateFromSession = async (sessionUser: { id: string; email: string | null }) => {
    const { data: sessData } = await supabase.auth.getSession();
    const authUser = sessData.session?.user;

    if (!authUser) {
      clearUserState();
      return;
    }

    // (kept as-is in your file)
    if (!authUser.email_confirmed_at) {
      await supabase.auth.signOut();
      clearUserState();
      return;
    }

    let profile = await fetchProfile(sessionUser.id);

    if (!profile) {
      const md: any = authUser.user_metadata || {};

      await ensureProfileRow({
        id: authUser.id,
        email: authUser.email ?? sessionUser.email,
        first: md.first ?? null,
        last: md.last ?? null,
        phone: md.phone ?? null,
        age: md.age ?? null,
        role: "user",
      });

      profile = await fetchProfile(sessionUser.id);
    }

    if (!mountedRef.current) return;

    if (!profile) {
      console.warn("[auth] Signed in but profile not found even after ensureProfileRow.");
      clearUserState();
      return;
    }

    const appUser = toAppUser(profile);
    setUser(appUser);
    localStorage.setItem("grimaUser", JSON.stringify(profile));

    // ✅ keep your existing full data load on login
    void loadDataForUser(sessionUser.id);
  };

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      setIsLoading(true);
      const { data } = await supabase.auth.getSession();
      const sess = data.session;

      if (sess?.user) {
        void hydrateFromSession({ id: sess.user.id, email: sess.user.email ?? null });
      } else {
        clearUserState();
      }

      if (mountedRef.current) setIsLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mountedRef.current) return;

      if (!session?.user) {
        clearUserState();
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      void hydrateFromSession({ id: session.user.id, email: session.user.email ?? null }).finally(() => {
        if (mountedRef.current) setIsLoading(false);
      });
    });

    return () => {
      mountedRef.current = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      console.error("[login] error:", error);
      return false;
    }

    return true;
  };

  const register = async (userData: RegisterData): Promise<AppUser | null> => {
    const email = userData.email.trim();

    const { error } = await supabase.auth.signUp({
      email,
      password: userData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          first: userData.firstName,
          last: userData.lastName,
          phone: userData.phone,
          age: userData.age,
        },
      },
    });

    if (error) {
      if ((error as any).status === 422) return null;
      console.error("[register] signUp error:", error);
      return null;
    }

    // Does not sign on or create profile
    return {} as any; // keeps RegisterPage "ok" check working
  };

  const logout = async () => {
    await supabase.auth.signOut();
    clearUserState();
    navigate("/login", { replace: true });
  };

  const updateUser = async (userId: string, data: Partial<User> & any): Promise<boolean> => {
    const payload: Partial<User> = { ...data };

    if ("firstName" in data) {
      payload.first = data.firstName;
      delete (payload as any).firstName;
    }
    if ("lastName" in data) {
      payload.last = data.lastName;
      delete (payload as any).lastName;
    }

    delete (payload as any).isAdmin;
    delete (payload as any).consentSigned;
    delete (payload as any).consentSignDate;

    const updatedProfile = await db.updateUser(userId, payload);
    if (updatedProfile && user?.id === userId) {
      setUser(toAppUser(updatedProfile));
      localStorage.setItem("grimaUser", JSON.stringify(updatedProfile));
      return true;
    }
    return false;
  };

  /** ✅ UPDATED: optimistic update + refreshAppointments (fixes bug #5) */
  const addAppointment = async (appointmentData: any) => {
    const appt = await db.createAppointment(appointmentData);

    // optimistic insert so UI updates instantly (Account page, etc.)
    setAppointments((prev) => [appt, ...prev]);

    // call edge function (non-blocking for UI correctness; keep as-is but don’t fail booking if it fails)
    try {
      const { error } = await supabase.functions.invoke("create_meet_for_appointment", {
        body: { appointmentId: appt.id },
      });
      if (error) console.error("create_meet_for_appointment function error:", error);
    } catch (e) {
      console.error("create_meet_for_appointment invoke failed:", e);
    }

    // refresh from DB (ensures ordering + joined service fields are correct)
    if (appointmentData?.user_id) {
      void refreshAppointments(appointmentData.user_id);
    } else if (user?.id) {
      void refreshAppointments(user.id);
    }

    return appt;
  };

  const cancelAppointment = async (appointmentId: string) => {
    await db.updateAppointmentStatus(appointmentId, "cancelled");
    if (user?.id) void refreshAppointments(user.id);
  };

  const rescheduleAppointment = async (id: string, date: string, time: string): Promise<Appointment | null> => {
    const updated = await db.rescheduleAppointment(id, date, time);

    // optimistic patch
    if (updated) {
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
    }

    if (user?.id) void refreshAppointments(user.id);
    return updated;
  };

  const addAssessmentScore = async (scoreData: any) => {
    await db.addAssessmentScore(scoreData);
    if (user?.id) void loadDataForUser(user.id); // scores + appointments might matter for eligibility
  };

  const addMessage = async (
    messageData: Omit<Message, "id" | "status" | "created_at" | "updated_at" | "replies">
  ) => {
    await db.createMessage(messageData);
  };

  const signConsent = async (userId: string): Promise<boolean> => {
    const updatedProfile = await db.signConsent(userId);
    if (updatedProfile) {
      setUser(toAppUser(updatedProfile));
      localStorage.setItem("grimaUser", JSON.stringify(updatedProfile));
      return true;
    }
    return false;
  };

  const grantAssessmentRetake = async (userId: string): Promise<void> => {
    await db.grantAssessmentRetake(userId);
  };

  const loadAllUsers = async () => db.getAllUsers();

  const addSessionNote = async (appointmentId: string, noteData: any, _forClientId: string) => {
    await db.addSessionNote(appointmentId, noteData);
  };

  const admin_getAppointmentsForClient = (clientId: string) => db.getUserAppointments(clientId);
  const admin_getScoresForClient = (clientId: string) => db.getUserAssessmentScores(clientId);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        appointments,
        assessmentScores,
        loadDataForUser,
        refreshAppointments,
        addAppointment,
        cancelAppointment,
        addAssessmentScore,
        addMessage,
        signConsent,
        rescheduleAppointment,
        grantAssessmentRetake,
        loadAllUsers,
        addSessionNote,
        admin_getAppointmentsForClient,
        admin_getScoresForClient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
