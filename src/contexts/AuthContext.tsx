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
  addAppointment: (
    appointment: Omit<Appointment, "id" | "created_at" | "status" | "session_notes" | "google_meet_link">
  ) => Promise<void>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
  addAssessmentScore: (scoreData: Omit<AssessmentScore, "id" | "created_at">) => Promise<void>;
  addMessage: (messageData: Omit<Message, "id" | "status" | "created_at" | "updated_at" | "replies">) => Promise<void>;
  signConsent: (userId: string) => Promise<boolean>;
  rescheduleAppointment: (id: string, date: string, time: string) => Promise<Appointment | null>;
  grantAssessmentRetake: (userId: string) => Promise<void>;

  loadAllUsers: () => Promise<User[]>;
  addSessionNote: (appointmentId: string, note: Omit<SessionNote, "id" | "created_at">, forClientId: string) => Promise<void>;
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
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [assessmentScores, setAssessmentScores] = useState<AssessmentScore[]>([]);

  const mountedRef = useRef(true);

  const clearUserState = () => {
    setUser(null);
    setAppointments([]);
    setAssessmentScores([]);
    localStorage.removeItem("grimaUser");
  };

  const loadDataForUser = async (userId: string) => {
    const [apptsRes, scoresRes] = await Promise.allSettled([
      db.getUserAppointments(userId),
      db.getUserAssessmentScores(userId),
    ]);

    if (apptsRes.status === "fulfilled") setAppointments(apptsRes.value);
    else {
      console.error("getUserAppointments failed:", apptsRes.reason);
      setAppointments([]);
    }

    if (scoresRes.status === "fulfilled") setAssessmentScores(scoresRes.value);
    else {
      console.error("getUserAssessmentScores failed:", scoresRes.reason);
      setAssessmentScores([]);
    }
  };

  const fetchProfile = async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

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
    let profile: User | null = null;

    // Try a few times (sometimes profile insert is slightly delayed after register)
    for (let i = 0; i < 6; i++) {
      profile = await fetchProfile(sessionUser.id);
      if (profile) break;
      await new Promise((r) => setTimeout(r, 250));
    }

    if (!mountedRef.current) return;

    if (!profile) {
      console.warn("[auth] Signed in but profile not found (not creating on login).");
      setUser(null);
      setAppointments([]);
      setAssessmentScores([]);
      return;
    }

    const appUser = toAppUser(profile);
    setUser(appUser);
    localStorage.setItem("grimaUser", JSON.stringify(profile));
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

  // Returns AppUser | null, and ensures profile exists on register
  const register = async (userData: RegisterData): Promise<AppUser | null> => {
    const email = userData.email.trim();

    const { data, error } = await supabase.auth.signUp({
      email,
      password: userData.password,
      options: {
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

    // Ensure we have a signed-in session user id
    let authUserId = data.user?.id ?? null;

    if (!data.session) {
      const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
        email,
        password: userData.password,
      });
      if (loginErr) {
        console.error("[register] auto-login failed:", loginErr);
        return null;
      }
      authUserId = loginData.user?.id ?? null;
    }

    if (!authUserId) return null;

    // Create/upsert profile row, only here
    await ensureProfileRow({
      id: authUserId,
      email,
      first: userData.firstName,
      last: userData.lastName,
      phone: userData.phone,
      age: userData.age,
      role: "user",
    });

    // Fetch profile and set state immediately so BookingPage can proceed
    const profile = await fetchProfile(authUserId);
    if (!profile) return null;

    const appUser = toAppUser(profile);
    setUser(appUser);
    localStorage.setItem("grimaUser", JSON.stringify(profile));
    void loadDataForUser(authUserId);

    return appUser;
  };

  const navigate = useNavigate();

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

  const addAppointment = async (appointmentData: any) => {
    await db.createAppointment(appointmentData);
    if (user) void loadDataForUser(user.id);
  };

  const cancelAppointment = async (appointmentId: string) => {
    await db.updateAppointmentStatus(appointmentId, "cancelled");
    if (user) void loadDataForUser(user.id);
  };

  const rescheduleAppointment = async (id: string, date: string, time: string): Promise<Appointment | null> => {
    const updated = await db.rescheduleAppointment(id, date, time);
    if (user) void loadDataForUser(user.id);
    return updated;
  };

  const addAssessmentScore = async (scoreData: any) => {
    await db.addAssessmentScore(scoreData);
    if (user) void loadDataForUser(user.id);
  };

  const addMessage = async (messageData: Omit<Message, "id" | "status" | "created_at" | "updated_at" | "replies">) => {
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
