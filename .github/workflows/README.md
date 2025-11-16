# GitHub Actions CI/CD Workflows

This directory contains automated CI/CD workflows for the Artisan Beads e-commerce platform.

## Workflows

### 1. CI Workflow (`ci.yml`)
**Triggers**: Push to `main` or `claude/**` branches, Pull Requests to `main`

**Jobs**:
- ✅ **Unit & API Tests** - Runs Vitest tests with coverage
- ✅ **E2E Tests** - Runs Playwright tests in Chromium
- ✅ **Build** - Builds Next.js application
- ✅ **Lint** - Runs ESLint
- ✅ **Type Check** - Validates TypeScript types

**Status**: ✅ **READY TO USE** - Just add secrets

### 2. Deploy Workflow (`deploy.yml`)
**Triggers**: Manual dispatch (workflow_dispatch) - Can be changed to auto-deploy on main

**Jobs**:
- 🚀 **Deploy Preview** - Deploys PR previews to Vercel
- 🚀 **Deploy Production** - Deploys main branch to Vercel production

**Status**: ⏸️ **READY BUT DISABLED** - Enable when ready to auto-deploy

---

## Setup Instructions

### Step 1: Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

#### Required for CI (Testing)

```
TEST_SUPABASE_URL=https://xxxxx.supabase.co
TEST_SUPABASE_ANON_KEY=eyJhbGc...
TEST_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
ADMIN_TEST_EMAIL=admin@example.com
ADMIN_TEST_PASSWORD=YourTestPassword123!
```

#### Required for Build

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

#### Optional for Deployment (Vercel)

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=team_xxx or user_xxx
VERCEL_PROJECT_ID=prj_xxx
VERCEL_DEPLOY_HOOK=https://api.vercel.com/v1/integrations/deploy/...
```

### Step 2: Set Up Test Database

1. Create a **separate** Supabase project for testing (don't use production!)
2. Run `supabase-schema.sql` to set up tables
3. Create an admin user for E2E tests:

```sql
-- In Supabase SQL Editor
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('admin@example.com', crypt('YourPassword', gen_salt('bf')), now());

