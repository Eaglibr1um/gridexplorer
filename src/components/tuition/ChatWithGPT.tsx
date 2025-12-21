import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Sparkles, Loader2, MessageSquare, Bot, User, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { Tutee } from '../../types/tuition';
import { callChatGPT } from '../../services/chatgptService';
import { saveChatEntry } from '../../services/gptChatService';

interface ChatWithGPTProps {
  tutee: Tutee;
  isOpen: boolean;
  onClose: () => void;
}

const ChatWithGPT = ({ tutee, isOpen, onClose }: ChatWithGPTProps) => {
  const [question, setQuestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping]);

  if (!isOpen) return null;

  const handleAsk = async (customQuestion?: string, isElaboration = false) => {
    const q = (customQuestion || question).trim();
    if (!q) return;

    if (!isElaboration) {
      setChatHistory(prev => [...prev, { role: 'user', content: q }]);
      setQuestion('');
    } else {
      setChatHistory(prev => [...prev, { role: 'user', content: 'Sorry, please elaborate more.' }]);
    }

    setIsTyping(true);
    setError('');

    try {
      const prompt = `Hi ChatGPT, i am ${tutee.name}, i am studying ${tutee.description} in singapore. I have a question regarding ${q}, please answer me in 100 word max, thank you.`;
      
      const fullPrompt = isElaboration 
        ? `Original prompt: ${prompt}\n\nPrevious answer: ${chatHistory[chatHistory.length - 1].content}\n\nUser request: sorry please elaborate more.`
        : prompt;

      const response = await callChatGPT({
        message: fullPrompt,
        systemPrompt: "You are a helpful and concise tuition assistant. Keep your answers under 100 words.",
        model: 'gpt-4o-mini',
        temperature: 0.7,
      });

      const answer = response.response;
      setChatHistory(prev => [...prev, { role: 'assistant', content: answer }]);
      
      // Save to database
      await saveChatEntry(tutee.id, q, answer, fullPrompt);

    } catch (err: any) {
      console.error('GPT Error:', err);
      setError('Oops! Something went wrong with the AI. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop">
      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 max-w-2xl w-full my-auto animate-modal-content border border-white/20 relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-4 bg-gradient-to-br ${tutee.colorScheme.gradient} rounded-2xl shadow-lg transform rotate-3`}>
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">AI Assistant</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Talk to {tutee.name}'s AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
          >
            <X className="w-6 h-6 text-gray-300" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[60vh] space-y-6 custom-scrollbar bg-gray-50/50 p-6 rounded-3xl mb-6 shadow-inner">
          {chatHistory.length === 0 && !isTyping && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60 py-10">
              <div className="w-20 h-20 bg-indigo-100 rounded-[2rem] flex items-center justify-center shadow-inner">
                <Bot className="w-10 h-10 text-indigo-600" />
              </div>
              <div>
                <p className="text-lg font-black text-gray-800 tracking-tight">Hello {tutee.name}!</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest max-w-[200px] leading-relaxed mx-auto mt-2">Ask me any questions about your studies!</p>
              </div>
            </div>
          )}

          {chatHistory.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${
                  msg.role === 'user' ? `bg-gradient-to-br ${tutee.colorScheme.gradient}` : 'bg-white border border-indigo-100'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-indigo-600" />}
                </div>
                <div className={`p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? `bg-gradient-to-br ${tutee.colorScheme.gradient} text-white rounded-tr-none` 
                    : 'bg-white text-gray-800 rounded-tl-none border border-indigo-50'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start animate-pulse">
              <div className="flex gap-3 max-w-[85%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white border border-indigo-100 flex items-center justify-center shadow-sm">
                  <Bot className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-indigo-50 shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest rounded-2xl border-2 border-red-100 text-center mx-4 animate-shake">
              {error}
            </div>
          )}

          {/* Assistant elaboration buttons */}
          {chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'assistant' && !isTyping && (
            <div className="flex justify-start ml-11 gap-2 animate-in fade-in zoom-in duration-300">
              <button
                onClick={() => setChatHistory(prev => [...prev, { role: 'assistant', content: "Great! Let me know if you need anything else." }])}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-200 transition-colors shadow-sm active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ok!
              </button>
              <button
                onClick={() => handleAsk(chatHistory[chatHistory.length - 2].content, true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-200 transition-colors shadow-sm active:scale-95"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
                Elaborate
              </button>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="space-y-4">
          <div className="relative flex items-center gap-3">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              placeholder="Ask me something..."
              className="flex-1 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none transition-all text-sm font-medium resize-none max-h-32 shadow-inner"
              rows={1}
              disabled={isTyping}
            />
            <button
              onClick={() => handleAsk()}
              disabled={isTyping || !question.trim()}
              className={`p-4 rounded-2xl text-white shadow-xl transition-all active:scale-95 ${
                !question.trim() || isTyping 
                  ? 'bg-gray-200 shadow-none' 
                  : `bg-gradient-to-br ${tutee.colorScheme.gradient} hover:shadow-2xl`
              }`}
            >
              {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-[10px] text-center text-gray-400 font-black uppercase tracking-[0.2em]">
            Powered by GPT-4o Mini
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ChatWithGPT;
