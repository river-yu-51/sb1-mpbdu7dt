import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          age: number;
          created_at: string;
          is_admin: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          first_name: string;
          last_name: string;
          age: number;
          created_at?: string;
          is_admin?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          age?: number;
          created_at?: string;
          is_admin?: boolean;
        };
      };
      messages: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string;
          subject: string;
          message: string;
          status: 'unread' | 'read' | 'replied';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          email: string;
          subject: string;
          message: string;
          status?: 'unread' | 'read' | 'replied';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          email?: string;
          subject?: string;
          message?: string;
          status?: 'unread' | 'read' | 'replied';
          created_at?: string;
          updated_at?: string;
        };
      };
      message_replies: {
        Row: {
          id: string;
          message_id: string;
          sender_type: 'admin' | 'client';
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          sender_type: 'admin' | 'client';
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          sender_type?: 'admin' | 'client';
          content?: string;
          created_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          user_id: string;
          service_type: string;
          date: string;
          time: string;
          status: 'scheduled' | 'completed' | 'cancelled';
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          service_type: string;
          date: string;
          time: string;
          status?: 'scheduled' | 'completed' | 'cancelled';
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          service_type?: string;
          date?: string;
          time?: string;
          status?: 'scheduled' | 'completed' | 'cancelled';
          notes?: string | null;
          created_at?: string;
        };
      };
      session_notes: {
        Row: {
          id: string;
          appointment_id: string;
          title: string;
          content: string;
          file_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          title: string;
          content: string;
          file_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          title?: string;
          content?: string;
          file_url?: string | null;
          created_at?: string;
        };
      };
    };
  };
};