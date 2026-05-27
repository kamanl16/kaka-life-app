import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const MobileNav: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path || (path === '/profile' && location.pathname === '/login');
    if (isActive) {
      return "flex flex-col items-center justify-end text-primary dark:text-primary-fixed rounded-full px-2 py-1 transition-transform duration-150 ease-out h-full";
    }
    return "flex flex-col items-center justify-end text-on-surface-variant dark:text-surface-variant px-2 py-1 transition-transform duration-150 ease-out hover:text-primary h-full";
  };

  const profileLink = user ? '/profile' : '/login';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-between items-end px-4 py-2 bg-surface dark:bg-surface-dim border-t border-outline-variant dark:border-outline shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50 rounded-t-xl pb-safe min-h-[72px]">
      <Link to="/life-info" className={getLinkClass('/life-info') + " w-16"}>
        <span className="material-symbols-outlined text-[24px]">home_repair_service</span>
        <span className="font-label-sm text-[12px] mt-1">生活</span>
      </Link>

      <Link to="/dining" className={getLinkClass('/dining') + " w-16"}>
        <span className="material-symbols-outlined text-[24px]">restaurant</span>
        <span className="font-label-sm text-[12px] mt-1">美食</span>
      </Link>

      {/* Prominent Center Publish Button */}
      <Link 
        to="/publish" 
        className={getLinkClass('/publish') + " w-16 relative active:scale-95"}
      >
        {/* Absolute positioned circle moved higher (-top-8) */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-on-primary rounded-full p-3 shadow-lg flex items-center justify-center border-4 border-surface dark:border-surface-dim">
          <span className="material-symbols-outlined text-[28px]">add</span>
        </div>
        {/* Invisible structural icon to keep the "發佈" text perfectly horizontally aligned with other buttons */}
        <span className="material-symbols-outlined text-[24px] invisible">add</span>
        <span className="font-label-sm text-[12px] mt-1 text-on-surface-variant dark:text-surface-variant">發佈</span>
      </Link>

      <Link to="/forum" className={getLinkClass('/forum') + " w-16"}>
        <span className="material-symbols-outlined text-[24px]">forum</span>
        <span className="font-label-sm text-[12px] mt-1">論壇</span>
      </Link>

      <Link to={profileLink} className={getLinkClass(profileLink) + " w-16"}>
        <span className="material-symbols-outlined text-[24px]">person</span>
        <span className="font-label-sm text-[12px] mt-1">我的</span>
      </Link>
    </nav>
  );
};
