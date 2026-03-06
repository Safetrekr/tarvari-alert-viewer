# WS-6.4: GitHub Actions Deployment Workflow

> **Workstream ID:** WS-6.4
> **Phase:** 6 -- Public Deployment
> **Assigned Agent:** `devops-platform-engineer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-6.3
> **Blocks:** None
> **Resolves:** None

## 1. Objective

Create a GitHub Actions workflow at `.github/workflows/deploy-pages.yml` that builds the TarvaRI Alert Viewer as a Next.js static export and deploys it to GitHub Pages on every push to `main`.

The workflow must:

1. Build in `supabase` data mode (`NEXT_PUBLIC_DATA_MODE=supabase`) so the public viewer reads directly from Supabase via the anon key and RLS -- no TarvaRI backend required.
2. Inject Supabase credentials from GitHub repository secrets at build time (these are `NEXT_PUBLIC_*` env vars baked into the static bundle, which is acceptable because the anon key is designed for public client-side use and all data access is governed by Row Level Security).
3. Resolve the `@tarva/ui` workspace dependency in CI, where the sibling `../../tarva-ui-library` path does not exist. This is the most significant technical challenge and depends on the resolution strategy chosen by WS-6.3.
4. Deploy the `out/` directory (Next.js static export output) to GitHub Pages using the official GitHub Pages deployment actions.
5. Cache pnpm store and Next.js build cache between runs to keep deployment times under 3 minutes.

This is the only workstream in the project assigned to the `devops-platform-engineer` agent. It is a pure CI/CD concern with no application code changes.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| Workflow file | `.github/workflows/deploy-pages.yml` -- complete GitHub Actions workflow definition. |
| Trigger configuration | Push to `main` branch. Manual dispatch (`workflow_dispatch`) for re-deployment without code changes. |
| Node 22 + pnpm setup | `actions/setup-node@v4` with Node 22 and pnpm caching. `pnpm/action-setup` for pnpm installation. |
| pnpm store caching | Cache `~/.local/share/pnpm/store/v3` (or pnpm's store path output) between runs to avoid re-downloading dependencies. |
| Next.js build cache | Cache `.next/cache` between runs to enable incremental build performance (maps to `out/` in export mode but `.next/cache` is the optimization layer). |
| Build environment variables | `NEXT_PUBLIC_DATA_MODE=supabase`, `NEXT_PUBLIC_SUPABASE_URL` (from secrets), `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from secrets). |
| @tarva/ui CI resolution | Document the expected contract from WS-6.3 and implement the CI-side steps required by whichever resolution strategy WS-6.3 selects (see Decision D-2). |
| GitHub Pages deployment | `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages` -- the official GitHub Pages deployment flow using GitHub's artifact-based deployment. |
| GitHub Pages environment | Configure the `github-pages` environment with the deployment URL for status checks and environment protection rules. |
| Base path configuration | Set `NEXT_PUBLIC_BASE_PATH` if the repo is deployed to a subpath (e.g., `https://org.github.io/tarvari-alert-viewer/`). Consumed by `next.config.ts` (expected from WS-6.3). |
| Repository settings documentation | Document the one-time manual steps: enable GitHub Pages with "GitHub Actions" source in repository settings, create `SUPABASE_URL` and `SUPABASE_ANON_KEY` repository secrets. |
| Concurrency control | Use `concurrency` key to cancel in-progress deployments when a new push arrives, preventing stale deployments from completing after a newer one has started. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| `next.config.ts` changes | WS-6.3 owns the static export configuration (`output: 'export'`, `basePath`, conditional logic). This workstream consumes whatever config WS-6.3 produces. |
| Data mode branching in hooks | WS-6.1 implements the `NEXT_PUBLIC_DATA_MODE` switch logic in data hooks. This workstream only sets the environment variable at build time. |
| Supabase query functions | WS-6.2 builds the Supabase query layer. This workstream is unaware of application data fetching. |
| @tarva/ui library changes | If @tarva/ui needs to be published to npm, vendored, or restructured, that is WS-6.3 scope. This workstream implements the CI steps to consume the result. |
| Preview deployments for PRs | A pull request preview environment (e.g., deploy previews on Vercel or Netlify) is a future enhancement. This workstream covers production deployment to Pages only. |
| Custom domain configuration | DNS and custom domain setup for GitHub Pages is a post-deployment operational task, not part of the CI workflow. |
| CDN cache invalidation | GitHub Pages handles cache headers automatically. No custom CDN configuration is needed. |
| Monitoring or health checks | Post-deployment URL validation (e.g., curl the deployed site) could be added later but is not in scope for the initial workflow. |
| Branch-based environments | Only `main` triggers deployment. Staging/preview environments are deferred. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-6.3 deliverables | Static export configuration in `next.config.ts`: `output: 'export'` (conditional or unconditional), `basePath` handling, and the @tarva/ui CI resolution strategy. The workflow must know: (a) whether `pnpm install` will succeed in CI without the sibling directory, and (b) whether any pre-build steps are needed for @tarva/ui. | Pending (WS-6.3) |
| `package.json` `build` script | Currently `next build --webpack`. WS-6.3 may add an export-specific script (e.g., `build:export`). The workflow will call whichever script produces the `out/` directory. | Available [CODEBASE], may be modified by WS-6.3 |
| `.env.example` | Documents required environment variables. Currently lists `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_TARVARI_API_URL`. WS-6.1 will add `NEXT_PUBLIC_DATA_MODE`. | Available [CODEBASE], will be extended by WS-6.1 |
| GitHub repository access | Repository must have GitHub Pages enabled with source set to "GitHub Actions" (not "Deploy from a branch"). This is a one-time manual configuration. | Manual setup required |
| GitHub repository secrets | `SUPABASE_URL` and `SUPABASE_ANON_KEY` must be created as repository secrets. These map to `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the workflow env block. | Manual setup required |
| `pnpm-workspace.yaml` | Currently references `'../../tarva-ui-library'`. WS-6.3 will either modify this for CI compatibility or provide an alternative resolution mechanism. | Available [CODEBASE], may be modified by WS-6.3 |
| `next.config.ts` | Currently contains only `transpilePackages: ['@tarva/ui']`. WS-6.3 will add export configuration. The workflow does not modify this file but must align with its expectations. | Available [CODEBASE], will be modified by WS-6.3 |

## 4. Deliverables

### 4.1 Workflow File -- `.github/workflows/deploy-pages.yml`

**File:** `.github/workflows/deploy-pages.yml` (new file)

The complete GitHub Actions workflow for building and deploying to GitHub Pages. The structure follows GitHub's recommended pattern for static site deployment with artifact-based Pages publishing.

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      # --- @tarva/ui resolution (see D-2 for strategy variants) ---
      # WS-6.3 will determine which steps are needed here.
      # Placeholder: the pnpm install step below must succeed.

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build static export
        env:
          NEXT_PUBLIC_DATA_MODE: supabase
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: pnpm build

      - name: Configure Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Key design choices in the workflow:**

**Trigger:** Push to `main` plus `workflow_dispatch`. The `workflow_dispatch` trigger allows manual re-deployment (e.g., after rotating Supabase keys or after a GitHub Pages configuration change) without requiring a code commit.

**Permissions:** The `permissions` block is set to minimum required: `contents: read` (checkout), `pages: write` (deploy), `id-token: write` (Pages OIDC authentication). This follows the principle of least privilege. The default `GITHUB_TOKEN` permissions are restricted -- only the three required scopes are granted.

**Concurrency:** The `concurrency` group `pages` with `cancel-in-progress: true` ensures that if two pushes land in quick succession, the first deployment is cancelled and only the latest commit is deployed. This prevents a stale deployment from overwriting a newer one if the first build happens to finish later (unlikely but possible with retry logic).

**Two-job split (build + deploy):** The build and deploy are separate jobs because the `actions/deploy-pages` action requires the `github-pages` environment, which may have protection rules (e.g., required reviewers for production). Separating the jobs allows the build to proceed immediately while the deployment waits for any environment approvals. It also produces clearer CI logs -- build failures are distinct from deployment failures.

**`--frozen-lockfile`:** The `pnpm install` step uses `--frozen-lockfile` to ensure CI installs exactly the versions recorded in `pnpm-lock.yaml`. If the lockfile is out of sync with `package.json`, the build fails explicitly rather than silently resolving different versions. This is a CI best practice for reproducible builds.

**Build environment variables:** The three `NEXT_PUBLIC_*` variables are set in the `env` block of the build step, not as repository-level environment variables. This keeps the build-time injection explicit and visible in the workflow file. The `NEXT_PUBLIC_` prefix causes Next.js to inline these values into the client-side JavaScript bundle at build time -- they are not runtime secrets.

**Output directory:** `out` is the default output directory for Next.js static export (`output: 'export'` in `next.config.ts`). The `upload-pages-artifact` action uploads this directory as a GitHub Pages artifact.

---

### 4.2 pnpm Caching Strategy

**Mechanism:** The `actions/setup-node@v4` action with `cache: pnpm` automatically detects the pnpm lockfile and caches the pnpm store directory between workflow runs. This is the recommended approach -- no manual `actions/cache` step is needed.

**How it works:**

1. `pnpm/action-setup@v4` installs pnpm (version detected from `package.json` `packageManager` field or the action's `version` input).
2. `actions/setup-node@v4` with `cache: pnpm` computes a cache key from the hash of `pnpm-lock.yaml` and restores the pnpm store from a previous run if the key matches.
3. `pnpm install --frozen-lockfile` is nearly instant on cache hit because all packages are already in the store -- only linking is needed.

**Cache invalidation:** The cache key is derived from `pnpm-lock.yaml`. Any dependency change that modifies the lockfile produces a new cache key, triggering a full download on the next run. This is correct behavior -- stale caches with wrong dependency versions are worse than a cold cache.

**Next.js build cache:** The Next.js build cache (`.next/cache`) is NOT cached between runs in this workflow. For a static export, the build cache provides minimal benefit because the output is a full static site generation, not an incremental server build. If build times become a concern (unlikely for this project's ~30 components), a manual `actions/cache` step for `.next/cache` can be added later.

**Expected install + build time:**
- Cold cache: ~90-120 seconds (pnpm download + install + Next.js build)
- Warm cache: ~30-60 seconds (pnpm link only + Next.js build)

---

### 4.3 @tarva/ui Resolution in CI -- Contract with WS-6.3

The `@tarva/ui` package is declared as `"@tarva/ui": "workspace:*"` in `package.json`, resolved via `pnpm-workspace.yaml` which points to `../../tarva-ui-library`. In GitHub Actions CI, this sibling directory does not exist. The `pnpm install --frozen-lockfile` step will fail unless one of the following strategies is implemented by WS-6.3.

**Strategy A -- Vendored tarball (recommended for simplicity)**

WS-6.3 pre-builds `@tarva/ui` and commits a tarball (e.g., `vendor/tarva-ui-0.1.0.tgz`) to the repository. The `package.json` dependency changes from `workspace:*` to `file:vendor/tarva-ui-0.1.0.tgz`, and `pnpm-workspace.yaml` is conditionally adjusted or the workspace reference is removed in favor of the file reference.

CI workflow impact: None beyond standard `pnpm install`. The tarball is part of the checkout.

Tradeoff: The tarball must be regenerated whenever `@tarva/ui` changes. Adds ~200-500KB to the repository. Requires a discipline of running `pnpm --filter @tarva/ui pack` and committing the result.

**Strategy B -- CI-time checkout of tarva-ui-library**

The workflow checks out the `tarva-ui-library` repository into the expected relative path (`../../tarva-ui-library`) before running `pnpm install`. This requires `tarva-ui-library` to be a separate GitHub repository (or a subdirectory of a parent monorepo that can be sparse-checked-out).

CI workflow impact: Additional checkout step:

```yaml
- name: Checkout @tarva/ui library
  uses: actions/checkout@v4
  with:
    repository: org/tarva-ui-library
    path: ../../tarva-ui-library
