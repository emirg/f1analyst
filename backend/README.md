# F1 Analyst API

A FastAPI-based backend service for Formula 1 data analysis and comparison.

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── endpoints/
│   │           ├── agent.py
│   │           └── calendar.py
│   ├── core/
│   │   └── config.py
│   ├── models/
│   ├── schemas/
│   │   └── f1.py
│   ├── services/
│   │   ├── agent.py
│   │   ├── calendar.py
│   │   └── driver.py
│   └── main.py
├── requirements.txt
└── README.md
```

## Setup

1.  **Install uv (recommended):**
    First, install `uv`. You can use the following command:
    ```bash
    curl -LsSf https://astral.sh/uv/install.sh | sh
    ```
    For other installation methods, see the [official `uv` documentation](https://astral.sh/uv#installation).

2.  **Create and activate a virtual environment:**
    ```bash
    uv venv
    source .venv/bin/activate  # On Windows use `.venv\\Scripts\\activate`
    ```

3.  **Install dependencies:**
    ```bash
    uv pip install -r requirements.txt
    ```

3. Create a `.env` file with the following variables:
```env
USE_DUMMY_DATA=true  # Set to false in production
```

## Running the Application

Start the development server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 5000
```

The API will be available at `http://localhost:5000`

## API Documentation

Once the server is running, you can access:
- Swagger UI: `http://localhost:5000/docs`
- ReDoc: `http://localhost:5000/redoc`

## API Endpoints

### Agent Endpoints
- `POST /api/v1/agent/compare-drivers`: Compare two drivers in a specific session

### Calendar Endpoints
- `GET /api/v1/calendar/year-data/{year}`: Get data for a specific year
- `GET /api/v1/calendar/year-calendar/{year}`: Get calendar for a specific year
- `GET /api/v1/calendar/gp-sessions/{year}/{grand_prix}`: Get sessions for a specific Grand Prix
- `GET /api/v1/calendar/session-drivers/{year}/{grand_prix}/{session}`: Get drivers for a specific session 