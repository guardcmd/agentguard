# GuardCMD AgentGuard

AI agents can produce changes faster than a person can inspect them. Parallel execution makes the trust problem harder: which model saw which context, which code was actually reviewed, and did the destination move after approval?

AgentGuard treats each coding session as an isolated, versioned proposal. A Worker starts two real model calls concurrently. Artifacts gives every session its own Git repository. GuardCMD records explainable security evidence. A reviewer authorizes the exact source and target commits, and integration refuses conflicts or stale approvals.

The differentiator is the connection between risk, context and Git identity. A security verdict is attached to the proposal that produced it; changing a commit or destination invalidates the permission to integrate. Context is committed alongside code rather than left in ephemeral chat history.

The working prototype uses a bounded public sample project, separate operator/reviewer credentials and conservative file-level conflicts. Future work includes private multi-tenant identity, isolated execution tests, richer policy signals, resumable agents, line-level conflict resolution and scalable queues. These are roadmap items, not completed claims.

Existing GuardCMD web-traffic figures supplied for this entry—31,980 HTTP requests, 3,830 visits and 354 MB over 30 days—are reported traffic, not registered-user or customer counts, and were not independently reverified for this build.
