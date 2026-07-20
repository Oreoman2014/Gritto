# Gritto — Version Log

## v1.7.0 — Real silhouette from your own video + solid generic figure
- Superseded v1.6.0's Lottie plan — dropped it entirely, no external files to source
- **Video flow:** when you upload a clip, the app now runs your own frames through a free, browser-based person-detector (MediaPipe Selfie Segmentation) and builds a small looping "Your motion" silhouette animation from YOUR real movement — shown above the drills, labeled "Built from the actual clip you uploaded — this is really you."
- **Text flow (no video to draw from):** drill cards now show a solid, filled human-silhouette figure instead of the old thin stick figure — same real-joint bending animations as before, just looks like an actual person-shaped silhouette
- If silhouette processing fails or isn't supported on a device, the app just quietly skips that section — nothing breaks
- No `animations/` folder or ADDING_ANIMATIONS.md needed anymore

## v1.6.0 — Real animated drill demos (Lottie) — superseded, see v1.7.0
- Each drill card now tries to load a professionally-animated character (via Lottie) matching the drill's motion, instead of the hand-built stick figure
- If a Lottie file isn't added yet (or fails to load), it automatically falls back to the stick-figure animation — the app never breaks
- Added `ADDING_ANIMATIONS.md` — a guide for finding and uploading the 7 animation files (squat, swing, throw, jump, lunge, rotate, run)
- New `animations/` folder expected in the repo, holding one `.json` file per motion

## v1.5.2 — Fixed animations on iPhone/Safari
- Found the real cause of your recording: Safari doesn't support the CSS trick (`transform-box: view-box`) the previous fix relied on — it's a documented Safari limitation, confirmed by checking browser compatibility data
- Rebuilt every joint using plain SVG positioning instead, which works identically across Chrome, Safari, and every other browser
- Verified the rest pose and mid-motion frames render correctly before shipping
- Could not test in an actual Safari engine in this environment (no network access to download it) — please test on your iPhone and let me know if it looks right now

## v1.5.1 — Fixed animations to bend at real joints
- Found and fixed the root cause of the "dance move" look: joints were rotating around the wrong coordinate system, so limbs orbited instead of bending
- Rebuilt every limb as two connected segments (upper arm + forearm, thigh + shin) that bend at a real elbow/knee, instead of one rigid rotating piece
- Rewrote all 7 motions with more realistic timing: squat now sinks straight down with knees bending forward and arms reaching for balance; throw has a proper elbow-leads-forearm-lags whip; run has a full alternating gait with knee drive; jump has a crouch → explode → tuck → land sequence
- Verified visually with rendering tests before shipping

## v1.5.0 — Animated silhouette demos
- Every drill card now shows a small looping silhouette animation (squat, swing, throw, jump, lunge, rotate, or run) matched to that drill's motion
- A pulsing highlight dot shows exactly which body part to focus on (knees, hips, shoulders, elbow, wrist, feet, core, or eyes)
- The AI now picks the motion + focus for each drill it generates, for both the text and video flows
- Not real video — a lightweight, free, built-in animation (no extra cost or generation wait time)

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
