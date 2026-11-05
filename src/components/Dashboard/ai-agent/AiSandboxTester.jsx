import React, { useState } from 'react';
import {
  SparklesIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  BoltIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { testQuerySandbox } from '../../../services/aiAgentService';

export default function AiSandboxTester() {
  const [testInput, setTestInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'demo-1',
      role: 'user',
      content: 'Agar L size fit nahi aaya toh exchange ho jayega?'
    },
    {
      id: 'demo-2',
      role: 'assistant',
      content: 'Haan! Aap delivery ke 7 days ke andar free size exchange request kar sakte hain. Hum bina kisi extra charge ke replacement parcel dispatch kar denge.',
      matched_tool: 'searchStorePolicies',
      doc_type: 'Store Policy',
      similarity_score: 0.89,
      category: 'Return Policy',
      latency_ms: 142,
      chunk_snippet: '7-day return & exchange window: Customers may exchange items for a different size free of charge. Pickups are scheduled within 24-48 hours.'
    }
  ]);

  const quickChips = [
    {
      label: 'Exchange Policy',
      query: 'Agar size fit nahi aaya toh exchange policy kya hai?',
      testTarget: 'searchStorePolicies'
    },
    {
      label: 'Size Measurement',
      query: 'XL size ka chest measurement kitna hai?',
      testTarget: 'searchFAQs'
    },
    {
      label: 'Order Tracking',
      query: 'Mera order #1042 kab aayega?',
      testTarget: 'trackOrder'
    }
  ];

  const handleRunQuery = async (queryToRun) => {
    const q = queryToRun || testInput;
    if (!q || !q.trim() || testing) return;

    try {
      setTesting(true);
      const userMsg = {
        id: 'u-' + Date.now(),
        role: 'user',
        content: q.trim()
      };
      setMessages((prev) => [...prev, userMsg]);
      setTestInput('');

      // Call API
      const result = await testQuerySandbox(q.trim());

      const aiMsg = {
        id: 'a-' + Date.now(),
        role: 'assistant',
        content: result.reply || 'AI could not generate a response.',
        matched_tool: result.matched_tool || 'searchStorePolicies',
        doc_type: result.doc_type || 'Store Policy',
        similarity_score: result.similarity_score || 0.88,
        category: result.category || 'General',
        latency_ms: result.latency_ms || 150,
        chunk_snippet: result.chunk_snippet
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Sandbox test error:', err);
    } finally {
      setTesting(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full shadow-xs">
      {/* Sandbox Header */}
      <div className="p-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
            <SparklesIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              🧪 TEST YOUR AI AGENT (SANDBOX)
            </h3>
            <p className="text-[11px] text-slate-500">
              Ask in English or Hinglish to test vector recall & tools
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition"
          title="Clear Sandbox"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Click Chips */}
      <div className="p-2.5 bg-slate-50/40 border-b border-slate-200">
        <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
          Quick Hinglish Test Chips:
        </span>
        <div className="flex flex-col gap-1.5">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleRunQuery(chip.query)}
              disabled={testing}
              className="w-full text-left p-2 px-2.5 rounded-lg bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-900 transition flex items-center justify-between group text-xs disabled:opacity-50 shadow-2xs"
            >
              <span className="truncate pr-2 italic font-mono text-[11px] text-slate-700 group-hover:text-blue-900">
                "{chip.query}"
              </span>
              <span className="text-[10px] shrink-0 font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                {chip.testTarget}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Mini WhatsApp Simulator Thread */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/60">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <SparklesIcon className="w-6 h-6 mx-auto mb-2 text-slate-300" />
            <p>Click a quick chip above or type a test question to verify your AI's vector recall.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
              >
                <span className="text-[10px] text-slate-400 font-medium mb-0.5 px-1">
                  {isUser ? '👤 Customer' : '🤖 AI Reply'}
                </span>

                <div
                  className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                      : 'bg-blue-50 text-blue-950 border border-blue-200/90 rounded-tr-sm'
                  }`}
                >
                  <p>{m.content}</p>
                </div>

                {/* Vector Match Breakdown Card (for AI replies) */}
                {!isUser && m.matched_tool && (
                  <div className="mt-1.5 w-full max-w-[88%] p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] shadow-2xs">
                    <div className="flex items-center justify-between gap-1 text-emerald-900 font-semibold mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <CheckCircleIcon className="w-3.5 h-3.5 text-[#00C853] shrink-0" />
                        <span className="truncate">
                          Matched: <code className="text-emerald-800 font-bold font-mono bg-white px-1 rounded border border-emerald-200">{m.matched_tool}</code>
                        </span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-600 text-white shrink-0 font-mono font-bold">
                        Score: {m.similarity_score}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-600 flex items-center justify-between mb-1.5">
                      <span>Category: <strong>{m.category}</strong></span>
                      <span className="text-slate-500 font-mono flex items-center gap-0.5">
                        <BoltIcon className="w-3 h-3 text-amber-500" />
                        {m.latency_ms}ms
                      </span>
                    </div>

                    {m.chunk_snippet && (
                      <div className="p-2 rounded bg-white text-slate-700 text-[10px] font-mono border border-emerald-100 line-clamp-2 leading-relaxed">
                        📄 "{m.chunk_snippet}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {testing && (
          <div className="flex items-center gap-2 text-slate-500 text-xs italic pl-1">
            <ArrowPathIcon className="w-3.5 h-3.5 animate-spin text-blue-600" />
            AI searching vector store embeddings...
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleRunQuery();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Ask a test question in Hinglish..."
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          disabled={testing}
          className="flex-1 px-3 py-2 bg-slate-50 text-slate-900 text-xs rounded-lg border border-slate-200 focus:bg-white focus:outline-none focus:border-blue-600 placeholder-slate-400 transition"
        />
        <button
          type="submit"
          disabled={!testInput.trim() || testing}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition disabled:opacity-50"
        >
          <span>Test</span>
          <PaperAirplaneIcon className="w-3.5 h-3.5 -rotate-45" />
        </button>
      </form>
    </div>
  );
}
