/*
# Estrobic Capital - Initial Schema Migration

1. New Tables
- `profiles` — extends auth.users with role, status, and contact info
- `startups` — company details for startup accounts
- `startup_documents` — KYC/verification documents uploaded by startups
- `funding_requests` — funding applications submitted by startups
- `clarification_requests` — admin requests for additional info from startups
- `investors` — profile details for investor accounts
- `investor_interest` — expressions of interest from investors in deals
- `deal_rooms` — private collaboration spaces between startups and investors
- `notifications` — in-app notifications for all users
- `audit_logs` — immutable audit trail for all admin actions
- `invitations` — investor invite tokens with expiration

2. Security
- RLS enabled on ALL tables
- Policies scoped by role: startups, investors, admins
- Cross-role visibility strictly controlled
- Admin-only access for sensitive operations

3. Important Notes
- Email confirmation is disabled for the auth system
- The `profiles` table is linked to `auth.users` via `id`
- `role` enum supports: startup, investor, super_admin, reviewer
- `status` enum supports: pending, approved, rejected, suspended
- All admin mutations create audit_logs entries
- Document storage uses Supabase Storage with signed URLs
*/

-- Role and status enums (idempotent)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('startup', 'investor', 'super_admin', 'reviewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE funding_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'live', 'funded', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE doc_type AS ENUM ('pitch_deck', 'financial_statements', 'incorporation', 'kyc_document', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE interest_status AS ENUM ('expressed', 'reviewing', 'approved', 'rejected', 'converted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE room_status AS ENUM ('active', 'closed', 'on_hold');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('status_change', 'clarification', 'interest', 'deal_room', 'system', 'funding_update');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 1. PROFILES: extends auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role user_role NOT NULL DEFAULT 'startup',
  status user_status NOT NULL DEFAULT 'pending',
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

DROP POLICY IF EXISTS "profiles_insert_on_signup" ON profiles;
CREATE POLICY "profiles_insert_on_signup" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

-- 2. STARTUPS: company details
CREATE TABLE IF NOT EXISTS startups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  description text,
  industry text,
  stage text,
  founded_year integer,
  website text,
  linkedin_url text,
  valuation numeric(15,2),
  revenue_last_year numeric(15,2),
  funding_raised_to_date numeric(15,2),
  team_size integer,
  headquarters text,
  pitch_deck_url text,
  status user_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE startups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "startups_select_own" ON startups;
CREATE POLICY "startups_select_own" ON startups FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "startups_select_admin" ON startups;
CREATE POLICY "startups_select_admin" ON startups FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

DROP POLICY IF EXISTS "startups_select_anonymized" ON startups;
CREATE POLICY "startups_select_anonymized" ON startups FOR SELECT
  TO authenticated USING (status = 'approved' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'investor' AND p.status = 'approved'));

DROP POLICY IF EXISTS "startups_insert_own" ON startups;
CREATE POLICY "startups_insert_own" ON startups FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "startups_update_own" ON startups;
CREATE POLICY "startups_update_own" ON startups FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "startups_update_admin" ON startups;
CREATE POLICY "startups_update_admin" ON startups FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

-- 3. STARTUP_DOCUMENTS: KYC/verification docs
CREATE TABLE IF NOT EXISTS startup_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  doc_type doc_type NOT NULL DEFAULT 'other',
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  mime_type text,
  status user_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  uploaded_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE startup_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "startup_docs_select_own" ON startup_documents;
CREATE POLICY "startup_docs_select_own" ON startup_documents FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));

DROP POLICY IF EXISTS "startup_docs_select_admin" ON startup_documents;
CREATE POLICY "startup_docs_select_admin" ON startup_documents FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

DROP POLICY IF EXISTS "startup_docs_insert_own" ON startup_documents;
CREATE POLICY "startup_docs_insert_own" ON startup_documents FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));

DROP POLICY IF EXISTS "startup_docs_delete_own" ON startup_documents;
CREATE POLICY "startup_docs_delete_own" ON startup_documents FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));

DROP POLICY IF EXISTS "startup_docs_update_admin" ON startup_documents;
CREATE POLICY "startup_docs_update_admin" ON startup_documents FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

-- 4. FUNDING_REQUESTS
CREATE TABLE IF NOT EXISTS funding_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  amount_requested numeric(15,2) NOT NULL,
  amount_approved numeric(15,2),
  equity_offered numeric(5,2),
  use_of_funds text,
  status funding_status NOT NULL DEFAULT 'draft',
  admin_notes text,
  submitted_at timestamptz,
  approved_at timestamptz,
  live_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE funding_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "funding_select_own" ON funding_requests;
