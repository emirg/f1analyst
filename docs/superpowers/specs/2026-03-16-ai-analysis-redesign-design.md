# AI Analysis Redesign — Enriched Context + Conversational Chat

## Problem

The current AI Analysis feature sends minimal data (averages, std dev) to OpenAI and returns a generic markdown block. The analysis doesn't reference the actual telemetry, strategy, or historical data visible in the charts. There's no interactivity — the user clicks "Analyze" and gets a static wall of text. As the core differentiating feature of F1 Analyst, it deserves to be the visual and functional protagonist of the comparison view.

## Goals

1. Feed the AI rich, multi-level context: current session telemetry + full weekend + season trend
2. Replace the static panel with a conversational chat (initial analysis + predefined suggestions + free-form questions)
3. Make AI Analysis the visual protagonist — full-width at the top of the comparison page, above all charts
4. Enable meaningful predictions: race result, optimal strategy, relative performance trends

## Approach

Build a `ContextBuilder` service that assembles a rich data package from FastF1. Inject it as system prompt context. Replace the static AI panel with a chat component that auto-generates an initial analysis, shows dynamic follow-up suggestions, and supports free-form conversation. Deprecate the old `compare-drivers` endpoint.

---

## 1. Backend — ContextBuilder Service

New service `backend/app/services/context_builder.py` responsible for assembling the data package.

### Data Levels

**Level 1 — Current session:**
- Per-lap times for both drivers (not averages — actual lap-by-lap data)
- Best lap sector times (S1, S2, S3) per driver
- Tire strategy: stints with compound, lap range, degradation slope per stint (linear regression of lap times within each stint — positive slope = degrading)
- Position per lap (race sessions)
- Telemetry summary of fastest lap: max speed, min cornering speed, throttle/brake zones

**Level 2 — Full weekend:**
- Summary of each session (FP1 through Race) for both drivers: finishing position, best lap time, gap to session leader
- Pace evolution across the weekend: delta of each driver's best lap time vs session leader, per session. Improving = gap shrinking across sessions.

**Level 3 — Season trend:**
- Results from all completed GPs in the season for both drivers: qualifying position, race position, points scored, gap to race winner
- Qualifying vs race delta trend (does the driver gain or lose positions on race day?)
- Season consistency: std dev of finishing positions

### Output Format

The ContextBuilder returns a formatted string (not raw JSON) optimized for LLM comprehension. Sections are clearly labeled with `===` headers. Numbers are human-readable (e.g., "1:23.456" not "83.456 seconds").

### Caching

Context is cached by key `year+gp+session+driver1+driver2` with 30min TTL. The session is included in the key because Level 1 data varies per session type (Race has positions, FP has different telemetry profiles).

### Graceful Degradation

If a data level fails to load (e.g., season just started with no historical data, or FP1 has no position data), the ContextBuilder includes whatever is available and adds a note: `[Season data: not available — season has not started]`. The AI proceeds with partial context. Level 1 (current session) is required — if it fails, the endpoint returns a 400 error.

### Token Management

To stay within model context limits, the ContextBuilder summarizes data rather than dumping raw values when the dataset is large:
- Lap times: include all laps for the current session (typically 50-70 laps max), but for season trend only include per-GP summaries (not individual laps from every race)
- Conversation history: if messages exceed 20 turns, truncate the oldest messages (keep the first assistant message — the initial analysis — and the last 10 exchanges)
- Target system prompt size: ~3000-4000 tokens for context data

### Model

Uses the model configured in `OPENAI_MODEL` env var (currently `gpt-4o-mini`). No change needed.

---

## 2. Backend — Chat Endpoint

### `POST /api/v1/agent/chat`

Request:
```json
{
  "year": 2024,
  "gp": "Monaco",
  "session": "Race",
  "driver1": "VER",
  "driver2": "HAM",
  "messages": []
}
```

- `messages: []` triggers the initial analysis (no user message needed)
- Follow-ups include full message history: `[{role: "user", content: "..."}, {role: "assistant", content: "..."}, ...]`

