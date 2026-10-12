import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

// Genuine real-time browser recording. No response interception or simulated clock.
const base = process.env.AGENTGUARD_URL || 'https://demo.guardcmd.ai';
const secrets = JSON.parse(readFileSync('evidence/private/secrets.json','utf8'));
const signup = JSON.parse(readFileSync('evidence/signup-result.json','utf8')).task;
const conflict = JSON.parse(readFileSync('evidence/conflict-result.json','utf8')).task;
mkdirSync('recordings',{recursive:true});
const browser = await chromium.launch({headless:true});
const context = await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:'recordings',size:{width:1440,height:900}}});
const page = await context.newPage();
const video = page.video();
const started = Date.now();
const cues = [];
const cue = (text) => { cues.push({at:(Date.now()-started)/1000,text});console.log(Math.round((Date.now()-started)/1000)+'s '+text); };
const until = async seconds => { const remaining=seconds*1000-(Date.now()-started);if(remaining>0)await page.waitForTimeout(remaining); };
const show = async selector => page.locator(selector).scrollIntoViewIfNeeded();
const task = async id => (await context.request.get(base+'/api/tasks/'+id)).json();
async function select(id) { await page.locator('#tasks').selectOption(id);await show('.sessions'); }
async function credential() {
  await page.locator('#access-button').click();
  await page.locator('#operator-token').fill(secrets.ADMIN_TOKEN);
  await page.locator('#reviewer-token').fill(secrets.REVIEW_TOKEN);
  await page.locator('#save-access').click();
}
try {
  await page.goto('https://guardcmd.ai',{waitUntil:'domcontentloaded'});
  cue('GuardCMD AgentGuard: secure Git collaboration for autonomous AI agents. This is a genuine browser recording with explanatory captions.');
  await until(18);cue('GuardCMD is the existing abuse-prevention product. AgentGuard is a separate competition prototype on Cloudflare Workers and Artifacts.');
  await until(30);cue('Owner-supplied 30-day analytics: 31,980 requests, 3,830 visits, 354 MB. These are not registered-user counts and were not independently reverified.');
  await until(40);await page.goto(base,{waitUntil:'networkidle'});await credential();
  cue('The competition workspace has its own hostname. Public visitors inspect evidence; separate operator and reviewer credentials authorize changes.');
  await until(58);await show('#architecture');cue('A Worker authenticates requests. A Durable Object persists tasks and serializes merges. Workers AI generates proposals; Artifacts preserves actual Git history.');
  await until(75);await page.goto('https://github.com/guardcmd/agentguard-demo-signup',{waitUntil:'domcontentloaded'});
  cue('This public MIT fixture is intentionally flawed and never deployed. It contains no credentials, customer data or real account service.');
  await until(95);await page.goto(base+'/fixture-scan.json',{waitUntil:'domcontentloaded'});
  cue('This is the actual captured GuardCMD scanner report: one public signup surface, low priority and 61% confidence. It is not a live browser scan.');
  await until(110);await page.goto(base,{waitUntil:'networkidle'});await credential();
  await page.locator('#scenario').selectOption('tasks');await show('#task-form');
  cue('Now launch a general coding task. Both agents receive the same baseline, with separate implementation and quality roles. No model responses are prerecorded.');
  await until(120);
  const responsePromise=page.waitForResponse(r=>r.url()===base+'/api/tasks'&&r.request().method()==='POST');
  await page.locator('#launch').click();const response=await responsePromise;assert.equal(response.status(),202);const created=await response.json();
  writeFileSync('recordings/task.json',JSON.stringify({base,id:created.id},null,2));
  await page.locator('#task-status').filter({hasText:/running|review/}).waitFor({timeout:60000});await show('.sessions');
  cue('Two real Workers AI sessions are now running against separate Artifacts forks. The dashboard records actual inference intervals and repository commits.');
  await until(145);cue('Each model is restricted to bounded text changes. Neither receives repository credentials, a shell, private source or permission to merge its own output.');
  let active=await task(created.id);for(let i=0;i<40&&['queued','running'].includes(active.status);i++){await page.waitForTimeout(1500);active=await task(created.id);}
  assert.ok(active.agents.every(a=>a.head),'Both real agents must produce commits');assert.ok(active.overlapMs>0,'Actual inference overlap required');
  await until(170);await show('.stats');cue(`Both proposals are committed. Measured inference overlap: ${(active.overlapMs/1000).toFixed(1)} seconds. Each commit includes its own versioned agent context.`);
  await until(185);await page.locator('[data-action="inspect"][data-agent="builder"]').click();
  cue('Inspect the real baseline and proposed file. A GuardCMD allow verdict is a heuristic result, not proof that generated code is correct.');
  await until(205);await select(signup.id);await page.locator('[data-action="inspect"][data-agent="builder"]').click();
  cue('The signup case adds the published GuardCMD SDK in shadow mode, with trusted server IPs and a shared guard instance. Generated proposals passed four local tests.');
  await until(225);await page.locator('[data-action="inspect"][data-agent="verifier"]').click();
  cue('The second agent contributes tests and documentation. Independent reviewer checks later corrected missing-body handling; all eight fixture tests pass on the public fix branch.');
  await until(245);await show('#probe');await page.locator('#probe').click();await page.locator('#probe-result').filter({hasText:'BLOCK'}).waitFor();
  cue('The risky-code probe runs the real GuardCMD SDK. BLOCK is the risk verdict; shadow mode is advisory. This destructive snippet is never executed or committed.');
  await until(265);await select(created.id);
  cue('These walkthrough approvals are automated QA actions demonstrating the reviewer protocol. Production use requires a person to inspect the exact source and target commits.');
  await page.locator('[data-action="approve"][data-agent="builder"]').click();
  await page.locator('[data-action="merge"][data-agent="builder"]').waitFor({state:'visible'});
  await until(278);await page.locator('[data-action="approve"][data-agent="verifier"]').click();
  await until(287);await page.locator('[data-action="merge"][data-agent="builder"]').click();
  await page.locator('[data-action="merge"][data-agent="builder"]').filter({hasText:'Merged'}).waitFor({timeout:60000});
  cue('The first merge changes the target and invalidates the second approval. A stale source/target pair cannot authorize another merge.');
  assert.equal(await page.locator('[data-action="merge"][data-agent="verifier"]').isEnabled(),false);
  await until(301);await page.locator('[data-action="approve"][data-agent="verifier"]').click();
  await page.locator('[data-action="merge"][data-agent="verifier"]').click();
  await page.locator('#task-status').filter({hasText:'complete'}).waitFor({timeout:60000});
  await until(315);await select(conflict.id);
  cue('This earlier genuine conflict exercise has two different edits to the same file. The first is merged; the second is still incompatible with the target.');
  await until(330);await page.locator('[data-action="inspect"][data-agent="verifier"]').click();
  await until(344);await show('.sessions');await page.locator('[data-action="approve"][data-agent="verifier"]').click();
  await page.locator('[data-action="merge"][data-agent="verifier"]').click();await page.locator('#notice').filter({hasText:'Conflicting files'}).waitFor({timeout:60000});
  await show('#notice');assert.equal((await task(conflict.id)).targetHead,conflict.targetHead);
  cue('The merge is rejected with a conflict. The remote target is unchanged. AgentGuard does not force-push or silently choose one agent’s edit.');
  await until(365);await select(created.id);await page.locator('#history-button').click();await show('#git-history');
  cue('This history is read from Cloudflare Artifacts. Actual merge commits retain both parents, and agent context remains versioned alongside the code.');
  await until(390);await page.goto('https://github.com/guardcmd/agentguard',{waitUntil:'domcontentloaded'});
  cue('The standalone competition implementation is public under MIT. It contains run instructions, tests and captured evidence, without private production source.');
  await until(410);await page.goto('https://github.com/guardcmd/agentguard-demo-signup/pull/1',{waitUntil:'domcontentloaded'});
  cue('The fixture’s draft pull request separates original model proposals from reviewer corrections. The intentionally flawed main branch remains available for reproduction.');
  await until(430);await page.goto(base,{waitUntil:'networkidle'});await show('.intro');
  cue('Parallel work, attributable context, visible risk and commit-bound review. This bounded prototype uses real cloud services; the entrant reviews and submits the competition items separately.');
  await until(451);
  writeFileSync('recordings/recording-evidence.json',JSON.stringify({durationMs:Date.now()-started,task:await task(created.id),conflictTask:conflict.id,signupTask:signup.id,cues},null,2));
} finally {
  await context.close();await browser.close();
  const path=await video.path();writeFileSync('recordings/raw-path.txt',path);
  const stamp=t=>{const ms=Math.round(t*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;};
  writeFileSync('recordings/captions.srt',cues.map((c,i)=>`${i+1}\n${stamp(c.at)} --> ${stamp(cues[i+1]?.at??451)}\n${c.text}\n`).join('\n'));
  console.log('Raw browser recording:',path);
}
