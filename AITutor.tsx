'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Settings, Plus, AlignLeft, X, History, MessageSquare, Moon, Volume2, Paperclip, Image as ImageIcon, Copy } from 'lucide-react';
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
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [isSoundOn, setIsSoundOn] = useState(false);

  useEffect(() => {
    try {
        const saved = localStorage.getItem('studymate_chat_history');
        if (saved) {
            setMessages(JSON.parse(saved));
        } else {
            setMessages([{ role: 'assistant', content: "Hey! I'm StudyMate. Your personal AI learning partner. I can help you master physics, math, biology, and much more. What are we studying today?" }]);
        }
    } catch(e) {
        setMessages([{ role: 'assistant', content: "Hey! I'm StudyMate." }]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
        localStorage.setItem('studymate_chat_history', JSON.stringify(messages));
    }
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onloadend = () => {
          const img = new Image();
          img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_SIZE = 512;
              let width = img.width;
              let height = img.height;
              
              if (width > height) {
                  if (width > MAX_SIZE) {
                      height *= MAX_SIZE / width;
                      width = MAX_SIZE;
                  }
              } else {
                  if (height > MAX_SIZE) {
                      width *= MAX_SIZE / height;
                      height = MAX_SIZE;
                  }
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
              setSelectedImage(compressedBase64);
          };
          img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendMessage = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;
    
    const userClass = localStorage.getItem('eduverse_class') || 'School Student';
    const textInput = input.trim() || 'Analyze this image.';
    
    const userMsg: ChatMessage = { role: 'user', content: textInput, image: selectedImage || undefined };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    const currentImage = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
        let apiMessages: any[] = [
            { 
                role: "system", 
                content: `You are an AI learning assistant for an app. The user explicitly defined their class level as [${userClass}]. Explain concepts specifically according to their grade level requirements. Be highly engaging and format with **bold** text.` 
            }
        ];

        messages.forEach(m => {
            apiMessages.push({ role: m.role, content: m.content });
        });

        let modelToUse = "llama-3.3-70b-versatile";

        if (currentImage) {
            modelToUse = "llama-3.2-11b-vision-preview";
            apiMessages.push({
                role: "user",
                content: [
                    { type: "text", text: textInput },
                    { type: "image_url", image_url: { url: currentImage } }
                ]
            });
        } else {
            apiMessages.push({ role: "user", content: textInput });
        }

        const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: modelToUse,
                messages: apiMessages,
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Backend service error");
        }

        const data = await res.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'assistant', content: `[SYSTEM ERROR] ${error.message}. Please try again later.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] md:h-[calc(100vh-140px)] w-full max-w-5xl mx-auto bg-[#0a0a0a]/90 md:rounded-[2rem] border-x border-t border-white/5 relative overflow-hidden glass-morphism md:my-6">
      
      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />

      <AnimatePresence>
          {showSidebar && (
              <>
                  <motion.div 
                      key="shroud"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
                      onClick={() => setShowSidebar(false)}
                  />
                  <motion.div 
                      key="drawer"
                      initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      className="absolute top-0 left-0 h-full w-[280px] bg-[#111] z-50 border-r border-white/10 flex flex-col shadow-2xl"
                  >
                      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                          <h3 className="font-bold flex items-center gap-2 text-white"><History size={18} className="text-cyan-400" /> Chat History</h3>
                          <button onClick={() => setShowSidebar(false)} className="text-white/40 hover:text-white p-2 cursor-pointer transition-all"><X size={18} /></button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-start text-left opacity-80 gap-2">
                          {messages.filter(m => m.role === 'user').slice().reverse().map((m, i) => (
                              <div key={i} className="w-full truncate text-xs p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 cursor-pointer">
                                  {m.content}
                              </div>
                          ))}
                          {messages.length <= 1 && (
                              <div className="text-center opacity-50 mt-10">
                                  <MessageSquare size={32} className="text-white/20 mb-3 mx-auto" />
                                  <p className="text-sm text-white/80 font-bold">No Past Chats</p>
                              </div>
                          )}
                      </div>
                      
                      <div className="p-4 border-t border-white/10 bg-black/40">
                          <button onClick={() => setShowSettings(true)} className="w-full flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm font-bold transition-colors cursor-pointer">
                              <Settings size={16} /> App Settings
                          </button>
                      </div>
                  </motion.div>
              </>
          )}
      </AnimatePresence>

      <AnimatePresence>
          {showSettings && (
              <>
                  <motion.div key="settings_bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 z-[60] backdrop-blur-md flex items-center justify-center p-4">
                      <motion.div key="settings_card" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
                          <div className="flex justify-between items-center mb-6">
                              <h3 className="text-xl font-bold text-white flex items-center gap-2"><Settings className="text-cyan-400" /> Settings</h3>
                              <button onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white cursor-pointer"><X size={20} /></button>
                          </div>
                          <div className="space-y-4">
                              <button onClick={() => setIsSoundOn(!isSoundOn)} className="w-full flex justify-between items-center p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-xl cursor-pointer">
                                  <span className="text-sm font-semibold text-white/80 flex gap-3 items-center"><Volume2 size={16} className="text-emerald-400" /> UI Sound Effects</span>
                                  <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${isSoundOn ? 'bg-emerald-500' : 'bg-zinc-600'}`}>
                                      <motion.div animate={{ x: isSoundOn ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full" />
                                  </div>
                              </button>
                              <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 to-transparent">
                                  <span className="text-sm font-semibold text-white/80">AI Vision Engine</span>
                                  <span className="text-xs text-cyan-400 font-bold px-3 py-1.5 rounded-lg shadow-inner flex items-center gap-2 uppercase tracking-widest"><ImageIcon size={14} /> Llama 3.2 Vision</span>
                              </div>
                              <button onClick={() => { localStorage.removeItem('studymate_chat_history'); window.location.reload(); }} className="w-full text-xs text-red-500 uppercase tracking-widest p-4 bg-red-500/10 hover:bg-red-500/20 rounded-xl cursor-pointer transition-all mt-4 font-bold border border-red-500/20">
                                  Clear Chat History
                              </button>
                          </div>
                      </motion.div>
                  </motion.div>
              </>
          )}
      </AnimatePresence>

      <div className="flex justify-between items-center p-4 border-b border-white/5 bg-black/40 xl:rounded-t-[2rem] backdrop-blur-md z-10 shrink-0">
        <div className="flex gap-4 items-center">
            <button onClick={() => setShowSidebar(true)} className="text-white/60 hover:text-white active:scale-90 transition-all cursor-pointer"><AlignLeft /></button>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-widest flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400 animate-pulse">
                    <path d="M2 10L12 5L22 10L12 15L2 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 12V17C6 17 8 19 12 19C16 19 18 17 18 17V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                </svg>
                <span>STUDYMATE <span className="text-white/20 font-light hidden md:inline">v4.0 Llama 4</span></span>
            </h2>
        </div>
        <div className="flex gap-4">
            <button onClick={() => setShowSettings(true)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/80 gap-2 items-center text-xs font-bold uppercase tracking-widest hidden md:flex cursor-pointer border border-transparent active:border-cyan-500/50">
                <Settings size={14} /> Settings
            </button>
            <button 
                onClick={() => setMessages([{ role: 'assistant', content: "Hey! Let's start a fresh topic. What's on your mind?" }])}
                className="w-10 h-10 md:w-auto md:px-4 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 active:scale-95 transition-all text-sm font-bold flex gap-2 items-center cursor-pointer border-b-4 border-cyan-500/30 active:border-b-0 active:translate-y-1"
            >
                <Plus size={18} /> <span className="hidden md:block">New Chat</span>
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full hide-scroll scroll-smooth pt-4 md:pt-8 relative z-0 pb-48">
         <div className="max-w-3xl mx-auto w-full px-4 md:px-8 space-y-6 md:space-y-8">
            
            {messages.length === 1 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-10 md:py-20 opacity-80">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mb-4 md:mb-6">
                        <Bot size={32} className="text-cyan-500" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-white text-center">HOW CAN I HELP YOU?</h3>
                    <p className="text-white/60 mt-2 text-xs md:text-sm text-center max-w-xs md:max-w-none">Ask me anything about physics, math, or biology. You can even upload photos of your homework!</p>
                </motion.div>
            )}

            {messages.map((msg, i) => (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                 key={i} 
                 className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
               >
                 <div className="flex gap-3 md:gap-4 max-w-[95%] md:max-w-[85%]">
                    {msg.role === 'assistant' && (
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-cyan-500 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                            <Bot size={14} className="text-[#0a0a0a]" />
                        </div>
                    )}
                    
                    <div className={`p-4 md:p-5 text-[14px] md:text-[15px] leading-relaxed rounded-2xl shadow-lg border border-white/5 flex flex-col gap-3 relative group/msg ${msg.role === 'user' ? 'bg-cyan-500 text-black rounded-tr-sm font-medium' : 'bg-white/5 text-white/90 backdrop-blur-md rounded-tl-sm'}`}>
                        {msg.image && (
                            <img src={msg.image} alt="Uploaded file" className="w-[200px] h-auto rounded-xl object-cover shadow-md border border-black/20" />
                        )}
                        {msg.role === 'assistant' ? (
                            <>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(msg.content);
                                        const btn = document.getElementById(`copy-${i}`);
                                        if (btn) {
                                            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-400"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied';
                                            setTimeout(() => {
                                                btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg> Copy';
                                            }, 2000);
                                        }
                                    }}
                                    id={`copy-${i}`}
                                    className="absolute top-2 right-2 opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1.5 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md text-[10px] uppercase font-bold text-white/60 hover:text-white cursor-pointer"
                                >
                                    <Copy size={12} /> Copy
                                </button>
                                <div className="whitespace-pre-wrap font-light text-white mt-2" dangerouslySetInnerHTML={{__html: msg.content.replace(/\*\*(.*?)\*\*/g, '<b class="text-cyan-400 font-bold">$1</b>')}} />
                            </>
                        ) : (
                            <span className="whitespace-pre-wrap">{msg.content}</span>
                        )}
                    </div>
                    
                    {msg.role === 'user' && (
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1">
                            <User size={14} className="text-white/60" />
                        </div>
                    )}
                 </div>
               </motion.div>
            ))}
            
            {isLoading && (
               <div className="flex gap-4 w-full justify-start items-center ml-2">
                 <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0 animate-pulse">
                     <Bot size={16} className="text-cyan-500" />
                 </div>
                 <div className="flex gap-1.5 px-4 py-2 opacity-50">
                    <motion.div animate={{y: [0,-3,0]}} transition={{repeat: Infinity, duration: 0.6}} className="w-2 h-2 bg-cyan-400 rounded-full" />
                    <motion.div animate={{y: [0,-3,0]}} transition={{repeat: Infinity, duration: 0.6, delay: 0.1}} className="w-2 h-2 bg-cyan-400 rounded-full" />
                    <motion.div animate={{y: [0,-3,0]}} transition={{repeat: Infinity, duration: 0.6, delay: 0.2}} className="w-2 h-2 bg-cyan-400 rounded-full" />
                 </div>
               </div>
            )}
            
            <div ref={endOfMessagesRef} />
         </div>
      </div>

      {/* Chat Summarizer & Input Area Container */}
      <div className="w-full bg-black/40 backdrop-blur-xl border-t border-white/5 p-4 z-20">
         <div className="max-w-3xl mx-auto space-y-4">
            
            {/* Chat Summarizer */}
            <div className="px-2 md:px-0">
               <ChatSummarizer messages={messages} />
            </div>

            {/* Input Bar */}
            <div className="relative group flex flex-col items-center">
               <AnimatePresence>
               {selectedImage && (
                   <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="absolute -top-24 left-6 bg-[#111] p-1.5 rounded-xl border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.8)] flex flex-col items-end z-30">
                       <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full cursor-pointer hover:scale-110 transition-all"><X size={12} /></button>
                       <img src={selectedImage} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                   </motion.div>
               )}
               </AnimatePresence>

               <div className="absolute inset-2 -z-10 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-[2rem] blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
               
               <div className="relative flex items-center bg-[#111111] border border-white/10 rounded-[2rem] p-1 md:p-2 w-full shadow-xl">
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shrink-0 cursor-pointer text-white/50 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-full transition-all ml-1"
                   >
                       <Paperclip size={20} />
                   </button>
                   <input 
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                       onKeyDown={(e) => { if(e.key === 'Enter') sendMessage(); }}
                       placeholder={selectedImage ? "Ask about this image..." : "Message EduBot..."}
                       disabled={isLoading}
                       className="flex-1 bg-transparent px-2 md:px-4 py-3 md:py-4 outline-none text-white text-[14px] md:text-[15px] placeholder:text-white/30 disabled:opacity-50"
                   />
                   <button 
                     onClick={sendMessage}
                     disabled={isLoading || (!input.trim() && !selectedImage)}
                     className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 shrink-0 cursor-pointer shadow-lg shadow-white/20 mr-1"
                   >
                       <Send size={18} className="ml-1 md:ml-0 md:size-20" />
                   </button>
               </div>
               <p className="text-center text-[8px] md:text-[10px] text-white/20 uppercase tracking-widest mt-3">StudyMate uses Llama 4 & Llama 3.3. Verify important facts.</p>
            </div>
         </div>
      </div>
    </div>
  );
}
