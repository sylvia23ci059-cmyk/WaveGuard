import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { AIChatMessage } from '../../types';
import {
  Bot,
  Send,
  X,
  Cpu,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export const AICopilotDrawer: React.FC = () => {
  const { isCopilotOpen, setIsCopilotOpen } = useApp();
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'drawer-welcome',
      sender: 'assistant',
      text: 'WaveGuard Copilot active. Ask me about current underpass water levels, road closures, or safe detours across Bengaluru.',
      timestamp: new Date().toLocaleTimeString(),
      provider: 'waveguard_ai',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isCopilotOpen]);

  if (!isCopilotOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setIsLoading(true);

    try {
      const history = messages.slice(-4).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await api.sendAIChat(textToSend, history);

      const aiMsg: AIChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: res.response,
        timestamp: new Date().toLocaleTimeString(),
        provider: res.provider,
        model: res.model,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errItem: AIChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Error connecting to AI service: ${err.message}`,
        timestamp: new Date().toLocaleTimeString(),
        provider: 'error',
      };
      setMessages((prev) => [...prev, errItem]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed top-16 right-0 bottom-0 w-96 bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="font-bold text-sm">WaveGuard Copilot</h3>
            <p className="text-[10px] text-slate-300">Grounding via SQLite Telemetry</p>
          </div>
        </div>
        <button
          onClick={() => setIsCopilotOpen(false)}
          className="text-slate-400 hover:text-white p-1 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-slate-900 text-white rounded-br-none'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
            </div>
            <span className="text-[9px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200">
            <Cpu className="w-4 h-4 animate-spin text-cyan-600" />
            <span>Consulting database telemetry...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prompt suggestions */}
      <div className="p-2 border-t border-slate-100 bg-white flex space-x-1 overflow-x-auto text-[10px]">
        <button
          onClick={() => handleSend('Which locations are blocked?')}
          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 whitespace-nowrap"
        >
          Blocked Sites
        </button>
        <button
          onClick={() => handleSend('Show caution locations')}
          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 whitespace-nowrap"
        >
          Caution Sites
        </button>
        <button
          onClick={() => handleSend('Summarize telemetry')}
          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 whitespace-nowrap"
        >
          Telemetry Summary
        </button>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white p-2 rounded-lg transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
