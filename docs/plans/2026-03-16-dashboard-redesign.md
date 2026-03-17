# Dashboard Redesign & Performance Optimization — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign F1 Analyst from a single-view app into a multi-view analytics dashboard with dark theme, interactive charts, and optimized API performance.

**Architecture:** Evolve existing React+MUI frontend with dark analytics theme, React Router, and Recharts. Backend becomes the sole data gateway (remove direct OpenF1 calls). New endpoints for telemetry, standings, and dashboard overview. Cascade optimized from 4 sequential requests to 1+1.

**Tech Stack:** FastAPI, FastF1, React 19, TypeScript, MUI 7, Recharts, React Router

---

## Task 1: Backend — Comparison Data Endpoints

New service to extract structured comparison data from FastF1 sessions for the frontend charts.

**Files:**
- Create: `backend/app/services/comparison.py`
- Create: `backend/app/api/v1/endpoints/comparison.py`
- Modify: `backend/app/schemas/f1.py`
- Modify: `backend/app/main.py:25` (add router)
- Create: `backend/tests/test_comparison_schemas.py`

**Step 1: Add Pydantic schemas for comparison responses**

Add to `backend/app/schemas/f1.py`:

```python
class LapTimeEntry(BaseModel):
    lap_number: int
    driver: str
    time_seconds: float
    compound: Optional[str] = None

class ComparisonLapsResponse(BaseModel):
    driver1: str
    driver2: str
    laps: List[LapTimeEntry]

class TelemetryPoint(BaseModel):
    distance: float
    speed: float
    throttle: float
    brake: bool

class DriverTelemetry(BaseModel):
    driver: str
    team_color: str
    data: List[TelemetryPoint]

class ComparisonTelemetryResponse(BaseModel):
    driver1: DriverTelemetry
    driver2: DriverTelemetry

class SectorTime(BaseModel):
    driver: str
    sector1: float
    sector2: float
    sector3: float

class ComparisonSectorsResponse(BaseModel):
    driver1: SectorTime
    driver2: SectorTime

class Stint(BaseModel):
    stint_number: int
    compound: str
    lap_start: int
    lap_end: int
    laps: int

class DriverStrategy(BaseModel):
    driver: str
    stints: List[Stint]

class ComparisonStrategyResponse(BaseModel):
    driver1: DriverStrategy
    driver2: DriverStrategy

class PositionEntry(BaseModel):
    lap_number: int
    driver: str
    position: int

class ComparisonPositionsResponse(BaseModel):
    driver1: str
    driver2: str
    positions: List[PositionEntry]

class ComparisonQueryParams(BaseModel):
    year: int
    gp: str
    session: str
    driver1: str
    driver2: str
```

**Step 2: Write the comparison service**

Create `backend/app/services/comparison.py`:

