'use client';

import React from 'react';
import Image from 'next/image';
import { MainLayout } from '@/shared/components/Layout/MainLayout';

export default function Home() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Image
            src="/logo-app.png"
            alt="CleanCO2 Logo"
            width={400}
            height={300}
            className="drop-shadow-md"
            style={{ width: 'auto', height: 'auto' }}
            priority
          />
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-zinc-800">Bienvenido a CleanCO2</h1>
            <p className="text-zinc-500 text-sm max-w-sm">
              Plataforma de gestión y análisis de huella de carbono empresarial.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
