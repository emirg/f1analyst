import {
    YearDataResponse,
    YearCalendarResponse,
    GPSessionsResponse,
    SessionDriversResponse,
    ComparisonQueryParams,
    ComparisonLapsResponse,
    ComparisonTelemetryResponse,
    ComparisonSectorsResponse,
    ComparisonStrategyResponse,
    ComparisonPositionsResponse,
    CompareDriversRequest,
    StandingsResponse,
    ConstructorStandingsResponse,
    DashboardOverview,
} from '../types/f1';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

async function fetchJSON<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API error ${response.status}: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
}

// --- Calendar ---

export function getYearData(year: number): Promise<YearDataResponse> {
    return fetchJSON<YearDataResponse>(`${API_BASE}/calendar/year-data/${encodeURIComponent(year)}`);
}

export function getYearCalendar(year: number): Promise<YearCalendarResponse> {
    return fetchJSON<YearCalendarResponse>(`${API_BASE}/calendar/year-calendar/${encodeURIComponent(year)}`);
}

export function getGPSessions(year: number, gp: string): Promise<GPSessionsResponse> {
    return fetchJSON<GPSessionsResponse>(
        `${API_BASE}/calendar/gp-sessions/${encodeURIComponent(year)}/${encodeURIComponent(gp)}`
    );
}

export function getSessionDrivers(year: number, gp: string, session: string): Promise<SessionDriversResponse> {
    return fetchJSON<SessionDriversResponse>(
        `${API_BASE}/calendar/session-drivers/${encodeURIComponent(year)}/${encodeURIComponent(gp)}/${encodeURIComponent(session)}`
    );
}

// --- Comparison ---

function comparisonUrl(path: string, params: ComparisonQueryParams): string {
    const { year, gp, session, driver1, driver2 } = params;
    return (
        `${API_BASE}/comparison/${path}` +
        `?year=${encodeURIComponent(year)}` +
        `&gp=${encodeURIComponent(gp)}` +
        `&session=${encodeURIComponent(session)}` +
        `&driver1=${encodeURIComponent(driver1)}` +
        `&driver2=${encodeURIComponent(driver2)}`
    );
}

export function getComparisonLaps(params: ComparisonQueryParams): Promise<ComparisonLapsResponse> {
    return fetchJSON<ComparisonLapsResponse>(comparisonUrl('laps', params));
}

export function getComparisonTelemetry(params: ComparisonQueryParams): Promise<ComparisonTelemetryResponse> {
    return fetchJSON<ComparisonTelemetryResponse>(comparisonUrl('telemetry', params));
}

export function getComparisonSectors(params: ComparisonQueryParams): Promise<ComparisonSectorsResponse> {
    return fetchJSON<ComparisonSectorsResponse>(comparisonUrl('sectors', params));
}

export function getComparisonStrategy(params: ComparisonQueryParams): Promise<ComparisonStrategyResponse> {
    return fetchJSON<ComparisonStrategyResponse>(comparisonUrl('strategy', params));
}

export function getComparisonPositions(params: ComparisonQueryParams): Promise<ComparisonPositionsResponse> {
    return fetchJSON<ComparisonPositionsResponse>(comparisonUrl('positions', params));
}

// --- AI Analysis ---

export async function compareDrivers(data: CompareDriversRequest): Promise<string> {
    const response = await fetch(`${API_BASE}/agent/compare-drivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error(`API error ${response.status}: ${response.statusText}`);
    }
    return response.json();
}

// --- Standings ---

export function getDriverStandings(year: number): Promise<StandingsResponse> {
    return fetchJSON<StandingsResponse>(`${API_BASE}/standings/drivers/${encodeURIComponent(year)}`);
}

export function getConstructorStandings(year: number): Promise<ConstructorStandingsResponse> {
    return fetchJSON<ConstructorStandingsResponse>(
        `${API_BASE}/standings/constructors/${encodeURIComponent(year)}`
    );
}

// --- Dashboard ---

export function getDashboardOverview(year: number): Promise<DashboardOverview> {
    return fetchJSON<DashboardOverview>(`${API_BASE}/dashboard/overview?year=${encodeURIComponent(year)}`);
}
