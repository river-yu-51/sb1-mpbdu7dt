// Database service for managing all data operations
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: number;
  joinDate: string;
  isAdmin: boolean;
  consentSigned: boolean;
  consentSignDate: string | null;
}

export interface Message {
  id:string; user_id:string|null; name:string; email:string; subject:string; message:string; status:'unread'|'read'|'replied'; created_at:string; updated_at:string; replies?:MessageReply[];
}

export interface MessageReply {
  id:string; message_id:string; sender_type:'admin'|'client'; sender_name:string; content:string; created_at:string;
}

export interface Appointment {
  id: string; user_id: string; service_type: string; date: string; time: string; status: 'scheduled' | 'completed' | 'cancelled'; notes: string | null; created_at: string; google_meet_link?: string; session_notes?: SessionNote[];
}

export interface SessionNote {
  id: string; appointment_id: string; title: string; content: string; file_url: string | null; file_name: string | null; created_at: string;
}

export interface AssessmentScore {
  id: string;
  user_id: string;
  type: 'stress' | 'literacy';
  score_breakdown: any; 
  user_answers: any;
  created_at: string;
}

// Represents dates where the admin has blocked off specific times
// e.g., { date: '2025-08-15', unavailableTimes: ['10:00 AM', '10:30 AM'] }
export interface Availability {
    date: string; // YYYY-MM-DD
    unavailableTimes: string[]; // e.g., "9:00 AM", "1:30 PM"
}

let users: User[] = [
  { id: 'admin', firstName: 'Jacob', lastName: 'Grima', email: 'grimafinancial@gmail.com', phone: '555-555-5555', age: 25, joinDate: '2025-01-01', isAdmin: true, consentSigned: true, consentSignDate: '2025-01-01' },
  { id: 'user1', firstName: 'Sarah', lastName: 'Connor', email: 'sarah@example.com', phone: '555-123-4567', age: 22, joinDate: '2025-02-15', isAdmin: false, consentSigned: false, consentSignDate: null }
];
let messages: Message[] = [];
let appointments: Appointment[] = [];
let assessmentScores: AssessmentScore[] = [];
let availability: Availability[] = []; // Admin's schedule


// Helper function to generate all possible time slots for the availability calendar
export const generateTimeSlots = (date: Date) => {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const startHour = isWeekend ? 10 : 9;
    const endHour = 19;
    
    const slots = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      const time12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      slots.push(`${time12}:00 ${ampm}`);
      if (hour < endHour) {
        slots.push(`${time12}:30 ${ampm}`);
      }
    }
    return slots;
};


// Database operations
export const db = {
  // User operations
  async getUser(email: string): Promise<User | null> { return users.find(u => u.email === email) || null; },
  async createUser(userData: Omit<User, 'id'|'joinDate'|'isAdmin'|'consentSigned'|'consentSignDate'>): Promise<User> {
    if (users.some(u => u.email === userData.email)) throw new Error("User with this email already exists.");
    const newUser: User = { ...userData, id: Date.now().toString(), joinDate: new Date().toISOString().split('T')[0], isAdmin: false, consentSigned: false, consentSignDate: null };
    users.push(newUser);
    return newUser;
  },
  async updateUser(userId: string, updateData: Partial<User>): Promise<User | null> {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updateData };
      return users[userIndex];
    }
    return null;
  },
  async signConsent(userId: string): Promise<User | null> {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex > -1) {
      users[userIndex].consentSigned = true;
      users[userIndex].consentSignDate = new Date().toISOString();
      return users[userIndex];
    }
    return null;
  },
  async getAllUsers(): Promise<User[]> { return users.filter(u => !u.isAdmin); },

  // Message operations
  async createMessage(messageData: Omit<Message, 'id' | 'status' | 'created_at' | 'updated_at' | 'replies'>): Promise<Message> {
    const newMessage: Message = { ...messageData, id: Date.now().toString(), status: 'unread', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    messages.push(newMessage);
    return newMessage;
  },

  // Appointment operations
  async getUserAppointments(userId: string): Promise<Appointment[]> { return appointments.filter(a => a.user_id === userId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); },
   async getAppointmentById(id: string): Promise<Appointment | null> {
    return appointments.find(a => a.id === id) || null;
  },
  async createAppointment(appointmentData: Omit<Appointment, 'id'|'created_at'|'status'|'session_notes'|'google_meet_link'>): Promise<Appointment> {
    const newAppointment: Appointment = { ...appointmentData, id: Date.now().toString(), status: 'scheduled', created_at: new Date().toISOString(), google_meet_link: `https://meet.google.com/lookup/demo${Date.now()}`};
    appointments.push(newAppointment);
    return newAppointment;
  },
  async updateAppointmentStatus(appointmentId: string, status: 'scheduled' | 'completed' | 'cancelled'): Promise<void> {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment) appointment.status = status;
  },
   async rescheduleAppointment(id: string, date: string, time: string): Promise<Appointment|null> {
      const appointment = appointments.find(a => a.id === id);
      if (appointment) {
          appointment.date = date;
          appointment.time = time;
      }
      return appointment || null;
  },
  async addSessionNote(appointmentId: string, noteData: Omit<SessionNote, 'id' | 'created_at'>): Promise<void> {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment) {
      const newNote: SessionNote = { ...noteData, id: Date.now().toString(), created_at: new Date().toISOString() };
      if (!appointment.session_notes) appointment.session_notes = [];
      appointment.session_notes.push(newNote);
    }
  },

  // Assessment Score ops
  async getUserAssessmentScores(userId: string): Promise<AssessmentScore[]> { return assessmentScores.filter(s => s.user_id === userId).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); },
  async addAssessmentScore(scoreData: Omit<AssessmentScore, 'id' | 'created_at'>): Promise<AssessmentScore> {
    const newScore: AssessmentScore = { ...scoreData, id: Date.now().toString(), created_at: new Date().toISOString() };
    assessmentScores.push(newScore);
    return newScore;
  },
   async grantAssessmentRetake(userId: string): Promise<void> {
     const placeholderAppointment: Appointment = {
       id: `retake-${Date.now()}`,
       user_id: userId,
       service_type: "Admin-Granted Assessment Retake",
       date: new Date().toISOString().split('T')[0],
       time: 'N/A',
       status: 'completed',
       notes: "This placeholder allows the user to retake an assessment.",
       created_at: new Date().toISOString()
     };
     appointments.push(placeholderAppointment);
  },
  
  // Availability operations
  async getAvailabilityForDate(date: string): Promise<string[]> {
      const dayAvailability = availability.find(a => a.date === date);
      const scheduledAppointments = appointments
          .filter(a => a.date === date && a.status === 'scheduled')
          .map(a => a.time);
      
      const unavailable = new Set([...(dayAvailability?.unavailableTimes || []), ...scheduledAppointments]);
      return Array.from(unavailable);
  },
  
  async updateAvailability(date: string, time: string, isUnavailable: boolean): Promise<void> {
    let dayAvailability = availability.find(a => a.date === date);
    
    if (!dayAvailability) {
      dayAvailability = { date, unavailableTimes: [] };
      availability.push(dayAvailability);
    }

    const timeIndex = dayAvailability.unavailableTimes.indexOf(time);

    if (isUnavailable && timeIndex === -1) {
      dayAvailability.unavailableTimes.push(time);
    } else if (!isUnavailable && timeIndex > -1) {
      dayAvailability.unavailableTimes.splice(timeIndex, 1);
    }
  }
};