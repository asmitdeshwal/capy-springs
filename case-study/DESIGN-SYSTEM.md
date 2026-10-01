# Design system — Capy Springs

The game has no DOM, no CSS and no component library. Everything is drawn on one canvas, which meant every token, size and easing had to be written down before it could exist. This file is that system, in a form you can quote on a portfolio page or reuse elsewhere.

Measurements are in **logical pixels** in a 540 × H space (H = 960 on a 9:16 phone, stretching to 1200 on taller devices). One logical pixel ≈ 0.7 CSS pixels on a 6-inch phone, which is why the minimums below are floors rather than suggestions.

---

## 1. Colour

24 tokens, three rules. The rules matter more than the values.

> **Rule 1 — Yellow is money.** The coin / yuzu / amber family means currency, fruit or glow, and nothing else. No character wears it.
> **Rule 2 — One call-to-action colour.** `#E4572E` appears only on things the player should act on. Text in it always carries a 3 px cream stroke so it survives any background.
> **Rule 3 — Never colour alone.** Every state carries a shape as well: frost hatching, steam wisps, solid vs dashed outlines, lock and check glyphs.

### Core

| Token | Hex | Use |
|---|---|---|
| `cta` | `#E4572E` | The only call-to-action colour: guidance arrow, tutorial words, affordable outlines, upgrade chevron, primary button |
| `ink` | `#1F2430` | All UI text and strokes |
| `cream` | `#F6F1E7` | UI panels, sheets, cards, character bellies, paper wrapping |
| `coin` / `coinHi` / `coinRim` | `#FFD24A` / `#FFF1B0` / `#C99400` | Currency |
| `amber` / `amberDeep` | `#FFC857` / `#FF9A2E` | Lantern flame, heat gauge, glow, capacity pips — deliberately cooler than the player character |
| `red` | `#D93A3A` | Cable car, stall stripes, accents, alerts |

### World

| Token | Hex | Use |
|---|---|---|
| `cedar` / `cedarDark` | `#C98A5B` / `#8F5B36` | Deck plates, counters, logs, trays |
| `plank` | `#B57A4E` | Plank lines on decks |
| `stone` / `stoneDark` | `#B9B3A6` / `#7F796D` | Platform, path, pool rims, offering steps |
| `waterHot` / `waterHotDeep` | `#2FA6A0` / `#238C87` | Bath water |
| `waterCold` | `#B7C2CC` | Cold bath — *always* drawn with a white frost dash on the rim as well |
| `waterYuzu` | `#E9C46A` | Golden bath |
| `ripple` | `#8EE3DC` | Ripple rings, shimmer |
| `pine` / `pineDark` / `moss` | `#3F7D5A` / `#2C5A40` / `#4E9A6C` | Terrain and trees |
| `yuzu` / `yuzuLeaf` | `#F5C400` / `#2C5A40` | Fruit — always drawn with its leaf and a dimple, never as a bare circle |
| `skyDay` / `skyDusk` / `skyNight` | `#CFEAF2` / `#E7A5A0` / `#2B2F5B` | Time-of-day tint overlays |

### Characters

| Character | Colours |
|---|---|
| Kit (player, fox) | `#F08A3E` body, `#8F4A1F` shade — **the only saturated red-orange on screen**, so your eye finds yourself instantly |
| Capybara (guest) | `#9C6B43` body, `#6E4A2E` snout, `#7A5233` shade |
| Duck (fast guest) | `#FFFFFF` body with a `#7F796D` line so it reads on cream decks, `#F28C28` beak |
| Pon (stoker, tanuki) | `#7D6B5A` body, `#5C6F8A` coat, `#D9B36A` straw hat |
| Kero (picker, frog) | `#A8E063` body, `#2C5A40` stroke, `#D93A3A` scarf |

**For a portfolio page:** use `#E4572E` as the single accent and `#F6F1E7` as a light surface. `#FFC857` and `#2FA6A0` make a good two-series chart palette against either.

---

## 2. Type

| Role | Size | Weight | Notes |
|---|---|---|---|
| Coin counter | 30 px | Bold | Abbreviates above 10k as "12.3k" |
| Guidance word | 34 px | Bold | CTA colour with a 4 px cream stroke; at most one on screen |
| Combo pop | 34 / 40 / 48 px | Bold | Size rises with chain length — the number *is* the feedback |
| Card title | 28 px | Bold | |
| Sheet title | 26 px | Bold | |
| Coin gain "+N" | 20 px | Bold | 3 px ink stroke, rises 40 px and fades over 0.7 s |
| Sheet button label | 22 px | Bold | |
| Sheet cost | 24 px | Bold | |
| Level pill | 18 px | Bold | |

**Text budget:** at most 3 words on screen at any moment, with an explicit priority order when several want the space — combo pop > banner > guidance word > level pill > price pill. Speech bubbles contain one 24 px icon and **no text at all**, so nothing needs translating.

---

## 3. Sizing floors

| Floor | Value | Why |
|---|---|---|
| Smallest drawn feature | 4 logical px | Below this, nothing survives a 6-inch screen at arm's length |
| Smallest tap target | 56 logical px | Applies to *hit rectangles*, which are routinely larger than the drawn glyph — the gear is drawn 48 × 48 and hit-tested at 60 × 60 |
| Maximum screen shake | 8 px, decaying within 0.3 s | |
| Maximum flash | 0.35 alpha, decaying within 0.25 s | |
| Maximum frame freeze | 150 ms total per second | Rendering and the joystick keep running through every freeze |

---

## 4. Components