```python
import fastf1
import pandas as pd
from app.services.calendar import CalendarService, get_calendar_service
from app.services.cache_manager import get_cache_manager
from app.schemas.f1 import (
    LapTimeEntry, ComparisonLapsResponse,
    TelemetryPoint, DriverTelemetry, ComparisonTelemetryResponse,
    SectorTime, ComparisonSectorsResponse,
    Stint, DriverStrategy, ComparisonStrategyResponse,
    PositionEntry, ComparisonPositionsResponse,
)

_comparison_service_instance = None

class ComparisonService:
    def __init__(self):
        self.calendar_service = get_calendar_service()
        self.cache_manager = get_cache_manager()

    async def _get_session(self, year: int, gp: str, session: str, need_telemetry: bool = False):
        return await self.calendar_service.get_session_data(year, gp, session, load_telemetry=need_telemetry)

    async def get_laps(self, year: int, gp: str, session: str, driver1: str, driver2: str) -> ComparisonLapsResponse:
        session_data = await self._get_session(year, gp, session)
        laps = []
        for drv in [driver1, driver2]:
            drv_laps = session_data.laps.pick_drivers(drv)
            for _, lap in drv_laps.iterrows():
                lt = lap['LapTime']
                if pd.notna(lt):
                    laps.append(LapTimeEntry(
                        lap_number=int(lap['LapNumber']),
                        driver=drv,
                        time_seconds=lt.total_seconds(),
                        compound=lap.get('Compound')
                    ))
        return ComparisonLapsResponse(driver1=driver1, driver2=driver2, laps=laps)

    async def get_telemetry(self, year: int, gp: str, session: str, driver1: str, driver2: str) -> ComparisonTelemetryResponse:
        session_data = await self._get_session(year, gp, session, need_telemetry=True)
        result = {}
        for drv in [driver1, driver2]:
            drv_laps = session_data.laps.pick_drivers(drv)
            fastest = drv_laps.pick_fastest()
            tel = fastest.get_telemetry()
            team_color = f"#{fastest['Team']}" if 'Team' in fastest else "#3b82f6"
            try:
                team_color = f"#{session_data.results[session_data.results['Abbreviation'] == drv].iloc[0]['TeamColor']}"
            except Exception:
                team_color = "#3b82f6"
            points = [
                TelemetryPoint(
                    distance=float(row['Distance']),
                    speed=float(row['Speed']),
                    throttle=float(row['Throttle']),
                    brake=bool(row['Brake'])
                )
                for _, row in tel.iterrows()
            ]
            result[drv] = DriverTelemetry(driver=drv, team_color=team_color, data=points)
        return ComparisonTelemetryResponse(driver1=result[driver1], driver2=result[driver2])

    async def get_sectors(self, year: int, gp: str, session: str, driver1: str, driver2: str) -> ComparisonSectorsResponse:
        session_data = await self._get_session(year, gp, session)
        result = {}
        for drv in [driver1, driver2]:
            drv_laps = session_data.laps.pick_drivers(drv)
            fastest = drv_laps.pick_fastest()
            result[drv] = SectorTime(
                driver=drv,
                sector1=fastest['Sector1Time'].total_seconds() if pd.notna(fastest['Sector1Time']) else 0,
                sector2=fastest['Sector2Time'].total_seconds() if pd.notna(fastest['Sector2Time']) else 0,
                sector3=fastest['Sector3Time'].total_seconds() if pd.notna(fastest['Sector3Time']) else 0,
            )
        return ComparisonSectorsResponse(driver1=result[driver1], driver2=result[driver2])

    async def get_strategy(self, year: int, gp: str, session: str, driver1: str, driver2: str) -> ComparisonStrategyResponse:
        session_data = await self._get_session(year, gp, session)
        result = {}
        for drv in [driver1, driver2]:
            drv_laps = session_data.laps.pick_drivers(drv)
            stints = []
            stint_groups = drv_laps.groupby('Stint')
            for stint_num, stint_laps in stint_groups:
                compound = stint_laps.iloc[0].get('Compound', 'UNKNOWN')
                stints.append(Stint(
                    stint_number=int(stint_num),
                    compound=compound if compound else 'UNKNOWN',
                    lap_start=int(stint_laps['LapNumber'].min()),
                    lap_end=int(stint_laps['LapNumber'].max()),
                    laps=len(stint_laps),
                ))
            result[drv] = DriverStrategy(driver=drv, stints=stints)
        return ComparisonStrategyResponse(driver1=result[driver1], driver2=result[driver2])

    async def get_positions(self, year: int, gp: str, session: str, driver1: str, driver2: str) -> ComparisonPositionsResponse:
        session_data = await self._get_session(year, gp, session)
        positions = []
        for drv in [driver1, driver2]:
            drv_laps = session_data.laps.pick_drivers(drv)
            for _, lap in drv_laps.iterrows():
                if pd.notna(lap.get('Position')):
                    positions.append(PositionEntry(
                        lap_number=int(lap['LapNumber']),
                        driver=drv,
                        position=int(lap['Position'])
                    ))
        return ComparisonPositionsResponse(driver1=driver1, driver2=driver2, positions=positions)

def get_comparison_service() -> ComparisonService:
    global _comparison_service_instance
    if _comparison_service_instance is None:
        _comparison_service_instance = ComparisonService()
    return _comparison_service_instance
```

**Step 3: Create the comparison router**

Create `backend/app/api/v1/endpoints/comparison.py`:

```python
from fastapi import APIRouter, HTTPException, Depends, Query
from app.services.comparison import ComparisonService, get_comparison_service
from app.schemas.f1 import (
    ComparisonLapsResponse, ComparisonTelemetryResponse,
    ComparisonSectorsResponse, ComparisonStrategyResponse,
    ComparisonPositionsResponse,
)

router = APIRouter()

@router.get("/laps", response_model=ComparisonLapsResponse)
async def get_comparison_laps(
    year: int = Query(...), gp: str = Query(...), session: str = Query(...),
    driver1: str = Query(...), driver2: str = Query(...),
    service: ComparisonService = Depends(get_comparison_service)
):
    try:
        return await service.get_laps(year, gp, session, driver1, driver2)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/telemetry", response_model=ComparisonTelemetryResponse)
async def get_comparison_telemetry(
    year: int = Query(...), gp: str = Query(...), session: str = Query(...),
    driver1: str = Query(...), driver2: str = Query(...),
    service: ComparisonService = Depends(get_comparison_service)
):
    try:
        return await service.get_telemetry(year, gp, session, driver1, driver2)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/sectors", response_model=ComparisonSectorsResponse)
async def get_comparison_sectors(
    year: int = Query(...), gp: str = Query(...), session: str = Query(...),
    driver1: str = Query(...), driver2: str = Query(...),
    service: ComparisonService = Depends(get_comparison_service)
):
    try:
        return await service.get_sectors(year, gp, session, driver1, driver2)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/strategy", response_model=ComparisonStrategyResponse)
async def get_comparison_strategy(
    year: int = Query(...), gp: str = Query(...), session: str = Query(...),
    driver1: str = Query(...), driver2: str = Query(...),
    service: ComparisonService = Depends(get_comparison_service)
):
    try:
        return await service.get_strategy(year, gp, session, driver1, driver2)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/positions", response_model=ComparisonPositionsResponse)
async def get_comparison_positions(
    year: int = Query(...), gp: str = Query(...), session: str = Query(...),
    driver1: str = Query(...), driver2: str = Query(...),
    service: ComparisonService = Depends(get_comparison_service)
):
    try:
        return await service.get_positions(year, gp, session, driver1, driver2)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

**Step 4: Register the router in main.py**

In `backend/app/main.py`, add:

```python
from app.api.v1.endpoints import agent, calendar, comparison
# ...
app.include_router(comparison.router, prefix=f"{settings.API_V1_STR}/comparison", tags=["Comparison"])
```

**Step 5: Write schema tests**

Create `backend/tests/test_comparison_schemas.py`:

```python
from app.schemas.f1 import (
    LapTimeEntry, ComparisonLapsResponse,
    SectorTime, ComparisonSectorsResponse,
    Stint, DriverStrategy, ComparisonStrategyResponse,
    PositionEntry, ComparisonPositionsResponse,
)

