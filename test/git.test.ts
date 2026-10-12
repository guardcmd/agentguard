import { test } from 'node:test';
import assert from 'node:assert/strict';
import git from 'isomorphic-git';
import { gitTest } from '../src/repository';
test('real Git commits preserve trees and two-parent merge ancestry in memory',async()=>{
  const {workspace,dir,commitFiles,readFiles}=gitTest;
  const fs=workspace();
  await git.init({fs,dir,defaultBranch:'main'});
  const base=await commitFiles(fs,{'src/a.js':'base\n'},'base');
  const source=await commitFiles(fs,{'src/a.js':'proposal\n','.agentguard/a.json':'{"context":"preserved"}'},'proposal');
  await git.writeRef({fs,dir,ref:'refs/heads/main',value:base,force:true});
  await git.checkout({fs,dir,ref:'main',force:true});
  const target=await commitFiles(fs,{'docs/readme.md':'independent\n'},'target');
  const merged=await commitFiles(fs,{'src/a.js':'proposal\n','.agentguard/a.json':'{"context":"preserved"}'},'merge',[target,source]);
  const info=await git.readCommit({fs,dir,oid:merged});
  assert.deepEqual(info.commit.parent,[target,source]);
  assert.deepEqual(await readFiles(fs),{'src/a.js':'proposal\n','docs/readme.md':'independent\n','.agentguard/a.json':'{"context":"preserved"}'});
  assert.equal((await readFiles(fs,base))['src/a.js'],'base\n');
});
