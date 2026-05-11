import React, { useState } from 'react';
import { Mail, Link as LinkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useInvitationsStore } from '@/store/invitationsStore';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  timelineId: string;
  timelineTitle: string;
}

export default function InviteModal({ isOpen, onClose, timelineId, timelineTitle }: InviteModalProps) {
  const { t } = useTranslation();
  const { inviteGuest, createInviteLink } = useInvitationsStore();
  const [email, setEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleInviteByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setInviteStatus(null);

    try {
      await inviteGuest(timelineId, email.trim());
      setInviteStatus({ type: 'success', message: 'Invitation sent successfully!' });
      setEmail('');
      setTimeout(() => setInviteStatus(null), 3000);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to send invitation';
      setInviteStatus({ type: 'error', message });
      setTimeout(() => setInviteStatus(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      const token = await createInviteLink(timelineId);
      setInviteUrl(`${window.location.origin}/invite/${token}`);
    } catch (err: any) {
      console.error('[InviteModal] failed to generate invite link:', err?.message, err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-black mb-2">{t('invite.title')}</h2>
        <p className="text-sm text-primary-600 mb-6">{timelineTitle}</p>

        {/* Invite by Email Section */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Mail size={20} className="text-primary-600" />
            <h3 className="text-lg font-semibold text-black">{t('invite.inviteRegistered')}</h3>
          </div>
          <p className="text-sm text-primary-600 mb-4">
            {t('invite.inviteRegisteredDesc')}
          </p>

          <form onSubmit={handleInviteByEmail} className="space-y-3">
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="w-full"
            />

            {inviteStatus && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  inviteStatus.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {inviteStatus.message}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="w-full"
            >
              {isSubmitting ? t('invite.sending') : t('invite.sendInvitation')}
            </Button>
          </form>
        </div>

        {/* Invite by Link Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <LinkIcon size={20} className="text-primary-600" />
            <h3 className="text-lg font-semibold text-black">{t('invite.shareLink')}</h3>
          </div>
          <p className="text-sm text-primary-600 mb-4">
            {t('invite.shareLinkDesc')}
          </p>

          {!inviteUrl && (
            <Button
              onClick={handleGenerateLink}
              disabled={isGenerating}
              variant="outline"
              className="w-full"
            >
              {isGenerating ? t('timelineView.generating') : t('invite.generateLink')}
            </Button>
          )}
          {inviteUrl && (
            <div>
              <p className="text-sm text-primary-600 mb-2">{t('invite.shareThisLink')}</p>
              <input
                type="text"
                readOnly
                value={inviteUrl}
                onFocus={(e) => e.target.select()}
                className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-black mb-2"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="w-full"
              >
                {copied ? t('invite.copied') : t('invite.copyLink')}
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <Button onClick={onClose} variant="outline" className="w-full">
            {t('invite.close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
