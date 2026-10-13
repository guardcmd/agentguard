// Continue the genuine recording after the second proposal correctly conflicted.
// The final edit removes idle timeout footage and labels this continuation.
import {chromium} from 'playwright';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.AGENTGUARD_URL||'https://demo.guardcmd.ai';
const secrets=JSON.parse(readFileSync('evidence/private/secrets.json','utf8'));
const original=JSON.parse(readFileSync('recordings/task.json','utf8'));
const completed=JSON.parse(readFileSync('evidence/live-result.json','utf8')).task;
const rawFirst=readFileSync('recordings/raw-path.txt','utf8').trim();
const parseTime=s=>{const [h,m,sec]=s.replace(',','.').split(':').map(Number);return h*3600+m*60+sec;};
const cues=readFileSync('recordings/captions.srt','utf8').trim().split(/\r?\n\r?\n/).map(block=>{const lines=block.split(/\r?\n/);return{at:parseTime(lines[1].split(' --> ')[0]),text:lines.slice(2).join(' ')};}).filter(c=>c.at<307);
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:'recordings',size:{width:1440,height:900}}});
const page=await context.newPage(),video=page.video(),start=Date.now();
const until=async s=>{const left=s*1000-(Date.now()-start);if(left>0)await page.waitForTimeout(left);};
const cue=text=>{cues.push({at:307+(Date.now()-start)/1000,text});console.log(Math.round((Date.now()-start)/1000)+'s '+text);};
const task=async id=>(await context.request.get(base+'/api/tasks/'+id)).json();
try{
  await page.goto(base,{waitUntil:'networkidle'});
  await page.locator('#access-button').click();await page.locator('#operator-token').fill(secrets.ADMIN_TOKEN);await page.locator('#reviewer-token').fill(secrets.REVIEW_TOKEN);await page.locator('#save-access').click();
  await page.locator('#tasks').selectOption(original.id);await page.locator('.sessions').scrollIntoViewIfNeeded();
  cue('Continued capture after a rejected merge. The quality agent also edited implementation code, creating a real conflict. No code was forced through.');
  const before=await task(original.id);assert.equal(before.status,'review');assert.ok(before.agents[0].mergedHead);assert.ok(!before.agents[1].mergedHead);
  await until(16);await page.locator('[data-action="inspect"][data-agent="verifier"]').click();
  cue('Inspect the actual overlapping proposal. Role instructions do not guarantee correct output; change inspection and conflict checks remain necessary.');
  await until(30);await page.locator('.sessions').scrollIntoViewIfNeeded();await page.locator('[data-action="merge"][data-agent="verifier"]').click();
  await page.locator('#notice').filter({hasText:'Conflicting files'}).waitFor({timeout:60000});await page.locator('#notice').scrollIntoViewIfNeeded();
  assert.equal((await task(original.id)).targetHead,before.targetHead);
  cue('The live retry is rejected, and the Artifacts target is unchanged. The approval cannot override an incompatible file change.');
  await until(47);await page.locator('#tasks').selectOption(completed.id);await page.locator('.sessions').scrollIntoViewIfNeeded();
  cue('For comparison, this earlier verified task merged both compatible proposals. This is separate recorded evidence, not a substituted result for the conflicting task.');
  await until(62);await page.locator('#history-button').click();await page.locator('#git-history').scrollIntoViewIfNeeded();
  cue('History is read directly from Artifacts. Two-parent merges retain proposal ancestry; independent verification also confirmed both committed agent context files.');
  await until(81);await page.goto('https://github.com/guardcmd/agentguard',{waitUntil:'domcontentloaded'});
  cue('The standalone implementation is public under MIT, with setup instructions and evidence. Nine application tests pass in a fresh standalone installation.');
  await until(103);await page.goto('https://github.com/guardcmd/agentguard-demo-signup/pull/1',{waitUntil:'domcontentloaded'});
  cue('The signup comparison preserves original model commits and clearly attributes reviewer corrections. Eight fixture tests pass. Shadow mode remains advisory.');
  await until(123);await page.goto(base,{waitUntil:'networkidle'});
  cue('AgentGuard combines parallel work, versioned context, explainable risk and commit-bound approval. It is a bounded prototype, not a general-purpose private repository host.');
  await until(137);cue('Source and run instructions are public. The entrant will review the video and personally submit the competition materials.');
  await until(144);
  writeFileSync('recordings/recording-evidence.json',JSON.stringify({durationMs:451000,task:await task(original.id),compatibleTask:completed.id,edit:'Two genuine captures; first 307 seconds retained, idle timeout removed, continuation explicitly captioned. No fabricated responses or time acceleration.',segments:[{path:rawFirst,duration:307},{duration:144}],cues},null,2));
}finally{await context.close();await browser.close();writeFileSync('recordings/continuation-path.txt',await video.path());}
const evidence=JSON.parse(readFileSync('recordings/recording-evidence.json','utf8'));evidence.segments[1].path=readFileSync('recordings/continuation-path.txt','utf8');writeFileSync('recordings/recording-evidence.json',JSON.stringify(evidence,null,2));
console.log('Genuine continuation completed.');
