import React, { useState } from 'react';
import { Mail, Link as LinkIcon, Check, Copy } from 'lucide-react';
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
  const { inviteGuest, createInviteLink } = useInvitationsStore();
  const [email, setEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCopyInviteLink = async () => {
    try {
      const token = await createInviteLink(timelineId);
      const url = `${window.location.origin}/invite/${token}`;
      await navigator.clipboard.writeText(url);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2500);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-black mb-2">Invite to Timeline</h2>
        <p className="text-sm text-primary-600 mb-6">{timelineTitle}</p>

        {/* Invite by Email Section */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Mail size={20} className="text-primary-600" />
            <h3 className="text-lg font-semibold text-black">Invite Registered User</h3>
          </div>
          <p className="text-sm text-primary-600 mb-4">
            Send an invitation to a user who already has an account. They'll see this timeline in their Shared Timelines.
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
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </form>
        </div>

        {/* Invite by Link Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <LinkIcon size={20} className="text-primary-600" />
            <h3 className="text-lg font-semibold text-black">Share Invite Link</h3>
          </div>
          <p className="text-sm text-primary-600 mb-4">
            Generate a link to share with anyone. If they don't have an account, they'll be prompted to register first.
          </p>

          <Button
            onClick={handleCopyInviteLink}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            {copyStatus === 'copied' ? (
              <>
                <Check size={18} />
                Link Copied!
              </>
            ) : copyStatus === 'error' ? (
              'Failed to copy'
            ) : (
              <>
                <Copy size={18} />
                Copy Invite Link
              </>
            )}
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
