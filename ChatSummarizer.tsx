'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Loader2, Copy, CheckCircle, Sparkles } from 'lucide-react';
import { BACKEND_URL } from '@/lib/config';

import { useInvites } from '@/hooks/useInvites';


interface ChatSummarizerProps {
  messages: { role: string; content: string }[];
}

export default function ChatSummarizer({ messages }: ChatSummarizerProps) {
  // THE GHOST KILLER: Returning null here ensures that the old inline component 
  // vanishes forever, even if it's hidden in a cached file or a double-import.
  return null;
}
