import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertMergeable, conflicts, diff, overlapMs, parseProposal, reviewChanges, type Agent } from '../src/domain';

test('proposal parser bounds paths, duplicates, binary content, and response size', () => {
  const proposal = (path: string, content = 'export const x = 1;') => JSON.stringify({ summary:'Useful change', files:[{path,content}] });
  assert.equal(parseProposal(proposal('src/a.js')).files.length,1);
  assert.equal(parseProposal(proposal('test/tasks.test.js')).files.length,1);
  for (const path of ['../secret', 'src/../x.js', '.git/config', '.env', '/src/a.js', 'src\\a.js','package.json','src//a.js']) assert.throws(() => parseProposal(proposal(path)));
  assert.throws(() => parseProposal(proposal('src/a.js','\0')));
  assert.throws(() => parseProposal(proposal('src/a.js','x'.repeat(24_001))));
  assert.throws(() => parseProposal(JSON.stringify({summary:'x',files:[{path:'src/a.js',content:'a'},{path:'src/A.js',content:'b'}]})));
  assert.throws(() => parseProposal('not JSON'));
});
test('three-way conflict detection accepts unrelated edits and identical outcomes', () => {
  const changes = diff({'src/a.js':'old'}, {'src/a.js':'new'});
  assert.deepEqual(conflicts(changes, {'src/a.js':'old','src/b.js':'other'}), []);
  assert.deepEqual(conflicts(changes, {'src/a.js':'new'}), []);
  assert.deepEqual(conflicts(changes, {'src/a.js':'conflicting'}), ['src/a.js']);
  assert.deepEqual(conflicts(changes, {}), ['src/a.js']);
});
test('known invalid SDK imports and calls enter the agent repair path', () => {
  const proposal = (content:string) => JSON.stringify({summary:'SDK integration',files:[{path:'src/signup.js',content}]});
  assert.throws(() => parseProposal(proposal("import guardcmdExpress from 'guardcmd/express';")), /named exports/);
  assert.throws(() => parseProposal(proposal("guardcmdExpress({action:'signup'}, guard);")), /FIRST argument/);
  assert.doesNotThrow(() => parseProposal(proposal("import { guardcmdExpress } from 'guardcmd/express'; guardcmdExpress(guard,{action:'signup'});")));
});
test('actual GuardCMD SDK flags risky code in shadow and enforce modes', async () => {
  const unsafe = [{path:'src/unsafe.js',before:null,after:"import {execSync} from 'node:child_process'; execSync('rm -rf /');"}];
  const shadow = await reviewChanges(unsafe,'shadow');
  assert.equal(shadow.action,'block'); assert.equal(shadow.enforced,false); assert.ok(shadow.reasons.length);
  const enforce = await reviewChanges(unsafe,'enforce');
  assert.equal(enforce.action,'block'); assert.equal(enforce.enforced,true);
  assert.equal((await reviewChanges([{path:'src/a.js',before:null,after:'export const answer = 42;'}],'shadow')).action,'allow');
});
test('merge requires exact source, exact target, review, and unconsumed approval', () => {
  const agent: Agent = {id:'a',role:'coder',status:'review',head:'source',review:{action:'allow',score:0,reasons:[],enforced:false},approval:{head:'source',targetHead:'target',at:1,reviewer:'human'}};
  assert.doesNotThrow(() => assertMergeable(agent,'source','target'));
  assert.throws(() => assertMergeable(agent,'other','target'));
  assert.throws(() => assertMergeable(agent,'source','moved'));
  assert.throws(() => assertMergeable({...agent,approval:undefined},'source','target'));
  assert.throws(() => assertMergeable({...agent,review:undefined},'source','target'));
  assert.throws(() => assertMergeable({...agent,mergedHead:'merged'},'source','target'));
  assert.throws(() => assertMergeable({...agent,review:{action:'block',score:98,reasons:[],enforced:true}},'source','target'));
  assert.doesNotThrow(() => assertMergeable({...agent,review:{action:'review',score:80,reasons:[],enforced:true}},'source','target'));
});
test('concurrency evidence measures real interval intersection', () => {
  const a = (start:number,end:number): Agent => ({id:'a',role:'r',status:'review',inferenceStartedAt:start,inferenceEndedAt:end});
  assert.equal(overlapMs([a(100,500),a(200,600)]),300);
  assert.equal(overlapMs([a(100,200),a(300,400)]),0);
});
