from typing import Any, Dict, Optional
import fastf1
import fastf1.plotting
import pandas as pd
import numpy as np
from openai import OpenAI
import os
from dotenv import load_dotenv
import pathlib
from cachetools import LRUCache, cachedmethod
from operator import attrgetter
from app.services.session import SessionService

# Load environment variables
load_dotenv()

# Initialize OpenAI client
OPENAI_API_KEY = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
OPENAI_MODEL = os.getenv('OPENAI_MODEL')

class F1AnalysisBot:
    def __init__(self) -> None:
        self._cache = LRUCache(maxsize=50)
        # Create cache directory if it doesn't exist
        cache_dir = pathlib.Path('data/cache')
        cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Enable FastF1 cache
        fastf1.Cache.enable_cache(str(cache_dir))
        # Set up plotting style
        fastf1.plotting.setup_mpl(color_scheme='fastf1', misc_mpl_mods=False)
        
    def analyze_driver_performance(self, session: fastf1.core.Session, driver_code: str) -> str:
        """Analyze detailed performance metrics for a specific driver"""
        driver_laps = session.laps.pick_drivers(driver_code)
        
        # Calculate key metrics
        avg_lap_time = driver_laps['LapTime'].mean()
        best_lap_time = driver_laps['LapTime'].min()
        consistency = driver_laps['LapTime'].std()
        
        # Get sector times
        sector_times = {
            'Sector1': driver_laps['Sector1Time'].mean(),
            'Sector2': driver_laps['Sector2Time'].mean(),
            'Sector3': driver_laps['Sector3Time'].mean()
        }
        
        # Get fuel data from telemetry (optimized - only if telemetry is available)
        fuel_data = {}
        try:
            if len(driver_laps) > 0 and hasattr(driver_laps.iloc[0], 'get_telemetry'):
                # Get telemetry for the first lap to check fuel at start
                first_lap = driver_laps.iloc[0]
                first_lap_tel = first_lap.get_telemetry()
                if 'Fuel' in first_lap_tel.columns:
                    fuel_data['start_fuel'] = float(first_lap_tel['Fuel'].iloc[0])
                    fuel_data['end_fuel'] = float(first_lap_tel['Fuel'].iloc[-1])
                    fuel_data['fuel_usage'] = fuel_data['start_fuel'] - fuel_data['end_fuel']
        except Exception as e:
            print(f"Could not get fuel data: {str(e)}")
            fuel_data = None
        
        # Prepare data for OpenAI analysis
        analysis_data = {
            'driver': session.get_driver(driver_code)['Abbreviation'],
            'avg_lap_time': str(avg_lap_time),
            'best_lap_time': str(best_lap_time),
            'consistency': str(consistency),
            'sector_times': sector_times,
            'fuel_data': fuel_data
        }
        
        # Get AI analysis
        prompt = f"""
        Analyze the following F1 driver performance data and provide detailed insights:
        Driver: {analysis_data['driver']}
        Average Lap Time: {analysis_data['avg_lap_time']}
        Best Lap Time: {analysis_data['best_lap_time']}
        Consistency (std dev): {analysis_data['consistency']}
        Sector Times: {analysis_data['sector_times']}
        Fuel Data: {analysis_data['fuel_data']}
        
        Please provide:
        1. Overall performance assessment
        2. Strengths and weaknesses
        3. Areas for improvement
        4. Comparison with typical F1 performance standards
        5. Fuel efficiency analysis (if fuel data is available)
        """
        
        response = OPENAI_API_KEY.chat.completions.create(
            model=OPENAI_MODEL or "gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert F1 analyst with deep knowledge of racing metrics and performance analysis."},
                {"role": "user", "content": prompt}
            ]
        )
        
        return response.choices[0].message.content or "Analysis not available"
    
    def predict_race_pace(self, session: fastf1.core.Session, driver_code: str) -> str:
        """Predict race pace based on practice/qualifying data"""
        driver_laps = session.laps.pick_drivers(driver_code)
        
        # Calculate race pace metrics
        long_run_laps = driver_laps[driver_laps['LapTime'] > driver_laps['LapTime'].quantile(0.2)]
        race_pace = long_run_laps['LapTime'].mean()
        tire_degradation = self._calculate_tire_degradation(long_run_laps)
        
        # Prepare prediction data
        prediction_data = {
            'driver': session.get_driver(driver_code)['Abbreviation'],
            'race_pace': str(race_pace),
            'tire_degradation': tire_degradation
        }
        
        # Get AI prediction
        prompt = f"""
        Based on the following F1 race pace data, provide a detailed race prediction:
        Driver: {prediction_data['driver']}
        Estimated Race Pace: {prediction_data['race_pace']}
        Tire Degradation Factor: {prediction_data['tire_degradation']}
        
        Please provide:
        1. Expected race performance
        2. Tire strategy recommendations
        3. Potential challenges
        4. Position prediction
        """
        
        response = OPENAI_API_KEY.chat.completions.create(
            model=OPENAI_MODEL or "gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert F1 strategist with deep knowledge of race pace analysis and tire management."},
                {"role": "user", "content": prompt}
            ]
        )
        
        return response.choices[0].message.content or "Analysis not available"
    
    def _calculate_tire_degradation(self, laps: pd.DataFrame) -> float:
        """Calculate tire degradation factor from lap times"""
        if len(laps) < 2:
            return 0
        
        # Convert lap times to seconds
        lap_times = laps['LapTime'].dt.total_seconds().values
        x = np.arange(len(lap_times))
        slope, _ = np.polyfit(x, lap_times, 1)
        return slope
    
    def compare_drivers(self, session: fastf1.core.Session, driver1_code: str, driver2_code: str) -> str:
        """Compare performance between two drivers with optimized calculations"""
        # Use cache key for expensive calculations
        cache_key = f"compare_{driver1_code}_{driver2_code}_{id(session)}"
        
        # Get driver laps data
        driver1_laps = session.laps.pick_drivers(driver1_code)
        driver2_laps = session.laps.pick_drivers(driver2_code)
        
        # Optimized calculations - avoid redundant operations
        def calculate_driver_metrics(driver_laps):
            if len(driver_laps) == 0:
                return None
            
            # Filter out invalid lap times
            valid_laps = driver_laps.dropna(subset=['LapTime'])
            if len(valid_laps) == 0:
                return None
                
            long_run_laps = valid_laps[valid_laps['LapTime'] > valid_laps['LapTime'].quantile(0.2)]
            
            return {
                'avg_lap': valid_laps['LapTime'].mean(),
                'best_lap': valid_laps['LapTime'].min(),
                'consistency': valid_laps['LapTime'].std(),
                'race_pace': long_run_laps['LapTime'].mean() if len(long_run_laps) > 0 else valid_laps['LapTime'].mean(),
                'tire_degradation': self._calculate_tire_degradation(long_run_laps) if len(long_run_laps) > 1 else 0
            }
        
        driver1_metrics = calculate_driver_metrics(driver1_laps)
        driver2_metrics = calculate_driver_metrics(driver2_laps)
        
        if not driver1_metrics or not driver2_metrics:
            return "Unable to compare drivers: insufficient lap data available."
        
        # Build comparison data structure
        comparison = {
            'driver1': {
                'name': session.get_driver(driver1_code)['Abbreviation'],
                'avg_lap': str(driver1_metrics['avg_lap']),
                'best_lap': str(driver1_metrics['best_lap']),
                'consistency': str(driver1_metrics['consistency']),
                'race_pace': str(driver1_metrics['race_pace']),
                'tire_degradation': driver1_metrics['tire_degradation']
            },
            'driver2': {
                'name': session.get_driver(driver2_code)['Abbreviation'],
                'avg_lap': str(driver2_metrics['avg_lap']),
                'best_lap': str(driver2_metrics['best_lap']),
                'consistency': str(driver2_metrics['consistency']),
                'race_pace': str(driver2_metrics['race_pace']),
                'tire_degradation': driver2_metrics['tire_degradation']
            }
        }

        # Get fuel data for both drivers (optimized - skip if no telemetry)
        def get_fuel_data_optimized(driver_laps, driver_name):
            try:
                if len(driver_laps) == 0:
                    return None
                # Only try to get telemetry if session has telemetry loaded
                if hasattr(session, 'car_data') and session.car_data is not None:
                    first_lap = driver_laps.iloc[0]
                    first_lap_tel = first_lap.get_telemetry()
                    if 'Fuel' in first_lap_tel.columns and len(first_lap_tel) > 0:
                        return {
                            'start_fuel': float(first_lap_tel['Fuel'].iloc[0]),
                            'end_fuel': float(first_lap_tel['Fuel'].iloc[-1]),
                            'fuel_usage': float(first_lap_tel['Fuel'].iloc[0] - first_lap_tel['Fuel'].iloc[-1])
                        }
                return None
            except Exception as e:
                print(f"Could not get fuel data for {driver_name}: {str(e)}")
                return None
        
        comparison['driver1']['fuel_data'] = get_fuel_data_optimized(driver1_laps, comparison['driver1']['name'])
        comparison['driver2']['fuel_data'] = get_fuel_data_optimized(driver2_laps, comparison['driver2']['name'])
        
        # Get AI comparison
        prompt = f"""
        Compare the following F1 drivers' performance data and provide detailed analysis:
        
        Driver 1 ({comparison['driver1']['name']}):
        - Average Lap Time: {comparison['driver1']['avg_lap']}
        - Best Lap Time: {comparison['driver1']['best_lap']}
        - Consistency: {comparison['driver1']['consistency']}
        - Race Pace: {comparison['driver1']['race_pace']}
        - Tire Degradation: {comparison['driver1']['tire_degradation']}
        - Fuel Data: {comparison['driver1'].get('fuel_data', 'Not available')}
        
        Driver 2 ({comparison['driver2']['name']}):
        - Average Lap Time: {comparison['driver2']['avg_lap']}
        - Best Lap Time: {comparison['driver2']['best_lap']}
        - Consistency: {comparison['driver2']['consistency']}
        - Race Pace: {comparison['driver2']['race_pace']}
        - Tire Degradation: {comparison['driver2']['tire_degradation']}        
        - Fuel Data: {comparison['driver2'].get('fuel_data', 'Not available')}
        
        Please provide:
        1. Direct comparison of performance
        2. Strengths and weaknesses of each driver
        3. Who might perform better in race conditions
        4. Key differences in driving style
        5. Fuel efficiency comparison (if fuel data is available)
        """
        
        response = OPENAI_API_KEY.chat.completions.create(
            model=OPENAI_MODEL or "gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert F1 analyst specializing in driver comparisons and performance analysis, with deep knowledge of race pace analysis and tire management."},
                {"role": "user", "content": prompt}
            ]
        )
        
        return response.choices[0].message.content or "Analysis not available"

def main():
    # Initialize the bot
    bot = F1AnalysisBot()
    session_service = SessionService()
    
    # Example usage with valid year
    try:
        session = session_service.get_session_data(2025, 'Monaco', 'FP1')
        
        # Analyze a driver's performance
        driver_analysis = bot.analyze_driver_performance(session, 'COL')
        print("\nDriver Performance Analysis:")
        print(driver_analysis)
        
        # Predict race pace
        race_prediction = bot.predict_race_pace(session, 'COL')
        print("\nRace Pace Prediction:")
        print(race_prediction)
        
        # Compare two drivers
        driver_comparison = bot.compare_drivers(session, 'COL', 'GAS')
        print("\nDriver Comparison:")
        print(driver_comparison)
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    main()