import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, User, Appointment, AssessmentScore, SessionNote, Message } from '../lib/database';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<User | null>;
  updateUser: (userId: string, data: Partial<User>) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  appointments: Appointment[];
  assessmentScores: AssessmentScore[];
  loadDataForUser: (userId: string) => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id'|'created_at'|'status'|'session_notes'|'google_meet_link'>) => Promise<void>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
  addAssessmentScore: (scoreData: Omit<AssessmentScore, 'id' | 'created_at'>) => Promise<void>;
  addMessage: (messageData: Omit<Message, 'id' | 'status' | 'created_at' | 'updated_at'|'replies'>) => Promise<void>;
  signConsent: (userId: string) => Promise<boolean>;
  rescheduleAppointment: (id: string, date: string, time: string) => Promise<Appointment|null>;
  grantAssessmentRetake: (userId: string) => Promise<void>;
  // Admin functions
  loadAllUsers: () => Promise<User[]>;
  addSessionNote: (appointmentId: string, note: Omit<SessionNote, 'id' | 'created_at'>, forClientId: string) => Promise<void>;
  admin_getAppointmentsForClient: (clientId: string) => Promise<Appointment[]>;
  admin_getScoresForClient: (clientId: string) => Promise<AssessmentScore[]>;
}

interface RegisterData {
  firstName: string; lastName: string; email: string; password: string; age: number; phone: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [assessmentScores, setAssessmentScores] = useState<AssessmentScore[]>([]);

  const loadDataForUser = async (userId: string) => {
    setAppointments(await db.getUserAppointments(userId));
    setAssessmentScores(await db.getUserAssessmentScores(userId));
  };

  // Helper to transfer a temporary assessment score from sessionStorage to the database
  const transferTempAssessmentScore = async (userId: string) => {
    const tempResults = sessionStorage.getItem('tempAssessmentResults');
    if (tempResults) {
      try {
        const parsed = JSON.parse(tempResults);
        await db.addAssessmentScore({
          user_id: userId,
          type: parsed.type,
          score_breakdown: parsed.score_breakdown,
          user_answers: parsed.user_answers
        });
        sessionStorage.removeItem('tempAssessmentResults'); // Clean up
      } catch(e) {
        console.error("Failed to parse or transfer temp assessment results", e);
        sessionStorage.removeItem('tempAssessmentResults');
      }
    }
  }

  useEffect(() => {
    const checkUser = async () => {
      const storedUser = localStorage.getItem('grimaUser');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        if (!userData.isAdmin) await loadDataForUser(userData.id);
      }
      setIsLoading(false);
    }
    checkUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const foundUser = await db.getUser(email);
    const isPasswordCorrect = (foundUser?.isAdmin && password === 'Adminlogin444') || (!foundUser?.isAdmin && password === 'password123');
    if (foundUser && isPasswordCorrect) {
      setUser(foundUser);
      localStorage.setItem('grimaUser', JSON.stringify(foundUser));
      await transferTempAssessmentScore(foundUser.id);
      if (!foundUser.isAdmin) await loadDataForUser(foundUser.id);
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  };
  
  const register = async (userData: RegisterData): Promise<User | null> => {
    setIsLoading(true);
    try {
      const newUser = await db.createUser({ firstName: userData.firstName, lastName: userData.lastName, email: userData.email, phone: userData.phone, age: userData.age });
      setUser(newUser);
      localStorage.setItem('grimaUser', JSON.stringify(newUser));
      await transferTempAssessmentScore(newUser.id);
      await loadDataForUser(newUser.id);
      setIsLoading(false);
      return newUser;
    } catch (error) {
      console.error("Registration failed in context:", error);
      setIsLoading(false);
      return null;
    }
  };

  const updateUser = async (userId: string, data: Partial<User>): Promise<boolean> => {
      const updatedUser = await db.updateUser(userId, data);
      if (updatedUser && user?.id === userId) {
        setUser(updatedUser);
        localStorage.setItem('grimaUser', JSON.stringify(updatedUser));
        return true;
      }
      return false;
  };

  const logout = () => {
    setUser(null);
    setAppointments([]);
    setAssessmentScores([]);
    localStorage.removeItem('grimaUser');
  };

  const addAppointment = async (appointmentData: any) => {
    await db.createAppointment(appointmentData);
    if (user) await loadDataForUser(user.id);
  };
  
  const cancelAppointment = async (appointmentId: string) => {
    await db.updateAppointmentStatus(appointmentId, 'cancelled');
    if(user) await loadDataForUser(user.id);
  };

   const rescheduleAppointment = async (id: string, date: string, time: string): Promise<Appointment|null> => {
      const updated = await db.rescheduleAppointment(id, date, time);
      if (user) await loadDataForUser(user.id);
      return updated;
  };


  const addAssessmentScore = async (scoreData: any) => {
    await db.addAssessmentScore(scoreData);
    if (user) await loadDataForUser(user.id);
  };
  
  const addMessage = async (messageData: Omit<Message, 'id' | 'status' | 'created_at' | 'updated_at'|'replies'>) => {
    setIsLoading(true);
    await db.createMessage(messageData);
    setIsLoading(false);
  };

  const signConsent = async (userId: string): Promise<boolean> => {
    const updatedUser = await db.signConsent(userId);
    if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem('grimaUser', JSON.stringify(updatedUser));
        return true;
    }
    return false;
  };

  const grantAssessmentRetake = async (userId: string): Promise<void> => {
      await db.grantAssessmentRetake(userId);
  }
  
  // Admin functions
  const loadAllUsers = async () => db.getAllUsers();
  const addSessionNote = async (appointmentId: string, noteData: any, forClientId: string) => { await db.addSessionNote(appointmentId, noteData); };
  const admin_getAppointmentsForClient = (clientId: string) => db.getUserAppointments(clientId);
  const admin_getScoresForClient = (clientId: string) => db.getUserAssessmentScores(clientId);

  return (
    <AuthContext.Provider value={{ 
      user, login, register, updateUser, logout, isLoading, appointments, assessmentScores, loadDataForUser,
      addAppointment, cancelAppointment, addAssessmentScore, addMessage, signConsent, rescheduleAppointment, grantAssessmentRetake,
      loadAllUsers, addSessionNote,
      admin_getAppointmentsForClient, admin_getScoresForClient
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
