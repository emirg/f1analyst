# F1 Analyst — Dashboard Redesign & Performance Optimization

## Problem

The current UI has a single view (driver comparison) with a cascading selector flow that makes 4 sequential API requests, resulting in noticeable latency at each step. The frontend also calls two different data sources (backend API + OpenF1 directly), adding complexity. The visual design is basic MUI with a white theme.

## Goals

1. Reduce perceived latency in the selector cascade from 4 sequential requests to 1+1
2. Centralize all data fetching through the backend (eliminate direct OpenF1 calls from frontend)
3. Redesign the UI with a dark analytics-style theme (data-dense, Grafana/Bloomberg-inspired)
4. Add interactive comparison charts (all rendered in frontend with Recharts)
5. Add new dashboard views: overview, calendar, standings

## Approach

Evolve the existing React + MUI stack. Restyle with a custom dark theme, add React Router for multi-view navigation, and optimize data flow by centralizing API calls and reducing the selector cascade.

---

## 1. Backend — Centralized Gateway

All data flows through the backend. The frontend no longer calls OpenF1 directly.

### New Endpoints

| Endpoint | Data | Source |
|---|---|---|
| `GET /api/v1/dashboard/overview` | Next race, last result, standings top 5 | FastF1 / cache |
| `GET /api/v1/standings/drivers/{year}` | Driver championship standings | FastF1 |
| `GET /api/v1/standings/constructors/{year}` | Constructor championship standings | FastF1 |
| `GET /api/v1/comparison/telemetry?year&gp&session&driver1&driver2` | Speed, throttle, brake per lap | FastF1 |
| `GET /api/v1/comparison/laps?year&gp&session&driver1&driver2` | Lap times for both drivers | FastF1 |
| `GET /api/v1/comparison/sectors?year&gp&session&driver1&driver2` | Sector times comparison | FastF1 |
| `GET /api/v1/comparison/strategy?year&gp&session&driver1&driver2` | Stints, compounds, pit stops | FastF1 |
| `GET /api/v1/comparison/positions?year&gp&session&driver1&driver2` | Position evolution per lap | FastF1 |

All comparison endpoints share the same query parameters: `year` (int), `gp` (string, Grand Prix name), `session` (string, e.g. "Race", "Qualifying"), `driver1` and `driver2` (string, driver abbreviations like "VER", "HAM").

### Existing Endpoints (kept)

- `GET /api/v1/calendar/year-data/{year}` — Returns GPs + drivers in a single request
- `GET /api/v1/calendar/year-calendar/{year}` — Full season calendar
- `GET /api/v1/calendar/gp-sessions/{year}/{gp}` — Sessions for a specific GP
- `POST /api/v1/agent/compare-drivers` — AI-powered analysis (on-demand)

### Caching Strategy

- In-memory TTLCache (current approach, no Redis needed)
- Dashboard overview: 15min TTL
- Calendar/standings: 1hr TTL
- Session/comparison data: 30min TTL
- FastF1 disk cache in `backend/data/cache/` for raw telemetry

### Selector Cascade Optimization

Before: Year → (request) → GP → (request) → Session → (request) → Driver1 → (request) → Driver2
After: Year → (single request to `year-data/{year}` returns GPs + drivers) → GP → (single request for sessions) → Driver1 → Driver2

Reduced from 4 sequential requests to 1+1.

### Removed

- `frontend/src/services/openF1Api.ts` — all data consumed from backend

---

## 2. Frontend — Routes and Layout

### Routes

| Route | View | Description |
|---|---|---|
| `/` | Dashboard | Next race, last result, standings top 5 |
| `/calendar` | Calendar | Full season schedule |
| `/comparison` | Driver Comparison | Redesigned with interactive charts |
| `/standings` | Standings | Full driver and constructor classifications |

### Layout

```
┌──────────┬─────────────────────────────────┐
│          │  Header (breadcrumb + global    │
│  Sidebar │  year selector)                 │
│          ├─────────────────────────────────┤
│  - Home  │                                 │
│  - Cal   │  Content Area                   │
│  - Comp  │  (changes per route)            │
│  - Stand │                                 │
│          │                                 │
└──────────┴─────────────────────────────────┘
```

- **Sidebar:** Fixed, collapses to icons below 1024px breakpoint. Active route indicator.
- **Header:** Global year selector via React Context (`YearContext`). Persists across views.
- **YearContext:** Provides selected year app-wide. Changing year triggers data reload in active view.

