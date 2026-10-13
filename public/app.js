const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let operatorToken = '', reviewerToken = '', tasks = [], selected = '', activeAgent = '', rendered = '';
async function api(path, data, review = false) {
  const response = await fetch(`/api/${path}`, data === undefined ? {} : { method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${review ? reviewerToken : operatorToken}`},body:JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
  return result;
}
const notify = message => { $('notice').textContent = message; };
$('access-button').onclick = () => $('access').showModal();
$('save-access').onclick = () => { operatorToken = $('operator-token').value; reviewerToken = $('reviewer-token').value; $('operator-token').value = ''; $('reviewer-token').value = ''; notify('Workspace credentials loaded for this tab.'); };
$('task-form').onsubmit = async event => {
  event.preventDefault();
  if (!operatorToken) { $('access').showModal(); return; }
  $('launch').disabled = true;
  try { const task = await api('tasks', {prompt:$('prompt').value,scenario:$('scenario').value}); selected = task.id; activeAgent = ''; notify('Task accepted. Two real coding sessions are being prepared.'); await refresh(); }
  catch (err) { notify(err.message); } finally { $('launch').disabled = false; }
};
$('probe').onclick = async () => {
  if (!operatorToken) { $('access').showModal(); return; }
  try { const result = await api('review-example', {}); $('probe-result').textContent = `${result.review.action.toUpperCase()} · ${result.review.score}/100 · ${result.review.enforced ? 'enforced' : 'shadow, advisory'}. ${result.review.reasons.join('. ')}. ${result.label}`; } catch(err) { notify(err.message); }
};
$('tasks').onchange = () => { selected = $('tasks').value; activeAgent = ''; rendered = ''; render(); };
$('history-button').onclick = async () => {
  if (!selected) return;
  try { $('git-history').hidden = false; $('git-history').textContent = JSON.stringify(await api(`tasks/${selected}/history`), null, 2); } catch(err) { notify(err.message); }
};
function render() {
  const task = tasks.find(t => t.id === selected) || tasks.find(t => t.scenario === 'signup' && t.status === 'complete') || tasks[0];
  if (!task) return;
  selected = task.id;
  const signature = JSON.stringify(task);
  if (signature === rendered) return;
  rendered = signature;
  $('tasks').innerHTML = tasks.map(t => `<option value="${escape(t.id)}">${escape(t.prompt.slice(0,65))} · ${escape(t.status)}</option>`).join('');
  $('tasks').value = task.id;
  $('session-count').textContent = task.agents.filter(a => a.inferenceStartedAt).length;
  $('overlap').textContent = task.overlapMs ? `${(task.overlapMs/1000).toFixed(1)}s` : '—';
  $('commit-count').textContent = task.agents.filter(a => a.head).length;
  $('task-status').textContent = task.status;
  $('task-status').className = 'badge ' + (task.status === 'failed' ? 'danger' : 'neutral');
  $('task-details').innerHTML = `<div class="task-info">Task ${escape(task.id.slice(0,8))} · Base <code>${escape(task.baseHead?.slice(0,12) || 'pending')}</code> · Current target <code>${escape(task.targetHead?.slice(0,12) || 'pending')}</code>${task.error ? `<div class="conflict-warning">${escape(task.error)}</div>` : ''}${task.conflicts?.length ? `<div class="conflict-warning">Overlapping files require inspection: ${escape(task.conflicts.join(', '))}. A conflicting merge will be rejected.</div>` : ''}</div>`;
  $('agents').innerHTML = task.agents.map((a,i) => `<article class="panel"><div class="agent-top"><div><span class="agent-icon ${i?'violet':''}">A${i?'₂':'₁'}</span><h3>${i?'Quality engineer':'Implementation engineer'}</h3></div><span class="badge ${a.status==='failed'?'danger':['thinking','forking','committing'].includes(a.status)?'running':'neutral'}">${escape(a.status)}</span></div><p class="agent-summary">${escape(a.error || a.summary || a.role)}</p><div class="meta">Repository · <code>${escape(a.repo || 'Not created')}</code><br>Commit · <code>${escape(a.head || 'Awaiting proposal')}</code><br>Context · <code>${escape(a.context || 'Saved with the proposal')}</code>${a.inferenceStartedAt ? `<br>Inference · ${new Date(a.inferenceStartedAt).toLocaleTimeString()} → ${a.inferenceEndedAt ? new Date(a.inferenceEndedAt).toLocaleTimeString() : 'running'}` : ''}</div><div class="review-line"><span>GuardCMD review</span><span>${a.review ? `${escape(a.review.action.toUpperCase())} · ${a.review.score}/100 · ${a.review.enforced?'enforced':'shadow'}` : 'Pending'}</span></div>${a.review?.reasons?.length ? `<p class="muted">${escape(a.review.reasons.join('. '))}</p>` : ''}<div class="agent-actions"><button class="secondary" data-action="inspect" data-agent="${a.id}" ${a.changes?'':'disabled'}>Inspect changes</button><button class="quiet" data-action="approve" data-agent="${a.id}" ${a.head && !a.mergedHead && task.status!=='running'?'':'disabled'}>${a.approval?'Approved ✓':'Approve commit'}</button><button class="primary" data-action="merge" data-agent="${a.id}" ${a.approval && !a.mergedHead ?'':'disabled'}>${a.mergedHead?'Merged ✓':'Merge'}</button></div></article>`).join('');
  $('agents').querySelectorAll('button').forEach(button => button.onclick = async () => {
    const agent = task.agents.find(a => a.id === button.dataset.agent);
    if (button.dataset.action === 'inspect') { activeAgent = agent.id; renderDiff(task,agent); $('comparison').scrollIntoView({behavior:'smooth',block:'start'}); return; }
    if (!reviewerToken) { $('access').showModal(); return; }
    button.disabled = true;
    try { await api(`tasks/${task.id}/${button.dataset.action}`, {agentId:agent.id,head:agent.head,targetHead:task.targetHead}, true); notify(button.dataset.action === 'merge' ? 'Reviewed commit merged. Other proposals need approval against the new target.' : 'Approval saved for these exact source and target commits.'); await refresh(); }
    catch(err) { notify(err.message); rendered = ''; render(); }
  });
  $('events').innerHTML = [...task.events].reverse().map(e => `<li><time>${new Date(e.at).toLocaleTimeString()}</time><div><strong>${escape(e.type.replaceAll('-',' '))}</strong><span>${escape(e.detail)}</span></div></li>`).join('');
  if (activeAgent) renderDiff(task,task.agents.find(a => a.id === activeAgent));
}
function renderDiff(task,agent) {
  if (!agent?.changes) return;
  $('diff').innerHTML = `<p class="muted">${escape(agent.id)} · ${escape(agent.head || 'Uncommitted proposal')} · ${agent.changes.length} changed files</p>` + agent.changes.map(c => `<details class="diff-file" open><summary>${escape(c.path)}</summary><div class="diff-columns"><div><h4>BASELINE</h4><pre>${escape(c.before ?? '(new file)')}</pre></div><div><h4>PROPOSED</h4><pre>${escape(c.after ?? '(deleted)')}</pre></div></div></details>`).join('');
}
async function refresh() { tasks = await api('tasks'); render(); }
async function boot() {
  const generalPrompt = $('prompt').value;
  const signupPrompt = await (await fetch('/signup-task.txt')).text();
  const choose = () => { $('prompt').value = $('scenario').value === 'signup' ? signupPrompt : generalPrompt; $('scan-summary').hidden = $('scenario').value !== 'signup'; };
  $('scenario').onchange = choose; choose();
  try { const status = await api('status'); $('mode').textContent = `● ${status.mode === 'enforce' ? 'Enforcement active' : 'Shadow mode'}`; await refresh(); }
  catch(err) { notify(`Could not connect: ${err.message}`); }
  setTimeout(poll, 2500);
}
async function poll() { try { if (!document.hidden) await refresh(); } catch {} setTimeout(poll,2500); }
boot();
