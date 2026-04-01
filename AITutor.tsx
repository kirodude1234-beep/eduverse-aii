'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bot, Send, User, Settings, Plus, AlignLeft, X, History, 
    MessageSquare, Volume2, Paperclip, Image as ImageIcon, 
    Copy, Brain, LayoutDashboard, ChevronRight
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import ChatSummarizer from '@/components/ChatSummarizer';
import { BACKEND_URL } from '@/lib/config';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    image?: string;
}

export default function AITutor() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
    // UI State
    const [showSidebar, setShowSidebar] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isSoundOn, setIsSoundOn] = useState(false);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence
  useEffect(() => {
    try {
        const saved = localStorage.getItem('studymate_chat_history');
        if (saved) setMessages(JSON.parse(saved));
        else setMessages([{ role: 'assistant', content: "Hey! I'm StudyMate. Ready to master some new concepts today?" }]);
    } catch(e) {}
  }, []);

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem('studymate_chat_history', JSON.stringify(messages));
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;
    const userClass = localStorage.getItem('eduverse_class') || 'High School';
    setIsLoading(true);
    const userMsg: ChatMessage = { role: 'user', content: input.trim() || 'Analyze this image.', image: selectedImage || undefined };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const currentImg = selectedImage;
    setSelectedImage(null);

    try {
        const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: currentImg ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: `You are an expert Study Assistant for [${userClass}]. Explain concepts clearly with **bold** text and structured answers. Be encouraging.` },
                    ...messages.map(m => ({ role: m.role, content: m.content })),
                    currentImg ? { role: "user", content: [{ type: "text", text: userMsg.content }, { type: "image_url", image_url: { url: currentImg } }] } : { role: "user", content: userMsg.content }
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        });
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
    } catch (e) {
        setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ AI service error. Check your connection or try a shorter question." }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[100dvh] md:h-[calc(100vh-140px)] w-full max-w-7xl mx-auto bg-black border border-white/5 md:rounded-[2.5rem] relative overflow-hidden transition-all duration-500 shadow-2xl md:my-6">
      
      {/* 1. LEFT SIDEBAR (HISTORY) */}
      <AnimatePresence>
          {showSidebar && (
              <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className="absolute md:relative z-50 h-full w-[280px] bg-[#050505] border-r border-white/5 flex flex-col pt-16 md:pt-0">
                  <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black">
                     <h3 className="text-white font-black uppercase tracking-widest text-xs flex gap-2"><History size={16} className="text-cyan-400" /> Archives</h3>
                     <button onClick={() => setShowSidebar(false)} className="text-white/20 hover:text-white"><X size={18} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 opacity-60">
                      {messages.filter(m => m.role === 'user').slice().reverse().map((m, i) => (
                          <div key={i} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] text-white/50 truncate uppercase font-bold tracking-widest cursor-pointer transition-all">{m.content}</div>
                      ))}
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* 2. CENTER STAGE (CHAT) */}
      <div className="flex-1 flex flex-col relative bg-transparent z-0 overflow-hidden">
          
          {/* Header */}
          <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-xl shrink-0">
              <div className="flex items-center gap-4">
                  <button onClick={() => setShowSidebar(!showSidebar)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"><AlignLeft size={20} /></button>
                  <h2 className="text-white font-black uppercase tracking-widest text-sm flex gap-2 items-center">
                      <Brain size={18} className="text-cyan-400" /> StudyMate <span className="text-white/20 font-bold hidden md:inline">• LLAMA 3.3</span>
                  </h2>
              </div>
                                    <div className="flex gap-2">
                                    <button 
                                            onClick={() => setMessages([{ role: 'assistant', content: "Okay! I'm ready for the next topic. What's on your mind?" }])}
                                            className="h-10 w-10 md:w-auto md:px-4 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 flex items-center gap-2 uppercase tracking-[0.2em] text-[10px] font-black transition-all border-b-2 border-cyan-500/20 active:border-0"
                                    >
                                        <Plus size={16} /> <span className="hidden md:inline">New Chat</span>
                                    </button>
                  <button onClick={() => setShowSettings(true)} className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"><Settings size={18} /></button>
              </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto w-full pt-10 pb-20 scroll-smooth px-4 md:px-10">
              <div className="max-w-3xl mx-auto flex flex-col gap-12 min-h-full">
                  {messages.map((m, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-6 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center border ${m.role === 'assistant' ? 'bg-cyan-500/20 border-cyan-500/30' : 'bg-white/5 border-white/10'}`}>
                             {m.role === 'assistant' ? <Bot size={20} className="text-cyan-400" /> : <User size={20} className="text-white/40" />}
                          </div>
                          <div className="flex flex-col gap-4 max-w-[85%]">
                              {m.image && <img src={m.image} alt="Upload" className="w-[300px] h-auto rounded-3xl border border-white/10 shadow-2xl" />}
                              <div className={`text-sm leading-[1.8] tracking-wide ${m.role === 'user' ? 'text-white/80 font-medium' : 'text-white/90'}`}>
                                 <div dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*(.*?)\*\*/g, '<b class="text-cyan-400 font-bold">$1</b>').replace(/\n/g, '<br/>') }} />
                              </div>
                              {m.role === 'assistant' && (
                                  <button onClick={() => navigator.clipboard.writeText(m.content)} className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-white/20 hover:text-white transition-colors"><Copy size={12} /> Copy Intel</button>
                              )}
                          </div>
                      </motion.div>
                  ))}
                  {isLoading && (
                      <div className="flex gap-6 animate-pulse">
                          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20"><Bot size={20} className="text-cyan-400 opacity-50" /></div>
                          <div className="space-y-4 pt-3 flex-1">
                              <div className="h-2 w-[40%] bg-white/10 rounded-full" />
                              <div className="h-2 w-[70%] bg-white/5 rounded-full" />
                          </div>
                      </div>
                  )}
                  <div ref={endOfMessagesRef} />
              </div>
          </div>

          {/* Input Bar */}
          <div className="p-6 shrink-0 bg-transparent absolute bottom-0 left-0 w-full z-10">
              <div className="max-w-3xl mx-auto relative group">
                  <AnimatePresence>
                     {selectedImage && (
                         <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="absolute -top-16 left-4 bg-black/80 backdrop-blur-xl p-1 rounded-xl border border-white/20 flex items-center gap-2 group">
                             <img src={selectedImage} alt="Preview" className="w-10 h-10 object-cover rounded-lg" />
                             <button onClick={() => setSelectedImage(null)} className="p-1 hover:text-red-500 text-white/40"><X size={14} /></button>
                         </motion.div>
                     )}
                  </AnimatePresence>
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-purple-400/10 rounded-3xl blur-2xl opacity-0 group-focus-within:opacity-100 transition-all duration-700" />
                  
                  <div className="relative flex items-center bg-[#111] border border-white/10 rounded-3xl p-1 shadow-2xl focus-within:border-white/20 transition-all duration-300">
                      <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 flex items-center justify-center text-white/20 hover:text-cyan-400 transition-colors"><PaperclipIcon size={20} /></button>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if(file) { const reader = new FileReader(); reader.onloadend = () => setSelectedImage(reader.result as string); reader.readAsDataURL(file); } }} />
                      <input 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Study Session Objective..."
                        className="flex-1 bg-transparent px-4 py-4 text-sm text-white outline-none placeholder:text-white/20 tracking-wide font-medium"
                      />
                      <button 
                        onClick={sendMessage}
                        disabled={isLoading || (!input && !selectedImage)}
                        className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5 disabled:opacity-30 mr-1"
                      >
                        <Send size={18} />
                      </button>
                  </div>
              </div>
          </div>
      </div>

      

      {/* Global Settings Modal */}
      <AnimatePresence>
          {showSettings && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111] border border-white/10 rounded-[2.5rem] p-10 w-full max-w-sm relative">
                      <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 text-white/20 hover:text-white"><X size={24} /></button>
                      <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3"><Settings className="text-cyan-400" /> Config</h3>
                      <div className="space-y-6">
                           <button onClick={() => setIsSoundOn(!isSoundOn)} className="w-full p-5 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-between transition-all group">
                               <div className="flex items-center gap-4">
                                   <Volume2 size={24} className="text-emerald-400" />
                                   <span className="text-sm font-bold text-white/50 group-hover:text-white">Immersive Sound</span>
                               </div>
                               <div className={`w-10 h-6 rounded-full px-1 flex items-center transition-all ${isSoundOn ? 'bg-emerald-500' : 'bg-white/10'}`}>
                                  <motion.div animate={{ x: isSoundOn ? 16 : 0 }} className="w-4 h-4 bg-white rounded-full" />
                               </div>
                           </button>
                           <div className="p-5 bg-white/5 rounded-2xl border border-cyan-400/20 flex flex-col gap-2">
                               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Memory Core</p>
                               <div className="flex items-center gap-2 text-white font-bold text-sm">
                                   <LayoutDashboard size={18} className="text-cyan-400" /> V4.0 Intelligence
                               </div>
                           </div>
                           <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full p-5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all">Factory Reset Data</button>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

    </div>
  );
}

function PaperclipIcon({ size }: { size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
    )
}
