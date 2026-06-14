'use client';

import React from 'react';
import Image from 'next/image';
import { MainLayout } from '@/shared/components/Layout/MainLayout';

export default function Home() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <img
            src="/logo-app.png?v=2"
            alt="EcoCore Logo"
            className="drop-shadow-md w-48 h-auto"
          />
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-zinc-800">Bienvenido a EcoCore</h1>
            <p className="text-zinc-500 text-sm max-w-sm">
              Tu central inteligente para medir, gestionar y acelerar la descarbonización de tu organización.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