---

## 3. Visual Theme — Dark Analytics

### Color Palette

| Role | Color | Usage |
|---|---|---|
| Background base | `#0a0a0f` | Main background |
| Surface / cards | `#12131a` | Panels, cards, sidebar |
| Surface elevated | `#1a1b25` | Dropdowns, modals, hover |
| Border | `#2a2b3d` | Subtle panel borders |
| Text primary | `#e4e4e7` | Main text |
| Text secondary | `#8b8b9e` | Labels, subtitles |
| Accent primary | `#3b82f6` | Actions, links, active state |
| Accent success | `#22c55e` | Better performance |
| Accent danger | `#ef4444` | Worse performance, errors |
| Accent warning | `#f59e0b` | Alerts, partial data |

### Typography

- **UI text:** Inter (loaded via Google Fonts, fallback: system-ui, sans-serif)
- **Numeric data:** JetBrains Mono (loaded via Google Fonts, fallback: monospace)

### Component Styling

- Cards: 1px border `#2a2b3d`, no heavy shadows, 8px border-radius, elevated surface background
- Charts (Recharts): Transparent background, grid lines `#2a2b3d`, driver colors from team colors (FastF1), dark tooltips with detailed data on hover. Chart grid stacks to single column below 768px.
- Loading: Skeleton loaders with shimmer (no spinners). Dropdowns show inline skeleton while loading.
- Transitions: 200ms fade-in on data load. No excessive animations.

---

## 4. Comparison View — Interactive Charts

### Selectors (optimized)

```
[ Year (global) ] → [ Grand Prix ] → [ Session ] → [ Driver 1 ] vs [ Driver 2 ]
```

Year comes from YearContext. GP selection triggers a single session request. Drivers are already loaded.

### Chart Grid (6 panels)

```
┌─────────────────────┬─────────────────────┐
│  Lap Times          │  Speed Telemetry    │
│  (line chart)       │  (line chart)       │
├─────────────────────┼─────────────────────┤
│  Sector Times       │  Tire Strategy      │
│  (grouped bar)      │  (horizontal bars)  │
├─────────────────────┼─────────────────────┤
│  Position History   │  AI Analysis        │
│  (line chart)       │  (markdown card)    │
└─────────────────────┴─────────────────────┘
```

### Panel Details

- **Lap Times:** Line per driver, X=lap, Y=time. Hover shows exact time and delta. Team colors.
- **Speed Telemetry:** Speed, throttle %, brake % overlaid on best lap per driver. Toggle to select metric.
- **Sector Times:** Grouped bars S1/S2/S3 side by side. Green=better, red=worse.
- **Tire Strategy:** Horizontal timeline bars. Each stint as a segment colored by compound (red=soft, yellow=medium, white=hard). Shows lap count per stint.
- **Position History:** Race sessions only (hidden when session type is not "Race" — session type comes from the `gp-sessions` endpoint response). Line per driver, X=lap, Y=position (inverted axis).
- **AI Analysis:** Kept as markdown card. Triggered by separate "Analyze" button (does not block chart loading).

### Loading Behavior

All 5 data endpoints called in parallel. Each panel manages its own fetch state independently (separate `useEffect` or individual promise handlers, not `Promise.all`) so panels render as their data arrives. If one endpoint fails, the affected panel shows an inline error with retry button; other panels are unaffected. AI analysis is on-demand only (triggered by button).

---

## 5. Dashboard, Calendar, and Standings Views

### Dashboard (`/`)

```
┌─────────────────────┬─────────────────────┐
│  Next Race          │  Last Race Result   │
│  (countdown + info) │  (top 5 + podium)   │
├─────────────────────┴─────────────────────┤
│  Driver Standings (top 10 bar chart)      │
├───────────────────────────────────────────┤
│  Constructor Standings (top 10 bar chart) │
└───────────────────────────────────────────┘
```

Single request to `/dashboard/overview`. Independent skeleton per panel.

### Calendar (`/calendar`)

- Vertical list of GPs as cards: name, circuit, date, status (completed/upcoming/future). "Upcoming" = the next unfinished race; "future" = all races after that.
- The single upcoming GP highlighted with accent border
- Click to expand and show sessions with dates

### Standings (`/standings`)

- Two tabs: Drivers / Constructors
- Data-dense table: position, name, team (team color), points
- Horizontal bar chart next to points for quick visual comparison
- Data from `/standings/drivers/{year}` and `/standings/constructors/{year}`
