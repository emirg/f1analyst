// --- Existing types (retained) ---

export interface DriverComparison {
    driver1: {
        name: string;
        avg_lap: string;
        best_lap: string;
        consistency: string;
        fuel_data?: {
            start_fuel: number;
            end_fuel: number;
            fuel_usage: number;
        } | null;
    };
    driver2: {
        name: string;
        avg_lap: string;
        best_lap: string;
        consistency: string;
        fuel_data?: {
            start_fuel: number;
            end_fuel: number;
            fuel_usage: number;
        } | null;
    };
}

export interface ComparisonFormData {
    year: number;
    grand_prix: string;
    session: string;
    driver1: string;
    driver2: string;
}

export interface YearDataResponse {
    grand_prix: string[];
    sessions: string[];
    drivers: string[];
    driver_names: string[];
}

export interface CalendarEvent {
    round_number: number;
    event_name: string;
    event_format: string;
    meeting_key: string;
}

export interface YearCalendarResponse {
    year: number;
    total_rounds: number;
    calendar: CalendarEvent[];
}

export interface SessionInfo {
    type: string;
    date: string;
    session_key: string;
}

export interface GPSessionsResponse {
    year: number;
    grand_prix: string;
    event_format: string;
    sessions: SessionInfo[];
}

export interface SessionDriversResponse {
    grand_prix: string;
    year: number;
    drivers: string[];
}

// --- Comparison types ---

export interface LapTimeEntry {
    lap_number: number;
    driver: string;
    time_seconds: number;
    compound?: string;
}

export interface ComparisonLapsResponse {
    driver1: string;
    driver2: string;
    laps: LapTimeEntry[];
}

export interface TelemetryPoint {
    distance: number;
    speed: number;
    throttle: number;
    brake: boolean;
}

export interface DriverTelemetry {
    driver: string;
    team_color: string;
    data: TelemetryPoint[];
}

export interface ComparisonTelemetryResponse {
    driver1: DriverTelemetry;
    driver2: DriverTelemetry;
}

export interface SectorTime {
    driver: string;
    sector1: number;
    sector2: number;
    sector3: number;
}

export interface ComparisonSectorsResponse {
    driver1: SectorTime;
    driver2: SectorTime;
}

export interface Stint {
    stint_number: number;
    compound: string;
    lap_start: number;
    lap_end: number;
    laps: number;
}

export interface DriverStrategy {
    driver: string;
    stints: Stint[];
}

export interface ComparisonStrategyResponse {
    driver1: DriverStrategy;
    driver2: DriverStrategy;
}

export interface PositionEntry {
    lap_number: number;
    driver: string;
    position: number;
}

export interface ComparisonPositionsResponse {
    driver1: string;
    driver2: string;
    positions: PositionEntry[];
}

export interface ComparisonQueryParams {
    year: number;
    gp: string;
    session: string;
    driver1: string;
    driver2: string;
}

// --- Standings types ---

export interface DriverStanding {
    position: number;
    driver: string;
    driver_abbreviation: string;
    team: string;
    team_color: string;
    points: number;
}

export interface StandingsResponse {
    year: number;
    standings: DriverStanding[];
}

export interface ConstructorStanding {
    position: number;
    team: string;
    team_color: string;
    points: number;
}

export interface ConstructorStandingsResponse {
    year: number;
    standings: ConstructorStanding[];
}

// --- Dashboard types ---

export interface NextRace {
    event_name: string;
    round_number: number;
    date: string;
    country?: string;
}

export interface LastRaceResult {
    event_name: string;
    top5: DriverStanding[];
}

export interface DashboardOverview {
    year: number;
    next_race?: NextRace;
    last_race?: LastRaceResult;
    driver_standings_top10: DriverStanding[];
    constructor_standings_top10: ConstructorStanding[];
}

// --- Request type for AI analysis ---

export interface CompareDriversRequest {
    year: number;
    grand_prix: string;
    session: string;
    driver1: string;
    driver2: string;
}
