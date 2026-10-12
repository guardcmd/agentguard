# Submission copy for the entrant

Review the actual form and its limits before pasting. These are draft answers, not a submitted entry. Supply your own entrant/contact and eligibility information.

**Project name:** GuardCMD AgentGuard: Secure Git Collaboration for Autonomous AI Agents

**Live demo:** https://demo.guardcmd.ai

**Source repository:** https://github.com/guardcmd/agentguard

**Public security fixture:** https://github.com/guardcmd/agentguard-demo-signup

**Video:** Add the verified final video link after recording.

**Description:** AgentGuard makes parallel coding-agent work inspectable before it reaches a shared branch. A Cloudflare Worker and Durable Object coordinate two independent Workers AI sessions. Each receives its own Cloudflare Artifacts Git fork and commits its code with versioned task context, review results and inference timing. GuardCMD scores proposed changes; a separate reviewer approves exact source and target commits. Integration checks both commits again, rejects conflicting edits and preserves two-parent Git history. The dashboard exposes actual changes, overlap, reviews and audit evidence.

**What makes it different:** Agent isolation is paired with explicit integration authority. A risk verdict is visible rather than treated as a guarantee; shadow mode is clearly distinguished from enforcement. Approvals become stale when the target changes. Real Git ancestry and preserved context make it possible to inspect how each agent arrived at a change. A deliberately flawed public signup fixture demonstrates the path from a captured GuardCMD finding to a reviewed integration proposal.

**Cloudflare usage:** Workers for authenticated API and assets; a SQLite Durable Object for persisted tasks and serialized integration; Workers AI for concurrent Qwen coding sessions; Artifacts for real repository creation, forks, scoped Git access, proposal commits and final history.

**License and reproduction:** MIT. README and RUN_INSTRUCTIONS.md cover Node/npm, the paid Workers prerequisite for Artifacts, namespace creation, secret names, deployment and tests. The deployed app needs no private GuardCMD code or hosted API key. Visitors can inspect public evidence; operator/reviewer credentials or an independently deployed copy are required to mutate it.

**Prototype boundaries:** Sample repositories only; no generated-code execution inside the Worker, no automatic conflict resolution, no multi-tenant/private hosting claim. The signup integration starts in shadow mode and therefore observes risk rather than immediately preventing account farming. The static scan is an exported result from the existing GuardCMD scanner; the competition app does not claim to run that scanner in the browser.
