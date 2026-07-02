import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { FREE_FOR_ALL } from '@/lib/utils';
import { Send, Loader2, Trash2, Users, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';

interface CommunityMessage {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    current_plan: string;
  };
  content: string;
  type: string;
  createdAt: string;
}

const PLAN_BADGE: Record<string, { label: string; className: string }> = {
  master:  { label: 'MASTER',  className: 'border-lavender/60 bg-lavender/10 text-ink' },
  studio:  { label: 'STUDIO',  className: 'border-ember/50 bg-ember/10 text-ink' },
  pro:     { label: 'PRO',     className: 'border-moss/50 bg-moss/10 text-ink' },
  starter: { label: 'STARTER', className: 'border-ink/25 bg-fog text-stone' },
  trial:   { label: 'TRIAL',   className: 'border-ink/15 bg-fog text-stone' },
};

export default function Community() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isMaster = user?.role === 'master';

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await api.get('/community');
      setMessages(response.data.messages);
      setHasAccess(true);
    } catch (error: any) {
      if (error.response?.status === 403) setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await api.post('/community', { content: newMessage });
      setMessages(prev => [...prev, response.data.message]);
      setNewMessage('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('community.sendError'));
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await api.delete(`/community/${messageId}`);
      setMessages(prev => prev.filter(m => m._id !== messageId));
      toast.success(t('community.messageDeleted'));
    } catch {
      toast.error(t('community.deleteError'));
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return t('community.yesterday');
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getPlanBadge = (plan: string, role: string) => {
    if (role === 'master') return PLAN_BADGE.master;
    return PLAN_BADGE[plan] ?? null;
  };

  return (
    <div className="flex h-full bg-paper">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <div className="flex-1 flex flex-col overflow-hidden bg-paper">

          {/* Header */}
          <div className="px-4 sm:px-6 py-3 border-b-[1.5px] border-ink bg-paper flex items-center gap-3 flex-shrink-0">
            <div className="p-1.5 border-[1px] border-ink/20">
              <Users size={16} strokeWidth={1.5} className="text-stone" />
            </div>
            <div>
              <h1 className="font-display font-bold text-[16px] tracking-[-0.02em] text-ink">
                {t('community.title').toUpperCase()}
              </h1>
              <p className="alto-label text-stone">{t('community.subtitle')}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={20} strokeWidth={1.5} className="animate-spin text-stone" />
            </div>

          ) : !hasAccess ? (
            <div className="flex-1 flex items-center justify-center px-4">
              <div className="text-center">
                <Users size={40} strokeWidth={1} className="mx-auto text-stone/30 mb-4" />
                <h3 className="font-display font-bold text-[18px] tracking-[-0.02em] text-ink mb-2">
                  {t('community.accessRequired').toUpperCase()}
                </h3>
                <p className="alto-label text-stone">{t('community.accessDescription')}</p>
              </div>
            </div>

          ) : (
            <>
              {/* Messages feed */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-10">
                    <MessageCircle size={32} strokeWidth={1} className="mx-auto mb-2 text-stone/30" />
                    <p className="alto-label text-stone">{t('community.noMessages')}</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.user._id === user?._id;
                    // No plan badges while fully free, nor in the native app.
                    const badge = FREE_FOR_ALL || Capacitor.isNativePlatform()
                      ? null
                      : getPlanBadge(msg.user.current_plan, msg.user.role);

                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>

                          {/* Meta row */}
                          <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                            <span className="font-mono font-bold text-[11px] text-ink">{msg.user.name}</span>
                            {badge && (
                              <span className={`border-[1px] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em] ${badge.className}`}>
                                {badge.label}
                              </span>
                            )}
                            <span className="alto-label text-stone">{formatTime(msg.createdAt)}</span>
                          </div>

                          {/* Bubble */}
                          <div className={`group relative border-[1.5px] px-4 py-2 ${
                            isOwn
                              ? 'bg-ink border-ink text-paper'
                              : 'bg-fog border-ink/20 text-ink'
                          }`}>
                            <p className="font-mono text-[12px] leading-relaxed whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>

                            {(isOwn || isMaster) && (
                              <button
                                onClick={() => handleDelete(msg._id)}
                                className={`absolute -top-2 -right-2 p-1 border-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-[80ms] ${
                                  isOwn
                                    ? 'bg-paper border-ink/30 text-stone hover:text-brick'
                                    : 'bg-paper border-ink/20 text-stone hover:text-brick'
                                }`}
                              >
                                <Trash2 size={10} strokeWidth={1.5} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="px-4 sm:px-6 py-3 border-t-[1.5px] border-ink bg-paper flex-shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('community.placeholder')}
                    maxLength={1000}
                    className="flex-1 border-[1.5px] border-ink bg-paper px-4 py-[10px] font-mono text-[13px] text-ink placeholder:text-stone placeholder:font-normal focus:outline-none focus:outline-[2px] focus:outline-lavender"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="px-4 bg-lavender border-[1.5px] border-ink text-ink hover:bg-lavender-deep disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-[80ms] flex items-center justify-center"
                  >
                    {sending
                      ? <Loader2 size={15} strokeWidth={1.5} className="animate-spin" />
                      : <Send size={15} strokeWidth={1.5} />}
                  </button>
                </div>
                <p className="alto-label text-stone mt-1 text-center">{t('community.feedbackHint')}</p>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
