# Gritto — Version Log

## v2.8.0 — Multiple daily routines
- You can now save more than one daily routine — one per sport, or several goals for the same sport, whatever you want
- New chip selector at the top of the Daily Routine page: tap between your saved routines, or hit "+ New" to build another
- Each routine tracks its own independent streak, best streak, and time practiced — completing your basketball routine doesn't affect your baseball routine's streak
- Added a delete button (trash icon) to remove a routine you don't want anymore
- Home page now shows your single best streak across all routines
- Database change: user_routine now supports many rows per person instead of just one — migration preserves your existing routine and streak data, nothing is lost

## v2.7.1 — Fixed routine streak showing 0 on Home
- Found the cause: Home is the default landing page, but your routine's streak data only gets loaded into the app once you visit the Daily Routine page — so if Home loaded first, it showed 0 even though the real streak was saved correctly in the database
- Home now makes sure the routine data is loaded before showing the streak, so it displays the real number right away

## v2.7.0 — Video history
- Every video form check now gets saved: sport, role, a thumbnail frame, the summary, what's-good/what-to-fix, and the drills — not the whole video, just a lightweight snapshot
- New "Your video history" strip on the Home page — scroll through past sessions, tap one to see its full breakdown again
- Lets you actually look back over weeks/months and compare how your form has changed
- New database table: video_analysis_history (RLS locked to each user's own rows)

## v2.6.0 — Logo wired in (home screen icon + header)
- Cropped the icon mark (the double arrow) into a proper square, since home-screen icons need to be square — using the full tall logo would have looked wrong once added to a phone's home screen
- This square icon is now what shows up when someone adds Gritto to their home screen (via the browser's Share menu)
- Also added it as the browser tab favicon
- Added the icon into the app's own header, next to "Gritto · AI Mechanics Coach"
- Everything is embedded directly in index.html (no separate image files to upload)

## v2.5.0 — Edit today's logged practice time
- Once you've completed today's routine, you'll now see "Logged X min today · Edit"
- Tapping Edit lets you fix a mistyped number (like 72 instead of 7) without double-counting it in your total time practiced
- The correction updates both your running total and the matching entry in your activity history (so Home page stats stay accurate too)
- Reopening the app on the same day now correctly restores today's logged time so editing still works after a refresh

## v2.4.0 — New Home page
- Added a third bottom-nav tab: **Home**, now the default landing page
- Personal greeting with your first name
- Combined streak snapshot: Drills streak and Routine streak shown side by side
- Quick-start buttons that jump straight into Get Drills or Today's Routine
- Real stats pulled from your history: total active days, drills completed, and your single biggest practice day (by time)
- Recent activity feed showing your last 8 actions across Drills, Video, and Routine
- New database column: drill_history.minutes (so routine sessions log how long you practiced)
- The shared streak header now hides on the Home page to avoid showing streaks twice

## v2.3.0 — Split stats by page + practice-time tracking
- Drills page now shows only: day streak, drills total
- Daily Routine page shows its own separate stats: current streak, best streak, and total time practiced — tracked independently from Drills
- After marking a routine complete, it now asks "About how long did you practice today?" with a minutes input, or a "Not sure? Just use the estimated time" option that falls back to the routine's own estimated total
- New database columns on user_routine: current_streak, longest_streak, total_minutes_practiced
- Rebuilding a routine's content no longer resets your streak or time practiced — those stay tied to you, not the specific routine

## v2.2.0 — Sport picker back on Daily Routine page
- Added the sport grid to the Daily Routine page too, so you don't have to jump to Drills first
- Picking a sport on either page instantly syncs to the other
- Simplified the sync logic into one shared function (selectSport) used everywhere sport selection happens

## v2.1.2 — Fixed both pages showing at once (real bug)
- Found the cause: the CSS only had "hidden" rules scoped to specific components (like `.mode-section.hidden`), not a general-purpose one — so adding the plain `hidden` class to the new Drills/Daily Routine page containers did nothing visually, and both pages stayed on screen at the same time
- Added one general `.hidden{display:none}` rule that works on any element — now switching the bottom nav actually shows only one page at a time, like it's supposed to

## v2.1.1 — Cleaner page separation
- Removed the duplicate sport picker from the Daily Routine page — sport is now only picked on Drills, and Routine reuses it automatically
- Daily Routine page shows a small note confirming which sport it's building a path for (or asks you to pick one on Drills first if none is selected yet)
- Reopening the app and revisiting a saved routine now correctly restores the sport it was built for

## v2.1.0 — Bottom nav + Daily Routine redesigned as a path
- Replaced the 3-way top tabs with a fixed bottom menu (like a real app): **Drills** and **Daily Routine**
- **Drills** page is the familiar home experience — sport picker, "Describe it" / "Upload a video"
- **Daily Routine** is now its own full page, redesigned as a connected path: numbered steps linked by a line, each showing either minutes or reps next to it
- Routine items now use minutes OR reps (whichever fits the activity) instead of always minutes
- Sport selection stays in sync between both pages

## v2.0.0 — Daily Routine feature
- New feature: build a short 5-10 minute daily routine around a goal
- Routine saved per-user in Supabase, persists across sessions
- Checklist UI with daily reset; completing it feeds the existing streak system
- New database table: user_routine (RLS locked to each user's own row)

## v1.9.0 — Fixed blurry "Your motion" + added equipment
- Fixed the blurry/smoky "Your motion" silhouette: the person-detector was returning a soft, semi-transparent shape instead of a hard yes/no cutout — now every pixel is cleanly thresholded to solid figure or fully transparent
- Added a quality check: if a frame's detection looks unreliable (way too little or way too much marked as "person"), it's skipped instead of shown broken; if too many frames fail, the whole section is hidden rather than showing something bad
- Bumped the captured video frame resolution (480px → 640px) for cleaner detection
- Added simple sport equipment to the drill figures: bat (baseball), ball (basketball/soccer/volleyball), football, golf club, tennis racket — attached to the hand so it moves with the swing

## v1.8.0 — Bigger white/black line-art figures
- Redesigned the generic drill figure: much bigger (150×180 instead of 60×78), white body fill with bold black outlines — original line-art style, not a copy of any reference image
- Each drill now gets its own full card with the figure front and center
- The real "Your motion" silhouette (built from your uploaded video) now uses the same white background + dark figure look for visual consistency, and is bigger too
- Note: the real "Your motion" silhouette is a solid filled shape (not a hand-drawn outline) since it's built from your actual video frames — true black-outline tracing from a real photo isn't practically achievable the same way as a drawn illustration

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
