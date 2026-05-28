import React from 'react';
import Image from 'next/image';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Premium layout for authentication pages.
 * Features a split design with a decorative gradient section and a clean form section.
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-white dark:bg-zinc-950 font-sans">
      {/* Image Section (Visible on large screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Image
          src="/login-image.png"
          alt="Login Background"
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          loading="eager"
        />
      </div>

      {/* Form Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-24 bg-zinc-50/30">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <img
              src="/logo-app.png?v=2"
              alt="EcoCore Logo"
              width={180}
              height={120}
              className="object-contain"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};
