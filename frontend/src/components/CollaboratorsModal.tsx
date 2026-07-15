import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Trash2, X, Clock, Copy, Check, Mail, RefreshCw } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Timeline } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useTimelineStore } from '@/store/timelineStore';
import { useInvitationsStore } from '@/store/invitationsStore';
import { toast } from 'sonner';
import api from '@/lib/api';

interface CollaboratorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeline: Timeline;
}

interface PendingInvitation {
  type: 'user' | 'email';
  userId?: string;      // only for registered users
  userName?: string;    // only for registered users
  userEmail: string;
  invitedAt: string;
  lang?: 'es' | 'en';   // email invites: language the email was sent in
  status: string;
}

export default function CollaboratorsModal({ isOpen, onClose, timeline }: CollaboratorsModalProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const { removeCollaborator } = useTimelineStore();
  const { inviteGuest, createInviteLink } = useInvitationsStore();
  const [lang, setLang] = useState<'es' | 'en'>(i18n.language?.startsWith('en') ? 'en' : 'es');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteUrlLoading, setInviteUrlLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwner = user && timeline.owner._id === user._id;

  useEffect(() => {
    if (isOpen && isOwner) {
      fetchPendingInvitations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isOwner, timeline._id]);

  const fetchPendingInvitations = async () => {
    setIsLoadingInvitations(true);
    try {
      const { data } = await api.get(`/invitations/timeline/${timeline._id}/pending`);
      setPendingInvitations(data.invitations || []);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      await inviteGuest(timeline._id, inviteEmail.trim(), lang);
      setInviteStatus('Invitación enviada');
      setInviteEmail('');
      setTimeout(() => setInviteStatus(null), 3000);
      fetchPendingInvitations();
    } catch (err: any) {
      setInviteStatus(err?.response?.data?.message || 'Error al enviar invitación');
      setTimeout(() => setInviteStatus(null), 4000);
    }
  };

  const handleGenerateLink = async () => {
    setInviteUrlLoading(true);
    try {
      const token = await createInviteLink(timeline._id);
      setInviteUrl(`${window.location.origin}/invite/${token}`);
    } catch {
      toast.error('Error al generar enlace');
    } finally {
      setInviteUrlLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveCollaborator = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} from this timeline?`)) {
      return;
    }

    setRemovingId(userId);
    try {
      await removeCollaborator(timeline._id, userId);
      toast.success('Collaborator removed successfully');
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast.error('Failed to remove collaborator');
    } finally {
      setRemovingId(null);
    }
  };

  const handleRevokeInvitation = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to revoke the invitation for ${userName}?`)) {
      return;
    }

    setRevokingId(userId);
    try {
      await api.delete(`/invitations/timeline/${timeline._id}/revoke/${userId}`);
      toast.success('Invitation revoked successfully');
      // Refresh pending invitations list
      await fetchPendingInvitations();
    } catch (error) {
      console.error('Error revoking invitation:', error);
      toast.error('Failed to revoke invitation');
    } finally {
      setRevokingId(null);
    }
  };

  // Email invites (unregistered addresses) are keyed by email, not userId
  const handleCancelEmailInvite = async (email: string) => {
    if (!window.confirm(`Are you sure you want to cancel the invitation for ${email}?`)) {
      return;
    }

    setRevokingId(email);
    try {
      await api.delete(`/invitations/timeline/${timeline._id}/email-invite`, {
        params: { email }
      });
      toast.success('Invitation cancelled');
      await fetchPendingInvitations();
    } catch (error) {
      console.error('Error cancelling email invitation:', error);
      toast.error('Failed to cancel invitation');
    } finally {
      setRevokingId(null);
    }
  };

  // Re-sends the invitation email with a fresh token (tokens expire after 30 days)
  const handleResendEmailInvite = async (email: string, inviteLang?: 'es' | 'en') => {
    setResendingId(email);
    try {
      await inviteGuest(timeline._id, email, inviteLang || lang);
      toast.success('Invitation re-sent');
      await fetchPendingInvitations();
    } catch (error) {
      console.error('Error re-sending email invitation:', error);
      toast.error('Failed to re-send invitation');
    } finally {
      setResendingId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Collaborators">
      <div className="space-y-4">

        {/* Invite form — owner only */}
        {isOwner && (
          <div className="border-[1.5px] border-ink p-4">
            <p className="alto-label text-ink mb-3">INVITAR COLABORADOR</p>
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="flex-1 border-[1.5px] border-ink bg-fog px-3 py-2 font-mono text-[13px] text-ink focus:outline-none focus:outline-[2px] focus:outline-lavender placeholder:text-stone"
              />
              <Button type="submit" variant="accent">Invitar</Button>
            </form>

            {/* Email language selector */}
            <div className="flex items-center gap-2 mt-2">
              <span className="alto-label text-stone">{t('invite.emailLanguage')}</span>
              <div className="inline-flex border-[1.5px] border-ink overflow-hidden">
                {(['es', 'en'] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    className={`px-2.5 py-0.5 font-mono text-[11px] font-bold transition-colors ${
                      lang === code ? 'bg-ink text-paper' : 'bg-fog text-stone hover:text-ink'
                    }`}
                  >
                    {code === 'es' ? 'ES' : 'EN'}
                  </button>
                ))}
              </div>
            </div>

            {inviteStatus && (
              <p className="font-mono text-[11px] text-stone mt-2">{inviteStatus}</p>
            )}

            {/* Share link */}
            <div className="mt-3">
              {!inviteUrl ? (
                <button
                  onClick={handleGenerateLink}
                  disabled={inviteUrlLoading}
                  className="alto-label text-lavender hover:text-lavender-deep transition-colors duration-[80ms] disabled:opacity-50"
                >
                  {inviteUrlLoading ? 'Generando...' : '+ Generar enlace de invitación'}
                </button>
              ) : (
                <div>
                  <p className="alto-label text-stone mb-1">ENLACE DE INVITACIÓN</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteUrl}
                      onFocus={(e) => e.target.select()}
                      className="flex-1 border-[1.5px] border-ink bg-fog px-3 py-2 font-mono text-[11px] text-stone focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="border-[1.5px] border-ink px-3 flex items-center gap-1.5 alto-label text-ink hover:bg-fog transition-colors duration-[80ms]"
                    >
                      {copied ? <Check size={12} strokeWidth={2} className="text-moss" /> : <Copy size={12} strokeWidth={1.5} />}
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Owner */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Owner</h3>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                {timeline.owner.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">{timeline.owner.name}</p>
                <p className="text-sm text-gray-600">{timeline.owner.email}</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
              Owner
            </span>
          </div>
        </div>

        {/* Collaborators */}
        {timeline.collaborators.filter(c => c.user != null).length > 0 ? (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Collaborators ({timeline.collaborators.filter(c => c.user != null).length})
            </h3>
            <div className="space-y-2">
              {timeline.collaborators.filter(c => c.user != null).map((collab, index) => {
                const userId = collab.user?._id || (typeof collab.user === 'string' ? collab.user : null);
                const userName = collab.user?.name || collab.user?.email || 'User';
                const userEmail = collab.user?.email || '';
                const userInitial = userName.charAt(0).toUpperCase();

                return (
                  <div
                    key={userId?.toString() || `collab-${index}`}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold">
                        {userInitial}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{userName}</p>
                        {userEmail && <p className="text-sm text-gray-600">{userEmail}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full capitalize">
                        {collab.role}
                      </span>
                      {isOwner && userId && (
                        <button
                          onClick={() => handleRemoveCollaborator(userId.toString(), userName)}
                          disabled={removingId === userId?.toString()}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Remove collaborator"
                        >
                          {removingId === userId?.toString() ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Users size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No collaborators yet</p>
          </div>
        )}

        {/* Pending Invitations */}
        {isOwner && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Pending Invitations ({pendingInvitations.length})
            </h3>
            {isLoadingInvitations ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent mx-auto" />
              </div>
            ) : pendingInvitations.length > 0 ? (
              <div className="space-y-2">
                {pendingInvitations.map((invitation) => {
                  const isEmailInvite = invitation.type === 'email';
                  const inviteKey = isEmailInvite ? invitation.userEmail : invitation.userId!;
                  return (
                    <div
                      key={inviteKey}
                      className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-semibold">
                          {isEmailInvite ? <Mail size={20} /> : <Clock size={20} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {isEmailInvite ? invitation.userEmail : invitation.userName}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {isEmailInvite
                              ? `Invited ${new Date(invitation.invitedAt).toLocaleDateString()} · not registered yet`
                              : invitation.userEmail}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                          Pending
                        </span>
                        {isEmailInvite && (
                          <button
                            onClick={() => handleResendEmailInvite(invitation.userEmail, invitation.lang)}
                            disabled={resendingId === invitation.userEmail}
                            className="p-2 text-gray-600 hover:bg-yellow-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Re-send invitation email"
                          >
                            {resendingId === invitation.userEmail ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent" />
                            ) : (
                              <RefreshCw size={16} />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() =>
                            isEmailInvite
                              ? handleCancelEmailInvite(invitation.userEmail)
                              : handleRevokeInvitation(invitation.userId!, invitation.userName || invitation.userEmail)
                          }
                          disabled={revokingId === inviteKey}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Revoke invitation"
                        >
                          {revokingId === inviteKey ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
                          ) : (
                            <X size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">No pending invitations</p>
              </div>
            )}
          </div>
        )}

        {/* Close button */}
        <div className="pt-4 border-t">
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
