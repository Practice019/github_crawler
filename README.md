# GitHub Trending Projects Platform

A web platform that automatically fetches GitHub trending projects sorted by stars and generates project introductions.

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: React + Vite

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   ├── controllers/ # Request handlers
│   │   ├── services/    # Business logic
│   │   ├── routes/      # API routes
│   │   └── utils/       # Utility functions
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── utils/       # Utility functions
│   ├── index.html
│   └── package.json
└── README.md
```

## Getting Started

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

- `GET /api/github/trending` - Get trending projects
- `GET /api/github/trending/:language` - Get trending projects by language
- `GET /health` - Health check
