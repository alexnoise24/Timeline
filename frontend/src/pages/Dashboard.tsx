import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, LogOut, UserPlus, Share2, Bell, Trash2, Search, ChevronRight } from 'lucide-react';
import TrialBanner from '@/components/TrialBanner';
import TrialExpiredModal from '@/components/TrialExpiredModal';
import Onboarding from '@/components/Onboarding';
import { Toaster, toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Tag from '@/components/ui/Tag';
import Ticket from '@/components/ui/Ticket';
import Avatar from '@/components/ui/Avatar';
import InviteModal from '@/components/InviteModal';
import Sidebar from '@/components/Sidebar';
import CountdownTimer from '@/components/CountdownTimer';
import { useAuthStore } from '@/store/authStore';
import { useTimelineStore } from '@/store/timelineStore';
import { useInvitationsStore } from '@/store/invitationsStore';
import { requestNotificationPermission, isNotificationSupported } from '@/lib/notifications';
import { usePlatform } from '@/hooks/usePlatform';
import { getSocket } from '@/lib/socket';

interface NewProjectForm {
  title: string;
  description: string;
  date: string;
}

const isCreatorRole = (role?: string) =>
  ['photographer', 'planner', 'creator', 'master'].includes(role || '');

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { timelines, createTimeline, fetchTimelines, deleteTimeline, isLoading } = useTimelineStore();
  const { invitations, fetchMyInvitations, acceptInvitation, declineInvitation } = useInvitationsStore();
  const { isIOS } = usePlatform();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTimelineForInvite, setSelectedTimelineForInvite] = useState<{ id: string; title: string } | null>(null);
  const [selectedTimelineForDelete, setSelectedTimelineForDelete] = useState<{ id: string; title: string } | null>(null);
  const [newProject, setNewProject] = useState<NewProjectForm>({ title: '', description: '', date: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
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

  const FULL_ACCESS_PLANS = ['master', 'lifetime', 'studio', 'pro', 'starter'];

  const isTrialExpired = user &&
    user.role !== 'master' &&
    !FULL_ACCESS_PLANS.includes(user.current_plan || '') &&
    user.is_trial_active === false &&
    user.current_plan === 'none' &&
    isCreatorRole(user.role);

  const hasActiveTrial = user &&
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

  const ownedTimelines = timelines.filter(t => t?.owner?._id === user?._id);
  const sharedTimelines = timelines.filter(t => t?.owner?._id !== user?._id);
  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  const groupTimelinesByMonth = (list: typeof timelines) => {
    const grouped: { [key: string]: typeof timelines } = {};
    list.forEach(tl => {
      if (tl.weddingDate) {
        const d = new Date(tl.weddingDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(tl);
      }
    });
    Object.keys(grouped).forEach(k => grouped[k].sort((a, b) => new Date(a.weddingDate!).getTime() - new Date(b.weddingDate!).getTime()));
    const sorted: { [key: string]: typeof timelines } = {};
    Object.keys(grouped).sort().forEach(k => { sorted[k] = grouped[k]; });
    return sorted;
  };

  const getMonthLabel = (key: string) => {
    const [y, m] = key.split('-');
    const d = new Date(parseInt(y), parseInt(m) - 1);
    const locale = i18n.language === 'es' ? 'es-ES' : 'en-US';
    return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' }).toUpperCase();
  };

  const filterTimelines = (list: typeof timelines) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(tl => tl.title?.toLowerCase().includes(q) || tl.description?.toLowerCase().includes(q));
  };

  const groupedOwned = groupTimelinesByMonth(filterTimelines(ownedTimelines));
  const groupedShared = groupTimelinesByMonth(filterTimelines(sharedTimelines));

  useEffect(() => {
    if (ownedTimelines.length > 0 || sharedTimelines.length > 0) {
      const keys = new Set<string>();
      [...Object.keys(groupTimelinesByMonth(ownedTimelines)), ...Object.keys(groupTimelinesByMonth(sharedTimelines))].forEach(k => keys.add(k));
      setCollapsedMonths(keys);
    }
  }, [ownedTimelines.length, sharedTimelines.length]);

  const toggleMonth = (key: string) => setCollapsedMonths(prev => {
    const s = new Set(prev);
    s.has(key) ? s.delete(key) : s.add(key);
    return s;
  });

  const handleAcceptInvitation = async (id: string) => {
    try { await acceptInvitation(id); await fetchTimelines(); toast.success('Invitation accepted.'); }
    catch { showError('Failed to accept invitation'); }
  };
  const handleDeclineInvitation = async (id: string) => {
    try { await declineInvitation(id); toast.success('Invitation declined.'); }
    catch { showError('Failed to decline invitation'); }
  };

  const handleOpenDeleteModal = (id: string, title: string) => { setSelectedTimelineForDelete({ id, title }); setIsDeleteModalOpen(true); };
  const handleCloseDeleteModal = () => { setIsDeleteModalOpen(false); setSelectedTimelineForDelete(null); };
  const handleConfirmDelete = async () => {
    if (!selectedTimelineForDelete) return;
    try { await deleteTimeline(selectedTimelineForDelete.id); toast.success('Timeline deleted.'); handleCloseDeleteModal(); }
    catch { showError('Failed to delete timeline'); }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newProject.title.trim()) { showError('Project title is required'); return; }
    try {
      const weddingDate = new Date(newProject.date + 'T12:00:00.000Z');
      const created = await createTimeline({ title: newProject.title, description: newProject.description, weddingDate: weddingDate.toISOString() });
      if (!created?._id) throw new Error('No ID returned');
      setIsCreateModalOpen(false);
      setNewProject({ title: '', description: '', date: '' });
      toast.success('Project created.');
      navigate(`/timeline/${created._id}`);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to create project.');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  if (showOnboarding) {
    return <Onboarding userRole={getOnboardingRole()} onComplete={handleOnboardingComplete} />;
  }

  const isNativeApp =
    (window as any).Capacitor?.isNativePlatform?.() === true ||
    navigator.userAgent.includes('Capacitor') ||
    window.location.href.startsWith('capacitor://');

  return (
    <div className="flex h-screen bg-paper">
      <Toaster position="top-center" />
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <div className={`flex-1 min-h-0 overflow-y-auto ${isIOS ? 'pb-24' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Trial Banner */}
            {hasActiveTrial && user && (
              <TrialBanner user={user} onViewPlans={() => navigate('/pricing')} />
            )}

            {/* ── Page header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 pb-6 border-b-[1.5px] border-ink">
              <div>
                <p className="alto-label text-stone mb-2">LENZU · DASHBOARD</p>
                <h1 className="font-display text-[36px] sm:text-[48px] font-bold tracking-[-0.04em] leading-none text-ink">
                  {t('dashboard.myProjects').toUpperCase()}
                </h1>
              </div>
              <div className="flex gap-2">
                {isCreatorRole(user?.role) && (
                  <Button variant="accent" onClick={() => setIsCreateModalOpen(true)} arrow>
                    <Plus size={14} strokeWidth={2} />
                    {t('dashboard.newProject')}
                  </Button>
                )}
                <Button variant="ghost" onClick={logout}>
                  <LogOut size={14} strokeWidth={1.5} />
                  <span className="hidden xs:inline">{t('auth.logout')}</span>
                </Button>
              </div>
            </div>

            {/* ── TestFlight banner ── */}
            {isCreatorRole(user?.role) && !isNativeApp && (
              <div className="mb-8 border-[1.5px] border-ink bg-fog flex flex-col sm:flex-row sm:items-center gap-4 p-5">
                <div className="flex-1">
                  <p className="alto-label mb-1">APP iOS · TESTFLIGHT</p>
                  <p className="font-mono text-[12px] text-stone leading-relaxed">
                    Lenzu disponible en TestFlight — instálala para el día de la boda.
                  </p>
                </div>
                <a
                  href="https://testflight.apple.com/join/UbSPGPQ2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-[22px] py-[14px] bg-ink text-paper font-mono font-bold text-[11px] uppercase tracking-[0.08em] hover:bg-fog hover:text-ink border-[1.5px] border-ink transition-colors duration-snap whitespace-nowrap"
                >
                  Unirse al Beta →
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
                          {inv.weddingDate && ` · ${formatDate(inv.weddingDate)}`}
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

            {/* ── My Projects ── */}
            {isCreatorRole(user?.role) && ownedTimelines.length > 0 && (
              <div className="mb-12">
                {/* Search */}
                <div className="relative mb-6">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone" strokeWidth={1.5} />
                  <input
                    type="text"
                    placeholder={t('dashboard.searchProjects')}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-[12px] border-[1.5px] border-ink bg-fog font-mono text-[12px] text-ink placeholder:text-stone placeholder:font-normal focus:outline-none focus:outline-[2px] focus:outline-lavender"
                  />
                </div>

                {Object.entries(groupedOwned).map(([monthKey, timelinesInMonth]) => (
                  <div key={monthKey} className="mb-8">
                    {/* Month header */}
                    <button
                      onClick={() => toggleMonth(monthKey)}
                      className="w-full flex items-center gap-3 text-left mb-4 hover:opacity-70 transition-opacity duration-snap"
                    >
                      <ChevronRight
                        size={16}
                        className={`text-stone transition-transform duration-snap ${collapsedMonths.has(monthKey) ? '' : 'rotate-90'}`}
                        strokeWidth={2}
                      />
                      <span className="font-display font-bold text-[14px] tracking-[-0.02em] text-ink">{getMonthLabel(monthKey)}</span>
                      <Tag variant="solid">{timelinesInMonth.length}</Tag>
                    </button>

                    {!collapsedMonths.has(monthKey) && (
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {timelinesInMonth.map((timeline) => (
                          <div key={timeline._id} className="group relative border-[1.5px] border-ink bg-fog hover:bg-paper transition-colors duration-snap">
                            {/* Delete button */}
                            <button
                              onClick={e => { e.stopPropagation(); handleOpenDeleteModal(timeline._id, timeline.title); }}
                              className="absolute top-3 right-3 p-2 opacity-0 group-hover:opacity-100 hover:bg-brick hover:text-paper text-stone transition-all duration-snap"
                              title={t('dashboard.deleteTimeline')}
                            >
                              <Trash2 size={12} strokeWidth={1.5} />
                            </button>

                            {/* Ticket accent */}
                            <div className="absolute top-0 right-12 flex justify-end pt-0 pr-0 overflow-hidden">
                              {timeline.weddingDate && (
                                <Ticket
                                  size={36}
                                  content={`${String(new Date(timeline.weddingDate).getMonth() + 1).padStart(2, '0')}/${String(new Date(timeline.weddingDate).getDate()).padStart(2, '0')}`}
                                  rotate={-6}
                                  shadow={false}
                                />
                              )}
                            </div>

                            <div className="p-5 cursor-pointer" onClick={() => navigate(`/timeline/${timeline._id}`)}>
                              {/* Tags row */}
                              <div className="flex items-center gap-2 mb-3 flex-wrap">
                                <Tag variant="default">TIMELINE</Tag>
                                {timeline.weddingDate && (
                                  <Tag variant="accent" dot>
                                    <CountdownTimer targetDate={timeline.weddingDate} compact showIcon={false} className="!p-0 !bg-transparent !text-ink !text-[10px]" />
                                  </Tag>
                                )}
                              </div>

                              {/* Title */}
                              <h3 className="font-display font-bold text-[22px] tracking-[-0.02em] leading-tight text-ink mb-1 pr-8">
                                {(timeline.title || 'Untitled').toUpperCase()}
                              </h3>

                              {/* Meta */}
                              <div className="mt-3 space-y-1">
                                {timeline.weddingDate && (
                                  <p className="alto-label text-stone">{formatDate(timeline.weddingDate)}</p>
                                )}
                                {timeline.description && (
                                  <p className="font-mono text-[11px] text-stone leading-relaxed line-clamp-2">{timeline.description}</p>
                                )}
                              </div>

                              {/* Collaborator avatars */}
                              {(timeline.collaborators?.length ?? 0) > 0 && (
                                <div className="flex items-center gap-1 mt-4">
                                  {(timeline.collaborators || []).slice(0, 4).map((c: any, i: number) => (
                                    <Avatar key={i} initials={(c.name || c.email || 'U').slice(0, 2)} size={24} />
                                  ))}
                                  {(timeline.collaborators?.length ?? 0) > 4 && (
                                    <Avatar initials="" overflow={(timeline.collaborators?.length ?? 0) - 4} size={24} />
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Invite button */}
                            <div className="border-t-[1px] border-ink/20 px-5 py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-center"
                                onClick={e => { e.stopPropagation(); handleOpenInviteModal(timeline._id, timeline.title); }}
                              >
                                <UserPlus size={12} strokeWidth={1.5} />
                                {t('dashboard.inviteCollaborators')}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Shared Timelines ── */}
            {sharedTimelines.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6 pb-3 border-b-[1px] border-ink/20">
                  <Share2 size={16} strokeWidth={1.5} className="text-stone" />
                  <span className="font-display font-bold text-[18px] tracking-[-0.02em] text-ink">
                    {t('dashboard.sharedTimelines').toUpperCase()}
                  </span>
                </div>
                {Object.entries(groupedShared).map(([monthKey, timelinesInMonth]) => (
                  <div key={monthKey} className="mb-6">
                    <p className="alto-label text-stone mb-3">{getMonthLabel(monthKey)}</p>
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {timelinesInMonth.map((timeline) => (
                        <div
                          key={timeline._id}
                          className="border-[1.5px] border-ink bg-fog hover:bg-paper transition-colors duration-snap cursor-pointer p-5"
                          onClick={() => navigate(`/timeline/${timeline._id}`)}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Tag variant="default">SHARED</Tag>
                          </div>
                          <h3 className="font-display font-bold text-[20px] tracking-[-0.02em] leading-tight text-ink mb-1">
                            {(timeline.title || 'Untitled').toUpperCase()}
                          </h3>
                          {timeline.weddingDate && (
                            <p className="alto-label text-stone mt-2">{formatDate(timeline.weddingDate)}</p>
                          )}
                          <p className="alto-label text-stone mt-1">
                            {t('dashboard.ownedBy', { name: timeline.owner?.name || t('common.unknown') })}
                          </p>
                          {timeline.weddingDate && (
                            <div className="mt-3">
                              <CountdownTimer targetDate={timeline.weddingDate} compact />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Empty state ── */}
            {ownedTimelines.length === 0 && sharedTimelines.length === 0 && !isLoading && (
              <div className="border-[1.5px] border-ink p-12 text-center">
                <div className="flex justify-center mb-6">
                  <Ticket size={64} content="0" rotate={-6} />
                </div>
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

            {/* Loading state */}
            {isLoading && (
              <div className="border-[1px] border-ink/20 p-8 text-center">
                <p className="alto-label text-stone">LOADING ·</p>
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
    </div>
  );
}
