# Blockfall

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-41-47848F?logo=electron&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
[![Deployed on GCP](https://img.shields.io/badge/Deployed%20on-Cloud%20Run-4285F4?logo=googlecloud&logoColor=white)](https://blockfall-175953893373.us-central1.run.app)
[![Built with Claude Code](https://img.shields.io/badge/Built%20with-Claude%20Code-D97757?logo=anthropic&logoColor=white)](https://claude.ai/code)

A modern, fully-featured block-falling puzzle game with neon visuals, smooth animations, and a clean architecture designed as a portfolio project.

**[Play it live →](https://blockfall-175953893373.us-central1.run.app)**

---

## Screenshots

> Add screenshots here after first run

---

## Features

- **Ghost piece** — see exactly where the piece lands
- **Hold piece** — swap out a piece to use later
- **Next 3 pieces** preview
- **SRS rotation** with full wall-kick support
- **DAS / ARR** keyboard handling (responsive key-repeat)
- **7-bag randomiser** — balanced piece distribution
- **Neon glow** visuals with CSS box-shadow
- **Animations** — score pop, line-clear particles, level-up banner, game-over overlay
- **Scoring**: Single=100, Double=300, Triple=500, Quad=800 x level multiplier
- **Speed increase** per level

---

## Tech Stack

| Technology | Role |
|---|---|
| React 19 | UI rendering |
| TypeScript 5 | Type safety |
| Vite 8 | Dev server + bundler |
| Electron 41 | Desktop wrapper |
| nginx Alpine | Production static server |
| Docker | Containerisation |
| Google Cloud Run | Serverless deployment |

---

## Architecture

```
src/
├── types.ts           — All interfaces / type aliases
├── constants.ts       — All magic numbers
├── game/
│   ├── Piece.ts       — Tetromino shapes + SRS rotation
│   ├── Board.ts       — Collision, lock, line-clear, ghost
│   └── GameEngine.ts  — Pure state machine (no React)
├── hooks/
│   ├── useGameLoop.ts — rAF loop + gravity timer
│   └── useKeyboard.ts — DAS/ARR input
└── components/
    ├── Game.tsx        — Layout
    ├── GameBoard.tsx   — 20x10 play-field renderer
    ├── SidePanel.tsx   — Score / hold / next
    └── MiniBoard.tsx   — Reusable mini piece renderer
electron/
├── main.cjs           — Electron main process
└── preload.cjs        — Sandboxed context bridge
```

---

## Data Structures

| Structure | Used for | Why |
|---|---|---|
| Cell[][] (2-D array) | Game board | O(1) cell access, maps directly to visual grid |
| TetrominoType[] (queue) | Next-piece bag | FIFO semantics, O(1) amortised dequeue |
| number[][] (matrix) | Piece shape | Rotation = O(k^2) matrix transform |
| number 0-3 | Rotation state | Drives SRS wall-kick table lookup |

---

## How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2a. Run as web app (http://localhost:5173)
npm run dev

# 2b. Run as desktop app (Electron)
npm run electron
```

### Controls

| Key | Action |
|---|---|
| Left / Right | Move |
| Up or X | Rotate clockwise |
| Z | Rotate counter-clockwise |
| Down | Soft drop |
| Space | Hard drop |
| C or Shift | Hold |
| P or Escape | Pause |
| R | Restart |

---

## Deploy to Google Cloud Run

### Prerequisites

```bash
gcloud auth login
gcloud auth configure-docker
gcloud config set project YOUR_PROJECT_ID
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com
```

### Build and deploy (recommended — no local Docker needed)

`gcloud builds submit` sends the source to Cloud Build, builds the image remotely, and pushes it to Container Registry in one step.

```bash
# 1. Build the image remotely and push to Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/blockfall

# 2. Deploy the new image to Cloud Run
gcloud run deploy blockfall \
  --image gcr.io/YOUR_PROJECT_ID/blockfall \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 128Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3
```

Cloud Run prints the public URL after deploy. Open it in any browser — no server management required.

### Alternative: build locally with Docker

If you have Docker installed and prefer to build locally:

```bash
docker build -t gcr.io/YOUR_PROJECT_ID/blockfall:latest .
docker push gcr.io/YOUR_PROJECT_ID/blockfall:latest

gcloud run deploy blockfall \
  --image gcr.io/YOUR_PROJECT_ID/blockfall:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

### Re-deploy after changes

```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/blockfall && \
gcloud run deploy blockfall \
  --image gcr.io/YOUR_PROJECT_ID/blockfall \
  --platform managed --region us-central1 --allow-unauthenticated
```

---

## Built with AI-Assisted Development

This project was built using **[Claude Code](https://claude.ai/code)** as an AI development tool.

The architectural decisions were planned and directed by the developer:

- **2-D array for the board** — O(1) cell access maps naturally to the visual grid
- **Queue for the piece bag** — FIFO semantics match the 7-bag randomiser perfectly
- **Pure `game/` layer** — framework-agnostic state machine, fully testable without React
- **Custom hooks (`useGameLoop`, `useKeyboard`)** — clean separation between game logic and React lifecycle
- **Multi-stage Docker build** — keeps the final image at ~25 MB (nginx:alpine, no Node runtime)

Claude Code was used to implement and iterate on the code based on detailed specifications — writing boilerplate, catching type errors, suggesting SRS wall-kick details, and wiring up the Electron + Cloud Run deployment pipeline.

**What was learned during this project:**

- React 19 patterns (hooks, component composition, `requestAnimationFrame` loops)
- TypeScript strict-mode discipline across a non-trivial codebase
- Docker multi-stage builds and Alpine image optimisation
- Google Cloud Run deployment via `gcloud builds submit`
- How to use an AI coding tool effectively: writing precise specs, reviewing generated code critically, and staying in control of architectural decisions

---

## License

MIT
