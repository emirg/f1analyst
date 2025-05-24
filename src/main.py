import fastf1
import fastf1.plotting
import matplotlib.pyplot as plt
import seaborn as sns

# Enable the cache
fastf1.Cache.enable_cache('data/cache')

# Set the plotting style
fastf1.plotting.setup_mpl()

def get_session_data(year, gp, session):
    """Fetch session data for a specific Grand Prix"""
    session = fastf1.get_session(year, gp, session)
    session.load()
    return session

def plot_lap_times(session):
    """Plot lap times for all drivers"""
    plt.figure(figsize=(15, 5))
    
    for driver in session.drivers:
        driver_laps = session.laps.pick_drivers(driver)
        plt.plot(driver_laps['LapNumber'], driver_laps['LapTime'], 
                label=session.get_driver(driver)['Abbreviation'])
    
    plt.xlabel('Lap Number')
    plt.ylabel('Lap Time')
    plt.title(f'Lap Times Comparison - {session.event["EventName"]}')
    plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.tight_layout()
    plt.savefig('data/lap_times.png')
    plt.close()

def plot_speed_comparison(session, driver1, driver2, lap_number):
    """Compare speed traces for two drivers on a specific lap"""
    # Get the lap data
    lap1 = session.laps.pick_drivers(driver1).pick_laps(lap_number)
    lap2 = session.laps.pick_drivers(driver2).pick_laps(lap_number)
    
    # Get telemetry data
    tel1 = lap1.get_telemetry()
    tel2 = lap2.get_telemetry()
    
    # Plot speed comparison
    plt.figure(figsize=(15, 5))
    plt.plot(tel1['Distance'], tel1['Speed'], label=session.get_driver(driver1)['Abbreviation'])
    plt.plot(tel2['Distance'], tel2['Speed'], label=session.get_driver(driver2)['Abbreviation'])
    
    plt.xlabel('Distance (m)')
    plt.ylabel('Speed (km/h)')
    plt.title(f'Speed Comparison - Lap {lap_number}')
    plt.legend()
    plt.tight_layout()
    plt.savefig('data/speed_comparison.png')
    plt.close()

def main():
    session = get_session_data(2025, 'Monaco', 'FP2')
    
    # Plot lap times
    plot_lap_times(session)
    
    # Plot speed comparison for two drivers on lap 1
    plot_speed_comparison(session, 'COL', 'GAS', 1)

if __name__ == "__main__":
    main() 