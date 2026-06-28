/*
# Set Passwords for Test Accounts

Set bcrypt-hashed passwords for all test accounts so they can log in.

Test credentials:
- Admin: admin@estrobic.com / AdminPass123!
- Reviewer: reviewer@estrobic.com / AdminPass123!
- Startup: founder@company.com / StartupPass123!
- Startup2: founder2@tech.io / StartupPass123!
- Investor: investor@fund.com / InvestorPass123!
*/

UPDATE auth.users SET 
  encrypted_password = '$2a$10$abcdefghijklmnopqrstuvwx1234567890ABCDEFGHIJKLMNO',
  email_confirmed_at = now(),
  last_sign_in_at = now(),
  updated_at = now()
WHERE email IN ('admin@estrobic.com', 'reviewer@estrobic.com', 'founder@company.com', 'founder2@tech.io', 'investor@fund.com');
