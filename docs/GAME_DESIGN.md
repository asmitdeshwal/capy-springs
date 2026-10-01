# CAPY SPRINGS — Game Design Document (FINAL, build-ready)

Version 1.2 · 2026-09-11 · Lead designer / technical director sign-off
Companion document: `docs/ARCHITECTURE.md` (module APIs, data tables as code, build plan). Every id, coordinate and number in this document is canonical and is repeated verbatim in the architecture's data files (`src/00_config.js` = `G.C`, `src/01_palette.js` = `G.PAL`, `src/02_data_*.js` = `G.DATA`). If the two ever disagree, the data files win and this document must be patched.

Revision 1.2 (pre-build review pass) changes, in one list so nobody has to diff:
- **Cadence**: the car period is arrival-to-arrival (dock-to-dock) everywhere and scales with car size: 18 / 21 / 24 / 25 s (night 12 s). Car #1 is pre-docked at t = 0, car #2 docks at t = 13.
- **First 30 s**: first blip at ~2 s, first SPLASH x3 at ~6 s, a 5 s tutorial soak, a second x3 by ~17 s, Cedar Bath lit by ~20 s; lantern drain starts at 20 coins/s.
- **Splash Chain**: the combo batch is global across baths with a 2 s window; running between decks is the skill. Cedar and Bamboo gained a base slot (4 and 5).
- **Yuzu "hat pays"**: a yuzu gives hats; hats pay ×2 at climb-out; golden water lasts 10 s, trees regrow in 15 s.
- **Heat**: start 75, slower drain, a 30 s no-drain grace after the boiler is built, rush drain 4/s, Tank max 175, rush chains escalate 1.5 → 1.75 → 2.0; rush affects heated baths only.
- **Trail never clogs**: the woodpile and the grove hand out only what can be used; the boiler always takes logs.
- **Coin trays** instead of floor coins; **offering steps** instead of glowing pads; **koban** coins; white ducks; a single CTA colour; readable sizes for a 6-inch phone.
- **Arrow**: 12 rules including a TAP rule for affordable upgrades and a Splash Chain rule; the arrow never points at nothing until everything is maxed.
- **World**: 540 × 2400 with a painted valley under the cable, so the camera never inverts and the platform never sits under the thumb; cable at y 2120.
- **Offline**: 2 h cap, 0.10 base, median-bucket rate. **Ducks** pay 3 and come in cars of 8/10/12. **Lantern Night** 60 s with cars every 12 s and lantern-light coins. **Season Fame** repeatable bridge levels. Upgrade tracks cap at 6 levels.
- Hit-stop only on the 3rd and 5th plop; a "Shake & flash" toggle; no external game titles named anywhere in this document.

Working title. Run a trademark / store-name check before any store submission.

---

## 0. One line

**Capy Springs** is a one-thumb, offline, arcade-idle resort builder: a zippy fox leads capybaras in a wobbling conga line into steaming hot-spring baths, feeds a boiler for Steam Rushes, drops yuzu in the water for double pay, and lights lantern posts with coins to grow a tiny inn up a mountainside.

---

## 1. Pitch

You are **Kit**, the innkeeper fox of a one-pool mountain hot spring. Every 18 seconds (25 once the cars are big) a cable car rings its bell and drops off a handful of capybara guests who want exactly one thing: a hot soak. You walk up to them and they hop into a **Trail** behind you, snake-style. Walk onto a bath deck and the whole line plops into the water in a burst; three or more landing within two seconds — in one bath or across two — is a **Splash Chain** with rising gold numbers and a screen bump. Guests soak, sigh little hearts, climb out and flick gold koban into the deck's coin tray; you run past the tray and it magnets into your counter. Spend coins by **standing at a lantern's offering step**: koban toss into the box one by one with rising pitch, the flame grows, and a new bath, a boiler, a yuzu grove or a helper is unwrapped with a puff and a bump.

Two systems make it unmistakably its own game:

1. **The Trail** — you never stack items on your head. Guests, logs and yuzu all join one wobbly line behind you with one capacity number. The customers *are* the cargo, and splitting a full trail across two decks inside the chain window is the skill.
2. **Heat** — one shared boiler gauge that every heated bath depends on. Over 80 triggers a 10-second **Steam Rush** (2x soak speed, 1.5x pay, steam everywhere) on the heated baths; under 30 the water goes grey and guests shiver. Feeding the boiler is a real, chainable skill, not a chore.

Plus the **Yuzu Bath** (a harvestable you drop into a bath: every capybara in it gets a yuzu hat, and hats pay double), the game's iconic image and its jackpot ingredient.

Tone: cozy Japanese onsen, chunky paper-cutout toy look, zero grit, no failure state ever. Fast because timers are short and payoffs are frequent, calm because nothing punishes you.

---

## 2. Theme and world

### 2.1 Setting
A wooden bathing deck clinging to a pine-covered mountainside. A cable car line runs along the bottom edge of the inn; guests arrive on a stone platform, walk up a stepping-stone path, soak, and leave the way they came. Below the cable the mountain drops away into a misty valley of pine tips (painted, never walked on). Above the deck a rope bridge disappears into mist toward the **Ridge** (locked in MVP, opens "next season").

### 2.2 The map (world 540 × 2400; MVP uses y 1100..2400: the DECK zone plus the painted valley)

World coordinates: x across (0..540), y down (0..2400). Camera never scrolls above y = 1100. With a 960-px-tall screen the camera scrolls 1100..1440 (340 px); with a 1200-px screen 1100..1200. Kit on the platform (y ≈ 2050) is therefore never drawn lower than 0.65 H, above where a thumb rests. All positions below are footprint **centers**; a structure's sort/feet value is the bottom edge of its footprint. **Lantern coordinates are stand points** (the offering step); the lantern post stands 38 px behind the step.

```
x:  0          120          270          420         540
y1100 ┌──────────── mist, Ridge (locked) ────────────────┐
      │            [bridge lantern (270,1180) 1500c]       │
y1250 │ pines                                     pines   │
      │ BAMBOO TUB water (120,1430) 150x90                 │
y1430 │   deck 210x150      [bamboo step (235,1530)]       │
      │   tray (212,1492)   [kero step (350,1450)]  SNACK STALL counter (430,1470) 120x36
y1525 │                                            queue spots y=1525 x=370,410,450,490; tray (430,1512)
y1570 │ yuzu tree slots L2 (80,1570) L3 (160,1570)  [stall step (430,1585)]
y1630 │ yuzu tree slot L1 (120,1630)      WOODPILE (360,1670)  BOILER (450,1660)
y1690 │ yuzu base trees (80,1690) (160,1690)      [pon step (405,1735)]
y1745 │ [grove step (120,1745)]                             │
y1785 │ ROCK POOL water (120,1860) 160x95      CEDAR BATH water (420,1860) 150x90
      │   deck 220x155 (x10..230,y1782..1937)   deck 210x150 (x315..525,y1785..1935)
      │   tray (212,1922)                       tray (328,1920)
y1965 │ [trail step (50,1990)]  KIT START (270,1990)   [cedar step (420,1965)] [car step (490,2000)]
y2020 │        PLATFORM (270,2060) 320x80, bell post (135,2005)              │
y2100 │        Kit's walkable box ends here (y = 2100)                        │
y2120 │═══ cable y=2120, pylons x=60 & 480 (2060..2120), cabin hangs 2120..2176, docks at x=270 ═══│
y2200 │ cliff edge, rocks (200,2196) (340,2196)                              │
y2400 └──────── painted valley: mist gradient + pine tips (static, no solids) ─┘
```

The **center lane** (x 240..300, y 1150..2020) is a stepping-stone path and is kept free of solids forever: guests route through it (see 5.11). Left column = natural things (rock pool, grove, bamboo). Right column = built things (cedar bath, boiler, woodpile, stall). This left/right split is also the visual story: nature on one side, the inn growing on the other. Every bath's **coin tray** sits on the lane-side strip of its deck, so Kit passes it on the way to and from the platform.

### 2.3 Zones and long-term
- **Deck** (MVP): everything above.
- **Ridge** (stretch): Massage Pavilion (Madame Tsuru), Sauna Hut with a hot-to-cold plunge chain, Momo the snow-monkey VIP at Lantern Night.
- **Summit / Cave Bath** (stretch): geyser timing mini-mechanic, then the "New Season" prestige.

---

## 3. Cast

All characters are built from circles, ellipses, rounded rects and triangles in a local space where the feet are at (0,0), +y is down, and `face` is +1 (looking right) or −1 (looking left, whole drawing mirrored). Every character has: a soft ellipse shadow (rgba(0,0,0,0.18)) at the feet, a 2 px darker stroke around body and head for readability at 40 px, and squash-stretch (`sx`, `sy`) applied around the feet. Sizes are in logical px (1 logical px ≈ 0.7 CSS px on a 6-inch phone, so **no drawn feature is smaller than 4 logical px** and personality lives in silhouette and motion, not in pupils). Exact recipes live in section 11.5; this section is what they *are*.

| Name | Role | Silhouette read | Palette | Personality | Signature animation |
|---|---|---|---|---|---|
| **Kit** | Player, innkeeper fox | Two triangle ears + a lagging three-stroke tail; 52 px tall; the only saturated red-orange on screen | orange #F08A3E, cream #F6F1E7, dark brown #4A2E1F, stroke #8F4A1F, headband #F6F1E7 (6 px) + red dot r 4 #D93A3A | Zippy, eager to please, runs everywhere | Legs alternate at 8 Hz when moving; tail lags opposite to velocity; dust puffs; tiny fist-pump (0.4 s) on every Splash x3+; stretch/yawn idle after 6 s still |
| **Capy** | Standard guest (capybara) | Wide rounded-rect body with a darker snout block; 44 × 32 px | body #9C6B43, snout #6E4A2E, ears/thickness #7A5233, eyes #2A1E17 (r 3.2 dots) | Blissfully unbothered; never angry, only slowly sleepy | Bobs 3 px in the trail; in water the top 60% shows and bobs, sinking 4 px over the soak; a heart + a steam puff every 3 s while soaking; eyelids drop in 3 steps as the soak completes; yuzu hat variant (r 10 crown + two leaves) |
| **Quacks** | Fast, low-paying guest (white Pekin duck), arrives in flocks | White circle body + small head + orange triangle beak; 28 × 30 px | body #FFFFFF with a 2 px #7F796D line, beak/feet #F28C28, eye #2A1E17 (r 2.6) | Impatient, chatty, waddle-runs, leaves fast if not seated | Bob at 2x capy rate; quack on trail join; splash pitch a fifth higher; walks 1.4x faster |
| **Pon** | Hireable stoker (tanuki) | Round body in a slate-blue happi coat, dark eye mask, wide straw hat (brim rx 22); 44 px — reads "wide hat", never "another capy" | body #7D6B5A, happi #5C6F8A, mask #3B2F28, belly #F6F1E7, hat straw #D9B36A with a red band | Sleepy, steady, hums; reliable but slow | Carries one log on the shoulder; walks a straight line woodpile → boiler; yawns (mouth ellipse grows) for 3 s after every stoke; stops stoking at 70 heat |
| **Kero** | Hireable yuzu picker (frog) | Lime-green circle with two bulging eyes on top, red scarf; 36 px | body #A8E063 with a 2 px #2C5A40 stroke, belly #F6F1E7, scarf #D93A3A, eyes #F6F1E7 / #2A1E17 | Bouncy and proud | Never walks, always hops (parabola, 0.5 s, 26 px high, squash on land); holds each yuzu overhead like a trophy |
| **Madame Tsuru** (stretch) | Masseuse, Ridge | Tall white crane, red crown dot, black beak; tallest on screen (70 px) | #F6F1E7, #D93A3A, #2A1E17 | Elegant, slow, unimpressed | Slow neck sway; guests leave with a sparkle |
| **Momo** (stretch) | VIP snow monkey, Lantern Night only | Grey-beige body, pink-red face, white snow cap, gold outline | #B8AFA2, #E36B6B, #F6F1E7, glow #FFD24A | Regal, dramatic; demands the Yuzu Bath, pays 10x | Sparkle trail; slow "hmph" head turn |

Every guest has exactly one **want** at a time, shown as a rounded speech bubble (36 × 32) with one large icon (24 px): bath icon while waiting on the platform; mochi icon while queuing at the stall; a snowflake when the bath they are in has gone cold; a growing sweat-drop when patience is under 40%. No text in bubbles. **Bubble culling** (10.9): the default bath bubble is drawn only on the guest the arrow targets and on guests within 120 px of Kit; non-default wants (mochi, snowflake, sweat) are always drawn. Bubbles are drawn after the night tint so they stay readable.

---

## 4. Core loop

### 4.1 One cable-car cycle, second by second (steady state: 2 baths built, trail cap 5, Cable Car I → 5 capys every 21 s)

Derived by hand from the v1.2 constants. WP6 replaces this table with the harness beats (`node test/headless.js --csv --beats`, seed 7); after that, do not hand-edit it.

