# Implementation report

## Delivered system

AgentGuard runs on a dedicated Cloudflare Worker at https://demo.guardcmd.ai. Its Durable Object persists sample task state and serializes approvals and merges. Each task creates a baseline and two forks in the `agentguard-competition` Artifacts namespace. Two Workers AI calls produce actual code proposals and preserve their task, role, review and timing in Git.

The public `guardcmd@0.2.0` SDK evaluates an original, bounded heuristic code-review signal. It is not represented as a comprehensive security audit or as a hosted GuardCMD API integration. Separately, GuardCMD's existing repository scanner produced the included static signup-fixture report. The private scanner implementation is not distributed or required to run AgentGuard; its exported report is labeled a captured scan, not a live browser scan.

The original signup fixture is public at https://github.com/guardcmd/agentguard-demo-signup. It has no listener, credentials, customer data or deployed backend. Findings are intentional, not allegations against another project. Source snapshots embedded in the application are original MIT code.

## Validation evidence

- `evidence/live-result.json`: deployed authorization, unapproved merge, stale approval and two successful real merges.
- `evidence/conflict-result.json`: two real incompatible proposals; second merge rejected and target unchanged.
- `evidence/fixture-scan.json`: actual GuardCMD scanner output, with its local root path normalized for publication.
- `evidence/ui-check.json`: desktop/mobile checks and no browser JavaScript errors or horizontal mobile overflow.
- Nine automated tests cover parser bounds, SDK contract checks, review behavior, commit-bound authorization, actual in-memory Git ancestry and request security. `npm run check` also typechecks and bundles the Worker.

Development failures remain visible in the deployed task history. Early model responses used an incorrect SDK import/signature; those proposals were not approved as working fixes. Validation now rejects these known contract errors and allows one bounded model repair. Deployments briefly served different Worker/Durable Object versions; live behavior was checked separately from upload success.

## Limits

One public sample workspace, operator/reviewer bearer credentials, at most twenty tasks, two agents per task, bounded text changes, conservative file conflicts. No private repository import or execution of generated code in the Worker. Shadow reviews are advisory. A successful merge proves the Git integration protocol, not that generated code is correct; inspect and test it separately.

The paid Workers plan was activated by the owner. Only the new competition Worker, namespace, secrets and hostname were configured. Existing Railway services and the Aloft/RRender projects were not modified. No private production source was published.

The initial Windows performance check found available memory and later idle disk activity; no user processes, security controls or SSH sessions were stopped. Recording uses bounded local browser capture and a low-thread-count video encode.

## Submission responsibility

The owner reviews eligibility, final URLs and the video and submits personally. No competition form is submitted by this project or its automation.

## Signup validation

Task ee3ae353-aa9d-4aeb-9dc0-6b5e5af1be45 produced two proposals with 12,726 ms inference overlap. Four unmodified generated tests passed before both proposals merged into Artifacts at 56831f5e91607397a3162494e6adef997d669a2d. A separately attributed reviewer commit fixed missing-body handling and corrected a test label; eight tests now pass on the public fix branch. See [the draft comparison PR](https://github.com/guardcmd/agentguard-demo-signup/pull/1). Main intentionally retains the flawed baseline.

## Recorded conflict outcome

The fresh task launched during recording, 8ebe4634-7d28-4731-aaa9-a12c8158050b, had 6,994 ms inference overlap. Its quality agent also edited implementation code despite its role instructions. The first proposal merged; the second was correctly rejected as conflicting. The recording automation stopped rather than invent a successful result. A clearly captioned second genuine capture demonstrates the rejected retry, unchanged target, and a separately identified earlier compatible task with both merges. Only idle timeout footage is removed; no model timing or responses are fabricated. Role instructions are not an enforced file-ownership boundary.

## Final video verification

DEMO_VIDEO.mp4 is a captioned H.264 recording, 1440×1010, 450.88 seconds, 12,131,153 bytes. FFmpeg decoded the entire file successfully; representative frames were visually inspected. The MP4 is delivered locally for the entrant’s own upload, not committed to Git. It combines two clearly labeled genuine captures and removes idle timeout footage only. See evidence/video-check.json and evidence/recording-evidence.json.
