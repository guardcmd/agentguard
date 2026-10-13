# Recorded demonstration plan

Target: 7 minutes 30 seconds, genuine browser capture with readable captions. Automated walkthrough actions use a test operator/reviewer; they demonstrate the approval protocol and do not impersonate a human review. Never expose either credential on screen.

| Time | Screen and explanation |
| --- | --- |
| 0:00–0:40 | Existing guardcmd.ai product. Explain abuse scoring and the separate competition project. If mentioning traffic, label the owner's supplied 30-day figures as unverified analytics: 31,980 HTTP requests, 3,830 visits, 354 MB; these are not registered-user counts. |
| 0:40–1:15 | AgentGuard dashboard and architecture: Worker, Durable Object, Workers AI and actual Artifacts Git repositories. |
| 1:15–2:00 | Public intentionally flawed signup fixture and actual GuardCMD scan. One public signup surface; low scanner priority, 61% confidence. Do not call it a critical vulnerability. |
| 2:00–2:55 | Launch two real agents on Harbor Tasks. Show their concurrent status and measured inference overlap, then their distinct commits. |
| 2:55–3:45 | Inspect proposals and preserved context paths. Show the signup example's actual code changes and tests. Explain why generated code still requires review and local validation. |
| 3:45–4:25 | Run the SDK risky-code probe. It reports block risk in shadow mode; no code is executed and the advisory verdict does not itself enforce a block. |
| 4:25–5:15 | Approve exact source/target commits and merge. Show another approval being invalidated by the changed target, then obtain a new approval. |
| 5:15–6:05 | Revisit the actual conflict exercise. Try to merge the incompatible second proposal; show rejection and unchanged target. |
| 6:05–7:00 | Read actual Artifacts Git history and inspect the public competition source and run instructions. |
| 7:00–7:30 | Close with the value: concurrent work with attributable context, understandable risk and explicit integration authority. State prototype limitations and that the entrant submits separately. |

The recording script must stop on failed expected interactions rather than substitute fabricated results. The final video is separately checked with ffprobe and decoded frames. Source and evidence can be reproduced independently of the video.

## Final recording outcome

The new live task produced an unexpected overlapping implementation edit from the quality agent. The final film retains the real rejection and explicitly labels a continuation capture. The continuation shows the rejected retry and unchanged target, then identifies an earlier successful two-proposal task separately. It does not substitute that successful history for the conflicting task. The first 307 seconds of the initial recording and 144 seconds of continuation form the 7:31 edit; idle timeout footage is removed.
