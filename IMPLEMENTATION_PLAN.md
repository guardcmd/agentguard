# AgentGuard implementation plan

Isolated branch: `codex/agentguard-competition`. Only this directory is intended for competition publication; no parent repository history or private platform source belongs in the public package.

1. Verify published GuardCMD 0.2.0 interfaces, Cloudflare binding methods, and local infrastructure authorization.
2. Build a separate Worker and Durable Object coordinator, with authenticated mutations and read-only public demo evidence.
3. Seed a small original repository, fork it twice in Artifacts, run two actual Workers AI coding sessions concurrently, and commit each session's changes and context.
4. Persist GuardCMD shadow-mode reviews; present precise diffs, conflicts, timestamps, and commit identities. Require separate human approval and non-forced Git pushes for integration.
5. Test authorization, validation, concurrency, Git history, conflicts, stale approvals, and security decisions. Deploy only the isolated Worker when account capabilities permit.
6. Prepare a standalone MIT source package, run instructions, submission copy, and a genuine demonstration recording or recording automation. Obtain approval for publishing the reviewed package. Never submit the competition form automatically.

Initial audit, October 12, 2026: private checkout clean; public repository contains MCP and skills, while SDK 0.2.0 is published on npm. Railway's API, web, MCP and Postgres report online. Cloudflare OAuth is available with Workers, AI and Artifacts scopes. Subscription and namespace reads returned HTTP 403; paid-plan status is not yet verified. No production configuration changed.
