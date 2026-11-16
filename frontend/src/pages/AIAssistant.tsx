import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { AIChatMessage } from '../types';
import {
  Bot,
  Send,
  Sparkles,
  User,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Cpu
} from 'lucide-react';

export const AIAssistant: React.FC = () => {
  const { dashboardData } = useApp();
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am WaveGuard Copilot, your urban flood intelligence assistant for Bengaluru.\n\nI have access to live database telemetry across monitored underpasses, flood classifications, and safe detour corridors. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString(),
      provider: 'waveguard_ai',
      model: 'grounded_engine',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      // Build conversation history format
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
        error_note: res.error_note,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: AIChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Error contacting AI service: ${err.message}. Please check that the WaveGuard backend is running.`,
        timestamp: new Date().toLocaleTimeString(),
        provider: 'error_handler',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const promptChips = [
    'Which locations in Bengaluru are currently blocked?',
    'Show me locations under caution.',
    'Give me a summary of current waterlogging telemetry.',
    'How does the Dijkstra safe route calculation work?',
    'Explain the WaveGuard system architecture.',
  ];

  return (
    <div className="h-full flex flex-col bg-slate-50 p-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">WaveGuard AI Copilot</h1>
              <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-300">
                Data-Grounded
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Grounded in live SQLite telemetry, road graph topography, and BBMP underpass limits.
            </p>
          </div>
        </div>

        <button
          onClick={() => setMessages(messages.slice(0, 1))}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1 border border-slate-200 bg-white px-2.5 py-1.5 rounded-lg shadow-sm self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Session History</span>
        </button>
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-xl p-4 shadow-sm text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-none'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              <div
                className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] ${
                  msg.sender === 'user'
                    ? 'border-slate-800 text-slate-400'
                    : 'border-slate-100 text-slate-400'
                }`}
              >
                <span>{msg.timestamp}</span>
                {msg.provider && (
                  <span className="font-mono">
                    Provider: {msg.provider} ({msg.model || 'grounded'})
                  </span>
                )}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs text-slate-500 flex items-center space-x-2">
              <Cpu className="w-4 h-4 animate-spin text-cyan-600" />
              <span>Querying database telemetry and synthesizing grounded response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="shrink-0 pt-2 pb-2">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold text-slate-500 shrink-0">Quick Queries:</span>
          {promptChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-slate-700 whitespace-nowrap shadow-sm text-[11px] transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="shrink-0 pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2 bg-white border border-slate-300 rounded-xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-cyan-500"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about Bengaluru underpass water levels, road closures, or system logic..."
            className="flex-1 px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white font-bold p-2 rounded-lg transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