def test_lap_time_entry():
    entry = LapTimeEntry(lap_number=1, driver="VER", time_seconds=90.123, compound="SOFT")
    assert entry.lap_number == 1
    assert entry.driver == "VER"

def test_comparison_laps_response():
    laps = [LapTimeEntry(lap_number=1, driver="VER", time_seconds=90.0)]
    resp = ComparisonLapsResponse(driver1="VER", driver2="HAM", laps=laps)
    assert resp.driver1 == "VER"
    assert len(resp.laps) == 1

def test_sector_time():
    st = SectorTime(driver="VER", sector1=28.5, sector2=33.1, sector3=25.9)
    assert st.sector1 == 28.5

def test_stint():
    stint = Stint(stint_number=1, compound="SOFT", lap_start=1, lap_end=20, laps=20)
    assert stint.laps == 20

def test_position_entry():
    pe = PositionEntry(lap_number=5, driver="HAM", position=3)
    assert pe.position == 3
```

**Step 6: Run tests**

Run: `pytest backend/tests/test_comparison_schemas.py -v`
Expected: All 5 tests PASS

**Step 7: Commit**

```bash
git add backend/app/services/comparison.py backend/app/api/v1/endpoints/comparison.py backend/app/schemas/f1.py backend/app/main.py backend/tests/test_comparison_schemas.py
git commit -m "feat: add comparison data endpoints (laps, telemetry, sectors, strategy, positions)"
```

---

## Task 2: Backend — Standings & Dashboard Endpoints

**Files:**
- Create: `backend/app/services/standings.py`
- Create: `backend/app/api/v1/endpoints/standings.py`
- Create: `backend/app/api/v1/endpoints/dashboard.py`
- Modify: `backend/app/schemas/f1.py`
- Modify: `backend/app/main.py`

**Step 1: Add schemas**

Add to `backend/app/schemas/f1.py`:

```python
class DriverStanding(BaseModel):
    position: int
    driver: str
    driver_abbreviation: str
    team: str
    team_color: str
    points: float

class StandingsResponse(BaseModel):
    year: int
    standings: List[DriverStanding]

class ConstructorStanding(BaseModel):
    position: int
    team: str
    team_color: str
    points: float

class ConstructorStandingsResponse(BaseModel):
    year: int
    standings: List[ConstructorStanding]

class NextRace(BaseModel):
    event_name: str
    round_number: int
    date: str
    country: Optional[str] = None

class LastRaceResult(BaseModel):
    event_name: str
    top5: List[DriverStanding]

class DashboardOverview(BaseModel):
    year: int
    next_race: Optional[NextRace] = None
    last_race: Optional[LastRaceResult] = None
    driver_standings_top10: List[DriverStanding]
    constructor_standings_top10: List[ConstructorStanding]
```

**Step 2: Create standings service**

Create `backend/app/services/standings.py`:

```python
import fastf1
import pandas as pd
from datetime import datetime
from cachetools import TTLCache
from app.services.cache_manager import get_cache_manager
from app.schemas.f1 import (
    DriverStanding, StandingsResponse,
    ConstructorStanding, ConstructorStandingsResponse,
    NextRace, LastRaceResult, DashboardOverview,
)

_standings_service_instance = None