```

Tradeoff: Requires `tarva-ui-library` to be accessible as a GitHub repository. The CI runner's filesystem allows writing to `../../` relative to the workspace. The `pnpm-workspace.yaml` reference `../../tarva-ui-library` works as-is.

**Strategy C -- npm publish @tarva/ui**

WS-6.3 publishes `@tarva/ui` to a private npm registry (GitHub Packages, npm, or Verdaccio). The `package.json` dependency changes from `workspace:*` to a semver range (e.g., `^0.1.0`). The `pnpm-workspace.yaml` workspace reference is removed.

CI workflow impact: May require an `.npmrc` with authentication token for private registry access. If published to GitHub Packages, a `NODE_AUTH_TOKEN` secret is needed.

Tradeoff: Most production-ready approach. Requires npm org/registry setup, version management, and a publish workflow for `tarva-ui-library`. Highest upfront cost.

**Strategy D -- Conditional pnpm-workspace.yaml with overrides**

WS-6.3 modifies the install process to detect CI (via `CI=true` environment variable) and uses pnpm `overrides` or `pnpm.overrides` in `package.json` to redirect `@tarva/ui` to a pre-built tarball or a git URL. The `pnpm-workspace.yaml` is either removed in CI or made conditional.

CI workflow impact: The workflow may need to run a pre-install script (e.g., `node scripts/ci-prepare.js`) that adjusts the workspace configuration.

Tradeoff: More complex than Strategy A but avoids committing a tarball. Requires careful testing of the conditional logic.

**This SOW does not choose the strategy.** WS-6.3 owns this decision. However, the workflow file must accommodate the result. Deliverable 4.1 includes a placeholder comment (`# --- @tarva/ui resolution ---`) where the strategy-specific steps will be inserted once WS-6.3 is complete.

