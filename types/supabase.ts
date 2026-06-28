export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "startup" | "investor" | "super_admin" | "reviewer";
          status: "pending" | "approved" | "rejected" | "suspended";
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: "startup" | "investor" | "super_admin" | "reviewer";
          status?: "pending" | "approved" | "rejected" | "suspended";
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: "startup" | "investor" | "super_admin" | "reviewer";
          status?: "pending" | "approved" | "rejected" | "suspended";
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      startups: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          description: string | null;
          industry: string | null;
          stage: string | null;
          founded_year: number | null;
          website: string | null;
          linkedin_url: string | null;
          valuation: number | null;
          revenue_last_year: number | null;
          funding_raised_to_date: number | null;
          team_size: number | null;
          headquarters: string | null;
          pitch_deck_url: string | null;
          status: "pending" | "approved" | "rejected" | "suspended";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          description?: string | null;
          industry?: string | null;
          stage?: string | null;
          founded_year?: number | null;
          website?: string | null;
          linkedin_url?: string | null;
          valuation?: number | null;
          revenue_last_year?: number | null;
          funding_raised_to_date?: number | null;
          team_size?: number | null;
          headquarters?: string | null;
          pitch_deck_url?: string | null;
          status?: "pending" | "approved" | "rejected" | "suspended";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string;
          description?: string | null;
          industry?: string | null;
          stage?: string | null;
          founded_year?: number | null;
          website?: string | null;
          linkedin_url?: string | null;
          valuation?: number | null;
          revenue_last_year?: number | null;
          funding_raised_to_date?: number | null;
          team_size?: number | null;
          headquarters?: string | null;
          pitch_deck_url?: string | null;
          status?: "pending" | "approved" | "rejected" | "suspended";
          created_at?: string;
          updated_at?: string;
        };
      };
      startup_documents: {
        Row: {
          id: string;
          startup_id: string;
          doc_type: "pitch_deck" | "financial_statements" | "incorporation" | "kyc_document" | "other";
          file_name: string;
          file_path: string;
          file_size: number | null;
          mime_type: string | null;
          status: "pending" | "approved" | "rejected" | "suspended";
          admin_notes: string | null;
          uploaded_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          startup_id: string;
          doc_type?: "pitch_deck" | "financial_statements" | "incorporation" | "kyc_document" | "other";
          file_name: string;
          file_path: string;
          file_size?: number | null;
          mime_type?: string | null;
          status?: "pending" | "approved" | "rejected" | "suspended";
          admin_notes?: string | null;
          uploaded_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          startup_id?: string;
          doc_type?: "pitch_deck" | "financial_statements" | "incorporation" | "kyc_document" | "other";
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          mime_type?: string | null;
          status?: "pending" | "approved" | "rejected" | "suspended";
          admin_notes?: string | null;
          uploaded_at?: string;
          reviewed_at?: string | null;
        };
      };
      funding_requests: {
        Row: {
          id: string;
          startup_id: string;
          title: string;
          description: string | null;
          amount_requested: number;
          amount_approved: number | null;
          equity_offered: number | null;
          use_of_funds: string | null;
          status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "live" | "funded" | "closed";
          admin_notes: string | null;
          submitted_at: string | null;
          approved_at: string | null;
          live_at: string | null;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          startup_id: string;
          title: string;
          description?: string | null;
          amount_requested: number;
          amount_approved?: number | null;
          equity_offered?: number | null;
          use_of_funds?: string | null;
          status?: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "live" | "funded" | "closed";
          admin_notes?: string | null;
          submitted_at?: string | null;
          approved_at?: string | null;
          live_at?: string | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          startup_id?: string;
          title?: string;
          description?: string | null;
          amount_requested?: number;
          amount_approved?: number | null;
          equity_offered?: number | null;
          use_of_funds?: string | null;
          status?: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "live" | "funded" | "closed";
          admin_notes?: string | null;
          submitted_at?: string | null;
          approved_at?: string | null;
          live_at?: string | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      clarification_requests: {
        Row: {
          id: string;
          startup_id: string;
          requested_by: string;
          question: string;
          response: string | null;
          status: "pending" | "approved" | "rejected" | "suspended";
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          startup_id: string;
          requested_by: string;
          question: string;
          response?: string | null;
          status?: "pending" | "approved" | "rejected" | "suspended";
          created_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          startup_id?: string;
          requested_by?: string;
          question?: string;
          response?: string | null;
          status?: "pending" | "approved" | "rejected" | "suspended";
          created_at?: string;
          responded_at?: string | null;
        };
      };
      investors: {
        Row: {
          id: string;
          user_id: string;
          firm_name: string;
          aum: number | null;
          investment_focus: string[] | null;
          preferred_stage: string | null;
          preferred_ticket_min: number | null;
          preferred_ticket_max: number | null;
          website: string | null;
          linkedin_url: string | null;
          status: "pending" | "approved" | "rejected" | "suspended";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          firm_name: string;
          aum?: number | null;
          investment_focus?: string[] | null;
          preferred_stage?: string | null;
          preferred_ticket_min?: number | null;
          preferred_ticket_max?: number | null;
          website?: string | null;
          linkedin_url?: string | null;
          status?: "pending" | "approved" | "rejected" | "suspended";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          firm_name?: string;
          aum?: number | null;
          investment_focus?: string[] | null;
          preferred_stage?: string | null;
          preferred_ticket_min?: number | null;
          preferred_ticket_max?: number | null;
          website?: string | null;
          linkedin_url?: string | null;
          status?: "pending" | "approved" | "rejected" | "suspended";
          created_at?: string;
          updated_at?: string;
        };
      };
      investor_interest: {
        Row: {
          id: string;
          investor_id: string;
          funding_request_id: string;
          proposed_amount: number | null;
          proposed_terms: string | null;
          notes: string | null;
          status: "expressed" | "reviewing" | "approved" | "rejected" | "converted";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          investor_id: string;
          funding_request_id: string;
          proposed_amount?: number | null;
          proposed_terms?: string | null;
          notes?: string | null;
          status?: "expressed" | "reviewing" | "approved" | "rejected" | "converted";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          investor_id?: string;
          funding_request_id?: string;
          proposed_amount?: number | null;
          proposed_terms?: string | null;
          notes?: string | null;
          status?: "expressed" | "reviewing" | "approved" | "rejected" | "converted";
          created_at?: string;
          updated_at?: string;
        };
      };
      deal_rooms: {
        Row: {
          id: string;
          name: string;
          funding_request_id: string;
          startup_id: string;
          investor_id: string;
          status: "active" | "closed" | "on_hold";
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          funding_request_id: string;
          startup_id: string;
          investor_id: string;
          status?: "active" | "closed" | "on_hold";
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          funding_request_id?: string;
          startup_id?: string;
          investor_id?: string;
          status?: "active" | "closed" | "on_hold";
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "status_change" | "clarification" | "interest" | "deal_room" | "system" | "funding_update";
          title: string;
          message: string;
          link: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type?: "status_change" | "clarification" | "interest" | "deal_room" | "system" | "funding_update";
          title: string;
          message: string;
          link?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "status_change" | "clarification" | "interest" | "deal_room" | "system" | "funding_update";
          title?: string;
          message?: string;
          link?: string | null;
          read?: boolean;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          details: Record<string, unknown> | null | any;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          details?: Record<string, unknown> | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          details?: Record<string, unknown> | null;
          ip_address?: string | null;
          created_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          token: string;
          email: string;
          firm_name: string | null;
          investment_focus: string[] | null;
          status: "pending" | "approved" | "rejected" | "suspended";
          invited_by: string;
          expires_at: string;
          used_at: string | null;
          used_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          token: string;
          email: string;
          firm_name?: string | null;
          investment_focus?: string[] | null;
          status?: "pending" | "approved" | "rejected" | "suspended";
          invited_by: string;
          expires_at: string;
          used_at?: string | null;
          used_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          token?: string;
          email?: string;
          firm_name?: string | null;
          investment_focus?: string[] | null;
          status?: "pending" | "approved" | "rejected" | "suspended";
          invited_by?: string;
          expires_at?: string;
          used_at?: string | null;
          used_by?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: "startup" | "investor" | "super_admin" | "reviewer";
      user_status: "pending" | "approved" | "rejected" | "suspended";
      funding_status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "live" | "funded" | "closed";
      doc_type: "pitch_deck" | "financial_statements" | "incorporation" | "kyc_document" | "other";
      interest_status: "expressed" | "reviewing" | "approved" | "rejected" | "converted";
      room_status: "active" | "closed" | "on_hold";
      notification_type: "status_change" | "clarification" | "interest" | "deal_room" | "system" | "funding_update";
    };
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Startup = Database["public"]["Tables"]["startups"]["Row"];
export type StartupDocument = Database["public"]["Tables"]["startup_documents"]["Row"];
export type FundingRequest = Database["public"]["Tables"]["funding_requests"]["Row"];
export type ClarificationRequest = Database["public"]["Tables"]["clarification_requests"]["Row"];
export type Investor = Database["public"]["Tables"]["investors"]["Row"];
export type InvestorInterest = Database["public"]["Tables"]["investor_interest"]["Row"];
export type DealRoom = Database["public"]["Tables"]["deal_rooms"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type Invitation = Database["public"]["Tables"]["invitations"]["Row"];
