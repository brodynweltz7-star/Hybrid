LOCK IN — READABLE WORKOUT EDITION

INSTALL
1. On your existing LOCK IN website, open More > Settings and export a JSON backup.
2. Unzip this package. Upload the contents of LOCK-IN-FINAL/ (index.html, sw.js, manifest.webmanifest, icon.svg) into the ROOT of your existing GitHub Pages Lock-In repository. Do not upload the containing folder itself.
3. Commit changes. Allow GitHub Pages to publish, then close and reopen the site. If the old version appears, refresh while online; the service worker cache name was updated.
4. Confirm your past logs are still visible. If not, use the app's Import Backup option.
5. Enter your real average weekly km and comfortable long-run distance under More > Settings. Until then, daily distances are PROVISIONAL examples, not personalized training prescriptions.

WHAT'S INSIDE
- Serious black/charcoal/red layout; 5 main destinations
- Today-first workout, detailed weekly running prescriptions and gym logs
- Correct 10K PB: 44:08 and revised pace ranges
- Race-specific half marathon, backyard ultra and marathon phases
- Physique, motivation, readiness check-ins, progress and JSON backups
- Same browser localStorage key as prior versions

IMPORTANT
- Pace ranges and progression are guidance, not a medical assessment or fixed promise. Adjust to fitness and symptoms. The ultra is a demanding event; resume marathon training only after adequate recovery.
- Browser storage is device/browser specific. Export backups regularly.
- Website is not automatically published; you must update GitHub Pages.

UPDATE: Removed RPE labels, separated workout directions into numbered steps, and simplified the workout headings. Existing browser data storage key is unchanged.

DESIGN FINAL: Consistent spacing, workout hierarchy, readable instructions, mobile navigation, touch targets and accessibility. Training prescriptions and saved-data key unchanged.

ADAPTIVE UPDATE:
- Automatic, conservative future weekly mileage ceilings after logged completed weeks (up to 8% from last completed week, less after missed runs).
- Manual weekly target and daily distance/pace overrides, preserved in backup.
- Gym next-weight suggestions based on completed sets, with manual override.
- Manual pace offset; running pace changes are NOT inferred from ordinary workouts.
- Same localStorage key as before; no logs deleted. Export backup before replacing site.
- No cross-device sync; adaptation only sees data on the device/browser where workouts are logged.

QUALITY RELEASE v21: Completed runs only in adaptive totals, missed-run cap, validated overrides, corrected manual distance instructions, 2-loop ultra rehearsal fallback, smaller-screen gym input layout. No change to saved-data key. Export backup before deployment.

POLISHED RELEASE: Completed-only mileage on dashboard; adaptive future week uses real completed history; partial weeks cannot raise mileage; safer backup validation; phase display corrected. No storage key or workout history reset.

FINAL REFINEMENTS: completed-only progress statistics; no automatic mileage increase after a training gap; opt-in verified-race-based pace adjustment capped at 15 sec/km; gym progression requires all logged sets; validation for distance/HR/weights; backup reminder. Existing data key and logs preserved.

RUN DISTANCE FIX: Standard distances round to 0.5 km, preserve weekly sum, ensure quality run >=7 km when possible, and prevent partial workout logs from shrinking all future runs. Manual weekly overrides remain exact; mileage is provisional until consistent completed weeks exist.

Saturday threshold update: Base-phase Saturdays are always structured threshold workouts, never 'OR easy'. Later Saturday long runs stay long runs to protect race preparation. Backup saved data before updating.

Calendar fix: the middle button now shows 'Current week' (disabled) while browsing the current week and 'This week ↩' while browsing other weeks. Arrows move week-by-week and the date range updates. The button is a jump-back action, not a date indicator.

PERSONALIZED RUN HISTORY
Imported once, without overwriting existing logs: 2026-09-19 15 km; Oct 7 7.58 km; Oct 9 2.4 km; Oct 12 13.05 km; Oct 14 8.20 km; Oct 16 9.10 km.
This is not the complete set of ten runs; four runs lack independently confirmed dates/distances in the available history.
Known times and paces only. Base schedule now starts at 34 km provisional rather than 28 km; automatic progression remains conservative.
Back up current app data before updating; history is stored locally in your browser, not on GitHub.

Training calendar begins Monday October 19, 2026; earlier run history is kept for adaptive planning but not shown as program weeks.

REAL ADAPTIVE UPDATE: Uses completed weekly mileage, number of completed runs, and longest recent logged runs; avoids catch-up mileage and reduces intensity after missed weeks. Race-derived paces remain anchored to verified PBs. Manual overrides take precedence. First week October 19, 2026. Existing data key preserved. Back up before uploading.

COACH-REVIEWED UPDATE
- Considers zero-run completed weeks instead of silently ignoring them.
- Cautious response to training gaps, missed runs and symptom-related log notes.
- Explains intensity adjustments in the calendar.
- Introduces hourly-loop rehearsals in spring half-marathon long-run weeks when mileage supports it, replacing rather than adding to long-run distance.
- Lower-body lifting deloads when returning from a training interruption.
- After ultra recovery phase, marathon training requires explicit user confirmation; no automatic forced return.
- Preserves original storage key, saved logs, overrides and visual design.
- This is not a medical or independently validated coaching algorithm.

2026-10-25 UPDATE: Corrected July 31 ultra date and recovery boundary; five-run default for new users; base long run moved to Sunday; Wednesday base run easy; lower Tuesday and upper sessions Monday/Thursday; Saturday threshold skipped during deload/caution. Existing stored run-day preference is retained. Not clinically validated; verify training load and workouts before relying on it.

V30 QA PASS (2026-10-25): Corrected July 31 race-phase boundary, five-run default for new installations, conservative missed-week handling, base-phase upper/lower placement, and pace guidance. Existing saved user preferences remain unchanged; change Runs per week to 5 in Settings if desired. This is not a medically validated training algorithm.

GUIDED RECOVERY VIDEO UPDATE: Verified Yoga With Adriene 20- and 30-minute follow-along videos on rest days, plus clearly labeled YouTube search links for warm-up and post-run stretching on running days. All open in new tabs and are optional.
