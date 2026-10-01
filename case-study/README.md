# Capy Springs — portfolio case study package

Everything needed to put this project on a UI/UX portfolio site, in one folder. Hand the whole folder to Claude (or a developer) and it can build the page without asking you follow-up questions.

---

## Start here

1. **Read `CASE-STUDY.md`** — the full narrative, ~7 minute read. This is the content of record. If you disagree with a framing, change it here first, then in `content.json`.
2. **Make one decision:** `PORTFOLIO-BRIEF.md` section 1 asks you to pick how you want the "I designed it, Claude Code built it" workflow described. There are three options; A is recommended. Pick one and it stays consistent everywhere.
3. **Paste the prompt** in `PORTFOLIO-BRIEF.md` section 0 into Claude along with this folder.

---

## What each file is for

| File | What it is | Who reads it |
|---|---|---|
| `CASE-STUDY.md` | The full written case study — 17 sections, the narrative of record | You, and anyone building the page |
| `PORTFOLIO-BRIEF.md` | How to build the page: prompt to paste, section order, image placement, layout notes, colours, metadata, short copy for cards and résumés, and what *not* to claim | Whoever builds the page |
| `content.json` | The same content as structured blocks — hero, metrics, sections, tables, timelines, captions, alt text, palette, tags, SEO | A templating pass; validated JSON |
| `DESIGN-SYSTEM.md` | The game's real design system: 24 colour tokens with their grammar, type scale, sizing floors, component specs, motion rules, sound-as-interface, accessibility checklist, performance budget | Quote from this on the page; also reusable as its own portfolio artefact |
| `PROCESS-NOTES.md` | Decision log, both harness findings written out in full, the measured session data, the harness spec, scope tiers, a claims-and-evidence table, and the honest limitations | Interview prep, and anyone fact-checking the page |
| `assets/screens/` | 12 screenshots, 1290 × 2796, captured from the running build | The page |
| `assets/data/balance-seed7.csv` | The real 31-row minute-by-minute session log, for an optional chart | The page |
| `tools/` | The capture rig that produced the screenshots | You, when you want new shots |

---

## The screenshots are real

These are not mockups. Every image is a capture from the running game at a chosen moment, taken at an exact phone viewport (430 × 932 CSS at 3×). To regenerate all twelve:

```bash
# from the project root, in one terminal
node tools/serve.js 5199

# in another
node case-study/tools/shoot.js case-study/assets/screens 5199
```

It takes about three minutes and reproduces the same set. To capture a *different* moment, edit the `SHOTS` list in `case-study/tools/shoot.js` — the query parameters are documented at the top of `case-study/tools/capture.html`. For example:

- `?t=600&day=1&stop=splash5` — ten minutes in, daylight, wait for a five-guest chain
- `?t=900&sheet=bamboo` — fifteen minutes in, with the Bamboo Tub's upgrade sheet open
- `?t=120&stop=trail&trailn=5&stick=1` — a full line of five guests, joystick visible

Requires Chrome and Node 22+. No packages to install. If Chrome is somewhere unusual, set `CHROME=/path/to/chrome` before running.

---

## Two things to keep straight

**Do not claim player data.** There are no downloads, no retention numbers, no playtesters. Every metric in this package is about the design process — the spec, the simulator, the measured economy — and that is the honest strength of the story. `PROCESS-NOTES.md` section 8 lists the limitations to keep visible; they make everything else more credible.

**Do not say you wrote 5,676 lines of code.** Say what actually happened, which is more interesting: you wrote 2,018 lines of specification precise enough that a 5,676-line game could be built from it, then verified the design with a simulator. `PORTFOLIO-BRIEF.md` section 1 has three ready-made ways to phrase it.

---

## If you only have space for a short version

Use these seven sections from `CASE-STUDY.md`: **At a glance → Constraints → Concept → Wayfinding → The simulator → The two findings → What I learned.** That sequence still tells the whole story: what you were solving for, what you did differently, the hardest UX problem, the method, the proof, and the lesson.

The single strongest moment in the package is section 10 — the two bugs the simulator found. If a reader only reads one section, make it easy for it to be that one.
