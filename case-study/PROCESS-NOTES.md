# Process notes and evidence — Capy Springs

Backing material for the case study: the decision log, the raw harness findings, and the numbers behind every claim. Useful if someone asks a follow-up question in an interview, or if you want to expand a section of the page.

---

## 1. How the project actually ran

| Phase | What happened | Artefact |
|---|---|---|
| **Concept** | Four complete one-page game concepts written and judged against one question: *what is the thing you do with your thumb, and is it interesting on its own?* Capy Springs won on "leading" over "carrying". | — |
| **Specification** | Two documents written before any code: a 677-line game design document (rules, numbers, cast, UI spec, art direction, audio direction, a second-by-second onboarding script) and a 1,341-line technical architecture (module contracts, data tables, save format, performance budgets, the test harness spec). | `docs/GAME_DESIGN.md`, `docs/ARCHITECTURE.md` |
| **Pre-build review** | A revision pass over both documents *before* building — this is where the cable-car cadence was standardised to dock-to-dock, coin trays replaced floor coins, offering steps replaced glowing pads, and the 12 arrow rules were written. | Revision 1.2 changelist at the top of the design doc |
| **Build** | Implemented as 39 modules against the specification, with the harness stubbed first so the whole thing loaded and ran with zero console errors from the first hour. | `src/`, 5,676 lines |
| **Balance pass** | The simulator run against the design's target curve; two rule-ordering failures found and fixed; the hand-derived economy table replaced with measured data; both documents patched to match. | `CHANGELOG.md`, `test/balance/seed7.csv` |
| **Review pass** | A fresh-eyes review of the finished build, focused on state loss and platform quirks. Three real fixes (below). | `CHANGELOG.md` |

**Rule that made this work:** if the code and the documents ever disagreed, **the code won and the documents were patched**. The specification is a living record of the design, not a historical artefact. Every deviation found during the build is listed in `CHANGELOG.md` with the reason.

---

## 2. The two harness findings, in full

### Finding 1 — the arrow never pointed at an unlock

**The documented rule order** put `LIGHT` (spend coins on the next unlock) below `LEAD` (pick up a waiting guest) and `COLLECT` (gather coins from a tray).

**What the simulator showed:** once cable cars reached level 1 — five guests every 21 seconds — there was *always* a guest waiting on the platform, so `LEAD` matched on every frame and `LIGHT` was never reached. After the first lantern, the guidance system never pointed at another unlock for the rest of the session.

**The fix:** `LIGHT` moved above both `LEAD` and `COLLECT`.

**The justification, which only existed because it had been measured:** lighting a lantern takes 1–2.5 seconds. Platform patience is 40 seconds. The detour costs nothing, so priority should follow progression, not urgency.

**Why it generalises:** a priority list built from "what is most time-sensitive" fails when one category is *continuously* available. Continuous availability, not importance, is what starves a priority list.

---

### Finding 2 — the infinite firewood shuttle

**The documented rule:** if you are carrying logs and the boiler is not full, go to the boiler.

**What the simulator showed:** walking past the woodpile auto-picks up logs. Carrying logs triggers the rule. Delivering them routes the player back past the woodpile, which picks up more logs. The bot walked between the two points for the rest of the session.

**The result:** 158 chained Steam Rushes and **78% of all guests lost**. The bot had found the highest per-guest multiplier in the game and reached it by abandoning every guest.

**The fix:** logs are urgent only while heat is under 40 or the water has gone cold. Otherwise the rule is re-checked after the collection rule, so logs ride along in the trail and are dropped off after the next collect.

**Why it generalises:** two subsystems that each look correct in isolation can form a loop. You find loops by running the system, not by reading it.

---

### What these two have in common

Both would have presented to a human playtester as **bad feel**, not as broken logic:

- Finding 1 feels like "progression is too slow, maybe increase payouts."
- Finding 2 feels like "the boiler is annoying, maybe slow the heat drain."

Both diagnoses are wrong, and both would have led to days of tuning numbers that were already correct. The simulator turned a feel problem into a rule-ordering problem visible in a diff. **That is the argument for the method.**

---

## 3. Other real fixes from the review pass

| Issue | Fix | Why it matters |
|---|---|---|
| Offline earnings were lost if the phone locked while the "Welcome back" card was still open — the state was recomputed over the top | The save timestamp is held until the player taps COLLECT; a resumed tab keeps the card instead of recalculating | A player who puts the phone down mid-greeting loses nothing. Reward state must survive interruption, because interruption is the normal case on a phone |
| On iOS, an audio context suspended in the background stayed silent forever | Audio unlock made idempotent, and re-run on every gesture and on visibility return | Silent audio is invisible in testing and obvious to a player |
| The settings popover drew its Reset row outside its own panel | Panel height corrected to 300 px | Found in a browser pass, not by the simulator — a reminder that automated testing does not replace looking at the thing |

---

## 4. Measured session data

From `assets/data/balance-seed7.csv` — a 30-minute automated session, one row per simulated minute.

| Play time | 2 min | 5 min | 10 min | 20 min | 30 min |
|---|---|---|---|---|---|
| Cumulative coins earned | 287 | 1,678 | 4,963 | 15,206 | 32,078 |
| Income rate | 72/min | 434/min | 797/min | 1,173/min | 1,200/min |
| Guests served | 24 | 88 | 202 | 464 | 776 |
| Guests lost | 0 | 0 | 0 | 0 | 0 |
| Three-guest chains | 7 | 32 | 50 | 76 | 92 |
| Five-guest chains | 1 | 9 | 22 | 50 | 80 |
| Steam Rushes | 0 | 5 | 14 | 28 | 35 |
| Unlocks lit | 3 | 6 | 9 | 12 | 14 |
| Trail capacity | 5 | 5 | 8 | 12 | 12 |

