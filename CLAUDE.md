# CLAUDE.md — GXB-Wiget

## Kingdom Context

This repo is part of **The Kingdom** — the parent entity of King Darius (Darrayon). Every build here connects back to the whole. Never treat any division as standalone.

### The Architecture (Four Divisions)
1. **GXB (Generation X Billionaires)** — Finance & trading arm
   - GXB Capital: active trading, crypto, portfolio
   - GXB Protection: insurance, wealth preservation
   - GXB Intelligence: AI systems, financial tools
   - GXB Legacy: generational wealth, community
2. **Qi House** — Wellness (bodywork, sound therapy, breathwork, pet sitting). Brand is established — reference existing assets, stay consistent.
3. **D's Prime Projects** — Operations & hands-on service work
4. **WhoIsKingDarius** — Media, content, personal brand. Creative/frequency work operates under the name **Lainage**.

### The Ecosystem
- **Notion OS** — the brain (CRM, MoneyOS, intake forms, playbooks)
- **whoiskingdarius.com** — the public face; routes visitors to divisions
- **Mobile app** (future) — the conversion bridge

### Current Priorities
- **Track A (~80%):** immediate income activation — bookings, Calendly, outreach, event funnels. *The Frequency Reset* is the lead activation event.
- **Track B (~20%):** asset building — website, digital products.
- Ratio shifts as cash flow stabilizes. Ask if unsure which track a task serves.

---

## This Repo: GXB-Wiget

**Purpose:** The GXB Financial Command Center hero widget — a premium embed component for Notion (iframe). Part of GXB Intelligence.

**Stack:** Pure HTML5/CSS3/vanilla JavaScript. Zero dependencies, zero build system. Single file: `index.html` (604 lines, ~18KB).

---

## File Structure

```
GXB-Wiget/
├── index.html       # Entire application — HTML + CSS + JS in one file
└── README.md        # Placeholder (update as needed)
```

No `package.json`, no `node_modules`, no build config, no `.env`. This is intentional.

---

## index.html Architecture

### HTML Structure
- Header: "GXB — Financial Command Center" with status indicator
- 3-column card grid: Capital, Growth, Legacy orbs
- Canvas element: animated background FX layer

### CSS (embedded `<style>`)
All design tokens live as CSS custom properties at `:root`. Three easy-edit zones are marked in comments:

| Section | Lines | What it controls |
|---|---|---|
| **EASY EDIT: Palette** | 15–38 | `--bg0`, `--bg1`, `--ink`, `--muted`, `--holoA`, `--holoB`, `--diamond`, `--gold`, glow intensity |
| **EASY EDIT: Titles** | 396–403 | h1 text ("GXB"), subtitle, statement/description |
| **EASY EDIT: Mode** | 475–488 | `CURRENT_MODE` string |

Key CSS features: glassmorphism (backdrop-filter), CSS Grid, Flexbox, radial/conic gradients, `@keyframes` animations, `prefers-reduced-motion` support, responsive breakpoint at **980px** (switches to single-column).

### JavaScript (embedded `<script>`, ~467 lines)
- **Canvas FX engine:** perspective grid renderer + particle system (18–48 particles, scales with viewport)
- **ResizeObserver:** responsive canvas sizing with device pixel ratio capping at 2x
- **Mode system:** set `CURRENT_MODE` to one of `"Expansion"` | `"Stabilization"` | `"Recovery"` | `"Scaling"` — automatically updates pill color tinting and UI text
- **60fps AnimationFrame loop** using `globalCompositeOperation: "screen"`

---

## Development Workflow

### Making Changes
1. Edit `index.html` directly — there is no build step.
2. Open in a browser to verify. Test at both desktop width and ≤980px (mobile).
3. Check `prefers-reduced-motion` behavior (animations should stop).
4. Commit and push to the active branch.

### Customization Points (in order of frequency)
1. **Colors/theme** → edit CSS variables in lines 15–38 (EASY EDIT: Palette)
2. **Text/copy** → edit lines 396–403 (EASY EDIT: Titles)
3. **Mode state** → change `CURRENT_MODE` in lines 475–488 (EASY EDIT: Mode)
4. **Card content** → edit the three orb card sections in the HTML body
5. **Particle/grid FX** → adjust constants at the top of the `<script>` block

### No Linting / No Tests
There is no linter, formatter, or test suite. Verify visually in-browser before declaring done. Report what was tested.

### Git
- Active development branch: `claude/claude-md-documentation-jmclck`
- Push: `git push -u origin <branch-name>`

---

## Brand & Design Standards

### Brand Identity Status
- **The Kingdom / WhoIsKingDarius master brand:** IN DEVELOPMENT. Do not lock in permanent brand decisions without flagging them. Use CSS variables/design tokens so colors, fonts, and logos can swap cleanly.
- **Qi House:** Established — pull from existing assets, stay consistent.
- **GXB:** Has a formal Project Guidelines doc — reference it for tone and positioning.

### Brand Foundation (applies everywhere)
Themes: freedom, wealth, wellness, intentional living, frequency, ancestral wisdom, plant-based living.

Philosophy: not escaping reality — functioning at a higher level within it.

Aesthetic: **grounded, elevated, intentional.** Never corporate-sterile. Never cheap/hype-y.

### GXB Visual Language (this widget)
- Dark glassmorphic UI with layered gradients
- Glowing orbs: multi-gradient, animated
- Micro-grid overlay inside cards
- Premium feel — every detail intentional

---

## Build Standards

- **Mobile-first always.** Primary traffic is social/link-in-bio on phones. Test at ≤980px.
- **Fast load, minimal dependencies.** This widget has zero external requests — keep it that way.
- **Every public page needs a conversion path** (booking link, intake form, email capture). Nothing exists just to look good.
- **Test before declaring done.** Report what was tested.
- **Keep components modular** so divisions can share structure with different skins. Use CSS variables for all theming values — no hardcoded colors.
- **Accessibility:** maintain ARIA labels and `prefers-reduced-motion` support.

---

## Key Assets & Integrations

| Asset | Purpose |
|---|---|
| Notion | CRM, intake forms, MoneyOS, event roster |
| Calendly | Bookings |
| QR code → Notion intake form | Active at Qi House |
| 9+ years client data | Strategic asset for Qi House — handle with care, never expose publicly |

This widget embeds into Notion via iframe. Keep it self-contained and iframe-safe (no `document.cookie`, no cross-origin calls, no popups).

### Embed placement policy (King's rule)

**One widget, one home: the original embed slot on the 💎 GXB hub page in Notion.**
Ship all updates in place to the URL that slot already points at (GitHub Pages picks
up merges to `main` automatically). Never add new embed blocks elsewhere in the
Notion workspace — if a widget needs a new location, King moves the embed himself.

---

## How to Work With King Darius

- **Direct, real, action-oriented.** No fluff, no over-explaining.
- **Challenge things that don't make sense.** He wants pushback, not yes-energy.
- **Think in systems** — show how pieces connect.
- **Projects evolve.** Stay adaptive; don't hard-code assumptions.
- **When given a rough idea, build a v1 to react to** rather than asking a long list of questions. Ask only what's blocking.

---

## When Unsure

Flag it, propose a direction, and keep moving. Default to the option that **activates income fastest without compromising the long-term brand.**
