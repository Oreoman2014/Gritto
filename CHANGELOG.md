# Gritto — Version Log

## v6.0.1 — Daily Routine: more space between tabs and sport picker
- The sport-picker grid on the "Build new" tab was sitting right up against the tab bar with very little breathing room
- Increased the spacing so there's clear separation now
- Verified with a real measurement: gap went from a cramped ~14px to a comfortable 51px

## v6.0.0 🎉 — Desktop sidebar: categorized settings, no more Settings button
- On desktop/tablet, the sidebar's "Settings" button is gone — all 11 settings items now live directly in the sidebar, organized into 5 categories: General, Personalize, Help, Privacy, Community
- Phone is completely unaffected — the bottom nav still has its Settings button exactly as before, leading to the same familiar Settings page
- Clicking any sidebar settings item jumps straight to that specific page (e.g. tapping "App Theme" goes directly there, not to a menu you have to click through)
- Increased spacing between every sidebar button, and gave settings sub-items a slightly smaller, indented style so they read as distinct from the main Home/Drills/Daily Routine navigation
- Sidebar already scrolls if content runs taller than the screen (confirmed still working after adding 11 more items)
- Verified with real tests: confirmed no generic "Settings" button remains in the sidebar, confirmed all 14 buttons (3 nav + 11 settings) and all 5 categories render correctly, confirmed scrolling is enabled, and confirmed clicking a settings item correctly opens that exact page (not the menu) and marks the right sidebar button active — tested with a proper isolated test after an initial sandbox-only false alarm

