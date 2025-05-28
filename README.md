# F1 Analyst

F1 Analyst is a web application that allows you to analyze Formula 1 data using the FastF1 API. The application provides detailed visualizations and analysis of F1 races, drivers, and teams.

## Features

- Detailed F1 race analysis
- Driver and team data visualizations
- Interactive lap time graphs
- Driver performance comparisons
- Race strategy analysis

## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- npm or yarn

## Installation

Configure environment variables:
Create a `.env` file in the project root with the following variables:
```
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4o-mini
USE_DUMMY_DATA=true
```

### Backend

1. Create a Python virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

### Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Local Development

### Backend

1. Activate the virtual environment (if not already activated):
```bash
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Start the FastAPI server:
```bash
python backend/server.py
```

The backend will be available at `http://localhost:5000`

### Frontend

1. In a new terminal, from the frontend directory:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
f1-analyst/
├── frontend/          # React application
├── backend/           # Backend source code
├── dummy_data/        # Sample data
├── tests/             # Python tests
└── requirements.txt   # Python dependencies
```

## Technologies Used

- Backend:
  - FastF1: F1 data API
  - FastAPI: Web framework
  - Pandas: Data analysis
  - Matplotlib/Seaborn: Data visualization

- Frontend:
  - React
  - TypeScript
  - Material-UI

## License

This project is licensed under the MIT License.