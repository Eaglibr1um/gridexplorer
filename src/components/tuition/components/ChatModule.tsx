import { useState, useEffect, useRef } from 'react';
import { 
  Send, Loader2, User, Shield, 
  MessageCircle, X, ChevronRight,
  Plus, Paperclip, MoreVertical,
  Check, CheckCheck, Clock,
  BookOpen, GraduationCap, Star, Heart, Zap, Target,
  Award, Trophy, Lightbulb, Brain, Rocket, Sparkles, BookMarked,
  School, PenTool, Calculator, FlaskConical, Atom, Music, Palette,
  Camera, Gamepad2, Code, Globe, Coffee, Smile
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Shield, BookOpen, GraduationCap, User, Star, Heart, Zap, Target,
  Award, Trophy, Lightbulb, Brain, Rocket, Sparkles, BookMarked,
  School, PenTool, Calculator, FlaskConical, Atom, Music, Palette,
  Camera, Gamepad2, Code, Globe, Coffee, Smile
};
import { supabase } from '../../../config/supabase';
import { messagingService, Message } from '../../../services/messagingService';
import { format, isToday, isYesterday, isThisYear } from 'date-fns';
import { Tutee } from '../../../types/tuition';

interface ChatModuleProps {
  tutee: Tutee;
  role: 'admin' | 'tutee';
  isInline?: boolean;
  onClose?: () => void;
}