### Floating joystick — the only control

| Property | Value |
|---|---|
| Activation | Any touch below 30% screen height that is not on UI |
| Base / knob | r 90 ring, 4 px stroke, 12% cream fill / r 36 knob, 55% cream |
| Appearance | Alpha eases 0.35 → 1 over 0.1 s from touch, whether or not the thumb has moved |
| Dead zone | 8 px |
| Response | Magnitude ramps from 0 at the dead-zone edge to full at 70% of radius, so short thumb travel is enough and there is no jump at the edge |
| **Trailing base** | Once the thumb passes 90 px from the base, the base visibly follows — reversing never needs a long swipe back |
| Release | Fades over 0.15 s |
| Multi-touch | The first touch owns the stick; a second is treated as a tap |
| Tap definition | Ends within 250 ms having moved under 12 px |

### Station sheet (bottom sheet)

Bottom 34% of the screen, minimum 300 px. Cream panel, 10 px cedar top bar, 22 px top corner radius, slides up over 0.2 s ease-out.

- Exactly **three** buttons, 150 × 112, 15 px gaps. Never more; if a station needs a fourth idea, the idea is wrong.
- Each shows: 28 px icon, 22 px label, a row of level pips (filled amber), and a cost pill.
- **Affordable** → CTA pill. **Unaffordable** → grey pill, red number, **lock glyph**, and a tap produces a wiggle and a "nope" sound rather than nothing. **Maxed** → green "MAX" with a **check glyph**.
- Buying is instant. No confirmation, because nothing here can hurt the player.
- Close via X (48 px drawn, 60 px hit), an outside tap, **or simply walking away**.

### Guidance arrow

26 px triangle in CTA with a 3 px cream stroke, 46 px above the player, rotated toward its target, bobbing 4 px at 3 Hz. Alpha 0.7 while moving, 1.0 and 1.2× size after 2 seconds idle, 0.45 when it is only suggesting a long-term goal. It hides when the target is where you already stand.

### Price pill (in world)

Cream pill, 56 × 26, 22 px number with a coin icon, floating 78 px above an offering step. Shown only for the arrow's current target and for steps within 200 px — so prices never litter the screen. Standing on a step with too few coins turns the pill red with the shortfall.

### Cards

440 × 320, cream, 24 px radius, centred, world frozen behind. One number, one primary button, one character. Used for offline earnings and the reset confirmation only.

---

## 5. Motion

| Event | Motion |
|---|---|
| Any landing | Squash-stretch 1.15 / 0.85 → 1 / 1 over 0.2 s ease-out, applied around the feet |
| Coin arrival | Counter scales 1.25 → 1 over 0.25 s; the number rolls up over 0.3 s |
| Combo pop | Scale 0 → 1.15 → 1 over 0.25 s |
| Unlock | Structure unwraps from paper over 0.35 s + dust puff + confetti + 4 px screen bump — **nothing rises out of the ground** |
| Three-guest chain | 4 px bump + 40 ms freeze |
| Four-guest chain | 6 px bump |
| Five-guest chain | 8 px bump + 100 ms freeze |
| Steam Rush start | 8 px bump + 120 ms freeze + steam wash |
| Followers in line | Bob 3 px on a sine wave offset per position; ducks at double rate |
| Idle | Player stretches and yawns after 6 seconds still |

All of the bumps, freezes and flashes are removed by one settings switch: **Shake & flash**.

---

## 6. Sound as interface

26 effects, all synthesised at runtime — no audio files ship. Three of them are doing genuine interface work:

| Sound | What it tells you that the screen does not |
|---|---|
| **Join blip** | Pitch rises with position in your line, so you hear the trail fill without looking at the capacity pips |
| **Coin clink** | Climbs a semitone per coin within a burst, so a large payout *sounds* larger |
| **Offering tick** | Pitch rises as the payment drains, so you know how close the unlock is without watching the arc |

Background layers: a low pad always on; a shaker layer only during a Steam Rush; a night layer only during Lantern Night. Each fades in and out over 0.5 s.

Nothing plays before the player's first touch — and that first touch rings the cable car's bell, so the browser's audio unlock is disguised as an event in the world.

---

## 7. Accessibility checklist

- [x] No state communicated by colour alone (frost hatch, steam wisps, solid vs dashed outlines, lock and check glyphs)
- [x] Motion sensitivity: one switch removes shake, freeze and flash
- [x] Shake bounded to 8 px and 0.3 s; flash bounded to 0.35 alpha
- [x] Input never blocked — the joystick keeps responding during every freeze
- [x] 56 px minimum hit targets, 4 px minimum drawn features
- [x] Language-independent: speech bubbles are icons only; at most three words on screen
- [x] Low-effects mode enables itself if frame time degrades and **never disables itself** — the player owns that switch
- [x] No failure state, no punishment, no loss aversion anywhere in the design
- [x] Fully offline: no account, no network, no analytics, nothing leaves the device

---

## 8. Performance budget (it shaped the visual language)

| Budget | Value |
|---|---|
| Frame time | ≤ 12 ms |
| Simulation step | ≤ 2 ms |
| Depth-sorted objects | ≤ 150 per frame |
| Glow sprites | ≤ 8 per frame, pre-rendered, blitted with varying alpha |
| Per-frame gradients, blurs, filters | **Zero** |

Consequences you can see in the screenshots: depth is a painted "thickness" band plus an ellipse shadow rather than a 3D projection; night is one multiply tint plus halo sprites rather than bloom; the entire static world is one cached image rebuilt only when a building finishes unwrapping.
