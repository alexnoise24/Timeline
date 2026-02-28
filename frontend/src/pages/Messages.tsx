import { useEffect, useState, useRef } from 'react';
import { useMessageStore } from '@/store/messageStore';
import { useAuthStore } from '@/store/authStore';
import { Send, UserPlus, MessageCircle, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Button from '@/components/ui/Button';
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

    // Set up socket listener for new messages
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
      
      // Join the timeline room for real-time updates
      const socket = getSocket();
      if (socket) {
        socket.emit('join-timeline', activeConversation);
        console.log(`Joined timeline room: ${activeConversation}`);
      }
      
      // Leave the room when changing conversations
      return () => {
        if (socket && activeConversation) {
          socket.emit('leave-timeline', activeConversation);
          console.log(`Left timeline room: ${activeConversation}`);
        }
      };
    }
  }, [activeConversation, fetchMessages]);

  useEffect(() => {
    // Scroll to bottom when messages change
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
    <div className="flex h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Navbar />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className={`
            ${activeConversation ? 'hidden md:flex' : 'flex'}
            w-full md:w-80 glass-subtle flex-col border-r border-border-soft
          `}>
            <div className="p-4 border-b border-border-soft flex items-center justify-between">
              <h2 className="text-xl font-heading font-medium text-text-primary">Messages</h2>
              <button className="p-2 hover:bg-olive-primary/10 rounded-lg transition-colors text-text-secondary">
                <UserPlus size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading && conversations.length === 0 ? (
                <div className="p-4 text-center text-text-muted">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-text-muted">
                  No conversations yet
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.timeline._id}
                    onClick={() => setActiveConversation(conv.timeline._id)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-olive-primary/8 transition-colors duration-200 border-b border-border-soft ${
                      activeConversation === conv.timeline._id ? 'bg-olive-muted/30' : ''
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-olive-primary flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
                      {getInitials(getConversationTitle(conv))}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm text-text-primary truncate">
                          {getConversationTitle(conv)}
                        </h3>
                        {conv.lastMessage && (
                          <span className="text-xs text-text-muted flex-shrink-0">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary truncate mt-1">
                        {conv.lastMessage
                          ? `${conv.lastMessage.sender._id === user?._id ? 'You: ' : ''}${conv.lastMessage.content}`
                          : 'No messages yet'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <div className="mt-1">
                          <span className="inline-block px-2 py-0.5 bg-olive-primary text-white text-xs rounded-full">
                            {conv.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`
            ${!activeConversation ? 'hidden md:flex' : 'flex'}
            flex-1 flex-col bg-bg-surface/50
          `}>
            {activeConversationData ? (
              <>
                {/* Chat Header */}
                <div className="glass-subtle p-4 border-b border-border-soft">
                  <div className="flex items-center gap-3">
                    {/* Mobile back button */}
                    <button
                      onClick={() => setActiveConversation(null)}
                      className="md:hidden p-2 hover:bg-olive-primary/10 rounded-lg transition-colors"
                    >
                      <ArrowLeft size={20} className="text-text-primary" />
                    </button>
                    <div className="flex-1">
                      <h2 className="text-lg sm:text-xl font-heading font-medium text-text-primary">
                        {getConversationTitle(activeConversationData)}
                      </h2>
                      <p className="text-xs sm:text-sm text-text-muted mt-1">
                        {new Date(activeConversationData.timeline.weddingDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                >
                  {currentMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-text-muted">
                      <div className="text-center">
                        <MessageCircle size={48} className="mx-auto mb-4 opacity-50 text-olive-light" />
                        <p>No messages yet. Start the conversation!</p>
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
                          <div className={`flex gap-2 max-w-[85%] sm:max-w-md ${isOwn ? 'flex-row-reverse' : ''}`}>
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-olive-primary flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                              {getInitials(message.sender.name)}
                            </div>
                            <div className="min-w-0">
                              {!isOwn && (
                                <p className="text-xs text-text-muted mb-1">
                                  {message.sender.name}
                                </p>
                              )}
                              <div
                                className={`px-3 sm:px-4 py-2 rounded-[16px] ${
                                  isOwn
                                    ? 'bg-olive-primary text-white'
                                    : 'glass border border-border-soft text-text-primary'
                                }`}
                              >
                                <p className="break-words text-sm sm:text-base">{message.content}</p>
                              </div>
                              <p className="text-xs text-text-muted mt-1">
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

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-3 sm:p-4 glass-subtle border-t border-border-soft">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 text-sm sm:text-base bg-white/60 backdrop-blur-sm text-text-primary border border-border-soft rounded-[14px] focus:outline-none focus:ring-2 focus:ring-olive-primary/15 focus:border-olive-primary placeholder-text-muted transition-all duration-200"
                    />
                    <Button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="px-4 sm:px-6"
                    >
                      <Send size={18} className="sm:w-5 sm:h-5" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted">
                <div className="text-center">
                  <MessageCircle size={64} className="mx-auto mb-4 opacity-30 text-olive-light" />
                  <h3 className="text-xl font-heading font-medium mb-2 text-text-primary">Select a conversation</h3>
                  <p>Choose from your existing conversations or start a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
