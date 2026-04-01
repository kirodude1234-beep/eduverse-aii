'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Menu, BookOpen, Lightbulb, CheckCircle, ChevronRight, Wand2, ArrowLeft, Loader2, Layers, Trophy, Atom, Crown, Brain } from 'lucide-react';
import MindMap from '@/components/MindMap';
import { NCERT_DATA } from '@/data/ncert';
import { BACKEND_URL } from '@/lib/config';

interface NCERTModuleProps {
  subject: string;
  onStartQuiz: (chapterTitle: string) => void;
  onStartFlashcards: (chapterTitle: string) => void;
}

export default function NCERTModule({ subject, onStartQuiz, onStartFlashcards }: NCERTModuleProps) {
  const [isELI5, setIsELI5] = useState(false);
  const [chapters, setChapters] = useState<any[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [detailedPoint, setDetailedPoint] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanationMap, setExplanationMap] = useState<Record<string, string>>({});
  const [userClass, setUserClass] = useState('Class 10');
  const [showMindMap, setShowMindMap] = useState(false);

  useEffect(() => {
     const stored = typeof window !== 'undefined' ? localStorage.getItem('eduverse_class') || 'Class 10' : 'Class 10';
     setUserClass(stored);
  }, []);

  useEffect(() => {
     let isMounted = true;
     const loadChapters = async () => {
         setIsLoadingChapters(true);
         const storedClass = typeof window !== 'undefined' ? localStorage.getItem('eduverse_class') || 'Class 10' : 'Class 10';
         
         if (storedClass === 'Class 10' && NCERT_DATA[subject]) {
             setTimeout(() => {
                 if (isMounted) {
                     setChapters(NCERT_DATA[subject]);
                     setIsLoadingChapters(false);
                 }
             }, 300);
             return;
         }

         const cacheKey = `eduverse_curriculum_${storedClass}_${subject}`;
         const cachedData = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
         
         if (cachedData) {
             setTimeout(() => {
                 if (isMounted) {
                     setChapters(JSON.parse(cachedData));
                     setIsLoadingChapters(false);
                 }
             }, 300);
             return;
         }

         try {
             const res = await fetch(BACKEND_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        { role: "system", content: "You are an Indian Curriculum expert. Output ONLY a valid JSON array of EXACTLY 8 objects. Schema: [{ id: 1, title: 'Chapter Title', eli5: 'Simple explanation of this chapter.', points: ['Core concept 1', 'Core concept 2'] }]. No other text, no markdown." },
                        { role: "user", content: `Generate 8 core chapters for the subject ${subject} for a student specifically in ${storedClass}.` }
                    ],
                    temperature: 0.3
                })
             });
             
             const data = await res.json();
             let content = data.choices[0].message.content.trim();
             if (content.startsWith('```json')) content = content.substring(7);
             if (content.startsWith('```')) content = content.substring(3);
             if (content.endsWith('```')) content = content.substring(0, content.length - 3);
             
             const parsed = JSON.parse(content.trim());
             if (isMounted && Array.isArray(parsed) && parsed.length > 0) {
                 localStorage.setItem(cacheKey, JSON.stringify(parsed));
                 setChapters(parsed);
             } else {
                 throw new Error("Invalid format");
             }
         } catch(e) {
             if (isMounted) {
                 const fallback = NCERT_DATA[subject] || NCERT_DATA['Science'] || [];
                 setChapters(fallback);
             }
         } finally {
             if (isMounted) setIsLoadingChapters(false);
         }
     };
     
     loadChapters();
     return () => { isMounted = false; };
  }, [subject]);

  const handlePointClick = async (point: string) => {
    setDetailedPoint(point);
    if (explanationMap[point]) return;
    setIsExplaining(true);
    try {
      const storedClass = userClass;
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
                { role: "system", content: `You are an expert NCERT Indian curriculum tutor for a student in ${storedClass}. Explain the given topic comprehensively yet simply. Make it engaging and easy to understand. Format directly as paragraphs without complex markdown headers.` }, 
                { role: "user", content: `Explain the concept: "${point}" from the NCERT chapter "${chapters[activeChapterIdx]?.title}" in the subject ${subject}.` }
            ],
            temperature: 0.7
        })
      });
      const data = await res.json();
      setExplanationMap(prev => ({ ...prev, [point]: data.choices[0].message.content }));
    } catch(e) {
      setExplanationMap(prev => ({ ...prev, [point]: "Network error. Failed to generate AI explanation." }));
    } finally {
      setIsExplaining(false);
    }
  };

  const activeChapter = chapters[activeChapterIdx];

  if (isLoadingChapters) {
      return (
         <section className="relative z-20 pb-24 md:pb-0 min-h-[50vh] flex flex-col items-center justify-center">
             <Loader2 size={48} className="text-cyan-400 animate-spin mb-4" />
             <p className="text-cyan-400 text-xs font-black tracking-widest uppercase animate-pulse">Designing Curriculum for your Class...</p>
         </section>
      );
  }

  if (!activeChapter) return null;

  return (
    <section className="relative z-20 pb-24 md:pb-12 min-h-[85vh] flex flex-col overflow-visible">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:grid md:grid-cols-12 gap-6 md:gap-12 flex-1 relative">
        
        <div className={`md:col-span-4 lg:col-span-3 space-y-4 shrink-0 hide-scroll ${detailedPoint ? 'hidden md:block' : 'overflow-x-auto md:overflow-visible pb-4 md:pb-0'}`}>
          <div className="p-6 md:glass-morphism md:rounded-[2.5rem] border-cyan-500/20 w-full md:sticky md:top-24 md:max-h-[80vh] md:overflow-y-auto hide-scroll">
            <h4 className="text-white font-black text-xs uppercase tracking-widest mb-4 flex gap-2"><Menu size={14} /> MODULES</h4>
            <div className="flex md:flex-col gap-3 overflow-x-auto w-full pr-12 md:pr-0 pb-4 md:pb-0">
              {chapters.map((c: any, i: number) => (
                <button 
                    key={c.id || i} 
                    onClick={() => { setActiveChapterIdx(i); setDetailedPoint(null); }}
                    className={`p-4 rounded-2xl flex items-center justify-between group transition-all shrink-0 w-[240px] md:w-full text-left cursor-pointer border-b-4 active:border-b-0 active:translate-y-1 ${activeChapterIdx === i && !detailedPoint ? 'bg-cyan-500/20 border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.1)]' : 'hover:bg-white/10 opacity-60 bg-white/5 md:bg-transparent border-transparent md:border-white/10'}`}
                >
                  <span className={`text-sm ${activeChapterIdx === i && !detailedPoint ? 'text-cyan-400 font-bold' : 'text-white'}`}>{c.title}</span>
                  <ChevronRight size={14} className="text-white/20 group-hover:text-cyan-400 shrink-0 hidden md:block" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-8 lg:col-span-9 flex flex-col min-h-0 relative">
          <AnimatePresence mode="wait">
            {detailedPoint ? (
              <motion.div 
                 key="detail_tab"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
                 transition={{ duration: 0.4 }}
                 className="glass-morphism rounded-t-3xl md:rounded-[2.5rem] md:rounded-b-[2.5rem] border border-cyan-500/30 shadow-2xl flex flex-col flex-1 overflow-hidden"
              >
                  <div className="p-6 md:p-8 border-b border-white/10 flex items-center gap-4 bg-black/40">
                     <button onClick={() => setDetailedPoint(null)} className="w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all shrink-0"><ArrowLeft /></button>
                     <div>
                         <h2 className="text-xl md:text-3xl font-black text-white leading-tight flex gap-3 items-center">
                             {detailedPoint}
                         </h2>
                         <p className="text-[10px] md:text-xs text-cyan-400 font-bold tracking-widest uppercase mt-1">Deep Dive Explanation</p>
                     </div>
                  </div>

                  <div className="flex-1 p-6 md:p-12 text-white/80 space-y-6 text-sm md:text-base leading-relaxed bg-[#0a0a0a]/80 relative z-0">
                      
                      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

                      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
                      
                      {isExplaining ? (
                          <div className="flex flex-col items-center justify-center py-20 opacity-80">
                              <Loader2 size={48} strokeWidth={2} className="text-cyan-400 animate-spin mb-6 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400 animate-pulse">EduBot is Compiling Explanation...</p>
                          </div>
                      ) : (
                          <div className="space-y-8 relative z-10">
                              <p className="text-xl md:text-2xl font-light leading-relaxed text-white whitespace-pre-wrap">
                                 {explanationMap[detailedPoint] || "Analyzing..."}
                              </p>
                              
                               <Atom size={64} className="text-white/20 group-hover:text-white/40 transition-all duration-1000 slow-spin" />
                               {userClass === 'Class 10' && (
                                   <div className="absolute bottom-4 right-4 flex gap-2">
                                       <div className="px-4 py-2 bg-yellow-500 text-black text-[10px] font-black rounded-lg shadow-xl uppercase tracking-widest flex items-center gap-2">
                                          <Crown size={12} /> TOPPER'S ANSWER BUILDER
                                       </div>
                                   </div>
                               )}
                          </div>
                      )}
                      
                      <div className="p-6 rounded-[2.5rem] bg-cyan-500/10 border border-cyan-500/20 text-cyan-50 mt-8 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                         <h4 className="flex items-center gap-2 font-black text-cyan-400 mb-2 uppercase tracking-widest text-xs"><Lightbulb size={16} /> Exam Tip</h4>
                         <p className="text-sm font-medium">Practice derivations and objective questions related explicitly to this fundamental point, as it frequently acts as the foundation for multi-part questions in the final exams.</p>
                      </div>
                  </div>
              </motion.div>
            ) : (
              <motion.div 
                 key="main_tab"
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 transition={{ duration: 0.4 }}
                 className="glass-morphism rounded-t-3xl md:rounded-[2.5rem] overflow-hidden border-white/5 flex-1 flex flex-col min-h-[500px]"
              >
                <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row gap-4 md:gap-6 md:items-center justify-between">
                  <div className="flex gap-4">
                    <div className="p-3 bg-fuchsia-500/20 text-fuchsia-400 rounded-2xl shrink-0"><BookOpen size={24} /></div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-white">{activeChapter.title}</h3>
                      <p className="text-[10px] md:text-xs text-white/40 font-bold tracking-widest uppercase">{subject} • CHAPTER {activeChapter.id}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsELI5(!isELI5)}
                    className={`flex gap-2 items-center px-4 py-2 md:px-6 md:py-3 rounded-[1.5rem] transition-all self-start md:self-auto cursor-pointer border-b-4 active:border-b-0 active:translate-y-1 ${isELI5 ? 'bg-yellow-400 text-black border-yellow-600 shadow-[0_0_20px_rgba(250,204,21,0.4)]' : 'bg-white/10 text-white border-white/20'}`}
                  >
                    <Wand2 size={16} className={isELI5 ? 'animate-bounce' : ''} />
                    <span className="font-black text-[10px] tracking-[0.1em]">{isELI5 ? "NATIVE EXPLANATION" : "EXPLAIN LIKE I'M 5"}</span>
                  </button>
                </div>

                <div className="p-6 md:p-12 flex-1 relative overflow-y-auto hide-scroll">
                   <motion.div 
                     key={isELI5 ? 'eli5' : 'normal'}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.4 }}
                     className="space-y-8"
                   >
                     <div className="space-y-4">
                        <h4 className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] flex gap-2"><Lightbulb size={12} /> CORE CONCEPT</h4>
                        <p className={`text-lg md:text-2xl font-light leading-relaxed tracking-wide ${isELI5 ? 'text-yellow-100 italic' : 'text-white'}`}>
                            {isELI5 ? activeChapter.eli5 : 'A comprehensive deep dive into ' + activeChapter.title + '. Based directly on the latest NCERT syllabus standards.'}
                        </p>
                     </div>

                     {!isELI5 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                            <div className="space-y-6">
                                <h4 className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] flex gap-2"><CheckCircle size={12} /> KEY POINTS (Click for info)</h4>
                                <div className="space-y-3">
                                    {activeChapter.points.map((p: string, i: number) => (
                                        <button 
                                          key={p} 
                                          onClick={() => handlePointClick(p)}
                                          className="w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-[1.5rem] border-b-4 border-white/10 active:border-b-0 active:translate-y-1 text-white/90 text-sm md:text-base shadow-sm backdrop-blur-md transition-all cursor-pointer flex justify-between items-center group"
                                        >
                                            <span className="font-medium pr-4">{p}</span>
                                            <div className="flex items-center gap-4 pr-4">
                                                {userClass === 'Class 10' && i % 2 === 0 && (
                                                   <span className="hidden sm:block px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-[8px] font-black text-rose-50 rounded-full shadow-lg brightness-110">BOARD PRIORITY</span>
                                                )}
                                                <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-cyan-500/20 flex items-center justify-center shrink-0 transition-colors">
                                                    <ChevronRight size={16} className="text-white/40 group-hover:text-cyan-400 transition-colors" />
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="hidden md:flex bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-[2.5rem] border border-white/5 p-6 items-center justify-center min-h-[200px] shadow-inner relative overflow-hidden group hover:from-cyan-500/20 hover:to-purple-500/20 transition-colors cursor-pointer" onClick={() => handlePointClick(activeChapter.points[0])}>
                                <Atom size={120} strokeWidth={1} className="text-white/10 absolute group-hover:scale-110 group-hover:rotate-90 transition-all duration-1000" />
                                <div className="z-10 text-center flex flex-col items-center">
                                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4"><span className="text-white font-black text-xl">i</span></div>
                                    <p className="text-white/80 text-xs font-black tracking-[0.5em]">STUDY<br/>ASSET</p>
                                </div>
                            </div>
                        </div>
                     )}
                   </motion.div>
                </div>

                <div className="p-4 md:p-6 border-t border-white/5 flex flex-wrap gap-4 justify-center md:justify-between items-center bg-black/40">
                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        <button 
                          onClick={() => onStartFlashcards(activeChapter.title)}
                          className="flex-1 md:flex-none px-6 py-4 bg-purple-500 text-white text-xs font-black rounded-[1.2rem] border-b-4 border-purple-700 hover:bg-purple-400 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)] cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Layers size={18} /> FLASHCARDS
                        </button>
                        <button 
                          onClick={() => onStartQuiz(activeChapter.title)}
                          className="flex-1 md:flex-none px-6 py-4 bg-cyan-400 text-black text-xs font-black rounded-[1.2rem] border-b-4 border-cyan-600 hover:bg-cyan-300 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Trophy size={18} /> QUIZ ENGINE
                        </button>
                        <button 
                          onClick={() => setShowMindMap(true)}
                          className="flex-1 md:flex-none px-6 py-4 bg-emerald-500/10 text-emerald-400 text-xs font-black rounded-[1.2rem] border-b-4 border-emerald-500/30 hover:bg-emerald-500/20 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_20px_rgba(16,185,129,0.1)] cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Brain size={18} /> MIND MAP
                        </button>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-white/40 text-[10px] font-bold tracking-widest uppercase">
                        <Wand2 size={12} /> AI ASSISTANCE ACTIVE
                    </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
          {showMindMap && (
              <MindMap 
                chapterTitle={activeChapter.title} 
                points={activeChapter.points} 
                onClose={() => setShowMindMap(false)} 
              />
          )}
      </AnimatePresence>


    </section>
  );
}
