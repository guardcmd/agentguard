import { GuardCMD, type Decision, type Signal } from 'guardcmd';

export type Files = Record<string, string>;
export type Change = { path: string; before: string | null; after: string | null };
export type Proposal = { summary: string; files: { path: string; content: string }[] };
export type Review = Pick<Decision, 'action' | 'score' | 'reasons' | 'enforced'>;
export type Agent = {
  id: string; role: string; status: string; repo?: string; remote?: string;
  startedAt?: number; inferenceStartedAt?: number; inferenceEndedAt?: number; endedAt?: number;
  inferenceCalls?: { start: number; end: number }[];
  head?: string; summary?: string; changes?: Change[]; review?: Review;
  error?: string; context?: string; mergedHead?: string;
  approval?: { head: string; targetHead: string; at: number; reviewer: string };
};
export type Task = {
  scenario?: 'tasks' | 'signup';
  id: string; prompt: string; status: string; createdAt: number; mode: 'shadow' | 'enforce';
  baseRepo?: string; baseRemote?: string; baseHead?: string; targetHead?: string;
  agents: Agent[]; events: { at: number; type: string; detail: string }[];
  error?: string; activeMerge?: string; conflicts?: string[];
};
export class AppError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const seed: Files = {
  'README.md': '# Harbor Tasks\n\nA small task-list utility used for the AgentGuard demonstration.\n',
  'src/tasks.js': 'export function addTask(tasks, title) {\n  return [...tasks, { id: tasks.length + 1, title, done: false }];\n}\n\nexport function completeTask(tasks, id) {\n  return tasks.map(task => task.id === id ? { ...task, done: true } : task);\n}\n',
  'test/tasks.test.js': "import assert from 'node:assert/strict';\nimport { addTask, completeTask } from '../src/tasks.js';\nconst tasks = addTask([], 'Ship safely');\nassert.equal(tasks.length, 1);\nassert.equal(completeTask(tasks, 1)[0].done, true);\n",
  'package.json': '{"name":"harbor-tasks-demo","private":true,"type":"module","scripts":{"test":"node test/tasks.test.js"}}\n'
};
export function parseProposal(raw: string): Proposal {
  if (raw.length > 100_000) throw new AppError(422, 'Agent response exceeds 100 KB');
  const text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let value: any;
  try { value = JSON.parse(text); } catch { throw new AppError(422, 'Agent did not return valid JSON'); }
  if (!value || typeof value.summary !== 'string' || value.summary.length > 2000 || !Array.isArray(value.files) || value.files.length < 1 || value.files.length > 8) throw new AppError(422, 'Invalid proposal schema');
  const paths = new Set<string>();
  let bytes = 0;
  for (const file of value.files) {
    if (!file || typeof file.path !== 'string' || typeof file.content !== 'string') throw new AppError(422, 'Invalid file');
    if (!/^(?:README\.md|(?:src|test|docs)\/[a-zA-Z0-9_./-]+\.(?:js|ts|md|json|css|html))$/.test(file.path) || file.path.includes('..') || file.path.includes('//') || file.path.split('/').some((part: string) => part.startsWith('.')) || file.path.length > 160) throw new AppError(422, `Agent attempted a protected or invalid path: ${file.path.slice(0,160)}`);
    if (paths.has(file.path.toLowerCase())) throw new AppError(422, 'Duplicate file path');
    paths.add(file.path.toLowerCase());
    const size = new TextEncoder().encode(file.content).length;
    bytes += size;
    if (size > 24_000 || bytes > 64_000 || file.content.includes('\0')) throw new AppError(422, 'Agent file exceeds text limits');
    if (/import\s+[A-Za-z_$][\w$]*\s+from\s+['"]guardcmd(?:\/express)?['"]/.test(file.content)) throw new AppError(422, 'GuardCMD has named exports only. Use import { guardcmdExpress } from "guardcmd/express" and named imports from "guardcmd".');
    if (/guardcmdExpress\s*\(\s*\{/.test(file.content)) throw new AppError(422, 'The correct SDK signature is guardcmdExpress(guard, { action: "signup", trustProxy: false, context: req => ({ email: req.body?.email }) }). The guard instance is the FIRST argument, options are the SECOND.');
  }
  return value;
}
export function diff(base: Files, next: Files): Change[] {
  return [...new Set([...Object.keys(base), ...Object.keys(next)])].sort()
    .filter(path => base[path] !== next[path])
    .map(path => ({ path, before: base[path] ?? null, after: next[path] ?? null }));
}
export function conflicts(changes: Change[], target: Files): string[] {
  return changes.filter(c => (target[c.path] ?? null) !== c.before && (target[c.path] ?? null) !== c.after).map(c => c.path);
}
const codeSignal: Signal = {
  name: 'agent-code-review',
  evaluate(ctx) {
    const text = ctx.content ?? '';
    const rules: [RegExp, string, number][] = [
      [/\b(?:eval|Function)\s*\(/i, 'Dynamic code execution requires review', 80],
      [/child_process|execSync|spawnSync|rm\s+-rf|DROP\s+TABLE/i, 'Shell or destructive operation proposed', 98],
      [/process\.env|document\.cookie|localStorage/i, 'Sensitive runtime data access proposed', 80],
      [/https?:\/\/[^\s"'<>]+/i, 'External network destination proposed', 75],
      [/-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:sk-|ghp_)[a-zA-Z0-9]{20,}/, 'Possible embedded credential', 100],
      [/ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions|disable\s+(?:auth|security)/i, 'Instruction override or security bypass text', 95]
    ];
    const found = rules.filter(([pattern]) => pattern.test(text));
    return { signal: this.name, score: Math.max(0, ...found.map(r => r[2])), reasons: found.map(r => r[1]) };
  }
};
// One shared engine per mode and isolate. These signals have no per-process counters.
const guards = {
  shadow: new GuardCMD({ mode: 'shadow', signals: [codeSignal] }),
  enforce: new GuardCMD({ mode: 'enforce', signals: [codeSignal] })
};
export async function reviewChanges(changes: Change[], mode: 'shadow' | 'enforce'): Promise<Review> {
  const d = await guards[mode].evaluate({ action: 'agent.propose', content: changes.map(c => `${c.path}\n${c.after ?? ''}`).join('\n') });
  return { action: d.action, score: d.score, reasons: d.reasons, enforced: d.enforced };
}
export function assertMergeable(agent: Agent, head: string, targetHead: string) {
  if (!agent.head || agent.head !== head || !agent.approval || agent.approval.head !== head || agent.approval.targetHead !== targetHead) throw new AppError(409, 'Approval is missing or stale; review the current commits');
  if (agent.mergedHead) throw new AppError(409, 'This proposal was already merged');
  if (!agent.review) throw new AppError(409, 'Security review is missing');
  if (agent.review.enforced && ['block', 'throttle', 'challenge'].includes(agent.review.action)) throw new AppError(403, 'GuardCMD enforcement prevents this merge');
}
export function event(task: Task, type: string, detail: string) {
  task.events.push({ at: Date.now(), type, detail });
}
export function overlapMs(agents: Agent[]) {
  if (agents.length < 2 || agents.some(a => !a.inferenceStartedAt || !a.inferenceEndedAt)) return 0;
  if (agents.every(a => a.inferenceCalls?.length)) {
    return agents[0].inferenceCalls!.reduce((sum,a) => sum + agents[1].inferenceCalls!.reduce((n,b) => n + Math.max(0,Math.min(a.end,b.end)-Math.max(a.start,b.start)),0),0);
  }
  return Math.max(0, Math.min(...agents.map(a => a.inferenceEndedAt!)) - Math.max(...agents.map(a => a.inferenceStartedAt!)));
}
