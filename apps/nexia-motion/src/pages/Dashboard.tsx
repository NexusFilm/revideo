
import { useState, useRef, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface Props { session: Session; }

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  ts: Date;
}

const SYSTEM_PROMPT = `You are the Nexia Motion AI assistant — a creative director and motion design expert for the Nexia Motion video creation studio.

Your job is to help users create, edit, and enhance motion graphics videos. You can:
- Help design trade signal videos, brand intros, social clips, and YouTube content
- Suggest animations, color palettes, typography, and timing
- Write scripts and copy for video content
- Guide users through the Revideo animation system
- Help with Nexus Investment Group trade signal video creation

Be concise, creative, and actionable. Keep responses focused on video/motion design and content creation within this studio. If asked about trading signals specifically, reference the Nexus Investment Group trade signal template.`;

export default function Dashboard({ session }: Props) {
  const user = session.user;
  const name = (user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator') as string;
  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const firstName = name.split(' ')[0];

  const [tab, setTab] = useState<'chat' | 'projects' | 'templates'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      content: `Hey ${firstName}! I'm your Nexia Motion AI assistant. I can help you create trade signal videos, brand intros, social clips, and more.\n\nWhat would you like to build today?`,
      ts: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const userMsg: Message = { id: Date.now(), role: 'user', content: text, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build messages array for OpenAI
      const history = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('https://dede-68e21946.base44.app/functions/nexiaAI', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      const reply = data.reply || 'Sorry, I had trouble with that. Try again.';
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: reply, ts: new Date() }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        ts: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now(), role: 'assistant',
      content: `New conversation started. What would you like to create, ${firstName}?`,
      ts: new Date(),
    }]);
  };

  return (
    <div style={s.root}>
      {/* ── Nav ── */}
      <nav style={s.nav}>
        <div style={s.navLeft}>
          <button style={s.menuBtn} onClick={() => setSidebarOpen(o => !o)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div style={s.brand}>
            <svg width="26" height="26" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="18" fill="#7c3aed" opacity="0.2"/>
              <path d="M10 13l6 10 6-10" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 13h8" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span style={s.brandName}>Nexia Motion</span>
          </div>
        </div>
        <div style={s.navTabs}>
          {(['chat','projects','templates'] as const).map(t => (
            <button key={t} style={{...s.navTab, ...(tab===t ? s.navTabActive : {})}} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div style={s.navRight}>
          {avatar && <img src={avatar} alt="" style={s.avatar}/>}
          <span style={s.userName}>{name}</span>
          <button style={{...s.signOutBtn, opacity: signingOut ? 0.5 : 1}}
            onClick={() => { setSigningOut(true); supabase.auth.signOut(); }} disabled={signingOut}>
            Sign out
          </button>
        </div>
      </nav>

      {/* ── Body ── */}
      <div style={s.body}>
        {/* Sidebar */}
        {sidebarOpen && (
          <aside style={s.sidebar}>
            <div style={s.sidebarSection}>
              <div style={s.sidebarLabel}>QUICK ACTIONS</div>
              {QUICK_ACTIONS.map(a => (
                <button key={a.label} style={s.quickBtn} onClick={() => { setInput(a.prompt); setTab('chat'); setTimeout(() => inputRef.current?.focus(), 50); }}>
                  <span style={s.quickEmoji}>{a.emoji}</span>
                  <span style={s.quickLabel}>{a.label}</span>
                </button>
              ))}
            </div>
            <div style={s.sidebarSection}>
              <div style={s.sidebarLabel}>TEMPLATES</div>
              {TEMPLATES.map(t => (
                <button key={t.name} style={s.quickBtn} onClick={() => { setInput(`Create a ${t.name} video for me`); setTab('chat'); setTimeout(() => inputRef.current?.focus(), 50); }}>
                  <span style={s.quickEmoji}>{t.emoji}</span>
                  <span style={s.quickLabel}>{t.name}</span>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Main content */}
        <main style={s.main}>
          {tab === 'chat' && (
            <div style={s.chatWrap}>
              {/* Chat header */}
              <div style={s.chatHeader}>
                <div>
                  <div style={s.chatTitle}>AI Assistant</div>
                  <div style={s.chatSub}>Ask me anything about your video project</div>
                </div>
                <button style={s.clearBtn} onClick={clearChat}>New chat</button>
              </div>

              {/* Messages */}
              <div style={s.messages}>
                {messages.map(m => (
                  <div key={m.id} style={{...s.msgRow, justifyContent: m.role==='user' ? 'flex-end' : 'flex-start'}}>
                    {m.role === 'assistant' && (
                      <div style={s.aiBadge}>
                        <svg width="14" height="14" viewBox="0 0 36 36" fill="none">
                          <path d="M10 13l6 10 6-10" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 13h8" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                    )}
                    <div style={{
                      ...s.bubble,
                      ...(m.role==='user' ? s.bubbleUser : s.bubbleAI),
                    }}>
                      {m.content.split('\n').map((line, i) => (
                        <span key={i}>{line}{i < m.content.split('\n').length - 1 && <br/>}</span>
                      ))}
                      <div style={s.ts}>{m.ts.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{...s.msgRow, justifyContent:'flex-start'}}>
                    <div style={s.aiBadge}>
                      <svg width="14" height="14" viewBox="0 0 36 36" fill="none">
                        <path d="M10 13l6 10 6-10" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 13h8" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div style={{...s.bubble, ...s.bubbleAI}}>
                      <div style={s.typing}>
                        <span style={{...s.dot, animationDelay:'0ms'}}/>
                        <span style={{...s.dot, animationDelay:'160ms'}}/>
                        <span style={{...s.dot, animationDelay:'320ms'}}/>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef}/>
              </div>

              {/* Input */}
              <div style={s.inputRow}>
                <textarea
                  ref={inputRef}
                  style={s.input}
                  placeholder="Ask me to create a video, suggest animations, write a script..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                  disabled={loading}
                />
                <button style={{...s.sendBtn, opacity: (!input.trim() || loading) ? 0.4 : 1}}
                  onClick={sendMessage} disabled={!input.trim() || loading}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
              <style>{`
                @keyframes bounce {0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
                @keyframes spin{to{transform:rotate(360deg)}}
              `}</style>
            </div>
          )}

          {tab === 'projects' && (
            <div style={s.tabContent}>
              <h2 style={s.tabTitle}>Your Projects</h2>
              <div style={s.emptyState}>
                <div style={s.emptyIcon}>🎬</div>
                <p style={s.emptyText}>No projects yet</p>
                <p style={s.emptySub}>Ask the AI assistant to create your first video</p>
                <button style={s.ctaBtn} onClick={() => setTab('chat')}>Open AI Chat →</button>
              </div>
            </div>
          )}

          {tab === 'templates' && (
            <div style={s.tabContent}>
              <h2 style={s.tabTitle}>Templates</h2>
              <div style={s.templateGrid}>
                {TEMPLATES.map(t => (
                  <div key={t.name} style={s.templateCard} onClick={() => { setInput(`Create a ${t.name} video for me`); setTab('chat'); }}>
                    <div style={{...s.templateThumb, background: t.color}}>
                      <span style={s.templateEmoji}>{t.emoji}</span>
                    </div>
                    <div style={s.templateBody}>
                      <div style={s.templateName}>{t.name}</div>
                      <div style={s.templateMeta}>{t.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const QUICK_ACTIONS = [
  { emoji:'📈', label:'Trade Signal Video', prompt:'Create a BUY trade signal video for BTC at $84,000. Reason: breaking key resistance with strong volume.' },
  { emoji:'✨', label:'Brand Intro', prompt:'Design a 5-second Nexus Investment Group brand intro with gold and purple colors.' },
  { emoji:'📊', label:'Portfolio Update', prompt:'Create a 15-second portfolio performance video showing 12% gains this week.' },
  { emoji:'🎯', label:'YouTube Thumbnail', prompt:'Help me design a YouTube thumbnail for a video called "I Let AI Trade Crypto For Me".' },
];

const TEMPLATES = [
  { name:'Trade Signal Alert', emoji:'📈', desc:'15s · Finance', color:'linear-gradient(135deg,#0f2027,#2c5364)' },
  { name:'Brand Intro', emoji:'✨', desc:'5s · Branding', color:'linear-gradient(135deg,#1a0533,#3b0764)' },
  { name:'Social Clip', emoji:'🎬', desc:'30s · Social', color:'linear-gradient(135deg,#0d1117,#161b22)' },
  { name:'Portfolio Review', emoji:'💼', desc:'60s · Finance', color:'linear-gradient(135deg,#0a1628,#0d2444)' },
  { name:'YouTube Intro', emoji:'🎯', desc:'10s · YouTube', color:'linear-gradient(135deg,#1a0000,#3d0000)' },
];

const s: Record<string, React.CSSProperties> = {
  root: { height:'100vh', display:'flex', flexDirection:'column', background:'#0a0a0f', overflow:'hidden' },
  nav: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px',
    height:56, background:'#0d0d14', borderBottom:'1px solid #1a1a2e', flexShrink:0, zIndex:10 },
  navLeft: { display:'flex', alignItems:'center', gap:12, minWidth:200 },
  menuBtn: { background:'none', border:'none', color:'#6b7280', cursor:'pointer', padding:6, borderRadius:6, display:'flex' },
  brand: { display:'flex', alignItems:'center', gap:8 },
  brandName: { fontSize:16, fontWeight:700, color:'#a78bfa' },
  navTabs: { display:'flex', gap:4 },
  navTab: { padding:'6px 16px', background:'none', border:'none', color:'#6b7280',
    fontSize:13, fontWeight:500, cursor:'pointer', borderRadius:6, transition:'all 0.15s' },
  navTabActive: { background:'#1a1a2e', color:'#a78bfa' },
  navRight: { display:'flex', alignItems:'center', gap:10, minWidth:200, justifyContent:'flex-end' },
  avatar: { width:28, height:28, borderRadius:'50%', border:'2px solid #4c1d95' },
  userName: { fontSize:13, color:'#6b7280', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  signOutBtn: { padding:'5px 12px', background:'transparent', color:'#4b5563',
    border:'1px solid #1f2937', borderRadius:6, cursor:'pointer', fontSize:12 },
  body: { display:'flex', flex:1, overflow:'hidden' },
  sidebar: { width:220, background:'#0d0d14', borderRight:'1px solid #1a1a2e',
    display:'flex', flexDirection:'column', overflow:'auto', flexShrink:0 },
  sidebarSection: { padding:'16px 12px 8px' },
  sidebarLabel: { fontSize:10, fontWeight:700, color:'#374151', letterSpacing:1.5, marginBottom:8, padding:'0 8px' },
  quickBtn: { display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 10px',
    background:'none', border:'none', color:'#9ca3af', cursor:'pointer', borderRadius:8,
    fontSize:13, textAlign:'left', transition:'all 0.15s' },
  quickEmoji: { fontSize:16, flexShrink:0 },
  quickLabel: { fontSize:13, lineHeight:1.2 },
  main: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  chatWrap: { flex:1, display:'flex', flexDirection:'column', height:'100%' },
  chatHeader: { display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'16px 24px', borderBottom:'1px solid #1a1a2e', flexShrink:0 },
  chatTitle: { fontSize:16, fontWeight:700, color:'#f9fafb' },
  chatSub: { fontSize:12, color:'#4b5563', marginTop:2 },
  clearBtn: { padding:'6px 14px', background:'transparent', color:'#6b7280',
    border:'1px solid #1f2937', borderRadius:6, cursor:'pointer', fontSize:12 },
  messages: { flex:1, overflow:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 },
  msgRow: { display:'flex', alignItems:'flex-end', gap:8 },
  aiBadge: { width:28, height:28, background:'#1a1a2e', borderRadius:'50%',
    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  bubble: { maxWidth:'72%', padding:'12px 16px', borderRadius:16, fontSize:14, lineHeight:1.6,
    position:'relative', wordBreak:'break-word' },
  bubbleAI: { background:'#111827', color:'#e5e7eb', borderBottomLeftRadius:4,
    border:'1px solid #1f2937' },
  bubbleUser: { background:'#4c1d95', color:'#fff', borderBottomRightRadius:4 },
  ts: { fontSize:10, color:'#4b5563', marginTop:6, textAlign:'right' },
  typing: { display:'flex', gap:4, alignItems:'center', height:20 },
  dot: { width:6, height:6, background:'#6b7280', borderRadius:'50%',
    animation:'bounce 1.2s infinite', display:'inline-block' },
  inputRow: { display:'flex', alignItems:'flex-end', gap:8, padding:'12px 24px 20px',
    borderTop:'1px solid #1a1a2e', flexShrink:0 },
  input: { flex:1, background:'#111827', border:'1px solid #1f2937', borderRadius:12,
    color:'#f9fafb', fontSize:14, padding:'12px 16px', resize:'none', outline:'none',
    fontFamily:'inherit', lineHeight:1.5, maxHeight:120, overflow:'auto' },
  sendBtn: { width:44, height:44, background:'#7c3aed', border:'none', borderRadius:10,
    color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
    flexShrink:0, transition:'opacity 0.15s' },
  tabContent: { flex:1, padding:'32px 32px', overflow:'auto' },
  tabTitle: { fontSize:22, fontWeight:700, color:'#f9fafb', marginBottom:24 },
  emptyState: { display:'flex', flexDirection:'column', alignItems:'center',
    justifyContent:'center', height:360, gap:12 },
  emptyIcon: { fontSize:48, marginBottom:8 },
  emptyText: { fontSize:18, fontWeight:600, color:'#f9fafb' },
  emptySub: { fontSize:14, color:'#6b7280' },
  ctaBtn: { marginTop:8, padding:'12px 24px', background:'#7c3aed', color:'#fff',
    border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer' },
  templateGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16 },
  templateCard: { background:'#111827', borderRadius:12, overflow:'hidden',
    border:'1px solid #1f2937', cursor:'pointer' },
  templateThumb: { height:110, display:'flex', alignItems:'center', justifyContent:'center' },
  templateEmoji: { fontSize:36 },
  templateBody: { padding:'14px 16px' },
  templateName: { fontSize:14, fontWeight:600, color:'#f9fafb', marginBottom:4 },
  templateMeta: { fontSize:12, color:'#6b7280' },
};
