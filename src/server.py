from flask import Flask, request, jsonify
from flask_cors import CORS
from f1_analysis_bot import F1AnalysisBot
import fastf1
import pandas as pd
import os
from utils import load_dummy_data

app = Flask(__name__)
CORS(app)

USE_DUMMY_DATA = os.getenv('USE_DUMMY_DATA', 'true').lower() == 'true'
bot = None if USE_DUMMY_DATA else F1AnalysisBot()

@app.route('/compare-drivers', methods=['POST'])
def compare_drivers():
    try:
        if USE_DUMMY_DATA:
            dummy_data = load_dummy_data()
            if "error" in dummy_data:
                return jsonify(dummy_data), 500
            
            return jsonify({
                'analysis': dummy_data['analysis']
            })

        # If USE_DUMMY_DATA is false then it will use the bot that connects to OpenAI
        data = request.json
        session = bot.get_session_data(
            int(data['year']),
            data['grandPrix'],
            data['session']
        )
        
        analysis = bot.compare_drivers(
            session,
            data['driver1'],
            data['driver2']
        )

        return jsonify({
            'analysis': analysis
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400


def get_drivers_from_first_race(year):
    try:
        # Get calendar
        schedule = fastf1.get_event_schedule(year)

        for _, event in schedule.iterrows():
            try:
                session = fastf1.get_session(year, event['RoundNumber'], 'R')
                session.load()

                if session.results is not None:
                    drivers = session.results['Abbreviation'].unique().tolist()
                    names = session.results['FullName'].unique().tolist()
                    return drivers, names
            except Exception as e:
                continue  # If a race fails, try the next one

        return [], []
    except Exception as e:
        return [], []


@app.route('/get-year-data', methods=['GET'])
def get_year_data():
    year = request.args.get('year', type=int)
    if not year:
        return jsonify({'error': 'Year is required'}), 400
    
    try:
        drivers, driver_names = get_drivers_from_first_race(year)
        schedule = fastf1.get_event_schedule(year)

        return jsonify({
            'grandPrix': schedule['EventName'].tolist(),
            'sessions': ['FP1', 'FP2', 'FP3', 'Q1', 'Q2', 'Q3', 'R'],
            'drivers': drivers,
            'driverNames': driver_names
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get-year-calendar', methods=['GET'])
def get_year_calendar():
    year = request.args.get('year', type=int)
    if not year:
        return jsonify({'error': 'Year is required'}), 400
    
    try:
        schedule = fastf1.get_event_schedule(year)
        
        # Convert DataFrame to a list of dictionaries with relevant information
        calendar = []
        for _, event in schedule.iterrows():
            calendar.append({
                'roundNumber': int(event['RoundNumber']),
                'eventName': event['EventName'],
                'eventFormat': event['EventFormat'],
            })
        
        return jsonify({
            'year': year,
            'totalRounds': len(calendar),
            'calendar': calendar
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get-gp-sessions', methods=['GET'])
def get_gp_sessions():
    year = request.args.get('year', type=int)
    grand_prix = request.args.get('grandPrix', type=str)
    
    if not year or not grand_prix:
        return jsonify({'error': 'Year and Grand Prix are required'}), 400
    
    try:
        schedule = fastf1.get_event_schedule(year)
        event = schedule[schedule['EventName'] == grand_prix]
        
        if event.empty:
            return jsonify({'error': f'Grand Prix {grand_prix} not found for year {year}'}), 404
        
        event = event.iloc[0]
        sessions = []
        
        # TODO: Hardcoded. Implement dynamic sessions to enable sprint weekends
        session_types = {
            'FP1': 'Session1Date',
            'FP2': 'Session2Date',
            'FP3': 'Session3Date',
            'Q1': 'Session4Date',
            'Q2': 'Session4Date',
            'Q3': 'Session4Date',
            'Race': 'Session5Date'
        }
        
        for session_type, date_column in session_types.items():
            if pd.notna(event[date_column]):
                sessions.append({
                    'type': session_type,
                    'date': event[date_column].strftime('%Y-%m-%d %H:%M:%S')
                })
        
        return jsonify({
            'year': year,
            'grandPrix': grand_prix,
            'eventFormat': event['EventFormat'],
            'sessions': sessions
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/get-session-drivers', methods=['GET'])
def get_session_drivers():
    year = request.args.get('year', type=int)
    grand_prix = request.args.get('grandPrix', type=str)
    session = request.args.get('session', type=str)
    
    if not year or not grand_prix:
        return jsonify({'error': 'Year and Grand Prix are required'}), 400
    
    try:
        session = fastf1.get_session(year, grand_prix, session)
        session.load()
        
        # Get drivers from the session
        results = session.results

        # Abbreviation list (example: VER, HAM, LEC)
        drivers = sorted(list(set(results['Abbreviation'].tolist())))

        return jsonify({
            'grandPrix': grand_prix,
            'year': year,
            'drivers': drivers
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 