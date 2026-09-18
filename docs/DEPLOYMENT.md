# Deployment — PORTAL

**https://reconflow.wingtheidea.com**

Deploys are automatic: every push to `main` runs
`.github/workflows/deploy.yml`, which builds with Vite and syncs `dist/` into
this app's folder of the shared bucket, then invalidates CloudFront. There is no
manual build-and-upload path and no long-lived AWS keys — the workflow assumes an
IAM role through GitHub's OIDC provider.

## Where it lands

Every WingTheIdea web app is served from one bucket, one folder per app:

```
webapps.wingtheidea.com/
  RECONFLOW/
    PORTAL/   ->  https://reconflow.wingtheidea.com
    BMS/      ->  https://bms.reconflow.wingtheidea.com
```

This app writes only to `RECONFLOW/PORTAL/`. Its deploy role is scoped to that prefix —
including an `s3:prefix` condition on `ListBucket` — so `s3 sync --delete`
cannot see or remove a sibling app's files. A wrong `S3_PREFIX` fails with
AccessDenied rather than damaging another app.

This is the house pattern across the account — `webapps.skilterco.com`,
`webapps.bugtrakr.com` and a dozen more are laid out the same way, one
distribution per subdomain pointing at a folder.

## Infrastructure

The bucket, CloudFront distribution, ACM certificate, Route 53 records and the
deploy role are **not** created here. They are CloudFormation resources from the
CDK stacks in
[RECONFLOW-BACKEND](https://github.com/Admin-Mobil80/RECONFLOW-BACKEND):
`wingtheidea-webapps` (shared bucket), `reconflow-certificates` (us-east-1)
and `reconflow-portal`. Never create or change any of them by hand — that is a project
hard rule.

## Repo variables

Settings → Secrets and variables → Actions → **Variables** (not secrets; none of
these are sensitive):

```bash
aws cloudformation describe-stacks --stack-name reconflow-portal \
  --profile wingtheidea --region ap-south-1 \
  --query 'Stacks[0].Outputs' --output table
```

| Variable | Required | From stack output | Value |
| --- | --- | --- | --- |
| `AWS_DEPLOY_ROLE_ARN` | yes | `AwsDeployRoleArn` | Role trusted only for `repo:Admin-Mobil80/RECONFLOW-PORTAL:*` |
| `S3_BUCKET` | yes | `S3Bucket` | `webapps.wingtheidea.com` |
| `S3_PREFIX` | yes | `S3Prefix` | `RECONFLOW/PORTAL` |
| `CLOUDFRONT_DISTRIBUTION_ID` | recommended | `CloudfrontDistributionId` | Without it the sync runs but the cache is not invalidated |
| `AWS_REGION` | no | — | Defaults to `ap-south-1` |
| `BUILD_DIR` | no | — | Defaults to `dist`, which is what Vite emits |

If `AWS_DEPLOY_ROLE_ARN`, `S3_BUCKET` or `S3_PREFIX` is missing the deploy job
**fails** and names it; a skipped job would show green and look like a
successful deploy.

### Sign-in configuration (optional)

Sign-in is passwordless: an email address, then a six-digit code sent to it
by Cognito's custom auth flow. The Cognito pool and client ids are baked into
the bundle at build time and **default to production** in
`src/auth/AuthContext.tsx`, so nothing needs setting for a normal deploy.
To point a build elsewhere, set these (Variables or Secrets):

| Variable | Purpose |
| --- | --- |
| `VITE_COGNITO_USER_POOL_ID` | Another user pool |
| `VITE_COGNITO_CLIENT_ID` | Another portal app client |
| `VITE_AWS_REGION` | The pool's region (default `ap-south-1`) |
| `VITE_AUTH_MOCK` | `1` builds with the mock client: any six-digit code signs in. Never for production. |

## Caching

The sync runs twice on purpose: hashed assets get
`max-age=31536000,immutable`, while `*.html` and `*.json` get
`max-age=0,must-revalidate` so a deploy is visible immediately. Any other
root-level file you add (e.g. `robots.txt`) falls in the immutable pass — move
it into the second pass if it needs to change between deploys.

## Client-side routing

CloudFront maps 403 and 404 from S3 to `/index.html` with status 200, so deep
links work and React Router renders the 404 page itself.

## Manual run

`workflow_dispatch` is enabled — run **Deploy** from the Actions tab to
redeploy `main` without a new commit.
