import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, LogOut, UserPlus, Bell, Trash2, Search, ArrowRight, ChevronDown, MoreHorizontal } from 'lucide-react';
import TrialBanner from '@/components/TrialBanner';
import TrialExpiredModal from '@/components/TrialExpiredModal';
import Onboarding from '@/components/Onboarding';
import { Toaster, toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import InviteModal from '@/components/InviteModal';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/authStore';
import { useTimelineStore } from '@/store/timelineStore';
import { useInvitationsStore } from '@/store/invitationsStore';
import { requestNotificationPermission, isNotificationSupported } from '@/lib/notifications';
import { usePlatform } from '@/hooks/usePlatform';
import { getSocket } from '@/lib/socket';
import { FULL_ACCESS_PLANS, FREE_FOR_ALL } from '@/lib/utils';

interface NewProjectForm {
  title: string;
  description: string;
  date: string;
}

const isCreatorRole = (role?: string) =>
  ['photographer', 'planner', 'creator', 'master'].includes(role || '');

const greetingKey = () => {
  const h = new Date().getHours();
  if (h < 12) return 'dashboard.goodMorning';
  if (h < 19) return 'dashboard.goodAfternoon';
  return 'dashboard.goodEvening';
};

const fmtDateShort = (dateStr: string, locale: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
};

const fmtDateRow = (dateStr: string, locale: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, { month: 'short', day: '2-digit', weekday: 'short' }).toUpperCase();
};

const daysUntil = (dateStr: string) => {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
};

