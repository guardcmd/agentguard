import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.AGENTGUARD_URL || 'https://demo.guardcmd.ai';
const secrets=JSON.parse(readFileSync('evidence/private/secrets.json','utf8'));
async function call(path,data,review=false){
  const res=await fetch(base+'/api/'+path,data===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${review?secrets.REVIEW_TOKEN:secrets.ADMIN_TOKEN}`},body:JSON.stringify(data)});
  const result=await res.json(); return {status:res.status,result};
}
if(process.argv.includes('--start')){
  const {status,result}=await call('tasks',{prompt:'Conflict exercise. BOTH agents must edit src/tasks.js. Check your agent ID from the system message. If your agent ID is builder: change addTask to compute id using Math.max(0, ...tasks.map(t => t.id)) + 1. If your agent ID is verifier: change addTask to compute id using Date.now(). Implement ONLY the instruction for your own agent ID, never both. Keep all exports and all other behavior. Return only src/tasks.js. These are deliberately incompatible proposals for a conflict demonstration.'});
  assert.equal(status,202,JSON.stringify(result));writeFileSync('evidence/conflict-task.json',JSON.stringify({base,id:result.id},null,2));console.log(result.id);
}else{
  const info=JSON.parse(readFileSync('evidence/conflict-task.json','utf8'));
  let t=(await call(`tasks/${info.id}`)).result;
  assert.equal(t.status,'review');assert.ok(t.agents.every(a=>a.head));
  const act=async(action,a)=>call(`tasks/${t.id}/${action}`,{agentId:a.id,head:a.head,targetHead:t.targetHead},true);
  assert.equal((await act('approve',t.agents[0])).status,200);
  let r=await act('merge',t.agents[0]);assert.equal(r.status,200,JSON.stringify(r));t=r.result;
  assert.equal((await act('approve',t.agents[1])).status,200);
  r=await act('merge',t.agents[1]);assert.equal(r.status,409,JSON.stringify(r));assert.match(r.result.error,/Conflicting files/);
  const after=(await call(`tasks/${info.id}`)).result;assert.equal(after.targetHead,t.targetHead);
  writeFileSync('evidence/conflict-result.json',JSON.stringify({checkedAt:new Date().toISOString(),error:r.result.error,unchangedTarget:true,task:after},null,2));
  console.log('Live conflict rejected; Artifacts target unchanged.');
}
