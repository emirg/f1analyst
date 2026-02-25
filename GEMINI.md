# F1 Analyst - Project Context for Qwen Code

## Project Overview

F1 Analyst is a web application that allows users to analyze Formula 1 data using the FastF1 API. The application provides detailed visualizations and analysis of F1 races, drivers, and teams, with a current focus on driver comparisons.

The application is built with a modern tech stack:
- **Backend**: Python with FastAPI, leveraging FastF1 for data access, Pandas for analysis, and OpenAI for generating insights.
- **Frontend**: React with TypeScript and Material-UI for a responsive user interface.
- **Architecture**: Follows a typical client-server model with a REST API.

## Project Structure

```
f1-analyst/
├── frontend/          # React application (TypeScript, Material-UI)
├── backend/           # Backend source code (Python, FastAPI)
│   ├── app/           # Main application package
│   │   ├── agent/     # AI analysis logic (F1AnalysisBot)
│   │   ├── api/       # API endpoints
│   │   ├── core/      # Core configuration
│   │   ├── models/    # Data models
│   │   ├── schemas/   # Pydantic schemas for API validation
│   │   ├── services/  # Business logic services
│   │   └── main.py    # FastAPI application entry point
│   ├── dummy_data/    # Sample data for testing
│   ├── tests/         # Python tests
│   └── requirements.txt # Python dependencies
├── dummy_data/        # Legacy location for sample data (consider consolidating)
├── tests/             # Legacy location for tests (consider consolidating)
├── README.md
├── requirements.txt   # Python dependencies (duplicate, consider removing)
└── docker-compose.yaml
```

## Key Technologies

- **Backend**:
  - FastAPI: High-performance web framework for building APIs.
  - FastF1: Python library for accessing F1 data.
  - Pandas: Data analysis and manipulation.
  - OpenAI: For generating natural language analysis.
  - Pydantic: Data validation and settings management.
  - Cachetools: For caching API responses and computed results.
- **Frontend**:
  - React: JavaScript library for building user interfaces.
  - TypeScript: Typed superset of JavaScript.
  - Material-UI: React components for faster and easier web development.
  - Axios: Promise-based HTTP client for making API requests.

## Core Functionality

### Backend (`backend/app/`)

1.  **API (`api/v1/endpoints/`)**: Defines REST endpoints, primarily for driver comparison (`/api/v1/agent/compare-drivers`).
2.  **Agent (`agent/`)**: Contains `F1AnalysisBot`, which uses FastF1 to fetch data and OpenAI to generate natural language analysis (driver performance, race pace prediction, driver comparison).
3.  **Services (`services/`)**: Handles business logic like fetching session data and managing agent services.
4.  **Core (`core/`)**: Application configuration using Pydantic Settings, loading environment variables from `.env`.
5.  **Schemas (`schemas/`)**: Pydantic models for request/response validation.

### Frontend (`frontend/src/`)

1.  **Components (`components/`)**: Reusable UI components, including the main `DriverComparisonForm` and `ComparisonResult`.
2.  **Services (`services/`)**: Contains `openF1Api.ts` for fetching F1 calendar, sessions, and driver data. *Note: This seems to use an external OpenF1 API, which might be separate from the FastF1 library used in the backend.*
3.  **Types (`types/`)**: TypeScript interfaces for data structures.

## Development Workflow

### Environment Setup

1.  **Prerequisites**: Python 3.8+, Node.js 14+.
2.  **Environment Variables**: Create a `.env` file in the project root with:
    ```
    OPENAI_API_KEY=your_api_key
    OPENAI_MODEL=gpt-4o-mini
    USE_DUMMY_DATA=true  # Set to false to use real F1 data
    ```
3.  **Backend Setup**:
    - Create a Python virtual environment: `python -m venv backend/.venv`
    - Activate it: `source backend/.venv/bin/activate`
    - Install dependencies: `pip install -r backend/requirements.txt`
4.  **Frontend Setup**:
    - Navigate to the frontend directory: `cd frontend`
    - Install dependencies: `npm install`

### Running the Application

1.  **Backend**:
    - Activate the virtual environment.
    - Start the FastAPI server: `python backend/app/main.py` (or `uvicorn backend.app.main:app --reload` for development).
    - The backend API will be available at `http://localhost:8000`.
2.  **Frontend**:
    - In a new terminal, from the `frontend` directory: `npm start`.
    - The application will be available at `http://localhost:3000`.

### Building

- **Frontend**: `cd frontend && npm run build`

## Development Conventions

- **Backend**:
  - Follows a modular structure with clear separation of concerns (API, services, agent).
  - Uses Pydantic for data validation.
  - Employs caching (cachetools) to improve performance.
  - Configuration is managed through `pydantic-settings`.
- **Frontend**:
  - Uses TypeScript for type safety.
  - Employs Material-UI for consistent UI components.
  - Uses functional components with React Hooks.
  - API calls are encapsulated in service files.

## Important Notes for Qwen Code

- The backend is the primary source of F1 data analysis and AI-powered insights.
- The frontend consumes the backend API to display data and analysis.
- When working on features related to F1 data analysis, focus on the backend `agent` and `services`.
- When working on UI components or frontend logic, focus on the `frontend/src` directory.
- The application can run in "dummy data" mode for testing without an OpenAI key or real F1 data access.