---

### 4.4 Repository Configuration Documentation

One-time manual steps required before the workflow can run. These are NOT automated by the workflow and must be performed by a repository administrator.

**Step 1 -- Enable GitHub Pages with Actions source:**

1. Navigate to repository Settings > Pages.
2. Under "Build and deployment", set Source to "GitHub Actions".
3. This replaces the default "Deploy from a branch" setting and enables the `actions/deploy-pages` action to publish artifacts.

**Step 2 -- Create repository secrets:**

| Secret Name | Value | Where to Find |
|-------------|-------|---------------|
| `SUPABASE_URL` | The project's Supabase URL (e.g., `https://xyzproject.supabase.co`) | Supabase dashboard > Project Settings > API > Project URL |
| `SUPABASE_ANON_KEY` | The project's Supabase anon/public key | Supabase dashboard > Project Settings > API > anon public key |

Navigate to repository Settings > Secrets and variables > Actions > New repository secret.

**Security note:** The anon key is designed for client-side use. It is NOT a service role key. All data access is governed by Row Level Security (RLS) policies on the Supabase database. The anon key is functionally equivalent to the key already embedded in the local `.env.local` file -- it grants the same access a browser user would have. Storing it as a GitHub secret prevents it from appearing in the repository's commit history, which is good hygiene but not a security-critical concern.

