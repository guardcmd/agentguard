import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker, { authTest, type Env } from '../src/worker';
const operator = 'operator-'.repeat(5), reviewer = 'reviewer-'.repeat(5);
const env = {ADMIN_TOKEN:operator,REVIEW_TOKEN:reviewer,WORKSPACE:{idFromName:()=>'',get:()=>({fetch:()=>Response.json({ok:true})})}} as unknown as Env;
test('public evidence is readable but every mutation needs the correct role',async()=>{
  assert.equal((await worker.fetch(new Request('https://demo.test/api/tasks'),env)).status,200);
  for(const route of ['tasks','review-example','tasks/abc/approve','tasks/abc/merge']) {
    assert.equal((await worker.fetch(new Request(`https://demo.test/api/${route}`,{method:'POST'}),env)).status,401);
  }
  assert.equal((await worker.fetch(new Request('https://demo.test/api/tasks/abc/merge',{method:'POST',headers:{Authorization:`Bearer ${operator}`}}),env)).status,401);
  assert.equal((await worker.fetch(new Request('https://demo.test/api/tasks',{method:'POST',headers:{Authorization:`Bearer ${reviewer}`}}),env)).status,401);
  assert.equal((await worker.fetch(new Request('https://demo.test/api/tasks',{method:'POST',headers:{Authorization:`Bearer ${operator}`,Origin:'https://evil.test'}}),env)).status,403);
  const valid = await worker.fetch(new Request('https://demo.test/api/tasks/abc/approve',{method:'POST',headers:{Authorization:`Bearer ${reviewer}`}}),env);
  assert.equal(valid.status,200); assert.match(valid.headers.get('Content-Security-Policy')! , /frame-ancestors 'none'/);
});
test('missing secrets fail closed and streamed request bodies are bounded',async()=>{
  assert.equal(await authTest.authorized(new Request('https://test'),undefined),false);
  await assert.rejects(()=>authTest.body(new Request('https://test',{method:'POST',body:'x'.repeat(16385)})),/too large/);
  await assert.rejects(()=>authTest.body(new Request('https://test',{method:'POST',body:'invalid'})),/Invalid JSON/);
  assert.deepEqual(await authTest.body(new Request('https://test',{method:'POST',body:'{"valid":true}'})),{valid:true});
});
