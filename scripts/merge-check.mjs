import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const info=JSON.parse(readFileSync('evidence/live-task.json','utf8'));
const secrets=JSON.parse(readFileSync('evidence/private/secrets.json','utf8'));
const base=info.base;
async function task(){return (await fetch(`${base}/api/tasks/${info.id}`)).json();}
async function post(action,agent,t,expected=200){
  const res=await fetch(`${base}/api/tasks/${info.id}/${action}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${secrets.REVIEW_TOKEN}`},body:JSON.stringify({agentId:agent.id,head:agent.head,targetHead:t.targetHead})});
  const result=await res.json();assert.equal(res.status,expected,JSON.stringify(result));return result;
}
let t=await task();
assert.equal(t.status,'review',JSON.stringify(t));assert.ok(t.agents.every(a=>a.head),'Both agents need real commits');assert.ok(t.overlapMs>0,'Inference calls must overlap');
await post('merge',t.agents[0],t,409);info.checks.push('Unapproved merge rejected on deployed Worker');
for(const a of t.agents) await post('approve',a,t);
const stale=structuredClone(t);
t=await post('merge',t.agents[0],t);
await post('merge',t.agents[1],stale,409);info.checks.push('Stale approval rejected after target changed');
t=await post('approve',t.agents[1],t);
t=await post('merge',t.agents[1],t);
assert.equal(t.status,'complete');
const history=await (await fetch(`${base}/api/tasks/${info.id}/history`)).json();
assert.ok(history.length>=3);
info.checks.push('Two actual proposals merged into Artifacts with explicit approvals and preserved history');
writeFileSync('evidence/live-result.json',JSON.stringify({checkedAt:new Date().toISOString(),checks:info.checks,task:t,history},null,2));
console.log(JSON.stringify({status:t.status,overlapMs:t.overlapMs,targetHead:t.targetHead,checks:info.checks},null,2));