class StandingsService:
    def __init__(self):
        self.cache_manager = get_cache_manager()
        self._standings_cache = TTLCache(maxsize=20, ttl=3600)

    def _get_latest_race_session(self, year: int):
        """Find the most recent completed race in the season."""
        schedule = fastf1.get_event_schedule(year)
        now = pd.Timestamp.now(tz='UTC')
        latest_session = None
        latest_event = None

        for _, event in schedule.iterrows():
            session_date = event.get('Session5Date')
            if session_date is not None and pd.notna(session_date):
                if hasattr(session_date, 'tz') and session_date.tz is None:
                    session_date = session_date.tz_localize('UTC')
                if session_date < now:
                    try:
                        session = fastf1.get_session(year, int(event['RoundNumber']), 'R')
                        session.load(telemetry=False, laps=False, weather=False, messages=False)
                        if session.results is not None and not session.results.empty:
                            latest_session = session
                            latest_event = event
                    except Exception:
                        continue
        return latest_session, latest_event

    def _extract_team_color(self, results, driver_abbr: str) -> str:
        try:
            row = results[results['Abbreviation'] == driver_abbr].iloc[0]
            return f"#{row['TeamColor']}" if pd.notna(row.get('TeamColor')) else "#3b82f6"
        except Exception:
            return "#3b82f6"

    async def get_driver_standings(self, year: int) -> StandingsResponse:
        cache_key = f"driver_standings_{year}"
        if cache_key in self._standings_cache:
            return self._standings_cache[cache_key]

        session, _ = self._get_latest_race_session(year)
        standings = []
        if session is not None and session.results is not None:
            results = session.results.sort_values('Position')
            # Build cumulative standings from results
            for _, row in results.iterrows():
                standings.append(DriverStanding(
                    position=int(row['Position']) if pd.notna(row['Position']) else 0,
                    driver=row.get('FullName', ''),
                    driver_abbreviation=row.get('Abbreviation', ''),
                    team=row.get('TeamName', ''),
                    team_color=self._extract_team_color(results, row.get('Abbreviation', '')),
                    points=float(row['Points']) if pd.notna(row.get('Points')) else 0,
                ))

        resp = StandingsResponse(year=year, standings=standings)
        self._standings_cache[cache_key] = resp
        return resp

    async def get_constructor_standings(self, year: int) -> ConstructorStandingsResponse:
        cache_key = f"constructor_standings_{year}"
        if cache_key in self._standings_cache:
            return self._standings_cache[cache_key]

        session, _ = self._get_latest_race_session(year)
        team_points = {}
        team_colors = {}
        if session is not None and session.results is not None:
            for _, row in session.results.iterrows():
                team = row.get('TeamName', 'Unknown')
                pts = float(row['Points']) if pd.notna(row.get('Points')) else 0
                team_points[team] = team_points.get(team, 0) + pts
                if team not in team_colors:
                    team_colors[team] = f"#{row['TeamColor']}" if pd.notna(row.get('TeamColor')) else "#3b82f6"

        sorted_teams = sorted(team_points.items(), key=lambda x: x[1], reverse=True)
        standings = [
            ConstructorStanding(
                position=i + 1,
                team=team,
                team_color=team_colors.get(team, "#3b82f6"),
                points=pts,
            )
            for i, (team, pts) in enumerate(sorted_teams)
        ]

        resp = ConstructorStandingsResponse(year=year, standings=standings)
        self._standings_cache[cache_key] = resp
        return resp

    async def get_dashboard_overview(self, year: int) -> DashboardOverview:
        cache_key = f"dashboard_{year}"
        if cache_key in self._standings_cache:
            return self._standings_cache[cache_key]

        schedule = fastf1.get_event_schedule(year)
        now = pd.Timestamp.now(tz='UTC')

        # Find next race
        next_race = None
        for _, event in schedule.iterrows():
            session_date = event.get('Session5Date')
            if session_date is not None and pd.notna(session_date):
                if hasattr(session_date, 'tz') and session_date.tz is None:
                    session_date = session_date.tz_localize('UTC')
                if session_date > now:
                    next_race = NextRace(
                        event_name=event['EventName'],
                        round_number=int(event['RoundNumber']),
                        date=session_date.strftime('%Y-%m-%d %H:%M:%S'),
                        country=event.get('Country'),
                    )
                    break

        # Get standings
        driver_standings = await self.get_driver_standings(year)
        constructor_standings = await self.get_constructor_standings(year)

        # Last race result
        last_race = None
        session, last_event = self._get_latest_race_session(year)
        if session is not None and last_event is not None:
            last_race = LastRaceResult(
                event_name=last_event['EventName'],
                top5=driver_standings.standings[:5],
            )

        overview = DashboardOverview(
            year=year,
            next_race=next_race,
            last_race=last_race,
            driver_standings_top10=driver_standings.standings[:10],
            constructor_standings_top10=constructor_standings.standings[:10],
        )
        self._standings_cache[cache_key] = overview
        return overview

def get_standings_service() -> StandingsService:
    global _standings_service_instance
    if _standings_service_instance is None:
        _standings_service_instance = StandingsService()
    return _standings_service_instance
```

**Step 3: Create standings and dashboard routers**

Create `backend/app/api/v1/endpoints/standings.py`:

```python
from fastapi import APIRouter, HTTPException, Depends
from app.services.standings import StandingsService, get_standings_service
from app.schemas.f1 import StandingsResponse, ConstructorStandingsResponse

router = APIRouter()

@router.get("/drivers/{year}", response_model=StandingsResponse)
async def get_driver_standings(year: int, service: StandingsService = Depends(get_standings_service)):
    try:
        return await service.get_driver_standings(year)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/constructors/{year}", response_model=ConstructorStandingsResponse)
async def get_constructor_standings(year: int, service: StandingsService = Depends(get_standings_service)):
    try:
        return await service.get_constructor_standings(year)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

Create `backend/app/api/v1/endpoints/dashboard.py`:

