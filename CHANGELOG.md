# Gritto — Version Log

## v1.4.0 — Role-aware video feedback
- Added Step 3 to the video flow: "Who are you in this play?" — a role picker specific to each sport (e.g. Hitter/Pitcher for baseball, Shooter/Defender for basketball)
- The AI is now instructed to only analyze the person in the selected role, ignoring teammates/opponents/other players visible in the frames
- Role options reset when a new video is picked or a different sport is chosen
- "Analyze my form" stays disabled until a role is selected

## v1.3.0 — Beta whitelist + admin panel
- Added `admin.html` — password-protected page to add/remove approved beta users
- Added `api/check-access.js` — checks a signed-in Google email against the approved list
- Added `api/admin-users.js` — backend for the admin panel (list/add/remove users)
- Added `database/setup_allowed_users.sql` — creates the locked-down `allowed_users` table
- Updated `index.html` — Google sign-ins are now checked against the beta list; unapproved accounts are signed back out automatically

## v1.2.0 — Google login + progress tracking
- Added "Sign in with Google" alongside username/password
- Added streak, longest streak, and total drills tracking (visible in a bar at the top once signed in)
- Added `database/setup_progress_tables.sql` — creates `user_progress` and `drill_history` tables

## v1.1.0 — Diagnostics + fixes
- Added the in-app diagnostic/debug panel (bug icon, bottom-right)
- Fixed a JavaScript syntax bug in the original file
- Fixed iPhone Safari video-length bug that silently broke video uploads
- Switched `login.js` to CommonJS syntax for reliable Vercel deployment
- Made the AI model configurable via a `CLAUDE_MODEL` environment variable

## v1.0.0 — Initial launch
- Core app: pick a sport, describe an issue or upload a video, get AI-generated drills
- Supabase Edge Function helper to safely call the Claude API
- Username/password testing-mode login gate
- Renamed from FormFix to Gritto
