import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const handle = async () => {
      const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.search);
      if (error) { setError(error.message); return; }
      if (data.session) {
        // Provision nm_users row via edge function (non-blocking)
        try {
          await supabase.functions.invoke('provision-nexia-user', {
            body: {
              auth_user_id: data.session.user.id,
              email: data.session.user.email,
              display_name: data.session.user.user_metadata?.full_name,
              avatar_url: data.session.user.user_metadata?.avatar_url,
            }
          });
        } catch (_) { /* non-fatal */ }
        navigate('/', { replace: true });
      }
    };
    handle();
  }, [navigate]);

  if (error) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0a0a0f',color:'#ef4444',flexDirection:'column',gap:16}}>
      <p>Sign-in failed: {error}</p>
      <a href="/login" style={{color:'#a78bfa',textDecoration:'none'}}>Try again</a>
    </div>
  );

  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0a0a0f',flexDirection:'column',gap:20}}>
      <div style={{width:44,height:44,border:'3px solid #1a1a2e',borderTopColor:'#7c3aed',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{color:'#6b7280',fontSize:14}}>Signing you in to Nexia Motion...</p>
    </div>
  );
}