Response:
```json
{
  "content": "## Resumen ejecutivo\n...",
  "suggestions": [
    "¿Cómo afectó la degradación al resultado?",
    "¿Qué estrategia hubiera sido óptima para Hamilton?",
    "¿Cómo se compara con la tendencia de temporada?"
  ]
}
```

### System Prompt Structure

**Part 1 — Role:**
Expert F1 analyst with access to real telemetry, strategy, and historical data. Responds in the same language as the user's message (detected from message text, not browser locale). Cites specific numbers.

**Part 2 — Context data (from ContextBuilder):**
Injected as system message content. Labeled sections for current session, weekend, and season.

**Part 3 — Format instructions:**
- Initial analysis: executive summary (2-3 sentences), session performance, season context, predictions (race result, optimal strategy, relative trend)
- Every response ends with a JSON block: `{"suggestions": ["...", "...", "..."]}` (exactly 3 suggestions) which the backend parses and returns separately from the markdown content. If the LLM omits the JSON block or returns invalid JSON, the backend returns `suggestions: []` as fallback — the chat still works, just without suggestion chips.

### Deprecated

`POST /api/v1/agent/compare-drivers` is replaced by `/agent/chat`. The old endpoint can remain temporarily but the frontend stops using it.

---

## 3. Frontend — AIChat Component

Replaces `AIAnalysisPanel.tsx` with `AIChat.tsx`.

### Position and Sizing

- Full-width at the top of the comparison page, above all chart panels
- Dynamic height with collapse behavior (see below)

### Interaction Flow

1. **Auto-trigger:** When the user submits a comparison, the initial analysis fires automatically (no button click needed). `messages: []` is sent to `/agent/chat`.
2. **Initial analysis renders:** Full markdown with executive summary, performance details, predictions.
3. **Suggestions appear:** 3-4 clickable chips below the analysis. Clicking one sends it as a user message.
4. **Chat continues:** Free-form text input at the bottom. Each message sends the full history to the backend.
5. **New suggestions:** After each AI response, new contextual suggestions appear.

### Collapse Behavior

- The initial analysis is always fully visible (no truncation)
- After 3 chat exchanges, older messages auto-collapse with a "Ver conversación completa (N mensajes)" button
- The latest AI response + suggestions are always visible
- Expanding shows the full conversation with scroll

### Visual Style

- Paper component, full-width, border accent `#3b82f6` to visually distinguish from chart panels
- AI messages: markdown rendered with dark theme styling (existing styles from AIAnalysisPanel)
- User messages: right-aligned, subtle background `#1a1b25`
- Suggestion chips: outlined style with `#3b82f6` border, hover fills
- Input: dark TextField at bottom with send button
- Typing indicator: pulsing dots animation while waiting for AI response (full response, no streaming — wait for complete response before rendering)
- Loading state for initial analysis: typing indicator in the chat panel while the first response loads
- Conversations are frontend-only state (not persisted server-side). Page refresh clears the chat. The user can re-trigger the initial analysis by submitting a new comparison.

---

## 4. Data Flow Summary

```
User submits comparison
        │
        ├──→ 5 chart data fetches (parallel, unchanged)
        │
        └──→ POST /agent/chat {messages: []}
                    │
                    ├── ContextBuilder.build(year, gp, session, d1, d2)
                    │       ├── Level 1: current session data
                    │       ├── Level 2: weekend summary
                    │       └── Level 3: season trend
                    │
                    ├── Assemble system prompt (role + context + format instructions)
                    │
                    ├── OpenAI chat.completions.create([system, ...messages])
                    │
                    ├── Parse response: separate markdown from suggestions JSON
                    │
                    └── Return {content, suggestions}

User asks follow-up (click suggestion or free text)
        │
        └──→ POST /agent/chat {messages: [...history, {role: "user", content: "..."}]}
                    │
                    ├── ContextBuilder.build() — from cache
                    ├── Same system prompt + full message history
                    └── Return {content, suggestions}
```