**Step 3 -- Verify repository permissions:**

The workflow uses `permissions: pages: write` and `id-token: write`. If the repository has restricted default permissions (Settings > Actions > General > Workflow permissions), ensure "Read and write permissions" is enabled, or rely on the explicit `permissions` block in the workflow file (which overrides the default).

---

### 4.5 Base Path Handling

GitHub Pages deploys to `https://<owner>.github.io/<repo-name>/` for project repositories. This means all asset paths must be prefixed with `/<repo-name>/`. Next.js handles this via the `basePath` configuration in `next.config.ts`.

**Expected WS-6.3 configuration in `next.config.ts`:**

```typescript
const nextConfig: NextConfig = {
  output: 'export',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  transpilePackages: ['@tarva/ui'],
}
```

**Workflow integration:**

The build step sets `NEXT_PUBLIC_BASE_PATH` as an environment variable:

```yaml
env:
  NEXT_PUBLIC_BASE_PATH: /tarvari-alert-viewer
```

If the repository name differs from `tarvari-alert-viewer`, this value must be updated. Alternatively, the value can be derived dynamically:

```yaml
env:
  NEXT_PUBLIC_BASE_PATH: /${{ github.event.repository.name }}
```

This dynamic approach is more portable but assumes the repository name matches the desired URL path segment. The static value is preferred for predictability.

