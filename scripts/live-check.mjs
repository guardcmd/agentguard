import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const base = process.env.AGENTGUARD_URL || 'https://demo.guardcmd.ai';
const secrets = JSON.parse(readFileSync('evidence/private/secrets.json','utf8'));
const headers = { 'Content-Type':'application/json', Authorization:`Bearer ${secrets.ADMIN_TOKEN}` };
const checks = [];
async function request(path, options) { return fetch(base + path, options); }
for (const route of ['/api/tasks','/api/tasks/abc/approve','/api/tasks/abc/merge']) {
  const res=await request(route,{method:'POST',body:'{}'}); assert.equal(res.status,401); checks.push(`Unauthenticated ${route}: rejected`);
}
assert.equal((await request('/api/tasks/abc/approve',{method:'POST',headers,body:'{}'})).status,401);
checks.push('Operator cannot approve');
const probe=await (await request('/api/review-example',{method:'POST',headers,body:'{}'})).json();
assert.equal(probe.review.action,'block'); assert.equal(probe.review.enforced,false);
checks.push('Actual GuardCMD review flags destructive code in shadow mode');
const created=await request('/api/tasks',{method:'POST',headers,body:JSON.stringify({prompt:'Add input validation to addTask: trim the title, reject empty or non-string titles, and choose a unique numeric ID even when tasks have been removed. Add tests covering these cases and document behavior.'})});
assert.equal(created.status,202,await created.clone().text());
const task=await created.json();
mkdirSync('evidence',{recursive:true});
writeFileSync('evidence/live-task.json',JSON.stringify({base,id:task.id,checks},null,2));
console.log(JSON.stringify({id:task.id,checks},null,2));
