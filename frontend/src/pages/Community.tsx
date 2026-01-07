import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get('/community');
      setMessages(response.data.messages);
      setHasAccess(true);
    } catch (error: any) {
      if (error.response?.status === 403) {
        setHasAccess(false);
      }
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
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return t('community.yesterday');
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getPlanBadge = (plan: string, role: string) => {
    if (role === 'master') return { text: 'Master', color: 'bg-purple-100 text-purple-800' };
    if (plan === 'studio') return { text: 'Studio', color: 'bg-amber-100 text-amber-800' };
    if (plan === 'pro') return { text: 'Pro', color: 'bg-blue-100 text-blue-800' };
    if (plan === 'starter') return { text: 'Starter', color: 'bg-green-100 text-green-800' };
    if (plan === 'trial') return { text: 'Trial', color: 'bg-gray-100 text-gray-800' };
    return null;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Navbar />
        
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white shrink-0">
            <div className="p-2 bg-accent/20 rounded-lg">
              <Users size={20} className="text-accent" />
            </div>
            <div>
              <h1 className="font-semibold text-text">{t('community.title')}</h1>
              <p className="text-xs text-text/60">{t('community.subtitle')}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : !hasAccess ? (
            <div className="flex-1 flex items-center justify-center px-4">
              <div className="text-center">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-text mb-2">{t('community.accessRequired')}</h3>
                <p className="text-text/60 text-sm">{t('community.accessDescription')}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-text/50">
                    <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('community.noMessages')}</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.user._id === user?._id;
                    const badge = getPlanBadge(msg.user.current_plan, msg.user.role);
                    
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] ${isOwn ? 'order-1' : ''}`}>
                          <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : ''}`}>
                            <span className="text-xs font-medium text-text/70">{msg.user.name}</span>
                            {badge && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badge.color}`}>
                                {badge.text}
                              </span>
                            )}
                            <span className="text-[10px] text-text/40">{formatTime(msg.createdAt)}</span>
                          </div>
                          
                          <div className={`relative group rounded-2xl px-4 py-2 ${
                            isOwn 
                              ? 'bg-accent text-text rounded-br-md' 
                              : 'bg-gray-100 text-text rounded-bl-md'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            
                            {(isOwn || isMaster) && (
                              <button
                                onClick={() => handleDelete(msg._id)}
                                className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={12} className="text-red-500" />
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
              <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('community.placeholder')}
                    maxLength={1000}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="p-2 bg-accent text-text rounded-full hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-text/40 mt-1 text-center">
                  {t('community.feedbackHint')}
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
