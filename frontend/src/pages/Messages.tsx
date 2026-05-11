import { useEffect, useState, useRef } from 'react';
import { useMessageStore } from '@/store/messageStore';
import { useAuthStore } from '@/store/authStore';
import { Send, UserPlus, MessageCircle, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { getInitials, formatDateTime } from '@/lib/utils';
import { getSocket } from '@/lib/socket';
import { Message } from '@/types';

export default function Messages() {
  const { user } = useAuthStore();
  const {
    conversations,
    messages,
    activeConversation,
    isLoading,
    fetchConversations,
    fetchMessages,
    sendMessage,
    setActiveConversation,
    addMessage
  } = useMessageStore();

  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();

    const socket = getSocket();
    const handleMessageReceived = (data: { message: Message }) => {
      addMessage(data.message);
    };

    socket?.on('message-received', handleMessageReceived);

    return () => {
      socket?.off('message-received', handleMessageReceived);
    };
  }, [fetchConversations, addMessage]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);

      const socket = getSocket();
      if (socket) {
        socket.emit('join-timeline', activeConversation);
      }

      return () => {
        if (socket && activeConversation) {
          socket.emit('leave-timeline', activeConversation);
        }
      };
    }
  }, [activeConversation, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversation) return;

    try {
      await sendMessage(activeConversation, messageInput);
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const activeConversationData = conversations.find(
    (c) => c.timeline._id === activeConversation
  );

  const currentMessages = activeConversation ? messages[activeConversation] || [] : [];

  const getConversationTitle = (conv: typeof conversations[0]) => {
    if (conv.timeline.couple?.partner1 && conv.timeline.couple?.partner2) {
      return `${conv.timeline.couple.partner1} & ${conv.timeline.couple.partner2}`;
    }
    return conv.timeline.title;
  };

  return (
    <div className="flex h-screen bg-paper">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <div className="flex-1 flex overflow-hidden">

          {/* ── Conversations list ── */}
          <div className={`
            ${activeConversation ? 'hidden md:flex' : 'flex'}
            w-full md:w-[280px] flex-col border-r-[1.5px] border-ink bg-paper flex-shrink-0
          `}>
            {/* List header */}
            <div className="px-4 py-3 border-b-[1.5px] border-ink flex items-center justify-between">
              <h2 className="font-display font-bold text-[16px] tracking-[-0.02em] text-ink">MENSAJES</h2>
              <button className="p-1.5 text-stone hover:text-ink hover:bg-fog transition-colors duration-[80ms]">
                <UserPlus size={16} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {isLoading && conversations.length === 0 ? (
                <p className="p-4 alto-label text-stone text-center">Cargando...</p>
              ) : conversations.length === 0 ? (
                <p className="p-4 alto-label text-stone text-center">Sin conversaciones</p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.timeline._id}
                    onClick={() => setActiveConversation(conv.timeline._id)}
                    className={`w-full px-4 py-3 flex items-start gap-3 border-b-[1px] border-ink/10 transition-colors duration-[80ms] text-left ${
                      activeConversation === conv.timeline._id
                        ? 'bg-ink'
                        : 'hover:bg-fog'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-9 h-9 flex items-center justify-center font-mono font-bold text-[11px] flex-shrink-0 ${
                      activeConversation === conv.timeline._id
                        ? 'bg-paper text-ink'
                        : 'bg-ink text-paper'
                    }`}>
                      {getInitials(getConversationTitle(conv))}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`font-mono font-bold text-[12px] truncate ${
                          activeConversation === conv.timeline._id ? 'text-paper' : 'text-ink'
                        }`}>
                          {getConversationTitle(conv).toUpperCase()}
                        </h3>
                        {conv.lastMessage && (
                          <span className={`font-mono text-[10px] flex-shrink-0 ${
                            activeConversation === conv.timeline._id ? 'text-paper/60' : 'text-stone'
                          }`}>
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                      <p className={`font-mono text-[11px] truncate mt-0.5 ${
                        activeConversation === conv.timeline._id ? 'text-paper/70' : 'text-stone'
                      }`}>
                        {conv.lastMessage
                          ? `${conv.lastMessage.sender._id === user?._id ? 'Tú: ' : ''}${conv.lastMessage.content}`
                          : 'Sin mensajes'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 border-[1px] border-lavender bg-lavender/10 font-mono text-[9px] text-ink">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ── Chat area ── */}
          <div className={`
            ${!activeConversation ? 'hidden md:flex' : 'flex'}
            flex-1 flex-col bg-paper
          `}>
            {activeConversationData ? (
              <>
                {/* Chat header */}
                <div className="px-4 sm:px-6 py-3 border-b-[1.5px] border-ink bg-paper flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="md:hidden p-1.5 text-stone hover:text-ink hover:bg-fog transition-colors"
                  >
                    <ArrowLeft size={16} strokeWidth={1.5} />
                  </button>
                  <div className="flex-1">
                    <h2 className="font-display font-bold text-[16px] tracking-[-0.02em] text-ink">
                      {getConversationTitle(activeConversationData).toUpperCase()}
                    </h2>
                    <p className="alto-label text-stone mt-0.5">
                      {new Date(activeConversationData.timeline.weddingDate).toLocaleDateString('es-ES', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3"
                >
                  {currentMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageCircle size={36} strokeWidth={1} className="mx-auto mb-3 text-stone/40" />
                        <p className="alto-label text-stone">Sin mensajes. ¡Inicia la conversación!</p>
                      </div>
                    </div>
                  ) : (
                    currentMessages.map((message) => {
                      const isOwn = message.sender._id === user?._id;
                      return (
                        <div
                          key={message._id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                            {/* Avatar */}
                            <div className={`w-7 h-7 flex items-center justify-center font-mono font-bold text-[9px] flex-shrink-0 self-end ${
                              isOwn ? 'bg-lavender text-ink' : 'bg-ink text-paper'
                            }`}>
                              {getInitials(message.sender.name)}
                            </div>

                            <div className="min-w-0">
                              {!isOwn && (
                                <p className="alto-label text-stone mb-1">{message.sender.name}</p>
                              )}
                              <div className={`px-3 py-2 border-[1.5px] ${
                                isOwn
                                  ? 'bg-ink border-ink text-paper'
                                  : 'bg-fog border-ink/20 text-ink'
                              }`}>
                                <p className="font-mono text-[12px] leading-relaxed break-words">{message.content}</p>
                              </div>
                              <p className="alto-label text-stone mt-1">
                                {formatDateTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="px-4 sm:px-6 py-3 border-t-[1.5px] border-ink bg-paper flex-shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Escribe un mensaje..."
                      className="flex-1 border-[1.5px] border-ink bg-paper px-4 py-[10px] font-mono text-[13px] text-ink placeholder:text-stone placeholder:font-normal focus:outline-none focus:outline-[2px] focus:outline-lavender"
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="px-4 bg-lavender border-[1.5px] border-ink text-ink hover:bg-lavender-deep disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-[80ms] flex items-center justify-center"
                    >
                      <Send size={15} strokeWidth={1.5} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle size={40} strokeWidth={1} className="mx-auto mb-3 text-stone/30" />
                  <h3 className="font-display font-bold text-[18px] tracking-[-0.02em] text-ink mb-1">SELECCIONA UNA CONVERSACIÓN</h3>
                  <p className="alto-label text-stone">Elige una conversación de la lista</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
