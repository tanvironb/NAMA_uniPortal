# PATCH NOTES

## 2025-01-18 - Auth & Wizard Filtering Fixes

### Fixed
- Created `register-user` edge function for server-side registration with confirmed emails
- Fixed registration wizard to query `universities` table instead of non-existent `universities_normalized`
- Implemented strict tri-condition filtering: Level → Country → Field → Universities
- Added step validation to prevent navigation without required fields
- Enhanced gender UI with segmented pill boxes (Male/Female only)
- Fixed admin seeding script with proper profile creation
- Added ranking badges to university listings
- Disabled email confirmation for all signups (dev mode)

### Technical Details
- Edge function `register-user` creates confirmed users server-side using service role
- University filtering uses exact same-row matching from single `universities` table
- Step gating prevents progression until current step is valid
- Registration calls edge function then signs in user automatically
- Admin login checks `profiles.role = 'admin'` for proper routing