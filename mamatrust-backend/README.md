# MamaTrust Chatbot

MamaTrust is a React chat interface connected to a FastAPI backend. The backend uses the local evidence dataset and Google Gemini to assess infant-feeding questions, return a verdict, and display source references.

The chat also accepts an optional baby's date of birth. The backend calculates the baby's age and filters clearly age-specific evidence before scoring the question.

## Requirements

- Python 3.10 or later
- Node.js 20.19+ or 22.12+ (Node.js 24 was used for the build check)
- npm
- A Google Gemini API key
- Internet access for installing dependencies and generating live answers

Download or clone the GitHub repository and open its main folder in VS Code. Use two terminals: one for the backend and one for the frontend.

## Project folders

| Location | Purpose |
| --- | --- |
| `frontend/` | React frontend |
| `frontend/src/pages/Chat.jsx` | Chat page and optional DOB input |
| `mamatrust-backend/api_layer.py` | FastAPI endpoints |
| `mamatrust-backend/agreement_scoring.py` | Prompt, Gemini call, scoring and escalation logic |
| `mamatrust-backend/baby_profile.py` | Age calculation and evidence filtering |
| `mamatrust-backend/real_chunks.json` | Local evidence dataset |
| `mamatrust-backend/requirements.txt` | Backend dependencies |

## 1. Set up the backend

In your first terminal, from the repository's main folder:

```powershell
cd mamatrust-backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Create your own virtual environment when setting up the project on a new computer. If you already created one locally, skip the `python -m venv venv` command.

### Add the environment file

The actual `.env` file is not included on GitHub. Create a file named exactly `.env` inside **`mamatrust-backend`**, next to `api_layer.py`, with:

```env
GEMINI_API_KEY=your_api_key_here
```

Replace the placeholder with your Gemini API key. If you receive a development `.env` file privately from the project coordinator, place it in that same backend folder. Do not upload the actual `.env` file to GitHub.

### Start the backend

Keep the terminal in `mamatrust-backend` and run:

```powershell
python -m uvicorn api_layer:app --reload --port 8000
```

Leave this terminal running. These pages should now be available:

- Health check: <http://localhost:8000/health> — expected response: `{"status":"ok"}`
- Interactive API documentation: <http://localhost:8000/docs>

The health check confirms the API is running. It does not check whether the Gemini API key works.

### If PowerShell blocks activation

You can run the virtual environment's Python directly without activating it:

```powershell
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m uvicorn api_layer:app --reload --port 8000
```

### macOS or Linux

Use these commands instead of the Windows virtual-environment commands:

```bash
cd mamatrust-backend
python3 -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn api_layer:app --reload --port 8000
```

## 2. Start the frontend

Open a second terminal in the repository's main folder:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually <http://localhost:5173>, and select **Chat**. You can also open `/chat` on that same frontend URL.

Keep both terminals running while using the chatbot.

The chat calls `http://localhost:8000` directly. Its backend URL is set by `API_BASE_URL` in `frontend/src/pages/Chat.jsx`. If you change the backend port, update that value too. The existing Vite `/api` proxy is not used by the chat scoring request.

## 3. Test the chat and age filtering

1. Open the Chat page and enter a question.
2. Check that a reply, verdict and source references appear. Sources may be empty when no relevant evidence is cited.
3. Choose an optional baby's DOB and submit a new question.
4. Change the DOB and submit the same question again to compare results.
5. Clear the date to test the chat without age information.

Changing the date affects new answers only. Previous messages remain as they were. The DOB is held in page state and clears when the page is refreshed; it is not yet a saved baby profile.

### Confirm the age filter through browser developer tools

Press **F12**, open **Network**, select **Fetch/XHR**, and send a question. Select the request to `/score/chat`.

Under **Payload**, look for:

```json
{
  "claim": "Your question",
  "baby_dob": "2026-02-07"
}
```

Under **Preview** or **Response**, check:

| Field | Meaning |
| --- | --- |
| `baby_age_months` | Calculated age in completed calendar months |
| `age_filter.applied` | `true` when a DOB was supplied |
| `age_filter.total_chunks` | Evidence count before filtering |
| `age_filter.retained_chunks` | Evidence count after filtering |

Without a DOB, `baby_age_months` is `null` and `age_filter.applied` is `false`. The response wording or verdict does not have to change for every question when the DOB changes.

Age is calculated using the current date in Perth. Invalid dates and future birth dates receive HTTP `422`. Only the calculated age, not the raw DOB, is included in the Gemini prompt.

Clear month/year ranges use completed calendar months and include both stated endpoints. Broad or unclear labels are retained. Safety-flagged evidence is always retained regardless of age.

## API endpoints

| Method | Endpoint | Input |
| --- | --- | --- |
| GET | `/health` | No input |
| POST | `/score/chat` | JSON body with `claim` and optional `baby_dob`; used by the chat |
| POST | `/score` | JSON body with `claim`, evidence `chunks`, and optional `baby_dob` |
| POST | `/score/demo` | `claim` query parameter; scores the local dataset without DOB filtering |

Use `/docs` to inspect request schemas and try requests manually. Gemini-backed requests require a working API key and available provider quota.

## Offline tests and frontend build

In the backend terminal, with the virtual environment active:

```powershell
python -m pip install httpx
python -m unittest test_baby_profile -v
```

These tests replace the Gemini call with a local stub. They do not need an API key or consume API quota.

In the frontend terminal:

```powershell
npm run build
```

Eight offline DOB/backend tests and the frontend production build passed during implementation. This does not verify live Gemini answers or clinical correctness. Full-project ESLint still has existing unused-variable/import errors in other frontend files.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| `No module named dotenv` | Run `python -m pip install -r requirements.txt` using the backend virtual environment. |
| `No module named uvicorn` or `fastapi` | Install the backend requirements using the same Python you use to start the server. |
| Chat cannot reach the service | Confirm the backend is running on port `8000`, then open `/health`. Check the backend terminal for the actual error. |
| Health check works but chat fails | Check the backend `.env`, Gemini key, model availability and API quota. The backend terminal shows the failure details. |
| DOB input is missing | Confirm the updated `Chat.jsx` is in `frontend/src/pages`, restart Vite, and refresh the page. |
| HTTP `422` | Check that the question is not blank and the DOB is a valid date that is not in the future. |
| `real_chunks.json` cannot be found | Keep the dataset beside `api_layer.py` in `mamatrust-backend`. |
| Port already in use | Stop the other server using that port, or change the port and the frontend's backend URL together. |

## Current development limits

- The chat uses the local `real_chunks.json` dataset. Topic-based retrieval is not yet connected to this endpoint.
- DOB filtering provides chronological age context; it does not establish feeding readiness or a premature baby's corrected age.
- Some routine questions can still trigger escalation. The flags on `leap_2017_005`, `asia_2018_019` and `elim_2025_006` need review by the dataset owners.
- The current safety escalation depends on flagged evidence cited by the scorer. A separate symptom-based bypass remains to be implemented.
- MamaTrust is a development prototype providing general information, not a substitute for professional medical advice.

## Files to keep out of GitHub

Ensure your repository's `.gitignore` includes at least:

```gitignore
mamatrust-backend/.env
mamatrust-backend/venv/
**/__pycache__/
frontend/node_modules/
frontend/dist/
```

An optional `.env.example` can contain the placeholder `GEMINI_API_KEY=your_api_key_here` to show teammates which setting is required.
