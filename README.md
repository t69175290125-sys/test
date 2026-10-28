# Demo Shop — QA Nerve Center CI/CD playground

A small web shop plus a Playwright test suite, built to walk through the whole
QA Nerve Center flow: import automated tests, run them, schedule them, check
release gates, and (once the Sprint 10 CLI exists) drive all of it from a pipeline.

Everything runs offline: the shop is a zero-dependency Node server, and
Playwright starts it automatically before the tests.

## What's inside

```
app/
  server.js          the shop (http://localhost:3100)
  public/            login, catalog, cart with promo codes, checkout
  features.json      bug switches — turn one on to break the build on purpose
tests/
  smoke/             2 fast checks          → "Smoke" job
  regression/        15 functional tests    → "Regression" job
    auth.spec.ts       sign-in, errors, logout, redirect
    catalog.spec.ts    product list and search
    cart.spec.ts       badge, quantities, remove, promo codes
    checkout.spec.ts   validation, confirmation, empty cart
qa/test-cases.csv    the same 17 tests as manual test cases (for the Migration import)
.github/workflows/   example pipeline
playwright.config.ts project "chromium" (the name QA Nerve Center expects)
```

Every test title starts with its test case ID (`TC-CART-04 …`), matching `qa/test-cases.csv`.

Demo login: **demo / demo123** · Promo code: **SAVE10** (10 % off)

## Step 1 — Run it locally

```bash
npm install
npx playwright install chromium
npm test                 # 17 passed
npm start                # optional: open http://localhost:3100 and click around
```

## Step 2 — Push to GitHub

```bash
git init -b main
git add .
git commit -m "Demo shop with Playwright regression suite"
git remote add origin https://github.com/<you>/qanc-demo-shop.git
git push -u origin main
```

The **Actions** tab shows the `tests` job running the suite on GitHub's machines.

## Step 3 — Connect the project in QA Nerve Center

1. **Projects → New project** "Demo Shop".
2. In the project settings, set the **Git URL** to the GitHub repository
   (for a private repository, also set a GitHub personal access token).

## Step 4 — Import the automated tests (Automation Bridge)

1. **Automation → Discover**: 5 files are found (Playwright, TypeScript).
2. Select them all and **Import**: 17 tests appear.
3. **Preflight**: run the suggested setup steps (`npm install`,
   `npx playwright install chromium`) until everything is green.
4. **Run**: 17 passed, with per-test durations.

## Step 5 — Create the jobs (Scheduler)

| Job | Files | Trigger |
|---|---|---|
| Smoke | `tests/smoke/smoke.spec.ts` | Manual |
| Regression | the 4 files in `tests/regression/` | Manual (or a cron, e.g. every night) |

Trigger **Regression** manually and follow it in the run queue.

## Step 6 — Manual test cases and release gates

1. **Migration → Import → CSV** with `qa/test-cases.csv`. Map the columns:
   ID → external ID, Title → title, Priority → priority, Steps → steps
   (step delimiter `||`, action/expected delimiter `->`).
2. **Automation → Tests**: link each automated test to the test case with the same ID.
3. **Quality → Release gates**: create "Release 1.0" with:
   pass rate ≥ 95 %, critical bugs ≤ 0, high bugs ≤ 2.

## Step 7 — Break the build on purpose

Edit `app/features.json` and set one switch to `true`:

| Switch | What breaks | Test that catches it |
|---|---|---|
| `promoCode` | SAVE10 gives 1 % instead of 10 % | TC-CART-04 |
| `cartBadge` | Badge counts products, not quantity | TC-CART-01 |
| `checkoutValidation` | Empty checkout form places an order | TC-CHK-01 |
| `loginError` | Wrong password shows no error | TC-AUTH-02 |

Commit, push, and run **Regression** again in Nerve Center: the run pulls the new
commit and shows the failure with its error message and screenshot. Set the
switch back to `false` and push to recover.

## Step 8 — Drive it from the pipeline (after the Sprint 10 CLI is built)

This is the part being built in Sprint 10 (S10-01 / S10-02):

```bash
qanc run "Regression" --env staging --build 1.0.7 --wait   # exit 0 = all passed, 1 = failures
qanc status                                                 # last run's result
qanc gates --build 1.0.7                                    # exit 1 if any gate fails
```

To use it from GitHub Actions:

1. Nerve Center runs on your PC, which GitHub's machines can't reach, so install a
   **self-hosted runner** on your PC: repository **Settings → Actions → Runners → New self-hosted runner**.
2. Create an API token in Nerve Center (Admin → Users → your user → API tokens).
3. In **Settings → Secrets and variables → Actions**:
   - secret `QANC_TOKEN` = the `qanc_…` token
   - variables `QANC_URL` = `http://localhost:4000`, `QANC_PROJECT` = the project ID, `QANC_ENABLED` = `true`
4. Push: the `quality-gate` job in `.github/workflows/qa-pipeline.yml` runs the
   Regression job through Nerve Center and stops the pipeline if a gate fails.