```python
from fastapi import APIRouter, HTTPException, Depends
from app.services.standings import StandingsService, get_standings_service
from app.schemas.f1 import DashboardOverview

router = APIRouter()

@router.get("/overview", response_model=DashboardOverview)
async def get_dashboard_overview(
    year: int = None,
    service: StandingsService = Depends(get_standings_service)
):
    if year is None:
        from datetime import datetime
        year = datetime.now().year
    try:
        return await service.get_dashboard_overview(year)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**Step 4: Register routers in main.py**

Add to `backend/app/main.py`:

```python
from app.api.v1.endpoints import agent, calendar, comparison, standings, dashboard
# ...
app.include_router(standings.router, prefix=f"{settings.API_V1_STR}/standings", tags=["Standings"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])
```

**Step 5: Commit**

```bash
git add backend/app/services/standings.py backend/app/api/v1/endpoints/standings.py backend/app/api/v1/endpoints/dashboard.py backend/app/schemas/f1.py backend/app/main.py
git commit -m "feat: add standings and dashboard overview endpoints"
```

---

## Task 3: Frontend — Install Dependencies & Dark Theme

**Files:**
- Modify: `frontend/package.json` (add dependencies)
- Modify: `frontend/src/App.tsx` (replace theme + add router)
- Create: `frontend/src/theme.ts`
- Create: `frontend/src/contexts/YearContext.tsx`
- Modify: `frontend/public/index.html` (add Google Fonts)

**Step 1: Install new dependencies**

```bash
cd frontend && npm install react-router-dom recharts @fontsource/inter @fontsource/jetbrains-mono
```

**Step 2: Add Google Fonts to index.html**

In `frontend/public/index.html`, add in `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Step 3: Create the dark analytics theme**

Create `frontend/src/theme.ts`:

```typescript
import { createTheme } from '@mui/material';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#3b82f6' },
        success: { main: '#22c55e' },
        error: { main: '#ef4444' },
        warning: { main: '#f59e0b' },
        background: {
            default: '#0a0a0f',
            paper: '#12131a',
        },
        text: {
            primary: '#e4e4e7',
            secondary: '#8b8b9e',
        },
        divider: '#2a2b3d',
    },
    typography: {
        fontFamily: '"Inter", system-ui, sans-serif',
        h3: { fontWeight: 700, fontSize: '1.5rem' },
        h4: { fontWeight: 600, fontSize: '1.25rem' },
        h6: { fontWeight: 500, fontSize: '0.875rem' },
        body2: { fontFamily: '"JetBrains Mono", monospace' },
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    border: '1px solid #2a2b3d',
                    borderRadius: 8,
                },
            },
        },
        MuiSkeleton: {
            styleOverrides: {
                root: {
                    backgroundColor: '#1a1b25',
                },
            },
        },
    },
});

export default theme;
```

**Step 4: Create YearContext**

Create `frontend/src/contexts/YearContext.tsx`:

```typescript
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface YearContextType {
    year: number;
    setYear: (year: number) => void;
}

const YearContext = createContext<YearContextType | undefined>(undefined);

export const YearProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [year, setYear] = useState(new Date().getFullYear());
    return (
        <YearContext.Provider value={{ year, setYear }}>
            {children}
        </YearContext.Provider>
    );
};

export const useYear = (): YearContextType => {
    const context = useContext(YearContext);
    if (!context) throw new Error('useYear must be used within YearProvider');
    return context;
};
```

**Step 5: Commit**

```bash
git add frontend/src/theme.ts frontend/src/contexts/YearContext.tsx frontend/public/index.html frontend/package.json
git commit -m "feat: add dark analytics theme, YearContext, and new dependencies"
```

---

## Task 4: Frontend — Layout Shell (Sidebar + Header + Router)

**Files:**
- Create: `frontend/src/components/layout/Sidebar.tsx`
- Create: `frontend/src/components/layout/Header.tsx`
- Create: `frontend/src/components/layout/AppLayout.tsx`
- Modify: `frontend/src/App.tsx` (replace with router + layout)

**Step 1: Create Sidebar**

Create `frontend/src/components/layout/Sidebar.tsx`:

```typescript
import React from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, useMediaQuery } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';

const NAV_ITEMS = [
    { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/calendar', label: 'Calendar', icon: <CalendarMonthIcon /> },
    { path: '/comparison', label: 'Comparison', icon: <CompareArrowsIcon /> },
    { path: '/standings', label: 'Standings', icon: <LeaderboardIcon /> },
];

const SIDEBAR_WIDTH = 220;
const SIDEBAR_COLLAPSED = 64;

const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const collapsed = useMediaQuery('(max-width:1024px)');

    return (
        <Box sx={{
            width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH,
            minHeight: '100vh',
            bgcolor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider',
            transition: 'width 200ms',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 1200,
        }}>
            <Box sx={{ p: 2, textAlign: 'center', borderBottom: 1, borderColor: 'divider' }}>
                <Box component="span" sx={{ fontWeight: 700, fontSize: collapsed ? '0.75rem' : '1.1rem', color: 'text.primary' }}>
                    {collapsed ? 'F1' : 'F1 Analyst'}
                </Box>
            </Box>
            <List>
                {NAV_ITEMS.map((item) => (
                    <ListItemButton
                        key={item.path}
                        selected={location.pathname === item.path}
                        onClick={() => navigate(item.path)}
                        sx={{
                            mx: 1,
                            borderRadius: 1,
                            mb: 0.5,
                            '&.Mui-selected': {
                                bgcolor: 'rgba(59, 130, 246, 0.12)',
                                color: 'primary.main',
                                '& .MuiListItemIcon-root': { color: 'primary.main' },
                            },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: 'text.secondary' }}>
                            {item.icon}
                        </ListItemIcon>
                        {!collapsed && <ListItemText primary={item.label} />}
                    </ListItemButton>
                ))}
            </List>
        </Box>
    );
};

export { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED };
export default Sidebar;
```

