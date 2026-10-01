# Portfolio build brief — Capy Springs case study

**Hand this whole `case-study/` folder to Claude (or any assistant/developer) and paste the prompt in section 0. Everything needed to build the page is inside the folder.**

---

## 0. The prompt to paste

> Build a case study page for my portfolio from the attached `case-study/` folder.
>
> - `CASE-STUDY.md` is the source narrative. Use it as the content of record — you may tighten sentences, but do not invent facts, metrics or quotes that are not in it.
> - `content.json` is the same content as structured blocks (hero, metrics, sections, image captions, tags). Use it to template the page.
> - `DESIGN-SYSTEM.md` has the game's real palette and type rules. Use them as accents; **do not let the game's colours override my portfolio's existing design system**.
> - `assets/screens/*.png` are 1290 × 2796 phone screenshots. Present them in a phone frame or at phone aspect ratio (9:19.5) — never stretched or cropped to landscape.
> - Follow the page structure, section order and image placement in `PORTFOLIO-BRIEF.md` sections 2–4.
> - Match my portfolio's existing typography, spacing and navigation. This page should look like it belongs to my site, not like a separate microsite.
>
> Target reading time: 6–8 minutes. The two things that must land are (1) the wayfinding system in section 6 and (2) the simulator findings in sections 9–11 — those are the sections that show product thinking rather than game trivia.

---

## 1. Decide this one thing first

The case study is written in an honest voice about how the game was built: **I designed it, Claude Code implemented it from my specifications.** Pick the framing line that matches how you want to present the work and use it consistently in the hero, the résumé bullet and the project card.

| Option | Use when | Line |
|---|---|---|
| **A — Recommended** | You want the AI-assisted workflow to be part of the story (it is a differentiator in itself, and it is what actually happened) | "Product design, systems design and UX specification. Built in vanilla JavaScript with Claude Code as my implementation partner — the specification documents were the interface between us." |
| **B — Design-led, short** | The site's other projects list role only | "Concept, systems design, UX specification, art direction and balance. Solo side project." |
| **C — If you want to foreground the engineering** | You are applying to design-engineer roles | "Design engineer, solo. Specified and shipped a complete Canvas 2D game — mechanics, interface system, art direction and an automated balance harness." |

Do **not** write "I coded 5,676 lines". Do write "a 5,676-line build, produced from 2,018 lines of specification I wrote." The second is true, is more interesting, and is the actual skill on display.

---

## 2. Page structure

Eleven sections. The number in brackets is the matching section in `CASE-STUDY.md`.

| # | Section | Source | Layout note |
|---|---|---|---|
| 1 | **Hero** | title, subtitle, role/year/stack meta | Full-bleed. Screenshot `02-core-loop.png` in a phone frame, tilted or centred. One-sentence description underneath. |
| 2 | **At a glance + headline numbers** | At a glance [—] | A 2-column meta table (What / Role / Build / Timeline / Outcome) and a row of 4–5 stat cards from `content.json.metrics`. |
| 3 | **Why I built this** | [1] | Text only. Keep it short — it is the "why should I read on" section. |
| 4 | **Constraints** | [2] | The six-row table, styled as cards or a definition list. Strong visual moment; do not bury it in body text. |
| 5 | **Concept & the genre-break table** | [3] | The "convention → what I did instead → what it buys" table is the best single artefact in the study. Give it room. Image: `02-core-loop.png` if not already used in the hero, else `12-cable-car.png`. |
| 6 | **The loop and its tempo** | [4] | Text + `03-splash-chain.png`. |
| 7 | **Onboarding — the first 30 seconds** | [5] | Render the timeline as a vertical timeline component, not a table, if your site has one. Image: `01-first-run.png`. |
| 8 | **Wayfinding — one arrow, twelve rules** | [6] | Show the 12-rule list in a monospace / code-style block. This is the section a hiring designer will read closely. |
| 9 | **The interface system** | [7] | HUD table + `06-upgrade-sheet.png`. Optionally pull the joystick paragraph into a callout. |
| 10 | **Art, motion and sound direction** | [8] | Palette swatches from `DESIGN-SYSTEM.md` + `07-lantern-night.png`. |
| 11 | **Designing with a simulator** | [9][10][11] | **The centrepiece.** Keep 9, 10 and 11 as one continuous run: the method, the two bugs it found, then the data it produced. Images: `05-steam-rush.png`, `08-late-game.png`. Render the balance table as a small chart if your site supports it (see section 5 below). |
| 12 | **Accessibility, performance, offline** | [12][13][14] | Can be compressed into one section of three short subsections + `09-offline-card.png`. |
| 13 | **What shipped & what I learned** | [15][16][17] | Close with the four "what I learned" points as pull quotes or cards. Final image: `11-full-inn.png`. |

