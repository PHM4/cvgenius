# CVGenius

CVGenius is a React + TypeScript resume builder that pairs streamlined forms with a live preview and PDF export. Phase 2 introduces Google authentication and Firestore-backed cloud saves so users can sync their CVs across devices.

## Features

- Guided forms for personal info, experience, education, and skills.
- Live CV preview with Tailwind styling.
- One-click PDF export powered by `@react-pdf/renderer`.
- Local auto-save with the option to load sample data.
- Google sign-in with Firebase Authentication.
- Firestore storage for multiple CVs per user, stored under `users/{uid}/cvs/{cvId}`.
- AI rewrite helper (Groq LLM) for polishing job descriptions and generating achievements.

## Prerequisites

- Node.js 18+
- npm 9+
- A Firebase project with Authentication and Firestore enabled.

## Environment Configuration

Create a `.env.local` (or `.env`) file in the project root based on the template below. The app reads these values at build time via Vite.

```bash
cp env.example .env.local
```

Fill in the firebase web app credentials:

```env
VITE_FIREBASE_API_KEY=<your-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-auth-domain>
VITE_FIREBASE_PROJECT_ID=<your-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-storage-bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-messaging-sender-id>
VITE_FIREBASE_APP_ID=<your-app-id>

# Groq Inference
GROQ_API_KEY=<your-groq-api-key>
GROQ_MODEL=llama-3.1-8b-instant
VITE_AI_API_BASE_URL=http://localhost:3001/api/ai/rewrite
AI_PROXY_PORT=3001
```

For production builds (`npm run build` / GitHub Actions), `.env.production` already points `VITE_AI_API_BASE_URL` to the deployed Cloud Function at `https://us-central1-cvgenius-985fd.cloudfunctions.net/aiRewrite`.

### Firebase Console Checklist

1. **Authentication**
   - Enable the Google provider under *Build ▸ Authentication ▸ Sign-in method*.
2. **Firestore**
   - Create a database in production mode.
   - Add the following rules so each user can only read/write their own CVs:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/cvs/{cvId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Local Development

```bash
npm install
npm run ai-proxy   # terminal 1 (Groq proxy)
npm run dev        # terminal 2 (Vite dev server)
```

Visit `http://localhost:5173` to interact with the app.

## AI Rewrite Service (Groq)

- For local development, run `npm run ai-proxy` (terminal 1). It launches the Express proxy on `http://localhost:3001/api/ai/rewrite`.
- The front-end uses `VITE_AI_API_BASE_URL` to decide where to send rewrite requests. `.env.local` points at the local proxy; `.env.production` points at the deployed Cloud Function.
- The production API runs as a Firebase Cloud Function (`functions/index.js`). Set secrets once via:

  ```bash
  firebase functions:secrets:set GROQ_API_KEY
  firebase functions:config:set groq_model=llama-3.1-8b-instant
  ```

  You can also rely on `GROQ_API_KEY`/`GROQ_MODEL` environment variables during deployment if you prefer.

## Using the AI Rewrite Helper

Inside each work experience entry, click **Rewrite with AI**. The helper:

1. Sends the current description (plus company/role context) to Groq.
2. Returns a polished 2–3 sentence description and 2–4 suggested achievements.
3. Lets you review, accept, or dismiss the suggestions. Accepting replaces the description and appends novel achievements without duplicating existing bullets.

## Production Build & Linting

```bash
npm run build   # type-check + production build
npm run lint    # ESLint
```

## Firebase Hosting Deployment

1. Log in locally (once): `npx firebase login`.
2. Configure the Groq secret (once per project):
   ```bash
   firebase functions:secrets:set GROQ_API_KEY
   ```
3. (Optional) Override the default model:
   ```bash
   firebase functions:config:set groq_model=llama-3.1-8b-instant
   ```
4. Build & deploy: `npm run deploy`.
   - The script runs `npm run build`, installs Cloud Function deps, and publishes Hosting + Functions for `cvgenius-985fd`.
5. To generate a CI token, run `npx firebase login:ci` and add the output as the `FIREBASE_TOKEN` secret in your GitHub repository settings.

## Continuous Deployment (GitHub Actions)

- Workflow: `.github/workflows/deploy.yml` runs on every push to `main`.
- It installs dependencies, lints, builds, and deploys (`firebase deploy --only hosting`).
- Ensure the repository secret `FIREBASE_TOKEN` is set so the deploy step can authenticate.

## Cloud Save Usage

1. Sign in with Google using the header action.
2. Use **Save to Cloud** to create or update a CV document.
3. Pick a saved CV from the dropdown to load it into the editor. Loading prompts before replacing your current work.
4. Use **Save as Copy** to branch the current CV into a new document.

The UI mirrors cloud sync status (loading, saving, last updated) next to the standard local auto-save indicator.

## Roadmap Snapshot

- Phase 0: Project scaffolding with Vite, Tailwind, and base layout. ✅
- Phase 1: Form-driven CV builder with PDF export and local storage. ✅
- Phase 2: Accounts, Google sign-in, Firestore-backed persistence. ✅
- Phase 4: AI rewrite helper (Groq). ✅
- **Phase 5 (current):** Hosting, CI/CD, UX polish. 🚧
- Future: Profile photos, public share links.

Happy building!
