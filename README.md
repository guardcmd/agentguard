# GuardCMD AgentGuard

**Secure Git Collaboration for Autonomous AI Agents.** Two real coding sessions work concurrently in isolated Cloudflare Artifacts repositories. GuardCMD reviews each proposal, and a separate reviewer credential approves the exact source and destination commits before a non-forced merge.

[Live dashboard](https://demo.guardcmd.ai) · [Source](https://github.com/guardcmd/agentguard) · [Signup fix comparison](https://github.com/guardcmd/agentguard-demo-signup/pull/1) · [Run instructions](RUN_INSTRUCTIONS.md) · [Architecture](CLOUDFLARE_ARCHITECTURE.md) · [Demo script](DEMO_SCRIPT.md)

## What actually runs

- A Cloudflare Worker serves the dashboard and authenticates mutations.
- A SQLite-backed Durable Object persists tasks and coordinates two independent Workers AI calls to `@cf/qwen/qwen2.5-coder-32b-instruct`.
- Artifacts stores a baseline repository and two actual forks, with real Git commits pushed using `isomorphic-git`.
- The npm-published `guardcmd@0.2.0` engine evaluates an original code-review signal. This is an explainable heuristic review, not a comprehensive vulnerability scanner or a claim of hosted prompt-screening integration.
- Each proposal commits `.agentguard/<agent>.json`: task, role, model, baseline commit, summary, review and inference timing.
- Source and target commits are checked at merge time. File conflicts reject integration; successful merges preserve two-parent Git ancestry and invalidate older approvals.

No prerecorded model responses, fake Git hashes, or mock remote storage run in the deployed app. Unit tests use isolated local Git storage; live tests and their evidence are separate.

## Quick start

Prerequisites: Node.js 22+, npm, a Cloudflare account with **Workers Paid**, access to Artifacts and Workers AI, and Wrangler OAuth or a scoped Cloudflare API token.

```sh
npm ci
npx wrangler login
npm run check
# Create the Artifacts namespace through the REST call in RUN_INSTRUCTIONS.md.
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put REVIEW_TOKEN
npm run deploy
```

Use two different randomly generated secrets of at least 32 characters. Create the namespace through the documented Artifacts REST API; see [run instructions](RUN_INSTRUCTIONS.md). Wrangler 4.149.0 supports listing and inspecting namespaces but does not expose namespace creation.

Open the deployment and select **Workspace access** to enter the operator and reviewer tokens. Tokens remain in tab memory only. Launch a task, inspect both proposals, approve a source/target pair, then merge. The second proposal needs a fresh approval after the first merge changes the target.

The public URL is a read-only evidence viewer without credentials. All prompts, changes and task histories in this demo workspace are public; use only non-sensitive sample tasks.

## Test and reproduce

```sh
npm run typecheck
npm test
npx wrangler deploy --dry-run
node scripts/ui-check.mjs
node scripts/live-check.mjs
# Wait for both agents to finish, then:
node scripts/merge-check.mjs
```

The live scripts read locally supplied credentials from `evidence/private/secrets.json` (ignored by Git), shaped as `{"ADMIN_TOKEN":"...","REVIEW_TOKEN":"..."}`. They operate only on a newly created sample task. Automated test approvals validate the protocol and are not represented as a human code review. Set `AGENTGUARD_URL` to your own deployment.

## Scope and limits

The bounded prototype creates an original Harbor Tasks utility or an intentionally flawed signup fixture for each task. It does not import arbitrary private code, execute generated code in the Worker, install model-selected packages, or grant a model credentials or shell access. It allows one task at a time with two concurrent sessions, at most 20 tasks per deployment workspace, eight changed files and 64 KB of generated text per proposal. File-level conflict checks are conservative; there is no automatic conflict resolution. Errors remain visible in task history.

GuardCMD starts in **shadow mode**: risky proposals are flagged but the decision alone does not block a human-approved merge. Change `GUARD_MODE` to `enforce` and redeploy to enforce block/challenge/throttle; `review` remains permitted with explicit review. The separate approval requirement applies in both modes.

Durable Object alarms provide background execution. An alarm retry after an interrupted run marks it failed instead of duplicating inference or a Git push. An uncertain remote merge failure may require inspecting Git history before further work; the app will not force push to conceal the state.

MIT license. This standalone project depends on the public GuardCMD package and contains no private GuardCMD production application source.
