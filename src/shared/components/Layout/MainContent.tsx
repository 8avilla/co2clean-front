'use client';

import React from 'react';
import { Header } from './Header';
import { useSidebar } from './SidebarContext';

export const MainContent = ({ children }: { children: React.ReactNode }) => {
  const { isCollapsed, isOpen, closeSidebar } = useSidebar();

  return (
    <>
      {/* Mobile overlay — closes drawer on tap */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div
        className={[
          'flex-1 flex flex-col min-w-0 transition-all duration-300',
          // Mobile: no padding (sidebar is a drawer overlay)
          'pl-0',
          // Tablet / Desktop: offset by sidebar width
          isCollapsed ? 'md:pl-[72px]' : 'md:pl-64',
        ].join(' ')}
      >
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </>
  );
};
