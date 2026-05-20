import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar - Fixed width */}
      <Sidebar />

      {/* Main Content Area - Takes remaining space */}
      <div className="flex-1 flex flex-col pl-64">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
