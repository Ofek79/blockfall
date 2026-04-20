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

## How to Run Locally

```bash
# Install dependencies
npm install

# Run as web app (http://localhost:5173)
npm run dev

# Run as desktop app (Electron)
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