CREATE POLICY "funding_select_own" ON funding_requests FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));

DROP POLICY IF EXISTS "funding_select_admin" ON funding_requests;
CREATE POLICY "funding_select_admin" ON funding_requests FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

DROP POLICY IF EXISTS "funding_select_live" ON funding_requests;
CREATE POLICY "funding_select_live" ON funding_requests FOR SELECT
  TO authenticated USING (status = 'live' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'investor' AND p.status = 'approved'));

DROP POLICY IF EXISTS "funding_insert_own" ON funding_requests;
CREATE POLICY "funding_insert_own" ON funding_requests FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));

DROP POLICY IF EXISTS "funding_update_own" ON funding_requests;
CREATE POLICY "funding_update_own" ON funding_requests FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM startups s WHERE s.id = startup_id AND s.user_id = auth.uid()) AND status IN ('draft', 'submitted')) WITH CHECK (EXISTS (SELECT 1 FROM startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));

DROP POLICY IF EXISTS "funding_update_admin" ON funding_requests;
CREATE POLICY "funding_update_admin" ON funding_requests FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

-- 5. CLARIFICATION_REQUESTS
CREATE TABLE IF NOT EXISTS clarification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question text NOT NULL,
  response text,
  status user_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  responded_at timestamptz
);

ALTER TABLE clarification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clarification_select_startup" ON clarification_requests;
CREATE POLICY "clarification_select_startup" ON clarification_requests FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));

DROP POLICY IF EXISTS "clarification_select_admin" ON clarification_requests;
CREATE POLICY "clarification_select_admin" ON clarification_requests FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

DROP POLICY IF EXISTS "clarification_insert_admin" ON clarification_requests;
CREATE POLICY "clarification_insert_admin" ON clarification_requests FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

DROP POLICY IF EXISTS "clarification_update_startup" ON clarification_requests;
CREATE POLICY "clarification_update_startup" ON clarification_requests FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM startups s WHERE s.id = startup_id AND s.user_id = auth.uid()) AND status = 'pending') WITH CHECK (EXISTS (SELECT 1 FROM startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));

-- 6. INVESTORS
CREATE TABLE IF NOT EXISTS investors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  firm_name text NOT NULL,
  aum numeric(15,2),
  investment_focus text[],
  preferred_stage text,
  preferred_ticket_min numeric(15,2),
  preferred_ticket_max numeric(15,2),
  website text,
  linkedin_url text,
  status user_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE investors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "investors_select_own" ON investors;
CREATE POLICY "investors_select_own" ON investors FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "investors_select_admin" ON investors;
CREATE POLICY "investors_select_admin" ON investors FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

DROP POLICY IF EXISTS "investors_insert_own" ON investors;
CREATE POLICY "investors_insert_own" ON investors FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "investors_update_own" ON investors;
CREATE POLICY "investors_update_own" ON investors FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "investors_update_admin" ON investors;
CREATE POLICY "investors_update_admin" ON investors FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

-- 7. INVESTOR_INTEREST
CREATE TABLE IF NOT EXISTS investor_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  funding_request_id uuid NOT NULL REFERENCES funding_requests(id) ON DELETE CASCADE,
  proposed_amount numeric(15,2),
  proposed_terms text,
  notes text,
  status interest_status NOT NULL DEFAULT 'expressed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE investor_interest ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "interest_select_own" ON investor_interest;
CREATE POLICY "interest_select_own" ON investor_interest FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM investors i WHERE i.id = investor_id AND i.user_id = auth.uid()));

DROP POLICY IF EXISTS "interest_select_admin" ON investor_interest;
CREATE POLICY "interest_select_admin" ON investor_interest FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

DROP POLICY IF EXISTS "interest_select_startup" ON investor_interest;
CREATE POLICY "interest_select_startup" ON investor_interest FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM funding_requests fr JOIN startups s ON s.id = fr.startup_id WHERE fr.id = funding_request_id AND s.user_id = auth.uid()));

DROP POLICY IF EXISTS "interest_insert_own" ON investor_interest;
CREATE POLICY "interest_insert_own" ON investor_interest FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM investors i WHERE i.id = investor_id AND i.user_id = auth.uid()));

