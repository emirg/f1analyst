from fastapi import Path, HTTPException
import json

GRAND_PRIX_ALIASES = {
    "preseasontesting": "Pre-Season Testing",
    "preseasontest": "Pre-Season Test",
    "preseasontrack": "Pre-Season Track Session",
    "australiangrandprix": "Australian Grand Prix",
    "chinesegrandprix": "Chinese Grand Prix",
    "japanesegrandprix": "Japanese Grand Prix",
    "bahraingrandprix": "Bahrain Grand Prix",
    "saudiarabiangrandprix": "Saudi Arabian Grand Prix",
    "miamigrandprix": "Miami Grand Prix",
    "emiliaromagnagrandprix": "Emilia Romagna Grand Prix",
    "monacograndprix": "Monaco Grand Prix",
    "spanishgrandprix": "Spanish Grand Prix",
    "frenchgrandprix": "French Grand Prix",
    "canadiangrandprix": "Canadian Grand Prix",
    "austriangrandprix": "Austrian Grand Prix",
    "britishgrandprix": "British Grand Prix",
    "belgiangrandprix": "Belgian Grand Prix",
    "hungariangrandprix": "Hungarian Grand Prix",
    "dutchgrandprix": "Dutch Grand Prix",
    "italiangrandprix": "Italian Grand Prix",
    "azerbaijangrandprix": "Azerbaijan Grand Prix",
    "singaporegrandprix": "Singapore Grand Prix",
    "unitedstatesgrandprix": "United States Grand Prix",
    "mexicocitygrandprix": "Mexico City Grand Prix",
    "sãopaulograndprix": "São Paulo Grand Prix",
    "lasvegasgrandprix": "Las Vegas Grand Prix",
    "qatargrandprix": "Qatar Grand Prix",
    "abudhabigrandprix": "Abu Dhabi Grand Prix",
    "turkishgrandprix":"Turkish Grand Prix",
    "russiangrandprix": "Russian Grand Prix",
    "styriangrandprix": "Styrian Grand Prix"
}

def load_dummy_data():
    try:
        with open('dummy_data/compare-drivers.json', 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading dummy data: {e}")
        return {"error": "Failed to load dummy data"}
    
def normalize_grand_prix(grand_prix: str = Path(...)) -> str:
    key = grand_prix.lower().replace(" ", "").replace("-", "").replace("_", "")
    normalized = GRAND_PRIX_ALIASES.get(key)
    if not normalized:
        raise HTTPException(status_code=404, detail=f"Unknown Grand Prix: {grand_prix}")
    return normalized