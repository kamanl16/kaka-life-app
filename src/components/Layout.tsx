import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';

export const Layout: React.FC = () => {
  return (
    <>
      {/* Mobile Top App Bar for all pages (can be customized per page if needed) */}
      <header className="md:hidden bg-surface dark:bg-surface-dim border-b border-outline-variant dark:border-outline shadow-sm dark:shadow-none w-full top-0 sticky flex items-center justify-center px-margin-mobile h-16 z-40 transition-colors duration-200">
        <Link to="/" className="font-headline-sm text-headline-sm text-primary dark:text-primary-fixed-dim font-bold truncate hover:opacity-80 transition-opacity">
          卡卡生活
        </Link>
      </header>
      
      <Header />
      
      <main className="flex-grow flex flex-col relative overflow-hidden">
        <Outlet />
      </main>

      <Footer />
      <MobileNav />
    </>
  );
};
