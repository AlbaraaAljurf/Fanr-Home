# Fanr Homes — App Design Package (Full)

Complete product design for **Fanr Homes / فَنر هومز** — Saudi Arabia's consumer-first real-estate
& rentals platform — derived from **PRD v1.0 (July 2026)**. Every screen is annotated with the PRD
requirement IDs it satisfies.

## Viewing the design

Open `index.html` in a browser (or serve the repo with any static server / GitHub Pages).
No build step — plain HTML/CSS, one shared stylesheet.

| File | Contents |
|---|---|
| `index.html` | Design overview: intent, principles, information architecture, screen inventory, compliance traceability |
| `design-system.html` | Foundations: brand palette, semantic colour, Tajawal type scale, controls, and the four signature components |
| `screens-core.html` | 01–10 · Splash, Nafath sign-in, intent picker, Home, map search, draw-boundary, filters, results, compare/co-shopping, saved searches |
| `screens-property.html` | 11–17 · Property pages (rent + sale), تقدير فَنر detail, «هل إيجاري نظامي؟» checker (form + verdict), unlisted-property page, lead capture |
| `screens-owner.html` | 18–23 · Owner dashboard, claim flow (Nafath + deed), owner listing wizard, Ejar readiness pack, renewal calendar |
| `screens-broker.html` | 24–29 · Broker dashboard, add-listing compliance gate, lead inbox, subscriptions & featured, off-plan project (Wafi), admin console (web) |
| `screens-invest-data.html` | 30–37 · Foreign-investor module (EN), district & city data pages, مساعد فَنر chat, notifications, profile |
| `assets/design.css` | Shared design tokens + component styles |

## Design decisions (summary)

1. **Legal truth over market opinion.** In Riyadh the legal rent cap is the primary number wherever
   it exists; the market estimate is demoted to context (PRD §7.3, E5.1). The Legal Rent Indicator,
   the «هل إيجاري نظامي؟» checker, the freeze-zone map overlay and the «ضمن السقف النظامي» filter are
   the product wedge no competitor has.
2. **A range, never a bare number.** Every تقدير فَنر renders range + point + confidence + the Taqeem
   disclaimer in UI copy (R3.5.1, R-E4-2/7); transparency panel shows comps, dates, district median
   and the published error rate (R-E4-3/6).
3. **Compliance as visible trust.** REGA ad-licence, FAL, Nafath and deed verification are first-class
   UI (badge stack on every listing, publish gates in the wizards, expiry auto-unpublish states).
4. **The listing is the start, not the end.** Cross-sell blocks route into the existing Fanr platform:
   Cost Estimator (pre-filled, R-E3-4), Provider Directory, Developer Mode, Assets Wallet.
5. **One app, one brand.** Homes is a module in the existing Fanr app (PRD Part XII, rec. 1) —
   five-tab bottom nav, gradient header per the live app UI.
6. **Arabic-first RTL**; the Foreign-Investor module (E9) is English-first LTR. Digits/licence numbers
   always render LTR.

## Brand (per Fanr brand book, PRD §8.6)

- Navy `#1A3C8F` · Sky `#29ABE2` · Green `#4DB560` · Gold `#F5C518` · Gray `#6C757D`
- Header gradient `#1E3FA8 → #3B5FD4` · primary button `#2B4FD8` · selected `#EEF2FF` on `#2B4FD8` · body `#F5F7FF`
- Type: **Somar** (brand) → **Tajawal** as the digital substitute (loaded from Google Fonts)

Gradient blocks stand in for listing photography/3D tours; map surfaces are illustrative mocks of the
MapLibre implementation specified in PRD §8.1.

---
*Fanr Solutions — Confidential. Design package for internal & contracted development partners.*
