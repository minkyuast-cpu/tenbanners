# Skill presentation (2.7): signature effects, choreography, multi-beat mechanics

This is the working manual for giving every player skill its own face. Stage 1 built the framework and
finished two reference classes (보병 `inf`, 법사 `mag`). The other eight classes are done on top of it,
one file per class. Read this file, then read `src/skfx_inf.js` and `src/skfx_mag.js` as the style bar.

Contents: 1 files and ownership · 2 the idea in one page · 3 tier ladder and budget · 4 the effect API ·
5 drawing pieces · 6 sound · 7 engine primitives (beats, fall, zone) · 8 balance rules ·
9 style guide and palettes · 10 tools and tests · 11 checklist for a class · 12 what stage 1 changed.

---

## 1. Files and who may touch what

| File | What | Who edits |
|---|---|---|
| `src/skfx.js` | Framework: registry `DS.SKFX`, context API, timeline, tier budget, drawing pieces, zone tint | **shared, do not edit in parallel work.** Extend from your own file with `X.kind()` (§5.3) and `X.sound()` (§6). If you really need a framework change, tell the lead. |
| `src/skfx_<cls>.js` | One class: skill-definition overrides (`X.def`) + signature effects (`X.reg`) | **yours.** One file per class: `skfx_cav.js`, `skfx_fly.js`, `skfx_mar.js`, `skfx_pike.js`, `skfx_arc.js`, `skfx_cle.js`, `skfx_mon.js`, `skfx_sha.js`. They are already listed in `build.js` `ORDER` (missing files are skipped), so you do not edit `build.js`. |
| `src/engine.js` | Multi-beat primitives (`beats`, `fall`, `zone`) | shared, do not edit. |
| `src/view.js`, `src/audio.js` | Hooks and the shared sound pieces | shared, do not edit. |
| `src/data.js`, `src/rise.js` | The original skill tables | **do not edit.** Change mechanics, numbers and `desc` with `X.def(id, {...})` inside your class file. That is what keeps three people off the same lines. |
| `tools/skshow.js`, `tools/t_skfx.js`, `tools/skdmg.js`, `tools/skstage_page.js`, `tools/sklvl.js` | Harness, test, balance check, staging, sound levels | shared; they pick up new classes automatically. |
| `docs/SKILL_FX.md` | this file | shared. In parallel work do **not** edit it: put your palette and your change table (the §12 format) in the comment block at the top of your class file and in your report; the lead folds them in here. |

Do not change `DS.VERSION`, `DS.BUILD` or `src/notes.js`.

Skills per class (13 or 14): class skills in `DS.CLASSES[c].skills`, the three 8단+ skills in
`DS.CLASSES[DS.RISE_OF[c]].skills` (`x<cls>_*`), three ultimates `DS.ULTS` with `cls === c` (`u_*`), and their three
grand versions `DS.ULTX` with `up === c` (`ux_*`). `SK=cls:<c>` in skshow lists them for you.

Old master classes (`bm`, `tm`, `mm`) and mercenary/monster/boss skills have no signature effects; they keep the
generic `V.fx` path. A skill shared by several owners (for example `charisma`: 궁병 and the old 택틱스마스터)
gets one effect, keyed by skill id.

---

## 2. The idea in one page

* The view's `'skill'` event handler first asks `DS.SKFX[skill id]`. If there is an entry, it plays **instead of**
  the generic `V.fx`, `grandFx` and `ultBlast`. No entry: nothing changes.
* An entry is a small object of handlers. Each handler gets a context `c` (who cast, where, tier budget) and
  composes drawing pieces, particles, light, sound and screen effects through `c`.
* Time: `c.at(seconds, fn)` schedules on the **game clock** (`sim.t`), so choreography pauses with the game and
  follows game speed. A skill is: wind-up (anticipation on the caster) → travel → impact → aftermath.
* Damage numbers come from the engine. If the visual needs a wind-up before the hit, the *engine* must land the hit
  later: give the skill `beats: [0.2]` (one beat, 0.2 s after the cast). Then `cast(c)` plays the wind-up and
  `beat(c, 0)` plays the impact exactly when the number pops. Never fake a delay in the view only.
* The higher the tier, the more is allowed (duration, layers, screen involvement). The framework clips anything
  over the tier's budget, so T1 stays modest whatever you write.

Worked example, a T1 melee skill (this is the real `inf_bash`):

```js
// src/skfx_inf.js
var X = DS.skfx, P = X.PAL.inf = { steel: '#cfe3ff', white: '#ffffff', blue: '#5b8fd6', pale: '#fff6d0' /* … */ };

// 1) mechanics: same numbers, but the hit lands 0.16 s after the cast (room for the wind-up)
X.def('inf_bash', { beats: [0.16] });

// 2) presentation
X.reg('inf_bash', {
  cast: function (c) { c.pose('back', 0.34, 3); },             // caster pulls the shield back, then lunges
  beat: function (c) {                                         // called when the engine lands the hit
    var x = c.cx, y = c.cy;                                    // target tile (centre of the hit tiles)
    c.fx('shield', { x: x - c.dx * 0.3, y: y - c.dy * 0.3 - 0.1, s: 1, c: P.blue, c2: P.steel, pop: 0.2, dur: 0.24 });
    c.shape({ k: 'impact', x: x, y: y, dur: 0.2, c: P.white, r: 7 }).ring(x, y, 9, P.steel, { dur: 0.25 });
    c.burst(x, y, [P.white, P.steel, P.pale], 7, { spd: 34, life: 0.22 });
    c.light(x, y, 14, P.steel, 0.35, 0.2).boom('shieldSlam');  // boom = sound with tier layers
  } });
```

