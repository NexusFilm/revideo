/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
'use client';

import { Player } from '@revideo/player-react';
import { useState } from 'react';
import { parseStream } from '../utils/parse';
import project from '@/revideo/project';

const TEMPLATES = [
  {
    id: 'trade-signal',
    name: 'Trade Signal Alert',
    emoji: '📈',
    vars: { coin: 'BTC', action: 'BUY', price: '$84,200', target: '$89,500', reason: 'Momentum + macro tailwind', timeWindow: '24–48h' },
  },
  {
    id: 'sell-signal',
    name: 'Take Profit Signal',
    emoji: '💰',
    vars: { coin: 'ETH', action: 'SELL', price: '$1,980', target: '$1,850', reason: 'Resistance hit — lock in gains', timeWindow: '12–24h' },
  },
  {
    id: 'xrp-signal',
    name: 'XRP Home Base',
    emoji: '🏠',
    vars: { coin: 'XRP', action: 'BUY', price: '$0.52', target: '$0.65', reason: 'Rotating profits into home base', timeWindow: '48–72h' },
  },
];

const COINS = ['BTC', 'ETH', 'XRP', 'SOL', 'LINK', 'BNB'];

export default function Home() {
  const [activeTemplate, setActiveTemplate] = useState(0);
  const [vars, setVars] = useState(TEMPLATES[0].vars);
  const [renderLoading, setRenderLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const loadTemplate = (idx: number) => {
    setActiveTemplate(idx);
    setVars(TEMPLATES[idx].vars);
    setDownloadUrl(null);
    setProgress(0);
  };

  const updateVar = (key: string, value: string) => {
    setVars(prev => ({ ...prev, [key]: value }));
    setDownloadUrl(null);
  };

  const render = async () => {
    setRenderLoading(true);
    setDownloadUrl(null);
    setProgress(0);
    const res = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variables: vars, streamProgress: true }),
    }).catch(() => null);

    if (!res) { alert('Render failed — make sure the render server is running.'); setRenderLoading(false); return; }
    const url = await parseStream(res.body!.getReader(), p => setProgress(p));
    setRenderLoading(false);
    setDownloadUrl(url);
  };

  return (
    <div className="min-h-screen bg-[#07080d] text-white font-['Inter',system-ui,sans-serif]">
      {/* Nav */}
      <nav className="flex items-center px-6 h-11 border-b border-[#1e2030] bg-[#0a0b12]">
        <div className="flex items-center gap-2 mr-6">
          <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="18" fill="#7c3aed" opacity="0.2"/>
            <path d="M10 13l6 10 6-10" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 13h8" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span className="font-bold text-sm text-white">Nexia Motion</span>
        </div>
        <div className="flex gap-1">
          {TEMPLATES.map((t, i) => (
            <button key={t.id} onClick={() => loadTemplate(i)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTemplate === i ? 'bg-[#7c3aed] text-white' : 'text-[#4a4a6a] hover:text-white'}`}>
              {t.emoji} {t.name}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <span className="text-xs text-[#4a4a6a]">Nexus Investment Group</span>
      </nav>

      <div className="flex h-[calc(100vh-44px)]">
        {/* Left panel */}
        <aside className="w-56 border-r border-[#1e2030] bg-[#0a0b12] flex flex-col overflow-y-auto">
          <div className="p-3 border-b border-[#1e2030]">
            <div className="text-[10px] font-bold text-[#4a4a6a] uppercase tracking-widest mb-3">Video Settings</div>

            <div className="space-y-3">
              {/* Coin */}
              <div>
                <div className="text-[10px] text-[#4a4a6a] mb-1">Coin</div>
                <select value={vars.coin} onChange={e => updateVar('coin', e.target.value)}
                  className="w-full bg-[#12141e] border border-[#1e2030] rounded-md px-2 py-1.5 text-xs text-white outline-none focus:border-[#7c3aed]">
                  {COINS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Action */}
              <div>
                <div className="text-[10px] text-[#4a4a6a] mb-1">Action</div>
                <div className="flex gap-1">
                  {['BUY', 'SELL'].map(a => (
                    <button key={a} onClick={() => updateVar('action', a)}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all border ${vars.action === a
                        ? a === 'BUY' ? 'bg-[#00d4a020] border-[#00d4a0] text-[#00d4a0]' : 'bg-[#ff456020] border-[#ff4560] text-[#ff4560]'
                        : 'border-[#1e2030] text-[#4a4a6a] hover:border-[#4a4a6a]'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entry Price */}
              <div>
                <div className="text-[10px] text-[#4a4a6a] mb-1">Entry Price</div>
                <input value={vars.price} onChange={e => updateVar('price', e.target.value)}
                  className="w-full bg-[#12141e] border border-[#1e2030] rounded-md px-2 py-1.5 text-xs text-white outline-none focus:border-[#7c3aed]" />
              </div>

              {/* Target */}
              <div>
                <div className="text-[10px] text-[#4a4a6a] mb-1">Target Price</div>
                <input value={vars.target} onChange={e => updateVar('target', e.target.value)}
                  className="w-full bg-[#12141e] border border-[#1e2030] rounded-md px-2 py-1.5 text-xs text-white outline-none focus:border-[#7c3aed]" />
              </div>

              {/* Time Window */}
              <div>
                <div className="text-[10px] text-[#4a4a6a] mb-1">Time Window</div>
                <input value={vars.timeWindow} onChange={e => updateVar('timeWindow', e.target.value)}
                  className="w-full bg-[#12141e] border border-[#1e2030] rounded-md px-2 py-1.5 text-xs text-white outline-none focus:border-[#7c3aed]" />
              </div>

              {/* Reason */}
              <div>
                <div className="text-[10px] text-[#4a4a6a] mb-1">Reason</div>
                <textarea value={vars.reason} onChange={e => updateVar('reason', e.target.value)} rows={2}
                  className="w-full bg-[#12141e] border border-[#1e2030] rounded-md px-2 py-1.5 text-xs text-white outline-none resize-none focus:border-[#7c3aed]" />
              </div>
            </div>
          </div>
        </aside>

        {/* Center: canvas */}
        <main className="flex-1 flex flex-col bg-[#06070a] overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-3xl rounded-lg overflow-hidden shadow-2xl border border-[#1e2030]">
              <Player
                project={project}
                controls={true}
                variables={vars}
              />
            </div>
          </div>

          {/* Render bar */}
          <div className="p-4 border-t border-[#1e2030] bg-[#0a0b12] flex items-center gap-3">
            {/* Progress */}
            <div className="flex-1 bg-[#12141e] rounded-md overflow-hidden h-8 border border-[#1e2030]">
              <div className="h-full flex items-center px-3 transition-all duration-200 text-xs text-[#4a4a6a]"
                style={{ width: `${Math.max(8, Math.round(progress * 100))}%`, background: progress > 0 ? '#7c3aed30' : 'transparent', color: progress > 0 ? '#a78bfa' : '#4a4a6a' }}>
                {progress > 0 ? `${Math.round(progress * 100)}%` : 'Ready to render'}
              </div>
            </div>

            {downloadUrl ? (
              <a href={downloadUrl} download
                className="px-4 py-2 rounded-md bg-[#00d4a0] text-black text-xs font-bold hover:bg-[#00b88a] transition-colors">
                ↓ Download MP4
              </a>
            ) : (
              <button onClick={render} disabled={renderLoading}
                className="px-4 py-2 rounded-md bg-[#f0b429] text-black text-xs font-bold hover:bg-[#d9a020] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {renderLoading && <span className="inline-block w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />}
                {renderLoading ? 'Rendering...' : '⬆ Export MP4'}
              </button>
            )}
          </div>
        </main>

        {/* Right: AI chat */}
        <aside className="w-72 border-l border-[#1e2030] bg-[#0a0b12] flex flex-col">
          <AiPanel vars={vars} onUpdateVar={updateVar} />
        </aside>
      </div>
    </div>
  );
}

function AiPanel({ vars, onUpdateVar: _onUpdateVar }: { vars: any; onUpdateVar: (k: string, v: string) => void }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "I'm your Nexia Motion AI. I can suggest trade signal content, adjust copy, or help you craft the perfect video. What would you like to change?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `You are the Nexia Motion AI for Nexus Investment Group. You help craft trade signal videos. Current variables: ${JSON.stringify(vars)}. Keep replies under 80 words and be actionable.` },
            ...next.map(m => ({ role: m.role, content: m.content }))
          ],
          max_tokens: 200,
        }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: 'assistant', content: data.choices?.[0]?.message?.content || 'Try again.' }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Connection error.' }]);
    }
    setLoading(false);
  };

  return (
    <>
      <div className="px-3 py-2 border-b border-[#1e2030]">
        <div className="text-xs font-bold text-white">AI Assistant</div>
        <div className="text-[10px] text-[#4a4a6a]">What changes should I make?</div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed ${m.role === 'user' ? 'bg-[#7c3aed] text-white rounded-br-sm' : 'bg-[#12141e] text-[#c0c0d8] border border-[#1e2030] rounded-bl-sm'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="flex gap-1 p-2">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] animate-pulse" style={{ animationDelay: `${i*150}ms` }} />)}</div>}
      </div>
      <div className="p-2 border-t border-[#1e2030] flex flex-wrap gap-1">
        {['Write a stronger reason', 'Suggest BTC target', 'Make it urgent'].map(q => (
          <button key={q} onClick={() => setInput(q)} className="px-2 py-1 rounded-full border border-[#1e2030] text-[10px] text-[#4a4a6a] hover:text-white hover:border-[#4a4a6a] transition-all">{q}</button>
        ))}
      </div>
      <div className="p-2 border-t border-[#1e2030]">
        <div className="flex gap-2 bg-[#12141e] border border-[#1e2030] rounded-lg px-2 py-1.5 items-end">
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }}}
            placeholder="Describe changes..." rows={1}
            className="flex-1 bg-transparent text-xs text-white outline-none resize-none leading-relaxed" />
          <button onClick={send} disabled={!input.trim() || loading}
            className="w-6 h-6 bg-[#7c3aed] rounded-md flex items-center justify-center disabled:opacity-30 shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
    </>
  );
}