const ChatModule = ({ tutee, role, isInline = false, onClose }: ChatModuleProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(isInline);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const senderId = role === 'admin' ? 'admin' : tutee.id;
  const receiverId = role === 'admin' ? tutee.id : 'admin';

  useEffect(() => {
    setIsExpanded(isInline);
  }, [isInline]);

  // Prevent body scroll when chat is expanded as a modal
  useEffect(() => {
    // We've removed the body overflow lock as it was causing layout borders on some devices.
    // The previous card click fix should handle the jumping issue.
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleClose = () => {
    setIsExpanded(false);
    if (onClose) onClose();
  };

  const formatLastMessageDate = (date: Date) => {
    const timeStr = format(date, 'h:mmaaa');
    if (isToday(date)) return `Today ${timeStr}`;
    if (isYesterday(date)) return `Yesterday ${timeStr}`;
    if (isThisYear(date)) return format(date, 'EEE, d MMM ') + timeStr;
    return format(date, 'd MMM yyyy ') + timeStr;
  };

  useEffect(() => {
    loadMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${tutee.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages'
      }, (payload) => {
        const msg = payload.new as Message;
        
        // Filter messages for this specific conversation in code
        const isFromThisStudent = msg.sender_id === tutee.id && msg.receiver_id === 'admin';
        const isFromAdminToThisStudent = msg.sender_id === 'admin' && msg.receiver_id === tutee.id;

        if (isFromThisStudent || isFromAdminToThisStudent) {
          // Check if message already exists to avoid duplicates
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          
          if (msg.receiver_id === senderId) {
            if (!isExpanded) {
              setUnreadCount(prev => prev + 1);
            } else {
              messagingService.markAsRead(tutee.id, role);
            }
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tutee.id, isExpanded]);

  useEffect(() => {
    // Scroll to bottom whenever messages change or chat is expanded
    if (messages.length > 0 && isExpanded && !loading) {
      // Attempt multiple scrolls to ensure we land at the bottom
      // Instant scroll first
      scrollToBottom('auto');
      
      const timeouts = [
        setTimeout(() => scrollToBottom('auto'), 50),
        setTimeout(() => scrollToBottom('auto'), 150),
        setTimeout(() => scrollToBottom('smooth'), 400)
      ];
      
      return () => timeouts.forEach(clearTimeout);
    }
  }, [messages.length, isExpanded, loading]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await messagingService.fetchConversation(tutee.id);
      setMessages(data);
      
      const unread = await messagingService.getUnreadCount(senderId, receiverId);
      setUnreadCount(unread);
      
      if (isExpanded && unread > 0) {
        messagingService.markAsRead(tutee.id, role);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const content = newMessage.trim();
      setNewMessage(''); // Clear input immediately for UX
      
      await messagingService.sendMessage(
        senderId,
        receiverId,
        content,
        role === 'admin' ? 'Admin' : tutee.name
      );
      
      // Message will be added via realtime subscription
    } catch (err) {
      console.error('Failed to send message:', err);
      setNewMessage(newMessage); // Restore text on failure
    } finally {
      setSending(false);
    }
  };

  const handleExpand = () => {
    if (unreadCount > 0) {
      messagingService.markAsRead(tutee.id, role);
      setUnreadCount(0);
    }
    setIsExpanded(true);
  };

  const renderMessageContent = (content: string) => {
    // Check if it's a progress report (contains specific headers)
    const isProgressReport = content.includes('PROGRESS REPORT') || content.includes('Academic Highlights');
    
    // Split by ** to find bold parts
    const parts = content.split(/(\*\*.*?\*\*)/);
    
    const formattedContent = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-black text-inherit">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (isProgressReport) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/20">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">AI Progress Report</span>
          </div>
          <div className="prose prose-invert prose-sm max-w-none font-medium leading-relaxed">
            {formattedContent}
          </div>
        </div>
      );
    }

    return formattedContent;
  };

  // Compact Card View
  if (!isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className="w-full bg-white/60 backdrop-blur-sm rounded-[2rem] sm:rounded-3xl hover:shadow-md transition-all duration-300 group border border-white/40 overflow-hidden flex flex-col animate-fade-in-up touch-manipulation relative"
      >
        <div className={`p-4 sm:p-8 w-full bg-gradient-to-r ${tutee.colorScheme.gradient} text-white shadow-lg`}>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-inner relative flex-shrink-0">
              <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white animate-bounce">
                  {unreadCount}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight truncate">
                {role === 'admin' ? `Chat with ${tutee.name}` : 'Message Tutor'}
              </h2>
              {messages.length > 0 ? (
                <div className="flex items-start gap-2 mt-0.5 sm:mt-1">
                  <p className="text-[10px] sm:text-xs text-white/80 font-bold uppercase tracking-widest line-clamp-1 flex-1">
                    {messages[messages.length - 1].sender_id === senderId ? 'You: ' : ''}
                    {(() => {
                      const content = messages[messages.length - 1].content;
                      if (content.includes('PROGRESS REPORT') || content.includes('Academic Highlights')) {
                        return '📊 AI Progress Report Summary';
                      }
                      return content;
                    })()}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-white/60 font-black uppercase tracking-widest flex items-center gap-1 flex-shrink-0 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatLastMessageDate(new Date(messages[messages.length - 1].created_at))}
                  </p>
                </div>
              ) : (
                <p className="text-white/60 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-0.5 sm:mt-1 italic">Start a conversation...</p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white/60 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </div>
      </button>
    );
  }

  // Expanded Chat View
  const ChatContent = (
    <div className={`bg-white w-full max-w-2xl flex flex-col overflow-hidden ${
      isInline 
        ? 'h-full' 
        : 'h-full sm:h-[80vh] sm:rounded-[2.5rem] animate-modal-content'
    }`}>
      {/* Chat Header */}
      <div className={`p-4 sm:p-8 bg-gradient-to-r ${tutee.colorScheme.gradient} text-white shadow-lg flex items-center justify-between`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-3 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-inner">
            {(() => {
              const Icon = role === 'admin' ? (iconMap[tutee.icon] || User) : Shield;
              return <Icon className="w-6 h-6" />;
            })()}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black">{role === 'admin' ? tutee.name : 'Jianxiang'}</h3>
            <p className="text-white/70 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Always Online</p>
          </div>
        </div>
        {!isInline && (
          <button 
            onClick={handleClose}
            className="p-2 sm:p-3 hover:bg-white/10 rounded-xl sm:rounded-2xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Messages Container - iOS Safari scroll fix */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-gray-50/50 scroll-fix-ios custom-scrollbar no-overscroll"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-8">
            <div className="p-6 bg-white rounded-3xl shadow-sm">
              <MessageCircle className="w-12 h-12 text-indigo-200" />
            </div>
            <div>
              <h4 className="font-black text-gray-800">No messages yet</h4>
              <p className="text-gray-500 text-sm font-medium mt-1">Send a message to start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMine = msg.sender_id === senderId;
            const showTime = index === 0 || 
              new Date(msg.created_at).getTime() - new Date(messages[index-1].created_at).getTime() > 1000 * 60 * 30;

            return (
              <div key={msg.id} className="space-y-2">
                {showTime && (
                  <div className="flex justify-center my-4">
                    <span className="bg-gray-200/50 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                      {formatLastMessageDate(new Date(msg.created_at))}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  {(() => {
                    const isReport = msg.content.includes('PROGRESS REPORT') || msg.content.includes('Academic Highlights');
                    return (
                      <div className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 shadow-sm relative group text-left ${
                        isMine 
                          ? isReport
                            ? `bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white rounded-tr-sm shadow-xl ring-2 ring-white/20`
                            : `bg-gradient-to-br ${role === 'admin' ? 'from-purple-600 to-indigo-600' : tutee.colorScheme.gradient} text-white rounded-tr-sm` 
                          : isReport
                            ? `bg-gradient-to-br from-indigo-50 to-white text-gray-800 rounded-tl-sm border-2 border-indigo-100 shadow-xl ring-2 ring-indigo-500/10`
                            : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                      }`}>
                        <div className="text-sm sm:text-base font-medium leading-relaxed break-words whitespace-pre-wrap">
                          {renderMessageContent(msg.content)}
                        </div>
                        <div className={`flex items-center gap-1.5 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-[10px] font-bold uppercase ${isMine ? 'text-white/60' : 'text-gray-400'}`}>
                            {format(new Date(msg.created_at), 'h:mmaaa')}
                          </span>
                          {isMine && (
                            msg.is_read 
                              ? <CheckCheck className="w-3 h-3 text-white/60" /> 
                              : <Check className="w-3 h-3 text-white/60" />
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input - Optimized for mobile (~8 words per line readability) */}
      <div className="p-3 sm:p-4 lg:p-6 bg-white border-t border-gray-100 pb-safe">
        <form 
          onSubmit={handleSendMessage}
          className="flex items-end gap-1.5 sm:gap-2 bg-gray-50 p-1.5 sm:p-2 rounded-2xl sm:rounded-[2rem] border-2 border-transparent focus-within:border-indigo-200 focus-within:bg-white transition-all"
        >
          {/* Attachment button - smaller on mobile to maximize input space */}
          <button 
            type="button"
            className="hidden sm:flex min-h-[44px] min-w-[44px] items-center justify-center text-gray-400 hover:text-indigo-500 hover:bg-white rounded-full transition-all touch-manipulation flex-shrink-0"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          {/* Textarea - maximized width on mobile for ~8 words per line */}
          <textarea
            rows={1}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              // Auto-resize textarea
              const target = e.target;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-800 text-base leading-snug py-2.5 sm:py-3 px-3 sm:px-4 max-h-[120px] overflow-y-auto resize-none font-medium min-h-[44px] placeholder:text-gray-400"
            style={{ fontSize: '16px' }} // Prevents iOS zoom on focus
          />
          
          {/* Send button */}
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center rounded-full transition-all shadow-md active:scale-90 touch-manipulation flex-shrink-0 ${
              !newMessage.trim() || sending
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : `bg-gradient-to-r ${role === 'admin' ? 'from-purple-600 to-indigo-600' : tutee.colorScheme.gradient} text-white hover:shadow-lg`
            }`}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </form>
        
        {/* Helper text - only on desktop */}
        <p className="text-center text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-2 hidden sm:block">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );

  if (isInline) {
    return ChatContent;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      {ChatContent}
    </div>
  );
};

export default ChatModule;

