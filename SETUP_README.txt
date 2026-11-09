LOCK IN 2027 — CLOUD SYNC SETUP
================================
This release sends a private, read-only widget snapshot from the website to Supabase.
The website's browser-local data remains authoritative. This is NOT a full multi-device
backup or bidirectional data sync. Keep exporting JSON backups.

1. BEFORE UPDATING: Open existing LOCK IN website > Settings > Export JSON backup.
   Keep a copy somewhere safe. The cloud update should not delete local data.

2. Create a Supabase project at https://supabase.com/dashboard.
   In SQL Editor, run the full contents of supabase_setup.sql.
   Confirm Row Level Security (RLS) is enabled on public.widget_snapshots.
   Do NOT disable RLS. Do NOT create a public read policy.

3. In Supabase > Project Settings > API (or API Keys), copy:
   - Project URL, e.g. https://abcdefgh.supabase.co
   - PUBLISHABLE key (sb_publishable_...) or legacy anon key.
   Never use sb_secret_... or service_role in any file in this ZIP.

4. cloud-config.js is already configured with your public project URL and key.
   This file is public in your GitHub Pages repository.

5. Upload these website files to the ROOT of your GitHub Pages repo:
   index.html, cloud-config.js, sw.js, manifest.webmanifest, icon.svg.
   Keep existing other files as needed. Wait for GitHub Pages deployment.

6. Open the published website. In Settings > Widget cloud sync:
   - Create account with email/password (if new) or sign in.
   - If email confirmation is enabled, check email and sign in afterwards.
   - Press Sync now. Confirm 'Synced'.
   If the account creation requires email confirmation, the site must be
   included in Supabase Auth URL Configuration allowed redirect URLs.

7. LOCK_IN_2027_Widget.js is already configured with your public project values.
   Copy script into Scriptable on iPhone. Run once inside Scriptable.
   Enter SAME Supabase email/password. Scriptable stores these credentials
   in the iPhone Keychain; they are NOT embedded in the widget script.
   Avoid sharing an exported Scriptable backup that might expose account details.

8. Add a MEDIUM Scriptable widget on the Home Screen and choose this script.
   Widget reads the latest cloud snapshot; it does not need website open.
   iOS controls refresh timing, so updates are not instantaneous.

9. TEST:
   - Website Settings > Sync now, check 'Synced'.
   - Run Scriptable script manually, check workout/weekly target.
   - Change a workout or manual override in website and save.
   - Wait ~2 seconds, check 'Synced', then manually rerun Scriptable.
   - Turn off network: widget should show OFFLINE CACHE (after first success).
   - Verify past logs and JSON export remain unchanged.

LIMITATIONS:
- Widget snapshot sync is one-way; browser-local full data isn't backed up to cloud.
- The website must be opened online to send newly saved changes.
- iOS decides Home Screen widget refresh timing.
- No real Supabase account is provisioned in this ZIP; you must create it.
- End-to-end live-cloud integration has not been tested with real credentials.
- If a widget login fails after a password change, clear the script's saved
  Keychain entries or reinstall the script with a changed KC identifier.