UPDATE profiles
SET is_admin = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');
```

4. Add test database credentials to GitHub secrets

### Step 3: Enable Workflows

The CI workflow is **already enabled** and will run automatically on:
- Every push to `main` or `claude/**` branches
- Every pull request to `main`

### Step 4: (Optional) Enable Auto-Deployment

#### Option A: Vercel GitHub Integration (Recommended - Easiest)

1. Connect your GitHub repo to Vercel:
   - Go to vercel.com → Add New Project
   - Import your GitHub repository
   - Configure environment variables
   - Vercel will automatically deploy on every push to main

2. No workflow changes needed! Vercel handles everything.

#### Option B: Manual Deployment via GitHub Actions

1. Get Vercel credentials:
   ```bash
   # Install Vercel CLI locally
   npm i -g vercel

   # Login and link project
   vercel login
   vercel link

   # Get org and project IDs
   cat .vercel/project.json
   ```

2. Generate Vercel token:
   - Go to vercel.com → Settings → Tokens
   - Create new token
   - Add to GitHub secrets as `VERCEL_TOKEN`

3. Add Vercel IDs to GitHub secrets:
   - `VERCEL_ORG_ID` (from .vercel/project.json)
   - `VERCEL_PROJECT_ID` (from .vercel/project.json)

4. Enable auto-deploy in `deploy.yml`:
   ```yaml
   # Change line 5-6 from:
   # on: workflow_dispatch

   # To:
   on:
     push:
       branches: [ main ]
     workflow_dispatch:
   ```

5. Commit and push - deployments will happen automatically!

#### Option C: Deploy Hook (Simplest)

1. In Vercel project settings, create a Deploy Hook
2. Add URL to GitHub secrets as `VERCEL_DEPLOY_HOOK`
3. In `deploy.yml`, enable the `vercel-integration` job:
   ```yaml
   if: true  # Change from 'false' to 'true'
   ```

---

## Workflow Features

### CI Workflow

#### Test Isolation
- Uses separate test database
- Automatic cleanup after tests
- Parallel job execution for speed

#### Coverage Reporting
- Generates coverage reports
- Uploads to Codecov (optional)
- Viewable in PR comments

#### Artifacts
- Playwright test reports (stored 7 days)
- Build output (stored 7 days)
- Downloadable from Actions tab

#### Speed Optimizations
- npm cache for faster installs
- Only Chromium for E2E (not all browsers)
- Parallel jobs (tests run simultaneously)

### Deploy Workflow

#### Safety Features
- Runs tests before production deploy
- Manual approval for production (via GitHub environments)
- Preview deployments for PRs
- Automatic rollback on failure

#### Preview Deployments
- Every PR gets a preview URL
- Auto-commented on PR
- Test changes before merging

---

## Viewing Results

### Check Workflow Status

1. Go to your GitHub repository
2. Click **Actions** tab
3. See all workflow runs

### Green Checkmark ✅
- All tests passed
- Build succeeded
- Ready to deploy

### Red X ❌
- Click on failed job
- View logs to see what failed
- Fix issue and push again

### Download Artifacts

1. Click on workflow run
2. Scroll to bottom → Artifacts
3. Download test reports or build output

---

## Customization

### Run Only Unit Tests (Faster)

In `ci.yml`, comment out E2E job:
```yaml
# test-e2e:
#   name: E2E Tests
#   ...
```

### Change Node Version

In any workflow:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Change from 18 to 20
```

### Add Slack/Discord Notifications

Add to end of workflow:
```yaml
- name: Notify on success
  if: success()
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
      -H 'Content-Type: application/json' \
      -d '{"text":"✅ CI passed for ${{ github.sha }}"}'
```

### Run on Schedule

Add to `ci.yml`:
```yaml
on:
  push:
    branches: [ main, claude/** ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * 1'  # Every Monday at midnight
```

---

## Troubleshooting

### "Secrets not found"
- Check secrets are added in repository settings
- Secret names must match exactly (case-sensitive)

### "Tests timeout"
- Increase timeout in workflow:
  ```yaml
  timeout-minutes: 30  # Increase from 15
  ```

### "Build fails but works locally"
- Check all environment variables are set in GitHub secrets
- Verify Node version matches local (`node --version`)
- Check `package-lock.json` is committed

### "Playwright browsers not found"
- Ensure `npx playwright install --with-deps` runs
- Add `chromium` flag if only testing one browser

### "Out of GitHub Actions minutes"
- Free tier: 2,000 minutes/month
- Optimize: Skip E2E on non-main branches
- Consider self-hosted runners for unlimited minutes

---

## Cost Optimization

### GitHub Actions Free Tier
- **2,000 minutes/month** for private repos
- **Unlimited** for public repos
- Linux runners are 1x multiplier

### Current Usage (Estimate)
- CI workflow: ~5-8 minutes per run
- Deploy workflow: ~3-5 minutes per run

### Tips to Reduce Minutes
1. Only run E2E on main branch/PRs
2. Cache dependencies aggressively
3. Use `if:` conditions to skip unnecessary jobs
4. Make repo public (if possible) for unlimited minutes

---

## Best Practices

### ✅ DO
- Run tests before every deployment
- Use separate test database
- Cache dependencies
- Set timeouts on jobs
- Use meaningful commit messages (triggers workflows)

### ❌ DON'T
- Use production database for tests
- Commit secrets to code
- Skip tests to "save time"
- Deploy without testing

---

## Example: Full CI/CD Flow

1. **Developer pushes code** to `claude/feature-branch`
2. **CI workflow triggers** automatically
3. **Tests run** in parallel (unit, API, E2E)
4. **Build validates** no compilation errors
5. **Results appear** on commit/PR
6. **PR is approved** and merged to main
7. **Deploy workflow** (if enabled) deploys to production
8. **Vercel serves** new version

All automated! 🚀

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Playwright CI Guide](https://playwright.dev/docs/ci)
- [Vitest CI Integration](https://vitest.dev/guide/cli.html)

---

## Support

If workflows fail, check:
1. Workflow logs in Actions tab
2. Secrets are configured correctly
3. Test database is accessible
4. Dependencies are up to date

For issues, create an issue in this repository.

---

**Last Updated**: GitHub Actions workflows created
**Status**: CI ready, deploy optional
**Maintainer**: Development Team
