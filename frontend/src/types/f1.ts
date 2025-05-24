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
    grandPrix: string;
    session: string;
    driver1: string;
    driver2: string;
} 