## v5.9.0 — Daily Routine: Today / Build new / History tabs
- Daily Routine page now has the same 3-tab treatment as Drills: "Today" (your active routine's checklist, unchanged), "Build new" (the sport/goal builder, now its own tab instead of a toggle), and "History"
- History shows past completed routine days — tap one to expand and see exactly which items you did that day. Uses data already being logged, no new database table needed.
- Removed the old "+ New" chip from the routine selector since the "Build new" tab now covers that
- Found and fixed 2 real bugs while doing this: the onboarding tutorial's "Build a daily routine" step pointed at an element ID that no longer existed after the restructure, and would have silently failed to show its spotlight; also cleaned up dead code (an unused function, unused CSS) left over from the old toggle system
- Verified with real tests: confirmed the right tab shows on initial load depending on whether the person already has a routine, confirmed switching between all 3 tabs works correctly, and confirmed History correctly renders past routine days including the expandable item list

## v5.8.0 — Drills page: New drills / Recent tabs + save individual drills
- Drills page now has 2 tabs: "New drills" (the existing describe/upload flow, unchanged) and "Recent"
- Recent shows a browsable list of past drill sessions — tap one to expand and see the full drills you got that time
- Every drill card, whether freshly generated or viewed in Recent, now has a yellow star to save that specific drill
- Saved drills show in their own section at the bottom of the Recent tab, independent of which session they came from
- Extended drill_history to store the full drill content (not just sport/summary), and added a new saved_drills table
- Refactored drill card rendering into one shared function used everywhere drills are shown, so the save star and layout stay consistent across new results, recent history, and saved drills
- Verified with real tests: confirmed saving a drill correctly updates the star, writes to the database, and unsaving correctly reverses both; confirmed Recent sessions render with the right sport/summary/date info; confirmed the saved drills list renders correctly; confirmed the empty/sign-in states show correctly when there's no session

## v5.7.0 — Home page: tabbed analytics (Option B from the layout preview)
- Score trend, focus areas, and video history are now grouped under 3 sub-tabs instead of stacked one after another — much less scrolling to get through the analytics section
- "Your stats" and "Recent activity" stay as their own separate sections below the tabs, unchanged
- Fixed a related spot: tapping a "Recent activity" item that links to a video check now correctly switches to the History tab first before scrolling to it, since that section is no longer visible by default
- Verified with a real test: confirmed only the Trend tab shows initially, confirmed switching tabs correctly shows/hides the right content and updates which tab is marked active, and confirmed switching between tabs multiple times works cleanly

## v5.6.0 — Real responsive design: sidebar nav on desktop/tablet
- New persistent left sidebar navigation for wider screens (Home, Drills, Daily Routine, Settings), replacing the bottom tab bar — modeled after Dais's desktop layout
- Phone-width screens are completely unaffected — bottom nav stays exactly as it's always been
- Driven purely by actual browser width (768px breakpoint), not device/OS detection — responds correctly to live window resizing too, not just a fixed device check
- Content area widens accordingly on desktop (720px → 900px max width) to make better use of the extra space
- Verified with real tests at multiple viewport sizes: confirmed the correct nav shows/hides at phone vs. desktop widths, confirmed clicking a sidebar button correctly switches pages and updates the active state, and confirmed live window resizing across the breakpoint correctly flips between layouts in real time

## v5.5.2 — Separate "Common focus areas" and "Your stats" on Home
- Added a real divider line and proper spacing between these two sections, which previously only had 8px between them — barely any visual separation at all
- Verified with a real measurement: confirmed the actual gap increased from 8px to 37px, with a visible horizontal divider now in between

## v5.5.1 — Moved "Get drills" / "Today's routine" buttons up on Home
- Moved from below all the score/trend/focus-area analytics to right under the greeting and streak numbers instead
- Makes the two main actions immediately visible without needing to scroll past analytics content first
- Verified with a real test: confirmed the actual page order is now greeting → streaks → quickstart buttons → score/analytics section

## v5.5.0 — Fix: buttons looking disabled/gray on half of all themes
- Found the real scope: 13 out of 26 themes (exactly half) have an "energy" color too light to be readable as a solid button background with white text — Grandmaster was just the most obvious case you happened to hit, not the only one
- Checked every single theme's colors and confirmed all 26 "turf" colors are dark/saturated enough to always work reliably, while energy colors were only ever designed as accents, not solid button backgrounds
- Fixed the main action button style app-wide to use turf instead of energy, plus 3 more buttons with the exact same problem I found while investigating: the routine "mark complete" button, the practice-time prompt button, and the update-available toast button
- Verified with a real test: confirmed buttons now show a dark, clearly-readable background instead of light gray when Grandmaster's theme is active

## v5.4.5 — Fix: Equip button color changing based on the active theme
- The "Equip" button in the theme detail popup was using the currently active theme's own color — meaning if you had a gray/dark theme active (like Grandmaster), the button looked washed out and could be mistaken for a disabled/locked state
- Now uses a fixed, consistent bright blue regardless of which theme is currently active
- Every other button in the app that's supposed to adapt to the active theme is untouched — this fix only applies to the Equip button specifically
- Verified with a real test: confirmed the Equip button stays the same fixed blue whether the active theme is gray or a totally different color, and confirmed an unrelated button elsewhere still correctly adapts to the theme as it should

## v5.4.4 — Original theme: fixed launch-anniversary date (not per-account)
- Changed the second unlock path from "your own account is 1 year old" to "anyone with an account on Gritto's actual 1-year public launch anniversary" — one shared calendar date for everyone, not a different date per person
- Added a single, clearly-marked spot to set the real launch date once it happens: `GRITTO_PUBLIC_LAUNCH_DATE` near the top of the theme code. Set to `null` until then, so nobody can unlock it early by mistake.
- Updated the description text (with corrected spelling) to match
- Verified with real tests: confirmed it stays fully locked while the launch date is unset, confirmed a brand-new account (signed up yesterday, nowhere near the first 100) still correctly unlocks it once the real anniversary has passed, and confirmed it correctly stays locked if the anniversary hasn't happened yet
- Also fixed in this batch: reverted the artwork back to the real gold+blue logo (only the in-app UI colors are orange/green), and recolored those in-app colors to match Gritto's true original turf-green/energy-orange palette

## v5.4.0 — "Original" theme + admin panel fix
- New theme: black background with the original blue/yellow logo — unlocks two ways: being one of the first 100 people to ever sign up, OR having your account for a full year, whichever comes first
- First-100 tracking uses a real database sequence, so signup order is assigned atomically and race-condition-free even if two people sign up at the exact same instant
- Real bug fixed: the admin panel's "grant theme" checklist hadn't been updated since we added the 10 newest themes back in v4.15.0 — it only showed the original 15. Added all 11 missing themes (the 10 achievement-based ones plus this new Original theme) so you can actually grant any of them from the admin panel
- Verified with real tests: confirmed every boundary case for the dual unlock condition (signup #99 vs #101, account age 364 vs 366 days, and the inclusive boundary at exactly #100), and confirmed the theme correctly shows "Tap to see" instead of the old misleading label

## v5.3.1 — Removed Switch Accounts entirely
- The feature proved unreliable even after two real attempted fixes, so it's been fully removed rather than continuing to chase an elusive bug
- Removed the Settings menu item, its subpage, all related functions, the localStorage tracking, and all related CSS — a clean, complete removal, not just hidden
- Each account still works exactly as it always has — sign in and sign out normally per account, just without the quick-switch shortcut
- Verified with a real regression check: confirmed zero remaining references to any part of the removed feature, and confirmed every other feature (theme details, referrals, language, additional sign-in options) is fully unaffected

## v5.3.0 — Fix two real Switch Accounts bugs
- **Bug 1 fixed: celebration spam on every account switch.** The "which themes/badges have you already seen" tracking was shared across your whole device, not per-account — so switching between two accounts kept overwriting each other's tracking, making the app think everything was newly unlocked every single time you switched back. Now scoped separately per account.
- **Bug 2 fixed: switching leaving a broken session that then blocked fresh Google sign-in too.** Real suspected cause: a timing race where the page could reload before the switched-to session had fully saved, potentially leaving a corrupted partial session behind. Fixed by explicitly clearing any existing session first, then verifying the new session actually took hold before reloading — if it doesn't verify, the app now shows a clear error and stays put instead of reloading into a broken state.
- Verified both with real tests: confirmed switching back and forth between two accounts no longer produces false "new unlock" celebrations, confirmed the switch flow correctly clears the old session first and verifies the new one before reloading, and confirmed a failed verification correctly blocks the reload instead of silently proceeding

## v5.2.1 — Fix: Switch Accounts breaking after a while ("Auth session missing!")
- Real bug found: Supabase automatically rotates session tokens in the background as a security measure. Saved accounts only captured a one-time snapshot of tokens, so if you kept using the app after saving an account, the live session moved on to newer tokens while the saved copy silently went stale — causing switching to fail with a 403 and "Auth session missing!"
- Fixed by listening for Supabase's automatic token refresh and updating the matching saved account's tokens every time it happens, so the saved copy for whichever account is actively in use never goes stale
- This fixes the common case (switching between accounts you use somewhat regularly). A genuinely long-dormant saved account (not touched in weeks) can still legitimately need a fresh sign-in — that fallback message stays as-is, since it's still accurate for that edge case
- Verified with real tests: confirmed a saved account's tokens correctly update when its session refreshes in the background, and confirmed a refresh event for an unrelated account correctly doesn't touch other saved accounts' data

## v5.2.0 — Settings menu icons: emoji → real line SVGs
- Replaced all 12 Settings menu emoji icons (App Info, Reminders, Achievements, App Theme, How Gritto Works, Manage My Data, Report a Bug/Feedback, Share My Progress, Legal, Language, Invite a Friend, Switch Accounts) with clean line-style SVG icons
- Matches the same stroke-based style already used in the bottom navigation, instead of emoji that render inconsistently across different devices/platforms
- Verified with a real test: confirmed all 12 menu items now have an actual SVG element (not text/emoji), correctly matched to the right label, with zero leftover emoji anywhere in the menu

## v5.1.2 — "Fix your form." header now only shows on Home
- The big header with the logo and "Fix your form." tagline was showing on every page (Drills, Daily Routine, Settings too), not just Home
- Now hidden on every page except Home, matching the same show/hide pattern already used for the streak progress bar
- Verified with a real test: confirmed it's visible on initial load (Home), correctly hides on Drills/Daily Routine/Settings, and correctly reappears when switching back to Home

## v5.1.1 — Fix: Grandmaster still showed "0-day streak"
- My previous fix checked for a `check` function to decide whether to show "Tap to see" — but Grandmaster's unlock logic is special-cased separately (it depends on all other themes, not its own simple condition), so it never had a `check` function to detect, and fell through to the old broken label
- Fixed by explicitly including Grandmaster in the "this is achievement-based" check, not just themes with their own check function
- Verified with a real test: confirmed Grandmaster now shows "Tap to see," confirmed all 9 other achievement-based themes are unaffected, and confirmed genuine streak-based themes still correctly show their real day counts

## v5.1.0 — Tap any theme to see how to unlock it (and fix a real misleading label)
- Tapping any theme swatch — locked or unlocked — now opens a detail popup showing what it takes to unlock it, or what you unlocked it for
- If unlocked: an "Equip" button right there to switch to it immediately, which correctly shows "Currently equipped" (and disables itself) if it's already your active theme
- If not unlocked: shows "Not unlocked yet" instead of an equip option
- Real bug fixed: locked achievement-based themes (the 10 newest ones) were showing "0-day streak" underneath them — which is actively misleading, since it reads like you already qualify. Now shows "Tap to see" instead. Genuine streak-based themes still correctly show their real day requirement.
- Added a real description to every single theme (all 25) explaining exactly how to earn it
- Verified with real tests: confirmed the label fix for both an achievement-based theme (now says "Tap to see") and a genuine streak-based one (still correctly shows its day count), confirmed the detail popup shows correct info for both a locked and an unlocked theme, and confirmed the full equip flow — including that re-opening an already-equipped theme correctly shows "Currently equipped" with the button disabled

## v5.0.0 🎉 — Milestone version bump
- No functional changes — marking this as v5, following the same batch of work as v4.15.0: 10 new achievement-based themes (25 total now), plus the Precision/Consistency image fix

## v4.15.0 — 10 new achievement-based themes (not streak-based)
- Iron Will (200 total drills), Director's Cut (50 video checks), Archive (100 video checks), Precision (90+ average across at least 10 checks), Consistency (30 active days, not consecutive), Ambassador (10 friends referred), All-Rounder (60+ score in 5 different sports), Veteran (6 months since first day using the app), Polyglot (used a non-English language at least once), and Grandmaster (unlocks only once literally every other theme — all 24 — is unlocked)
- Extended the badge-stats system to also track: average score, referral count, best score per sport, and account age
- The theme system now supports custom unlock conditions beyond simple streak thresholds, reusing the same pattern already used for badges
- Verified with real, rigorous tests: confirmed exact threshold boundaries (199 vs 200 drills, 9 vs 10 referrals, etc.), confirmed Precision correctly requires BOTH conditions together (enough checks AND high enough average — neither alone is sufficient), and ran 3 full scenarios for Grandmaster specifically: a maxed streak with zero achievements (correctly stays locked), everything genuinely maxed (correctly unlocks, and totals exactly 25 themes), and everything maxed except one single achievement short by the smallest margin (correctly stays locked)
- All 10 backgrounds are real user-generated artwork (Precision and Consistency needed no changes; Iron Will, Director's Cut, and Archive had their arrows recolored to fit their scenes — verified pixel-by-pixel that only the arrow itself changed, not the surrounding artwork; the remaining 5 were split out of a single collage image and verified for clean crops)

## v4.14.0 — Switch Accounts (for parents managing multiple kids)
- New "Switch Accounts" section in Settings — save each signed-in account with a nickname (like a kid's name), then jump between them with one tap instead of a full sign-out/sign-in cycle each time
- Deliberately built as the safer, lower-risk version: each kid's account is still fully separate underneath (own streaks, own data, own everything) — this only adds a shortcut for switching between already-existing logins, no changes to any of the app's core data tables
- Verified with real tests: confirmed saving an account works, confirmed saving the same account twice correctly updates it instead of creating a duplicate, confirmed switching calls Supabase's real session-restore method with the exact right tokens and reloads the app, and confirmed removing a saved account works

## v4.13.0 — Referral system: invite a friend, both get a bonus theme
- New "Invite a Friend" section in Settings with your personal shareable link
- When a friend signs up through your link, you both instantly unlock the Ocean theme — even without the streak for it
- Built as a secure server-side process, not a simple client-side trick: verifies the real identity of whoever's signing up (can't be faked to credit someone else's account), blocks self-referrals, and blocks using more than one referral per account
- Verified extensively with real tests: confirmed self-referral gets blocked, confirmed an already-referred account gets blocked from claiming twice, and confirmed a valid referral correctly grants the bonus theme to both people — critically, without erasing any themes the referrer had already been granted separately (existing grants are added to, never overwritten)

## v4.12.0 — Printable drill cards
- New "🖨️ Print these drills" button on both text and video drill results
- Uses the browser's real print/save-as-PDF capability rather than generating a file server-side, so it works for anyone's own drills on the spot, not something pre-made
- Print output is genuinely clean: hides the nav bar, buttons, follow-up chat, and other on-screen-only UI, formats each drill onto its own page with larger, clearer text meant for reading on paper
- Verified with a real test using actual browser print-mode emulation (not just written CSS assumed to work): confirmed the nav and print button correctly disappear in print mode while the actual drill content stays visible

## v4.11.0 — Sign in with Facebook, Microsoft, and Yahoo
- Added 3 new sign-in buttons alongside Google, on both the main login screen and the Settings sign-in prompt
- Facebook and Microsoft (covers Hotmail/Outlook/Live accounts) are officially built into Supabase Auth — these should work as soon as you complete the provider setup below
- Yahoo isn't a built-in Supabase provider, so it's wired up as a "custom" OAuth provider — needs the extra setup step noted below to actually work
- Fixed one leftover error message that said "Google account" even when a different provider was used
- Verified with a real test: confirmed each button calls Supabase with the exact correct provider identifier (google, facebook, azure for Microsoft, custom:yahoo)

### Important — setup required before these work
The buttons are ready, but each provider needs real configuration in your Supabase dashboard before sign-in will actually succeed (same process that already had to happen for Google):
1. **Facebook**: create a Facebook Developer app, get a Client ID/Secret, enable "Facebook" under Supabase → Authentication → Providers
2. **Microsoft**: register an app in Microsoft Entra/Azure, get a Client ID/Secret, enable "Azure" under Supabase → Authentication → Providers
3. **Yahoo**: register a Yahoo Developer app, then add it as a Custom Provider in Supabase → Authentication → Providers → Custom Providers, using the identifier "yahoo"

Until each provider is configured, tapping its button will just show a sign-in error — this is expected, not a bug.

## v4.10.0 — Language support for genuinely any language
- New "Language" section in Settings — type any language (not picked from a limited list) and the app adapts
- Your drills, video feedback, and routine suggestions come back written directly in that language, since those are already AI-generated
- The app's main navigation and Settings menu translate too — sent to the AI once per language, then cached on your device so it's instant every time after the first
- Switching back to English resets everything immediately with no AI call needed
- Verified with real tests: confirmed translated text actually applies to the real navigation/menu elements, confirmed picking the same language twice only calls the AI once (cache working correctly), and confirmed English reset works cleanly

## v4.8.0 — Dark mode
- New toggle in Settings → App Theme: "Use dark mode"
- Converts the page background, all card surfaces, text, and borders to a proper dark palette — not just a filter, real color swaps throughout
- Found and converted all 36 places in the app that hardcoded a white card background instead of using a shared variable, so dark mode genuinely applies everywhere instead of leaving scattered white boxes behind
- Left a couple of intentional warning/error boxes (light peach with red text) unconverted on purpose — those are meant to stand out as alerts regardless of light or dark mode
- Persists across sessions — survives closing and reopening the app
- Verified with real tests: confirmed actual computed background colors change correctly (not just a CSS class being added), confirmed a real card element's background genuinely changes color, and confirmed the setting survives a full page reload

## v4.7.0 — 8 new theme tiers: Diamond through Eternal
- Added 8 new milestone themes: Diamond (125 days), Phoenix (150), Storm (175), Emerald (200), Nebula (250), Solar (300), Celestial (350), and Eternal (365) — a full year
- All artwork built programmatically (gradients, particle/sparkle systems, ray bursts, faceted shapes, holographic diagonal blending) with the two-tone logo composited on top, same approach as Turf
- Each theme also has an opaque icon variant for the home-screen/favicon swap feature, matching how the original 7 themes work
- Verified every single image has the logo correctly composited (checked for both gold and blue) before shipping, not just visually assumed
- Verified the unlock logic with real streak values: confirmed Diamond stays locked at day 124 and unlocks exactly at day 125, and all 15 themes total correctly unlock by day 365

## v4.6.0 — Timer + rep counter, on Drills and Daily Routine
- Every drill card (both from text descriptions and video analysis) now has a simple stopwatch and tap-to-count rep counter built in
- Same widget on every Daily Routine checklist item too
- Multiple timers run fully independently — starting one drill's timer doesn't affect any other's
- No AI involved this time, as decided earlier — just a straightforward manual timer and counter
- Important fix found and verified during testing: Daily Routine re-renders itself every time you check off an item, which would normally reset any running timer's display back to 0:00 visually (even though it kept running underneath). Fixed so a running timer correctly survives being rebuilt — confirmed with a real test that showed the exact bug happening, then confirmed it fixed
- Verified with real tests: two independent timers running simultaneously with no cross-contamination, real elapsed time tracking, and the re-render survival fix all confirmed working

## v4.5.0 — Settings redesigned as a menu with sub-pages
- Settings now opens to a clean list of 9 categories (App Info, Reminders, Achievements, App Theme, How Gritto Works, Manage My Data, Report a Bug/Feedback, Share My Progress, Legal) instead of one long scrolling page
- Tap any item to go straight to just that section, with a Back button to return to the menu
- Always resets to the menu view fresh each time you open Settings — never leaves you on a stale sub-page from your last visit
- All existing functionality (badges, themes, feedback, sharing, data management) works exactly the same — this only reorganizes how you get to each one
- Verified with a real test: confirmed the menu shows by default, confirmed all 9 sections are individually reachable, and confirmed the Back button correctly returns to the menu every time

## v4.4.0 — Preferred name as the first onboarding question
- Onboarding is now 12 steps — the very first question is "What should we call you?" instead of jumping straight to sport, since Google account names aren't always what someone actually goes by
- One flexible field, not two — works as either a real name or a nickname, whatever they'd rather be called
- The Home greeting now uses this saved name instead of the Google account name, everywhere it's shown
- Verified with a real end-to-end test: confirmed Continue stays disabled until something's typed, confirmed all 12 steps navigate correctly in the new order, and confirmed the name saves properly

## v4.3.1 — Real, specific positions (multi-select) for every sport
- Fixed: the position question was reusing a list meant for video analysis, which had generic non-positions like "Hitter" and "Fielder" — everyone does that, they're not real positions
- Now uses real, specific positions for every sport: Baseball has actual field positions (Shortstop, Left Field, Catcher, etc.), Basketball has Point Guard/Center/etc., Football has actual positions, and so on
- Position selection is now multi-select — pick every position you actually play, not just one
- Sports without real positions (Golf, Tennis, Other) skip the forced choice entirely with a clear note, instead of showing options that don't apply
- Verified with real tests: confirmed Baseball shows actual positions (not the old generic ones), confirmed picking multiple positions works and saves correctly, and confirmed Golf correctly auto-continues without forcing an irrelevant choice

## v4.3.0 — Interactive tutorial walkthrough
- New 7-step guided tour that spotlights real elements on real pages — your streaks on Home, the sport picker and mode tabs on Drills, the routine builder, and badges/themes in Settings — actually navigating between pages as it goes, not just static screenshots
- Runs automatically once, right after finishing onboarding
- Re-runnable anytime via a new "Replay the tutorial" button in Settings, under "How Gritto works" (which also still has the existing written explanation as a simpler reference)
- Caught and fixed a real bug during testing: if switching pages ever failed for any reason mid-tour, the whole step would silently break and never update its own text/spotlight — made this resilient so a page-switch hiccup can't derail the rest of the tutorial
- Verified with a real, complete end-to-end test: all 7 steps in order, confirmed each one correctly navigates to the right page and highlights the right element, confirmed the closing step and "Let's go!" button work, and confirmed cleanup leaves no stray spotlight behind

## v4.2.0 — Expanded onboarding with injury safety screening
- Onboarding now has 11 steps instead of 4: sport, goal, experience, coach personality, age range, position (dynamically pulled from the same list used in video analysis), equipment access, team or solo, biggest challenge, injury history, and an optional upcoming goal/deadline
- Injury screening is conditional: answer "No" and it moves straight on — answer "Yes" and a follow-up appears asking which area(s), with no wasted questions either way
- The injury data actually does something: every AI request (drills, video feedback, routine building, and follow-up questions) now includes a real safety instruction to avoid or modify anything that could aggravate a reported injury area — not just collected and ignored
- Caught and fixed a real bug during testing: the "Continue" button was being unconditionally enabled on any chip click, which meant someone could say "Yes" to an injury, pick zero areas, and still continue — found this with an actual browser test, not just by reading the code, and fixed it so the button now correctly stays disabled until at least one area is picked
- Verified the complete 11-step flow end-to-end with a real test, including the position list correctly changing based on the selected sport, and the injury validation working correctly in both directions (checking and unchecking areas)

## v4.1.1 — Fixed a real bug: video trim sliders were completely broken
- Found while verifying the video-trim and body-part-trend features (both already existed from earlier in this session): the trim sliders would throw "updateTrimSelection is not defined" every single time they were touched, silently doing nothing — a scoping issue where the inline HTML slider handlers couldn't reach the function they needed, since it was defined inside a different closure
- Fixed by properly exposing the trim functions where the inline handlers can actually find them
- Verified with a real end-to-end test using an actual 10-second test video: confirmed no errors, confirmed the slider labels correctly update when dragged (0:03, 0:06), and confirmed extraction correctly captures all 15 frames from just that trimmed range
- Body-part trend feature checked out clean — verified the save logic, load/aggregation logic (confirmed correct ranking with test data), HTML, and SQL migration are all correctly in place, no changes needed

## v4.1.0 — Ask a follow-up question
- New "Have a question about this?" section shows up right after getting drills (text mode) or a video breakdown — type a quick question and get a direct answer from the AI, no need to start over
- Keeps context from what was just discussed (your sport and the summary of what you were working on), so answers actually stay relevant
- Works the same way in both Drills (text description) and Upload a Video flows
- Verified with a real test: confirmed the question and answer both render correctly in the conversation thread, and the input clears after asking

## v4.0.1 — Fixed: clearing activity log now actually resets streaks
- Real bug found: the confirm dialog for "Clear my activity log" already claimed it would reset your Drills streak and stats — but the code never actually did that, leaving stale numbers behind with no data to back them up
- Now genuinely resets: Drills streak, longest streak, and total drills completed all go to 0, and every Daily Routine's streak, longest streak, and time practiced also reset to 0
- Updated instantly in the UI, not just the database — no reload needed to see the reset take effect
- "Clear my video history" intentionally stays scoped to just the rich video details (thumbnails, AI breakdowns) — it doesn't touch streaks, since those come from the separate activity log, not video history
- Verified with a real test: confirmed real progress numbers (46 drills, 5-day streak, 2-day routine streak) correctly zero out after the reset logic runs

## v4.0.0 — Milestone version bump
- No functional changes — just marking this as a real milestone after everything built: AI drills, video form checks with scoring, daily routines, achievement badges, unlockable themes, push notifications, sharing, and a whole lot of hard-won iOS video bug fixes along the way

## v3.30.0 — Tap a badge to see how you earned it
- Every badge in Settings now has a real description explaining what it takes to unlock
- Tap any badge (locked or unlocked) to see a detail popup: what it's called, what it takes, whether you've unlocked it, and your actual current progress toward it
- Locked badges show real numbers ("15/50 drills completed"), unlocked ones show the goal met cleanly (never shows something odd like "15/10")
- Verified with a real test: confirmed an unlocked badge shows correctly capped progress, a locked badge shows genuine current progress, and score-based badges show your actual best score against the target

## v3.29.0 — Fixed a real, systemic bug: silent database failures across the whole app
- Found the actual cause of the feedback 400 error: Supabase's client library doesn't throw an exception when a database write fails — it resolves normally with an `{error}` field that the code was never checking. This meant the feedback form could fail completely while still telling you "Sent — thank you!"
- Audited the whole app for this exact pattern and found it in 14 other places — fixed all of them: sending feedback, saving drill/video progress and streaks, clearing video history/activity log/score averages, generating and turning off share links, onboarding, deleting a routine, saving routine completions, and editing logged practice time
- The routine-delete fix matters especially: previously, even if the server delete silently failed, the app would still remove the routine from your screen — meaning it could reappear later since it was never actually deleted. Now it only removes it locally if the server confirms success.
- All failures now log the real error message to the debug panel, so if something like this happens again, it'll actually be visible instead of invisible
- Verified the exact bug and fix with a real test: confirmed the old code said "Sent!" on a genuinely failed insert, confirmed the new code correctly reports failure in that case while still reporting success correctly when it actually works

## v3.28.0 — Two-step upload flow with real decoder priming (architectural fix)
- Your architectural instinct was right: split "select video" from "analyze" into two genuinely separate steps
- New flow: pick a video → tap a new "Read my video" button → extraction begins. That second tap is a fresh, guaranteed-valid user gesture, which iOS needs to reliably let a video actually start decoding
- Real fix: the app now calls video.play() (briefly, muted) to genuinely prime the decoder, instead of relying only on seeking — seeking alone doesn't guarantee real decoding happens on every device, which is what caused frames to come back as pure black (mean=0, variance=0) even though everything else reported success
- Primes twice: once immediately on the raw file (closest to your tap), and again on the fully-materialized file (since swapping the video source resets decoder state, so the priming needs to happen again on the actual file used for extraction)
- Caught and fixed a real bug during testing: the priming's own play() call could cause loadedmetadata/loadeddata to fire before our listeners were even attached, silently preventing extraction from ever starting. Added a direct check that starts extraction immediately if data's already available instead of waiting for events that already happened.
- Also found and fixed a subtler bug while debugging that one: resetting currentTime to 0 right after priming caused a real, measurable drop in readyState while the seek completed, which broke the very check meant to catch this — removed the unnecessary reset
- Verified for real, iteratively: caught two genuine bugs through actual testing (not just theory), fixed both, and confirmed the complete two-step flow now works end-to-end with real frame data

## v3.27.0 — Real fix found from precise debug data: wait for an actual presented frame
- Your last debug log gave exact, precise numbers — every frame came back as mean=0.0, variance=0.0, min=0, max=0, across 3 different moments in the video and every retry. That's not "dark" or "HDR mis-converted" — that's the canvas drawing nothing at all.
- Root cause: the app was only waiting for the "seeked" event before drawing to canvas — but "seeked" only means the seek operation finished, not that the decoder has actually produced a real frame yet. On this phone, the decoder wasn't keeping up, so we were drawing an empty frame every time.
- Real fix: now uses requestVideoFrameCallback — a browser API built specifically for "tell me when a frame is genuinely ready to read" — instead of trusting "seeked" alone. Falls back to the previous approach on browsers that don't support it.
- Added logging for whether requestVideoFrameCallback is available on a given device, so future debug logs confirm which path was used
- Verified for real: ran the actual updated code, confirmed requestVideoFrameCallback is detected and used, confirmed all 15 frames still extract correctly on a normal video with zero regression
- Increased the overall extraction timeout slightly (60s → 75s) to accommodate the extra wait time this adds per frame

## v3.26.1 — Explicit sRGB canvas + much deeper diagnostic logging
- Narrowed down with your latest report: Files picker works, HD/HDR video specifically doesn't — points at HDR color data getting mishandled when drawn to canvas, not the Photos/iCloud handoff issue
- Canvas now explicitly requests sRGB color space when drawing video frames — HDR color values drawn without this can come out solid black instead of being properly converted to normal screen colors
- Massively expanded logging: every frame now logs the actual brightness (mean), contrast (variance), and darkest/brightest pixel values found — not just "blank: yes/no" — so a future debug log will show real numbers instead of just true/false
- New setup log line shows video dimensions, canvas dimensions, and — critically — whether the browser actually honored the sRGB request or fell back to something else
- Updated the recovery message to mention BOTH known causes: turning off HDR Video in iPhone Camera settings, and the iCloud/Photos-Files workaround
- Verified for real: ran the actual updated code, confirmed the sRGB request is being honored, confirmed the new detailed per-frame logging shows real numbers, confirmed no regression on normal video (all 15 frames still capture correctly)
- Honest limitation: I don't have a real HDR test video or the specific iPhone to test the actual fix against — this logging is specifically designed to close that gap next time you send a debug log

## v3.26.0 — Photos-picker black frame fix + fail-fast extraction
- New root-cause hypothesis addressed: on some iPhones, a video picked from the Photos app (vs. the Files app) can hand off a file reference before the actual video data is fully available locally — especially for clips still in iCloud. The video reports correct duration but every frame decodes as black.
- Fixed by forcing a full read of the file into memory before ever trying to decode it as video — this makes the browser fully materialize the file (downloading from iCloud if needed) up front, addressing the handoff timing issue directly
- Extraction no longer grinds through all 15 frames when it's clearly not working: if the first 3 frames are all conclusively blank even after retries, it stops immediately instead of wasting time on the remaining 12
- New, specific recovery message for this exact failure pattern: tells the person to open the video in Photos → Share → Save to Files → re-select from Files — the known working workaround
- Verified for real: ran the actual updated code against both a normal video (confirms full materialization + all 15 frames still work, no regression) and a genuinely black video (confirms it now stops after 3 frames instead of 15, and shows the new recovery message)
- Note on scope: reviewed a detailed troubleshooting document that was shared, which described a different tech stack (React/TypeScript) that doesn't match Gritto's actual codebase (a single vanilla-JS file) — implemented the well-reasoned core diagnostic idea from it in a way that fits our real architecture, rather than copying incompatible code directly

## v3.25.1 — All badges unlocked for your account too
- Your account (aaryavgupta028@gmail.com) now sees every achievement badge unlocked, same as themes — good for testing/demoing
- Everyone else still earns badges normally based on real stats
- Verified with a real test: admin email gets everything regardless of progress, other accounts only get what they've actually earned

## v3.25.0 — Achievement badges + unlock celebration screen
- New "Achievements" section in Settings with 11 badges: First Steps, Getting Started, Dedicated, Century Club (drill counts), Lights Camera, Film Study, Tape Junkie (video check counts), Elite Form (90+ score), Showing Up, All In (active days), and Multi-Sport
- All computed from stats already tracked — no new database columns needed
- New celebration screen: pops up automatically with confetti when you unlock a NEW badge or theme, showing what you earned
- Smart about existing progress: if you already had badges/themes unlocked before this update, it won't flood you with celebrations for things you already earned — only genuinely new unlocks trigger it going forward
- If multiple things unlock at once, celebrations queue up and show one at a time instead of overlapping
- Verified with real tests: badge unlock logic across multiple stat scenarios, the "don't celebrate pre-existing progress" logic, and the celebration overlay actually rendering correctly

## v3.24.1 — Restored the 15-frame scrubbing feature (undo the undo)
- Brought back everything from v3.23.3: 15 frames, auto-opening scrubber viewer, "Watching your video" text, hidden thumbnail strip
- AI analysis still only samples 5 frames from the 15 — cost stays controlled
- Fully tested this time: ran the real extraction code end-to-end and confirmed all 15 frames captured, the viewer opens automatically, and nothing is broken

## v3.24.0 — Removed the 15-frame scrubbing feature
- Cleanly reverted back to 5 frames, no big scrubber viewer — back to the simple thumbnail strip
- AI analysis simplified back to using all captured frames directly (no sampling logic needed anymore)
- Removed all the frame-viewer HTML/CSS/JS entirely, not just hidden — clean removal
- Fixed a leftover reference that would have broken video uploads entirely (a piece of code still pointed at an element that no longer existed)

## v3.23.3 — Simpler progress text during extraction
- Changed the live progress message from "Reading frame 12 of 15…" to just "Watching your video…" — matches the same friendly, non-technical tone as the frame viewer itself
- AI analysis stays at 5 sampled frames (kept fast and cheap, as decided) — extraction still captures 15 for smooth scrubbing

## v3.23.1 — Cleaner frame review (just the scrubber, no thumbnail wall)
- Removed the small 30-thumbnail strip entirely — it looked cluttered and was redundant with the big viewer
- The frame viewer now opens automatically as soon as extraction finishes, showing "Frame 1 of 30" right away — feels like scrubbing through your actual video instead of picking through a wall of separate images
- Verified for real: ran the actual extraction code, confirmed the viewer auto-opens and the old thumbnail strip stays empty (0 thumbnails) as intended

## v3.23.0 — Slow-motion frame review (30 frames)
- Video uploads now capture 30 frames instead of 5, giving a genuinely smooth slow-motion scrubbing experience
- New frame viewer: tap any thumbnail (or it opens automatically) to step through every frame one at a time with prev/next buttons, a frame counter, and a scrub slider
- **Cost stays the same as before** — the AI still only analyzes 5 evenly-sampled frames, not all 30, so this doesn't increase API cost at all
- The "Your Motion" silhouette animation samples 10 frames (not all 30) to keep MediaPipe processing fast
- Extraction now shows live progress ("Reading frame 12 of 30…") instead of a static message, given it takes longer with 6x more frames
- Increased the overall extraction timeout proportionally, and made the "video looks too dark" detection scale with frame count instead of using a fixed threshold
- Verified for real: ran the actual extraction code against a real video in a real browser, confirmed 30 frames captured, tested viewer navigation including boundary clamping, and confirmed the AI sampling logic genuinely only sends 5
- Also fixed a bug caught during this build: tapping a frame thumbnail would always jump to the last frame instead of the one you tapped

## v3.21.0 — All themes unlocked for your account only
- Your Google account (aaryavgupta028@gmail.com) now always sees every theme unlocked, regardless of actual streak progress — useful for testing/demoing without needing to grind out a 100-day streak
- Everyone else is unaffected — themes still unlock normally based on their own best-ever streak
- Verified with a real test across multiple scenarios: your email always gets everything, other accounts only get what their streak actually earns

## v3.20.1 — New turf-branded logo everywhere (home screen icon, favicon, in-app header)
- Replaced the old plain logo with the new turf-field version (logo sitting at midfield) in all 5 places it's used: the iPhone home-screen icon, the browser favicon (32x32, 192x192, 512x512), and the small logo shown in the app's own header
- Verified for real in a browser: confirmed the header logo image actually decodes and loads (not broken/corrupted), and all favicon links have valid, correctly-sized image data
- No visible file changes needed beyond index.html — the images are embedded directly in the code, same as the original logo was

## v3.20.0 — Unlockable app themes
- New "App theme" section in Settings with 7 themes: Turf (default), Ocean (3-day streak), Sunset (7-day), Galaxy (14-day), Inferno (30-day), Aurora (50-day), Legendary (100-day)
- Unlocking is based on your best-EVER streak (drills or routine, whichever is higher) — once unlocked, a theme stays unlocked forever, even if the streak later breaks
- Selecting a theme changes the app's accent colors everywhere (buttons, streak numbers, highlights) for a real cohesive reskin
- Locked themes show grayed out with their unlock requirement; a preview card shows your currently active theme's full artwork
- All 7 theme images are real custom artwork (user-provided), processed into a standard square format
- Verified the unlock logic with real tests across every streak tier (0, 5, 15, 100 days) — confirmed exactly the right themes unlock at each level
- Chose to keep theme artwork out of the header (where it would fight with the logo/text for readability) and instead show it as a clean standalone preview in Settings

## v3.19.0 — Share progress with a parent or coach
- New "Share my progress" section in Settings — generates a private link a parent or coach can open to see streaks and scores, no account needed on their end
- New public page (share.html) shows: drills streak, routine streak, total active days, drills completed, routine streaks by sport, and average score by sport
- Deliberately does NOT expose email, video thumbnails, or anything beyond a simple progress summary
- "Turn off sharing" option instantly invalidates the old link if you ever want to revoke access
- New server function (get-shared-progress.js) using the secret service key to safely serve public data without needing the viewer to log in
- Tested for real: ran the actual share.html code against a local server with realistic mock data — confirmed correct rendering of stats, plus both error states (invalid link, missing link) show honest messages instead of breaking
- New database columns: user_profile.share_token, user_profile.share_name

## v3.18.0 — Real fix for "captured but still black" frames, tested with real dark video
- Found the actual gap: the "does this frame look blank" check only measured contrast, not brightness — so a frame that was overall very dark but had a little noise or a faint highlight could technically pass as "not blank" while still looking essentially black to a person
- Fixed by checking both contrast AND brightness — a frame now has to be reasonably bright, not just reasonably varied, to count as usable
- If a video is genuinely too dark even after every retry, the app now says so honestly ("This video looks quite dark...") instead of silently proceeding with frames that won't give good results
- Verified for real: generated an actual genuinely-black test video and an actual normal test video, ran the real production code against both in a real browser — confirmed the dark video correctly triggers the new warning on every attempt, and the normal video is completely unaffected (still captures cleanly with zero retries)

## v3.17.1 — Found and fixed a real race condition causing black frames
- Did a full line-by-line audit of the video extraction code as requested, and found a genuine bug: two separate "start extraction" triggers (added in different updates) could fire independently, and one could jump ahead of the other before it finished fixing a known iOS quirk (videos sometimes report "infinite" length right when picked)
- If that happened, frame extraction would start using a broken (Infinity) duration — every timestamp calculated from it becomes garbage, likely landing on an invalid position in the video, which explains the black frames
- Fixed the race condition directly: the second trigger now waits for the real duration to be known before starting, instead of possibly jumping the gun
- Added a second, independent safety check inside extraction itself: if a broken duration ever slips through anyway, it waits briefly for the real one instead of proceeding with garbage math
- Verified the exact race condition and the fix with a simulation test — confirmed the old code would start with Infinity, the new code correctly waits

## v3.17.0 — Sport-first score trend picker
- Replaced the "combined all sports" default chart with a proper sport picker: the section now says **"Check your score trend"** with a row of sport chips underneath — tap one to see that sport's chart
- Defaults to your most recently checked sport, so there's always something useful showing right away
- Tapping a row in the average-score table above does the same thing (both stay in sync), for convenience
- No more mixed-sport line confusingly blending different sports together
- Verified with an automated test that the default sport selection correctly picks the most recently checked one

## v3.16.1 — Tap a sport to filter the score trend chart
- Tapping a row in "Your average score by sport" now filters the trend chart below it to just that sport, instead of mixing everything together
- The active sport row gets highlighted, and a "Showing [Sport] only · Show all sports" note appears above the chart
- Tap the same sport again (or "Show all sports") to go back to the combined view
- Verified with an automated test that filtering, toggling back off, and switching between sports all work correctly

## v3.16.0 — Score trend chart on Home
- New line chart right below your average score table, showing your last 15 scored video checks in order over time
- Each point is color-coded (same scheme as everywhere else) and tappable — tap any point to see its exact score, sport, and date
- Shows your most recent score by default
- Hand-built with plain SVG (no external charting library needed)
- Verified with an automated test that point positions, colors, and tap interaction all work correctly

## v3.15.0 — Two reminders per day + fixed stale streaks
- Reminders now fire twice a day: **noon** and **6 PM** — if you've already done your routine by noon, the 6 PM one naturally won't nudge you again (the existing "who hasn't done it today" check already handles this)
- Honest limitation: Vercel's free tier only guarantees timing within the hour (not the exact minute), and cron times are set in UTC with no automatic Daylight Saving adjustment — set for Eastern Time, will drift an hour twice a year unless updated
- **Real bug fixed:** streaks were showing a stale, misleading number after being broken — if you skipped days, the app never actually re-checked whether your streak was still alive until the next time you completed something. Now, both Drills and Daily Routine streaks correctly show 0 as soon as you view them, if the last activity wasn't today or yesterday — no more lingering fake streak numbers.
- Verified the streak-breaking logic with an automated test across today/yesterday/older/never-active cases

## v3.14.0 — Average score by sport on Home
- New "Your average score by sport" table near the top of Home, right under your streaks
- Auto-populates as you get video checks scored — no setup needed, sports just show up once you have data for them
- True average across ALL your video checks (not just the recent 20 shown in Video History), sorted best to worst
- Each row shows the average score (color-coded, same scheme as everywhere else) and how many checks it's based on
- New Settings option: "Clear my score averages" — resets just the score/category data, keeping your actual videos, feedback, and drills intact (separate from the full "Clear my video history" option)
- Verified with an automated test that averages compute and round correctly, and sort properly highest to lowest

## v3.13.0 — Category-based scoring + true 0-100 range
- Scores can now genuinely go all the way down near 0 when form shows real, significant flaws — the AI was told to be honest and fair before, but too gently, and ended up clustering everyone around 50+. Rewrote the instructions to explicitly stop that clustering.
- Video checks are now scored on 3 categories specific to your exact sport and role — e.g. a baseball hitter might see "Stance & Load," "Swing Path," and "Follow-Through"; a basketball shooter might see "Shooting Form," "Release Point," and "Balance" — chosen dynamically by the AI based on what's actually relevant
- The overall score badge is now calculated as the average of the 3 category scores (computed on our end, not just trusted from the AI, so it's always consistent with the breakdown shown)
- Each category shows its own score, a colored progress bar, and a short note explaining why
- Shows in both the fresh results and later in Video History detail view
- Verified with an automated test that scores below 50, category names, and bar widths all render correctly
- New database column: video_analysis_history.categories

## v3.12.2 — Cleaner error messages in the debug log
- Fixed error logging showing "[object Object]" instead of the actual message — now correctly unwraps Anthropic's nested error format so future debug logs show real, readable text
- No functional change otherwise — this update's real fix is on the Anthropic billing side, not in the app (see previous note about adding credits)

## v3.12.1 — Fixed crash on unexpected AI response + better error logging
- Found via debug log: the request to the AI succeeded (200 OK), but the response body didn't have the expected shape, and the app crashed with a confusing "Cannot read properties of undefined" instead of failing gracefully
- Added a shared safety check used by all 3 AI calls (drills, video analysis, daily routine) — if this happens again, it now shows a clear message instead of crashing, and logs the actual unexpected response to the debug panel so we can see exactly what came back
- Note: the underlying cause (why the AI service returned an unusual response that one time) is still unconfirmed — this fix makes the app handle it gracefully and gives us real diagnostic info if it happens again, rather than blindly guessing at server-side causes

## v3.12.0 — Video form score
- Every video check now gets a 0-100 form score with a short label (like "Solid fundamentals" or "Needs work on timing"), shown as a big color-coded badge right at the top of your results — green for strong scores, teal for solid, amber for developing, red for early-stage
- The AI is instructed to score honestly, not inflate — most learning athletes should land in the 50-80 range, 90+ reserved for genuinely clean mechanics
- Score is saved with each check, so it shows up as a small badge on your video history thumbnails and in the full detail view — letting you actually watch your score improve over time
- Verified the color-coding with an automated test across all 4 score ranges before shipping
- New database columns: video_analysis_history.score and drill_history.score

## v3.11.2 — Fixed hang introduced by the last black-frame fix (my mistake)
- The "wait for real frame data" check added in v3.11.1 had no fallback — if that specific browser event never fired on a device, the app just waited forever, stuck on "Reading frames from your clip..."
- This is on me — a real regression, not a device quirk
- Fixed properly this time: the app now starts as soon as EITHER the frame-data-ready signal fires, OR a very short grace period passes — whichever comes first, so it can never hang waiting for a signal that might not come
- Kept the off-screen video fix from v3.11.1 (that part was correct and should still resolve black frames on newer iOS)

## v3.11.1 — Fixed black video frames on newer iOS versions
- Real clue from a beta tester: black frames happened on a phone running a NEWER iOS version than another phone that worked fine — pointed to a specific, known category of bug
- Root cause: the hidden video player used `opacity:0` to stay invisible. Newer iOS/Safari versions have gotten stricter about power-saving for elements that are technically invisible this way, and can skip real frame decoding entirely for them
- Fixed by moving the hidden video off-screen instead (still fully rendered as far as the browser is concerned, just physically outside the visible area) — a more universally reliable "hidden but real" technique
- Also added an extra readiness check: now waits for actual decoded frame data, not just video metadata (duration/size), before starting to grab frames — closes another possible timing gap on newer iOS versions

## v3.11.0 — Pick your AI coach's personality
- New 4th onboarding question: choose your coach's tone — 🔥 Hype (high energy, cheering you on), 🎯 Serious (direct, no-nonsense), or 😄 Funny (jokes around while still helping)
- This isn't just cosmetic — it's actually wired into the AI: drills, video feedback, and daily routines are all written in your chosen tone from now on
- Saved to your account, so it's remembered across sessions (loads automatically when you log in, not just right after onboarding)
- Verified with an automated test that all 4 onboarding steps transition correctly, including the new coach step
- New database column: user_profile.coach_personality (added to the same setup_user_profile.sql file from before)

## v3.10.1 — Restyled cookie banner to match reference design
- Changed from a dark, full-width bar to a white floating card with rounded corners, matching a reference style
- "Manage" is now a light gray button, "Accept" is a dark button with white text, side by side
- Verified with an automated check that colors/styling render correctly before shipping
- Wording stayed accurate to what Gritto actually does (didn't copy generic "analyze web traffic" language from the reference, since that's not true here)

## v3.10.0 — Accept & Manage Cookies
- Cookie banner now has two buttons: **Accept** and **Manage**
- "Manage" opens a panel showing exactly what's used, in plain categories: Essential (sign-in, always on), Google Sign-In (cookies Google itself sets during login, governed by Google's own policy), and Advertising & tracking (none — Gritto uses none)
- Added a "Manage Cookies & Local Storage" link in Settings → Legal, so this can be revisited anytime, not just on first visit
- Updated the Privacy Policy page to match, with a dedicated section on Google's sign-in cookies

## v3.9.0 — First-time onboarding questions
- New welcome flow: the first time someone signs in with Google, they get 3 quick questions before landing on Home — main sport, biggest goal, and experience level (takes about 15 seconds)
- Answers pre-select their sport automatically and personalize Home's greeting with their goal
- "Skip for now" option available at any point — never blocks someone from using the app
- Only shows once per person (tracked in a new database table), never shows again after completing or skipping
- New database table: user_profile
- Verified with an automated test that all 3 steps transition correctly and the Continue button enables/disables properly based on selections

## v3.8.0 — Cookie / local storage notice
- New banner that shows once (first visit) explaining that Gritto uses your device's local storage — mainly to keep you signed in — not third-party tracking cookies
- Includes a link straight to the Privacy Policy, and a "Got it" button that dismisses it for good (remembered via local storage itself)
- Added a matching "Cookies & local storage" section to the Privacy Policy explaining exactly what's stored and why, and confirming none of it is used for tracking or shared with advertisers

## v3.7.1 — Added injury/liability disclaimer to Privacy Policy
- New "Physical activity & injury" section: makes clear that drills/routines are done at your own risk, encourages warming up, stopping if something hurts, checking with a doctor first, and parent supervision for young athletes
- States that Gritto and its creator aren't responsible for injury, loss, or damage from following the app's suggestions

## v3.7.0 — Privacy Policy & Terms page
- New standalone page (`privacy.html`) explaining what Gritto collects, how it's used, where it's stored, and your choices — written honestly to reflect what the app actually does
- Linked from a new "Legal" section in Settings
- Covers: Google login data, activity/streak data, video thumbnails (not full videos), feedback messages, third-party services used (Supabase, Anthropic), data deletion options, and a note for parents
- Includes an honest disclaimer that this is a basic policy for a personal beta project, not formal legal advice — worth a real legal review if Gritto ever becomes a public/commercial product

## v3.6.0 — "New version available" toast
- After logging in, the app now quietly checks the live site (bypassing any cache) to see if a newer version has been deployed than the one currently loaded
- If so, a toast slides up from the bottom: "A new version of Gritto is ready" with a Refresh button
- This helps catch cases where a browser (or the service worker from push notifications) is holding onto an old cached copy of the page
- Only checks once per visit, right after login — doesn't repeatedly poll

## v3.5.0 — Debug panel now shows device + OS info
- The debug panel now always shows a line at the top like "iPhone · iOS 17.4.1 · Safari · Home screen app" — visible the moment you open it, no scrolling needed
- Also shows screen size/resolution, and whether they're using the home-screen version or a regular browser tab
- This info is automatically included whenever "Copy" is tapped, so bug reports come with device context built in
- Honest limit: browsers intentionally don't expose the exact phone model (like "iPhone 15 Pro") for privacy reasons — this shows device category and OS version, which is the most detail actually available

## v3.4.1 — Fixed completely black video frames
- Confirmed the nav fix from v3.4.0 held (nav was correctly positioned in your tester's screenshots)
- Found a new, different bug: all 5 captured frames were solid black on this tester's phone
- Root cause: the hidden video player used to grab frames was created purely in memory and never actually attached to the page — on some phones, capturing frames from a video that isn't part of the live page silently produces blank black output instead of real content
- Fixed by attaching it invisibly (zero-size, transparent, not interactive — nothing visible changes) so frame capture actually works correctly
- Added proper cleanup so this hidden element never lingers after an upload finishes or fails

## v3.4.0 — Nav floating bug actually fixed (structural rewrite)
- After three failed attempts at patching `position:fixed`/`position:sticky`, switched strategy entirely: restructured the page so the nav bar is no longer positioned relative to scrolling at all — only the main content area scrolls internally now, while the nav sits outside it as a plain, permanently-visible element
- This makes the "nav floats/detaches" bug structurally impossible, rather than trying to out-clever iOS Safari's known quirks with fixed/sticky positioning one more time
- Verified with an automated test: the nav's on-screen position is provably identical before and after scrolling, while the content area genuinely scrolled underneath it
- Moved the footer into the scrollable content area (it needed to move as part of this restructure, otherwise it would've been cut off)
- Regression-tested: video hang fix, blank-frame retry, sport-required guard, and extraction logging all confirmed still intact

## v3.3.1 — Fixed slow/failing video extraction + added real visibility
- Found the likely cause of the 30-second timeout using a real debug log from a tester: a 67-second silent gap right before it failed, meaning the app was stuck doing something internally with nothing showing in the log
- The "retry if frame looks blank" safety net (added a few versions back) was almost certainly too trigger-happy — flagging genuinely fine frames as "blank" and burning through the whole time budget retrying them for nothing
- Made the blank-detection much less aggressive, reduced retries from 3 to 2, and shortened per-frame and overall timeouts so a stuck extraction fails faster instead of burning 30+ seconds
- Added real logging throughout the extraction process (which frame is being captured, when a retry happens) — next time something's slow, the debug panel will actually show what's happening instead of going silent
- Also audited every database table's permissions project-wide — everything currently in use checked out fine; added one small missing permission (user_progress delete) for future completeness

## v3.3.0 — Two real fixes (regression-tested)
- **Nav floating, take 3:** the previous attempts both tried to patch `position:fixed`, which iOS Safari has known, hard-to-predict issues with. Switched to `position:sticky` instead — a fundamentally different, more reliable approach for this exact scenario, not another patch on the same broken foundation. Removed the old JS workaround since it's no longer needed.
- **Role selector not showing after video frames loaded:** found the real cause — nothing was stopping someone from starting a video upload before picking a sport. Frames would extract fine (that part doesn't need a sport), but the "who are you in this play" step silently refused to show since it needs to know the sport to know which roles to offer — with zero explanation why. Now it tells you to pick a sport first, before even starting.
- Ran a full regression check before shipping: confirmed the frame-extraction hang fix, blank-frame retry, and all other previously-fixed behavior are still intact

## v3.2.2 — Fixed nav moving during normal scrolling/pull-down
- Found the cause: the nav-pinning fix from before was reacting to *every* scroll on the page, including Safari's natural "bounce" effect when you pull down past the top — not just the keyboard/picker situations it was actually meant to correct for
- Removed that overly broad listener; the nav now only repositions for genuine visual-viewport changes (keyboard, file picker, pinch-zoom), not normal scrolling
- Verified with an automated test simulating a scroll event — confirmed the nav no longer moves for it

## v3.2.1 — Fixed stale version number
- The version shown in Settings was stuck at "v3.0.0" this whole time — I forgot to actually update that number in each of the last several releases (v3.0.1 through v3.2.0)
- This means the version number was never a reliable way to check what code someone actually has installed — now corrected to show the real current version

## v3.2.0 — Push notification reminders
- New "Reminders" toggle in Settings — turns on real push notifications if you haven't done your routine yet
- A daily automatic check (runs once a day) finds everyone who hasn't completed their routine today and sends a gentle nudge
- Works even when Gritto isn't open — a real notification, not just an in-app banner
- **Important iPhone limit:** only works if Gritto has been added to your home screen — regular Safari tabs can't receive push notifications
- New database table: push_subscriptions (each device that turns reminders on gets one row)
- New files: sw.js (service worker, required for push), 2 new server functions, package.json, vercel.json (schedules the daily check)

## v3.1.1 — Fixed video upload getting stuck forever
- Found the cause: the "retry if blank" feature added last update could sometimes ask the video to seek to a moment it was already at (especially near the end of short clips) — when nothing actually changes, the browser never signals "done seeking," so the app was waiting forever for a signal that would never come
- Fixed by detecting that situation upfront and continuing immediately instead of waiting
- Added a backup timer too: if a single frame ever takes more than 1.5 seconds for any reason, the app moves on with whatever it has instead of waiting indefinitely
- Added one more overall safety net on top of that, so the process can never get stuck for good

## v3.1.0 — Smarter frame capture + more reliable nav pinning
- **Blurry/blank video frames:** the earlier fix helped but wasn't enough on its own. Added a real safety net — after capturing each frame, the app checks if it looks suspiciously flat/blank (like plain sky or an overexposed wall) by measuring how much the pixel brightness varies, and automatically tries a moment slightly earlier or later if it does, up to 3 attempts
- **Nav floating on iOS:** the previous CSS-only fix wasn't reliable enough for this specific iOS bug. Added a JS-based fix using the VisualViewport API, which tracks the phone's true visible screen area in real time and actively keeps the nav bar pinned to it — the standard, more robust fix for this class of iOS Safari bug

## v3.0.2 — Quieter debug panel
- Filtered out MediaPipe's normal internal startup logging (WebGL context creation, WASM file loading, etc.) from the debug panel — none of it was ever actually a problem, it was just noisy library chatter that made real errors harder to spot
- The debug panel now only shows things worth actually looking at

## v3.0.1 — Actual gear icon + fixed wrong video frames
- Replaced the "sun ray" looking icon with a real toothed gear (8 teeth + a hollow center), like a normal settings button
- Fixed a real bug causing wrong/unrelated frames during video upload: the app was only loading minimal video info upfront, which on some phones let the browser report a frame "ready" before it had actually finished decoding the correct one — fixed by buffering more upfront and waiting for the real frame to actually paint before capturing it

## v3.0.0 — New Settings page
- Added a 4th bottom-nav tab: **Settings**
- Profile card (name, email, photo) with a proper Sign Out button
- App info: current version number, beta status
- "How Gritto works" — a short explanation of each page, plus the coaching disclaimer
- Manage my data: clear video history or clear your whole activity log, each with a confirmation first
- Send feedback / report a bug — a simple message box that saves your note (viewable later in Supabase's Table Editor)
- New database table: feedback_reports (write-only for users — you view submissions directly as the owner)
- Fixed a missing permission: drill_history was missing a delete policy, needed for "Clear my activity log" to actually work
- Note: Premium/payments and an admin analytics dashboard were intentionally left out of this — that's a bigger, separate project involving real payment processing, planned for later

## v2.9.2 — Clarify older video entries + widen match window
- Confirmed: your earliest video checks predate the video history feature (v2.7.0), so there's genuinely no thumbnail/breakdown to link to for those — not a bug, just missing historical data we can't recreate
- The app now says so directly instead of silently falling back to plain text, so it's clear why
- Widened the matching time window (1 min → 5 min) between a Recent Activity entry and its Video History record, in case a slow connection ever pushed the two save times further apart than expected

## v2.9.1 — Video activity taps into the full video view
- Tapping a "Video check" entry in Recent Activity now scrolls to and opens that session in the "Your video history" section — same rich view with the thumbnail, good/fix breakdown, and drills — instead of a plain text box
- Added the thumbnail image itself to that detail view (it only showed text before)
- Drill/Routine entries in Recent Activity are unaffected — still expand in place as before

## v2.9.0 — Tap Recent Activity for full details
- Tapping any Recent Activity item now expands it to show more
- For Drills/Video entries: shows the full, untruncated text instead of the cut-off preview
- For Daily Routine entries: shows the actual steps you did that day (name, time/reps, and cue for each), not just the goal text
- New database column: drill_history.items — saves a snapshot of the routine's steps at the moment you complete it, so it stays accurate even if you later edit or delete that routine

## v2.8.1 — Three bug fixes
- Fixed bottom nav floating/detaching from the bottom of the screen on iOS during video upload — a known iOS Safari quirk with fixed-position elements, fixed by forcing the nav onto its own GPU layer
- Fixed the Daily Routine icon in Recent Activity — it was literally missing two pieces (a copy-paste mistake when it was first built), so it looked broken/incomplete
- Fixed video check summaries in Recent Activity getting cut off mid-sentence with no indication — now adds "…" whenever text is actually truncated

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
