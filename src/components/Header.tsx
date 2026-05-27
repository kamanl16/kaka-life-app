import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Header: React.FC = () => {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();

  const getLinkClass = (path: string) => {
    const baseClass = "font-label-md text-label-md px-4 py-1.5 rounded-full transition-all scale-95 active:scale-90 duration-150";
    if (location.pathname === path) {
      return `${baseClass} bg-primary text-on-primary font-bold shadow-sm`;
    }
    return `${baseClass} text-on-surface-variant dark:text-surface-variant hover:text-primary hover:bg-surface-container-high`;
  };

  return (
    <header className="hidden md:block bg-surface-container-lowest dark:bg-surface-container-high border-b border-outline-variant dark:border-outline shadow-sm dark:shadow-none w-full sticky top-0 z-50 transition-colors duration-200">
      <div className="flex justify-between items-center w-full px-margin-desktop max-w-container-max mx-auto h-20">
        <Link to="/" className="font-headline-sm text-headline-sm font-bold text-primary dark:text-primary-fixed flex items-center gap-2">
          <span className="material-symbols-outlined text-primary dark:text-primary-fixed" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>location_city</span>
          卡卡生活
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className={getLinkClass('/')}>首頁</Link>
          <Link to="/life-info" className={getLinkClass('/life-info')}>生活資訊</Link>
          <Link to="/news" className={getLinkClass('/news')}>新聞動態</Link>
          <Link to="/dining" className={getLinkClass('/dining')}>美食與購物</Link>
          <Link to="/forum" className={getLinkClass('/forum')}>論壇交流</Link>
        </nav>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <Link to="/profile" className="font-label-md text-on-surface-variant flex items-center gap-1 bg-surface-variant/30 px-3 py-1 rounded-full hover:bg-surface-variant/50 transition-colors">
                <span className="material-symbols-outlined text-[18px]">person</span>
                {profile?.username || user.user_metadata?.username || (user.email ? user.email.split('@')[0] : '用戶')}
              </Link>
              <button onClick={signOut} className="font-label-md text-label-md text-error hover:underline transition-colors px-2">
                登出
              </button>
            </div>
          ) : (
            <Link to="/login" className="hidden md:block font-label-md text-label-md text-primary dark:text-primary-fixed border border-primary dark:border-primary-fixed px-4 py-2 rounded hover:bg-surface-container-low dark:hover:bg-surface-container-high transition-colors">
              登錄
            </Link>
          )}
          <Link to="/publish" className="font-label-md text-label-md bg-primary text-on-primary px-4 py-2 rounded hover:bg-surface-tint shadow-sm transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>
            發佈廣告
          </Link>
        </div>
      </div>
    </header>
  );
};
