import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getAdminUsers, upgradeUserToPro, getActivityLog, getEmailLog } from '@/lib/api';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  current_plan: string;
  createdAt: string;
  plan_expiration_date: string | null;
  plan_start_date: string | null;
  is_trial_active: boolean;
  trial_end_date: string | null;
}

interface ActivityEntry {
  _id: string;
  userId: string;
  userName: string;
  eventType: string;
  details: Record<string, any>;
  ipAddress: string | null;
  timestamp: string;
}

interface EmailEntry {
  _id: string;
  to: string;
  emailType: string;
  lang: string;
  timelineTitle: string | null;
  sentByName: string | null;
  status: 'sent' | 'failed';
  error: string | null;
  openedAt: string | null;
  openCount: number;
  lastOpenedAt: string | null;
  sentAt: string;
}

const PLAN_BADGE: Record<string, string> = {
  master:   'border-lavender/50 bg-lavender/10 text-ink',
  lifetime: 'border-lavender/50 bg-lavender/10 text-ink',
  studio:   'border-ember/40 bg-ember/8 text-ink',
  pro:      'border-moss/40 bg-moss/8 text-ink',
  starter:  'border-moss/40 bg-moss/8 text-ink',
  trial:    'border-ink/20 bg-fog text-stone',
  free:     'border-ink/20 bg-fog text-stone',
};

const EVENT_BADGE: Record<string, string> = {
  'user.register':            'border-moss/40 bg-moss/8 text-ink',
  'user.login':               'border-ink/15 bg-fog text-stone',
  'wedding.create':           'border-lavender/40 bg-lavender/8 text-ink',
  'wedding.activate':         'border-lavender/40 bg-lavender/15 text-ink',
  'wedding.deactivate':       'border-ink/20 bg-fog text-stone',
  'collaborator.invite':      'border-ember/40 bg-ember/8 text-ink',
  'collaborator.accept':      'border-ember/30 bg-ember/5 text-ink',
  'photographer.add':         'border-ink/20 bg-fog text-stone',
  'photographer.photo_upload':'border-ink/15 bg-fog text-stone',
  'shot.check':               'border-moss/30 bg-moss/5 text-stone',
  'error.upload':             'border-brick/40 bg-brick/5 text-brick',
};

const EVENT_TYPES = [
  'user.register','user.login','wedding.create','wedding.activate','wedding.deactivate',
  'collaborator.invite','collaborator.accept','photographer.add','photographer.photo_upload',
  'shot.check','error.upload',
];

const fmt = (dateStr: string | null) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) + ' ' +
    d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
};

const fmtDetails = (details: Record<string, any>) => {
  const skip = ['timelineId', 'shotId'];
  const parts = Object.entries(details).filter(([k]) => !skip.includes(k)).map(([k, v]) => `${k}: ${v}`);
  return parts.join(' · ') || '—';
};

type TabType = 'users' | 'activity' | 'emails';

const TAB_LABEL: Record<TabType, string> = {
  users: 'USUARIOS',
  activity: 'ACTIVITY LOG',
  emails: 'CORREOS',
};

