'use client';

import { useState, useRef, useEffect } from 'react';
import {
  User,
  ChevronDown,
  Settings,
  LogOut,
  Building,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/components/Auth/services/auth.service';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

export const Header = () => {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const companyDropdownRef = useRef<HTMLDivElement>(null);

  // Dynamic user session data
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    companyName: string;
    companyId: string;
    companies: Array<{ id: string; name: string }>;
  }>({
    id: '',
    name: 'Ivan Villamil',
    email: '8avilla@gmail.com',
    role: 'Super administrador',
    companyName: 'Expreso Brasilia S.A',
    companyId: '',
    companies: []
  });

  const handleLogout = () => {
    AuthService.logout();
    window.location.href = '/login';
  };

  const handleSwitchCompany = async (companyId: string) => {
    if (companyId === user.companyId) return;
    setIsSwitching(true);
    try {
      const response = await AuthService.switchCompany(companyId);

      Cookies.set('auth-token', response.token, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      localStorage.setItem('user', JSON.stringify(response.user));
      window.dispatchEvent(new Event('user:updated'));

      // Update dropdown state immediately from the API response
      setUser({
        id: response.user.id ?? '',
        name: response.user.name ?? 'Usuario',
        email: response.user.email ?? '',
        role: response.user.role ?? 'Usuario',
        companyName: response.user.company?.name ?? '',
        companyId: response.user.company?.id ?? '',
        companies: response.user.companies ?? user.companies,
      });

      toast.success(`Cambiado a ${response.user.company?.name}`, {
        description: `Tu rol ahora es: ${response.user.role}`,
      });

      // Refresh server components so page data reflects the new company
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al cambiar de empresa');
    } finally {
      setIsSwitching(false);
      setIsCompanyOpen(false);
    }
  };

  // Close dropdown when clicking outside and load user session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser({
            id: parsed.id || '',
            name: parsed.name || 'Usuario',
            email: parsed.email || '',
            role: parsed.role || 'Usuario',
            companyName: parsed.company?.name || 'EcoCore',
            companyId: parsed.company?.id || '',
            companies: parsed.companies || []
          });
        } catch (e) {
          console.error(e);
        }
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setIsCompanyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8 sticky top-0 z-30">
      {/* Left side (Greeting or Breadcrumbs) */}
      <div className="hidden md:block">
        <p className="text-sm font-medium text-zinc-500">

        </p>
      </div>

      {/* Right side (Actions & Profile) */}
      <div className="flex items-center gap-6">
        {/* Company Switcher Dropdown (visible only if user has > 1 associated company) */}
        {user.companies.length > 1 ? (
          <div className="relative" ref={companyDropdownRef}>
            <button
              onClick={() => setIsCompanyOpen(!isCompanyOpen)}
              disabled={isSwitching}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border border-zinc-200 transition-all text-sm font-semibold active:scale-95 disabled:opacity-50"
            >
              {isSwitching ? (
                <Loader2 size={16} className="animate-spin text-zinc-500" />
              ) : (
                <Building size={16} className="text-zinc-500" />
              )}
              <span>{user.companyName}</span>
              <ChevronDown size={16} className={`text-zinc-400 transition-transform ${isCompanyOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCompanyOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-zinc-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-2 border-b border-zinc-100">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Mis Empresas</span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {user.companies.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSwitchCompany(c.id)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between font-medium ${
                        c.id === user.companyId
                          ? 'bg-indigo-50 text-indigo-700 font-bold border-r-2 border-indigo-600'
                          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                      }`}
                    >
                      <span>{c.name}</span>
                      {c.id === user.companyId && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-zinc-500 text-sm font-semibold">
            <Building size={16} className="text-zinc-400" />
            <span>{user.companyName}</span>
          </div>
        )}

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-1 px-3 rounded-full hover:bg-zinc-50 transition-all border border-transparent hover:border-zinc-200"
          >
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-sm font-bold text-zinc-900 leading-tight">{user.name}</span>
              <span className="text-xs text-zinc-500 font-medium">{user.role}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
              <User size={18} />
            </div>
            <ChevronDown size={16} className={isProfileOpen ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-zinc-200 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* User Info Section */}
              <div className="px-4 py-4 border-b border-zinc-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <User size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-zinc-900 leading-tight">{user.name}</span>
                  <span className="text-sm text-zinc-500">{user.email}</span>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <Link
                  href="/perfil"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors border-l-2 border-transparent hover:border-blue-600"
                >
                  <Settings size={18} className="text-blue-500" />
                  Perfil
                </Link>
              </div>

              <div className="border-t border-zinc-100 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut size={18} />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
