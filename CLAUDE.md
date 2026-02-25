# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

F1 Analyst is a full-stack web application for analyzing Formula 1 data. The backend is built with FastAPI and uses the FastF1 library for F1 data analysis, while the frontend is a React TypeScript application with Material-UI components.

## Development Commands

### Backend (FastAPI)
- **Start server**: `uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload`
- **Run tests**: `pytest backend/tests/` (from root directory)
- **Install dependencies**: `pip install -r backend/requirements.txt`

### Frontend (React + TypeScript)
- **Start dev server**: `npm start` (from frontend/ directory)
- **Build**: `npm run build` (from frontend/ directory)
- **Run tests**: `npm test` (from frontend/ directory)
- **Install dependencies**: `npm install` (from frontend/ directory)

### Docker
- **Start both services**: `docker-compose up`
- **Backend runs on**: http://localhost:8000
- **Frontend runs on**: http://localhost:3001 (Docker) or http://localhost:3000 (local dev)

## Architecture

### Backend Structure
- **FastAPI app**: `backend/app/main.py` - Main application entry point
- **Configuration**: `backend/app/core/config.py` - Settings using Pydantic BaseSettings
- **API endpoints**: `backend/app/api/v1/endpoints/` - REST API routes
- **Services**: `backend/app/services/` - Business logic layer
- **Schemas**: `backend/app/schemas/` - Pydantic models for request/response
- **Agent**: `backend/app/agent/` - F1 analysis bot using OpenAI
- **Data caching**: FastF1 data is cached in `backend/data/cache/` and `backend/app/data/cache/`

### Frontend Structure
- **Components**: `frontend/src/components/` - React components
- **Services**: `frontend/src/services/` - API integration (OpenF1 API)
- **Types**: `frontend/src/types/` - TypeScript type definitions
- **Main app**: `frontend/src/App.tsx` - Root component

### Key Data Flow
1. Frontend makes requests to backend API (`/api/v1/`)
2. Backend services use FastF1 library to fetch F1 telemetry data
3. Data is cached locally using FastF1's caching system
4. Frontend also directly calls OpenF1 API for calendar/session data
5. AI agent analyzes data using OpenAI API when requested

## Environment Configuration

Both backend and frontend require `.env` files:

### Backend `.env` (in backend/ directory)
```
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
USE_DUMMY_DATA=true
```

### Frontend `.env` (in frontend/ directory)
Environment variables for React app (REACT_APP_ prefix)

## Data Sources
- **FastF1**: Official F1 timing and telemetry data
- **OpenF1 API**: Calendar, sessions, and basic driver information
- **Cached data**: Extensive local caching in multiple `data/cache/` directories

## Testing
- Backend uses pytest framework
- Frontend uses React Testing Library with Jest
- No custom test configuration files detected

## Key Dependencies
- **Backend**: FastAPI, FastF1, Pydantic, OpenAI, pandas, uvicorn
- **Frontend**: React 19, TypeScript, Material-UI, Axios

## Development Notes
- The project uses dummy data mode by default (`USE_DUMMY_DATA=true`)
- Multiple cache directories exist for FastF1 data across different locations
- Backend serves on port 8000, frontend on 3000 (local) or 3001 (Docker)
- CORS is configured to allow all origins in development