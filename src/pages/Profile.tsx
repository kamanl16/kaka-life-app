import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const Profile: React.FC = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (profile) {
      setUsername(profile.username || '');
    }
  }, [user, profile, navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    setMessage(null);
    
    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', user.id);
      
    setIsSaving(false);
    
    if (error) {
      setMessage({ type: 'error', text: '更新失敗：' + error.message });
    } else {
      setMessage({ type: 'success', text: '個人資料更新成功！' });
      refreshProfile(); // Assuming refreshProfile exists, if not we'll just handle it or the page reload
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="flex-1 w-full max-w-lg mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12 flex flex-col gap-6">
      
      <div className="bg-surface rounded-2xl p-6 md:p-8 shadow-sm border border-outline-variant">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-4xl font-bold mb-4 shadow-sm border-2 border-primary/20">
            {username ? username[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}
          </div>
          <h1 className="font-headline-md text-on-surface font-bold">個人中心</h1>
          <p className="text-on-surface-variant font-label-md mt-1">{user.email}</p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 font-label-md flex items-center gap-2 ${message.type === 'success' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
            <span className="material-symbols-outlined">
              {message.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div>
            <label className="block font-label-md text-on-surface mb-2">顯示名稱 (Display Name)</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="輸入您想顯示的名稱..." 
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
            <p className="text-on-surface-variant text-xs mt-2 ml-1">這將會顯示在您的論壇發文與留言中。</p>
          </div>

          <div className="pt-4 border-t border-outline-variant/50 flex flex-col gap-3">
            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full bg-primary text-on-primary py-3 rounded-xl font-label-lg font-bold hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {isSaving ? <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span> : <span className="material-symbols-outlined text-[20px]">save</span>}
              儲存變更
            </button>
            
            <button 
              type="button" 
              onClick={handleLogout}
              className="w-full bg-surface-container border border-outline-variant text-error py-3 rounded-xl font-label-lg font-bold hover:bg-error/10 transition-all active:scale-[0.98]"
            >
              登出帳號
            </button>
          </div>
        </form>
      </div>
      
    </div>
  );
};