**If you need a shorter page:** keep 1, 2, 4, 5, 8, 11, 13. Drop 3, 6, 9, 10, 12. The story still works — concept, constraints, the guidance system, the simulator, the lesson.

---

## 3. Image manifest

All screenshots are **1290 × 2796 px** (430 × 932 CSS at 3×, a modern phone viewport). Captured from the real build, not mockups.

| File | Shows | Suggested caption | Alt text |
|---|---|---|---|
| `01-first-run.png` | 20 s in: first guests soaking, soak rings, the first 20-coin unlock priced in the world | "Twenty seconds in. The first unlock is already visible and already affordable." | Mobile game screenshot: a fox stands by a hot spring where three capybaras soak, with a coin price of 20 shown beside a shrine lantern |
| `02-core-loop.png` | **Hero shot.** Trail of guests, a five-guest chain landing, coin tray, lantern price, joystick visible | "The whole loop in one frame — lead, chain, collect, and the next unlock priced in the world." | Mobile game screenshot: a fox leads a line of ducks past hot spring baths while a gold "x5" combo number pops above the water |
| `03-splash-chain.png` | A Splash Chain landing across a deck | "A chain landing: combo number, screen bump, ripple rings and a 40 ms freeze all on the same frame." | Mobile game screenshot: capybaras splashing into a hot spring with a gold combo number above them |
| `04-soak-and-pay.png` | Multiple baths occupied, coins arcing into trays | "Guests pay into a tray on the deck, positioned on the route you were already walking." | Mobile game screenshot: several capybaras soaking in two hot spring baths with coin trays on the wooden decks |
| `05-steam-rush.png` | Steam Rush active, heat bar over threshold, ribbon | "A Steam Rush chain — the reward for feeding the boiler between cable cars." | Mobile game screenshot: a hot spring scene with a steam rush banner and a full heat gauge in the top right |
| `06-upgrade-sheet.png` | Station bottom sheet: Soak / Seats / Tips, pips, locked states | "Three choices, level pips instead of numbers, and a lock glyph so affordability is not signalled by colour alone." | Mobile game screenshot: a bottom sheet titled Cedar Bath with three upgrade cards labelled Soak, Seats and Tips |
| `07-lantern-night.png` | Lantern Night: indigo tint, glowing lanterns | "Lantern Night: one multiply tint plus pre-rendered halo sprites — a whole mood inside the frame budget." | Mobile game screenshot: the same hot spring scene at night, lit by glowing paper lanterns |
| `08-late-game.png` | 25 minutes in: full inn, queues, trays holding 102 and 34 | "Twenty-five minutes in, with every system running at once." | Mobile game screenshot: a developed hot spring resort with three baths, a snack stall, helper characters and queuing guests |
| `09-offline-card.png` | "Welcome back" offline-earnings card | "Deliberately modest — generosity here would undercut the reason to play." | Mobile game screenshot: a welcome back card showing coins earned while away, with a collect button |
| `10-splash-x5.png` | A five-guest chain, the game's top combo | "Five guests inside a two-second window across two baths — the skill nobody is taught." | Mobile game screenshot: a five-chain combo number above a hot spring full of capybaras |
| `11-full-inn.png` | The complete inn in daylight, both helpers, golden yuzu water | "The finished inn: three baths, two helpers, a stall, a grove and a boiler." | Mobile game screenshot: a complete hot spring resort in daylight with golden yuzu baths and a full platform of capybara guests |
| `12-cable-car.png` | Cable car docked, guests disembarking | "The cable car is the game's heartbeat — every 18 to 25 seconds, all game long." | Mobile game screenshot: a red cable car docked at a stone platform as capybaras step off |

**Presentation rules**

- Always in a phone frame or at 9:19.5 aspect. Never crop to landscape, never letterbox onto a light background without a frame.
- Do not add drop shadows heavy enough to compete with the art; the art is already flat and shadowed.
- If the site has a lightbox, enable it — these reward full-size viewing.
- If you need an OG / social preview image: use `02-core-loop.png` or `11-full-inn.png`, centre-cropped to 1200 × 630 around the baths.

---

## 4. Visual direction for the page

The page should read as **your portfolio with a warm accent**, not as a game site.

