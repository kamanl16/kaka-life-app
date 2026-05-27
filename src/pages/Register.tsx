import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setError("兩次輸入的密碼不一致");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccessMsg("註冊成功！請檢查您的電子郵件以進行驗證，或直接前往登錄。");
      setLoading(false);
      // Wait briefly then redirect to login
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-margin-mobile md:p-margin-desktop relative overflow-hidden">
      {/* Ambient Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary-fixed-dim/20 to-transparent -z-10"></div>
      
      {/* Registration Card */}
      <div className="w-full max-w-[480px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0_4px_24px_rgba(0,7,103,0.05)] p-6 md:p-10 relative z-10">
        
        {/* Brand & Title */}
        <div className="text-center mb-8">
          <h1 className="text-primary font-headline-sm text-headline-sm font-bold mb-2 tracking-tight">卡卡生活</h1>
          <h2 className="text-on-surface font-headline-md text-headline-md">創建帳號</h2>
          <p className="text-on-surface-variant font-body-md text-body-md mt-2">加入我們的社區，探索更多精采生活</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg font-body-sm flex items-start gap-2 border border-error/20">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <p>{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-primary/10 text-primary rounded-lg font-body-sm flex items-start gap-2 border border-primary/20">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <p>{successMsg}</p>
          </div>
        )}
        
        {/* Form */}
        <form action="#" className="space-y-5" method="POST" onSubmit={handleRegister}>
          
          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="block font-label-md text-label-md text-on-surface" htmlFor="username">用戶名</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" data-icon="person">person</span>
              <input className="w-full pl-10 pr-4 py-3 bg-surface border border-surface-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" id="username" name="username" placeholder="請輸入您的用戶名" required type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
          </div>
          
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="block font-label-md text-label-md text-on-surface" htmlFor="email">電子郵件</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" data-icon="mail">mail</span>
              <input className="w-full pl-10 pr-4 py-3 bg-surface border border-surface-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" id="email" name="email" placeholder="example@domain.com" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          
          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="block font-label-md text-label-md text-on-surface" htmlFor="password">密碼</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" data-icon="lock">lock</span>
              <input className="w-full pl-10 pr-10 py-3 bg-surface border border-surface-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" id="password" name="password" placeholder="設定密碼 (至少8個字符)" required minLength={6} type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface focus:outline-none" 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility" : "visibility_off"}</span>
              </button>
            </div>
          </div>
          
          {/* Confirm Password Field */}
          <div className="space-y-1.5">
            <label className="block font-label-md text-label-md text-on-surface" htmlFor="confirm_password">確認密碼</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" data-icon="lock_reset">lock_reset</span>
              <input className="w-full pl-10 pr-4 py-3 bg-surface border border-surface-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" id="confirm_password" name="confirm_password" placeholder="再次輸入密碼" required type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          
          {/* Terms Checkbox */}
          <div className="flex items-start pt-2">
            <div className="flex items-center h-5">
              <input aria-describedby="terms-description" className="w-4 h-4 border border-surface-variant rounded bg-surface focus:ring-3 focus:ring-primary/20 checked:bg-primary checked:border-primary text-primary transition-colors cursor-pointer" id="terms" required type="checkbox" />
            </div>
            <div className="ml-3 text-sm">
              <label className="font-body-md text-body-md text-on-surface-variant cursor-pointer" htmlFor="terms">
                我同意 <a className="text-primary hover:underline font-medium" href="#">服務條款</a> 和 <a className="text-primary hover:underline font-medium" href="#">隱私政策</a>
              </label>
            </div>
          </div>
          
          {/* Submit Button */}
          <button disabled={loading || !!successMsg} className="w-full py-3.5 px-4 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-medium shadow-[0_2px_8px_rgba(175,16,26,0.25)] hover:bg-on-primary-fixed-variant active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed" type="submit">
            {loading ? '處理中...' : '創建帳號'}
            {!loading && <span className="material-symbols-outlined text-[18px]" data-icon="arrow_forward">arrow_forward</span>}
          </button>
        </form>
        
        {/* Divider */}
        <div className="mt-8 flex items-center justify-center space-x-4">
          <div className="h-px flex-1 bg-surface-variant"></div>
          <span className="font-label-sm text-label-sm text-on-surface-variant">或透過以下方式註冊</span>
          <div className="h-px flex-1 bg-surface-variant"></div>
        </div>
        
        {/* Social Login Options */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 py-2.5 px-4 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors text-on-surface font-label-md text-label-md" type="button">
            <span className="material-symbols-outlined text-[#DB4437]" data-icon="mail">mail</span>
            Google
          </button>
          <button className="flex items-center justify-center gap-2 py-2.5 px-4 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors text-on-surface font-label-md text-label-md" type="button">
            <span className="material-symbols-outlined text-[#1877F2]" data-icon="thumb_up">thumb_up</span>
            Facebook
          </button>
        </div>
        
        {/* Login Link */}
        <div className="mt-8 text-center font-body-md text-body-md text-on-surface-variant">
          已有帳號？ <Link className="text-primary font-medium hover:underline ml-1" to="/login">登入</Link>
        </div>
      </div>
    </div>
  );
};