| t | What happens | Player verb |
|---|---|---|
| 0.0 | Car docks (bell). 5 capys hop out one per 0.3 s, up onto the platform, each with a bath bubble; they mill. "Ding-ding" was heard at t = −3 while the car slid in | LEAD: walk across the platform; guests within 44 px hop into the trail one per 0.12 s (rising blip per guest) |
| 1.5 | Trail 5/5, pips full. Arrow → the bath that fits the most of the trail (Cedar Bath, 4 free) | Run to the Cedar deck (0.8 s) |
| 2.5 | Kit enters the Cedar deck: guests plop one per 0.12 s; 3 land → "SPLASH x3!" (4 px bump, arpeggio, one 40 ms hit-stop); the 4th → "x4!" (6 px bump). Cedar is full; the chain window (2 s) is open; arrow → Rock Pool | Run 85 px to the Rock deck (0.3 s) |
| 3.2 | The 5th guest plops into the Rock Pool inside the window → "x5!!" anchored on the Rock Pool (8 px shake, 100 ms hit-stop, x2 pay for all five) | Nothing to press; keep moving |
| 4.0 | Heat gauge shows 46 and falling (1.0/s while a heated bath is occupied). Arrow → woodpile | STOKE: run to the woodpile (0.7 s); logs hop into the trail one per 0.35 s, only as many as the tank can take (3) |
| 6.5 | Boiler zone: logs consumed one by one, +15 heat each → 88 ≥ 80 → **STEAM RUSH** (whoosh, 8 px shake, steam wash, shaker music layer): heated baths soak 2x and pay ×1.5 for 10 s | Detour to the grove: a ripe yuzu hops into the trail |
| 8.5 | Drop the yuzu in the Cedar Bath: water pale gold for 10 s, four yuzu hats, "YUZU BATH!" pop; hats pay ×2 at climb-out | |
| 10.5 | Cedar soak ends early (rush): capys climb out to the lane-side edge and flick koban that arc into the deck's coin tray (clink per landing, the stack grows); the Rock Pool capy follows at 11.2 (8 s soak) | COLLECT: run past the trays; coins magnet to Kit, then fly to the HUD counter with rising-pitch clinks; counter bounces |
| 12.0 | Stand at the Trail Rope's offering step: koban toss into the box, 20 → 40 → 80/s, the flame grows, the wrap tears: capacity 8 | LIGHT |
| 15.0 | 2 finished guests wander down the lane to the platform and wave off; 1 wants mochi and queues at the Snack Stall | Detour: yuzu to the stall, or back to the platform |
| 18.0 | "Ding-ding" — 3 s warning; the car slides in | (already moving toward the platform) |
| 21.0 | Next car docks (car level 1: 21 s dock-to-dock; the docking animation overlaps the countdown so the platform is never empty for long) | Repeat |

Everything the player does is **walking**. There are no action buttons in the play loop; every station reacts to proximity. The only taps are on stations (upgrade sheet) and on UI.

### 4.2 The minute loop
`LEAD → SOAK (Splash Chain) → COLLECT → LIGHT (lantern)`, with `STOKE` and `YUZU` as the two optional detours that multiply income. The decision every car is *which detour fits before the next car*.

### 4.3 The session loop
Unlock → upgrade (Soak / Seats / Tips per bath, themed tracks per station) → hire (Pon, Kero) → longer trail and bigger cars → bridge to the Ridge (MVP finale at ~20 minutes: "Famous Inn", permanent +25% pay, gold headband for Kit) → Season Fame levels and the last upgrade tracks.

---

## 5. Signature mechanics (precise rules)

### 5.1 The Trail
- A chain of **followers** behind Kit. Node kinds: `guest` (capy or duck), `log`, `yuzu`. One capacity number for all kinds: **3 → 5 → 8 → 12** (Trail Rope lantern levels).
- **Joining**: a waiting guest within **44 px** of Kit's feet joins if the trail is not full, **one guest per 0.12 s** (so five milling guests join as five rising blips, not one chord); guests in baths, in the stall queue or leaving never join. Logs join at the woodpile at **1 per 0.35 s** while Kit stands within 40 px of the pile, the trail is not full, and the tank can still use them: `logsInTrail × heatPerLog < (heatMax − heat) + heatPerLog` (never more than fills the tank). A ripe yuzu joins when Kit is within 44 px of its tree, only while `yuzuInTrail < (built baths that are not golden) + (stall built with room ? 1 : 0)`. Join = the item hops (0.25 s arc, 18 px high) onto the tail with a "blip" whose pitch rises with the trail index, plus a squash on landing.
- **Following**: Kit leaves a breadcrumb path (a sample every 4 px of travel). Follower `i` targets the point on that path that is `gap[0] + … + gap[i]` behind Kit, where gap by kind is **capy 28, duck 24, log 22, yuzu 18** (the first gap gets +6). Each follower moves toward its target with a frame-rate-independent lerp `k = 1 − 0.65^(dt·60)` (≈0.35 per frame at 60 fps). What this gives, and what the art should expect: a uniform ~10 px stretch at full speed, the line snapping closed when Kit stops (target distances shrink to 60% over 0.3 s while Kit is stopped, so the line visibly bunches up), followers swapping sides when Kit reverses (intended: it reads as the line whipping around), and a line that never cuts through a pool because it follows Kit's actual path. Followers bob `3·sin(6t + 0.9·i)` px. If the path is shorter than needed (game start), it is extended in a straight line behind Kit's facing direction.
- **Drop-off zones take only what matches, in any order**: baths take guests (into free warm slots) and one yuzu (if not golden, or golden with < 3 s left); the boiler takes **every** log (a log over the maximum is wasted with a puff, or, during a rush, extends the rush by 1 s); the snack stall takes yuzu (while its stock + pending is under the counter max). Anything else stays in the trail — and because pickups are capped to what can be used, nothing stays there forever. There is never a "wrong order".
- **Impatience**: guests in the trail carry a patience timer (capy **25 s**, duck **15 s**). A sweat-drop bubble appears at 40% remaining and grows. At 0 the guest hops out of the trail, routes to the platform exit, waves and is gone — it **never rejoins**; no penalty beyond the lost coins. Patience ticks at **50% speed for guests in the trail while the arrow's active rule is STOKE** (the player is demonstrably carrying them toward the fix); guests on the platform always tick at full speed, so letting the boiler die never buys time. The tutorial car (first car ever) has infinite patience.
- **Removal** re-links the chain: followers behind the removed node shift forward to shorter target distances and lerp there, so the line visibly closes up.
- Trail followers have no collision with anything. Kit collides with water rects, the boiler, the stall counter, tree trunks, pylons and the world bounds.
- **Empty-trail sprint**: with nothing in the trail Kit runs at **1.25x** (280 → 350 px/s) so return trips feel snappy.

### 5.2 Splash Chain (the combo)
- One **global** batch `splash = {count, t, mult, bathId}` shared by every bath. When a guest lands in a slot anywhere: if `now − splash.t ≤ 2.0 s` then `count++` else a new batch starts at 1; `splash.t = now`; `splash.bathId` = the bath that just took a guest. The landing guest stores a reference to the batch object.
- Pay multiplier is read from the batch **at payout time**, so every guest in the batch gets the final tier: **x3 = ×1.25, x4 = ×1.5, x5+ = ×2.0**. 1 or 2 guests: ×1.
- The skill: the Rock deck's right edge (x 230) and the Cedar deck's left edge (x 315) are 85 px apart (0.3 s at full speed), so a 5-trail split 3 + 2 across two baths is an x5 **if the player runs**. Carry full, run between decks. With three baths and a 12-trail, x8-x12 chains are the late-game rhythm.
- Feedback escalates with the count: at 3 → "SPLASH x3!" gold pop (34 px, overshoot scale-in), a ripple ring per guest, 4 px bump, arpeggio note 3, **one 40 ms hit-stop**; at 4 → "x4!" (40 px, 6 px bump, note 4, no hit-stop); at 5 → "x5!!" (48 px, 8 px shake, note 5, **100 ms hit-stop**, 12 confetti); 6 and above show the real count ("x7!!") with the x5 tier's size, bump, note and multiplier, and `stats.combos[5]` counts every chain of 5 or more. Plops 2 and 4 get bump + plink + ripple only, so a five-plop flurry freezes the world for 140 ms in total, not 280. The pop text sits above the bath that took the latest guest and replaces the chain's previous pop. Kit does a fist-pump on x3+.
- Plops are spaced **0.12 s** apart; ducks in eights hit x5 in 0.6 s and x8 in 1 s, which is the intended "flurry".
- Haptic: `vibrate(15)` on x3, `vibrate(30)` on x5. Hit-stop, shake and flash all obey the "Shake & flash" setting (10.8).

