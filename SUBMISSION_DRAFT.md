# Submission copy for the entrant

Review the actual form and its limits before pasting. These are draft answers, not a submitted entry. Supply your own entrant/contact and eligibility information.

The [current form](https://www.cloudflare.com/git-competition/submit/) was inspected on October 12, 2026. It asks for a video **file upload**, not just a video URL. Choose the delivered DEMO_VIDEO.mp4 yourself after watching it.

**Team name:** GuardCMD (confirm your preferred team name)

**Primary contact name / email, team location, first attendee name / email:** Fill in your own current details. A second attendee is optional. No personal contact information was guessed or submitted.

**Project name:** GuardCMD AgentGuard: Secure Git Collaboration for Autonomous AI Agents

**Live demo:** https://demo.guardcmd.ai

**Source repository:** https://github.com/guardcmd/agentguard

**Public security fixture:** https://github.com/guardcmd/agentguard-demo-signup

**Video file:** DEMO_VIDEO.mp4 — 7 minutes 30.88 seconds; 12,131,153 bytes (about 12 MB). Captioned, H.264 MP4; full decode verified. Delivered locally to the entrant and intentionally excluded from Git. Upload this file in the form.

**Description:** AgentGuard makes parallel coding-agent work inspectable before it reaches a shared branch. A Cloudflare Worker and Durable Object coordinate two independent Workers AI sessions. Each receives its own Cloudflare Artifacts Git fork and commits its code with versioned task context, review results and inference timing. GuardCMD scores proposed changes; a separate reviewer approves exact source and target commits. Integration checks both commits again, rejects conflicting edits and preserves two-parent Git history. The dashboard exposes actual changes, overlap, reviews and audit evidence.

**What makes it different:** Agent isolation is paired with explicit integration authority. A risk verdict is visible rather than treated as a guarantee; shadow mode is clearly distinguished from enforcement. Approvals become stale when the target changes. Real Git ancestry and preserved context make it possible to inspect how each agent arrived at a change. A deliberately flawed public signup fixture demonstrates the path from a captured GuardCMD finding to a reviewed integration proposal.

**Cloudflare usage:** Workers for authenticated API and assets; a SQLite Durable Object for persisted tasks and serialized integration; Workers AI for concurrent Qwen coding sessions; Artifacts for real repository creation, forks, scoped Git access, proposal commits and final history.

**License and reproduction:** MIT. README and RUN_INSTRUCTIONS.md cover Node/npm, the paid Workers prerequisite for Artifacts, namespace creation, secret names, deployment and tests. The deployed app needs no private GuardCMD code or hosted API key. Visitors can inspect public evidence; operator/reviewer credentials or an independently deployed copy are required to mutate it.

**Prototype boundaries:** Sample repositories only; no generated-code execution inside the Worker, no automatic conflict resolution, no multi-tenant/private hosting claim. The signup integration starts in shadow mode and therefore observes risk rather than immediately preventing account farming. The static scan is an exported result from the existing GuardCMD scanner; the competition app does not claim to run that scanner in the browser.

## Exact project-text fields

### Project vision

AgentGuard makes concurrent AI coding work inspectable before integration. Each agent works in its own real Git repository, preserving code changes and task context together. GuardCMD explains proposal risk, while a separate reviewer approves exact source and target commits. Changing either side invalidates the approval. Conflicting changes are rejected rather than silently overwritten. The prototype demonstrates two concurrent agents, real Artifacts commits, security review, stale-approval rejection and safe integration through a readable dashboard. Our goal is an accountable collaboration layer for growing teams of autonomous coding agents.

### How you used Cloudflare

A Cloudflare Worker serves the dashboard and authenticates operator/reviewer actions. A SQLite Durable Object persists task evidence and serializes integration. Two independent Workers AI sessions generate implementation and quality proposals concurrently. Cloudflare Artifacts creates the baseline and isolated Git forks, stores proposal commits and versioned agent context, and retains two-parent merge history. Repository tokens stay inside the coordinator. The competition deployment is isolated at demo.guardcmd.ai.

### Instructions to run your project

Clone https://github.com/guardcmd/agentguard and follow RUN_INSTRUCTIONS.md. Use Node 22+ and npm ci; authenticate Wrangler to a Cloudflare account with Workers Paid and Artifacts/Workers AI access. Create the agentguard-competition namespace, set separate random ADMIN_TOKEN and REVIEW_TOKEN Worker secrets, run npm run check, then npm run deploy. Open the emitted workers.dev URL and enter your own credentials through Workspace access. Launch a sample task, inspect both proposals, approve and merge the first, then reapprove the second against the new target. Public evidence is also available at https://demo.guardcmd.ai. Captured scan and live-test evidence are included; generated code is not executed inside the Worker.

The two required confirmation checkboxes and the final submission belong to the entrant. Review the rules and eligibility yourself; nothing has been checked or submitted on your behalf.