const getStatusKey = (dateStr: string, isNext: boolean): string => {
  if (isNext) return 'dashboard.tagNext';
  const d = daysUntil(dateStr);
  if (d < 0) return 'dashboard.tagPast';
  return 'dashboard.tagUpcoming';
};

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { timelines, createTimeline, fetchTimelines, deleteTimeline, isLoading } = useTimelineStore();
  const { invitations, fetchMyInvitations, acceptInvitation, declineInvitation } = useInvitationsStore();
  const { isIOS, isNative } = usePlatform();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTimelineForInvite, setSelectedTimelineForInvite] = useState<{ id: string; title: string } | null>(null);
  const [selectedTimelineForDelete, setSelectedTimelineForDelete] = useState<{ id: string; title: string } | null>(null);
  const [newProject, setNewProject] = useState<NewProjectForm>({ title: '', description: '', date: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [openYears, setOpenYears] = useState<Set<number>>(() => new Set([new Date().getFullYear()]));
  const [openTlMenuId, setOpenTlMenuId] = useState<string | null>(null);
  const [openTlMenuTitle, setOpenTlMenuTitle] = useState<string>('');
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const openTlMenu = (e: React.MouseEvent, tlId: string, tlTitle: string) => {
    e.preventDefault(); e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setOpenTlMenuTitle(tlTitle);
    setOpenTlMenuId(openTlMenuId === tlId ? null : tlId);
  };
  const [isTrialExpiredModalOpen, setIsTrialExpiredModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user) {
      const key = `onboarding-completed-${user._id}`;
      if (!localStorage.getItem(key)) setShowOnboarding(true);
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    if (user) localStorage.setItem(`onboarding-completed-${user._id}`, 'true');
    setShowOnboarding(false);
  };

  const getOnboardingRole = (): 'creator' | 'guest' => (user?.role === 'guest' ? 'guest' : 'creator');

  const isTrialExpired = !FREE_FOR_ALL && user &&
    !isNative &&
    user.role !== 'master' &&
    !FULL_ACCESS_PLANS.includes(user.current_plan || '') &&
    user.is_trial_active === false &&
    user.current_plan === 'none' &&
    isCreatorRole(user.role);

  const hasActiveTrial = !FREE_FOR_ALL && user &&
    !isNative &&
    user.role !== 'master' &&
    !FULL_ACCESS_PLANS.includes(user.current_plan || '') &&
    user.is_trial_active === true &&
    user.trial_end_date;

  useEffect(() => {
    if (isTrialExpired) {
      const timer = setTimeout(() => setIsTrialExpiredModalOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isTrialExpired]);

  useEffect(() => {
    if (user) { fetchTimelines(); fetchMyInvitations(); }
  }, [user, fetchTimelines, fetchMyInvitations]);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;
    const onInvited = () => fetchTimelines();
    const onReceived = () => fetchMyInvitations();
    socket.on('timeline:invited', onInvited);
    socket.on('invitation:received', onReceived);
    return () => { socket.off('timeline:invited', onInvited); socket.off('invitation:received', onReceived); };
  }, [user, fetchTimelines, fetchMyInvitations]);

  useEffect(() => {
    if (!openTlMenuId) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-tl-menu]')) setOpenTlMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openTlMenuId]);

  useEffect(() => {
    if (!user) return;
    const asked = localStorage.getItem('notification-permission-requested');
    if (!asked && isNotificationSupported() && Notification.permission === 'default') {
      setTimeout(async () => {
        await requestNotificationPermission();
        localStorage.setItem('notification-permission-requested', 'true');
      }, 2000);
    }
  }, [user]);

  const showError = (msg: string) => toast.error(msg, { duration: 5000, position: 'top-center' });

  const handleOpenInviteModal = (id: string, title: string) => {
    setSelectedTimelineForInvite({ id, title });
    setIsInviteModalOpen(true);
  };
  const handleCloseInviteModal = () => { setIsInviteModalOpen(false); setSelectedTimelineForInvite(null); };

  const ownedTimelines = timelines.filter(tl => tl?.owner?._id === user?._id);
  const sharedTimelines = timelines.filter(tl => tl?.owner?._id !== user?._id);
  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  const handleAcceptInvitation = async (id: string) => {
    try { await acceptInvitation(id); await fetchTimelines(); toast.success(t('dashboard.invitationAccepted')); }
    catch { showError(t('dashboard.invitationAcceptError')); }
  };
  const handleDeclineInvitation = async (id: string) => {
    try { await declineInvitation(id); toast.success(t('dashboard.invitationDeclined')); }
    catch { showError(t('dashboard.invitationDeclineError')); }
  };

  const handleOpenDeleteModal = (id: string, title: string) => { setSelectedTimelineForDelete({ id, title }); setIsDeleteModalOpen(true); };
  const handleCloseDeleteModal = () => { setIsDeleteModalOpen(false); setSelectedTimelineForDelete(null); };
  const handleConfirmDelete = async () => {
    if (!selectedTimelineForDelete) return;
    try { await deleteTimeline(selectedTimelineForDelete.id); toast.success(t('dashboard.timelineDeleted')); handleCloseDeleteModal(); }
    catch { showError(t('dashboard.timelineDeleteError')); }
  };

  const toggleYear = (year: number) => {
    setOpenYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year); else next.add(year);
      return next;
    });
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newProject.title.trim()) { showError(t('dashboard.titleRequired')); return; }
    try {
      const weddingDate = new Date(newProject.date + 'T12:00:00.000Z');
      const created = await createTimeline({ title: newProject.title, description: newProject.description, weddingDate: weddingDate.toISOString() });
      if (!created?._id) throw new Error('No ID returned');
      setIsCreateModalOpen(false);
      setNewProject({ title: '', description: '', date: '' });
      toast.success(t('dashboard.projectCreated'));
      navigate(`/timeline/${created._id}`);
    } catch (error: any) {
      showError(error.response?.data?.message || t('dashboard.projectCreateError'));
    }
  };

  // ── Derived data for new layout ──────────────────────────
  const now = new Date(); now.setHours(0, 0, 0, 0);

  const allTimelines = [...ownedTimelines, ...sharedTimelines];

  const sortedByDate = [...allTimelines]
    .filter(tl => !!tl.weddingDate)
    .sort((a, b) => new Date(a.weddingDate!).getTime() - new Date(b.weddingDate!).getTime());

  const filteredSorted = searchQuery.trim()
    ? sortedByDate.filter(tl =>
        tl.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tl.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : sortedByDate;

  const nextTimeline = sortedByDate.find(tl => new Date(tl.weddingDate!) >= now) || null;

  const totalCollaborators = new Set(
    ownedTimelines.flatMap(tl => (tl.collaborators || []).map((c: any) => c._id || c.email))
  ).size;

  const upcomingCount = sortedByDate.filter(tl => new Date(tl.weddingDate!) >= now).length;

  const currentYear = now.getFullYear();

  const byYear = filteredSorted.reduce<Record<number, typeof filteredSorted>>((acc, tl) => {
    const year = new Date(tl.weddingDate!).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(tl);
    return acc;
  }, {});

  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);

  const effectiveOpenYears = searchQuery.trim()
    ? new Set(filteredSorted.map(tl => new Date(tl.weddingDate!).getFullYear()))
    : openYears;

  const isNativeApp =
    (window as any).Capacitor?.isNativePlatform?.() === true ||
    navigator.userAgent.includes('Capacitor') ||
    window.location.href.startsWith('capacitor://');

  if (showOnboarding) {
    return <Onboarding userRole={getOnboardingRole()} onComplete={handleOnboardingComplete} />;
  }

  const firstName = (user?.name || '').split(' ')[0].toUpperCase();
  const locale = i18n.language === 'es' ? 'es-ES' : 'en-US';
  const todayLabel = new Date().toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <div className="flex h-full bg-paper">
      <Toaster position="top-center" />
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <div
          className="flex-1 min-h-0 overflow-y-auto"
          style={isIOS ? { paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' } : undefined}
        >

          {/* Trial Banner */}
          {hasActiveTrial && user && (
            <div className="px-4 sm:px-6 lg:px-8 pt-6">
              <TrialBanner user={user} onViewPlans={() => navigate('/pricing')} />
            </div>
          )}

          {/* ── HERO ── */}
          <div className="border-b-[1.5px] border-ink px-4 sm:px-8 lg:px-12 py-8 sm:py-10">
            <div className="max-w-7xl mx-auto">

              {/* Top row: date + actions */}
              <div className="flex items-start justify-between mb-6 sm:mb-8">
                <p className="font-mono text-[11px] text-stone uppercase tracking-[0.06em]">
                  {todayLabel}
                </p>
                <div className="flex items-center gap-2">
                  {isCreatorRole(user?.role) && (
                    <Button variant="accent" onClick={() => setIsCreateModalOpen(true)} arrow>
                      <Plus size={13} strokeWidth={2} />
                      <span className="hidden sm:inline">{t('dashboard.newProject')}</span>
                      <span className="sm:hidden">NEW</span>
                    </Button>
                  )}
                  <Button variant="ghost" onClick={logout}>
                    <LogOut size={13} strokeWidth={1.5} />
                    <span className="hidden sm:inline">{t('auth.logout')}</span>
                  </Button>
                </div>
              </div>

              {/* Greeting + stats */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] text-stone uppercase tracking-[0.08em] mb-1">
                    {t(greetingKey())}
                  </p>
                  <h1 className="font-display font-bold text-[48px] sm:text-[72px] lg:text-[88px] tracking-[-0.05em] leading-none text-lavender">
                    {firstName}.
                  </h1>
                </div>
                <div className="flex gap-6 sm:gap-8 pb-1">
                  <div>
                    <p className="font-display font-bold text-[28px] sm:text-[36px] tracking-[-0.04em] leading-none text-ink">
                      {ownedTimelines.length}
                    </p>
                    <p className="alto-label text-stone mt-1">{t('dashboard.statProjects')}</p>
                  </div>
                  <div className="border-l-[1px] border-ink/20 pl-6 sm:pl-8">
                    <p className="font-display font-bold text-[28px] sm:text-[36px] tracking-[-0.04em] leading-none text-ink">
                      {upcomingCount}
                    </p>
                    <p className="alto-label text-stone mt-1">{t('dashboard.statUpcoming')}</p>
                  </div>
                  <div className="border-l-[1px] border-ink/20 pl-6 sm:pl-8">
                    <p className="font-display font-bold text-[28px] sm:text-[36px] tracking-[-0.04em] leading-none text-ink">
                      {totalCollaborators}
                    </p>
                    <p className="alto-label text-stone mt-1">{t('dashboard.statCollaborators')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8">

            {/* ── App Store banner ── */}
            {isCreatorRole(user?.role) && !isNativeApp && (
              <div className="mb-8 border-[1.5px] border-ink bg-fog flex flex-col sm:flex-row sm:items-center gap-4 p-5">
                <div className="flex-1">
                  <p className="alto-label mb-1">{t('dashboard.appstoreTitle')}</p>
                  <p className="font-mono text-[12px] text-stone leading-relaxed">
                    {t('dashboard.appstoreDesc')}
                  </p>
                </div>
                <a
                  href="https://apps.apple.com/app/id6761141674"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-[22px] py-[14px] bg-ink text-paper font-mono font-bold text-[11px] uppercase tracking-[0.08em] hover:bg-fog hover:text-ink border-[1.5px] border-ink transition-colors duration-[80ms] whitespace-nowrap"
                >
                  {t('dashboard.appstoreJoin')}
                </a>
              </div>
            )}

            {/* ── Pending invitations ── */}
            {pendingInvitations.length > 0 && (
              <div className="mb-8 border-[1.5px] border-lavender bg-fog p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Bell size={16} strokeWidth={1.5} className="text-lavender" />
                  <span className="alto-label text-ink">
                    {t('dashboard.pendingInvitations', { count: pendingInvitations.length })}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {pendingInvitations.map((inv) => (
                    <div key={inv.timelineId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-[1px] border-ink p-4 bg-paper">
                      <div>
                        <p className="font-display font-bold text-[16px] tracking-[-0.02em] text-ink">{inv.timelineTitle}</p>
                        <p className="alto-label text-stone mt-1">
                          {t('dashboard.invitedBy', { name: inv.invitedBy?.name })}
                          {inv.weddingDate && ` · ${fmtDateShort(inv.weddingDate, locale)}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="accent" onClick={() => handleAcceptInvitation(inv.timelineId)} arrow>
                          {t('dashboard.accept')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeclineInvitation(inv.timelineId)}>
                          {t('dashboard.decline')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── NEXT EVENT CARD ── */}
            {nextTimeline && (
              <div
                className="mb-8 bg-lavender border-[1.5px] border-ink p-6 sm:p-8"
                style={{ transform: 'rotate(-0.8deg)', boxShadow: '5px 7px 0px #0A0A0A' }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-mono text-[10px] text-paper/60 uppercase tracking-[0.08em]">
                        001 /
                      </span>
                      <span className="border-[1px] border-paper/40 px-2 py-0.5 font-mono font-bold text-[9px] text-paper uppercase tracking-[0.08em]">
                        NEXT
                      </span>
                    </div>
                    <h2 className="font-display font-bold text-[32px] sm:text-[44px] tracking-[-0.04em] leading-none text-paper mb-4">
                      {(nextTimeline.title || 'UNTITLED').toUpperCase()}
                    </h2>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="alto-label text-paper/50 w-14 shrink-0">{t('dashboard.labelDate')}</span>
                        <span className="font-mono font-bold text-[11px] text-paper">{fmtDateShort(nextTimeline.weddingDate!, locale)}</span>
                      </div>
                      {nextTimeline.description && (
                        <div className="flex items-start gap-3">
                          <span className="alto-label text-paper/50 w-14 shrink-0">{t('dashboard.labelVenue')}</span>
                          <span className="font-mono text-[11px] text-paper/80 leading-relaxed">{nextTimeline.description}</span>
                        </div>
                      )}
                      {(nextTimeline.collaborators?.length ?? 0) > 0 && (
                        <div className="flex items-center gap-3">
                          <span className="alto-label text-paper/50 w-14 shrink-0">{t('dashboard.labelTeam')}</span>
                          <div className="flex items-center gap-1.5">
                            {(nextTimeline.collaborators || []).slice(0, 5).map((c: any, i: number) => (
                              <Avatar key={i} initials={(c.name || c.email || 'U').slice(0, 2)} size={24} />
                            ))}
                            {(nextTimeline.collaborators?.length ?? 0) > 5 && (
                              <span className="font-mono text-[10px] text-paper/60">+{(nextTimeline.collaborators?.length ?? 0) - 5}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-4 shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="alto-label text-paper/50 mb-1">{t('dashboard.countdown')}</p>
                      <p className="font-display font-bold text-[56px] sm:text-[72px] tracking-[-0.05em] leading-none text-paper">
                        {Math.max(0, daysUntil(nextTimeline.weddingDate!))}D
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/timeline/${nextTimeline._id}`)}
                      className="flex items-center gap-2 border-[1.5px] border-paper bg-paper text-ink px-5 py-3 font-mono font-bold text-[11px] uppercase tracking-[0.06em] hover:bg-ink hover:text-paper hover:border-ink transition-colors duration-[80ms] whitespace-nowrap"
                    >
                      {t('dashboard.openTimeline')}
                      <ArrowRight size={13} strokeWidth={2} />
                    </button>
                    {isCreatorRole(user?.role) && (
                      <button
                        onClick={e => { e.stopPropagation(); handleOpenInviteModal(nextTimeline._id, nextTimeline.title); }}
                        className="flex items-center gap-2 border-[1px] border-paper/30 px-4 py-2 font-mono text-[10px] text-paper/70 uppercase tracking-[0.06em] hover:border-paper hover:text-paper transition-colors duration-[80ms]"
                      >
                        <UserPlus size={11} strokeWidth={1.5} />
                        {t('dashboard.invite')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── THE SEASON ── */}
            {sortedByDate.length > 0 && (
              <div>
                {/* Search + stats */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-0 pb-4 border-b-[1.5px] border-ink">
                  <span className="alto-label text-stone flex-1">
                    {t('dashboard.seasonSummary', { upcoming: upcomingCount, past: sortedByDate.length - upcomingCount })}
                  </span>
                  <div className="relative w-full sm:w-60">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" strokeWidth={1.5} />
                    <input
                      type="text"
                      placeholder={t('dashboard.searchPlaceholder')}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-[9px] border-[1.5px] border-ink bg-paper font-mono text-[11px] text-ink placeholder:text-stone focus:outline-none focus:outline-[2px] focus:outline-lavender"
                    />
                  </div>
                </div>

                {/* Year groups */}
                {years.map(year => {
                  const items = byYear[year];
                  const isCurrentYear = year === currentYear;
                  const isFuture = year > currentYear;
                  const isOpen = effectiveOpenYears.has(year);

                  const sectionTitle = isCurrentYear
                    ? `${t('dashboard.theSeason')} ${year}`
                    : isFuture
                    ? `${t('dashboard.nextSeason')} / ${year}`
                    : `${year} /`;

                  return (
                    <div key={year} className="border-b-[1px] border-ink/15 last:border-b-0">
                      {/* Year toggle */}
                      <button
                        onClick={() => toggleYear(year)}
                        className="w-full flex items-center justify-between py-4 hover:bg-fog transition-colors duration-[80ms] px-2 -mx-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`font-display font-bold text-[20px] tracking-[-0.03em] leading-none ${isCurrentYear || isFuture ? 'text-ink' : 'text-stone'}`}>
                            {sectionTitle}
                          </span>
                          <span className="alto-label text-stone">{items.length}</span>
                        </div>
                        <ChevronDown
                          size={14}
                          strokeWidth={1.5}
                          className={`text-stone transition-transform duration-[150ms] shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {/* Rows */}
                      {isOpen && (
                        <div className="divide-y-[1px] divide-ink/10 mb-2">
                          {items.map((tl, idx) => {
                            const isNext = tl._id === nextTimeline?._id;
                            const label = t(getStatusKey(tl.weddingDate!, isNext));
                            const isPast = daysUntil(tl.weddingDate!) < 0;

                            const tagCls = isNext
                              ? 'border-lavender/50 bg-lavender/10 text-ink'
                              : isPast
                              ? 'border-ink/15 bg-fog text-stone'
                              : 'border-moss/40 bg-moss/8 text-ink';

                            return (
                              <div
                                key={tl._id}
                                onClick={(e) => { if ((e.target as HTMLElement).closest('[data-tl-menu]')) return; navigate(`/timeline/${tl._id}`); }}
                                className={`group cursor-pointer hover:bg-fog transition-colors duration-[80ms] px-2 -mx-2 ${isPast ? 'opacity-50' : ''}`}
                              >
                                {/* ── Mobile layout: 2 lines ── */}
                                <div className="md:hidden py-3 flex gap-3 items-start">
                                  <span className="font-mono text-[10px] text-stone w-7 shrink-0 tabular-nums mt-0.5">
                                    {String(idx + 1).padStart(3, '0')}/
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <span className="font-display font-bold text-[15px] tracking-[-0.02em] text-ink leading-tight group-hover:text-lavender transition-colors duration-[80ms] block">
                                      {(tl.title || 'UNTITLED').toUpperCase()}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="font-mono text-[10px] text-stone tabular-nums">
                                        {fmtDateRow(tl.weddingDate!, locale)}
                                      </span>
                                      <span className={`border-[1px] px-1.5 py-0.5 font-mono font-bold text-[8px] uppercase tracking-[0.06em] ${tagCls}`}>
                                        {label}
                                      </span>
                                    </div>
                                  </div>
                                  {isCreatorRole(user?.role) && (
                                    <div className="relative shrink-0" data-tl-menu>
                                      <button
                                        onMouseDown={e => openTlMenu(e, tl._id, tl.title || '')}
                                        className="p-1.5 text-stone hover:text-ink hover:bg-fog transition-colors duration-[80ms]"
                                      >
                                        <MoreHorizontal size={14} strokeWidth={1.5} />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* ── Desktop layout: 1 line ── */}
                                <div className="hidden md:flex items-center gap-5 py-4">
                                  <span className="font-mono text-[10px] text-stone w-8 shrink-0 tabular-nums">
                                    {String(idx + 1).padStart(3, '0')}/
                                  </span>
                                  <span className="font-mono text-[11px] text-stone w-32 shrink-0 tabular-nums">
                                    {fmtDateRow(tl.weddingDate!, locale)}
                                  </span>
                                  <span className="font-display font-bold text-[18px] tracking-[-0.02em] text-ink flex-1 min-w-0 truncate group-hover:text-lavender transition-colors duration-[80ms]">
                                    {(tl.title || 'UNTITLED').toUpperCase()}
                                  </span>
                                  {tl.description && (
                                    <span className="font-mono text-[11px] text-stone w-56 xl:w-96 shrink-0 leading-relaxed">
                                      {tl.description}
                                    </span>
                                  )}
                                  {/* Fixed-width right column */}
                                  <div className="shrink-0 w-32 flex items-center justify-end gap-2">
                                    <span className={`border-[1px] px-2 py-0.5 font-mono font-bold text-[9px] uppercase tracking-[0.06em] ${tagCls}`}>
                                      {label}
                                    </span>
                                    {isCreatorRole(user?.role) && (
                                      <div className="relative" data-tl-menu>
                                        <button
                                          onMouseDown={e => openTlMenu(e, tl._id, tl.title || '')}
                                          className="p-1.5 text-stone hover:text-ink hover:bg-fog transition-colors duration-[80ms]"
                                        >
                                          <MoreHorizontal size={13} strokeWidth={1.5} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredSorted.length === 0 && searchQuery && (
                  <p className="py-8 text-center alto-label text-stone">{t('dashboard.noResults', { query: searchQuery })}</p>
                )}
              </div>
            )}

            {/* ── Empty state ── */}
            {ownedTimelines.length === 0 && sharedTimelines.length === 0 && !isLoading && (
              <div className="border-[1.5px] border-ink p-12 text-center mt-8">
                <h3 className="font-display font-bold text-[24px] tracking-[-0.03em] text-ink mb-3">
                  {t('dashboard.noProjects').toUpperCase()}
                </h3>
                <p className="font-mono text-[12px] text-stone mb-8 max-w-sm mx-auto leading-relaxed">
                  {isCreatorRole(user?.role) ? t('dashboard.photographerEmptyState') : t('dashboard.guestEmptyState')}
                </p>
                {isCreatorRole(user?.role) && (
                  <Button variant="accent" onClick={() => setIsCreateModalOpen(true)} arrow>
                    <Plus size={14} />
                    {t('dashboard.createFirstProject')}
                  </Button>
                )}
              </div>
            )}

            {isLoading && (
              <div className="border-[1px] border-ink/20 p-8 text-center mt-8">
                <p className="alto-label text-stone">{t('common.loading').toUpperCase()}</p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Create Project Modal ── */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title={t('dashboard.createNewProject').toUpperCase()}>
        <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
          <Input
            label={t('dashboard.projectTitle')}
            type="text"
            value={newProject.title}
            onChange={e => setNewProject(prev => ({ ...prev, title: e.target.value }))}
            required
          />
          <div className="flex flex-col gap-[6px]">
            <span className="alto-label text-ink">{t('dashboard.description')}</span>
            <textarea
              value={newProject.description}
              onChange={e => setNewProject(prev => ({ ...prev, description: e.target.value }))}
              required
              className="w-full border-[1.5px] border-ink bg-fog px-[14px] py-[12px] font-mono text-[14px] text-ink min-h-[80px] resize-y focus:outline-none focus:outline-[2px] focus:outline-lavender"
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <span className="alto-label text-ink">{t('dashboard.eventDate')}</span>
            <input
              type="date"
              value={newProject.date}
              onChange={e => setNewProject(prev => ({ ...prev, date: e.target.value }))}
              required
              min="2000-01-01"
              className="w-full border-[1.5px] border-ink bg-fog px-[14px] py-[12px] font-mono font-bold text-[14px] text-ink focus:outline-none focus:outline-[2px] focus:outline-lavender"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsCreateModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="accent" className="flex-1" arrow>
              {t('dashboard.createProject')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Invite Modal ── */}
      {selectedTimelineForInvite && (
        <InviteModal
          isOpen={isInviteModalOpen}
          onClose={handleCloseInviteModal}
          timelineId={selectedTimelineForInvite.id}
          timelineTitle={selectedTimelineForInvite.title}
        />
      )}

      {/* ── Delete Modal ── */}
      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} title={t('dashboard.deleteTimeline').toUpperCase()}>
        <div className="flex flex-col gap-4">
          <div className="border-[1px] border-brick bg-brick/5 p-4">
            <p className="font-mono text-[12px] text-ink mb-2">{t('dashboard.deleteConfirmation')}</p>
            <p className="font-display font-bold text-[16px] tracking-[-0.02em] text-brick">
              "{selectedTimelineForDelete?.title}"
            </p>
            <p className="alto-label text-stone mt-2">{t('dashboard.deleteConsequence')}</p>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={handleCloseDeleteModal}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleConfirmDelete}>
              {t('dashboard.deletePermanently')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Trial Expired Modal ── */}
      <TrialExpiredModal
        isOpen={isTrialExpiredModalOpen}
        onClose={() => setIsTrialExpiredModalOpen(false)}
        onViewPlans={() => navigate('/pricing')}
      />

      {/* ── Timeline context menu portal ── */}
      {openTlMenuId && menuPos && createPortal(
        <div
          data-tl-menu
          style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 99999 }}
          className="w-44 bg-paper border-[1.5px] border-ink shadow-md"
          onMouseDown={e => e.stopPropagation()}
        >
          <button
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setOpenTlMenuId(null); handleOpenInviteModal(openTlMenuId!, openTlMenuTitle); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 font-mono text-[11px] text-ink hover:bg-fog transition-colors duration-[80ms] border-b border-ink/15"
          >
            <UserPlus size={12} strokeWidth={1.5} />
            {t('dashboard.invite')}
          </button>
          <button
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); handleOpenDeleteModal(openTlMenuId!, openTlMenuTitle); setOpenTlMenuId(null); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 font-mono text-[11px] text-brick hover:bg-brick/5 transition-colors duration-[80ms]"
          >
            <Trash2 size={12} strokeWidth={1.5} />
            {t('dashboard.deleteTimeline')}
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
