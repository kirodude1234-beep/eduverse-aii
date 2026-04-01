'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Loader2, Sparkles, Zap, GitBranch, Share2 } from 'lucide-react';
import { BACKEND_URL } from '@/lib/config';

interface MindMapProps {
  chapterTitle: string;
  points: string[];
  onClose: () => void;
}

export default function MindMap({ chapterTitle, points, onClose }: MindMapProps) {
  const [nodes, setNodes] = useState<{ id: string; label: string; x: number; y: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateMap = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { 
                role: "system", 
                content: "You are a visual concept mapper. Analyze the lesson points and create exactly 6-8 core nodes. Output ONLY a valid JSON array of strings. No text around it. Just like: ['Concept 1', 'Concept 2', ...]" 
              },
              { role: "user", content: `Chapter: ${chapterTitle}. Points: ${points.join(', ')}` }
            ],
            temperature: 0.3
          })
        });
        const data = await res.json();
        let content = data.choices[0].message.content.trim();
        if (content.startsWith('```json')) content = content.substring(7);
        if (content.startsWith('```')) content = content.substring(3);
        if (content.endsWith('```')) content = content.substring(0, content.length - 3);
        
        const labels: string[] = JSON.parse(content);
        // Position nodes in a organic circular layout
        const newNodes = labels.map((label: string, i: number) => {
           const angle = (i / labels.length) * Math.PI * 2;
           const radius = 150;
           return {
             id: `node-${i}`,
             label: label,
             x: Math.cos(angle) * radius,
             y: Math.sin(angle) * radius
           };
        });
        setNodes(newNodes);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    generateMap();
  }, [chapterTitle, points]);

  return (
    <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="w-full max-w-5xl h-[80vh] bg-[#0a0a0a] border border-white/5 rounded-[3rem] relative overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/40">
           <div className="flex items-center gap-4">
               <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                  <Brain size={24} className="animate-pulse" />
               </div>
               <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-widest leading-none mb-1">MIND MAP GENERATOR</h3>
                  <p className="text-[10px] text-cyan-400/60 font-medium uppercase tracking-[0.3em]">{chapterTitle}</p>
               </div>
           </div>
           <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"><X size={24} /></button>
        </div>

        {/* Workspace Area */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.05)_0%,transparent_100%)]">
            
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {isLoading ? (
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={48} className="text-cyan-400 animate-spin" />
                    <p className="text-xs font-black uppercase tracking-[0.4em] text-cyan-400 animate-pulse">Mapping Intelligence Nodes...</p>
                </div>
            ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                    
                    {/* Central Node */}
                    <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="w-40 h-40 rounded-full bg-white/5 border-2 border-cyan-400/40 flex items-center justify-center text-center p-4 z-20 shadow-[0_0_40px_rgba(34,211,238,0.2)]"
                    >
                        <span className="text-[10px] font-black uppercase text-white tracking-widest">{chapterTitle}</span>
                    </motion.div>

                    {/* Nodes and Links */}
                    {nodes.map((node, i) => (
                        <div key={node.id} className="absolute flex items-center justify-center">
                            {/* Connector Line */}
                            <motion.div 
                                initial={{ width: 0 }} animate={{ width: 170 }}
                                style={{ rotate: (i / nodes.length) * 360, transformOrigin: 'left' }}
                                className="h-[1px] bg-gradient-to-r from-cyan-400/50 to-transparent absolute left-0"
                            />
                            
                            {/* Concept Node */}
                            <motion.div 
                                initial={{ x: 0, opacity: 0 }} 
                                animate={{ x: node.x, y: node.y, opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(34,211,238,0.1)' }}
                                className="absolute w-32 p-3 bg-[#111] border border-cyan-400/20 rounded-xl text-center shadow-lg z-30 cursor-pointer"
                            >
                                <span className="text-[10px] text-cyan-400 font-black uppercase tracking-tighter leading-tight block">{node.label}</span>
                            </motion.div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Footer Area */}
        <div className="p-6 border-t border-white/5 flex justify-center gap-4 bg-black/40">
            <button className="flex items-center gap-2 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-all"><Share2 size={12} /> Export Image</button>
            <button className="flex items-center gap-2 px-6 py-2 bg-cyan-400 text-black rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl transition-all"><Zap size={12} /> Adaptive Revision</button>
        </div>

      </motion.div>
    </div>
  );
}
