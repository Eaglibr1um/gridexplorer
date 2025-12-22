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
}

const ChatModule = ({ tutee, role }: ChatModuleProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const senderId = role === 'admin' ? 'admin' : tutee.id;
  const receiverId = role === 'admin' ? tutee.id : 'admin';

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
    scrollToBottom();
  }, [messages]);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    setIsExpanded(true);
    if (unreadCount > 0) {
      messagingService.markAsRead(tutee.id, role);
      setUnreadCount(0);
    }
  };

  // Compact Card View
  if (!isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className="w-full bg-white/60 backdrop-blur-sm rounded-[2rem] sm:rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 group border border-white/40 overflow-hidden flex flex-col animate-fade-in-up touch-manipulation relative"
      >
        <div className={`p-4 sm:p-8 w-full bg-gradient-to-r ${role === 'admin' ? 'from-purple-600 to-indigo-600' : tutee.colorScheme.gradient} text-white shadow-lg`}>
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
                <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                  <p className="text-[10px] sm:text-xs text-white/80 font-bold uppercase tracking-widest truncate flex-1">
                    {messages[messages.length - 1].sender_id === senderId ? 'You: ' : ''}
                    {messages[messages.length - 1].content}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-white/60 font-black uppercase tracking-widest flex items-center gap-1 flex-shrink-0">
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
  return (
    <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-2xl h-[100dvh] sm:h-[80vh] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-modal-content">
        {/* Chat Header */}
        <div className={`p-4 sm:p-8 bg-gradient-to-r ${role === 'admin' ? 'from-purple-600 to-indigo-600' : tutee.colorScheme.gradient} text-white shadow-lg flex items-center justify-between`}>
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
          <button 
            onClick={() => setIsExpanded(false)}
            className="p-2 sm:p-3 hover:bg-white/10 rounded-xl sm:rounded-2xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages Container */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-gray-50/50"
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
                    <div className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 shadow-sm relative group ${
                      isMine 
                        ? `bg-gradient-to-br ${role === 'admin' ? 'from-purple-600 to-indigo-600' : tutee.colorScheme.gradient} text-white rounded-tr-sm` 
                        : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                    }`}>
                      <p className="text-sm sm:text-base font-medium leading-relaxed break-words whitespace-pre-wrap">
                        {msg.content}
                      </p>
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
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-6 sm:p-8 bg-white border-t border-gray-100">
          <form 
            onSubmit={handleSendMessage}
            className="flex items-center gap-3 bg-gray-100 p-2 rounded-[2rem] border-2 border-transparent focus-within:border-indigo-200 focus-within:bg-white transition-all shadow-inner"
          >
            <button 
              type="button"
              className="p-3 text-gray-400 hover:text-indigo-500 hover:bg-white rounded-full transition-all"
            >
              <Plus className="w-6 h-6" />
            </button>
            <textarea
              rows={1}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 text-sm sm:text-base py-2 max-h-32 overflow-y-auto resize-none font-medium"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className={`p-4 rounded-full transition-all shadow-lg active:scale-90 ${
                !newMessage.trim() || sending
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : `bg-gradient-to-r ${role === 'admin' ? 'from-purple-600 to-indigo-600' : tutee.colorScheme.gradient} text-white hover:shadow-xl`
              }`}
            >
              {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            </button>
          </form>
          <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4">
            Press Enter to Send
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatModule;

