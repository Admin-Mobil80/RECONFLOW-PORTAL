# ReconFlow — Portal

Public landing page **and** customer portal for ReconFlow, in one Vite + React +
TypeScript SPA. ReconFlow has no separate landing-page repo by design.

Part of the [WingTheIdea](https://github.com/Admin-Mobil80) group.

## Stack

- Vite 7, React 19, TypeScript, React Router (client-side routing)
- Builds to `dist/`, hosted from a private S3 bucket behind CloudFront (OAC)

## Local development

```bash
npm ci
npm run dev        # http://localhost:5173
npm test           # tsc --noEmit
npm run build      # -> dist/
```

## Routes

| Path | Contents |
| --- | --- |
| `/` | Public landing page (placeholder copy) |
| `/app` | Portal shell — no auth yet |
| anything else | In-app 404 |

## Deploying

Push to `main`. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — infrastructure
comes from the `reconflow-portal` CDK stack in
[RECONFLOW-BACKEND](https://github.com/Admin-Mobil80/RECONFLOW-BACKEND), never
from the console.
