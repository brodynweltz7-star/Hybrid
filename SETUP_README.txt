LOCK IN 2027 — PREMIUM FOUR-RACE RELEASE
================================
UPGRADED NOVEMBER 2026
--------------------------------
This version has a clean charcoal/red interface, honest actual-vs-planned
metrics, race-aware coaching, editable backdated records, an improved medium
widget, a corrected service worker for offline fallback, and excused absences.

MISSED RUN / GYM REASONS (NEW)
--------------------------------
- Open your seven-day plan and select the date (including future travel dates).
- Under "Schedule changes", choose "Missed or away?" for the RUN or GYM
  independently. Choose Travel / away, Work / schedule, Illness, Injury / pain,
  Recovery / fatigue, Personal / family, or Other. Add an optional note.
- Save. The session shows "Planned absence" if in the future, or "Excused
  absence" on/past its date. You can edit or remove it at any time.
- For historical dates, browse to that week to add a reason retroactively.
- Excused means NOT completed. It does not add any actual kilometres or gym
  exercises, does not schedule a make-up workout, and does not falsely claim
  you trained. Actual sessions can still be entered later; logging completion
  automatically clears the relevant excuse.
- The medium widget will display the reason after the website is synced. Its
  weekly goal excludes the distance of excused runs, but the original scheduled
  total remains available in the cloud snapshot for honest comparisons.
- Progression still checks actual completed training for safety; extended
  time away may require an easy return, even though an absence is excused.
- The new reasons are saved in the existing local browser data and JSON backup.
  No SQL changes or new accounts are required.

REQUIRED WEBSITE FILES (put ALL in the GitHub Pages repository root):
  index.html
  race-coach.js
  premium-ui.js
  premium.css
  cloud-config.js
  sw.js
  manifest.webmanifest
  icon.svg

The two NEW premium files are required. If either is missing, the redesign
will not appear. Keep their names unchanged. The widget script and SQL setup
file are separate; do not upload those to the public site.

Training calendar:
- May 2, 2027: Toronto Marathon — finish first; sub-4 is a stretch, not a
  guaranteed or automatic target.
- May 30, 2027: Half marathon — PR only if fully recovered; event
  name not independently confirmed (do not assume River Run).
- July 31, 2027: Persistence Backyard Ultra — target 15 hourly laps (100.58 km).
- October 17, 2027: Detroit Marathon — finish first; PR only if ready.

Regular training weeks retain five runs (Mon easy, Tue threshold + Lower,
Wed easy, Fri track, Sun long) and three lifts (Tue Lower, Thu Upper A,
Sat Upper B). Marathon taper and post-race recovery override that layout
for safety. After Toronto, mark your comfortable return to easy running in
Settings before the app schedules half-marathon training. After the ultra,
confirm your comfortable return in Settings before rebuilding for Detroit.
These checks are manual coaching controls, not medical clearance.

The Oct–Nov 2026 recorded run data, occasional cycling, gym history,
localStorage key and widget snapshot data contract are preserved. No stored
run is invented, and planned mileage does not count toward progress.

This release sends a private, read-only widget snapshot from the website to Supabase.
The website's browser-local data remains authoritative. This is NOT a full multi-device
backup or bidirectional data sync. Keep exporting JSON backups.

1. BEFORE UPDATING: Open existing LOCK IN website > Settings > Export JSON backup.
   Keep a copy somewhere safe. The cloud update should not delete local data.

2. Since you have ALREADY connected and synced Supabase, KEEP that project.
   You do not need to run SQL again, create another account or change keys.
   If starting from scratch instead, create a project at
   https://supabase.com/dashboard, run supabase_setup.sql in SQL Editor and
   confirm Row Level Security is enabled on public.widget_snapshots.
   Never disable RLS or add a public read policy.

3. In Supabase > Project Settings > API (or API Keys), copy:
   - Project URL, e.g. https://abcdefgh.supabase.co
   - PUBLISHABLE key (sb_publishable_...) or legacy anon key.
   Never use sb_secret_... or service_role in any file in this ZIP.

4. cloud-config.js is already configured with your public project URL and key.
   This file is public in your GitHub Pages repository.

5. Replace the eight website files listed above in the ROOT of your GitHub
   Pages repo. Keep any unrelated repository files. Wait for Pages deployment,
   then refresh the site. If installed on your Home Screen, reopen it online
   to update its offline cache.

6. Open the published website. In Settings > Widget cloud sync:
   - Create account with email/password (if new) or sign in.
   - If email confirmation is enabled, check email and sign in afterwards.
   - Press Sync now. Confirm 'Synced'.
   If the account creation requires email confirmation, the site must be
   included in Supabase Auth URL Configuration allowed redirect URLs.

7. LOCK_IN_2027_Widget.js is configured with your project. Replace the code
   in your existing Scriptable widget to get the matching premium look.
   If the widget is already logged in, its credentials remain in Keychain.
   Otherwise run it inside Scriptable once.
   Enter SAME Supabase email/password. Scriptable stores these credentials
   in the iPhone Keychain; they are NOT embedded in the widget script.
   Avoid sharing an exported Scriptable backup that might expose account details.

8. Add a MEDIUM Scriptable widget on the Home Screen and choose this script.
   Widget reads the latest cloud snapshot; it does not need website open.
   iOS controls refresh timing, so updates are not instantaneous.

9. VERIFY ON YOUR OWN DEVICES:
   - Website Settings > Sync now, check 'Synced'.
   - Run Scriptable script manually, check workout/weekly target.
   - Change a workout or manual override in website and save.
   - Wait ~2 seconds, check 'Synced', then manually rerun Scriptable.
   - Turn off network: widget should show OFFLINE CACHE (after first success).
   - Verify past logs and JSON export remain unchanged.
   - Check Plan > Race Plan shows four races and the Toronto build/taper.
   - Check May 2, May 30, July 31 and October 17 show race days.
   - Check Settings for the post-Toronto and post-ultra recovery controls.
   - Check the charcoal/red visual design on your iPhone and medium widget.

ENGINEERING CHECKS DONE ON THIS RELEASE:
- All app and widget JavaScript syntax checked.
- 53 weekly schedules generated and checked for valid dates/distances.
- Normal 5-run, 3-gym schedule and all four race dates validated.
- After-race recovery gates, conditional forecasts and manual overrides tested.
- Existing run, gym and bike data reloaded successfully with no format migration.
- Widget contract tested with a simulated cloud snapshot and stale week.
- The service worker was repaired and syntax checked.
- Real-device visual QA and live Supabase authentication were NOT possible
  in the development environment. Confirm them after upload.

LIMITATIONS:
- Widget snapshot sync is one-way; browser-local full data isn't backed up to cloud.
- The website must be opened online to send newly saved changes.
- iOS decides Home Screen widget refresh timing.
- No real Supabase account is provisioned in this ZIP; you must create it.
- End-to-end live-cloud integration has not been tested with real credentials.
- If a widget login fails after a password change, clear the script's saved
  Keychain entries or reinstall the script with a changed KC identifier.
