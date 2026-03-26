import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const handle = async () => {
      try {
        // Handle hash-based token (implicit flow from Google OAuth)
        const hash = window.location.hash;
        const search = window.location.search;

        if (hash && hash.includes('access_token')) {
          // Supabase will auto-detect and set session from hash
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (data.session) { navigate('/', { replace: true }); return; }
          // Wait a moment for supabase to process the hash
          await new Promise(r => setTimeout(r, 800));
          const { data: d2, error: e2 } = await supabase.auth.getSession();
          if (e2) throw e2;
          if (d2.session) { navigate('/', { replace: true }); return; }
        }

        // Handle code-based flow (PKCE)
        if (search && search.includes('code=')) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(search);
          if (error) throw error;
          if (data.session) { navigate('/', { replace: true }); return; }
        }

        // Fallback: check if session already exists
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data.session) { navigate('/', { replace: true }); return; }

        // No session found
        throw new Error('No session found after OAuth. Please try signing in again.');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
      }
    };
    handle();
  }, [navigate]);

  if (error) return (
    <div style={s.root}>
      <div style={s.card}>
        <div style={s.icon}>⚠️</div>
        <p style={s.title}>Sign-in failed</p>
        <p style={s.msg}>{error}</p>
        <a href="/login" style={s.btn}>← Try again</a>
      </div>
    </div>
  );

  return (
    <div style={s.root}>
      <div style={s.spinWrap}>
        <div style={s.spin} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={s.hint}>Signing you in to Nexia Motion...</p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: { display:'flex', alignItems:'center', justifyContent:'center',
    height:'100vh', background:'#0a0a0f' },
  card: { textAlign:'center', padding:40 },
  icon: { fontSize:40, marginBottom:16 },
  title: { color:'#ef4444', fontSize:18, fontWeight:700, marginBottom:8 },
  msg: { color:'#6b7280', fontSize:13, marginBottom:24, maxWidth:360 },
  btn: { display:'inline-block', padding:'10px 24px', background:'#7c3aed',
    color:'#fff', borderRadius:8, textDecoration:'none', fontSize:14, fontWeight:600 },
  spinWrap: { display:'flex', flexDirection:'column', alignItems:'center', gap:16 },
  spin: { width:44, height:44, border:'3px solid #1a1a2e', borderTopColor:'#7c3aed',
    borderRadius:'50%', animation:'spin 0.8s linear infinite' },
  hint: { color:'#6b7280', fontSize:14 },
};
