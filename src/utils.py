import json

def load_dummy_data():
    try:
        with open('dummy_data/compare-drivers.json', 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading dummy data: {e}")
        return {"error": "Failed to load dummy data"}