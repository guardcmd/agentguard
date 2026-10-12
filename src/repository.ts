import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import { Volume, createFsFromVolume } from 'memfs';
import { AppError, conflicts, type Change, type Files } from './domain';

const dir = '/repo';
function workspace() { return createFsFromVolume(new Volume()); }
type FS = ReturnType<typeof workspace>;
function auth(token: string) { return () => ({ username: 'x', password: token.split('?expires=')[0] }); }
async function write(fs: FS, files: Files) {
  for (const [path, content] of Object.entries(files)) {
    const parent = `${dir}/${path}`.split('/').slice(0, -1).join('/');
    await fs.promises.mkdir(parent, { recursive: true });
    await fs.promises.writeFile(`${dir}/${path}`, content);
    await git.add({ fs, dir, filepath: path });
  }
}
export async function commitFiles(fs: FS, files: Files, message: string, parent?: string[]) {
  await write(fs, files);
  return git.commit({ fs, dir, message, parent, author: { name: 'AgentGuard', email: 'agentguard@example.invalid' } });
}
export async function readFiles(fs: FS, ref = 'HEAD'): Promise<Files> {
  const paths = await git.listFiles({ fs, dir, ref });
  if (paths.length > 100) throw new AppError(422, 'Repository exceeds demo limit');
  const files: Files = {};
  for (const filepath of paths) {
    const { blob } = await git.readBlob({ fs, dir, oid: await git.resolveRef({ fs, dir, ref }), filepath });
    if (blob.length > 100_000) throw new AppError(422, 'Repository file exceeds demo limit');
    files[filepath] = new TextDecoder().decode(blob);
  }
  return files;
}
async function push(fs: FS, remote: string, token: string) {
  const result = await git.push({ fs, http, dir, url: remote, ref: 'main', onAuth: auth(token), force: false });
  if (!result.ok || result.error) throw new AppError(409, 'Git rejected the push; refresh before retrying');
}
export class Repositories {
  constructor(private artifacts: Artifacts) {}
  async access(name: string, scope: 'read' | 'write') {
    using repo = await this.artifacts.get(name);
    const info = await repo.info();
    const token = await repo.createToken(scope, 600);
    return { remote: info.remote, token: token.plaintext };
  }
  async create(name: string, files: Files) {
    const created = await this.artifacts.create(name, { setDefaultBranch: 'main', description: 'AgentGuard isolated public demo' });
    const fs = workspace();
    await git.init({ fs, dir, defaultBranch: 'main' });
    const head = await commitFiles(fs, files, 'Initialize Harbor Tasks demo');
    await push(fs, created.remote, created.token);
    return { head, remote: created.remote };
  }
  async fork(source: string, name: string) {
    using repo = await this.artifacts.get(source);
    const created = await repo.fork(name, { defaultBranchOnly: true, description: 'Isolated AgentGuard coding session' });
    return { remote: created.remote };
  }
  async clone(name: string, scope: 'read' | 'write' = 'read') {
    const { remote, token } = await this.access(name, scope);
    const fs = workspace();
    await git.clone({ fs, http, dir, url: remote, ref: 'main', singleBranch: true, onAuth: auth(token) });
    const head = await git.resolveRef({ fs, dir, ref: 'HEAD' });
    return { fs, head, remote, token };
  }
  async snapshot(name: string) {
    const { fs, head } = await this.clone(name);
    return { head, files: await readFiles(fs) };
  }
  async propose(name: string, baseHead: string, files: Files, message: string) {
    const { fs, head, remote, token } = await this.clone(name, 'write');
    if (head !== baseHead) throw new AppError(409, 'Agent branch moved');
    const commit = await commitFiles(fs, files, message);
    await push(fs, remote, token);
    return commit;
  }
  async merge(target: string, source: string, expectedTarget: string, expectedSource: string, changes: Change[]) {
    let stage = 'clone target';
    try {
    const { fs, head, remote, token } = await this.clone(target, 'write');
    if (head !== expectedTarget) throw new AppError(409, 'Target moved; obtain a new approval');
    stage = 'access source';
    const src = await this.access(source, 'read');
    await git.addRemote({ fs, dir, remote: 'proposal', url: src.remote });
    stage = 'fetch proposal';
    await git.fetch({ fs, http, dir, url: src.remote, remote: 'proposal', ref: 'main', singleBranch: true, onAuth: auth(src.token) });
    stage = 'resolve proposal';
    const sourceHead = await git.resolveRef({ fs, dir, ref: 'refs/remotes/proposal/main' });
    if (sourceHead !== expectedSource) throw new AppError(409, 'Proposal moved; obtain a new approval');
    stage = 'read target';
    const current = await readFiles(fs);
    const collisions = conflicts(changes, current);
    if (collisions.length) throw new AppError(409, `Conflicting files: ${collisions.join(', ')}`);
    stage = 'read proposal';
    const incoming = await readFiles(fs, expectedSource);
    for (const change of changes) {
      if ((incoming[change.path] ?? null) !== change.after) throw new AppError(409, 'Proposal does not match reviewed content');
      if (change.after === null) throw new AppError(422, 'File deletion is outside the demo scope');
    }
    // Import the reviewed context together with the code. Preserve both parents in Git history.
    const additions = Object.fromEntries(changes.map(c => [c.path, c.after!]));
    for (const [path, content] of Object.entries(incoming)) if (path.startsWith('.agentguard/')) additions[path] = content;
    stage = 'commit merge';
    const merged = await commitFiles(fs, additions, `Merge reviewed proposal ${expectedSource}\nApproved target: ${expectedTarget}`, [head, expectedSource]);
    stage = 'push merge';
    await push(fs, remote, token); // Non-forced receive-pack rejects a racing target update.
    return merged;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error(stage, error);
      throw new AppError(502, `Repository operation failed at ${stage}`);
    }
  }
  async history(name: string) {
    using repo = await this.artifacts.get(name);
    return repo.log({ ref: 'main', limit: 20 });
  }
}
export const gitTest = { workspace, commitFiles, readFiles, dir };
