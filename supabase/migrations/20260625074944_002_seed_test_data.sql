/*
# Seed Test Data for Estrobic Capital

1. Create test users in auth.users
2. Create matching profiles with roles
3. Create sample startups, investors, funding requests
4. Create sample audit log entries
5. Create sample notifications
6. Create sample invitations

Test credentials:
- Admin: admin@estrobic.com / AdminPass123!
- Startup: founder@company.com / StartupPass123!
*/

-- Insert test users into auth.users
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'admin@estrobic.com', '{"role": "super_admin", "full_name": "System Administrator"}'::jsonb, now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'reviewer@estrobic.com', '{"role": "reviewer", "full_name": "Lead Reviewer"}'::jsonb, now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'founder@company.com', '{"role": "startup", "full_name": "Jane Founder"}'::jsonb, now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'founder2@tech.io', '{"role": "startup", "full_name": "John Tech"}'::jsonb, now(), now()),
  ('55555555-5555-5555-5555-555555555555', 'investor@fund.com', '{"role": "investor", "full_name": "Sarah Capital"}'::jsonb, now(), now())
ON CONFLICT (id) DO UPDATE SET 
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

-- Insert identities for auth
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'admin@estrobic.com', 'email', '{"sub": "11111111-1111-1111-1111-111111111111", "email": "admin@estrobic.com"}'::jsonb, now(), now()),
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'reviewer@estrobic.com', 'email', '{"sub": "22222222-2222-2222-2222-222222222222", "email": "reviewer@estrobic.com"}'::jsonb, now(), now()),
  ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'founder@company.com', 'email', '{"sub": "33333333-3333-3333-3333-333333333333", "email": "founder@company.com"}'::jsonb, now(), now()),
  ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'founder2@tech.io', 'email', '{"sub": "44444444-4444-4444-4444-444444444444", "email": "founder2@tech.io"}'::jsonb, now(), now()),
  ('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'investor@fund.com', 'email', '{"sub": "55555555-5555-5555-5555-555555555555", "email": "investor@fund.com"}'::jsonb, now(), now())
ON CONFLICT (id) DO UPDATE SET identity_data = EXCLUDED.identity_data;

-- Insert profiles
INSERT INTO profiles (id, email, full_name, role, status, phone, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'admin@estrobic.com', 'System Administrator', 'super_admin', 'approved', '+1-555-0001', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'reviewer@estrobic.com', 'Lead Reviewer', 'reviewer', 'approved', '+1-555-0002', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'founder@company.com', 'Jane Founder', 'startup', 'approved', '+1-555-0003', now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'founder2@tech.io', 'John Tech', 'startup', 'pending', '+1-555-0004', now(), now()),
  ('55555555-5555-5555-5555-555555555555', 'investor@fund.com', 'Sarah Capital', 'investor', 'approved', '+1-555-0005', now(), now())
ON CONFLICT (id) DO UPDATE SET 
  full_name = EXCLUDED.full_name, 
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = now();

-- Insert startups
INSERT INTO startups (id, user_id, company_name, description, industry, stage, founded_year, website, valuation, revenue_last_year, funding_raised_to_date, team_size, headquarters, status, created_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'TechFlow AI', 'Enterprise AI automation platform for financial services. Reducing operational costs by 40% through intelligent workflow automation.', 'Fintech', 'Series A', 2021, 'https://techflow.ai', 25000000, 3200000, 8000000, 28, 'San Francisco, CA', 'approved', now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'GreenScale Energy', 'Next-generation battery technology for grid-scale energy storage. Patented solid-state electrolyte design.', 'CleanTech', 'Seed', 2022, 'https://greenscale.io', 8000000, 450000, 2000000, 12, 'Austin, TX', 'pending', now())
ON CONFLICT (id) DO NOTHING;

-- Insert investors
INSERT INTO investors (id, user_id, firm_name, aum, investment_focus, preferred_stage, preferred_ticket_min, preferred_ticket_max, website, status, created_at)
VALUES 
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555', 'Horizon Ventures', 500000000, ARRAY['Fintech', 'AI/ML', 'SaaS'], 'Series A', 1000000, 10000000, 'https://horizonvc.com', 'approved', now())
ON CONFLICT (id) DO NOTHING;

-- Insert funding requests
INSERT INTO funding_requests (id, startup_id, title, description, amount_requested, equity_offered, use_of_funds, status, submitted_at, created_at)
VALUES 
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Series A - Product Expansion', 'Expand enterprise sales team and AI model training infrastructure. Target 100 enterprise clients by Q4.', 15000000, 18.75, 'Sales & Marketing (40%), R&D (35%), Operations (25%)', 'live', now(), now()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Seed Round - Pilot Scale Manufacturing', 'Establish first pilot manufacturing line for solid-state battery cells. Target 1MWh annual capacity.', 5000000, 25.00, 'Manufacturing (60%), R&D (25%), Working Capital (15%)', 'submitted', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert sample investor interest
INSERT INTO investor_interest (id, investor_id, funding_request_id, proposed_amount, proposed_terms, notes, status, created_at)
VALUES 
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 5000000, 'Series A preferred, 1x liquidation, pro-rata rights', 'Strong team, clear product-market fit. Need to review financials more closely.', 'reviewing', now())
ON CONFLICT (id) DO NOTHING;

-- Insert sample deal room
INSERT INTO deal_rooms (id, name, funding_request_id, startup_id, investor_id, status, created_by, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111112', 'TechFlow AI - Series A Discussion', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'active', '11111111-1111-1111-1111-111111111111', now())
ON CONFLICT (id) DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (id, user_id, type, title, message, read, created_at)
VALUES 
  ('22222222-2222-2222-2222-222222222223', '33333333-3333-3333-3333-333333333333', 'status_change', 'Company Profile Approved', 'Your startup profile has been approved by the review team. You can now submit funding requests.', true, now()),
  ('22222222-2222-2222-2222-222222222224', '33333333-3333-3333-3333-333333333333', 'funding_update', 'Funding Request Live', 'Your Series A request is now live for investors to review.', false, now()),
  ('22222222-2222-2222-2222-222222222225', '55555555-5555-5555-5555-555555555555', 'deal_room', 'New Deal Room', 'A deal room has been created for TechFlow AI - Series A.', false, now())
ON CONFLICT (id) DO NOTHING;

-- Insert sample audit logs
INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
VALUES 
  ('33333333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-111111111111', 'startup_approved', 'startups', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"previous_status": "pending", "new_status": "approved"}'::jsonb, now()),
  ('33333333-3333-3333-3333-333333333335', '11111111-1111-1111-1111-111111111111', 'funding_live', 'funding_requests', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '{"previous_status": "approved", "new_status": "live"}'::jsonb, now()),
  ('33333333-3333-3333-3333-333333333336', '11111111-1111-1111-1111-111111111111', 'deal_room_created', 'deal_rooms', '11111111-1111-1111-1111-111111111112', '{"investor_id": "cccccccc-cccc-cccc-cccc-cccccccccccc"}'::jsonb, now())
ON CONFLICT (id) DO NOTHING;

-- Insert sample invitation
INSERT INTO invitations (id, token, email, firm_name, investment_focus, status, invited_by, expires_at, created_at)
VALUES 
  ('44444444-4444-4444-4444-444444444445', 'invite-token-12345-abcde', 'newinvestor@fund.com', 'Apex Capital Partners', ARRAY['Fintech', 'CleanTech'], 'pending', '11111111-1111-1111-1111-111111111111', now() + interval '30 days', now())
ON CONFLICT (id) DO NOTHING;
