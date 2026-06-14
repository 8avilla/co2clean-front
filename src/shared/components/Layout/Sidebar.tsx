'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LogOut,
  Building2,
  User,
  ShieldCheck,
  Leaf,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AuthService } from '@/components/Auth/services/auth.service';
import { usePermission } from '@/shared/hooks/usePermission';
import { PermissionCode } from '@/shared/constants/permissions';
import { useSidebar } from './SidebarContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  activeClass: string;
  isCollapsed: boolean;
  onClick?: () => void;
}

const NavItem = ({ href, icon, label, isActive, activeClass, isCollapsed, onClick }: NavItemProps) => (
  <Link
    href={href}
    onClick={onClick}
    title={isCollapsed ? label : undefined}
    className={cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
      isCollapsed ? 'justify-center px-2' : '',
      isActive ? activeClass : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
    )}
  >
    <span className="flex-shrink-0">{icon}</span>
    {!isCollapsed && <span>{label}</span>}
  </Link>
);

export const Sidebar = () => {
  const pathname = usePathname();
  const { hasPermission } = usePermission();
  const { isCollapsed, isOpen, toggleCollapsed, closeSidebar } = useSidebar();

  const handleLogout = () => {
    AuthService.logout();
    window.location.href = '/login';
  };

  const handleNavClick = () => {
    // Close mobile drawer after navigation
    closeSidebar();
  };

  const isHuellaActive = pathname.startsWith('/huella-carbono');
  const isSettingsActive = pathname.startsWith('/configuracion');

  return (
    <aside
      className={cn(
        // Base styles
        'h-screen bg-white border-r border-zinc-200 flex flex-col fixed left-0 top-0 overflow-y-auto z-40 transition-all duration-300',
        // Mobile: hidden by default, visible as drawer when isOpen
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'md:translate-x-0',
        // Width: collapsed = 72px, expanded = 256px
        isCollapsed ? 'md:w-[72px]' : 'md:w-64',
        // Mobile always full width drawer
        'w-64',
      )}
    >
      {/* Logo + Collapse Toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-100 flex-shrink-0">
        {!isCollapsed && (
          <img
            src="/logo-app.png?v=2"
            alt="EcoCore Logo"
            className="h-6 w-auto object-contain"
          />
        )}
        <button
          onClick={toggleCollapsed}
          title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          className={cn(
            'hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors flex-shrink-0',
            isCollapsed ? 'mx-auto' : 'ml-auto'
          )}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        {/* Mobile: show logo always, no collapse button */}
        <img
          src="/logo-app.png?v=2"
          alt="EcoCore Logo"
          className="h-6 w-auto object-contain md:hidden"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        <NavItem
          href="/"
          icon={<Home size={18} className={pathname === '/' ? 'text-blue-600' : 'text-zinc-400'} />}
          label="Inicio"
          isActive={pathname === '/'}
          activeClass="bg-blue-50 text-blue-600"
          isCollapsed={isCollapsed}
          onClick={handleNavClick}
        />

        {hasPermission(PermissionCode.VIEW_COMPANIES) && (
          <NavItem
            href="/empresas"
            icon={<Building2 size={18} className={pathname.startsWith('/empresas') ? 'text-teal-600' : 'text-zinc-400'} />}
            label="Empresas"
            isActive={pathname.startsWith('/empresas')}
            activeClass="bg-teal-50 text-teal-600"
            isCollapsed={isCollapsed}
            onClick={handleNavClick}
          />
        )}

        {hasPermission(PermissionCode.VIEW_USERS) && (
          <NavItem
            href="/usuarios"
            icon={<User size={18} className={pathname.startsWith('/usuarios') ? 'text-white' : 'text-zinc-400'} />}
            label="Usuarios"
            isActive={pathname.startsWith('/usuarios')}
            activeClass="bg-zinc-900 text-white"
            isCollapsed={isCollapsed}
            onClick={handleNavClick}
          />
        )}

        {hasPermission(PermissionCode.VIEW_ROLES) && (
          <NavItem
            href="/roles"
            icon={<ShieldCheck size={18} className={pathname.startsWith('/roles') ? 'text-blue-600' : 'text-zinc-400'} />}
            label="Roles y Permisos"
            isActive={pathname.startsWith('/roles')}
            activeClass="bg-blue-50 text-blue-600"
            isCollapsed={isCollapsed}
            onClick={handleNavClick}
          />
        )}

        {/* Huella de Carbono group */}
        {(hasPermission(PermissionCode.VIEW_CARBON_FOOTPRINT) ||
          hasPermission(PermissionCode.VIEW_CARBON_FOOTPRINT_ANALYSIS)) && (
          <div className="space-y-1">
            {isCollapsed ? (
              <Link
                href="/huella-carbono"
                title="Huella de Carbono"
                onClick={handleNavClick}
                className={cn(
                  'flex justify-center px-2 py-2.5 rounded-lg transition-colors',
                  isHuellaActive ? 'bg-emerald-50 text-emerald-600' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                )}
              >
                <Leaf size={18} className={isHuellaActive ? 'text-emerald-600' : 'text-zinc-400'} />
              </Link>
            ) : (
              <>
                <div className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                  isHuellaActive ? 'bg-emerald-50 text-emerald-600' : 'text-zinc-600'
                )}>
                  <Leaf size={18} className={isHuellaActive ? 'text-emerald-600' : 'text-zinc-400'} />
                  Huella de Carbono
                </div>

                <div className="pl-8 pr-2 space-y-1">
                  {hasPermission(PermissionCode.VIEW_CARBON_FOOTPRINT) && (
                    <Link
                      href="/huella-carbono"
                      onClick={handleNavClick}
                      className={cn(
                        'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        pathname === '/huella-carbono' || pathname === '/huella-carbono/nueva'
                          ? 'text-emerald-600 bg-emerald-50/50'
                          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                      )}
                    >
                      Emisiones de huella de carbono
                    </Link>
                  )}

                  {hasPermission(PermissionCode.VIEW_CARBON_FOOTPRINT_ANALYSIS) && (
                    <Link
                      href="/huella-carbono/analisis"
                      onClick={handleNavClick}
                      className={cn(
                        'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        pathname.startsWith('/huella-carbono/analisis') && !pathname.includes('/parametros')
                          ? 'text-emerald-600 bg-emerald-50/50'
                          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                      )}
                    >
                      Análisis huella de carbono
                    </Link>
                  )}


                </div>
              </>
            )}
          </div>
        )}
        {/* Configuración group */}
        {(hasPermission(PermissionCode.MANAGE_GASES) ||
          hasPermission(PermissionCode.MANAGE_EMISSION_SOURCES) ||
          hasPermission(PermissionCode.MANAGE_EMISSION_SOURCE_CATEGORIES)) && (
          <div className="space-y-1">
            {isCollapsed ? (
              <Link
                href="/configuracion/gases"
                title="Configuración"
                onClick={handleNavClick}
                className={cn(
                  'flex justify-center px-2 py-2.5 rounded-lg transition-colors',
                  isSettingsActive ? 'bg-violet-50 text-violet-600' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                )}
              >
                <Settings size={18} className={isSettingsActive ? 'text-violet-600' : 'text-zinc-400'} />
              </Link>
            ) : (
              <>
                <div className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                  isSettingsActive ? 'bg-violet-50 text-violet-600' : 'text-zinc-600'
                )}>
                  <Settings size={18} className={isSettingsActive ? 'text-violet-600' : 'text-zinc-400'} />
                  Configuración
                </div>

                <div className="pl-8 pr-2 space-y-1">
                  {hasPermission(PermissionCode.MANAGE_GASES) && (
                    <Link
                      href="/configuracion/gases"
                      onClick={handleNavClick}
                      className={cn(
                        'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        pathname === '/configuracion/gases'
                          ? 'text-violet-600 bg-violet-50/50'
                          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                      )}
                    >
                      Gases
                    </Link>
                  )}

                  {hasPermission(PermissionCode.MANAGE_EMISSION_SOURCES) && (
                    <Link
                      href="/configuracion/fuentes-emision"
                      onClick={handleNavClick}
                      className={cn(
                        'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        pathname === '/configuracion/fuentes-emision'
                          ? 'text-violet-600 bg-violet-50/50'
                          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                      )}
                    >
                      Fuentes de Emisión
                    </Link>
                  )}

                  {hasPermission(PermissionCode.MANAGE_EMISSION_SOURCE_CATEGORIES) && (
                    <Link
                      href="/configuracion/categorias-fuentes"
                      onClick={handleNavClick}
                      className={cn(
                        'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        pathname === '/configuracion/categorias-fuentes'
                          ? 'text-violet-600 bg-violet-50/50'
                          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                      )}
                    >
                      Categorías de Fuentes
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-zinc-100">
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Cerrar Sesión' : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 hover:bg-red-50 hover:text-red-600 transition-colors',
            isCollapsed ? 'justify-center px-2' : ''
          )}
        >
          <LogOut size={18} className="text-zinc-400 flex-shrink-0" />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};