export default function AdminPanel() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>('users');

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [upgradingId, setUpgradingId] = useState<string | null>(null);

  const [logs, setLogs] = useState<ActivityEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [filterEvent, setFilterEvent] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [emails, setEmails] = useState<EmailEntry[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [emailSearch, setEmailSearch] = useState('');
  const emailRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (user && user.role !== 'master') navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const res = await getAdminUsers();
      setUsers(res.data.users);
    } catch { /* silently fail */ }
    finally { setLoadingUsers(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleUpgradePro = async (u: AdminUser) => {
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 30);
    const confirm = window.confirm(
      `¿Dar Studio a ${u.name} hasta ${expDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}?`
    );
    if (!confirm) return;
    setUpgradingId(u._id);
    try {
      await upgradeUserToPro(u._id);
      await fetchUsers();
    } catch { alert('Error al actualizar el plan'); }
    finally { setUpgradingId(null); }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const params: Record<string, string> = {};
      if (filterEvent) params.eventType = filterEvent;
      if (filterFrom) params.from = filterFrom;
      if (filterTo) params.to = filterTo;
      const res = await getActivityLog(params);
      setLogs(res.data.logs);
    } catch { /* silently fail */ }
    finally { setLoadingLogs(false); }
  };

  useEffect(() => {
    if (tab !== 'activity') { if (refreshRef.current) clearInterval(refreshRef.current); return; }
    fetchLogs();
    refreshRef.current = setInterval(fetchLogs, 30_000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, filterEvent, filterFrom, filterTo]);

  const fetchEmails = async () => {
    setLoadingEmails(true);
    try {
      const params: Record<string, string> = {};
      if (emailSearch) params.email = emailSearch;
      const res = await getEmailLog(params);
      setEmails(res.data.emails);
    } catch { /* silently fail */ }
    finally { setLoadingEmails(false); }
  };

  useEffect(() => {
    if (tab !== 'emails') { if (emailRefreshRef.current) clearInterval(emailRefreshRef.current); return; }
    fetchEmails();
    emailRefreshRef.current = setInterval(fetchEmails, 30_000);
    return () => { if (emailRefreshRef.current) clearInterval(emailRefreshRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, emailSearch]);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (!user || user.role !== 'master') return null;

  return (
    <div className="min-h-screen bg-paper">

      {/* Header */}
      <div className="border-b-[1.5px] border-ink bg-paper px-6 py-4 flex items-center justify-between">
        <div>
          <p className="alto-label text-stone mb-0.5">LENZU · ADMIN</p>
          <h1 className="font-display font-bold text-[20px] tracking-[-0.02em] text-ink leading-none">
            PANEL MAESTRO
          </h1>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 alto-label text-stone hover:text-ink transition-colors duration-[80ms]"
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          Dashboard
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b-[1.5px] border-ink bg-paper px-6 flex">
        {(['users', 'activity', 'emails'] as TabType[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 alto-label transition-colors duration-[80ms] border-b-[2px] -mb-[1.5px] ${
              tab === t
                ? 'border-ink text-ink'
                : 'border-transparent text-stone hover:text-ink'
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <>
            <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
              <p className="alto-label text-stone">{users.length} USUARIOS REGISTRADOS</p>
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full sm:w-72 border-[1.5px] border-ink bg-paper px-[14px] py-[10px] font-mono text-[12px] text-ink focus:outline-none focus:outline-[2px] focus:outline-lavender placeholder:text-stone"
              />
            </div>

            {loadingUsers ? (
              <div className="py-16 text-center alto-label text-stone">Cargando...</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center alto-label text-stone">Sin resultados</div>
            ) : (
              <div className="border-[1.5px] border-ink overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-[1px] border-ink/20 bg-fog">
                        {['Nombre','Email','Plan','Registro','Expira','Trial',''].map((h, i) => (
                          <th key={i} className="text-left px-4 py-3 alto-label text-stone whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y-[1px] divide-ink/10">
                      {filtered.map(u => (
                        <tr key={u._id} className="hover:bg-fog/50 transition-colors duration-[80ms]">
                          <td className="px-4 py-3 font-mono font-bold text-[12px] text-ink whitespace-nowrap">{u.name}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-stone">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className={`border-[1px] px-2 py-0.5 font-mono font-bold text-[10px] uppercase tracking-[0.04em] ${PLAN_BADGE[u.current_plan] || 'border-ink/20 bg-fog text-stone'}`}>
                              {u.current_plan || 'none'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-stone whitespace-nowrap">{fmt(u.createdAt)}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-stone whitespace-nowrap">{fmt(u.plan_expiration_date)}</td>
                          <td className="px-4 py-3 font-mono text-[11px]">
                            {u.is_trial_active
                              ? <span className="text-moss font-bold">Activo</span>
                              : <span className="text-stone">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {u.role !== 'master' && (
                              <button
                                onClick={() => handleUpgradePro(u)}
                                disabled={upgradingId === u._id}
                                className="border-[1.5px] border-ink bg-ink text-paper px-3 py-1.5 font-mono font-bold text-[10px] uppercase tracking-[0.04em] hover:bg-ink/80 transition-colors duration-[80ms] disabled:opacity-40 whitespace-nowrap"
                              >
                                {upgradingId === u._id ? '...' : 'Dar Studio 30d'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── ACTIVITY LOG TAB ── */}
        {tab === 'activity' && (
          <>
            <div className="flex flex-wrap gap-2 mb-6 items-center">
              <select
                value={filterEvent}
                onChange={e => setFilterEvent(e.target.value)}
                className="border-[1.5px] border-ink bg-paper px-3 py-[10px] font-mono text-[11px] text-ink focus:outline-none focus:outline-[2px] focus:outline-lavender"
              >
                <option value="">Todos los eventos</option>
                {EVENT_TYPES.map(et => <option key={et} value={et}>{et}</option>)}
              </select>

              <div className="flex items-center gap-2">
                <span className="alto-label text-stone">DESDE</span>
                <input
                  type="date"
                  value={filterFrom}
                  onChange={e => setFilterFrom(e.target.value)}
                  className="border-[1.5px] border-ink bg-paper px-3 py-[9px] font-mono text-[11px] text-ink focus:outline-none focus:outline-[2px] focus:outline-lavender"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="alto-label text-stone">HASTA</span>
                <input
                  type="date"
                  value={filterTo}
                  onChange={e => setFilterTo(e.target.value)}
                  className="border-[1.5px] border-ink bg-paper px-3 py-[9px] font-mono text-[11px] text-ink focus:outline-none focus:outline-[2px] focus:outline-lavender"
                />
              </div>

              {(filterEvent || filterFrom || filterTo) && (
                <button
                  onClick={() => { setFilterEvent(''); setFilterFrom(''); setFilterTo(''); }}
                  className="flex items-center gap-1.5 border-[1.5px] border-ink px-3 py-[9px] alto-label text-stone hover:text-ink transition-colors duration-[80ms]"
                >
                  <X size={11} strokeWidth={1.5} />
                  Limpiar
                </button>
              )}

              <div className="ml-auto flex items-center gap-3">
                <span className="alto-label text-stone">AUTO 30S</span>
                <button
                  onClick={fetchLogs}
                  disabled={loadingLogs}
                  className="flex items-center gap-1.5 border-[1.5px] border-ink px-3 py-[9px] alto-label text-ink hover:bg-fog transition-colors duration-[80ms] disabled:opacity-40"
                >
                  <RefreshCw size={11} strokeWidth={1.5} className={loadingLogs ? 'animate-spin' : ''} />
                  Actualizar
                </button>
              </div>
            </div>

            {loadingLogs && logs.length === 0 ? (
              <div className="py-16 text-center alto-label text-stone">Cargando...</div>
            ) : logs.length === 0 ? (
              <div className="py-16 text-center alto-label text-stone">Sin actividad registrada</div>
            ) : (
              <div className="border-[1.5px] border-ink overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-[1px] border-ink/20 bg-fog">
                        {['Fecha / Hora','Usuario','Evento','Detalles'].map(h => (
                          <th key={h} className="text-left px-4 py-3 alto-label text-stone whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y-[1px] divide-ink/10">
                      {logs.map(log => (
                        <tr key={log._id} className="hover:bg-fog/50 transition-colors duration-[80ms]">
                          <td className="px-4 py-3 font-mono text-[10px] text-stone whitespace-nowrap">{fmtTime(log.timestamp)}</td>
                          <td className="px-4 py-3 font-mono font-bold text-[11px] text-ink whitespace-nowrap">
                            {log.userName || <span className="text-stone font-normal">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`border-[1px] px-2 py-0.5 font-mono font-bold text-[9px] uppercase tracking-[0.04em] whitespace-nowrap ${EVENT_BADGE[log.eventType] || 'border-ink/20 bg-fog text-stone'}`}>
                              {log.eventType}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[10px] text-stone max-w-xs truncate">
                            {fmtDetails(log.details)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t-[1px] border-ink/15 bg-fog">
                  <p className="alto-label text-stone">MOSTRANDO {logs.length} EVENTOS MÁS RECIENTES</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── EMAILS TAB ── */}
        {tab === 'emails' && (
          <>
            <div className="flex flex-wrap gap-2 mb-6 items-center">
              <input
                type="text"
                placeholder="Buscar por email destinatario..."
                value={emailSearch}
                onChange={e => setEmailSearch(e.target.value)}
                className="w-full sm:w-72 border-[1.5px] border-ink bg-paper px-[14px] py-[10px] font-mono text-[12px] text-ink focus:outline-none focus:outline-[2px] focus:outline-lavender placeholder:text-stone"
              />
              <div className="ml-auto flex items-center gap-3">
                <span className="alto-label text-stone">AUTO 30S</span>
                <button
                  onClick={fetchEmails}
                  disabled={loadingEmails}
                  className="flex items-center gap-1.5 border-[1.5px] border-ink px-3 py-[9px] alto-label text-ink hover:bg-fog transition-colors duration-[80ms] disabled:opacity-40"
                >
                  <RefreshCw size={11} strokeWidth={1.5} className={loadingEmails ? 'animate-spin' : ''} />
                  Actualizar
                </button>
              </div>
            </div>

            {loadingEmails && emails.length === 0 ? (
              <div className="py-16 text-center alto-label text-stone">Cargando...</div>
            ) : emails.length === 0 ? (
              <div className="py-16 text-center alto-label text-stone">Sin correos registrados aún</div>
            ) : (
              <div className="border-[1.5px] border-ink overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-[1px] border-ink/20 bg-fog">
                        {['Fecha / Hora','Destinatario','Proyecto','Invitó','Estado','Aperturas'].map(h => (
                          <th key={h} className="text-left px-4 py-3 alto-label text-stone whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y-[1px] divide-ink/10">
                      {emails.map(m => (
                        <tr key={m._id} className="hover:bg-fog/50 transition-colors duration-[80ms]">
                          <td className="px-4 py-3 font-mono text-[10px] text-stone whitespace-nowrap">{fmtTime(m.sentAt)}</td>
                          <td className="px-4 py-3 font-mono font-bold text-[11px] text-ink whitespace-nowrap">{m.to}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-stone max-w-[180px] truncate">{m.timelineTitle || '—'}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-stone whitespace-nowrap">{m.sentByName || '—'}</td>
                          <td className="px-4 py-3">
                            {m.status === 'failed' ? (
                              <span className="border-[1px] border-brick/40 bg-brick/5 text-brick px-2 py-0.5 font-mono font-bold text-[9px] uppercase tracking-[0.04em] whitespace-nowrap" title={m.error || ''}>
                                Error
                              </span>
                            ) : m.openedAt ? (
                              <span className="border-[1px] border-moss/40 bg-moss/8 text-ink px-2 py-0.5 font-mono font-bold text-[9px] uppercase tracking-[0.04em] whitespace-nowrap">
                                Abierto
                              </span>
                            ) : (
                              <span className="border-[1px] border-ink/20 bg-fog text-stone px-2 py-0.5 font-mono font-bold text-[9px] uppercase tracking-[0.04em] whitespace-nowrap">
                                Enviado
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-[10px] text-stone whitespace-nowrap">
                            {m.openCount > 0
                              ? `${m.openCount}× · última ${fmtTime(m.lastOpenedAt || m.openedAt || m.sentAt)}`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t-[1px] border-ink/15 bg-fog">
                  <p className="alto-label text-stone">
                    MOSTRANDO {emails.length} CORREOS · "ABIERTO" USA PIXEL DE TRACKING — APPLE MAIL PUEDE MARCAR APERTURAS AUTOMÁTICAS
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