**Step 2: Create Header**

Create `frontend/src/components/layout/Header.tsx`:

```typescript
import React from 'react';
import { Box, TextField, MenuItem, Typography, useMediaQuery } from '@mui/material';
import { useYear } from '../../contexts/YearContext';

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

const Header: React.FC = () => {
    const { year, setYear } = useYear();
    const collapsed = useMediaQuery('(max-width:1024px)');

    return (
        <Box sx={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
        }}>
            <Typography variant="h6" color="text.secondary">
                Season Overview
            </Typography>
            <TextField
                select
                size="small"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                sx={{ minWidth: 100 }}
            >
                {YEARS.map((y) => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
            </TextField>
        </Box>
    );
};

export default Header;
```

**Step 3: Create AppLayout**

Create `frontend/src/components/layout/AppLayout.tsx`:

```typescript
import React from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar, { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED } from './Sidebar';
import Header from './Header';

const AppLayout: React.FC = () => {
    const collapsed = useMediaQuery('(max-width:1024px)');
    const marginLeft = collapsed ? `${SIDEBAR_COLLAPSED}px` : `${SIDEBAR_WIDTH}px`;

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <Sidebar />
            <Box sx={{ flex: 1, ml: marginLeft, transition: 'margin-left 200ms' }}>
                <Header />
                <Box sx={{ p: 3 }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default AppLayout;
```

**Step 4: Rewrite App.tsx with router**

Replace `frontend/src/App.tsx`:

```typescript
import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import theme from './theme';
import { YearProvider } from './contexts/YearContext';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import ComparisonPage from './pages/ComparisonPage';
import StandingsPage from './pages/StandingsPage';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <YearProvider>
                    <Routes>
                        <Route element={<AppLayout />}>
                            <Route path="/" element={<DashboardPage />} />
                            <Route path="/calendar" element={<CalendarPage />} />
                            <Route path="/comparison" element={<ComparisonPage />} />
                            <Route path="/standings" element={<StandingsPage />} />
                        </Route>
                    </Routes>
                </YearProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
```

**Step 5: Create placeholder pages**

Create `frontend/src/pages/DashboardPage.tsx`:
```typescript
import React from 'react';
import { Typography } from '@mui/material';
const DashboardPage: React.FC = () => <Typography variant="h3">Dashboard</Typography>;
export default DashboardPage;
```

Create `frontend/src/pages/CalendarPage.tsx`:
```typescript
import React from 'react';
import { Typography } from '@mui/material';
const CalendarPage: React.FC = () => <Typography variant="h3">Calendar</Typography>;
export default CalendarPage;
```

Create `frontend/src/pages/ComparisonPage.tsx`:
```typescript
import React from 'react';
import { Typography } from '@mui/material';
const ComparisonPage: React.FC = () => <Typography variant="h3">Comparison</Typography>;
export default ComparisonPage;
```

Create `frontend/src/pages/StandingsPage.tsx`:
```typescript
import React from 'react';
import { Typography } from '@mui/material';
const StandingsPage: React.FC = () => <Typography variant="h3">Standings</Typography>;
export default StandingsPage;
```

**Step 6: Verify it builds**

```bash
cd frontend && npm run build
```

**Step 7: Commit**

```bash
git add frontend/src/
git commit -m "feat: add layout shell with sidebar, header, router, and placeholder pages"
```

---

## Task 5: Frontend — API Service Layer (Replace OpenF1)

**Files:**
- Create: `frontend/src/services/api.ts`
- Delete: `frontend/src/services/openF1Api.ts`
- Modify: `frontend/src/types/f1.ts` (add new types)

**Step 1: Add new TypeScript types**

Replace `frontend/src/types/f1.ts` with all types matching the backend schemas (comparison responses, standings, dashboard overview, etc.). Include:

- `LapTimeEntry`, `ComparisonLapsResponse`
- `TelemetryPoint`, `DriverTelemetry`, `ComparisonTelemetryResponse`
- `SectorTime`, `ComparisonSectorsResponse`
- `Stint`, `DriverStrategy`, `ComparisonStrategyResponse`
- `PositionEntry`, `ComparisonPositionsResponse`
- `DriverStanding`, `StandingsResponse`
- `ConstructorStanding`, `ConstructorStandingsResponse`
- `NextRace`, `LastRaceResult`, `DashboardOverview`

Keep existing types that are still used (`ComparisonFormData`, `CalendarEvent`, `SessionInfo`, `GPSessionsResponse`, `YearDataResponse`).

**Step 2: Create centralized API service**

Create `frontend/src/services/api.ts`:

