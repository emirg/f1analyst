import fastf1

class DriverService:
    def get_drivers_from_first_race(self, year: int):
        """Get list of drivers and their names from the first race of the year"""
        session = fastf1.get_session(year, 1, 'R')
        session.load()
        
        drivers = []
        driver_names = []
        
        for driver in session.drivers:
            driver_info = session.get_driver(driver)
            drivers.append(driver_info['Abbreviation'])
            driver_names.append(f"{driver_info['FirstName']} {driver_info['LastName']}")
        
        return drivers, driver_names

    def get_drivers_abbreviations_from_session(self, session):
        """Get list of driver abbreviations from a session"""
        return [session.get_driver(driver)['Abbreviation'] for driver in session.drivers] 