**Caveats to state honestly if asked:** the bot is a *perfect* player — it never hesitates, never misses a chain and buys every upgrade the moment it is affordable. A human curve runs below this. `guestsLost = 0` is a property of the bot, not a claim about human play; do not chart it. Other seeds land within 12% at 20 minutes (seed 3: 19,009; seed 11: 16,898).

**The pacing this produced**, which is the number that actually mattered: first unlock at 12 seconds, first helper hired at 2:35, third bath at 5:06, finale at ~25 minutes. All within a quarter of the schedule designed on paper — which is why **no payout was changed**. The hand-built table was wrong in magnitude because it had not accounted for upgrade spending; the game underneath it was right.

**The guard rail that stays in place:** the harness prints a balance warning if income ever exceeds the measured curve by 40%, and names four tuning knobs to turn, in a fixed order. Lantern costs are explicitly off-limits, because they set pacing rather than income.

---

## 5. The harness in one page

```
node test/headless.js --seconds 1800     30 minutes of play, ~3 seconds of wall clock
node test/headless.js --fuzz 300         5 minutes of random input
```

**How it works.** It reads the real `index.html`, loads the same 39 source files into a stubbed browser environment, and steps the real game at a fixed 1/60 s. The bot plays by calling the same function that draws the on-screen guidance arrow — so the thing under test and the thing the player sees are the same system.

**Invariants, checked once per simulated second:**

- No guest occupies two seats; every guest in the line is referenced exactly once; no guest outside the line holds a slot
- Nothing is stuck: no log waits in the line more than 20 s while heat is full, no fruit more than 30 s
- The camera never inverts — checked at both a 960 px and a 1200 px screen height
- Coordinates stay finite and inside the world; no pool exceeds its cap
- The save round-trips: serialising, reloading and re-serialising produces an identical string
- Presentation never touches the seeded random number generator, so a run produces identical numbers with or without rendering
- A rendering smoke test runs every 10 simulated seconds against a stub drawing context strict enough that a single misspelled canvas call throws

**Progression checkpoints:** first unlock and two chains by 30 s · 200 coins by 2 min · third bath, a helper, a Steam Rush and a five-chain by 10 min · fourth bath and two night events by 20 min · under 15% of guests lost by 30 min. Floors are set at 70% of the measured curve, so ordinary tuning does not trip them but a regression does.

**Fuzz mode additionally:** random direction changes, random taps at random screen coordinates, random upgrade purchases, the sheet opened and closed at random, and the phone "locked and unlocked" every 30 seconds with the clock shifted by a random 0–6 hours — which is how the offline-earnings path gets exercised hundreds of times per run.

---

## 6. Scope discipline

Three tiers, fixed on day one, and they held.

| Tier | Contents | Status |
|---|---|---|
| **Core** | Movement, the line, three baths, chains, heat and rushes, fruit and golden baths, coins and trays, unlocks, the upgrade sheet, one helper, the 12-rule guidance system, procedural art, synthesised audio, save and offline earnings, the harness | Shipped |
| **Plus** | Snack stall and food orders, second helper, the night event, the finale and its levelled rewards, Golden Cars, the settings popover | Shipped |
| **Stretch** | A crow micro-event, a dash move, a speed upgrade, a second zone, prestige, daily goals, cosmetics, photo mode | Specified, not built |

Everything in Stretch is written down in priority order. Nothing was cut in a panic; the line was drawn before the work started. The finale already lands at ~25 minutes, and adding to the middle would have thinned it.

---

## 7. Claims you can make, and their evidence

| Claim | Evidence |
|---|---|
| 2,018 lines of specification before code | `docs/GAME_DESIGN.md` (677) + `docs/ARCHITECTURE.md` (1,341) |
| 39 modules, 5,676 lines, zero dependencies, zero asset files | `src/`; `index.html` loads 39 scripts; no package.json, no image or audio files anywhere |
| 30 minutes of play verified in ~3 seconds | 108,000 steps at 1/60 s; the harness runs 30–60k steps per second |
| 12 guidance rules, 7 one-word prompts, no tutorial screens | Design doc §10.6 and §13 |
| 26 synthesised sound effects, no audio files | Design doc §12 |
| 776 guests served, 0 lost in a 30-minute run | `assets/data/balance-seed7.csv`, final row — bot play, not human |
| 60 fps budget: 12 ms frame, 2 ms step, ≤150 sorted objects | Architecture §18; the debug overlay turns red when exceeded |
| Two design bugs found by simulation | `CHANGELOG.md`, 1.2.0 deviations |
| Screenshots are from the running build | `tools/shoot.js` regenerates all 12 in about three minutes |

---

## 8. Honest limitations

State these rather than hide them; they make everything else more credible.

- **No physical-phone session yet.** Verified by the simulator and in a mobile-sized browser at 375 × 812. A 20-minute session on real glass with the performance overlay on is the next step, and feel on glass is the one thing neither the spec nor the simulator can report.
- **No human playtesters yet.** Every behavioural claim in this package comes from the design or the simulator. There is no retention, session-length or completion data, and there should be no implication that there is.
- **Not published.** No store build, no downloads, no users. It runs from a file.
- **One of the balance seeds is the reference.** Three seeds were run and land within 12% of each other at 20 minutes, but the tuning targets come from seed 7.
