import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center pt-24 pb-12 px-margin-mobile md:px-margin-desktop bg-background">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-lg border border-surface-variant overflow-hidden">
        {/* Login Form Area */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-headline-md font-headline-md text-on-surface mb-2">登錄您的帳號</h1>
            <p className="text-body-md font-body-md text-on-surface-variant">歡迎回來！請輸入您的憑證以繼續。</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg font-body-sm flex items-start gap-2 border border-error/20">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <p>{error}</p>
            </div>
          )}

          <form action="#" className="space-y-6" method="POST" onSubmit={handleLogin}>
            <div>
              <label className="block text-label-md font-label-md text-on-surface mb-1" htmlFor="email">電子郵件或用戶名</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">mail</span>
                <input 
                  className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
                  id="email" 
                  name="email" 
                  placeholder="example@email.com" 
                  required 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-label-md font-label-md text-on-surface" htmlFor="password">密碼</label>
                <a className="text-label-sm font-label-sm text-primary hover:text-primary-fixed-dim transition-colors" href="#">忘記密碼？</a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">lock</span>
                <input 
                  className="w-full pl-10 pr-10 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  required 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface focus:outline-none" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility" : "visibility_off"}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input className="h-4 w-4 text-primary focus:ring-primary border-outline-variant rounded bg-surface-container-low" id="remember-me" name="remember-me" type="checkbox" />
              <label className="ml-2 block text-label-md font-label-md text-on-surface" htmlFor="remember-me">
                記住我
              </label>
            </div>

            <div>
              <button disabled={loading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-label-md font-label-md text-on-primary bg-primary hover:bg-primary-fixed-dim hover:text-primary-fixed hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed" type="submit">
                {loading ? '登錄中...' : '登錄'}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-6 relative">
            <div aria-hidden="true" className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant"></div>
            </div>
            <div className="relative flex justify-center text-label-sm font-label-sm">
              <span className="px-2 bg-surface-container-lowest text-on-surface-variant">或使用以下方式登錄</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="w-full inline-flex justify-center py-2 px-4 border border-outline-variant rounded-lg shadow-sm bg-surface-container-lowest text-label-md font-label-md text-on-surface hover:bg-surface-container-low transition-colors">
              <span className="sr-only">使用 Google 登錄</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span className="ml-2">Google</span>
            </button>
            <button className="w-full inline-flex justify-center py-2 px-4 border border-outline-variant rounded-lg shadow-sm bg-surface-container-lowest text-label-md font-label-md text-on-surface hover:bg-surface-container-low transition-colors">
              <span className="sr-only">使用 Facebook 登錄</span>
              <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
              </svg>
              <span className="ml-2">Facebook</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-body-md font-body-md text-on-surface-variant">
              還沒有帳號？
              <Link className="font-label-md text-primary hover:text-primary-fixed-dim hover:underline transition-colors ml-1" to="/register">創建帳號</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
