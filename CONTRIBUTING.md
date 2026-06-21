# Contributing to Readsdot AI

We welcome contributions! Here's how to collaborate on GitHub.

## Setup
1. Fork the repo
2. `git clone https://github.com/YOUR_USERNAME/readsdot_AI`
3. `npm install`
4. `npm run dev`

## Contributor Roles

### Contributor 1 (Repo Owner)
- Creates the GitHub repository
- Manages releases and merges PRs
- Owns: `src/ml/` (model pipeline, brailleUtils, modelLoader)

### Contributor 2 (Feature Contributor)  
- Forks and opens Pull Requests
- Owns: `src/pages/` (UI pages), `src/components/`

## Workflow
1. Create a branch: `git checkout -b feature/your-feature`
2. Make changes
3. Commit: `git commit -m "feat: description"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request on GitHub

## Commit Convention
- `feat:` new feature
- `fix:` bug fix  
- `refactor:` code improvement
- `docs:` documentation

## Key Files
- `src/ml/brailleUtils.ts` — Core translation logic
- `src/ml/modelLoader.ts` — ONNX inference
- `src/pages/TranslatePage.tsx` — Main UI