- **Accent colour:** `#E4572E` (the game's single call-to-action vermilion). Use it for links, section rules and stat numbers. One accent only — that restraint is literally one of the design rules in the case study, so honouring it is on-brand.
- **Optional secondary:** `#FFC857` (amber) for stat card backgrounds or chart fills. `#2FA6A0` (bath teal) for a second chart series.
- **Background:** your site's normal background. If you want a themed one, `#F6F1E7` (cream) is the game's UI panel colour and is safe in light mode. Do not use the game's dark ink `#1F2430` as a page background unless your site is already dark.
- **Typography:** use your site's existing families. The game uses a bold geometric sans for UI; if you want an echo, make section numbers or stat figures heavier, not the body copy.
- **Motion:** subtle only. If you animate anything, animate the stat numbers counting up once on scroll — it mirrors the coin counter in the game. Do not add screen shake jokes.
- **Dark mode:** all screenshots carry their own background, so they are safe on dark. Swap the cream to your dark surface and keep `#E4572E` as the accent — it passes contrast on both.

---

## 5. Optional data visualisation

`assets/data/balance-seed7.csv` is the real minute-by-minute log from a 30-minute simulated session, 31 rows. It makes an excellent single chart for the simulator section.

- **Best chart:** a line of `earned` (cumulative coins) against `minute`, with markers where each new bath, helper or cable-car tier unlocked. The point of the chart is that the curve is smooth and the unlocks are evenly spaced — that is the pacing claim, shown rather than asserted.
- **Second best:** a small multiple of `combos5` (five-guest chains) and `rushes` per minute, showing skill expression increasing over the session.
- **Do not plot** `guestsLost` — it is zero for the entire run because the bot is a perfect player, and a flat zero line implies a claim about human play that the data does not support.

Useful columns: `minute, coins, earned, ratePerMin, lanternsLit, upgradesBought, guestsServed, guestsLost, combos3, combos4, combos5, rushes, chains, fullCars, nights, trailCap, carLevel, heat`.

---

## 6. Metadata and short copy

**Page title:** `Capy Springs — designing a one-thumb mobile game, and proving it worked before anyone played it`

**Meta description (155 chars):**
`A cozy offline mobile game designed from a 2,000-line spec and verified by a simulator that plays 30 minutes of it in three seconds.`

**Project card, one line:** `A one-thumb arcade-idle game — and a simulator that plays it 600× faster than you can.`

**Project card, two lines:**
`Concept, systems design, UX spec and art direction for a cozy offline mobile game.`
`Built with zero dependencies and zero asset files; balanced against 108,000 simulated frames.`

**Tags:** `Product Design` · `Systems Design` · `Game Design` · `Interaction Design` · `Design Engineering` · `Canvas 2D` · `AI-assisted build`

**Résumé / LinkedIn bullet:**
> Designed and shipped *Capy Springs*, a one-thumb offline mobile game — core loop, economy, interface system and art direction — specified in 2,000 lines of documentation and verified by a headless simulator that plays a full 30-minute session in three seconds, which caught two guidance-system failures that manual playtesting would have misread as bad feel.

**Elevator version, for a portfolio homepage or an interview:**
> I designed a cozy mobile game where you lead capybaras into hot springs. The interesting part is not the game — it is that I specified the whole thing precisely enough to be built without me writing the code, and then built a simulator that plays it automatically using the same logic that draws the on-screen guidance arrow. When the simulator played badly, that meant my guidance design was broken. It found two failures I would otherwise have mistaken for bad game feel.

---

## 7. Things to get right

- **Do not call the screenshots mockups.** They are captures from the running build, produced by the script in `tools/`. If anyone asks, you can regenerate the whole set in three minutes.
- **Do not overstate the testing.** It has been verified by the simulator and in a mobile-sized browser. It has **not** had a long session on a physical phone yet. Section 17 of the case study says so, and keeping that line in is more credible than removing it.
- **Do not claim player numbers, downloads or retention.** There are none. The metrics in this package are all about the design process, and that is the honest strength.
- **Keep the two harness findings specific.** "158 chained Steam Rushes, 78% of guests lost" is memorable. "Testing found some bugs" is not.
- **Do not reference other games by name** as the inspiration on the public page. The genre-break table in section 3 makes the positioning argument better and without borrowing anyone's brand.

---

## 8. What is in this folder

```
case-study/
├── README.md                    start here
├── CASE-STUDY.md                the full narrative (content of record)
├── PORTFOLIO-BRIEF.md           this file — how to build the page
├── content.json                 the same content as structured blocks
├── DESIGN-SYSTEM.md             palette, type, components, interaction specs
├── PROCESS-NOTES.md             decision log, harness findings, raw evidence
├── assets/
│   ├── screens/                 12 screenshots, 1290 × 2796, from the real build
│   └── data/balance-seed7.csv   31-row minute-by-minute session log
└── tools/                       the capture rig, to regenerate screenshots
```
