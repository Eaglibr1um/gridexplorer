import { useState, useEffect } from 'react';
import { 
  MessageCircle, User, Search, 
  ChevronRight, Loader2, Shield,
  CheckCheck, Check, Smartphone,
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
import { Tutee } from '../../../types/tuition';
import ChatModule from '../components/ChatModule';
import { format, isToday, isYesterday, isThisYear } from 'date-fns';

interface MessagingAdminProps {
  tutees: Tutee[];
}

const MessagingAdmin = ({ tutees }: MessagingAdminProps) => {
  const [selectedTuteeId, setSelectedTuteeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({});
  const [loading, setLoading] = useState(true);

  const formatLastMessageDate = (date: Date) => {
    const timeStr = format(date, 'h:mmaaa');
    if (isToday(date)) return `Today ${timeStr}`;
    if (isYesterday(date)) return `Yesterday ${timeStr}`;
    if (isThisYear(date)) return format(date, 'EEE, d MMM ') + timeStr;
    return format(date, 'd MMM yyyy ') + timeStr;
  };

  useEffect(() => {
    loadStats();

    // Subscribe to all messages to update unread counts and last messages
    const channel = supabase
      .channel('admin_messaging_stats')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages'
      }, (payload) => {
        const msg = payload.new as Message;
        
        // Update last message
        const otherId = msg.sender_id === 'admin' ? msg.receiver_id : msg.sender_id;
        setLastMessages(prev => ({ ...prev, [otherId]: msg }));

        // Update unread count if it's a message for admin
        if (msg.receiver_id === 'admin') {
          setUnreadCounts(prev => ({
            ...prev,
            [msg.sender_id]: (prev[msg.sender_id] || 0) + 1
          }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Get all last messages for each tutee
      const { data: lastMsgs, error: lastError } = await supabase
        .from('messages')
        .select('*')
        .or('sender_id.eq.admin,receiver_id.eq.admin')
        .order('created_at', { ascending: false });

      if (lastError) throw lastError;

      const lastMsgsMap: Record<string, Message> = {};
      const countsMap: Record<string, number> = {};

      (lastMsgs || []).forEach(msg => {
        const otherId = msg.sender_id === 'admin' ? msg.receiver_id : msg.sender_id;
        if (!lastMsgsMap[otherId]) {
          lastMsgsMap[otherId] = msg;
        }
        if (msg.receiver_id === 'admin' && !msg.is_read) {
          countsMap[msg.sender_id] = (countsMap[msg.sender_id] || 0) + 1;
        }
      });

      setLastMessages(lastMsgsMap);
      setUnreadCounts(countsMap);
    } catch (err) {
      console.error('Failed to load messaging stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTutees = tutees.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    // Sort by unread first, then by last message date
    const unreadA = unreadCounts[a.id] || 0;
    const unreadB = unreadCounts[b.id] || 0;
    if (unreadA !== unreadB) return unreadB - unreadA;

    const dateA = lastMessages[a.id]?.created_at || '0';
    const dateB = lastMessages[b.id]?.created_at || '0';
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  const selectedTutee = tutees.find(t => t.id === selectedTuteeId);

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-indigo-100 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-6 sm:p-8 border-b border-indigo-50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
            <MessageCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-800">Messaging Center</h2>
            <p className="text-gray-500 font-medium text-sm">Direct chat with students</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar: Student List */}
          <div className="w-full lg:w-80 flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
              />
            </div>

            <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                </div>
              ) : filteredTutees.length === 0 ? (
                <div className="text-center py-12 text-gray-400 font-medium bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                  No students found
                </div>
              ) : (
                filteredTutees.map(t => {
                  const lastMsg = lastMessages[t.id];
                  const unread = unreadCounts[t.id] || 0;
                  const isSelected = selectedTuteeId === t.id;

                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTuteeId(t.id);
                        if (unread > 0) {
                          setUnreadCounts(prev => ({ ...prev, [t.id]: 0 }));
                        }
                      }}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all text-left relative group ${
                        isSelected 
                          ? 'bg-indigo-600 text-white shadow-lg' 
                          : 'bg-white hover:bg-indigo-50 border border-gray-100'
                      }`}
                    >
                      <div className={`p-3 rounded-xl shadow-sm transition-transform group-hover:scale-110 ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : `bg-gradient-to-br ${t.colorScheme.gradient} text-white`
                      }`}>
                        {(() => {
                          const Icon = iconMap[t.icon] || User;
                          return <Icon className="w-5 h-5" />;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <h4 className={`text-sm font-black truncate ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                            {t.name}
                          </h4>
                          {lastMsg && (
                            <span className={`text-[10px] font-bold uppercase shrink-0 ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
                              {isToday(new Date(lastMsg.created_at)) 
                                ? format(new Date(lastMsg.created_at), 'h:mmaaa')
                                : isYesterday(new Date(lastMsg.created_at))
                                  ? 'Yesterday'
                                  : format(new Date(lastMsg.created_at), 'd MMM')}
                            </span>
                          )}
                        </div>
                        {lastMsg ? (
                          <div className="flex items-center gap-1.5">
                            {lastMsg.sender_id === 'admin' && (
                              lastMsg.is_read 
                                ? <CheckCheck className={`w-3 h-3 ${isSelected ? 'text-white/60' : 'text-indigo-400'}`} /> 
                                : <Check className={`w-3 h-3 ${isSelected ? 'text-white/60' : 'text-gray-300'}`} />
                            )}
                            <p className={`text-xs font-medium truncate ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                              {lastMsg.sender_id === 'admin' ? 'You: ' : ''}
                              {lastMsg.content}
                            </p>
                          </div>
                        ) : (
                          <p className={`text-xs font-medium ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
                            No messages yet
                          </p>
                        )}
                      </div>
                      {unread > 0 && !isSelected && (
                        <div className="bg-red-500 text-white min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white animate-bounce shadow-sm">
                          {unread}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 min-h-[500px] bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-8">
            {selectedTuteeId && selectedTutee ? (
              <ChatModule tutee={selectedTutee} role="admin" />
            ) : (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center mx-auto text-indigo-200">
                  <MessageCircle className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-800">Select a Conversation</h3>
                  <p className="text-gray-500 font-medium max-w-xs mx-auto mt-1">
                    Choose a student from the list to start chatting or view history.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagingAdmin;