```typescript
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

async function fetchJSON<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

// Calendar
export const getYearData = (year: number) =>
    fetchJSON<YearDataResponse>(`${API_BASE}/calendar/year-data/${year}`);

export const getYearCalendar = (year: number) =>
    fetchJSON<YearCalendarResponse>(`${API_BASE}/calendar/year-calendar/${year}`);

export const getGPSessions = (year: number, gp: string) =>
    fetchJSON<GPSessionsResponse>(`${API_BASE}/calendar/gp-sessions/${year}/${encodeURIComponent(gp)}`);

// Comparison
export const getComparisonLaps = (params: ComparisonQueryParams) =>
    fetchJSON<ComparisonLapsResponse>(`${API_BASE}/comparison/laps?year=${params.year}&gp=${encodeURIComponent(params.gp)}&session=${encodeURIComponent(params.session)}&driver1=${params.driver1}&driver2=${params.driver2}`);

export const getComparisonTelemetry = (params: ComparisonQueryParams) =>
    fetchJSON<ComparisonTelemetryResponse>(`${API_BASE}/comparison/telemetry?year=${params.year}&gp=${encodeURIComponent(params.gp)}&session=${encodeURIComponent(params.session)}&driver1=${params.driver1}&driver2=${params.driver2}`);

export const getComparisonSectors = (params: ComparisonQueryParams) =>
    fetchJSON<ComparisonSectorsResponse>(`${API_BASE}/comparison/sectors?year=${params.year}&gp=${encodeURIComponent(params.gp)}&session=${encodeURIComponent(params.session)}&driver1=${params.driver1}&driver2=${params.driver2}`);

export const getComparisonStrategy = (params: ComparisonQueryParams) =>
    fetchJSON<ComparisonStrategyResponse>(`${API_BASE}/comparison/strategy?year=${params.year}&gp=${encodeURIComponent(params.gp)}&session=${encodeURIComponent(params.session)}&driver1=${params.driver1}&driver2=${params.driver2}`);

export const getComparisonPositions = (params: ComparisonQueryParams) =>
    fetchJSON<ComparisonPositionsResponse>(`${API_BASE}/comparison/positions?year=${params.year}&gp=${encodeURIComponent(params.gp)}&session=${encodeURIComponent(params.session)}&driver1=${params.driver1}&driver2=${params.driver2}`);

// AI Analysis (existing)
export const compareDrivers = async (data: CompareDriversRequest): Promise<string> => {
    const response = await fetch(`${API_BASE}/agent/compare-drivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    return result.analysis;
};

// Standings
export const getDriverStandings = (year: number) =>
    fetchJSON<StandingsResponse>(`${API_BASE}/standings/drivers/${year}`);

export const getConstructorStandings = (year: number) =>
    fetchJSON<ConstructorStandingsResponse>(`${API_BASE}/standings/constructors/${year}`);

// Dashboard
export const getDashboardOverview = (year: number) =>
    fetchJSON<DashboardOverview>(`${API_BASE}/dashboard/overview?year=${year}`);
```

(Import all types from `../types/f1` at the top.)

**Step 3: Delete openF1Api.ts**

```bash
rm frontend/src/services/openF1Api.ts
```

**Step 4: Commit**

```bash
git add frontend/src/services/ frontend/src/types/f1.ts
git commit -m "feat: centralized API service layer, remove direct OpenF1 calls"
```

---

## Task 6: Frontend — Dashboard Page

**Files:**
- Modify: `frontend/src/pages/DashboardPage.tsx`
- Create: `frontend/src/components/dashboard/NextRaceCard.tsx`
- Create: `frontend/src/components/dashboard/LastRaceCard.tsx`
- Create: `frontend/src/components/dashboard/StandingsChart.tsx`

**Step 1: Build NextRaceCard**

Shows event name, date, and a countdown. Receives `NextRace` as prop.

**Step 2: Build LastRaceCard**

Shows event name and top 5 table with position, driver, team (colored), points. Receives `LastRaceResult` as prop.

**Step 3: Build StandingsChart**

Horizontal bar chart (Recharts `BarChart` with `layout="vertical"`). Shows top 10 with team colors as bar fill. Reused for both driver and constructor standings. Props: `title: string`, `data: Array<{name: string, points: number, color: string}>`.

**Step 4: Wire up DashboardPage**

```typescript
// Fetch getDashboardOverview(year) on mount / year change
// Display 4 panels in grid: NextRaceCard, LastRaceCard, StandingsChart (drivers), StandingsChart (constructors)
// Each panel: independent loading state with Skeleton
```

**Step 5: Verify it renders**

```bash
cd frontend && npm start
```

Navigate to `/` and confirm all 4 panels render with skeletons then data.

**Step 6: Commit**

```bash
git add frontend/src/pages/DashboardPage.tsx frontend/src/components/dashboard/
git commit -m "feat: implement dashboard page with next race, last race, and standings charts"
```

---

## Task 7: Frontend — Comparison Page with Charts

This is the largest task. Build the comparison selectors and 6 chart panels.

**Files:**
- Modify: `frontend/src/pages/ComparisonPage.tsx`
- Create: `frontend/src/components/comparison/ComparisonSelectors.tsx`
- Create: `frontend/src/components/comparison/LapTimesChart.tsx`
- Create: `frontend/src/components/comparison/TelemetryChart.tsx`
- Create: `frontend/src/components/comparison/SectorTimesChart.tsx`
- Create: `frontend/src/components/comparison/TireStrategyChart.tsx`
- Create: `frontend/src/components/comparison/PositionHistoryChart.tsx`
- Create: `frontend/src/components/comparison/AIAnalysisPanel.tsx`
- Modify: `frontend/src/components/ComparisonResult.tsx` (move or reuse in AIAnalysisPanel)

**Step 1: Build ComparisonSelectors**

Optimized cascade: year from `useYear()`, GP + drivers from `getYearData(year)` on year change, sessions from `getGPSessions(year, gp)` on GP change. Two driver dropdowns. Submit button triggers parallel data fetch.

**Step 2: Build each chart component**

Each chart component:
- Receives its typed response data as prop (or `null` while loading)
- Shows `<Skeleton>` when data is null
- Shows inline error with retry button if fetch failed
- Uses Recharts with dark theme colors (grid lines `#2a2b3d`, text `#8b8b9e`, tooltips `#1a1b25`)

