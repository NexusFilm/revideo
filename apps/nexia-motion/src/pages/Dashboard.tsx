import { useState, useRef, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface Props { session: Session; }

// ─── Types ─────────────────────────────────────────────────────────────────────
interface AiMessage { id: number; role: 'user' | 'assistant'; content: string; ts: Date; }
interface Layer { id: string; name: string; type: 'rect' | 'text' | 'circle' | 'image' | 'video'; visible: boolean; locked: boolean; color: string; }
interface ProjectSettings { width: number; height: number; fps: number; duration: number; bg: string; }

const TEMPLATES: Record<string, { name: string; emoji: string; settings: ProjectSettings; layers: Layer[] }> = {
  'trade-signal': {
    name: 'Trade Signal Alert', emoji: '📈',
    settings: { width: 1920, height: 1080, fps: 60, duration: 10, bg: '#0a0a14' },
    layers: [
      { id: '1', name: 'Background Gradient', type: 'rect', visible: true, locked: false, color: '#7c3aed' },
      { id: '2', name: 'Nexus Logo', type: 'image', visible: true, locked: false, color: '#f0b429' },
      { id: '3', name: 'Signal Title', type: 'text', visible: true, locked: false, color: '#ffffff' },
      { id: '4', name: 'Coin Symbol', type: 'text', visible: true, locked: false, color: '#00d4a0' },
      { id: '5', name: 'Price Bar', type: 'rect', visible: true, locked: false, color: '#00d4a0' },
      { id: '6', name: 'Action Badge', type: 'rect', visible: true, locked: false, color: '#f0b429' },
    ],
  },
  'brand-intro': {
    name: 'Brand Intro', emoji: '✨',
    settings: { width: 1920, height: 1080, fps: 60, duration: 5, bg: '#07080a' },
    layers: [
      { id: '1', name: 'Background', type: 'rect', visible: true, locked: false, color: '#0a0014' },
      { id: '2', name: 'Logo Ring', type: 'circle', visible: true, locked: false, color: '#7c3aed' },
      { id: '3', name: 'Brand Name', type: 'text', visible: true, locked: false, color: '#ffffff' },
      { id: '4', name: 'Tagline', type: 'text', visible: true, locked: false, color: '#a78bfa' },
    ],
  },
  'social-clip': {
    name: 'Social Clip', emoji: '📱',
    settings: { width: 1080, height: 1920, fps: 30, duration: 15, bg: '#000000' },
    layers: [
      { id: '1', name: 'Background', type: 'rect', visible: true, locked: false, color: '#111' },
      { id: '2', name: 'Hook Text', type: 'text', visible: true, locked: false, color: '#ffffff' },
      { id: '3', name: 'Chart Visual', type: 'rect', visible: true, locked: false, color: '#00d4a0' },
      { id: '4', name: 'CTA Button', type: 'rect', visible: true, locked: false, color: '#7c3aed' },
    ],
  },
  'youtube-thumb': {
    name: 'YouTube Thumbnail', emoji: '🎬',
    settings: { width: 1280, height: 720, fps: 1, duration: 1, bg: '#0d0d1a' },
    layers: [
      { id: '1', name: 'BG Gradient', type: 'rect', visible: true, locked: false, color: '#1a0033' },
      { id: '2', name: 'Main Image', type: 'image', visible: true, locked: false, color: '#555' },
      { id: '3', name: 'Title Text', type: 'text', visible: true, locked: false, color: '#ffffff' },
      { id: '4', name: 'Accent Bar', type: 'rect', visible: true, locked: false, color: '#f0b429' },
    ],
  },
};

const ANIM_COLORS = ['#7c3aed','#a78bfa','#00d4a0','#f0b429','#4dabf7','#ff4560','#7c3aed','#a78bfa'];

export default function Dashboard({ session }: Props) {
  const user = session.user;
  const name = (user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator') as string;
  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const firstName = name.split(' ')[0];

  // Studio state
  const [activeTemplate, setActiveTemplate] = useState('trade-signal');
  const [settings, setSettings] = useState<ProjectSettings>(TEMPLATES['trade-signal'].settings);
  const [layers, setLayers] = useState<Layer[]>(TEMPLATES['trade-signal'].layers);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [leftTab, setLeftTab] = useState<'project' | 'elements' | 'animations'>('project');
  const [rightOpen, setRightOpen] = useState(true);

  // AI state
  const [messages, setMessages] = useState<AiMessage[]>([{
    id: 0, role: 'assistant', ts: new Date(),
    content: `Hey ${firstName}! I'm your Nexia Motion AI. Select a template or describe what you want to create.`,
  }]);
  const [input, setInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Playhead animation
  useEffect(() => {
    if (playing) {
      playRef.current = setInterval(() => {
        setPlayhead(t => {
          if (t >= settings.duration) { setPlaying(false); return 0; }
          return t + 0.1;
        });
      }, 100);
    } else {
      if (playRef.current) clearInterval(playRef.current);
    }
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [playing, settings.duration]);

  const loadTemplate = (key: string) => {
    const t = TEMPLATES[key];
    if (!t) return;
    setActiveTemplate(key);
    setSettings(t.settings);
    setLayers(t.layers);
    setSelectedLayer(null);
    setPlayhead(0);
    setPlaying(false);
    setMessages(prev => [...prev, {
      id: Date.now(), role: 'assistant', ts: new Date(),
      content: `Loaded "${t.name}" template. ${t.layers.length} layers ready. What changes would you like to make?`,
    }]);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || aiLoading) return;
    setInput('');
    const userMsg: AiMessage = { id: Date.now(), role: 'user', content: text, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setAiLoading(true);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const systemCtx = `Current project: ${TEMPLATES[activeTemplate]?.name || activeTemplate}, ${settings.width}x${settings.height}, ${settings.duration}s. Layers: ${layers.map(l => l.name).join(', ')}.`;
      
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `You are the Nexia Motion AI creative director. Help users design motion graphics videos for Nexus Investment Group. Be concise and actionable (under 120 words). Current project context: ${systemCtx}` },
            ...history,
          ],
          max_tokens: 400, temperature: 0.7,
        }),
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || 'Try again.';
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: reply, ts: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: "Connection error. Please try again.", ts: new Date() }]);
    } finally {
      setAiLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const toggleLayer = (id: string) => setLayers(ls => ls.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  const lockLayer = (id: string) => setLayers(ls => ls.map(l => l.id === id ? { ...l, locked: !l.locked } : l));

  const timelinePct = settings.duration > 0 ? (playhead / settings.duration) * 100 : 0;

  const C = {
    bg: '#0a0b0f', sidebar: '#0e0f15', panel: '#12141c', border: '#1e2030',
    text: '#e0e0e8', muted: '#4a4a5a', accent: '#7c3aed', gold: '#f0b429',
    green: '#00d4a0', surface: '#181a24', hover: '#1e2030',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.bg, fontFamily: "'Inter', system-ui, sans-serif", color: C.text, overflow: 'hidden' }}>

      {/* ── Top Nav ── */}
      <nav style={{ display: 'flex', alignItems: 'center', height: '44px', borderBottom: `1px solid ${C.border}`, background: C.sidebar, padding: '0 12px', gap: '8px', flexShrink: 0, zIndex: 10 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
          <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="18" fill="#7c3aed" opacity="0.2"/>
            <path d="M10 13l6 10 6-10" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 13h8" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>Nexia Motion</span>
        </div>

        {/* Template picker */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {Object.entries(TEMPLATES).map(([key, t]) => (
            <button key={key} onClick={() => loadTemplate(key)}
              style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', fontSize: '12px', cursor: 'pointer', fontWeight: activeTemplate === key ? 600 : 400,
                background: activeTemplate === key ? C.accent : 'transparent', color: activeTemplate === key ? '#fff' : C.muted, transition: 'all 0.15s' }}>
              {t.emoji} {t.name}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* User + export */}
        <button style={{ padding: '5px 14px', borderRadius: '6px', border: 'none', background: C.gold, color: '#000', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
          ↑ Export
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {avatar && <img src={avatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />}
          <span style={{ fontSize: '12px', color: C.muted }}>{firstName}</span>
          <button onClick={() => { setSigningOut(true); supabase.auth.signOut(); }}
            style={{ padding: '4px 8px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: '11px', cursor: 'pointer' }}>
            {signingOut ? '...' : 'Sign out'}
          </button>
        </div>
      </nav>

      {/* ── Main Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left Panel ── */}
        <aside style={{ width: '220px', borderRight: `1px solid ${C.border}`, background: C.sidebar, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
          {/* Tab switcher */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
            {(['project', 'elements', 'animations'] as const).map(tab => (
              <button key={tab} onClick={() => setLeftTab(tab)}
                style={{ flex: 1, padding: '8px 4px', border: 'none', background: 'transparent', fontSize: '10px', fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: leftTab === tab ? C.accent : C.muted, borderBottom: leftTab === tab ? `2px solid ${C.accent}` : '2px solid transparent', transition: 'all 0.15s' }}>
                {tab}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {/* Project Settings */}
            {leftTab === 'project' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Project Settings</div>
                {[
                  { label: 'Width', key: 'width', unit: 'px' },
                  { label: 'Height', key: 'height', unit: 'px' },
                  { label: 'FPS', key: 'fps', unit: '' },
                  { label: 'Duration', key: 'duration', unit: 's' },
                ].map(({ label, key, unit }) => (
                  <div key={key}>
                    <div style={{ fontSize: '10px', color: C.muted, marginBottom: '4px' }}>{label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden' }}>
                      <input type="number" value={(settings as any)[key]}
                        onChange={e => setSettings(s => ({ ...s, [key]: parseFloat(e.target.value) || 0 }))}
                        style={{ flex: 1, background: 'transparent', border: 'none', color: C.text, fontSize: '12px', padding: '6px 8px', outline: 'none' }} />
                      {unit && <span style={{ fontSize: '10px', color: C.muted, paddingRight: '8px' }}>{unit}</span>}
                    </div>
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: '10px', color: C.muted, marginBottom: '4px' }}>Background Color</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '6px 8px' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '3px', background: settings.bg, border: `1px solid ${C.border}` }} />
                    <input value={settings.bg} onChange={e => setSettings(s => ({ ...s, bg: e.target.value }))}
                      style={{ flex: 1, background: 'transparent', border: 'none', color: C.text, fontSize: '12px', outline: 'none' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Elements / Layers */}
            {leftTab === 'elements' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Elements</div>
                {layers.map((layer, i) => (
                  <div key={layer.id} onClick={() => setSelectedLayer(layer.id === selectedLayer ? null : layer.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', border: `1px solid ${layer.id === selectedLayer ? C.accent : 'transparent'}`,
                      background: layer.id === selectedLayer ? `${C.accent}15` : 'transparent', opacity: layer.visible ? 1 : 0.4, transition: 'all 0.1s' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: layer.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{layer.name}</span>
                    <button onClick={e => { e.stopPropagation(); toggleLayer(layer.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: '11px', padding: '0 2px' }}>
                      {layer.visible ? '●' : '○'}
                    </button>
                    <button onClick={e => { e.stopPropagation(); lockLayer(layer.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: layer.locked ? C.gold : C.muted, fontSize: '11px', padding: '0 2px' }}>
                      {layer.locked ? '🔒' : '🔓'}
                    </button>
                  </div>
                ))}
                <button onClick={() => {
                  const newLayer: Layer = { id: String(Date.now()), name: 'New Layer', type: 'rect', visible: true, locked: false, color: C.accent };
                  setLayers(ls => [newLayer, ...ls]);
                }} style={{ marginTop: '8px', padding: '6px', borderRadius: '6px', border: `1px dashed ${C.border}`, background: 'transparent', color: C.muted, fontSize: '12px', cursor: 'pointer' }}>
                  + Add Layer
                </button>
              </div>
            )}

            {/* Animations */}
            {leftTab === 'animations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Animations</div>
                {layers.map((layer, i) => (
                  <div key={layer.id} style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '11px', color: C.muted, marginBottom: '4px' }}>{layer.name}</div>
                    {['Parallel', 'Wait'].map((anim, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: C.surface, borderRadius: '4px', marginBottom: '2px', border: `1px solid ${C.border}` }}>
                        <div style={{ width: 6, height: 6, borderRadius: '1px', background: ANIM_COLORS[(i + j) % ANIM_COLORS.length] }} />
                        <span style={{ fontSize: '11px', color: C.muted }}>{anim}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── Center: Canvas + Timeline ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.bg }}>

          {/* Canvas area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', background: '#06070a' }}>

            {/* Toolbar */}
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '4px', background: C.panel, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '6px' }}>
              {[
                { icon: '%', title: 'Scale' },
                { icon: '✓', title: 'Select' },
                { icon: '□', title: 'Rectangle' },
                { icon: '○', title: 'Circle' },
                { icon: 'T', title: 'Text' },
                { icon: '⊞', title: 'Image' },
              ].map(({ icon, title }) => (
                <button key={title} title={title}
                  style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '5px', border: 'none', background: 'transparent', color: C.muted, fontSize: '13px', cursor: 'pointer' }}>
                  {icon}
                </button>
              ))}
            </div>

            {/* Preview canvas */}
            <div style={{
              background: settings.bg,
              width: Math.min(800, (800 / settings.width) * settings.width),
              height: Math.min(450, (800 / settings.width) * settings.height),
              borderRadius: '4px',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 20px 60px rgba(0,0,0,0.8)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Render visible layers as preview */}
              {layers.filter(l => l.visible).map((layer, i) => {
                const scale = 800 / settings.width;
                const positions = [
                  { top: '10%', left: '5%', width: '90%', height: '80%' },
                  { top: '5%', left: '40%', width: '20%', height: '20%' },
                  { top: '30%', left: '10%', width: '40%', height: '15%' },
                  { top: '50%', left: '10%', width: '30%', height: '8%' },
                  { top: '65%', left: '10%', width: '50%', height: '6%' },
                  { top: '75%', left: '10%', width: '20%', height: '10%' },
                ];
                const pos = positions[i % positions.length];
                return (
                  <div key={layer.id} onClick={() => setSelectedLayer(layer.id)}
                    style={{
                      position: 'absolute', ...pos,
                      background: layer.type === 'rect' ? `${layer.color}30` : 'transparent',
                      border: `1px solid ${layer.id === selectedLayer ? layer.color : layer.color + '40'}`,
                      borderRadius: layer.type === 'circle' ? '50%' : '3px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: layer.color, fontSize: '11px', fontWeight: 600,
                      transition: 'border-color 0.15s',
                    }}>
                    {layer.type === 'text' && <span style={{ color: layer.color, opacity: 0.8, fontSize: '10px' }}>{layer.name}</span>}
                  </div>
                );
              })}
              {/* Playhead indicator */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: `${timelinePct}%`, height: '2px', background: C.accent, transition: 'width 0.1s linear' }} />
            </div>

            {/* Timestamp */}
            <div style={{ position: 'absolute', right: '12px', bottom: '12px', fontSize: '11px', color: C.muted, background: C.panel, border: `1px solid ${C.border}`, borderRadius: '4px', padding: '3px 8px' }}>
              t = {playhead.toFixed(2)}s
            </div>

            {/* Zoom */}
            <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '8px', background: C.panel, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: C.muted }}>
              <span>—</span>
              <span>{Math.round((800 / settings.width) * 100)}%</span>
              <span>+</span>
              <span style={{ margin: '0 4px', color: C.border }}>|</span>
              <span>⊞</span>
            </div>
          </div>

          {/* ── Timeline ── */}
          <div style={{ height: '140px', borderTop: `1px solid ${C.border}`, background: C.sidebar, flexShrink: 0, overflow: 'hidden' }}>
            {/* Timeline toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', borderBottom: `1px solid ${C.border}`, gap: '8px' }}>
              <button onClick={() => { setPlayhead(0); setPlaying(false); }}
                style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '14px', padding: '2px 4px' }}>⏮</button>
              <button onClick={() => setPlaying(p => !p)}
                style={{ background: C.accent, border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                {playing ? '⏸' : '▶'}
              </button>
              <button onClick={() => { setPlayhead(settings.duration); setPlaying(false); }}
                style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '14px', padding: '2px 4px' }}>⏭</button>
              <span style={{ fontSize: '11px', color: C.muted, marginLeft: '8px' }}>
                {playhead.toFixed(1)}s / {settings.duration}s
              </span>
              <span style={{ fontSize: '11px', color: C.muted }}>{settings.fps} fps</span>
            </div>

            {/* Timeline tracks */}
            <div style={{ overflowX: 'auto', overflowY: 'hidden', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {/* Time ruler */}
              <div style={{ display: 'flex', marginLeft: '80px', marginBottom: '2px' }}>
                {Array.from({ length: Math.floor(settings.duration) + 1 }, (_, i) => (
                  <div key={i} style={{ width: '60px', fontSize: '9px', color: C.muted, borderLeft: `1px solid ${C.border}`, paddingLeft: '3px', flexShrink: 0 }}>{i}s</div>
                ))}
              </div>
              {/* Layer tracks */}
              {layers.slice(0, 4).map((layer, i) => (
                <div key={layer.id} style={{ display: 'flex', alignItems: 'center', height: '18px' }}>
                  <div style={{ width: '80px', fontSize: '10px', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{layer.name}</div>
                  <div style={{ position: 'relative', display: 'flex', gap: '2px' }}>
                    {/* Animated blocks */}
                    {Array.from({ length: Math.floor(settings.duration / 2) + 1 }, (_, j) => (
                      <div key={j} style={{
                        width: `${50 + Math.random() * 30}px`,
                        height: '14px', borderRadius: '3px', border: `1px solid ${ANIM_COLORS[(i + j) % ANIM_COLORS.length]}60`,
                        background: `${ANIM_COLORS[(i + j) % ANIM_COLORS.length]}20`,
                        display: 'flex', alignItems: 'center', paddingLeft: '4px', flexShrink: 0,
                      }}>
                        <span style={{ fontSize: '8px', color: ANIM_COLORS[(i + j) % ANIM_COLORS.length], opacity: 0.8 }}>
                          {j % 2 === 0 ? 'Parallel' : 'Wait'}
                        </span>
                      </div>
                    ))}
                    {/* Playhead line */}
                    <div style={{
                      position: 'absolute', top: 0, left: `${timelinePct * 3}px`, width: '1px', height: '100%',
                      background: C.accent, zIndex: 2, transition: 'left 0.1s linear',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: AI Panel ── */}
        {rightOpen && (
          <aside style={{ width: '280px', borderLeft: `1px solid ${C.border}`, background: C.sidebar, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>AI Assistant</div>
                <div style={{ fontSize: '10px', color: C.muted }}>What changes should I make?</div>
              </div>
              <button onClick={() => setRightOpen(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '16px' }}>×</button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {messages.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '90%', padding: '8px 10px', borderRadius: m.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                    background: m.role === 'user' ? C.accent : C.surface,
                    border: `1px solid ${m.role === 'user' ? C.accent : C.border}`,
                    fontSize: '12px', lineHeight: 1.5, color: C.text,
                  }}>
                    {m.content}
                    <div style={{ fontSize: '9px', color: m.role === 'user' ? '#a78bfa' : C.muted, marginTop: '3px', textAlign: 'right' }}>
                      {m.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div style={{ display: 'flex', gap: '4px', padding: '8px' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent, animation: `pulse 1.2s ${i * 0.2}s infinite` }} />)}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick actions */}
            <div style={{ padding: '8px 12px', borderTop: `1px solid ${C.border}`, display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {['Change colors', 'Add animation', 'Adjust timing', 'Write script'].map(q => (
                <button key={q} onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                  style={{ padding: '3px 8px', borderRadius: '12px', border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: '10px', cursor: 'pointer' }}>
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding: '8px 12px', borderTop: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', gap: '6px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '6px 8px', alignItems: 'flex-end' }}>
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Describe changes..."
                  style={{ flex: 1, background: 'transparent', border: 'none', color: C.text, fontSize: '12px', resize: 'none', outline: 'none', minHeight: '20px', maxHeight: '80px', lineHeight: 1.4 }}
                  rows={1} />
                <button onClick={sendMessage} disabled={aiLoading || !input.trim()}
                  style={{ background: C.accent, border: 'none', borderRadius: '5px', color: '#fff', width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: input.trim() ? 1 : 0.4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Toggle AI panel */}
        {!rightOpen && (
          <button onClick={() => setRightOpen(true)}
            style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: C.accent, border: 'none', borderRadius: '6px 0 0 6px', color: '#fff', padding: '10px 6px', cursor: 'pointer', fontSize: '12px', zIndex: 10 }}>
            AI
          </button>
        )}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 2px; }
        @keyframes pulse { 0%,100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
