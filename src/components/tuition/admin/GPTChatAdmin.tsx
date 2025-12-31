import { useState, useEffect, useMemo } from 'react';
import { 
  Bot, Search, Calendar, User, MessageSquare, Sparkles, ChevronRight, Filter, Layout, ArrowUpRight,
  BookOpen, GraduationCap, Star, Heart, Zap, Target, Award, Trophy, Lightbulb, Brain, Rocket,
  BookMarked, School, PenTool, Calculator, FlaskConical, Atom, Music, Palette, Camera, Gamepad2,
  Code, Globe, Coffee, Smile, Shield
} from 'lucide-react';
import { fetchAllChatHistory, ChatHistoryEntry } from '../../../services/gptChatService';
import AnimatedCard from '../../ui/AnimatedCard';
import { format } from 'date-fns';

// Icon mapping for tutees
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, GraduationCap, User, Star, Heart, Zap, Target, Award, Trophy,
  Lightbulb, Brain, Rocket, Sparkles, BookMarked, School, PenTool,
  Calculator, FlaskConical, Atom, Music, Palette, Camera, Gamepad2,
  Code, Globe, Coffee, Smile, Shield
};

const GPTChatAdmin = () => {
  const [history, setHistory] = useState<(ChatHistoryEntry & { tutee_name: string; tutee_icon: string; tutee_color: string })[]>([]);
  
  // Helper to get icon component
  const getIcon = (iconName: string) => iconMap[iconName] || User;
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTutee, setSelectedTutee] = useState<string>('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await fetchAllChatHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setLoading(false);
    }
  };

  const tuteeNames = useMemo(() => {
    const names = new Set(history.map(h => h.tutee_name));
    return ['all', ...Array.from(names)];
  }, [history]);

  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      const matchesSearch = 
        h.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.tutee_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTutee = selectedTutee === 'all' || h.tutee_name === selectedTutee;
      
      return matchesSearch && matchesTutee;
    });
  }, [history, searchTerm, selectedTutee]);

  return (
    <AnimatedCard className="overflow-hidden !p-0">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-indigo-100 rounded-xl text-indigo-600 shadow-sm flex-shrink-0">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">AI Chat Insights</h2>
              <p className="text-xs sm:text-sm text-gray-500">Monitor student interactions with the AI assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider">
              {filteredHistory.length} Interactions
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm sm:text-base"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <select
              value={selectedTutee}
              onChange={(e) => setSelectedTutee(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-gray-700 appearance-none text-sm sm:text-base"
            >
              {tuteeNames.map(name => (
                <option key={name} value={name}>
                  {name === 'all' ? 'All Tutees' : name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Analyzing chat history...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800">No conversations found</h3>
            <p className="text-gray-500">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredHistory.map((item) => (
              <div 
                key={item.id}
                className="group bg-white border border-gray-100 rounded-xl sm:rounded-2xl lg:rounded-[2rem] p-4 sm:p-6 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 w-full"
              >
                {/* Header: User info + timestamp */}
                <div className="flex items-start sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${item.tutee_color} rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                      {(() => {
                        const IconComp = getIcon(item.tutee_icon);
                        return <IconComp className="w-4 h-4 sm:w-5 sm:h-5" />;
                      })()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold sm:font-black text-gray-800 tracking-tight text-sm sm:text-base truncate">{item.tutee_name}</h4>
                      <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                        <span className="truncate">{format(new Date(item.createdAt), 'MMM d, yyyy • h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Q&A Content - responsive text sizing */}
                <div className="space-y-3 sm:space-y-4">
                  {/* Student Question */}
                  <div className="relative pl-4 sm:pl-6 border-l-2 border-indigo-100">
                    <div className="absolute -left-[7px] sm:-left-[9px] top-0 w-3 h-3 sm:w-4 sm:h-4 bg-white border-2 border-indigo-200 rounded-full" />
                    <p className="text-[10px] sm:text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                      <User className="w-3 h-3 text-indigo-400" />
                      Student Question
                    </p>
                    <p className="text-gray-700 leading-relaxed italic text-xs sm:text-sm break-words">"{item.question}"</p>
                  </div>

                  {/* AI Response */}
                  <div className="relative pl-4 sm:pl-6 border-l-2 border-emerald-100">
                    <div className="absolute -left-[7px] sm:-left-[9px] top-0 w-3 h-3 sm:w-4 sm:h-4 bg-white border-2 border-emerald-200 rounded-full" />
                    <p className="text-[10px] sm:text-xs font-bold text-emerald-600 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                      <Bot className="w-3 h-3 text-emerald-400" />
                      AI Response
                    </p>
                    <div className="bg-emerald-50/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-gray-700 text-xs sm:text-sm leading-relaxed border border-emerald-100/50 break-words">
                      {item.answer}
                    </div>
                  </div>
                </div>

                {/* Footer tag */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-50 flex justify-end">
                  <span className="text-[8px] sm:text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                    Internal Prompt Logged
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AnimatedCard>
  );
};

export default GPTChatAdmin;
