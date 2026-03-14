'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Building2, Users, Activity, Plus, Edit, Trash2, ToggleLeft, ToggleRight, X, Check, BarChart3 } from 'lucide-react';

const AUTH = () => typeof window !== 'undefined' ? localStorage.getItem('session_token') : '';
const apiFetch = (path: string, opts: RequestInit = {}) =>
  fetch(`/api/v1/admin/${path}`, {
    ...opts,
    headers: { 'Authorization': `Bearer ${AUTH()}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });

type Agency = { id: number; name: string; plan: string; is_active: boolean; user_count: number; task_count: number; active_task_count: number; created_at: string; telegram_groups: any[] };
type User = { id: number; username: string; email: string; full_name: string; is_active: boolean; is_admin: boolean; agency: { id: number; name: string; plan: string }; last_login: string | null; task_count: number };
type Task = { id: number; agency: { id: number; name: string }; ticket_name: string; ticket_type: string; language: string; dates: string[]; visitors: number; is_active: boolean; last_checked: string | null; last_status: string };

export default function AdminPanel() {
  const router = useRouter();
  const [view, setView] = useState<'dashboard' | 'agencies' | 'users' | 'tasks'>('dashboard');
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ type: string; data?: any } | null>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('session_token');
    if (!token) { router.push('/'); return; }
    try {
      const res = await fetch('/api/v1/auth/verify/', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (!data.user?.is_super_admin) { router.push('/'); return; }
      loadAll();
    } catch { router.push('/'); }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [a, u, t, s] = await Promise.all([
        apiFetch('agencies/').then(r => r.json()),
        apiFetch('users/').then(r => r.json()),
        apiFetch('tasks/').then(r => r.json()),
        apiFetch('dashboard/overview/').then(r => r.json()),
      ]);
      setAgencies(Array.isArray(a) ? a : []);
      setUsers(Array.isArray(u) ? u : []);
      setTasks(Array.isArray(t) ? t : []);
      setStats(s);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openModal = (type: string, data?: any) => {
    setError('');
    setForm(data ? { ...data } : {});
    setModal({ type, data });
  };
  const closeModal = () => { setModal(null); setForm({}); setError(''); };

  const save = async () => {
    setSaving(true); setError('');
    try {
      if (modal?.type === 'edit-agency') {
        const res = await apiFetch(`agencies/${modal.data.id}/`, { method: 'PATCH', body: JSON.stringify({ name: form.name, plan: form.plan }) });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      } else if (modal?.type === 'create-agency') {
        const res = await apiFetch('agencies/', { method: 'POST', body: JSON.stringify({ name: form.name, plan: form.plan || 'free' }) });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      } else if (modal?.type === 'edit-user') {
        const body: any = { username: form.username, email: form.email, full_name: form.full_name, agency_id: form.agency_id };
        if (form.password) body.password = form.password;
        const res = await apiFetch(`users/${modal.data.id}/`, { method: 'PUT', body: JSON.stringify(body) });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      } else if (modal?.type === 'create-user') {
        const res = await apiFetch('users/', { method: 'POST', body: JSON.stringify({ username: form.username, email: form.email, password: form.password, full_name: form.full_name || '', agency_id: form.agency_id }) });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      } else if (modal?.type === 'edit-task') {
        const res = await apiFetch(`tasks/${modal.data.id}/`, { method: 'PATCH', body: JSON.stringify({ is_active: form.is_active, visitors: form.visitors }) });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      }
      closeModal(); loadAll();
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  };

  const deleteItem = async (type: string, id: number) => {
    if (!confirm('Are you sure?')) return;
    await apiFetch(`${type}/${id}/`, { method: 'DELETE' });
    loadAll();
  };

  const toggleAgency = async (id: number) => {
    await apiFetch(`agencies/${id}/toggle_active/`, { method: 'POST' });
    loadAll();
  };

  const toggleTask = async (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    await apiFetch(`tasks/${id}/`, { method: 'PATCH', body: JSON.stringify({ is_active: !task.is_active }) });
    loadAll();
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mx-auto mb-3" />
        Loading...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="text-red-500 w-6 h-6" />
          <span className="font-bold text-lg">Super Admin</span>
        </div>
        <button onClick={() => router.push('/')} className="text-sm text-gray-400 hover:text-white">← Dashboard</button>
      </div>

      {/* Nav */}
      <div className="flex gap-1 px-6 pt-4">
        {([['dashboard', BarChart3], ['agencies', Building2], ['users', Users], ['tasks', Activity]] as any[]).map(([key, Icon]) => (
          <button key={key} onClick={() => setView(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${view === key ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <Icon className="w-4 h-4" />{key}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-4">

        {/* Dashboard */}
        {view === 'dashboard' && stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              ['Agencies', stats.system_stats?.total_agencies, stats.system_stats?.active_agencies + ' active', 'text-blue-400'],
              ['Users', stats.system_stats?.total_users, stats.system_stats?.active_users + ' active', 'text-green-400'],
              ['Tasks', stats.system_stats?.total_tasks, stats.system_stats?.active_tasks + ' active', 'text-yellow-400'],
              ['New Agencies (30d)', stats.recent_activity?.new_agencies_30d, '', 'text-purple-400'],
              ['New Users (30d)', stats.recent_activity?.new_users_30d, '', 'text-pink-400'],
              ['New Tasks (30d)', stats.recent_activity?.new_tasks_30d, '', 'text-orange-400'],
            ].map(([label, val, sub, color]) => (
              <div key={label as string} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-gray-400 text-xs mb-1">{label}</p>
                <p className={`text-3xl font-bold ${color}`}>{val}</p>
                {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Agencies */}
        {view === 'agencies' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-200">Agencies ({agencies.length})</h2>
              <button onClick={() => openModal('create-agency')} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm">
                <Plus className="w-4 h-4" /> New Agency
              </button>
            </div>
            {agencies.map(a => (
              <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{a.name}</span>
                    <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">{a.plan}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${a.is_active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                      {a.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs">{a.user_count} users · {a.task_count} tasks ({a.active_task_count} active)</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleAgency(a.id)} title="Toggle active" className="p-2 hover:bg-gray-700 rounded-lg">
                    {a.is_active ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5 text-gray-500" />}
                  </button>
                  <button onClick={() => openModal('edit-agency', a)} className="p-2 hover:bg-gray-700 rounded-lg"><Edit className="w-4 h-4 text-blue-400" /></button>
                  <button onClick={() => deleteItem('agencies', a.id)} className="p-2 hover:bg-gray-700 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {view === 'users' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-200">Users ({users.length})</h2>
              <button onClick={() => openModal('create-user')} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm">
                <Plus className="w-4 h-4" /> New User
              </button>
            </div>
            {users.map(u => (
              <div key={u.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{u.username}</span>
                    <span className="text-xs text-gray-400">{u.email}</span>
                    {u.is_admin && <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded">Admin</span>}
                    <span className={`text-xs px-2 py-0.5 rounded ${u.is_active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs">Agency: {u.agency.name} · {u.agency.plan} · Last login: {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openModal('edit-user', { ...u, agency_id: u.agency.id })} className="p-2 hover:bg-gray-700 rounded-lg"><Edit className="w-4 h-4 text-blue-400" /></button>
                  <button onClick={() => deleteItem('users', u.id)} className="p-2 hover:bg-gray-700 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tasks */}
        {view === 'tasks' && (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-200">All Tasks ({tasks.length})</h2>
            {tasks.map(t => (
              <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{t.ticket_name || 'Unnamed'}</span>
                    <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">{t.agency.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${t.is_active ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                      {t.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs">{t.ticket_type} · {t.language || 'Standard'} · {t.visitors} visitors · Dates: {t.dates?.join(', ')}</p>
                  <p className="text-gray-500 text-xs">Last checked: {t.last_checked ? new Date(t.last_checked).toLocaleString() : 'Never'} · Status: {t.last_status || '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleTask(t.id)} title="Toggle active" className="p-2 hover:bg-gray-700 rounded-lg">
                    {t.is_active ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5 text-gray-500" />}
                  </button>
                  <button onClick={() => openModal('edit-task', t)} className="p-2 hover:bg-gray-700 rounded-lg"><Edit className="w-4 h-4 text-blue-400" /></button>
                  <button onClick={() => deleteItem('tasks', t.id)} className="p-2 hover:bg-gray-700 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold capitalize">{modal.type.replace('-', ' ')}</h3>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            {error && <p className="text-red-400 text-sm bg-red-900/30 px-3 py-2 rounded-lg">{error}</p>}

            {/* Agency fields */}
            {(modal.type === 'edit-agency' || modal.type === 'create-agency') && (
              <div className="space-y-3">
                <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Agency name"
                  value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
                <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                  value={form.plan || 'free'} onChange={e => setForm({ ...form, plan: e.target.value })}>
                  <option value="free">Free</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="system">System</option>
                </select>
              </div>
            )}

            {/* User fields */}
            {(modal.type === 'edit-user' || modal.type === 'create-user') && (
              <div className="space-y-3">
                <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Username"
                  value={form.username || ''} onChange={e => setForm({ ...form, username: e.target.value })} />
                <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Email"
                  value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
                <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder={modal.type === 'edit-user' ? 'New password (leave blank to keep)' : 'Password'}
                  type="password" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} />
                <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                  value={form.agency_id || ''} onChange={e => setForm({ ...form, agency_id: parseInt(e.target.value) })}>
                  <option value="">Select agency...</option>
                  {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}

            {/* Task fields */}
            {modal.type === 'edit-task' && (
              <div className="space-y-3">
                <p className="text-gray-400 text-sm">Task: <span className="text-white">{form.ticket_name}</span></p>
                <p className="text-gray-400 text-sm">Agency: <span className="text-white">{form.agency?.name}</span></p>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_active || false} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                  Active
                </label>
                <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Visitors" type="number"
                  value={form.visitors || 1} onChange={e => setForm({ ...form, visitors: parseInt(e.target.value) })} />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={closeModal} className="flex-1 bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