Key chart implementations:
- **LapTimesChart**: `LineChart` with two `Line` elements (one per driver), `XAxis` = lap number, `YAxis` = time in seconds, custom `Tooltip` showing time + delta
- **TelemetryChart**: `LineChart` with toggle buttons (Speed / Throttle / Brake). Overlays two drivers' fastest lap telemetry on `Distance` axis
- **SectorTimesChart**: `BarChart` with `grouped` bars, 3 groups (S1/S2/S3), color-coded green/red for faster/slower
- **TireStrategyChart**: Custom component using Recharts `BarChart` horizontal layout. Each stint as a stacked segment colored by compound
- **PositionHistoryChart**: `LineChart`, Y-axis reversed (`domain={['dataMax', 'dataMin']}`), only rendered when session type is "Race"
- **AIAnalysisPanel**: Wraps existing `ComparisonResult` with an "Analyze" button that calls `compareDrivers()`

**Step 3: Wire ComparisonPage**

```typescript
// On submit: fire 5 fetches independently (not Promise.all)
// Each chart manages: { data: T | null, loading: boolean, error: string | null }
// Grid layout: 2 columns on desktop (>768px), 1 column on mobile
```

**Step 4: Verify with backend running**

```bash
# Terminal 1
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2
cd frontend && npm start
```

Navigate to `/comparison`, select year/GP/session/drivers, submit. All 5 chart panels should load independently.

**Step 5: Commit**

```bash
git add frontend/src/pages/ComparisonPage.tsx frontend/src/components/comparison/
git commit -m "feat: implement comparison page with 6 interactive chart panels"
```

---

## Task 8: Frontend — Calendar Page

**Files:**
- Modify: `frontend/src/pages/CalendarPage.tsx`
- Create: `frontend/src/components/calendar/GPCard.tsx`

**Step 1: Build GPCard**

Card component showing GP name, date, status badge (completed=success color, upcoming=primary+accent border, future=secondary). Click toggles accordion to show sessions list.

**Step 2: Wire CalendarPage**

Fetch `getYearCalendar(year)` on year change. Determine status by comparing event dates to `now`. Render vertical list of `GPCard` components. Highlight upcoming GP.

**Step 3: Commit**

```bash
git add frontend/src/pages/CalendarPage.tsx frontend/src/components/calendar/
git commit -m "feat: implement calendar page with expandable GP cards"
```

---

## Task 9: Frontend — Standings Page

**Files:**
- Modify: `frontend/src/pages/StandingsPage.tsx`

**Step 1: Build StandingsPage**

Two tabs (MUI `Tabs`). Each tab: data-dense `Table` with position, driver/team name, team color dot, points, and an inline horizontal bar (proportional to max points). Fetch `getDriverStandings(year)` and `getConstructorStandings(year)` on year change.

**Step 2: Commit**

```bash
git add frontend/src/pages/StandingsPage.tsx
git commit -m "feat: implement standings page with driver and constructor tabs"
```

---

## Task 10: Cleanup & Polish

**Files:**
- Delete: `frontend/src/components/Navbar.tsx` (replaced by Sidebar)
- Delete: `frontend/src/components/DriverComparisonForm.tsx` (replaced by ComparisonPage)
- Verify: `frontend/src/components/ComparisonResult.tsx` is either reused or deleted
- Modify: `frontend/src/index.css` (dark background base)

**Step 1: Remove dead files**

```bash
rm frontend/src/components/Navbar.tsx frontend/src/components/DriverComparisonForm.tsx
```

**Step 2: Update index.css**

Set `body { background-color: #0a0a0f; margin: 0; }` and remove any white-theme defaults.

**Step 3: Full build test**

```bash
cd frontend && npm run build
```

Expected: Build succeeds with no errors.

**Step 4: Run backend tests**

```bash
pytest backend/tests/ -v
```

Expected: All tests pass.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove old components, polish dark theme base styles"
```

---

## Execution Order Summary

| Task | Depends On | Description |
|------|-----------|-------------|
| 1 | — | Backend comparison endpoints |
| 2 | — | Backend standings + dashboard endpoints |
| 3 | — | Frontend dependencies + theme + YearContext |
| 4 | 3 | Frontend layout shell (sidebar, header, router) |
| 5 | 1, 2 | Frontend API service layer |
| 6 | 4, 5 | Dashboard page |
| 7 | 4, 5 | Comparison page with charts |
| 8 | 4, 5 | Calendar page |
| 9 | 4, 5 | Standings page |
| 10 | 6, 7, 8, 9 | Cleanup + polish |

Tasks 1, 2, 3 can run in parallel. Tasks 6, 7, 8, 9 can run in parallel after their dependencies.