DROP POLICY IF EXISTS "interest_update_own" ON investor_interest;
CREATE POLICY "interest_update_own" ON investor_interest FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM investors i WHERE i.id = investor_id AND i.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM investors i WHERE i.id = investor_id AND i.user_id = auth.uid()));

DROP POLICY IF EXISTS "interest_update_admin" ON investor_interest;
CREATE POLICY "interest_update_admin" ON investor_interest FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

-- 8. DEAL_ROOMS
CREATE TABLE IF NOT EXISTS deal_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  funding_request_id uuid NOT NULL REFERENCES funding_requests(id) ON DELETE CASCADE,
  startup_id uuid NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  investor_id uuid NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  status room_status NOT NULL DEFAULT 'active',
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE deal_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deal_rooms_select_participant" ON deal_rooms;
CREATE POLICY "deal_rooms_select_participant" ON deal_rooms FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM startups s WHERE s.id = startup_id AND s.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM investors i WHERE i.id = investor_id AND i.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer'))
  );

DROP POLICY IF EXISTS "deal_rooms_insert_admin" ON deal_rooms;
CREATE POLICY "deal_rooms_insert_admin" ON deal_rooms FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

DROP POLICY IF EXISTS "deal_rooms_update_admin" ON deal_rooms;
CREATE POLICY "deal_rooms_update_admin" ON deal_rooms FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

DROP POLICY IF EXISTS "deal_rooms_update_participant" ON deal_rooms;
CREATE POLICY "deal_rooms_update_participant" ON deal_rooms FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM startups s WHERE s.id = startup_id AND s.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM investors i WHERE i.id = investor_id AND i.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM startups s WHERE s.id = startup_id AND s.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM investors i WHERE i.id = investor_id AND i.user_id = auth.uid())
  );

-- 9. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL DEFAULT 'system',
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_admin" ON notifications;
CREATE POLICY "notifications_insert_admin" ON notifications FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

DROP POLICY IF EXISTS "notifications_insert_system" ON notifications;
CREATE POLICY "notifications_insert_system" ON notifications FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 10. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_select_admin" ON audit_logs;
CREATE POLICY "audit_select_admin" ON audit_logs FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

DROP POLICY IF EXISTS "audit_insert_admin" ON audit_logs;
CREATE POLICY "audit_insert_admin" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

-- 11. INVITATIONS
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  email text NOT NULL,
  firm_name text,
  investment_focus text[],
  status user_status NOT NULL DEFAULT 'pending',
  invited_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  used_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invitations_select_admin" ON invitations;
CREATE POLICY "invitations_select_admin" ON invitations FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

DROP POLICY IF EXISTS "invitations_select_own" ON invitations;
CREATE POLICY "invitations_select_own" ON invitations FOR SELECT
  TO authenticated USING (invited_by = auth.uid());

DROP POLICY IF EXISTS "invitations_insert_admin" ON invitations;
CREATE POLICY "invitations_insert_admin" ON invitations FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

DROP POLICY IF EXISTS "invitations_update_admin" ON invitations;
CREATE POLICY "invitations_update_admin" ON invitations FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer')));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_startups_user_id ON startups(user_id);
CREATE INDEX IF NOT EXISTS idx_startups_status ON startups(status);
CREATE INDEX IF NOT EXISTS idx_startup_documents_startup_id ON startup_documents(startup_id);
CREATE INDEX IF NOT EXISTS idx_funding_requests_startup_id ON funding_requests(startup_id);
CREATE INDEX IF NOT EXISTS idx_funding_requests_status ON funding_requests(status);
CREATE INDEX IF NOT EXISTS idx_clarification_requests_startup_id ON clarification_requests(startup_id);
CREATE INDEX IF NOT EXISTS idx_investors_user_id ON investors(user_id);
CREATE INDEX IF NOT EXISTS idx_investors_status ON investors(status);
CREATE INDEX IF NOT EXISTS idx_investor_interest_investor_id ON investor_interest(investor_id);
CREATE INDEX IF NOT EXISTS idx_investor_interest_funding_request_id ON investor_interest(funding_request_id);
CREATE INDEX IF NOT EXISTS idx_deal_rooms_funding_request_id ON deal_rooms(funding_request_id);
CREATE INDEX IF NOT EXISTS idx_deal_rooms_startup_id ON deal_rooms(startup_id);
CREATE INDEX IF NOT EXISTS idx_deal_rooms_investor_id ON deal_rooms(investor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
