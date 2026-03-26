import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface Props { session: Session; }

export default function Dashboard({ session }: Props) {
  const [signingOut, setSigningOut] = useState(false);
  const user = session.user;
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator';
  const avatar = user.user_metadata?.avatar_url;

  const signOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
  };

  return (
    <div style={s.root}>
      <nav style={s.nav}>
        <div style={s.brand}>
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="18" fill="#7c3aed" opacity="0.2" />
            <path d="M10 13l6 10 6-10" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 13h8" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span style={s.brandName}>Nexia Motion</span>
        </div>
        <div style={s.navRight}>
          {avatar && <img src={avatar} alt="" style={s.avatar} />}
          <span style={s.userName}>{name}</span>
          <button style={{...s.btn, opacity: signingOut ? 0.5 : 1}} onClick={signOut} disabled={signingOut}>
            Sign out
          </button>
        </div>
      </nav>

      <main style={s.main}>
        <div style={s.hero}>
          <h1 style={s.heroTitle}>Welcome, {name.split(' ')[0]} 👋</h1>
          <p style={s.heroSub}>Your video creation studio is ready. Start a new project or pick a template.</p>
          <div style={s.ctaRow}>
            <button style={s.ctaPrimary}>+ New Project</button>
            <button style={s.ctaSecondary}>Browse Templates</button>
          </div>
        </div>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>Starter Templates</h2>
          <div style={s.grid}>
            {TEMPLATES.map(t => (
              <div key={t.name} style={s.card}>
                <div style={{...s.cardThumb, background: t.color}}>
                  <span style={s.cardEmoji}>{t.emoji}</span>
                </div>
                <div style={s.cardBody}>
                  <div style={s.cardName}>{t.name}</div>
                  <div style={s.cardMeta}>{t.duration}s · {t.category}</div>
                  {t.plan !== 'free' && <span style={s.badge}>{t.plan}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

const TEMPLATES = [
  { name:'Trade Signal Alert', duration:15, category:'Finance', plan:'free', emoji:'📈', color:'linear-gradient(135deg,#0f2027,#203a43,#2c5364)' },
  { name:'Brand Intro', duration:5, category:'Branding', plan:'free', emoji:'✨', color:'linear-gradient(135deg,#1a0533,#3b0764)' },
  { name:'Social Clip', duration:30, category:'Social', plan:'creator', emoji:'🎬', color:'linear-gradient(135deg,#0d1117,#161b22)' },
  { name:'Product Demo', duration:60, category:'Product', plan:'creator', emoji:'🖥️', color:'linear-gradient(135deg,#0a0f1e,#162032)' },
  { name:'YouTube Thumbnail', duration:10, category:'YouTube', plan:'studio', emoji:'🎯', color:'linear-gradient(135deg,#1a0000,#3d0000)' },
];

const s: Record<string, React.CSSProperties> = {
  root: { minHeight:'100vh', background:'#0a0a0f', display:'flex', flexDirection:'column' },
  nav: { display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'0 32px', height:64, background:'#0d0d14',
    borderBottom:'1px solid #1a1a2e', position:'sticky', top:0, zIndex:10 },
  brand: { display:'flex', alignItems:'center', gap:10 },
  brandName: { fontSize:17, fontWeight:700, color:'#a78bfa' },
  navRight: { display:'flex', alignItems:'center', gap:12 },
  avatar: { width:32, height:32, borderRadius:'50%', border:'2px solid #7c3aed' },
  userName: { fontSize:14, color:'#9ca3af' },
  btn: { padding:'8px 16px', background:'transparent', color:'#6b7280', border:'1px solid #1f2937',
    borderRadius:8, cursor:'pointer', fontSize:13 },
  main: { flex:1, padding:'40px 32px', maxWidth:1200, margin:'0 auto', width:'100%' },
  hero: { marginBottom:48 },
  heroTitle: { fontSize:36, fontWeight:800, color:'#fff', marginBottom:8 },
  heroSub: { fontSize:15, color:'#6b7280', marginBottom:24 },
  ctaRow: { display:'flex', gap:12 },
  ctaPrimary: { padding:'12px 24px', background:'#7c3aed', color:'#fff', border:'none',
    borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer' },
  ctaSecondary: { padding:'12px 24px', background:'transparent', color:'#a78bfa',
    border:'1px solid #4c1d95', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer' },
  section: { },
  sectionTitle: { fontSize:18, fontWeight:700, color:'#fff', marginBottom:20 },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16 },
  card: { background:'#111827', borderRadius:12, overflow:'hidden', border:'1px solid #1f2937',
    cursor:'pointer', transition:'border-color 0.2s' },
  cardThumb: { height:120, display:'flex', alignItems:'center', justifyContent:'center' },
  cardEmoji: { fontSize:36 },
  cardBody: { padding:'14px 16px' },
  cardName: { fontSize:14, fontWeight:600, color:'#f9fafb', marginBottom:4 },
  cardMeta: { fontSize:12, color:'#6b7280', marginBottom:6 },
  badge: { display:'inline-block', padding:'2px 8px', background:'#3b0764',
    color:'#a78bfa', borderRadius:4, fontSize:11, fontWeight:600, textTransform:'capitalize' },
};
