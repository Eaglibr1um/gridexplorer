import { useState, useEffect, useMemo } from 'react';
import { Bot, Search, Calendar, User, MessageSquare, Sparkles, ChevronRight, Filter, Layout, ArrowUpRight } from 'lucide-react';
import { fetchAllChatHistory, ChatHistoryEntry } from '../../../services/gptChatService';
import AnimatedCard from '../../ui/AnimatedCard';
import { format } from 'date-fns';

const GPTChatAdmin = () => {
  const [history, setHistory] = useState<(ChatHistoryEntry & { tutee_name: string })[]>([]);
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
    <AnimatedCard className="overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600 shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">AI Chat Insights</h2>
              <p className="text-sm text-gray-500">Monitor student interactions with the AI assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-wider">
              {filteredHistory.length} Interactions
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedTutee}
              onChange={(e) => setSelectedTutee(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-gray-700 appearance-none"
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
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <div 
                key={item.id}
                className="group bg-white border border-gray-100 rounded-[2rem] p-6 hover:shadow-xl hover:border-indigo-100 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-md">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-800 tracking-tight">{item.tutee_name}</h4>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(item.createdAt), 'MMM d, yyyy • h:mm a')}
                      </div>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative pl-6 border-l-2 border-indigo-100">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-indigo-200 rounded-full" />
                    <p className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <User className="w-3 h-3 text-indigo-400" />
                      Student Question
                    </p>
                    <p className="text-gray-600 leading-relaxed italic">"{item.question}"</p>
                  </div>

                  <div className="relative pl-6 border-l-2 border-emerald-100">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-emerald-200 rounded-full" />
                    <p className="text-sm font-bold text-emerald-700 mb-1 flex items-center gap-2">
                      <Bot className="w-3 h-3 text-emerald-400" />
                      AI Response
                    </p>
                    <div className="bg-emerald-50/50 p-4 rounded-2xl text-gray-700 text-sm leading-relaxed border border-emerald-50">
                      {item.answer}
                    </div>
                  </div>
                </div>

                {/* Show full prompt on hover/click if needed, for now just a tag */}
                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">
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
