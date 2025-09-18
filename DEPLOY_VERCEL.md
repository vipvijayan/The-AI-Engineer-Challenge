# Deploying to Vercel

This repository contains a FastAPI backend under `api/` and a React frontend under `frontend/`.

What I changed to prepare deployment:

- Updated `vercel.json` to route `api/index.py` through `@vercel/python` and kept frontend static build routing.
- Added a root `requirements.txt` to let Vercel install Python dependencies.
- Added `api/vercel_entry.py` which exports the FastAPI `app` and a `handler` fallback via `Mangum`.

Quick deploy steps (recommended):

1. Install the Vercel CLI if you don't have it:

```bash
npm install -g vercel
```

2. Log in to Vercel:

```bash
vercel login
```

3. From the repository root run:

```bash
vercel --prod
```

4. Environment variables:

- Add any required secrets (OpenAI key, other API keys) in the Vercel dashboard under Project Settings > Environment Variables.
- Locally you can use a `.env` file while testing, but do NOT commit it.

Local testing:

- To run the API locally:

```bash
# create venv, install requirements
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn api.index:app --reload --port 8000
```

- To run the frontend locally:

```bash
cd frontend
npm install
npm start
```

Notes and troubleshooting:

- If Vercel build fails because a package can't be installed or the Python runtime is incompatible, check the Vercel build logs. You can pin different package versions in `requirements.txt`.
- Vercel's Python runtime supports `python3.11+` (verify current support); if you need another runtime, set `runtime` in `vercel.json` or use Docker.

If you want, I can also:

- Add a tiny health-check route or startup logs.
- Create a GitHub Action to auto-deploy on push.
