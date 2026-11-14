import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Sparkles,
  Send,
  X,
  Key,
  Bot,
  User,
  Shield,
  Zap,
  RotateCcw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
}

export const AICopilotDrawer: React.FC = () => {
  const { isAiOpen, setIsAiOpen, groqApiKey, setGroqApiKey, hotspots, sensors } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I am WaveGuard KGF AI, powered by Groq Llama-3. I analyze real-time topography, D8 flow pathways, sensor stages, and road safety across Kolar Gold Fields. How can I assist you?',
      provider: 'Groq Cloud Llama-3.3'
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [tempKey, setTempKey] = useState<string>(groqApiKey);
  const [showKeyInput, setShowKeyInput] = useState<boolean>(!groqApiKey);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAiOpen) {
      scrollToBottom();
    }
  }, [messages, isAiOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: text }
    ];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const apiMsgs = newMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await api.sendAIChat(apiMsgs, groqApiKey);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          provider: res.provider || (res.error ? 'Error' : 'Groq AI')
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error contacting AI service: ${err.message || 'Please check backend connection.'}`,
          provider: 'System Error'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = () => {
    setGroqApiKey(tempKey);
    setShowKeyInput(false);
  };

  if (!isAiOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] h-[580px] bg-navy-900/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-[0_0_35px_rgba(0,242,254,0.2)] flex flex-col overflow-hidden text-xs text-slate-100 font-sans">
      {/* Top Header */}
      <div className="bg-navy-950 px-4 py-3 border-b border-navy-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-glow">
            <Bot className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="font-mono font-bold text-white flex items-center space-x-1.5">
              <span>WAVEGUARD AI</span>
              <span className="text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.2 rounded">
                GROQ
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Llama-3.3-70B &bull; Ultra-Fast Geospatial Copilot
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800"
            title="Configure Groq API Key"
          >
            <Key className={`w-3.5 h-3.5 ${groqApiKey ? 'text-emerald-400' : 'text-amber-400 animate-bounce'}`} />
          </button>
          <button
            onClick={() => setIsAiOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Groq API Key Configuration Dropdown */}
      {showKeyInput && (
        <div className="bg-navy-950 border-b border-navy-800 p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono font-semibold text-cyan-400">Enter Free Groq API Key:</span>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-cyan-400 hover:underline flex items-center space-x-1"
            >
              <span>Get Free Key</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <div className="flex space-x-2">
            <input
              type="password"
              placeholder="gsk_..."
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              className="flex-1 bg-navy-900 border border-navy-700 rounded px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleSaveKey}
              className="px-3 py-1 rounded bg-cyan-500/20 text-cyan-glow border border-cyan-500/40 font-mono font-bold hover:bg-cyan-500/30 text-xs"
            >
              Save
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            Groq provides a 100% free tier with lightning fast Llama-3 inference. Saved locally in your browser.
          </p>
        </div>
      )}

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`p-3 rounded-xl max-w-[85%] text-xs leading-relaxed space-y-1 ${
                m.role === 'user'
                  ? 'bg-cyan-500/20 text-white border border-cyan-500/40 rounded-tr-none'
                  : 'bg-navy-950 text-slate-200 border border-navy-800 rounded-tl-none shadow-md'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.provider && (
                <div className="text-[9px] font-mono text-slate-500 text-right pt-0.5">
                  {m.provider}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-2 p-3 bg-navy-950 rounded-xl max-w-[70%] border border-navy-800 text-slate-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>Groq Llama-3 synthesizing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Pill Buttons */}
      <div className="px-3 py-1.5 bg-navy-950/80 border-t border-navy-800 flex items-center space-x-1.5 overflow-x-auto select-none">
        {[
          'Champion Reefs risk?',
          'Swarna Nallah status?',
          'Safe route to Andersonpet?',
          'Generate public advisory'
        ].map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-navy-800 hover:bg-navy-750 text-cyan-300 border border-navy-700 text-[10px] font-mono transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-navy-950 border-t border-navy-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="Ask Groq AI about KGF terrain, floods, sensors..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 font-sans"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-glow border border-cyan-500/40 glow-cyan transition disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
