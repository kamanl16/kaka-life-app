import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-container-highest dark:bg-surface-container-lowest border-t border-outline-variant dark:border-outline w-full mt-auto mb-16 md:mb-0">
      <div className="w-full py-12 px-margin-desktop max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="flex flex-col gap-4 max-w-sm">
          <div className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary dark:text-primary-fixed" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>location_city</span>
            卡卡生活
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">© 2026 卡卡生活。連結社區，服務生活。</p>
        </div>
        <div className="flex flex-col md:flex-row gap-8 md:gap-16">
          <div className="flex flex-col gap-2">
            <a href="#" className="font-label-sm text-label-sm text-on-surface-variant dark:text-surface-variant hover:text-primary transition-colors">關於我們</a>
            <a href="#" className="font-label-sm text-label-sm text-on-surface-variant dark:text-surface-variant hover:text-primary transition-colors">聯絡我們</a>
          </div>
          <div className="flex flex-col gap-2">
            <a href="#" className="font-label-sm text-label-sm text-on-surface-variant dark:text-surface-variant hover:text-primary transition-colors">服務條款</a>
            <a href="#" className="font-label-sm text-label-sm text-on-surface-variant dark:text-surface-variant hover:text-primary transition-colors">隱私政策</a>
            <a href="#" className="font-label-sm text-label-sm text-on-surface-variant dark:text-surface-variant hover:text-primary transition-colors">幫助中心</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
