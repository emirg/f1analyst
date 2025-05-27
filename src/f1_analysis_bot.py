import fastf1
import fastf1.plotting
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from openai import OpenAI
import os
from dotenv import load_dotenv
import pathlib
from cachetools import LRUCache, cachedmethod
from operator import attrgetter

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
openai_model = os.getenv('OPENAI_MODEL')
cache = LRUCache(maxsize=50)

class F1AnalysisBot:
    def __init__(self):
        self._cache = LRUCache(maxsize=50)
        # Create cache directory if it doesn't exist
        cache_dir = pathlib.Path('data/cache')
        cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Enable FastF1 cache
        fastf1.Cache.enable_cache(str(cache_dir))
        # Set up plotting style
        fastf1.plotting.setup_mpl(color_scheme='fastf1', misc_mpl_mods=False)
        
    @cachedmethod(attrgetter('_cache'))
    def get_session_data(self, year, gp, session):
        """Fetch session data for a specific Grand Prix"""
        try:
            session = fastf1.get_session(year, gp, session)
            session.load()
            return session
        except Exception as e:
            print(f"Error loading session data: {str(e)}")
            print("Please ensure you're using a valid year, Grand Prix name, and session type.")
            print("Example: year=2025, gp='Monaco', session='FP1'")
            raise
    
    def analyze_driver_performance(self, session, driver_code):
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
        
        # Get fuel data from telemetry
        fuel_data = {}
        try:
            # Get telemetry for the first lap to check fuel at start
            first_lap = driver_laps.iloc[0]
            first_lap_tel = first_lap.get_telemetry()
            if 'Fuel' in first_lap_tel.columns:
                fuel_data['start_fuel'] = first_lap_tel['Fuel'].iloc[0]
                fuel_data['end_fuel'] = first_lap_tel['Fuel'].iloc[-1]
                fuel_data['fuel_usage'] = fuel_data['start_fuel'] - fuel_data['end_fuel']
        except Exception as e:
            print(f"Could not get fuel data: {str(e)}")
        
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
        
        response = client.chat.completions.create(
            model=openai_model,
            messages=[
                {"role": "system", "content": "You are an expert F1 analyst with deep knowledge of racing metrics and performance analysis."},
                {"role": "user", "content": prompt}
            ]
        )
        
        return response.choices[0].message.content
    
    def predict_race_pace(self, session, driver_code):
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
        
        response = client.chat.completions.create(
            model=openai_model,
            messages=[
                {"role": "system", "content": "You are an expert F1 strategist with deep knowledge of race pace analysis and tire management."},
                {"role": "user", "content": prompt}
            ]
        )
        
        return response.choices[0].message.content
    
    def _calculate_tire_degradation(self, laps):
        """Calculate tire degradation factor from lap times"""
        if len(laps) < 2:
            return 0
        
        # Convert lap times to seconds
        lap_times = laps['LapTime'].dt.total_seconds().values
        x = np.arange(len(lap_times))
        slope, _ = np.polyfit(x, lap_times, 1)
        return slope
    
    def compare_drivers(self, session, driver1_code, driver2_code):
        """Compare performance between two drivers"""
        driver1_laps = session.laps.pick_drivers(driver1_code)
        driver2_laps = session.laps.pick_drivers(driver2_code)
        
        # Calculate comparison metrics
        comparison = {
            'driver1': {
                'name': session.get_driver(driver1_code)['Abbreviation'],
                'avg_lap': str(driver1_laps['LapTime'].mean()),
                'best_lap': str(driver1_laps['LapTime'].min()),
                'consistency': str(driver1_laps['LapTime'].std())
            },
            'driver2': {
                'name': session.get_driver(driver2_code)['Abbreviation'],
                'avg_lap': str(driver2_laps['LapTime'].mean()),
                'best_lap': str(driver2_laps['LapTime'].min()),
                'consistency': str(driver2_laps['LapTime'].std())
            }
        }

        # Get fuel data for both drivers
        for driver_num, driver_laps in [('driver1', driver1_laps), ('driver2', driver2_laps)]:
            try:
                first_lap = driver_laps.iloc[0]
                first_lap_tel = first_lap.get_telemetry()
                if 'Fuel' in first_lap_tel.columns:
                    comparison[driver_num]['fuel_data'] = {
                        'start_fuel': first_lap_tel['Fuel'].iloc[0],
                        'end_fuel': first_lap_tel['Fuel'].iloc[-1],
                        'fuel_usage': first_lap_tel['Fuel'].iloc[0] - first_lap_tel['Fuel'].iloc[-1]
                    }
            except Exception as e:
                print(f"Could not get fuel data for {comparison[driver_num]['name']}: {str(e)}")
                comparison[driver_num]['fuel_data'] = None
        
        # Get AI comparison
        prompt = f"""
        Compare the following F1 drivers' performance data and provide detailed analysis:
        
        Driver 1 ({comparison['driver1']['name']}):
        - Average Lap Time: {comparison['driver1']['avg_lap']}
        - Best Lap Time: {comparison['driver1']['best_lap']}
        - Consistency: {comparison['driver1']['consistency']}
        - Fuel Data: {comparison['driver1'].get('fuel_data', 'Not available')}
        
        Driver 2 ({comparison['driver2']['name']}):
        - Average Lap Time: {comparison['driver2']['avg_lap']}
        - Best Lap Time: {comparison['driver2']['best_lap']}
        - Consistency: {comparison['driver2']['consistency']}
        - Fuel Data: {comparison['driver2'].get('fuel_data', 'Not available')}
        
        Please provide:
        1. Direct comparison of performance
        2. Strengths and weaknesses of each driver
        3. Who might perform better in race conditions
        4. Key differences in driving style
        5. Fuel efficiency comparison (if fuel data is available)
        """
        
        response = client.chat.completions.create(
            model=openai_model,
            messages=[
                {"role": "system", "content": "You are an expert F1 analyst specializing in driver comparisons and performance analysis."},
                {"role": "user", "content": prompt}
            ]
        )
        
        return response.choices[0].message.content

def main():
    # Initialize the bot
    bot = F1AnalysisBot()
    
    # Example usage with valid year
    try:
        session = bot.get_session_data(2025, 'Monaco', 'FP1')
        
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