Look at it: `SK=inf_bash OUT=/tmp/x PAGE=/home/user/wt_skfx/dist/test.html H=844 node tools/shot.js tools/skshow.js`.

A T5 example that uses everything (three beats, afterimages, screen streaks, a lingering stain) is
`ux_riposte` in `src/skfx_inf.js`; a telegraphed five-beat fall is `ux_skyfire` in `src/skfx_mag.js`; a zone
with a pulse and a shatter at the end is `ux_icejail`.

---

## 3. Tier ladder and budget

Tier is derived from the skill (`X.tierOf(id)`), you do not set it:

| Tier | Which skills |
|---|---|
| T1 | class skills learned at 1–3단 (includes the 호령 `cmd_*`) |
| T2 | class skills learned at 4–7단 |
| T3 | 8~10단 skills `x<cls>_*` |
| T4 | ultimates `u_*` |
| T5 | grand ultimates `ux_*` |

Budget per **one cast** (all its beats together). `X.BUDGET` in `src/skfx.js` is the source of truth:

| | T1 | T2 | T3 | T4 | T5 |
|---|---|---|---|---|---|
| time from cast to last impact (`dur`, s) | 0.5 | 0.9 | 1.4 | 2.0 | 2.8 |
| particles (`parts`) | 14 | 28 | 48 | 70 | 96 |
| shapes: rings, lines, old shapes, new pieces (`shapes`) | 8 | 14 | 22 | 30 | 40 |
| light: max radius px / max alpha | 16 / 0.40 | 22 / 0.50 | 28 / 0.60 | 36 / 0.75 | 44 / 0.85 |
| screen shake (max) | none | 0.12 | 0.22 | 0.32 | 0.45 |
| hit-stop (max, s; player's commanders only) | none | 0.03 | 0.05 | 0.07 | 0.09 |
| flash alpha (max) | none | 0.04 | 0.06 | 0.08 | 0.10 |
| colour wash alpha (max) | none | none | 0.05 | 0.08 | 0.10 |
| ground decals: `stain`, `crack` | 0 | 1 | 2 | 3 | 4 |
| caster afterimages (`ghost`) | 0 | 0 | 2 | 3 | 5 |
| spotlight dim around the caster | no | no | no | yes | yes |
| screen-space streaks | 0 | 0 | 0 | 6 | 12 |
| sound layers (`c.boom`) | 1 | 2 | 3 | 4 | 5 |

What each step up should *add* (this is the ladder the player reads):

* **T1** one quick readable gesture, ≤ 0.5 s. A projectile or a stamp, a few sparks. No screen involvement.
* **T2** a second layer and a trace on the ground: small shake, one decal, a short wind-up.
* **T3** a real choreography in two or three beats, an afterimage, a colour wash, a decal that lingers ~2 s.
* **T4** the screen takes part: spotlight dim, streaks, a ground sigil, a long wind-up, a clear single climax.
* **T5** the T4 idea, one phase more: an extra beat or a lingering zone, double shock rings, lingering embers.
  T5 is the same move as its T4, grander (see `ram(c, i, grand)`, `bastion(c, grand)`, `verse(…, grand)`).

Guard rails (all automatic, do not work around them):

* Per-cast budget above. Calls beyond it are dropped (`X.stat.over` counts them; skshow prints `over`).
  If `over` is not 0, trim your effect; the framework drops in call order, so the *climax* may be what is lost.
* Global caps: particles 240, old shapes 48 (`view.js`), new pieces 56, queued timeline steps 96, rings 64, lines 56.
* Off-screen: every `c.*` call culls by tile.
* `lite` (설정 「효과: 가볍게」 or a slow device): particles halved, no afterimages, no streaks, at most one decal.
* `calm` (reduced motion): no shake, no hit-stop, no streaks, no lightning flicker, no caster shake/spin pose;
  flash and wash at half alpha. Flash is capped at 0.12 globally in every mode. Never strobe.
* No per-frame allocation: pieces are plain objects created once per cast; draw code uses numbers only.
  Random jitter inside a draw must come from `X.hs(i, p.sd)` (deterministic per piece), not `Math.random()`.

---

## 4. The effect API

### 4.1 Registering

```js
X.reg(id, {
  cast:     function (c) {},            // the 'skill' event: the moment of the cast (wind-up, travel)
  beat:     function (c, i, last) {},   // engine beat i lands (its hit events follow in the same frame).
                                        //   A skill without beats/fall gets beat(c, 0, true) right after cast.
  mark:     function (c, e) {},         // telegraph started (fall). e.dur = seconds until the first beat
  chain:    function (c, a, b, n) {},   // a 'chain' hop of this cast: a, b = [x, y] view positions, n = hop index
  zone:     function (c, e) {},         // zone appeared (budget T1)
  zoneTick: function (c, e) {},         // zone pulse (budget up to T2). c.ids = who was hit, c.i = pulse number
  zoneEnd:  function (c, e) {},         // zone ran out (budget up to T3). Not called when cancelled
  cancel:   function (c) {}             // the sequence was cancelled (caster or single target died)
});
X.def(id, patch);    // override the skill table from your file (see §7.5)
X.tierOf(id);        // 1..5
```

One context object lives for the whole sequence: what you store on `c` in `mark` (for example `c.pts`) is there in
`beat`. Zones get their own context.

### 4.2 Context fields

| Field | Meaning |
|---|---|
| `c.S`, `c.id`, `c.tier`, `c.B` | skill table entry, id, tier, that tier's budget row |
| `c.u`, `c.v` | caster engine unit and view unit (`c.v` can be gone later, guard with `if (c.v)` only if you read it) |
| `c.ux`, `c.uy` | caster position in tiles (view position, fractional; refreshed at every beat) |
| `c.tiles`, `c.cx`, `c.cy` | tiles hit, and their centre (the target point) |
| `c.dx`, `c.dy`, `c.ang`, `c.dist` | unit vector, angle and distance from caster to target centre (facing if self-centred) |
| `c.ids`, `c.i` | at a beat: ids hit by this beat, beat index |
| `c.ally`, `c.mine`, `c.on` | caster is on the player's side / is a player commander / is on screen |
| `c.lite`, `c.calm` | low-power / reduced-motion (you rarely need them, the wrappers already obey) |

Coordinates are **tiles** (fractional allowed). A tile centre is `x*16+8, y*16+8` px; feet are ~6 px below.
Sizes (`r`, `h`, `w`, `s`) are in **px** of the 16-px tile grid.

### 4.3 Context methods (all return `c` unless noted)

| Call | Does |
|---|---|
| `c.at(t, fn)` | run `fn(c)` after `t` seconds of game time. Clamped to `2 × dur + 1` of the tier |
| `c.burst(x, y, cols, n, o)` | `V.burst` particles. `o`: `spd, up, grav, life, spread, size, flat` |
| `c.spray(x, y, cols, n, ang, spread, o)` | directional particles (debris, shards) |
| `c.ring(x, y, r, col, {dur, w, inv, rise, d})` | old expanding ring (`inv` contracts, `rise` floats up, `d` delay) |
| `c.shape({k, x, y, …})` | old shapes: `slash, thrust, impact, bolt, pillar, flame, sigil, soul` (`d` delay) |
| `c.line(x0, y0, x1, y1, col, {dur, w, zig})` | old line |
| `c.fx(kind, {…})` | a new drawing piece (§5). Returns the piece or `null` (culled or over budget) |
| `c.light(x, y, r, col, a, life)` | additive glow, clamped to tier |
| `c.shake(a)`, `c.stop(s)`, `c.flash(col, a)`, `c.wash(col, a, dur)` | screen: all clamped to tier, removed or halved in calm |
| `c.dim(dur)` | T4+: spotlight on the caster, the rest darkens (the old ultimate dim) |
| `c.streak(n, ang, col, dur, alpha)` | T4+: screen-space speed lines |
| `c.pose(kind, dur, amp, dx, dy)` | caster body: `back` (pull back, then lunge), `hop` (jump and slam), `sink`, `rise`, `shake`, `spin` |
| `c.lunge(dx, dy)`, `c.castPose(col)` | the two old body cues: the attack lunge toward the target (attack sprite pose), and the casting stance with the small circle at the feet |
| `c.ghost(dx, dy, tint, dur, alpha)` | T3+: afterimage of the caster, offset in tiles |
| `c.sfx(name)` | a plain sound |
| `c.boom(name)` | the same sound with tier layers added (§6). Use it for the impact |
| `c.float(x, y, text, col, o)` | floating text (rarely needed) |
| `c.each(fn(x, y, i, d), max)` | iterate the hit tiles on screen (`d` = distance from the centre) |
| `c.hits(fn(x, y, i, unit), max)` | iterate the units hit by this beat / pulse |
| `c.who(ally, fn, max)` | units of the caster's side (or the other) standing on `c.tiles` |
| `c.near(x, y, r, fn, max)` | enemies of the caster within `r` tiles of a point |
| `c.pos(id)` | `[x, y]` of a unit or `null` |
| `c.rnd(a)` | random in `[-a, a]` (fine at spawn time, not inside draw code) |

Timing rule of thumb: a piece that must *arrive* on a beat is started earlier. `drop` and `orb` take `dur`; start
them at `beatTime - dur` (see `meteorMark` in `skfx_mag.js`, and the falling shield in `xinf_bash`).

---

## 5. Drawing pieces (`c.fx(kind, {...})`)

Common fields: `x, y` (tiles), `ox, oy` (px offset), `dur` (s), `d` (start delay, s), `end` (callback when done),
`c` colour, `c2` second colour. Pieces run on the game clock (they pause with the game).

### 5.1 Ground layer (under units)

| kind | fields | looks like |
|---|---|---|
| `sigil` | `r, sides, skip, runes, spin` | dotted magic circle; `sides: 4` square (fortress), `5, skip: 2` pentagram, `6, skip: 2` hexagram, `0` plain ring |
| `shock` | `r0, r, w, dust, thin` | expanding shock ring with a faint fill; `dust` colour adds specks |
| `crack` | `r, n, c` | `n` jagged cracks radiating out; `c` = glowing colour for the first half (hot cracks) |
| `stain` | `r, a, c2, n, grow` | soft elliptical stain (scorch, frost, dust) with twinkling specks |
| `shadow` | `r` | growing shadow of something falling |
| (ghost) | use `c.ghost()` | afterimage |

### 5.2 Air layer (over units)

| kind | fields | looks like |
|---|---|---|
| `beam` | `x0,y0,x1,y1` (tiles), `w` | thick line with a bright core that thins out |
| `zap` | `x0,y0,x1,y1` (tiles), `h0,h1` (px height of each end; `h0: 60` = from the sky), `w, jit, fork` | jagged lightning; flickers (not in calm) |
| `orb` | `x,y → x1,y1`, `h` arc height, `head, s, tr` | a projectile. heads: `ember, ice, shield, rune, star`, default square |
| `drop` | `x,y` landing tile, `h` start height, `sx` sideways start offset, `head, s, tr` | something falling. heads: `meteor, star, icicle, shield, rock` |
| `cone` | `a, spread, len` | fan of expanding arcs from a point |
| `arc` | `r, a0, sw, w` | big crescent sweeping `sw` radians around `x,y` (whirls, wide cuts) |
| `shield` | `s, tower, rise, fall, pop` | pixel shield: kite or tower; `rise` from the ground, `fall` px from above, `pop` = white for that fraction |
| `spike` | `h, w, c: [light, mid, dark], lean, up` | ice or rock spike growing out of the ground, stands for `dur` |
| `column` | `w, h, a` | vertical pillar of light from the sky |
| `dome` | `r, a` | dotted protective dome with moving glints |
| `cloud` | `hgt, w, lit` | dark cloud above a tile (`lit` flickers) |
| `book` | `hgt` | open tome above the caster |
| `gate` | | a lattice gate that flashes white and breaks apart |
| `star` | `s` | four-point twinkle |
| `rune` | `ri, s, up` | one small rune glyph drifting up |
| `emit` | `rate, n, dur, cols, o, sp` | invisible emitter: `rate` bursts per second for `dur` (its particles are charged to the budget up front) |

### 5.3 Your own piece

If a class needs a shape that is not here (an anchor, a lantern, a feather), add it from your class file:

```js
X.kind('anchor', { L: 1,   // 0 ground, 1 air, 2 screen
  draw: function (g, p, f, time, V, cx, cy) {      // f = 0..1 progress, cx/cy = px centre of (p.x, p.y)
    g.globalAlpha = X.env(f, 0.1, 0.3); g.fillStyle = p.c; g.fillRect(cx - 1, cy - 8, 2, 12); /* … */
  } });
c.fx('anchor', { x: x, y: y, c: '#cdd5e3', dur: 0.5 });
```

Draw with `fillRect` on whole or half pixels (look at `drawSk` in `skfx.js` and `drawShape` in `view.js`).
No gradients, no `arc()`, no anti-aliased strokes: the game is pixel art on a 16-px grid. Helpers:
`X.env(f, in, out)`, `X.ease(f)`, `X.hs(i, seed)`, `X.drawShield(...)`, `DS.VX.pxLine(g, x0, y0, x1, y1, w)`.
Prefix the name with your class if it is specific (`mar_anchor`).

### 5.4 Automatic visuals you get for free

* **Telegraph tiles** for `fall` skills: the usual tile overlay (blue for our casts, red for the enemy's) with the
  closing square. Your `mark` handler adds flavour on top (sigil, shadow, the falling thing).
* **Zone tint**: tiles of a standing zone are tinted and outlined by `zone.k`
  (`fire, frost, storm, ward, wall, gold, poison, dark, water, wind` in `X.ZC`), with a pulse flash at every tick
  and a red outline when the zone is hostile to the player.
* Skill name plate, damage numbers, status words, 도발 rings, knock-back motion: unchanged, from `view.js`.

---

## 6. Sound

`audio.js` has the shared pieces. `c.sfx(name)` plays one; `c.boom(name)` plays it and stacks the tier layers
(`DS.Audio.sk`): T2 adds a low thump, T3 air and sub, T4 a chord tail, T5 a long rumble with a shimmer.
Use `boom` once per cast, on the climax (or once per beat for multi-beat skills; layers are rate-limited).

Pieces added in stage 1: `shieldSlam, shieldUp, wallUp, quakeHit, whirl, shout` (steel and stone),
`emberPop, fireRoar, iceShot, iceBreak, freeze, zap, thunderBig, fallWhistle, meteorHit, starFall, chant, runeTick`
(elements and spellcraft). All the older ones (`slash, punch, kick, qi, shield, guard, charge, hook, ward, frost,
curse, arrow, magic, fire, boom, thunder, water, wind, dark, poison, holy, heal, buff, leap, swoosh, …`) are available too.

A new sound from your class file:

```js
X.sound('mar_anchor', function (tone, noise) {          // tone(f0, f1, dur, type, vol, when)  noise(dur, vol, freq, q, when, type)
  noise(0.2, 0.2, 300, 0.7, 0, 'lowpass'); tone(140, 70, 0.2, 'square', 0.08); }, 2.0 /* level */);
```

Rules: short (≤ 0.5 s; the T5 layer is the only long tail), nothing piercing (keep sustained tones under ~2 kHz
and quiet), no more than two new sounds per skill. Get the level number from
`SND=mar_anchor,… node tools/shot.js tools/sklvl.js` (it prints the multiplier that puts the sound at the battle
level, −27 dBFS; big impacts −23).

---

## 7. Engine primitives: a skill need not resolve in one instant

All three are generic fields on the skill table entry. They are driven only by `sim.update` (deterministic, no
`Math.random`, no wall clock), work for both sides, and persist nothing in the save.

### 7.1 `beats`: the effect lands in N timed hits

```js
beats: [0.2, 0.48, 0.8],                 // seconds after the cast when each beat lands
eff: [{ t: 'dmg', m: 0.8 },              // no b → beat 0
      { t: 'dmg', m: 0.9, b: 1 },
      { t: 'dmg', m: 1.1, b: 2 }, { t: 'knock', n: 1, b: 2 }]
```

* `eff[i].b` selects the beat (default 0). The cost, cooldown and the `'skill'` event happen at the cast.
* The caster is committed until the last beat + 0.3 s (never less than the usual 0.55 s).
* Targets are re-read at every beat: a unit-targeted skill follows its unit wherever it is; a tile-targeted skill
  hits whoever stands on the tiles then; a self-centred area is recomputed around the caster.
* Caster dies → remaining beats are cancelled. Single target dies → remaining beats are cancelled.
* `dash`, `back` (hop back) and the gear echo happen after the last beat.
* A single late beat (`beats: [0.16]`) is how you buy a wind-up for an otherwise unchanged skill.

### 7.2 `fall`: delayed, telegraphed strike

```js
fall: { delay: 0.9 /* s */, dz: 1 /* default: marked tiles are danger tiles */, hold: 0.55 /* caster busy */ }
```

* The tiles are marked at the cast (`'mark'` event → telegraph overlay); the skill resolves `delay` seconds later.
  With `beats`, the beats start at `delay` (`beats: [0, 0.22, …]`).
* The caster is free after `hold` (it does not wait for the landing). If the caster dies first, the strike is cancelled.
* `dz` (default on): the marked tiles go into the danger map of the side about to be hit, like boss telegraphs.
  Auto-controlled units of that side may notice and step out (`P.dodge`: enemies notice 55 %, bosses 85 %, the
  player's auto units 70 %, each after 0.35–1.5 s). Measured cost for a 0.9–1.0 s delay in an established melee:
  about 12 % of hits. Compensate in the multiplier (see §8) or set `dz: 0` for a strike nobody reacts to.

### 7.3 `zone`: lingering area

```js
zone: { dur: 5, every: 1, k: 'frost', to: 'foe' /* or 'ally' */, eff: [{ t: 'gauge', v: -10 }],
        end: [{ t: 'dmg', m: 0.65, type: 'magic' }], first: 1 /* time of first pulse, default = every */, dz: 0 }
```

* After the skill (its last beat) resolves, its tiles stay for `dur` seconds. Every `every` seconds `eff` is applied
  to units of the chosen side standing on them (caster's stats, ultimate power, healing rules as usual; effect
  entries may use `to:` groups like any skill). `end` is applied once when the zone runs out.
* One zone per caster per skill (recasting replaces it). At most 10 zones in a battle (oldest goes first).
* The zone is sustained by its caster: caster dies → zone ends (no `end` effect).
* `dz: 1` makes a hostile zone a danger area that auto units avoid and walk out of (a wall). Default off: units
  fight on inside it and take the pulses.
* The zone area is fixed where it was cast. It does not follow the caster.

### 7.4 Events (what the view hears)

| Event | Fields | When |
|---|---|---|
| `skill` | `id, sk, fx, tiles, from` + `qid, beats, fall, dur` for sequences | at the cast, once |
| `mark` | `qid, id, sk, tiles, dur, side` | `fall` only, at the cast |
| `beat` | `qid, id, sk, i, n, last, tiles, ids, from` | each beat, just before that beat's `hit` events |
| `seqEnd` | `qid, id, sk, cancel` | after the last beat, or on cancel |
| `zone` | `zid, id, sk, k, tiles, dur, side, to` | zone created |
| `zoneTick` | `zid, n, ids` | each pulse, just before its effects |
| `zoneEnd` | `zid, cancel` | zone gone |

Battle end (`sim.result` set): the next tick cancels everything pending (`seqEnd`/`zoneEnd` with `cancel`).
`sim.seqFlush()` resolves all pending beats immediately (tests and tools only).

### 7.5 `X.def(id, patch)`: changing a skill from your class file

`X.def` merges `patch` into the existing table entry in place (references in `DS.ULTS`, `DS.ULTX`, `DS.SKILLS` stay
valid). `eff` is replaced as a whole; a key set to `null` is deleted. The original entry is kept in
`X.DEFS[id].was`; `tools/skdmg.js` and the tests compare against it. Always update `desc` when numbers or behaviour change.

### 7.6 What the AI does with them

* Auto commanders pick offensive skills by estimated value per tick (`P.bestSkill`). It sums every `dmg` entry of
  `eff` (all beats), counts a later beat's `vs` bonus when an earlier entry of the same skill applies that status
  (불 → 얼음 → 번개), and adds half of a hostile zone's expected pulses. So keep `eff[0]` the kind of effect the
  skill is "about": the AI's sorting (heal / summon / buff / offence) reads `eff[0]`.
* Enemy AI and the ultimate logic count targets in the area at cast time. Nothing else is needed.
* The AI does not know about dodging. That is what the multiplier compensation is for.

---

## 8. Balance rules

Target: a redesigned skill delivers about the same as before over its duration, unless you deliberately change it
(then say so in §12 and in your report).

1. **Splitting a hit costs damage.** Defence is subtracted *per hit* (`raw − def/2`). A skill split into N hits
   with the same sum of `m` does roughly 7–8 % less per extra hit against same-level enemies. Raise the sum by
   about 0.07–0.15 per extra beat and verify. (Example: 220 % → 150 % + 85 %; 250 % → 80 % + 90 % + 110 %.)
2. **A dodgeable telegraph costs about 12 %** at 0.9–1.0 s delay. Raise the multiplier ~12 % (120 % → 135 %).
3. **Zones**: count the pulses a target is likely to stand in (enemies in melee mostly stay). Move part of the
   instant value into the zone rather than adding on top.
4. Measure, do not guess:
   * `node tools/skdmg.js` — every skill you changed with `X.def`, old table vs new, on stationary dummies
     (full delivery) → ratio should be ≈ 1.00 for pure splits, a bit above 1 for telegraphs.
   * `node tools/skdmg.js live 80` — the same in a running melee with real AI (dodging, moving) → ratio ≈ 1.00 ± 0.03.
   * `ONLY=id1,id2` limits it; `NODZ=1` shows the telegraph without dodging.
5. Then the bot (§10). Single bot runs vary ±20 %; judge the mean, and use `tools/calib.js at` on bot snapshots
   for a controlled before/after if a class looks off.

---

## 9. Style guide

### Do

* Give each skill **one idea** a player could name ("the shield wall rises", "a storm cloud strikes twice").
  If two skills of a class share an idea, change one.
* Keep the class identity in every tier: same palette, same material, same kind of motion.
* Show weight with timing: anticipation (caster `pose`), a clear contact frame, then let it settle.
* Put the climax on an engine beat so the number and the picture land together.
* Let T1 be small. A lob and a puff is right for a 1단 skill.
* Use the ground: sigils before, cracks and stains after. Decals should fade within ~2–4 s (zones excepted).
* Reuse through functions with a `grand` flag for the T4/T5 pair.
* Check it on bright ground (`meadow`) and dark ground (`THEME=nether`), and from the enemy side (`SIDE=enemy`).

### Don't

* Don't write to `V.parts`, `V.rings`, `V.shapes`, `V.flashA`, `V.shake` directly. Go through `c`.
* Don't use `setTimeout`, `performance.now()` or `V.time` for choreography. `c.at` only.
* Don't strobe: no alternating full-screen flashes, no flash above the budget, no rapid colour cycling.
* Don't cover the fight: big opaque shapes over units must be gone within ~1.5 s (a wall ring) or be thin (spikes).
* Don't add gameplay in the view. If it matters to the fight, it is an engine field.
* Don't put the word 「위력」 in any text (say 공격 / 마공 / 피해). No em-dashes in `desc`. Numbers stated, short, plain.
* Don't touch `Math.random()` in engine code paths. (In view code it is fine at spawn time.)

### Text voice for `desc`

Plain modern Korean, short sentences, the numbers the player needs, in the order things happen:
`'겨눈 십자 범위에 0.9초 뒤 운석이 떨어진다. 135%, 화상. 이미 화상을 입은 적에게 1.3배. 떨어지기 전에 비켜설 수 있다.'`
After any text change run `python3 tools/fontcheck.py` (must report 0 missing Hangul; reword if a syllable is missing).

### Palettes

Defined (in the class files, `X.PAL.<cls>`):

| Class | Identity | Colours |
|---|---|---|
| 보병 `inf` | shield wall, weight, impact. Steel shields with a cross band, stone dust, cracks. Gold trim from T3 | steel `#cfe3ff`, white, blue `#5b8fd6`, deep `#2f4f8a`, iron `#8f9ab3`, dust `#d8c39a`, earth `#a8754a`, dirt `#6f4a2c`, gold `#f6cf57` |
| 법사 `mag` | element-specific spellcraft. Fire lobs and burns, ice flies straight and stands as spikes, lightning runs horizontally from the staff or drops from a cloud; ultimates are the book and the stars | fire `#ff9a3c` `#ffd75e` `#d9442b`, ice `#d6fbff` `#9fe8ec` `#5fa8e6`, bolt `#fff0a0` white `#c9a8ff`, arcane `#b89cff` `#8d6be0`, star `#dff4ff` `#8fb0ff`, night wash `#22306e` |

Suggested for the rest (from the existing class colours in `view.js` `FXC`/`ULTFX` and the 윗길 auras; adjust, and record what you chose in `X.PAL.<cls>`):

| Class | Identity (from the class blurb) | Start from |
|---|---|---|
| 기병 `cav` | the charge, hooves, lance; 윗길 = thunder rider | gold `#ffe27a` `#fff6d0` `#e8bb45`, dust, lightning white |
| 비병 `fly` | dive and climb, feathers, wind; 윗길 = storm dragon | sky white `#dff4ff`, blue `#62b0ee`, teal aura `#9fe8ec` |
| 해병 `mar` | hook and pull, water, tide; 윗길 = tsunami | sea `#8fd0ff` `#d6fbff` `#2f86a6`, chain grey `#cdd5e3` |
| 창병 `pike` | pin, spear wall, counter-thrust | green steel `#bff0d8` white `#4c9a8a`, aura `#b6f0a0` |
| 궁병 `arc` | mark and shot, retreat, rain of arrows | arrow cream `#f1ead9`, mark red `#ff6a5a`, leaf `#d6f5b0` `#5fae5a` |
| 승려 `cle` | fists, kicks, chi palm that heals nearby | chi orange `#ffd28a` `#fff6d0` `#f08a3a`, palm blue `#bfe8ff` |
| 신관 `mon` | lantern, ward, sanctuary, holy light | lamp gold `#ffe0a0` `#fff0a0` `#f09a4a`, white |
| 사교 `sha` | curse, plague, drain, raising the dead | violet `#b181e6` `#7446ad` `#2b2440`, bone white, sick green `#b6ff5a` |

---

## 10. Tools and tests

All browser tools run through `tools/shot.js` against a build. **Run them one at a time** (several are timing-sensitive).
`PAGE=/home/user/wt_skfx/dist/test.html` selects this branch's build. Always pass an absolute `OUT`.

```
node build.js                                     # → ../dist/index.html and test.html

# look at a skill: one contact sheet per skill (frames from the cast on)
SK="cls:cav" OUT=/abs/dir PAGE=… H=844 node tools/shot.js tools/skshow.js
SK="xcav_bolt,ux_goldrush" SIDE=enemy MODE=calm …       # SIDE=ally|enemy, MODE=|lite|calm
START=0.4 SECS=0.5 EVERY=1 ZOOM=2 …                      # only the impact, every 0.05 s, magnified
THEME=nether BURN=1 SLOW=1 …                             # dark ground; pre-burned / pre-slowed dummies
# other knobs: COLS, CW, CH, SECS, EVERY, ZOOM. The line printed per skill shows hits, damage and peak counts
# (parts / fx / shapes / rings) and `over` = calls clipped by the tier budget.

# the framework test: all 130 player skills, both sides, calm and lite, mid-sequence events, determinism, AI
H=844 OUT=/abs/dir PAGE=… node tools/shot.js tools/t_skfx.js       # ONLY=id1,id2 for a quick pass

# numbers
node tools/skdmg.js            # old vs new on dummies        node tools/skdmg.js live 80   # in a live melee
BOTCHECK=1 bash tools/botmany.sh "inf mag cle sha fly" "1 2" 4 > /abs/bot.txt ; python3 tools/botsum.py /abs/bot.txt
python3 tools/fontcheck.py     # after any Korean text change
```

`tools/skstage_page.js` is the staging helper (flat map, caster, two allies, six dummies that never act; the
engine and the view are stepped by hand in 0.05 s ticks, so sheets are reproducible).

Existing suite that must keep passing: `t_dae264 t_polish261 t_stage26 t_feel26 t_banter t_shade t_meta25 t_story
t_text t_smoke t_cine t_spawn t_rise t_big t_lapse t_ux26 t50_people t_rules26`. `t_smoke` casts every skill and
checks its events right after the cast; it calls `sim.seqFlush()` so multi-beat skills are fully resolved first.

---

## 11. Checklist for a class

1. `SK=cls:<c>` sheet of the generic effects first, to see what you are replacing.
2. Write the identity line and palette. Decide the one idea of each skill (13–14 lines). Mark which get mechanics.
3. Mechanics with `X.def` (beats / fall / zone), `desc` updated, numbers measured with `skdmg.js` (dummies and live).
4. Effects with `X.reg`, lowest tier first. For each: sheet at normal, `START`-zoomed impact, `SIDE=enemy`.
   `over` must be 0. T1 quick and light.
5. `MODE=calm` and `MODE=lite` sheets of the T4/T5 skills.
6. `t_skfx.js` passes. The 18 existing tests pass. Bot set clears 30 with 0 lapses and 0 invariant violations.
7. `fontcheck.py` reports 0 missing.
8. Palette and change table (the §12 format) in the header comment of your class file and in your report.

---

## 12. What changed (mechanics), by class

"Dummies / live" are `tools/skdmg.js` ratios new ÷ old (damage actually dealt, same caster, same targets).

### 보병 `inf`

| Skill | Tier | Old | New | Dummies / live |
|---|---|---|---|---|
| `cmd_inf` 방패 올려! | T1 | | unchanged (desc without the dash) | |
| `inf_bash` 방패 치기 | T1 | 260 % instant | same, lands after a 0.16 s wind-up (`beats: [0.16]`) | 1.00 / 0.99 |
| `inf_wall` 철벽 | T2 | | unchanged | |
| `inf_cover` 수호 | T2 | shield instant | same, applied when the thrown shield arrives (0.14 s) | |
| `xinf_bash` 성벽 강타 | T3 | 300 % | 2 beats: shove 125 % + overhead slam 185 % (gauge cut and self-shield on the slam, taunt on the shove) | 1.02 / 0.99 |
| `xinf_aegis` 불괴의 방진 | T3 | shield 140 % atk + def +30 % for 15 s, taunt | shield 100 % + taunt at cast; **zone 10 s** (r2, allies): def +30 % while inside, shield topped up to 25 % atk every 2.5 s | deliberate change: stronger if the party holds the ground, weaker if it leaves |
| `xinf_quake` 성벽 붕괴 | T3 | 220 %, knock, gauge −40, slow | 2 beats: slam 150 % + gauge −40, then collapse 85 % + knock + slow | 1.00 / 1.00 |
| `u_bastion` 불락 성벽 | T4 | | unchanged | |
| `u_ram` 성문 부수기 | T4 | 320 % | same, one hit after a 0.42 s wind-up | 1.00 / 0.99 |
| `u_riposte` 반격의 회오리 | T4 | 190 % + knock + counter | 2 sweeps: 100 % then 105 % + knock; counter stance after the second | 1.00 / 0.99 |
| `ux_bastion` 천년 성벽 | T5 | def +70 %, shield 220 % atk (16 s), taunt | shield 180 % at cast; **zone 12 s**: allies inside get their shield topped up to 40 % atk every 3 s | deliberate change, same trade as 방진 |
| `ux_ram` 성문 파쇄 | T5 | 440 % + gauge −80 + knock 3 | same on the target (380 % + 60 %), **new: 60 % splash to enemies next to the target**; 0.5 s wind-up | target 1.00; live 1.03; packed dummies 1.30 |
| `ux_riposte` 강철 회오리 | T5 | 250 % r2 + knock + counter | 3 sweeps: 80 %, 90 %, 110 % + knock; counter after the third | 1.00 / 0.99 |

### 법사 `mag`

| Skill | Tier | Old | New | Dummies / live |
|---|---|---|---|---|
| `cmd_mag` 마력을 받아라 | T1 | | unchanged (desc without the dash) | |
| `mag_ember` 불씨 | T1 | 80 % cross + burn | same, bursts when the lobbed ember lands (0.2 s) | 1.00 |
| `mag_frost` 얼음창 | T1 | 150 % + slow | same, on arrival (0.14 s) | 1.00 |
| `mag_bolt` 연쇄 번개 | T2 | 130 % + chain | same, after a 0.12 s crackle | 1.00 |
| `mag_meteor` 별똥별 | T2 | 120 % cross, instant | **telegraphed fall, 0.9 s, dodgeable**, 135 % | 1.13 / 0.99 |
| `xmag_bolt` 연쇄 뇌우 | T3 | 160 %, chain 3 × 80 % | 2 strikes from a storm cloud: 105 % then 65 %, each chaining to three (55 %, 35 %) | 1.01 / 1.00 |
| `xmag_prism` 원소 폭주 | T3 | 150 % (×1.3 vs burn) + burn + slow | 3 beats: fire 55 % + burn, ice 45 % (×1.3 vs burn) + slow, lightning 45 % (×1.3 vs slow): it combos with itself. No longer gains from a pre-existing burn beyond the ice beat | 1.03 / 1.02 |
| `xmag_nova` 천원 운석 | T3 | 230 % r2, burn, gauge −30 | **fall 1.0 s**, 250 %, burn, gauge −30, then a **burning crater zone 4 s** (12 % per second) | 1.15 / 1.00 |
| `u_skyfire` 밤하늘 낙하 | T4 | 200 % r2 + long burn | **fall 1.0 s**, 230 % | 1.16 / 1.00 |
| `u_spellbook` 적어 둔 주문 | T4 | 280 % + chain 3 × 60 % | same after a 0.4 s reading | 1.00 |
| `u_icejail` 서리 감옥 | T4 | 130 % + slow 12 s + gauge −40 at once | 130 % + slow after 0.3 s; **zone 5 s**: gauge −10 per second to those inside (−50 if they stay, 0 after they leave) | 1.00 / 0.99 (damage) |
| `ux_skyfire` 유성우 | T5 | 280 % r2 + long burn | **fall 0.9 s, then 5 beats**: 55 % × 4 + 110 % | 1.05 / 1.02 |
| `ux_spellbook` 금단의 주문 | T5 | 360 % + chain 5 × 70 % | 3 verses: 135 % × 3, chains 25 %, 25 %, 30 % | 0.99 / 0.98 |
| `ux_icejail` 영겁의 서리 | T5 | 190 % + slow 14 s + gauge −60 | 135 % + slow; **zone 6 s**: gauge −12 per second; **shatters for 65 %** when it ends | 1.00 / 1.02 |

Note: the old `u_icejail` text said 140 % while the table had 130 %; the new text says 130 %.

---

## 13. Things to know (limits and decisions of stage 1)

* **A signature effect replaces the whole generic presentation of that skill**: `V.fx`, the gold `grandFx` overlay of
  8단+ skills, the class-wide `ultBlast` of ultimates, and the fixed hit-stop / shake / flash the view used to add when
  the player's selected commander cast anything. Screen involvement now comes only from the tier budget, so a T1
  skill no longer shakes the screen even when you cast it yourself. The skill name plate and the ultimate cut-in
  (`game.js`) are unchanged.
* The budget is per cast, shared by all beats. Multi-beat skills must ration it (see the comment in `xmag_prism`:
  22 shapes = 5 at the cast + 5 + 6 + 6). `over` in skshow tells you when you did not.
* Hit-stop is only granted to the player's commanders. Enemy casts never freeze the screen.
* `fall` on a unit-targeted skill follows the unit; the marked tile is where it stood. Prefer tile-targeted skills for falls.
* Zones do not stack per caster and skill; the area is fixed; a zone dies with its caster.
* Engine clock for choreography is `sim.t + sim.acc`. Old pieces (`c.burst`, `c.ring`, `c.shape`, `c.line`) animate on the
  view's own frame time as before (they keep moving for a fraction of a second while the game is paused); the new
  pieces (`c.fx`) and `c.at` stop with the game.
* The old master kits (`bm`, `tm`, `mm`) contain class skills (for example `inf_bash`, `mag_ember`), so they show the
  signature effects too. Their own skills (`bm_*`, `tm_*`, `mm_*`) are generic.
* Sound levels were set by measurement (`tools/sklvl.js`), not by ear. If something is too loud or dull on a phone,
  change the number in the `LVL` table of `audio.js`.
* `t_smoke` checks a skill's events immediately after the cast. It now calls `sim.seqFlush()` first. If you add a
  test that inspects events right after `sim.cast`, do the same.