**Impact on asset loading:** `basePath` affects `next/image`, `next/link`, and all static asset paths. CSS `url()` references and MapLibre GL tile URLs are NOT affected by `basePath` -- they use absolute URLs. The `@tarva/ui/styles.css` import is a build-time resolution (not a runtime URL) and is unaffected.

---

### 4.6 Summary of All Deliverables

| Deliverable | Type | File Path |
|-------------|------|-----------|
| GitHub Actions workflow | YAML (new file) | `.github/workflows/deploy-pages.yml` |
| Repository configuration docs | Section in this SOW (4.4) | Reference only -- no file output |
| @tarva/ui CI contract | Section in this SOW (4.3) | Reference only -- implemented in workflow after WS-6.3 |

### 4.7 Changed Lines Summary

| File | Lines | Nature |
|------|-------|--------|
| `.github/workflows/deploy-pages.yml` | ~55-75 lines (new file) | Complete workflow definition |

No existing files are modified. One new file is created.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `.github/workflows/deploy-pages.yml` exists and is valid YAML. | `yamllint .github/workflows/deploy-pages.yml` or GitHub Actions syntax validation on push. |
| AC-2 | Workflow triggers on push to `main` branch. | Push a commit to `main` and verify the workflow appears in the Actions tab. |
| AC-3 | Workflow triggers on manual `workflow_dispatch`. | Click "Run workflow" in the Actions tab and verify the workflow starts. |
| AC-4 | Workflow uses Node.js 22 (matching the `engines` field in `package.json`). | Check the "Setup Node.js" step output in the Actions log for `v22.x.x`. |
| AC-5 | Workflow uses pnpm (never npm or yarn). | Check the "Install dependencies" step uses `pnpm install`, not `npm install`. |
| AC-6 | `pnpm install --frozen-lockfile` succeeds in CI without the `../../tarva-ui-library` sibling directory (requires WS-6.3 resolution strategy). | Green CI build. The install step does not fail with a workspace resolution error. |
| AC-7 | Build step sets `NEXT_PUBLIC_DATA_MODE=supabase` as an environment variable. | Inspect the workflow YAML; verify the env block on the build step. |
| AC-8 | Build step injects `NEXT_PUBLIC_SUPABASE_URL` from the `SUPABASE_URL` repository secret. | Inspect the workflow YAML; verify `${{ secrets.SUPABASE_URL }}` mapping. |
| AC-9 | Build step injects `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the `SUPABASE_ANON_KEY` repository secret. | Inspect the workflow YAML; verify `${{ secrets.SUPABASE_ANON_KEY }}` mapping. |
| AC-10 | Secrets do not appear in workflow logs. | Check the Actions log for masked values (`***`) in the build output. GitHub Actions automatically masks secrets referenced via `${{ secrets.* }}`. |
| AC-11 | `pnpm build` produces an `out/` directory containing the static export. | Check the build step output and the upload artifact step (which reads from `out/`). |
| AC-12 | The `out/` directory is uploaded as a GitHub Pages artifact. | Verify the "Upload artifact" step completes successfully in the Actions log. |
| AC-13 | The deployment step publishes the artifact to GitHub Pages. | Verify the "Deploy to GitHub Pages" step completes and outputs a `page_url`. |
| AC-14 | The deployed site is accessible at the GitHub Pages URL. | Open the URL from the deployment step output and verify the page loads. |
| AC-15 | The deployed site renders the alert viewer (not a blank page or error). Category grid, map, or login page is visible depending on auth state. | Manual visual verification after first deployment. |
| AC-16 | Concurrent pushes to `main` cancel in-progress deployments. | Push two commits in rapid succession; verify only the latest deployment completes (earlier one shows "cancelled"). |
| AC-17 | pnpm dependency cache is populated on first run and restored on subsequent runs. | Check the "Setup Node.js" step for "Cache hit" on the second workflow run after a cache-populating first run. |
| AC-18 | `pnpm typecheck` passes (if included as a pre-build validation step). | Optional: add `pnpm typecheck` before `pnpm build`. If added, verify it passes. |
| AC-19 | The workflow `permissions` block requests only `contents: read`, `pages: write`, and `id-token: write`. | Code review of the workflow YAML. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|-------------------------|
| D-1 | Use GitHub's official Pages deployment actions (`actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`) instead of third-party actions like `peaceiris/actions-gh-pages`. | The official actions are maintained by GitHub, integrate with the Pages environment and deployment status system, support OIDC authentication (no PAT needed), and produce deployment URLs in the Actions UI. Third-party actions require a PAT or deploy key, push to a `gh-pages` branch (adding noise to the repo), and do not integrate with GitHub's environment/deployment tracking. | `peaceiris/actions-gh-pages@v4` -- rejected because it pushes to a branch (not artifact-based), requires a PAT or deploy key, and does not integrate with GitHub Environments. Direct `gh-pages` branch push via custom script -- rejected for the same reasons plus additional maintenance burden. |
| D-2 | Do not choose the @tarva/ui CI resolution strategy in this SOW. Defer to WS-6.3 and document the contract between the two workstreams. | WS-6.3 is owned by the `react-developer` agent and involves application-level decisions about how the workspace dependency is structured. The CI workflow must accommodate the result, not dictate it. By documenting all four strategies (A-D) and their CI impact, WS-6.3 has full context to make the right choice. | Choose Strategy B (CI-time checkout) now and let WS-6.3 conform -- rejected because it assumes `tarva-ui-library` is a separate GitHub repository, which may not be true. Choose Strategy A (vendored tarball) now -- rejected because it imposes a workflow constraint on the react-developer without their input. |
| D-3 | Use `pnpm/action-setup@v4` for pnpm installation instead of manually curling the pnpm binary or using `corepack enable`. | `pnpm/action-setup` is the official pnpm GitHub Action, handles version detection from `package.json`'s `packageManager` field (if present), and integrates cleanly with `actions/setup-node`'s cache detection. `corepack enable` is an alternative but has known issues with pnpm version pinning in CI and does not integrate as cleanly with the cache action. | `corepack enable && corepack prepare pnpm@latest --activate` -- rejected because corepack's pnpm support has had stability issues in CI environments and does not integrate with `actions/setup-node` cache detection. Manual install via `curl -fsSL https://get.pnpm.io/install.sh | sh` -- rejected because it adds complexity, does not integrate with cache, and version pinning is manual. |
| D-4 | Map repository secrets `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the build step's `env` block, rather than using identically named secrets. | The repository secrets use shorter names without the `NEXT_PUBLIC_` prefix because (a) the prefix is a Next.js-specific convention that does not belong in the repository's secret naming scheme, and (b) it makes the workflow's intent clearer -- the reader sees the mapping from "repository secret" to "build-time environment variable" explicitly. Using identically named secrets (e.g., secret `NEXT_PUBLIC_SUPABASE_URL` mapped to env `NEXT_PUBLIC_SUPABASE_URL`) would work but obscures the fact that a mapping is happening. | Identically named secrets (`NEXT_PUBLIC_SUPABASE_URL`) -- rejected for readability reasons described above. Repository-level environment variables (Settings > Environments > Variables) instead of secrets -- rejected because these are visible in logs and the Actions UI. While the anon key is not truly secret, treating it as a secret is better hygiene and costs nothing. |
| D-5 | Split the workflow into two jobs (`build` and `deploy`) instead of a single job. | Two jobs enable: (a) environment protection rules on the `deploy` job (e.g., required reviewers before production deployment), (b) cleaner log separation between build failures and deployment failures, (c) the `deploy` job's `environment` block produces a deployment URL in the GitHub UI that links to the `github-pages` environment. A single-job workflow would work but loses the environment integration. | Single job with all steps -- rejected because it cannot use the `environment` key (which produces the deployment URL) alongside build steps without also applying environment protection rules to the build. This would block the build behind approval if protection rules are later added. |
| D-6 | Include `workflow_dispatch` trigger for manual re-deployment. | Operational scenarios that require re-deployment without code changes: (a) Supabase credentials rotated -- new secret values need to be baked into the build, (b) GitHub Pages configuration changed, (c) a deployment failed due to transient infrastructure issues and needs a retry. Without `workflow_dispatch`, the only way to trigger re-deployment is an empty commit or a force-push. | No manual trigger -- rejected because credential rotation is a realistic operational need. Separate "re-deploy" workflow -- rejected because it would duplicate the entire build/deploy logic. |
| D-7 | Set base path statically as `/tarvari-alert-viewer` rather than dynamically via `${{ github.event.repository.name }}`. | Static values are predictable and reviewable. The repository name is unlikely to change, and if it does, the workflow should be intentionally updated to reflect the new path. Dynamic derivation introduces a subtle failure mode: if the repository is renamed, the base path changes silently, which could break bookmarked URLs or cached service worker paths. | Dynamic `/${{ github.event.repository.name }}` -- rejected because it hides the base path value from code review and creates a silent breaking change on repository rename. Environment variable from repository settings -- rejected because it adds a configuration step without meaningful benefit. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Which @tarva/ui CI resolution strategy will WS-6.3 select? The workflow has a placeholder for strategy-specific steps. Once WS-6.3 is complete, the workflow must be updated to include the required pre-install steps (if any). Strategies A and D require no workflow changes beyond standard `pnpm install`. Strategies B and C require additional steps (checkout or registry auth). | react-developer (WS-6.3) | Phase 6 implementation |
| OQ-2 | What is the exact repository name for GitHub Pages base path? This SOW assumes `tarvari-alert-viewer`. If the GitHub repository has a different name, the `NEXT_PUBLIC_BASE_PATH` value in the workflow must be updated. | Repository owner | Before first deployment |
| OQ-3 | Should the workflow include `pnpm typecheck` and `pnpm lint` as pre-build validation steps? Adding these steps increases build time by ~15-30 seconds but catches type errors and lint violations before they reach production. The SOW includes this as an optional enhancement (AC-18). | devops-platform-engineer | Implementation |
| OQ-4 | Does the deployed site need the passphrase auth gate? If the public viewer should be accessible without login, WS-6.3 or WS-6.1 may need to conditionally disable the auth guard in public mode. This does not affect the workflow, but it affects the deployed site's behavior. | react-developer | WS-6.1 / WS-6.3 |
| OQ-5 | Is `tarva-ui-library` in the same GitHub organization as `tarvari-alert-viewer`? If Strategy B (CI-time checkout) is chosen, the checkout action needs either (a) the repositories to be in the same org with default token access, or (b) a PAT or SSH deploy key for cross-org/private repo access. | Repository owner | WS-6.3 decision |
| OQ-6 | Should the `ANTHROPIC_API_KEY` be available in the public build? The `.env.example` documents an optional `ANTHROPIC_API_KEY` for Claude-powered features. For the public GitHub Pages deployment, this key should NOT be included (it is a real secret, unlike the Supabase anon key). Confirm that WS-6.1's data mode branching excludes AI features in `supabase` mode, or that the application gracefully degrades without the key. | react-developer (WS-6.1) | Phase 6 implementation |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | `@tarva/ui` workspace resolution fails in CI. `pnpm install --frozen-lockfile` exits with an error because `../../tarva-ui-library` does not exist on the CI runner. This is the most critical risk and is flagged as a HIGH validation finding in the project plan. | High (if WS-6.3 is incomplete) | Build-blocking | WS-6.3 must resolve this before WS-6.4 can produce a working build. The workflow includes a placeholder for the resolution steps. Four strategies are documented (Deliverable 4.3) with CI impact analysis for each. If WS-6.3 is delayed, the workflow can be merged as-is (it is valid YAML) and will fail at the install step with a clear error message pointing to the workspace dependency. |
| R-2 | GitHub repository secrets not configured. The build runs but `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are empty strings. The deployed site loads but cannot fetch data from Supabase. | Medium | Deployed site is non-functional (no data) | The repository configuration documentation (Deliverable 4.4) provides step-by-step instructions for creating the secrets. An optional build-time check could be added: `if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then echo "::error::SUPABASE_URL secret not configured"; exit 1; fi`. |
| R-3 | GitHub Pages not enabled or not set to "GitHub Actions" source. The build succeeds but the deploy step fails with a permissions error or "Pages not enabled" message. | Medium | Deployment fails (build succeeds) | The repository configuration documentation (Deliverable 4.4) includes the one-time setup step. The error message from `actions/deploy-pages` is clear and actionable. |
| R-4 | Base path mismatch. The `NEXT_PUBLIC_BASE_PATH` in the workflow does not match the actual repository name, causing all asset paths (JS, CSS, images) to 404 on the deployed site. The page loads as a blank white screen or with broken styles. | Low | Deployed site is broken (blank page) | The base path is set statically (D-7) and matches the assumed repository name. If the repository name differs, the value must be updated. A post-deployment smoke test (out of scope, see future enhancements) would catch this immediately. |
| R-5 | Next.js static export fails due to unsupported features. If any page or component uses server-side features (API routes, `getServerSideProps`, dynamic server components), `output: 'export'` will fail. | Low (WS-6.3 scope) | Build fails | WS-6.3 is responsible for verifying that the static export succeeds. The existing codebase uses client-side rendering with `next/dynamic` and TanStack Query -- no server-side data fetching. MapLibre GL is loaded with `ssr: false`. The risk is low. |
| R-6 | pnpm cache key collision. If `pnpm-lock.yaml` is modified by WS-6.3 (e.g., changing `@tarva/ui` from `workspace:*` to `file:vendor/...`), the old cache becomes stale but the cache key changes automatically (it is derived from the lockfile hash). | Very Low | None (self-healing) | No mitigation needed. Cache keys are derived from `pnpm-lock.yaml` content hash, so any lockfile change automatically invalidates the cache. |
| R-7 | Supabase anon key exposed in the deployed JavaScript bundle. Since `NEXT_PUBLIC_*` variables are inlined at build time, the anon key is visible in the browser's network tab and in the static JS files. | N/A (by design) | None | The Supabase anon key is designed for public client-side use. It is the same key that any user of the Supabase JS client would have. All data access is governed by RLS policies on the database. The key grants read access to public views only (created by backend Phase E.1). This is the documented security model for Supabase public clients. |
| R-8 | Workflow runs on every push to `main`, including documentation-only changes. This wastes CI minutes on builds that produce identical output. | Low | Wasted CI minutes (~2-3 min per run) | Acceptable for the expected push frequency to `main`. If CI minutes become a concern, add `paths-ignore: ['docs/**', '*.md', 'LICENSE']` to the push trigger to skip documentation-only commits. Not included by default to avoid accidentally skipping builds when a doc change accompanies a code change. |