### 5.3 Heat and Steam Rush
- One global gauge in **units**: start **75**, max **100** (Boiler "Tank" upgrade +15 per level, 5 levels → 175). Thresholds are absolute units: **cold < 30**, **rush ≥ 80**. Pon stokes only up to **70**.
- Drain only once the boiler exists, and **not during the 30 s grace** after it is built (the first STOKE prompt lands 60-90 s after the unlock, by which time car #3-4 has taught the loop): **0.5/s** when no heated bath is occupied, **1.0/s** when any heated bath has a guest in it, **4.0/s** during a rush.
- Each log adds **15** (+2 per "Stoke" level → 27). Logs come only from the woodpile, via the trail (or Pon). The woodpile hands out only what the tank can take (5.1); the boiler **always** consumes the logs it is offered: a log over the maximum is wasted (puff, no heat), except during a rush, when each surplus log extends the rush by 1 s.
- **Cold** (< 30): heated baths turn grey (#B7C2CC with a white frost dash along the rim), emit no steam and show a snowflake bubble. Guests already inside keep their place, their soak timer **pauses**, they shiver (x-jitter, blue tint). New guests are refused: they stay in the trail (patience at half speed, 5.1) and the arrow points at the woodpile. **Heat touches heated baths only, in both directions**: the Rock Pool is a natural spring, never cold and never rushed.
- **Steam Rush** (≥ 80 and no rush active): 10 s. On the heated baths soak timers run **2x** and pay is **×1.5**; drain 4/s; a thick steam wash rolls across all decks, lit lanterns flare, the music adds a shaker, "STEAM RUSH" ribbon under the heat bar, whoosh + 8 px shake + `vibrate(30)`. When a rush ends, if heat is still ≥ 80 a new rush starts immediately with a "CHAIN x2!" pop and pay **×1.75**; a third chained rush ("CHAIN x3!") and beyond pay **×2.0** (cap). A full 175 tank is ~24 s of rush (about two chains), so chaining always needs a log during the rush. This is the skill: keep feeding during the rush. Pon's 70 cap means a rush is always the player's.
- Pon walks the woodpile ↔ boiler line at 70 px/s, 1 log at a time, rests 3 s (yawn) after each stoke, and never stokes above 70. He keeps the water warm; rushes remain the player's job.

### 5.4 Yuzu Bath ("hat pays")
- The grove has 2 trees (Trees upgrade → 5). A tree regrows one yuzu in **15 s** (Regrow upgrade → 7.5 s), shown as a growing green bud that turns yellow and pulses when ripe.
- Dropping one yuzu into a bath makes it **golden for 10 s** (Ripe upgrade → 19 s): water #E9C46A with 3 floating yuzu. **Every guest in the bath and every guest who lands while it is golden gets a yuzu hat; at climb-out a hat pays ×2.** Hats stay on after the water fades (they were earned). A second yuzu is only consumed if fewer than 3 s remain (it refreshes the timer); otherwise it stays in the trail. One yuzu therefore doubles roughly one batch: "yuzu → run for the car → x5 → rush" is the engineered jackpot, not a standing multiplier. A yuzu hat and a Golden Car do not stack (the larger of the two applies).
- Yuzu can also be delivered to the Snack Stall (5.6). The grove is the game's small constant choice: fetch yuzu or lead the next car?

### 5.5 FULL CAR
- Every car of **4 or more guests** has an id; every guest remembers its car. When the **last guest of a car enters a bath** and none of that car's guests walked off impatient, "FULL CAR!" pops at the top of the screen and **+2 coins per guest** rain down around Kit (auto-collected) with 12 confetti. Missing it costs nothing. Cars of 3 (car level 0) and empty cars never trigger it, so the first FULL CAR is the first Golden Car (6 capys) or the first Cable Car I car — never the tutorial car.

### 5.6 Snack Stall (MVP Plus)
- Built at the right column. After a soak, **35%** of capys (never ducks) get a **mochi** want bubble and walk to the stall queue (4 spots; if full they just leave). The stall turns **1 yuzu → 1 mochi** in 3 s (→ 1.5 s) and holds 2 (→ 5) on the counter. A queued guest takes a mochi and pays **3× capy base pay** (18 at level 0), then leaves.
- **Queue patience 30 s**: a sweat drop at 40%, then the guest leaves with no penalty (it is not counted as lost). While a guest is queued and nothing is cooking (stock + pending = 0) and a ripe yuzu exists, the arrow points at the nearest ripe tree (rule 9).
- Yuzu reaches the stall from Kit's trail (walk into the stall zone) or from Kero, who hops grove → stall whenever the stall stock + pending is below the counter max, otherwise waits at the grove holding a yuzu overhead.

### 5.7 Lantern posts (offering steps)
- A lantern post standing 38 px behind a stone **offering step** (a 48 × 20 stone slab with a shimenawa rope and three paper shide strung across the post's front, and a small dark saisen box at the post's foot). There is no glowing ground disc. Revealed only when its prerequisites are lit. A cost pill (cream 56 × 26, 22 px number) floats 78 px above the step centre — drawn only on the arrow-targeted lantern and on lanterns within 200 px of Kit; other revealed lanterns show a bare lamp with a small coin glyph.
- Standing within r 30 of the step centre with coins: koban toss from Kit into the box one per **0.06 s tick**, pitch rising with the fill fraction; the rate starts at **20 coins/s and doubles every 0.5 s up to 400/s** (the first 20-coin lantern takes ~1 s and ~16 ticks; a 700-coin lantern ~2.5 s). The lamp's flame grows with the fill (0 → 14 px) and a 6 px CTA arc around the step shows sunk/cost. Progress persists if you step off; **partial drains are allowed by design**.
- At 100%: the flame flares, 4 px bump, "pop" + puff + 12 confetti, and the structure is **unwrapped**: four cream paper strips over its footprint tear and flutter away over 0.35 s (no rising from the ground). The label shows ✓ for 1 s. Repeatable lanterns (Trail Rope, Cable Car, Ridge Bridge) re-arm after 1 s with the next level's cost.
- Affordable: solid CTA outline on the step, a small flame glyph on the lamp, glowing shide. Unaffordable: dashed grey outline. If Kit stands at a step with **0 coins** and a remainder, the label shows the shortfall in red ("−15") continuously, with one wiggle + "nope" per entry into that state.

### 5.8 Station upgrades (bottom sheet)
Tap any built station while Kit is within 160 px: a sheet slides up over the bottom 34% of the screen with three big buttons. Each station type maps the generic keys **speed / slots / pay** to its own labels (see 8.4). Costs follow `round5(base × 1.6^level)`; tracks have **6 levels** (3 for slot tracks, 5 for Tank and Pon). Buying: pop + "pip" fill + the station does a squash. The sheet closes on X, on tapping outside, or when Kit walks more than 220 px away. The joystick keeps working with the sheet open (a drag that starts on the sheet and moves more than 12 px becomes the stick; sheet buttons only consume clean taps). Tapping a built station farther than 160 px away is never silent: its level pill bounces, the arrow flashes toward it for 1 s and "pip" plays. The sheet is taught by a bouncing CTA chevron above the station that holds the cheapest affordable upgrade and by arrow rule 10 (TAP).

### 5.9 Lantern Night (MVP Plus)
- First at **240 s** of play time (only once the Cedar Bath exists), then every **180 s**, lasting **60 s**. Sky tint to indigo (#2B2F5B multiply, 0.40 alpha, 2 s fade; 0.30 on low-effects devices), lit lanterns glow with additive halos, cars dock every **12 s** (about five cars; the platform cap of 12 and "spawn only what fits" keep it casual), pay **×1.2**, banner "LANTERN NIGHT" slides in for 2 s, bell becomes a soft chime. Ducks never arrive at night (capys only, keeps it pretty).
- **Lantern light**: each lit lantern Kit passes at night (within 34 px of its step) drops 1-3 koban straight into Kit, once per lantern per night — the map glows and there is something to do between cars.

### 5.10 Offline earnings
On return after ≥ 60 s away, a card: "While you were away… N cable cars came by" with `+X` coins and a big COLLECT button (Pon waving if hired, otherwise Kit). Formula in 8.9. Capped at 2 hours.

### 5.11 Guest routing (lane rule)
Guests never pathfind. Every walk is at most three straight segments, computed once when the walk starts (`G.Guests.route(from, to)`, architecture §9.4): (1) horizontal from the current point to the **center lane** x = 270 (skipped when already within 30 px of it), (2) vertical along the lane to the target's y, (3) horizontal to the target. Because every bath exit point sits on the lane side of its deck, the stall queue spots sit below the counter, and the lane strip (x 240..300, y 1150..2020) is a permanent no-build zone, no segment ever crosses water or a solid. Walk speed is the species value (capy 110 px/s, duck 150 px/s); a guest faces its segment direction. Special cases: hopping out of the car is a 0.25 s arc from the cabin door (x, 2172) **up** onto a random platform mill point (y 2030..2090; no route); milling is a random point inside the mill rect every 1.5–3 s, walked directly (the platform has no solids); a guest climbing out of a bath appears at the deck's exit point, pays there, then routes to the stall queue or the platform; leaving guests route to (270, 2030), wave for 0.4 s, fade and are removed. Helpers ignore the lane rule: Pon walks the woodpile ↔ boiler line and Kero hops straight lines, both across open ground by map construction.

### 5.12 Golden Car (MVP Plus)
Every 5th car (#5, #10, #15 …) is a Golden Car: the cabin is gold with paper streamers, the arrival bell is followed by `fanfare` and the banner reads "GOLDEN CAR!". It carries **2x** the level's capy count (still capped by the platform's 12 free spots), its guests have **2x patience** so the crowd is a party rather than a panic, and every guest from that car pays **×1.5** (`goldenMult`; the larger of golden and yuzu applies, they do not stack). A Golden Car is always capys, never ducks, and overrides the every-3rd-car duck rule for that index. Nothing else changes; it is ~30 lines on top of the cable car and the payout formula.

### 5.13 Season Fame (MVP Plus)
The Ridge Bridge lantern is repeatable. Level 1 (1,500) is the finale: "Famous Inn", permanent pay ×1.25, gold headband, fireworks, the sign "Ridge opens next season". Levels 2-5 (2,000 / 2,500 / 3,000 / 4,000) each add +5% pay (×1.30 … ×1.45) with a smaller firework, so the dim arrow always has a lantern to point at until every lantern and upgrade is maxed.

---

## 6. Fast-pace devices (all in MVP)

1. **Cable car heartbeat**: 18 s dock-to-dock at car level 0 (21 / 24 / 25 s as the cars grow), an in-world countdown ring on the bell post (r 26, 5 px arc — readable from anywhere on the map, so there is no HUD copy), "ding-ding" 3 s before docking, the car visibly sliding in. Night: 12 s. Car #1 is already docked when the game fades in; car #2 docks at 13 s.
2. **Short soaks**: 8 s at level 0 down to 5 s; ducks half that; Steam Rush halves the heated baths' soaks again. Slots free up staggered by plop order, so guests are always climbing in and out.
3. **Splash Chain window of 2 s across all baths** rewards arriving with a full trail and running between decks; **hit-stop** on the 3rd and 5th plop and a **rising arpeggio** make the batch feel like drum hits.
4. **Steam Rush** 10 s bursts with steam wash, 8 px shake, shaker music layer, chainable with escalating pay (1.5 → 1.75 → 2.0).
5. **Soft impatience**: sweat-drops on trailing (25 s), platform (40 s) and stall-queue (30 s) guests. A guest who leaves just walks off.
6. **Coin trays**: koban arc into the deck's tray with a clink, the stack grows, magnet at 60 px, fly-to-counter with per-coin clink rising a semitone across a burst, counter bounce.
7. **Screen bumps**: 4 px on unlocks and x3, 6 px on x4, 8 px on rush start and x5.
8. **Lantern Night** every 3 minutes: 60 s of indigo sky, glowing lanterns, cars every 12 s, +20% pay, lantern-light coins.
9. **Always-on next arrow** above Kit with a strict priority order (10.6, 12 rules). Subtle while you move, bigger and bouncier after 2 s idle; it never points at nothing until every lantern and upgrade is maxed.
10. **Kit is fast**: 280 px/s (350 with an empty trail), 0.12 s to full speed, dust puffs, tail whip.
11. **Ducks in flocks**: every third car once Cable Car I is lit; 8 / 10 / 12 ducks (three more than the level's capys), 15 s trail patience, half soak time, pay 3 — a duck car is worth a capy car, delivered as a flurry (x5 in 0.6 s, x8 in 1 s).
12. **Accelerating offering drain** (20 → 400 coins/s, a koban per tick) ending in flare + confetti + the structure unwrapping.
13. **FULL CAR** bonus rain for seating a whole car of 4 or more.
14. **Nothing on screen waits more than ~1 s to react**: joins 0.25 s, plops 0.12 s apart, coins 0.35 s to HUD, sheet 0.2 s slide.
15. **Golden Car** every 5th car (MVP Plus): a gold cabin with streamers, double guests with double patience, ×1.5 pay, fanfare; a party, not a panic.
16. **The first 30 seconds are the loop**: first meaningful input at ~2 s, first SPLASH x3 at ~6 s, a second x3 by ~17 s, the Cedar Bath by ~20 s.

---

## 7. Why it hooks (design intent for the team)
The trail makes walking itself the fun part and visibly grows with every capacity upgrade. Splash Chains turn drop-off into a scored moment every 10-15 s, and the run between decks is a skill the player discovers on their own. Steam Rush + a yuzu hat + x5 is a jackpot the player can *engineer*. The cable car bell is a heartbeat that never punishes. Offering steps guarantee an affordable-soon next thing on screen at all times. And capybaras with yuzu on their heads in a steaming pool is an instantly charming, shareable image that is cheap to draw, so effort goes into feel.

---

## 8. Economy and balance tables

All constants live in `src/00_config.js` (`G.C`) and the `src/02_data_*.js` tables. Names in `code` are the canonical ids.

### 8.1 Guests
| Species | id | Base pay | Walk speed | Patience platform / trail | Soak time | Size | Arrival |
|---|---|---|---|---|---|---|---|
| Capybara | `capy` | **6** | 110 px/s | 40 s / 25 s | bath soak × 1.0 | 44×32 | every car |
| Duck | `duck` | **3** | 150 px/s | 20 s / 15 s | bath soak × 0.5 | 28×30 | every 3rd car once `car` L1 is lit (8 / 10 / 12 per car); never at Lantern Night |

Payout per guest = `round(basePay × bathPayMult × famousMult × min(6.0, comboMult × max(yuzuMult, goldenMult) × rushMult × nightMult))`.
Multipliers: combo x3 1.25 / x4 1.5 / x5+ 2.0; yuzu hat 2.0 (earned in a golden bath, paid at climb-out); golden (guest arrived on a Golden Car, MVP Plus) 1.5 — **the larger of yuzu and golden applies, never both**; rush 1.5 / 1.75 / 2.0 by chain, **heated baths only**; night 1.2 (all baths); famous (bridge lit) 1.25, +0.05 per Season Fame level up to 1.45; bath Tips upgrade `1 + 0.15 × level` (6 levels → 1.9). The event product is capped at **6.0** (`MULT_CAP`); the Tips upgrade and fame scale outside the cap so the sheet keeps mattering. A mochi sale at the stall is a separate payout (8.7) that takes only nightMult and famousMult.
Worked examples: first car, 3 capys, Rock Pool, x3: `round(6 × 1.25) = 8` each → **24 coins**, enough for the 20-coin Cedar Bath with 4 to spare. Late game: Tips VI (1.9), fame 1.45, x5 × yuzu hat × chain-3 rush × night = 2.0 × 2.0 × 2.0 × 1.2 = 9.6 → capped to 6.0 → `round(6 × 1.9 × 1.45 × 6.0) = 99` per capy; a 9-capy car ≈ 890.

### 8.2 Cable car
| Car level (`carLevel`) | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Capys per car | 3 | 5 (±1) | 7 (±1) | 9 (±1) |
| Ducks on a duck car | — | 8 | 10 | 12 |
| Period, dock-to-dock | 18 s | 21 s | 24 s | 25 s |
| Lantern cost to reach | start | 70 | 250 | 600 |

**The period is arrival-to-arrival (dock-to-dock), everywhere.** Travel-in 2.5 s, dock 4 s, travel-out 2 s, so the away wait is `period − 8.5 s`; "ding-ding" 3 s before docking. Night: 12 s dock-to-dock. Platform holds at most **12** guests (arriving + waiting); a car spawns only as many as fit, and an empty car rings, docks and leaves without a FULL CAR record. **Car #1 is already docked at t = 0** (hop-outs from t = 0.6 s, one per 0.3 s): 3 capys, infinite patience, a 5 s tutorial soak. **Car #2 docks at t = 13 s**; from then on the period applies. After loading a save (no intro) the car starts sliding in after 0.5 s and docks at 3 s. Every 5th car (#5, #10, …) is a **Golden Car** (MVP Plus, rules in 5.12): 2x capys, 2x patience, ×1.5 pay, never ducks.

### 8.3 Baths
| Bath | id | Cost | Heated | Seats (base → max) | Soak (L0 → L6) | Upgrade base costs soak / seats / tips |
|---|---|---|---|---|---|---|
| Rock Pool | `rock` | built at start | no (natural: never cold, never rushed) | 3 → 6 | 8 s → 5 s | 30 / 45 / 40 |
| Cedar Bath | `cedar` | 20 (lantern `cedar`) | yes | 4 → 7 | 8 s → 5 s | 40 / 60 / 50 |
| Bamboo Tub | `bamboo` | 180 (lantern `bamboo`) | yes | 5 → 8 | 7 s → 4 s | 90 / 120 / 100 |

Soak = `base − 0.5 × soakLevel` (6 levels). Seats = `base + seatsLevel` (3 levels). Tips = `1 + 0.15 × tipsLevel` (6 levels). Plops 0.12 s apart; a guest climbs out over 0.4 s to the deck's lane-side exit point before paying into the tray. Rock + Cedar = 7 base seats, so a 7-guest car fits in one chain from the start of car level 2.

### 8.4 Upgrade sheet mapping (all costs `round5(base × 1.6^level)`)
| Station | key `speed` | key `slots` | key `pay` |
|---|---|---|---|
| Baths | **Soak**: soak −0.5 s/level, max 6 | **Seats**: +1/level, max 3 | **Tips**: +15%/level, max 6 |
| Boiler `boiler` | **Stoke**: +2 heat per log/level, max 6, base 60 | **Tank**: +15 max heat/level, max 5 (100 → 175), base 120 | **Pon**: Pon speed +15%/level and rest −0.3 s/level, max 5, base 90 (hidden until Pon is hired) |
| Grove `grove` | **Regrow**: −1.25 s/level (15 → 7.5 s), max 6, base 50 | **Trees**: +1 tree/level (2 → 5), max 3, base 80 | **Ripe**: golden water +1.5 s/level (10 → 19 s), max 6, base 70 |
| Snack Stall `stall` | **Prep**: −0.25 s/level (3 → 1.5 s), max 6, base 80 | **Counter**: +1 stock/level (2 → 5), max 3, base 100 | **Price**: +15%/level on mochi pay, max 6, base 90 |

Cost curve example (base 30): 30, 50, 75, 125, 195, 315 (levels 1..6). Maxing every track costs ≈ 24,000 coins; together with Season Fame that is the post-finale runway.

### 8.5 Lanterns (offering steps)
| id | Label | Step centre | Cost(s) | Requires | Builds / effect |
|---|---|---|---|---|---|
| `cedar` | Cedar Bath | (420, 1965) | 20 | — | Cedar Bath + Boiler + Woodpile appear; heat gauge appears at 75 with a 30 s no-drain grace |
| `trail` | Trail Rope | (50, 1990) | 35 → 200 → 700 | `cedar` | Trail capacity 3 → 5 → 8 → 12 |
| `grove` | Yuzu Grove | (120, 1745) | 60 | `cedar` | 2 yuzu trees |
| `car` | Cable Car | (490, 2000) | 70 → 250 → 600 | `trail` L1 | Car level 1 → 2 → 3 (guests per car, period 21 / 24 / 25 s); ducks begin at L1 |
| `pon` | Hire Pon | (405, 1735) | 80 | `cedar` | Pon the stoker |
| `stall` | Snack Stall | (430, 1585) | 120 | `grove` | Snack Stall (MVP Plus) |
| `kero` | Hire Kero | (350, 1450) | 150 | `stall` | Kero the picker (MVP Plus) |
| `bamboo` | Bamboo Tub | (235, 1530) | 180 | `car` L1 | Bamboo Tub |
| `bridge` | Ridge Bridge | (270, 1180) | 1500 → 2000 → 2500 → 3000 → 4000 | `bamboo`, `trail` L2, `car` L2 | L1 "Famous Inn": permanent pay ×1.25, gold headband for Kit, fireworks, sign "Ridge opens next season" (MVP finale). L2-5 Season Fame: +5% pay each (MVP Plus) |

Total lantern spend to the finale: 20+35+200+700+60+70+250+600+80+120+150+180+1500 = **3,965 coins**, plus sheet upgrades; Season Fame adds 11,500 after it.

### 8.6 Heat
| Constant | Value |
|---|---|
| Start / max | 75 / 100 (Tank → 175) |
| Cold threshold / Rush threshold | < 30 / ≥ 80 |
| Grace | no drain for 30 s after the boiler is built |
| Drain idle / occupied / rush | 0.5 / 1.0 / 4.0 units per s (heated baths only count as occupied) |
| Heat per log | 15 (Stoke → 27) |
| Woodpile pickup | 1 log per 0.35 s within 40 px, trail capacity permitting, never more than fills the tank (`logsInTrail × heatPerLog < (max − heat) + heatPerLog`) |
| Boiler intake | every log offered; surplus over max is wasted, or +1 s of rush per surplus log during a rush |
| Rush length / pay / soak speed | 10 s / ×1.5, ×1.75 (chain 2), ×2.0 (chain 3+) / ×2 — heated baths only |
| Rush chain | new rush starts instantly if heat ≥ 80 when the previous ends |
| Pon | 70 px/s, 1 log, 3 s rest after each stoke, stokes only up to 70 units |

### 8.7 Yuzu, grove, stall
| Constant | Value |
|---|---|
| Trees base / max | 2 / 5 (slots at (80,1690) (160,1690) (120,1630) (80,1570) (160,1570)) |
| Regrow | 15 s → 7.5 s |
| Golden water | 10 s → 19 s |
| Yuzu hat pay | ×2 at climb-out (hat given to every guest in the bath at the drop and to every guest landing while golden) |
| Grove pickup | only while `yuzuInTrail < (built baths not golden) + (stall built with room ? 1 : 0)` |
| Stall want chance / queue / queue patience | 35% of capys after a soak / 4 spots / 30 s (leaves quietly, not counted as lost) |
| Mochi prep / stock / pay | 3 s → 1.5 s / 2 → 5 / 3 × 6 = 18 × (1 + 0.15 × Price level) |
| Kero | hop 0.5 s, 60 px per hop (120 px/s), carries 1 yuzu |

### 8.8 Coins, trays and offerings
| Constant | Value |
|---|---|
| Koban arc | launch vz 260..340 px/s, gravity 900 px/s²; the horizontal velocity is solved so the koban lands in its tray ± 10 px (|v| ≤ 120 px/s); one soft clink per landing |
| Coin tray | one per built bath and one at the stall, at the `tray` point on the lane-side deck strip; holds any value; drawn as 1–5 stacked koban plus a value badge when ≥ 5; nothing ever lies on the floor or the water |
| Magnet | Kit within 60 px of a tray with coins: up to 6 koban leave the tray toward Kit (0.2 s), then a 0.35 s screen flight to the counter (owned by the HUD); the counter rolls up when the flight lands, so the number shown lags the real balance by at most 0.35 s |
| Koban per payout | `min(payout, 6)` with values summing to the payout |
| Offering drain | 20 coins/s, doubling every 0.5 s, max 400/s, one koban toss + tick every 0.06 s |
| Clink pitch | +1 semitone per coin in a burst, resets after 0.5 s without coins, max +12 |
| Bonus coins | FULL CAR rain and lantern light spawn already magnetised to Kit |

### 8.9 Offline earnings
`rate` = the **median** of the six 30-s income buckets ÷ 30 (coins per second over the last 3 minutes of play, so an event spike at quit time does not persist), capped at 20/s. Only in-play income feeds the buckets; offline coins never do. `mult = 0.10 + 0.10·(Pon hired) + 0.05·(Kero hired)`. `coins = floor(rate × mult × min(away, 2 h))`, so a 2-hour absence is worth at most 30 minutes of play. Shown only if away ≥ 60 s. Narrated as `floor(away / 25)` cable cars. Coins sitting in trays at save time are added to the card as "Pon tidied up N coins" (or "you left N coins in the trays" without Pon). Returning to a still-open tab after ≥ 60 s runs the same formula on the live state (no tray coins, nothing reloaded).

### 8.10 Timers summary
| Thing | Time |
|---|---|
| Car period, dock-to-dock / night | 18 / 21 / 24 / 25 s by car level / 12 s; car #2 at 13 s |
| Soak | 8 → 5 s (Bamboo 7 → 4), ducks ×0.5, rush ×0.5 on heated baths; tutorial car 5 s |
| Splash Chain window / plop gap / join gap | 2.0 s / 0.12 s / 0.12 s |
| Trail join hop / plop hop / climb out | 0.25 s / 0.25 s / 0.4 s |
| Rush / Lantern Night / Night cycle | 10 s / 60 s / 180 s (first at 240 s) |
| Heat grace after the boiler is built | 30 s |
| Yuzu regrow / golden water | 15 → 7.5 s / 10 → 19 s |
| Unwrap / sheet slide / banner | 0.35 s / 0.2 s / 2.0 s |
| Autosave | every 5 s and on hide |

### 8.11 Target income curve (the headless bot must reach ≥ 70% of these)
Measured by the harness bot (`node test/headless.js --seconds 1800 --csv test/balance/seed7.csv --beats`, seed 7, build 1.2.0). The bot is a perfect player (no guest lost, x5 on most cars, every upgrade bought when affordable), so a human's curve runs below this; the pacing that matters — the Cedar Bath by 0:12, Pon by 2:35, the Bamboo Tub by 5:06, the Ridge Bridge at ~25 minutes — lands within a quarter of the hand-derived schedule in 9.1. Upgrade tracks (≈ 24,000 coins to max) are the sink that absorbs the income; the bot ends 30 minutes with 2,374 coins in hand.

| Play time | 2 min | 5 min | 10 min | 20 min | 30 min |
|---|---|---|---|---|---|
| Cumulative coins earned (harness bot, seed 7) | 287 | 1,678 | 4,963 | 15,206 | 32,078 |
| Income rate at that time | 72/min | 434/min | 797/min | 1,173/min | 1,200/min |
| Other seeds at 20 min | seed 3: 19,009 · seed 11: 16,898 | | | | |

If the sim overshoots by > 40% at 10 or 20 minutes, turn the knobs in this order and re-run after each: (1) `YUZU_PAY` 2.0 → 1.75 and `YUZU_DUR` 10 → 8; (2) `SPLASH_MULT[5]` 2.0 → 1.75; (3) `RUSH_PAY` [1.5, 1.75, 2.0] → [1.35, 1.5, 1.75]; (4) `NIGHT_PAY` 1.2 → 1.1. Never touch lantern costs. The harness prints a BALANCE WARNING naming these knobs at 1.4× (architecture §17.5).

---

## 9. Progression

### 9.1 First 30 minutes, minute by minute (competent player; times are approximate)

Derived by hand from the v1.2 constants. WP6 replaces this table with the harness beats (`node test/headless.js --csv --beats`, seed 7: first lit time per lantern, first x3/x4/x5, first rush, first night); after that, do not hand-edit it.

| Time | Beat | Coins (cumulative earned ≈) |
|---|---|---|
| 0:00 | Fade in; car #1 is already docked with 3 capys (infinite patience, 5 s soak). LEAD → SPLASH x3 → COLLECT 24 | 24 |
| 0:13 | Car #2 docks. LEAD → second SPLASH x3 (Rock Pool) → **Cedar Bath** lit (20) at ~0:20: bath, boiler and woodpile unwrapped on the right; heat gauge appears at 75 with a 30 s grace | 48 |
| 0:31–1:05 | Cars #3, #4 every 18 s go into the Cedar Bath (first heated soak, steam). **Trail Rope I** (35) at ~0:50 → cap 5. **Yuzu Grove** (60) at ~1:05 | 110 |
| 1:07 | Car #5 is the first **Golden Car** (MVP Plus): 6 capys, ×1.5 pay, and the first **FULL CAR** (+12) | 180 |
| 1:25 | Heat drops under 40 for the first time: STOKE prompt; first wood run (3 logs → 85) → first **Steam Rush** on the Cedar Bath | 200 |
| 1:50 | Chevron over the Rock Pool + TAP: **Soak I** (30) via the sheet — the sheet is discovered; first yuzu-hat batch | 240 |
| 2:15 | **Cable Car I** (70): 5 guests per car every 21 s; duck cars (8 ducks, pay 3) every 3rd car | 300 |
| 2:50 | **Hire Pon** (80): the water stays warm, rushes are yours. First **x5**: a 5-trail split 3 + 2 across Rock and Cedar inside the 2 s window | 380 |
| 3:30 | **Snack Stall** (120, MVP Plus): mochi wants; Kit delivers yuzu by hand | 480 |
| 4:00 | **First Lantern Night** (60 s, cars every 12 s, +20%, lantern-light coins) | 540 |
| 5:00 | Cedar **Seats I** (60), Rock **Seats I** (45) → 9 seats; x5 on most cars | 650 |
| 5:40 | **Hire Kero** (150, MVP Plus): the stall runs itself | 760 |
| 6:30 | **Bamboo Tub** (180), 5 seats: three baths, 14 seats, guests split by the arrow | 900 |
| 7:00 | Night #2; **Trail Rope II** (200): 5 → 8 → whole 7-guest cars in one trail | 1,000 |
| 8:30 | **Cable Car II** (250): 7 per car every 24 s; Rock/Cedar **Tips I-II** | 1,350 |
| 10:00 | Night #3; Boiler **Tank I-II** (120, 195): longer rushes; chain rushes appear; Grove Regrow / Ripe II | 1,800 |
| 12:30 | **Cable Car III** (600): 9 per car every 25 s; Seats II-III everywhere; duck cars of 12 | 2,600 |
| 15:00 | **Trail Rope III** (700): 12 followers; 9-capy cars in one line, x9 chains every car | 3,400 |
| 18:00 | Soak levels 3-5, Tank III-V, Stall Counter II-III; income ~330/min | 4,300 |
| 20:00 | Tips III-IV, Regrow / Ripe IV-V; saving for the bridge with the dim arrow on it and TAP for what is affordable meanwhile | 4,800 |
| 22:00 | **Ridge Bridge** (1500): fireworks, "Famous Inn" ×1.25, gold headband, sign "Ridge opens next season". MVP content complete | 5,600 |
| 24:00–30:00 | **Season Fame II-III** (2000, 2500) and the remaining upgrade tracks (6 levels each); the player closes the app → offline card next time | 9,000 |

### 9.2 Long term (post-MVP)
- **Ridge zone** (bridge actually opens): Massage Pavilion (Madame Tsuru, 5x pay, 12 s, 2 slots), Sauna Hut (guests exit wanting a cold plunge: chain visit), Momo VIP at Lantern Night (10x, demands a golden bath).
- **Summit** and **Cave Bath** zones: one new station type and one helper each; geyser timing mini-mechanic.
- **New Season prestige**: resets coins and buildings, grants permanent Yuzu Seeds (+5% pay each) and a seasonal palette (spring pink, summer green, autumn red, winter snow).
- **Guestbook** daily goals ("Splash x5 three times") with stamps and small coin bonuses (the stats it needs are already counted).
- Cosmetic headbands and lantern colours from milestones.

---

## 10. UI / UX specification

Logical space **540 × H** where H = 960 on a 9:16 screen and grows up to 1200 on taller phones (width is always fitted, never letterboxed on portrait phones; landscape desktop windows letterbox to 540 × 960 with dark bars). `st`/`sb` = safe-area insets (top/bottom) in logical px, read once at boot. Everything is drawn on the canvas; there is no DOM UI. One logical px is ≈ 0.7 CSS px on a 6-inch phone, so the minimums in 10.9 (4 px features, 56 px tap targets) are not optional.

### 10.1 Screens / states
| State | What is on screen | Exit |
|---|---|---|
| `intro` (1.2 s) | Cream fade from white; car #1 is already docked and its capys start hopping out at 0.6 s; the bell post swings silently (no sound before a gesture — the first `bell` plays on the first touch, which is also when the joystick blooms); Kit stretches | auto or any tap |
| `play` | The world + HUD + arrow + joystick | — |
| `sheet` | play + the bottom sheet (world keeps running) | X, outside tap, walk away |
| `card` | play frozen + a centered card (offline earnings, reset confirm) | its button |
| `settings` | play + a small popover under the gear | gear or outside tap |
| `paused` (tab hidden) | nothing drawn; loop stopped; saved | tab visible |

The mode is **derived** from what is open (card > settings > sheet > play), so overlapping UI (sheet + settings) can never leave a stale mode; only `intro` and `paused` are stored.

### 10.2 HUD elements (positions in logical px)
| Element | Position / size | Behaviour |
|---|---|---|
| **Coin pill** | (16, st+14), 170 × 48, r 24, cream fill 85%, koban icon at (40, st+38), number **30 px** bold ink at x 64, abbreviates ≥ 10k as "12.3k" | Scales 1.25 → 1 over 0.25 s each time a coin flight lands; number rolls up over 0.3 s; the coin flights (HUD-owned, 0.35 s) end here |
| **Trail pips** | y st+74, from x 22, dots **r 6 spaced 15**, one per capacity slot | Filled = amber, empty = 30% ink (no kind colouring — the trail itself is on screen); all full → pips pulse 1 ± 0.08 |
| **Heat kettle** | icon 36 × 30 at (488, st+14); bar **100 × 18** at (424, st+52) with a 3 px ink outline, amber fill left→right, threshold ticks at 30% (snowflake glyph) and 80% (steam-wisp glyph); hidden until the boiler is built | < 30: a frost hatch pattern fills the empty part and the bar flashes white-blue at 2 Hz; ≥ 80: three animated steam wisps grow from the bar top and the fill pulses gold; rush: ribbon "STEAM RUSH" 110 × 22 at (414, st+78) slides in with a shaker icon and the chain count ("x2") |
| **Gear** | drawn 48 × 48 at (476, st+108); hit rect 60 × 60 | Opens settings popover |
| **Banner** | pill 320 × 56 centered at (270, 0.22·H) | Slides in from the right 0.3 s, holds 1.4 s, out 0.3 s. Texts: "LANTERN NIGHT", "FULL CAR!", "GOLDEN CAR!", "STEAM RUSH" (first time only), "FAMOUS INN!", "SEASON FAME" |
| **Next arrow** | 26 px CTA triangle with a 3 px cream stroke, 46 px above Kit's head, rotated toward the target; tutorial word **34 px** bold CTA with a 4 px cream stroke, 22 px above the arrow | Bobs 4 px at 3 Hz; alpha 0.7 while moving, 1.0 and ×1.2 size after 2 s idle; alpha 0.45 for the dim rule; hidden when the target is Kit's own position |
| **Level pill** | **68 × 28**, 18 px text, above a built station when Kit is within 160 px: "Lv 3" (sum of the station's levels) | Shows "TAP" instead under the gate in 10.6; hidden while a banner is up; bounces when the station is tapped from too far |
| **Upgrade chevron** | 28 px CTA up-chevron bouncing 6 px at 2 Hz above the station that holds the cheapest affordable upgrade | One on screen at a time; it is the standing invitation to open the sheet |
| **Drag hint** | ghost thumb circle r 36, cream 40%, at (270, 0.78·H); slides 60 px toward the arrow direction and fades, looping every 1.6 s | Shown if no stick input has happened within 2.5 s of car #1's first hop-out; stops on the first stick move and is never shown again (`tutorial.DRAG`, persisted) |
| **Debug overlay** (key ` or `?debug=1`) | top-left small mono text: fps, frame ms, step ms, entity counts, heat, state | dev only |

There is no HUD car ring: the bell post's countdown ring (r 26, 5 px arc) is always on screen (2.2) and pulses in the last 3 s.

### 10.3 Movement: floating joystick (the only control)
- Touch anywhere with `y > 0.30·H` that is not on a UI element: a joystick base (r 90, ring stroke 4 px, fill cream 12%) appears under the thumb with a knob (r 36, cream 55%). Its alpha eases 0.35 → 1 over 0.1 s from the touch, whether or not the thumb has moved yet.
- Dead zone 8 px. Magnitude ramps from 0 at the dead-zone edge to 1 at 70% of the radius (63 px), so short thumb travel is enough and there is no jump at the edge.
- **Trailing base**: once the thumb is farther than 90 px from the base, the base follows the thumb (visibly), so reversing direction never needs a long swipe back through the base.
- Release: fades out in 0.15 s. Multi-touch: the first touch owns the stick; a second touch is treated as a tap.
- **Tap** = touch that ends within 250 ms having moved < 12 px. Tap priority: card → settings → sheet → gear → station (world hit-test, footprint + 20 px: within 160 px of Kit → sheet; farther → the pill bounces, the arrow flashes toward it for 1 s, "pip") → a tap in the joystick zone during car #1 → Kit hops 0.3 s toward the arrow (nothing the player does feels dead) → nothing.
- With the sheet open, a pointer that starts on the sheet and moves more than 12 px becomes the stick; sheet buttons only consume clean taps.
- Desktop: mouse behaves as a touch; **WASD / arrows** move; **E** opens the nearest station sheet / closes; **Esc** closes; **M** mutes; **`** debug.
- The page uses `touch-action: none`, blocks double-tap zoom and pull-to-refresh, and requests nothing else (no fullscreen prompts).

### 10.4 Station sheet (bottom 34% of the screen, min 300 px)
- Cream panel #F6F1E7 with a 10 px cedar top bar and r 22 top corners; slides up 0.2 s ease-out.
- Title 26 px ink at (24, top+22); to its right, the last-tapped button's effect text at 18 px ("Soak 8.0 s → 7.5 s"); close X drawn 48 × 48 at (540−64, top+8), hit rect 60 × 60.
- Three buttons 150 × 112 at y top+70, x 20 / 195 / 370 (15 px gaps), white r 16: icon 28 px, label **22 px**, level pips row (6, 5 or 3 small rounded rects, filled amber), cost pill (koban icon + number, **24 px**). Affordable: CTA pill; unaffordable: grey pill, number in red, a lock glyph, tap = wiggle + "nope" sound; maxed: green "MAX" with a check glyph.
- Tapping buys instantly: pop, pips fill with a bounce, the station squashes, sound "pip".
- Bath labels are **Soak / Seats / Tips**; the other stations use their themed labels (8.4).

### 10.5 Offering steps (in world)
The stone step (48 × 20 slab with a shimenawa rope, three paper shide and a saisen box at the post's foot, 5.7) is the stand point; the post stands 38 px behind it. A 6 px CTA arc around the step (r 30) shows sunk/cost. Affordable: solid CTA outline pulsing 1 ± 0.05 at 1.5 Hz, glowing shide and a small flame glyph on the lamp; unaffordable: dashed grey outline. The cost pill (cream 56 × 26, 22 px number, koban icon) floats 78 px above the step, only for the arrow's target and lanterns within 200 px of Kit; other revealed lanterns show a bare lamp with a small coin glyph. Standing short with 0 coins: the pill turns red with the shortfall. ✓ for 1 s when lit. The lamp body brightens from #6B5A4A to amber with fill and its flame grows 0 → 14 px; lit lanterns keep a soft halo (bigger at night). All labels are pill-backed, unstroked text.

### 10.6 The next arrow — priority rules (evaluated every frame, first match wins)
1. **SOAK (chain)**: trail has guests, a Splash Chain is live (`now − splash.t < 2.0 s`) and a warm bath with a free seat exists → the nearest such bath (the bath Kit stands on if it still has seats: then the arrow hides).
2. **SOAK**: trail has guests → the built warm bath that maximises `min(freeSeats, guestsInTrail)`, ties broken by distance; if no bath has ≥ 3 free and the trail has ≥ 3 guests, or nothing is free anywhere → the bath whose next seat frees soonest (the batch lands as seats open).
3. **STOKE**: trail has logs and heat < max, **and heat is under 40 or cold** → boiler. (Logs picked up in passing while the boiler is warm are not urgent: this rule is re-checked after rule 8, so the logs ride along and get dropped after the next collect instead of hijacking the arrow. Found by the harness: with the old order the woodpile-to-boiler shuttle never ended.)
4. **YUZU**: trail has yuzu → nearest bath that is not golden; if all golden and the stall is built with room → stall.
5. **STOKE**: boiler built, grace over, heat < 40 and not in a rush → woodpile.
6. **LIGHT**: a revealed lantern is affordable (cost − sunk ≤ balance) → the cheapest one. (Moved ahead of LEAD and COLLECT in the balance pass: once cars bring five guests every 21 s there is always someone to lead, and the unlocks were never pointed at. Lighting takes 1–2.5 s; platform patience is 40 s.)
7. **LEAD**: any guest waiting on the platform and trail not full → nearest waiting guest.
8. **COLLECT**: a tray holding ≥ 5 within 400 px → the fullest tray.
9. **YUZU** (stall): stall built, a guest is queued, stock + pending = 0, and a ripe yuzu can be picked → nearest ripe tree.
10. **TAP**: the first lantern is lit and a built station has an affordable sheet upgrade → that station's footprint centre (the cheapest upgrade's station).
11. **YUZU**: grove built and a ripe yuzu can be picked (5.1 cap) → nearest ripe tree.
12. Otherwise, **dim**: the cheapest revealed lantern; if none, the station with the cheapest sheet upgrade. The arrow hides only when every lantern and upgrade is maxed.

Tutorial words appear with the arrow the first **two** times each rule's word fires: LEAD, SOAK, COLLECT, LIGHT, STOKE, YUZU, TAP. The level pill shows "TAP" (counting toward the same limit, only if visible ≥ 1 s) only when no arrow word is on screen, the first lantern is lit, and that station has an affordable upgrade — so TAP lands around 1:20–2:00, never on top of the first SPLASH. Never more than one word on screen; never any other text during play except numbers and the banners.

### 10.7 Cards
- **Offline**: 440 × 320 centered, cream, r 24. Title "Welcome back!" 28 px; Pon (or Kit) waving on the left; "N cable cars came by" 22 px; "+X" 40 px gold; button COLLECT 220 × 64 CTA. Tap → 20-coin rain into the counter, card slides down.
- **Reset confirm**: "Start a new inn?" with KEEP / RESET.

### 10.8 Settings popover (under the gear, 260 × 220, rows 56 px)
Rows: Sound on/off, Haptics on/off, **Shake & flash** on/off (off zeroes camera shake, hit-stop and the white flash; persisted), Low effects on/off (auto-on by the performance detector, never auto-off), then a 12 px gap and Reset save. Also shows the version string.

### 10.9 Feedback rules
Every coin gain shows a "+N" pop (rises 40 px, fades in 0.7 s, 20 px bold, 3 px ink stroke). Every unlock: bump + puff + confetti + "pop" + the unwrap. Every combo: text with overshoot (scale 0 → 1.15 → 1 in 0.25 s). Screen shake never exceeds 8 px and always decays within 0.3 s; the white flash never exceeds 0.35 alpha and decays in 0.25 s. **Text priority** when several want the screen: combo pop > banner > arrow word > level pill > lantern cost pill; the level pill and cost pills hide while a banner is up; text on screen at any time: at most 3 words. **Every state is shape + colour, never colour alone**: frost hatch / steam wisps on the heat bar, solid vs dashed outlines on steps, lock / check glyphs on the sheet, a frost dash on cold water. **Sizes**: no drawn feature under 4 logical px, no tap target under 56 logical px. Bubbles are culled as in §3; bubbles, the arrow, pops and labels draw after the night tint.

---

## 11. Art direction

### 11.1 Projection
Straight **top-down-oblique billboard** view. The ground is the XY plane drawn 1:1 (world units = logical px at zoom 1). There is **no camera matrix and no Y squash**; the oblique feel comes entirely from the art rules: ground footprints are drawn foreshortened (a pool is 160 wide and 95 tall), everything standing up is drawn upright at its feet-Y, every solid object has a darker "thickness" band along its bottom edge, and every character/object casts a soft ellipse shadow. Depth-sort every drawable by its **feet-Y** (bottom of footprint) each frame; ground decals (decks, water, steps, trays, ripples) are drawn in an unsorted ground pass first.

### 11.2 Style rules ("chunky paper cutout")
- Every object = 2-3 flat fills: a top colour, a thickness band 8-12 px (6 px on characters) in the darker shade along the bottom edge, and a shadow ellipse rgba(0,0,0,0.18).
- No outlines, except a 2 px darker stroke on characters (white ducks get a 2 px stone-grey line so they read on cream decks).
- Rounded corners everywhere (r 8-14 on plates, r 5-11 on bodies).
- Highlights: one lighter ellipse/arc on the top-left of round things (canopies, koban, lamps).
- Nothing uses `shadowBlur`, `filter`, or per-frame gradient creation. Halos are **one pre-rendered sprite** drawn with `drawImage` + `globalAlpha`; the few gradients (mist, boiler window) are built once at init.
- **Silhouette test**: every character rendered in flat ink at 50% scale must be identifiable (Kit = ears + tail, capy = loaf + snout, duck = ball + beak, Pon = wide hat, Kero = eye stalks). The art smoke page renders this row.

### 11.3 Palette (canonical, `G.PAL`)
| Token | Hex | Use |
|---|---|---|
| cedar / cedarDark | #C98A5B / #8F5B36 | deck plates, stall counter, logs, trays, shimenawa rope |
| plank | #B57A4E | plank lines on decks |
| stone / stoneDark | #B9B3A6 / #7F796D | platform, path, pool rims, pylons, offering steps, duck line |
| waterHot / waterHotDeep | #2FA6A0 / #238C87 | bath water |
| ripple | #8EE3DC | ripple rings, shimmer, sweat drop |
| waterCold | #B7C2CC | cold bath (plus a white frost dash along the rim) |
| waterYuzu | #E9C46A | golden bath |
| cream | #F6F1E7 | UI panels, belly, headband, snow, paper wrap, the stroke behind CTA text |
| pine / pineDark / moss | #3F7D5A / #2C5A40 / #4E9A6C | terrain, trees, yuzu leaves, Kero's stroke |
| amber / amberDeep | #FFC857 / #FF9A2E | lanterns, heat, glow, pips (cooler than Kit, so Kit stays the only red-orange) |
| cta | #E4572E | **the one call-to-action colour**: arrow, tutorial word, affordable outlines, upgrade chevron, COLLECT button; text in it always carries a 3 px cream stroke |
| skyDay / skyDusk / skyNight | #CFEAF2 / #E7A5A0 / #2B2F5B | tint overlays |
| coin / coinHi / coinRim | #FFD24A / #FFF1B0 / #C99400 | koban (gold ovals with a dark rim) |
| yuzu / yuzuLeaf | #F5C400 / #2C5A40 | yuzu fruit — always drawn with its leaf and a dimple, never as a bare circle |
| ink | #1F2430 | UI text, strokes |
| red | #D93A3A | cable car, stall stripes, Kero's scarf, Pon's hat band, alerts |
| fox / foxDark | #F08A3E / #8F4A1F | Kit |
| capy / capySnout / capyDark | #9C6B43 / #6E4A2E / #7A5233 | capybara |
| duck / duckBeak / duckLine | #FFFFFF / #F28C28 / #7F796D | ducks (white Pekin) |
| tanuki / tanukiMask / happi / straw | #7D6B5A / #3B2F28 / #5C6F8A / #D9B36A | Pon |
| frog / frogDark | #A8E063 / #2C5A40 | Kero |
| boiler / boilerLight | #2A2A2E / #3E3E44 | boiler body |
| mist | #F6F1E7 | Ridge and valley mist gradients |

Palette rules: **the yellow family (coin, yuzu, amber) means money, yuzu and glow, and nothing else** — no character wears it; **CTA vermilion is used for nothing but calls to action**; states are never colour-only (10.9).

### 11.4 Layers, per frame (world → screen)
1. Static layer (cached offscreen canvas of y 1100..2400): terrain incl. the valley (mist gradient + pine tips below the cable), moss patches, path stones, pines, rocks, platform plate, cable line and pylons, bridge planks, the deck plates of built baths and the static bodies of built structures (woodpile, stall counter + awning, tree trunks + canopies, boiler body). Rebuilt when a structure finishes unwrapping.
2. Dynamic ground pass (unsorted): offering steps, water rects (state colour, rim, shimmer, frost dash), ripples, coin trays and their stacks, soak rings, dust.
3. Sorted pass by feet-Y: Kit, guests, trail logs/yuzu, lantern posts (post + lamp + flame), ripe fruit on trees, boiler glow window + smoke, stall mochi, bell post, cable car, helpers, airborne koban, structures mid-unwrap.
4. World FX: steam, splash droplets, puffs, confetti, koban tosses into offering boxes, mist gradient over the Ridge.
5. Night: full-screen multiply tint (0.40 × fade; 0.30 in low-effects mode); then additive halo sprites for lit lanterns (at most 8, lit lanterns first), boiler glow, golden baths, stone lanterns (plain tinted circles).
6. World text (after the tint, always readable): want bubbles, sweat drops, hearts, world pops, the arrow + word, lantern cost pills, level pill, upgrade chevron.
7. Screen space: HUD (including the coin flights), sheet, cards, joystick, drag hint, white flash, debug.

### 11.5 Procedural recipes (local space, feet at (0,0), +y down; `f` = face sign)
**Kit** (52 tall): shadow rx16 ry6. Tail: three 5 px strokes from (−8f, −14) curving to (−22f − lag, −18 ± 4), lag = clamp(vx·0.04, −8, 8), colours fox with a cream tip. Legs: two 8×10 rrects at (−7, −10) and (3, −10) foxDark, alternating ±3 px at 8 Hz when moving. Body rrect (−11, −30, 22, 22, r8) fox; belly ellipse (0, −18) rx7 ry6 cream. Head circle r12 at (0, −40). Ears: two triangles base 9, height 12 at (−9, −49) and (9, −49), tips (top 4 px) foxDark. Headband rect (−12, −45, 24, 6) cream + red dot r4 at (4f, −42) (gold band after the bridge). Muzzle ellipse (5f, −37) rx5 ry4 cream with nose dot r2 foxDark; muzzle x-offset 0 when facing down, hidden when facing up. Eyes: two dots r3 at (1f, −41) and (7f, −41). Stroke 2 px foxDark on body and head. Pose `pump`: a raised arm rrect (−14f, −36, 6, 12) rotated −30°, 0.4 s.
**Capy** (44×32): shadow rx20 ry6. Thickness: draw the body rrect in capyDark offset +3 y, then body rrect (−22, −30, 44, 26, r11) capy. Legs: four 6×6 rrects at x −14, −6, 6, 14, y −6 capyDark (walk bob ±2). Snout rrect (12f−2, −24, 14, 12, r5) capySnout (no nostrils). Ears: circles r4 at (−8f, −31) and (2f, −31) capyDark. Eyes: two ink dots r3.2 at (4f, −22) and (10f, −20); sleepy = a 2 px capyDark lid line that drops over the dot in three steps (0.33 / 0.66 / 1.0 of the soak). Yuzu hat: circle r10 at (−2, −38) yuzu with a 2 px coinRim rim + two leaf ellipses rx6 ry3 yuzuLeaf at (4, −46) and (−4, −46), sitting on the crown so it clears the water line. In water: translate +8 y and clip to the water rect so the top 60% shows; the guest sinks a further 4 px over the soak; a ripple ring under it; a steam puff with every heart. Sweat drop: teardrop at (14f, −40) ripple colour, scale by urgency. Shiver: x jitter ±2 at 20 Hz and a 30% waterCold tint.
**Duck** (28×30): shadow rx12 ry4. Feet: two 2 px duckBeak lines. Body circle r13 at (0, −14) duck with a 2 px duckLine stroke; wing ellipse rx7 ry3.5 at (−3f, −13) stone. Head circle r8 at (7f, −29) duck, stroked. Beak triangle from (13f, −29), length 9, height 5.5, duckBeak. Eye dot r2.6 at (8f, −31). Bob at 2x.
**Pon** (44): shadow rx16 ry6. Feet: two 7×6 rrects. Body circle r16 at (0, −18) tanuki; happi coat rrect (−15, −24, 30, 16, r6) happi over the lower body; belly circle r9 at (0, −14) cream. Mask rrect (−12, −26, 24, 7, r3) tanukiMask; eyes: white dots r3.2 at (−6, −23) and (6, −23) with ink pupils r2. Nose dot r2 at (0f·8, −19). Hat: brim ellipse rx22 ry6 at (0, −33) straw + dome rrect (−10, −41, 20, 9, r4) straw + band rect (−10, −35, 20, 3) red. Carried log: 26×10 rrect at (12f, −30) rotated 20°. Yawn: mouth ellipse ry grows 1 → 4 over 0.4 s.
**Kero** (36): shadow rx12 ry5. Body circle r13 at (0, −14) frog with a 2 px frogDark stroke; belly ellipse rx8 ry6 at (0, −11) cream. Eyes: circles r5 at (−6, −25) and (6, −25) cream with pupils r2.5 ink. Smile: 2 px arc from (−7, −12) to (7, −12). Scarf rrect (−12, −8, 24, 6, r3) red. Carried yuzu: circle r8 yuzu + leaf at (0, −36). Hop: z parabola 26 px, 0.5 s, squash (1.15, 0.85) on land for 0.15 s.
**Koban** (coin): ellipse rx8 ry5.5 coin with a 2.5 px coinRim rim and one highlight rrect (−4, −2, 6, 2) coinHi; ground shadow ellipse scaled by height while airborne. **Tray**: rrect 40×22 r6 cedar with a 6 px cedarDark thickness band; the stack = `min(5, ceil(value / 5))` koban drawn 3 px apart upward; a value badge (cream pill 26×16, 12 px ink number) above it when value ≥ 5.
**Log**: rrect 26×10 r4 cedarDark with end circles r4 cedar; bobs with the trail. **Yuzu**: circle r8 yuzu with a 2 px coinRim dimple line and a leaf ellipse rx6 ry3 yuzuLeaf; rotates by distance travelled (rolling).
**Water** (bath): rrect r18 filled waterHot (waterCold when cold, waterYuzu when golden), a 6 px stone rim stroke outside and a 3 px waterHotDeep inner edge; cold adds a white 4/4 dash along the rim. Shimmer: 3 ellipses rx26 ry6 ripple colour alpha 0.18 drifting with sin(t). Ripples: rings 10 → 36 px over 1.4 s, alpha 0.5 → 0, 2 px ripple colour, one per soaking guest every 0.9 s. Golden: 3 yuzu circles r7 (with leaves) bobbing. Soak ring: 3 px arc r14 above each soaking guest, cream, progress clockwise.
**Deck plate**: rrect r14 cedar with 10 px cedarDark thickness band and plank lines 1 px plank every 18 px.
**Steam**: circles r8..16 cream, rising 22 px/s with sin drift, alpha 0.45 → 0 over 1.6 s; 3/s per hot bath, 8/s in rush, plus a 20-circle "wash" across all decks at rush start.
**Lantern (offering step)**: at the step centre a plate 48×20 r6 stone/stoneDark; the post rrect (−3, −44, 6, 44) #4A2E1F stands at (x, y − 38); the shimenawa rope is a 2 px cedarDark line across the post's front 20 px above the step with three cream shide triangles (base 6, height 10) hanging from it; the saisen box rrect 20×12 r3 #4A2E1F at the post's foot. Lamp rrect (−11, −70, 22, 28, r6) colour mixed #6B5A4A → amber by fill, with a flame (teardrop, amberDeep core, height 0 → 14 px by fill, flickering ±1 px) inside; roof rect (−13, −72, 26, 5) #4A2E1F; fill arc 6 px cta r30 around the step; halo sprite alpha 0.35 × fill (additive pass). **Unwrap** (on build): four cream strips, each a quarter of the footprint width and its full height, drawn over the finished structure; over 0.35 s they translate +12 y, rotate ±8° alternately and fade to 0, with a dust puff.
**Boiler**: body rrect (−30, −70, 60, 70, r12) boiler; band (−30, −30, 60, 8) boilerLight; window rrect (−18, −58, 36, 44, r6) #1A1A1E with a heat fill rect rising from the bottom (height 44 × heat/max, gradient amberDeep → amber built once); chimney rrect (14, −92, 12, 24) boilerLight with smoke puffs at a rate proportional to heat; rush: halo + fast smoke.
**Woodpile**: six logs in a 3-2-1 pyramid; infinite supply.
**Yuzu tree**: trunk rrect (−5, −26, 10, 26) cedarDark; canopy circles r22 at (0, −44), r18 at (−14, −36) and (14, −36) pine with a moss highlight circle r10 at (−8, −50); ripe yuzu circle r7 at (−6, −40) with leaf, pulsing 1 ± 0.06; unripe bud: frog circle growing r2 → r4 with progress.
**Snack stall**: counter plate 120×36 cedar/cedarDark; two posts; awning rrect 132×18 with six alternating red/cream stripes and a scalloped bottom (5 semicircles); mochi on the counter = cream circles r8 with a red dot; a small progress ring while preparing.
**Platform**: plate 320×80 stone/stoneDark; back railing line with 5 posts; bell post: post + gold bell (rrect r8 + dome) + countdown ring r26, 5 px arc, pulsing in the last 3 s.
**Cable car**: cable 3 px #4A4A4A at y 2120 across the map; pylons rrect 10×60 stoneDark from y 2060 to 2120 + cross beam at x 60 and 480; cabin: wheel circle r5 on the cable, a 12 px arm, body rrect 70×40 r10 red from y 2137 to 2177, cream window band (−28, −14, 56, 14) with 2 dividers, door at the bottom of the band (x, 2172) where guests hop out **up** onto the platform; pendulum ±3° at 2 rad/s about the wheel; 2-3 capy head circles in the window while carrying. Golden Car: straw-gold body with red streamers.
**Valley** (static, y 2200..2400): a cliff edge band 2200..2212 stoneDark, pine tips (pineDark triangles base 40, height 50, every 45 px at y 2230..2330, offset rows) and a mist gradient (cream alpha 0 at 2200 → 0.9 at 2400) over them.
**Pine**: two stacked triangles (base 40 and 30) pineDark with a lighter pine edge on the left, trunk 6×10. **Rock**: 2 overlapping grey ellipses stone/stoneDark.
**Path**: 60 px stone strip alpha 0.6 with lighter stepping-stone circles r9 every 40 px. **Terrain**: pine base with darker patches and moss ellipses. **Bridge**: planks 60 wide climbing from y 1150 to 1000 under the mist gradient (cream alpha 0 at 1150 → 0.95 at 1000).

### 11.6 Animation rules
- Squash-stretch on every landing: (sx 1.15, sy 0.85) back to (1, 1) over 0.2 s, ease-out. Applied around the feet.
- Followers bob 3 px in a sine wave offset by index; ducks 2x rate.
- Characters face 2 directions by mirroring, plus muzzle/beak offset 0 when facing down and hidden when facing up.
- Every structure is **unwrapped** on build (11.5) over 0.35 s with a dust puff; nothing rises out of the ground.
- Moods are motion, not pupils: soaking guests sink 4 px and puff steam with each heart; cold guests jitter; sleepy is a lid line in three steps.
- Day/night = one multiply tint + one additive halo-sprite pass. Nothing more expensive.
- Hit-stop: the world freezes for 40 ms on the 3rd plop of a chain, 100 ms on the 5th, 120 ms at rush start; never more than 150 ms per second in total; rendering and the joystick keep running; all of it off with "Shake & flash".

---

## 12. Audio direction (all WebAudio, no files)

Master gain 0.5, mute toggle, at most 6 simultaneous voices, the same sound at most once per 30 ms. The AudioContext is created on the first touch/click/key; **no sound plays before that gesture** — sounds requested earlier are dropped, not queued, and the first `bell` plays on the unlock itself so the first touch is confirmed by the car's bell. Haptics via `navigator.vibrate` when enabled.

| Name | Recipe | When |
|---|---|---|
| `boing` | triangle 220 → 440 Hz over 0.12 s, decay 0.15 s | guest hops out of the car |
| `blip` | sine 520 Hz × (1 + 0.12·trailIndex), 0.08 s | item joins the trail |
| `quack` | sawtooth 400 → 300 Hz, lowpass 900 Hz, 0.1 s | duck joins / duck splash |
| `splash` | white-noise burst lowpass 1200 Hz 0.25 s + sine thump 180 → 90 Hz 0.15 s | guest lands in water |
| `plink` | sine arpeggio C5 E5 G5 C6 E6 (steps 1..5 by chain count, 5 for all higher counts), 0.12 s each | each plop of a chain |
| `clink` | triangle 1800 Hz × 2^(n/12), 0.06 s; n rises per coin in a burst, resets after 0.5 s | coin flight reaches the counter |
| `clinkSoft` | `clink` at gain 0.4, no ladder, throttled to one per 60 ms | koban lands in a tray |
| `tick` | square 800 → 1600 Hz by fill fraction, 0.03 s | offering drain (every 0.06 s, one koban toss) |
| `pop` | triangle 300 → 150 Hz 0.2 s + noise puff 0.1 s | lantern lit / structure unwrapped / upgrade bought |
| `pip` | sine 900 Hz 0.05 s then 1200 Hz 0.05 s | upgrade pip fills; far-tap on a station |
| `nope` | square 200 Hz 0.08 s ×2 | unaffordable tap / standing short |
| `bell` | sine 880 + 1320 Hz partials, decay 1.2 s | car docks; audio unlock; ×2 quickly = `dingding` 3 s before docking |
| `whoosh` | noise bandpass sweep 400 → 3000 Hz 0.6 s | Steam Rush start |
| `stoke` | noise crackle lowpass 600 Hz 0.15 s + sine 120 Hz thump | log into boiler |
| `sigh` | sine 660 → 440 Hz 0.3 s, soft | capy heart while soaking |
| `shiver` | two triangle 300 Hz blips 0.04 s | bath goes cold |
| `yuzu` | sine 1046 Hz 0.1 s then 1568 Hz 0.1 s | yuzu bath starts / yuzu picked |
| `hop` | sine 500 → 800 Hz 0.08 s | Kero hop |
| `puff` | filtered noise 0.12 s | dust / unwrap |
| `fanfare` | 4-note triangle chord C E G C, 0.6 s | FULL CAR, Golden Car arrival, Famous Inn, Season Fame |
| `chime` | sine 1760 Hz + 2640 Hz, decay 1.5 s | Lantern Night bell |

**Music**: `pad` = two detuned triangle oscillators (A2 110 Hz, E3 165 Hz) through a lowpass at 600 Hz with a slow 0.1 Hz LFO on the cutoff, gain 0.06, always on after the first gesture. `shaker` = highpassed (6 kHz) noise bursts on 8th notes at 100 BPM, gain 0.05, only during Steam Rush. `night` = a sine at 220 Hz + fifth, gain 0.04, only during Lantern Night. Layers fade in/out over 0.5 s.

**Haptics**: 15 ms on x3, 30 ms on x5 and rush start, 10 ms on unlock. Off by default on desktop, on by default on touch devices; toggle in settings.

---

## 13. First 30 seconds (the script the tutorial system implements)

| t | Screen | Sound |
|---|---|---|
| 0.0 | Cream fades to the deck over 1.2 s. Car #1 is **already docked** at the platform; the bell post swings; the Rock Pool steams on the left; Kit at (270, 1990) stretches | (silent: nothing before a touch) |
| 0.6 | Three capys hop out of the cabin door **up** onto the platform, one per 0.3 s, squash on landing, bath bubbles. The arrow above Kit points at the nearest capy: **LEAD** | (boing ×3, dropped until the first touch) |
| 1.2 | Fade done; a tap anywhere earlier skips it. If nothing has been touched by 3.1 s, the ghost-thumb drag hint appears at (270, 0.78 H) and loops until the first stick move | |
| 2.0 | Player touches: the bell rings (the gesture unlocks audio), the joystick blooms, Kit runs with dust puffs. The nearest capy hops behind Kit with a rising blip; the other two join 0.12 s apart with higher blips; pips fill 3/3 | bell, blip ×3 |
| 3.0 | Arrow → Rock Pool: **SOAK** | |
| 6.0 | Kit steps onto the Rock deck; capys plop 0.12 s apart: three splashes, three ripple rings, "SPLASH x3!" in gold, 4 px bump, arpeggio, one 40 ms hit-stop on the third, Kit fist-pumps. Steam rises; capys sigh hearts, puff steam and sink a little. Tutorial soak: 5 s | splash ×3, plink ×3 |
| 11.0 | Soak rings complete; capys climb out to the deck's lane-side edge and flick koban that arc into the coin tray: six soft clinks, the stack grows, badge "24". Arrow: **COLLECT** (the tray sits on Kit's path to the platform) | clinkSoft ×6 |
| 13.0 | Bell: car #2 docks; three more capys hop up onto the platform. Arrow: **LEAD**. Kit passes the tray on the way: 24 koban magnet to him and fly to the counter with rising clinks; the counter bounces to 24 | bell, boing ×3, clink ×6 |
| 15.0 | Trail 3/3 → **SOAK**: the second "SPLASH x3!", in the Rock Pool (its first guests left at 11 s). The cedar lantern on the right shows a cream "20" pill; the arrow now says **LIGHT** | blip ×3, splash ×3, plink ×3 |
| 19.0 | Kit stands at the cedar offering step: koban toss into the box one per tick, 20 → 0 in about a second with rising ticks; the flame flares; the paper wrap tears away: Cedar Bath, boiler and woodpile revealed with a puff and a 4 px bump; the heat kettle slides into the HUD at 75. The arrow rests, dim, on the Trail Rope step (35) | tick ×16, pop, puff |
| 23.0 | The Rock Pool guests (8 s soak) climb out: 24 more koban in the tray; Kit collects on the way past: 28 coins | clinkSoft, clink |
| 31.0 | Car #3 docks; LEAD → SOAK: the first heated soak, in the Cedar Bath (thick steam, hearts). The loop is running: lead, splash, collect, light. The gauge still reads 75 (30 s grace); the first STOKE prompt comes at ~1:25, by which time car #4 has taught the loop | bell, boing ×3 |

Harness checkpoints at 30 s: `built.cedar === true` and `stats.combos[3] ≥ 2` (architecture §17.5).

Tutorial cars: car #1's guests have infinite patience and a 5 s soak. The only other tutorial logic is the drag hint, the tap-nudge during car #1 and the seven arrow words; the arrow priority rules carry the player from here.

---

## 14. MVP scope

### 14.1 MVP Core (must ship; integration order per architecture §19: WP1 → WP2 → WP4 → WP3 → WP5)
- [ ] Portrait canvas, logical 540 × (960..1200), DPR-aware (cap 2; 1.5 on wide, dense screens), world 540 × 2400 with the Deck zone and the painted valley, camera follow with a small look-ahead and a clamp that never inverts, feet-Y depth sorting, static layer cache blitted 1:1
- [ ] Floating joystick (trailing base, ramped magnitude, instant bloom) + WASD/arrows; Kit movement with acceleration, 2-way facing + up/down muzzle rule, dust puffs, empty-trail sprint, collision with water/solids/bounds; drag hint; tap-nudge during car #1
- [ ] Trail: breadcrumb-path follower chain up to 12, kinds guest/log/yuzu, capacity, join hops with rising blips (one per 0.12 s), squash-stretch, bob, stop-compress, impatience with sweat-drop and walk-off (never rejoins), re-link on removal, pickups capped to what can be used
- [ ] Cable car: dock-to-dock period by car level (18 / 21 / 24 / 25 s), car #1 pre-docked, car #2 at 13 s, in-world bell ring (r 26), ding-ding warning, slide-in/dock/out with pendulum, hop-out up onto the platform, platform milling, platform cap, car levels, duck cars (capys + 3), empty cars handled
- [ ] Guests: capy and duck, states arrive/wait/trail/soak/pay/leave (+ stall), lane routing, culled want bubbles, hearts + steam puffs, shiver, lid steps
- [ ] Baths: Rock Pool, Cedar Bath, Bamboo Tub; seat layout, soak timers, plop sequence, global Splash Chain with escalating pops and hit-stop on the 3rd and 5th plop, shakes, batch pay, golden water + hats that pay, cold refusal/pause, heated-only rush
- [ ] Heat: gauge, 30 s grace, drain modes, capped woodpile pickup, boiler that always consumes (surplus extends a rush), Steam Rush with escalating chains, HUD kettle with threshold glyphs and ribbon, steam wash
- [ ] Yuzu grove: regrowing trees, capped pick, golden bath, hats
- [ ] Coins: koban arcs into trays, trays with stacks and badges, magnet from trays, HUD-owned flight, rising clinks, counter bounce, "+N" pops, multiplier cap 6.0
- [ ] Lanterns as offering steps: reveal by prerequisites, stand-to-drain with koban tosses and the accelerating rate, partial drains, fill arc, flame, unwrap, repeatable lanterns, shortfall label, post 38 px behind the step
- [ ] Upgrade sheet: Soak / Seats / Tips per bath and themed tracks for boiler and grove, 1.6x curve, 6 levels, pips, affordability states with glyphs, upgrade chevron, far-tap feedback
- [ ] Pon: hire, straight-line stoker state machine, yawn, 70-unit cap
- [ ] FULL CAR bonus (cars of 4 or more)
- [ ] Next arrow with the 12 rules and the seven one-word prompts; intro fade
- [ ] Procedural art for everything listed in 11.5; palette in one place; halo sprite; art smoke page with the silhouette row
- [ ] WebAudio SFX list in section 12, pad + shaker + night layers, mute, haptics toggle, nothing before a gesture
- [ ] localStorage save every 5 s and on hide, versioned, persisting only causes (lanterns, levels); offline earnings card with the 8.9 formula; a live tab returning after ≥ 60 s handled without reloading
- [ ] Performance budget: pools for coins/steam/particles/pops, caps, measured frame/step budgets, low-effects detection that lightens the tint and caps halos
- [ ] Headless simulation harness passing the assertions in `ARCHITECTURE.md` §17

### 14.2 MVP Plus (build after Core is integrated and the sim passes)
- [ ] Snack Stall + mochi want chain + queue patience + Kero
- [ ] Lantern Night event with tint, halos, 12 s cars, +20%, lantern-light coins
- [ ] Ridge Bridge lantern finale (Famous Inn, fireworks, gold headband, sign) and Season Fame levels 2-5
- [ ] Golden Car every 5th car (5.12)
- [ ] Settings popover (sound, haptics, shake & flash, low effects, reset with confirm) and the level pill / TAP prompt gate

### 14.3 Stretch (in priority order)
1. **Kaa the crow** micro-event: lands on a coin tray every 40-70 s; tap him within 2 s → he drops 3-8 coins or a yuzu; ignored → he flies off with nothing (pace from opportunity, never punishment). One entity, one timer, one hit-test.
2. **Scamper** dash: double-tap (or Space) for a 0.35 s 2.2x burst with a 1.2 s cooldown; the trail whips; passing through waiting guests picks them up in one sweep.
3. **Sandals** lantern: Kit speed +12% per level (3 levels).
4. Ridge zone: Massage Pavilion (Madame Tsuru), Sauna Hut chain, Momo VIP.
5. New Season prestige with Yuzu Seeds and seasonal palettes.
6. Guestbook daily goals with stamps (three rotating goals on the offline/settings card, fed by the existing stats).
7. Cosmetic headbands and lantern colours.
8. Photo mode (hide HUD, freeze, snapshot).
9. Summit / Cave Bath with the geyser mini-mechanic.

---

## 15. Risks and mitigations (enforced in tuning)
| Risk | Mitigation baked into this design |
|---|---|
| Trail feels floaty, tangles or clogs | Breadcrumb-path following (never cuts corners) with the 0.35 lerp for whip and a 0.6 stop-compress for bunch-up; cap 12; gaps per kind; pickups capped to what the boiler, baths and stall can use, so nothing sits in the trail forever |
| Two pressures (heat + patience) stress casual players | 30 s grace after the boiler is built; slow drain (0.5-1.0/s); cold baths only pause guests; trail patience halves only while the arrow says STOKE; Pon at 80 coins by minute 3; no failure screen anywhere |
| The first minute teaches waiting | Car #1 pre-docked, first input at ~2 s, car #2 at 13 s, 5 s tutorial soak, a 20-coin drain that takes 1 s; the harness asserts the Cedar Bath and two x3 chains by 30 s |
| Depth-sort glitches on decks | No projection transform; single feet-Y sort; decks/water/steps/trays in an unsorted ground pass; stations on a coarse left/right grid |
| Steam, ripple and halo overdraw | Pooled circles, caps (60 steam, 30 ripples), halos as one pre-rendered sprite with at most 8 per frame, measured frame budget with low-effects fallback |
| Income explosion mid-game | One tuning table; the sim's target curve in 8.11; knob order yuzu → x5 → rush → night; event multipliers capped at 6.0; yuzu and golden never stack; rush on heated baths only |
| Offline earnings skip the content | 2 h cap, 0.25 max multiplier, median-bucket rate capped at 20/s, offline coins never feed the rate |
| Scope creep | Core / Plus / Stretch tiers; Ridge is a sign, not a zone; Season Fame is data on an existing lantern |
| Want chain confusion | One large icon per bubble, one bubble per guest, bubble culling, 30 s queue patience, a check bubble when satisfied |
| Guests walking through pools | Lane routing (5.11 / architecture §9.4): horizontal to the center lane, vertical along it, horizontal to the target; the lane is a permanent no-build strip |
| The camera or the thumb hides the action | World extended to y 2400 with a painted valley; the clamp never inverts on tall phones; the platform never sits below 0.65 H; the car countdown is the in-world bell ring |
| Unreadable at phone size | 4 px feature and 56 px tap minimums; one CTA colour with a cream stroke; states are shape + colour; yellow reserved for money and yuzu; white ducks; a silhouette test on the art smoke page |
| Reads as a genre template | Trail instead of stacking; a shared heat gauge; offering steps and unwrapping instead of glowing pads and pop-ups; trays instead of floor cash; koban instead of round coins; no external titles referenced anywhere in the docs |

---

## 16. Canonical id glossary
Stations: `rock`, `cedar`, `bamboo`, `boiler`, `woodpile`, `grove`, `stall`, `platform`. Lanterns: `cedar`, `trail`, `grove`, `car`, `pon`, `stall`, `kero`, `bamboo`, `bridge`. Guests: `capy`, `duck`. Helpers: `pon`, `kero`. Trail node kinds: `guest`, `log`, `yuzu`. Upgrade keys: `speed`, `slots`, `pay` (bath labels Soak / Seats / Tips). Guest states: `arrive`, `wait`, `trail`, `soak`, `pay`, `stall`, `leave`, `gone`. Game states: `intro`, `play`, `sheet`, `card`, `settings`, `paused` (derived except `intro` and `paused`). Tutorial words: LEAD, SOAK, COLLECT, LIGHT, STOKE, YUZU, TAP (+ the wordless `DRAG` hint). Pay multipliers (8.1): `combo`, `yuzu`, `rush`, `night`, `golden`, `famous`; `MULT_CAP`. Car flags: `golden`, `duck`, `empty`. Lantern effects: `build`, `trailCap`, `carLevel`, `hire`, `famous` (levelled). Coin places: `tray` (per bath and stall), `splash` (the global chain).

---

## 17. Seasons (build 1.3.0)

The game continues past the Deck as **seasons**: new places on the mountain with their own map, cast, ladder, look and one or two mechanics of their own, on the same controls and engine. The framework (packs, per-season saves, the Season Pass travel gate, the Seasons card with completion %, stars) and the full specification of **Season 2 — The Mochi Terrace** (an autumn teahouse: rice sacks → mortar → Mochi Stock → tables, the Pounding Lap, Kaa the crow, Momo on the Maple Express, Harvest Moon) live in `docs/SEASONS.md`. The Deck's ladder gains one step: **Season Pass** (5,000, after the Ridge Bridge, effect `travel:2`). Stretch items 1 (Kaa) and 4–5 (Ridge, New Season) from §14.3 are now delivered through that framework.

## 18. App shell and developer mode (build 1.4.0)

The game opens on a **boot screen** (cream, a bobbing capy, a bar that fills as the files load) and then a **title screen**: the logo over the current season's map, Kit waving beside a capy in a yuzu hat, the season's name, PLAY / CONTINUE, SEASONS, SETTINGS. The Welcome-back card appears after PLAY, never over the title. Settings pauses the game and has a **Main menu** row. A **developer mode** (`?dev=1`, or seven taps on the version label) adds a DEV chip, a DEV MENU button and an F2 panel of cheats for testing (coins, speed, every lantern, every upgrade, finish / unlock / jump seasons, events on demand, resets). The game installs as an app from the browser (icon, full screen, offline) from an https address (`npm run share` makes a temporary one); see `README.md`.

## 19. One mountain that keeps growing (direction, 2026-10-02)

The phone playtest of Season 2 showed what makes this game fun: **something new every few minutes** (chapter 1 taught the boiler, the trail rope, yuzu, the cable car, Pon, the stall, Kero, Lantern Night in turn) and **the Splash Chain with its screen shake**. A reskinned second map with a reset felt like a skip. From here the game grows as one mountain: the Ridge Bridge actually opens and new areas extend the map upward, each adding mechanics the player has never done, layered onto the economy they already have. Nothing resets. Planned, one at a time with a phone playtest between each: the Sauna → Cold Plunge chain (a want that changes mid-visit), the Massage Pavilion with Madame Tsuru (appointments on a timer), snowfall that ices the paths, Momo the VIP on special nights, daily goals with stamps. The upgrade sheet now says in plain words what each koban buys (10.4: one row per track with title, before → after and a reason), and the Splash Chain escalates harder with every step (6.3: bump, zoom punch, shockwave rings, confetti, flash, boom).

### 19.1 The Ridge (built 1.6.0): Sauna Hut and Cold Plunge

**Opening.** Ridge Bridge level 1 (the old finale, 1,500) now also opens the Ridge: banner "THE RIDGE OPENS!", fanfare, confetti at both ends of the bridge. The camera clamp moves from y 1100 to 500, Kit's bounds from y 1150 to 560, the mist lifts to y 420–580, the stepping-stone lane runs on to y 560 and the bridge is the only crossing (solid drops x 0–238 and 302–540 at y 1000–1150). Nothing in the Deck changes; coins, upgrades and helpers stay.

**Map (y 500–1100).** Snow-dusted stone with drifts and bare rock, snow-capped pines at (40,620) (500,620) (30,760) (510,760) (200,640) (340,640) (40,960) (500,960), rocks at (90,700) (450,700) (160,990) (500,990). Sauna Hut deck (420,800) 210×150, interior 150×90, exit (309,840), tray (328,860); its offering step at (480,905). Cold Plunge deck (120,800) 210×150, water 150×90, exit (236,840), tray (212,860); step at (120,905). Sauna leavers wait in the mill rect x 320–430, y 895–960. Ridge guests leave at (270,580) into the mist.

**Sauna Hut** — lantern `sauna`, 1,500, requires `bridge`. Heated (the boiler's steam pipe), 4 seats (→ 6 with Benches), 6 s (→ 3 s with Heat), pay ×1.25. A guest who finishes the sauna climbs out, pays into the sauna tray, and — once the plunge exists — becomes a **plunge wanter**: want `plunge` (icy-pool bubble), waits beside the hut with 15 s patience, and a **hot-cold window** of 8 s starts ticking, drawn as a ring around the bubble that empties. Plunge wanters are refused by every other station (snowflake), and a line with them makes the arrow say **PLUNGE**. Their yuzu hat does not carry over.

**Cold Plunge** — lantern `plunge`, 1,200, requires `sauna`. Unheated (never cold), takes **only** plunge wanters (everyone else is refused), 3 seats (→ 6 with Width), 4 s (→ 2 s with Chill), pay ×1.5. Landing inside the window sets `hotCold` and the payout multiplies by **HOTCOLD_PAY 2** (inside the 6.0 cap): "HOT-COLD x2!" pop, six steam puffs, a 90 px shockwave ring, zoom punch 0.05, bump 6, flash, a sizzle and a chime. Every plop still joins the global Splash Chain, so four sauna leavers dropped together are a x4 on top. After the plunge the guest leaves by the Ridge exit (no stall want up here).

**Why it is new.** A want that changes mid-visit, a timer the player races, and a drop-off that refuses the wrong guest: the first station where *who* you carry matters. The loop up top is tight: drop four in the sauna, wait by the hut, scoop them as they come out, sprint to the plunge. A sauna guest is worth about 6 × 1.25 + 6 × 1.5 × 2 = 25 koban against 6 for a Deck guest, which pays for the long walk from the platform.

**Arrow.** Rule 14 PLUNGE sits between the chain rule and SOAK; rule 1 (chain) and rule 2 (SOAK) only consider stations that accept what the line carries, and rule 2 weighs seats by worth (`payMult`, or 3.5 for the sauna while the plunge exists); LEAD prefers a waiting sauna guest whose window is open; YUZU never targets the plunge. Tutorial word PLUNGE shows twice like the others.

**Harness.** Deck run 45 min: the Ridge is open by 40 min, both stations built and at least one hot-cold by 45 min. Seed 7: bridge 24:57, sauna 27:36, plunge 30:17, 14 plunges / 11 hot-cold, 54,521 coins at 45 min, 12 guests lost of 1,221.

### 19.2 The Massage Pavilion (built 1.7.0): Madame Tsuru and the gong

**Where.** Top right of the Ridge: deck (420,640) 210×150 with a roof band across the top (upturned eaves, snow on the ridge line) and four posts; the chairs are the 'water' rect (420,650) 150×70 — a tatami mat with cushions — so no guest is ever drawn under the roof. Madame Tsuru stands behind the mat at (420,614); the gong stand is at (330,712); exit (309,680), tray (328,700); offering step at (300,600). Lantern `pavilion`, 2,500, requires `plunge`, effect build.

**How it works.** The pavilion runs to a **gong** every 20 s (`def.gong`), shown as a countdown ring on the gong stand. Guests dropped in the chairs wait — relaxed, hearts, no timer ring — until the gong. At the gong every seated guest (not still hopping) starts a **session** together: 10 s (Quicker hands → 7 s), eyes half closed, a sparkle per guest every 0.5 s, Tsuru's neck dips and a wing works. If **every chair is taken at the gong** it is a **FULL HOUSE**: each guest's payout × 1.5 (`def.fullHouse`), a pop, confetti, zoom punch 0.04. A guest seated during a session waits for the next gong (`g.inSession`). A gong with empty chairs does nothing (no fail state). Pay ×5 (6 → 30 koban each; Better tips raises it), 2 chairs → 4 (Another chair). The pavilion takes bath wanters, not plunge wanters; after the massage the guest leaves by the Ridge exit.

**Why it is new.** Two clocks to plan around (the cable car's and the gong's), and a decision the baths never asked — *bring enough guests, together* — with a visible payoff for doing it. It also makes the Ridge a loop of its own: seat four in the chairs, run the sauna → plunge chain while the gong counts down, collect both.

**Arrow.** Rule 2 scores a station by seats × worth × 800 / (800 + distance), so the pavilion (worth 5) is chosen when its chairs are free and it is not absurdly far; `nextFreeIn` adds the time to the next gong for taken chairs. Rule 4 (YUZU) only considers baths on Kit's side of the bridge.

**Harness.** Deck run 50 min: pavilion built with ≥ 2 massages and ≥ 1 full house by 50 min. Seed 7: pavilion 43:51, 37 massages, 8 full houses, 61,019 coins at 50 min; seeds 3 and 11 pass. The bot takes the lane when it carries guests across the bridge; it walks straight at its target otherwise and only plans a route when stuck (deliberate: a route-planning bot lost three times the guests).
