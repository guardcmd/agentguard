# Run AgentGuard

## Account setup

Cloudflare Artifacts requires Workers Paid. Pricing documentation says Artifacts operation/storage billing begins October 14, 2026. Paid Workers has its own base fee and usage limits. Review current [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) and [Artifacts pricing](https://developers.cloudflare.com/artifacts/platform/pricing/) before enabling services.

1. Install Node 22 or later and run `npm ci` in this directory.
2. Authenticate using `npx wrangler login` or a `CLOUDFLARE_API_TOKEN` with Workers, Artifacts, Durable Objects and Workers AI access.
3. Create the namespace named in `wrangler.jsonc` through the documented REST API:

```sh
curl "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/artifacts/namespaces" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"namespace":"agentguard-competition"}'
```

4. Set `ADMIN_TOKEN` and `REVIEW_TOKEN` with `npx wrangler secret put NAME`. Use separate random strings of at least 32 characters; never put these values in Git, URLs, screenshots or a recording.
5. For your own account, remove or replace the `routes` entry in `wrangler.jsonc`; `demo.guardcmd.ai` belongs to this submission. Choose your own Worker name/namespace if needed. Run `npm run check`, then `npm run deploy`. For local development, put secrets in ignored `.dev.vars` and run `npm run dev`. Artifacts/AI access may use remote resources and incur usage; the deployed test is the authoritative remote integration check.

## Environment

| Name | Purpose |
| --- | --- |
| `ADMIN_TOKEN` | Worker secret; authorizes task launch and security probes |
| `REVIEW_TOKEN` | Worker secret; authorizes approval and merge; never passed to either model |
| `GUARD_MODE` | `shadow` by default, or `enforce` |
| `AI_MODEL` | Workers AI coding model; default Qwen2.5-Coder-32B |
| `ARTIFACTS` | Workers binding to the isolated namespace |
| `WORKSPACE` | SQLite Durable Object binding |
| `AI` | Workers AI binding |
| `ASSETS` | Dashboard static-assets binding |
| `AGENTGUARD_URL` | Optional local script override for deployment URL |

No OpenAI key, hosted GuardCMD API key, Railway credential or private repository token is needed by the deployed application.

## Multi-agent demonstration

The default signup task pairs an implementation agent with a quality agent to integrate the public GuardCMD SDK in shadow mode. Its captured scan is linked in the dashboard. Select Harbor Tasks for the general task-title and unique-ID exercise. Both calls receive the same baseline but different roles. The dashboard shows actual start/end times and their interval overlap, independent repository names, and full commit IDs.

Inspect changes. Review warnings as advisory in shadow mode. Approve and merge the implementation, then approve the quality proposal against the new target and merge it. Read Git history to see the resulting commits.

For a conflict: ask **both agents to edit `src/tasks.js`**, with the builder using an error message `Builder validation` and the verifier using `Verifier validation`. Each is a real model proposal, so inspect the actual outcome. Merge one, then approve the other against the new target. If both changed the same file differently, merge returns HTTP 409 and the target stays unchanged.

The security probe evaluates a labeled example containing a destructive shell operation. The snippet is never executed or committed. GuardCMD reports `block` risk with `enforced:false` under the default policy. This demonstrates flagging, not falsely claiming a shadow-mode block.

## REST routes

| Route | Access | Behavior |
| --- | --- | --- |
| `GET /api/status` | Public | Configuration, not proof of successful remote operations |
| `GET /api/tasks` | Public | Persisted demo task evidence |
| `GET /api/tasks/:id` | Public | Task, changes, reviews and timing |
| `GET /api/tasks/:id/history` | Public | Reads actual Artifacts Git history |
| `POST /api/tasks` | Operator | `{ "prompt": "...", "scenario": "signup" }`; returns 202; omit scenario for Harbor Tasks |
| `POST /api/review-example` | Operator | Runs an actual SDK review on a labeled test snippet |
| `POST /api/tasks/:id/approve` | Reviewer | `{ "agentId": "builder", "head": "...", "targetHead": "..." }` |
| `POST /api/tasks/:id/merge` | Reviewer | Same body; requires matching stored approval |

All mutation credentials use `Authorization: Bearer ...`. Cross-origin browser writes are rejected. Bodies are bounded while streaming. Read-only visibility is intentional for this public sample workspace; multi-tenant/private deployment would need per-user access control.

## Cleanup

No command automatically deletes repositories or production resources. When finished, inspect the `agentguard-competition` namespace and the `guardcmd-agentguard` Worker and explicitly remove only those resources if no longer needed. Keep the submission deployment available for judging. Account billing is shared with other applications, so do not cancel the account plan without checking their requirements.

## Video production

The recording workflow follows the real-browser capture approach inspected in the owner's RRenderAI recording scripts. The competition automation is original: it drives the live dashboard in real time, captures actual cloud activity and adds explanatory captions in a separate bottom band. It does not intercept responses, replace repository evidence or accelerate the model clock.

Install Playwright's Chromium if needed with `npx playwright install chromium`. Populate the ignored credential file described above; retain successful signup/conflict evidence files. Run `node scripts/record-demo.mjs`, then `node scripts/encode-demo.mjs` with FFmpeg/ffprobe on PATH. The recording deliberately performs real sample approvals and merges and consumes one task from the 20-task budget. The MP4 stays local and is excluded from Git; the entrant uploads it through the competition form.

The delivered film encountered a genuine conflict on its second proposal. `scripts/continue-demo.mjs` is the case-specific continuation used for that recording; its 307-second cut removes only idle timeout footage. It explicitly distinguishes the conflicting task from previously verified successful integration. See DEMO_SCRIPT.md and IMPLEMENTATION_REPORT.md for the actual outcome.
