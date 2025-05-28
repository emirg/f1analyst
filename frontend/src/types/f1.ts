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
}

export interface YearCalendarResponse {
    year: number;
    total_rounds: number;
    calendar: CalendarEvent[];
}

export interface SessionInfo {
    type: string;
    date: string;
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