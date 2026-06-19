'use client';

// ── Mejora 7: sin namespace React — imports nombrados ──
import { useState, useEffect, type ReactNode } from 'react';
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

// ── Mejora 6: iniciales del usuario ──
const getInitials = (name: string) =>
  name.trim().split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

interface NavItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}

// ── Mejora 1+2: activeClass unificado — teal para todos los ítems ──
const NavItem = ({ href, icon, label, isActive, isCollapsed, onClick }: NavItemProps) => (
  <Link
    href={href}
    onClick={onClick}
    title={isCollapsed ? label : undefined}
    className={cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
      isCollapsed ? 'justify-center px-2' : '',
      isActive
        ? 'bg-teal-50 text-teal-600'
        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
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

  // ── Mejora 6: datos del usuario para mini-perfil ──
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem('user');
      if (!stored) return;
      try {
        const parsed = JSON.parse(stored);
        setUserName(parsed.name ?? '');
        setUserRole(parsed.role ?? '');
      } catch {
        // JSON malformado — ignorar
      }
    };
    loadUser();
    window.addEventListener('user:updated', loadUser);
    return () => window.removeEventListener('user:updated', loadUser);
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    window.location.href = '/login';
  };

  const handleNavClick = () => {
    closeSidebar();
  };

  const isHuellaActive = pathname.startsWith('/huella-carbono');
  const isSettingsActive = pathname.startsWith('/configuracion');

  // ── Mejora 1: icono teal cuando activo, zinc-400 cuando inactivo (hereda de NavItem) ──
  const iconClass = (active: boolean) =>
    active ? 'text-teal-600' : 'text-zinc-400';

  return (
    <aside
      className={cn(
        'h-screen bg-white border-r border-zinc-200 flex flex-col fixed left-0 top-0 overflow-y-auto z-40 transition-all duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'md:translate-x-0',
        isCollapsed ? 'md:w-[72px]' : 'md:w-64',
        'w-64',
      )}
    >
      {/* ── Logo + toggle ── */}
      <div className="h-16 border-b border-zinc-100 flex-shrink-0 flex items-center">
        {/* Desktop */}
        <div className={cn(
          "hidden md:flex items-center w-full",
          isCollapsed ? "px-2 justify-center gap-1.5" : "px-4 justify-between"
        )}>
          {isCollapsed ? (
            <>
              <img
                src="/logo-app.png?v=2"
                alt="EcoCore Logo"
                className="h-6 w-6 object-contain flex-shrink-0"
              />
              <button
                onClick={toggleCollapsed}
                title="Expandir menú"
                className="w-6 h-6 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors flex items-center justify-center flex-shrink-0"
              >
                <ChevronRight size={14} />
              </button>
            </>
          ) : (
            <>
              <img
                src="/logo-app.png?v=2"
                alt="EcoCore Logo"
                className="h-6 w-auto object-contain"
              />
              <button
                onClick={toggleCollapsed}
                title="Colapsar menú"
                className="w-8 h-8 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors flex items-center justify-center flex-shrink-0"
              >
                <ChevronLeft size={16} />
              </button>
            </>
          )}
        </div>
        {/* Mobile: logo siempre visible */}
        <div className="md:hidden flex items-center justify-between w-full px-4">
          <img
            src="/logo-app.png?v=2"
            alt="EcoCore Logo"
            className="h-6 w-auto object-contain"
          />
        </div>
      </div>

      {/* ── Navegación ── */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {/* ── Mejora 1+2: todos los ítems con teal activo ── */}
        <NavItem
          href="/"
          icon={<Home size={18} className={iconClass(pathname === '/')} />}
          label="Inicio"
          isActive={pathname === '/'}
          isCollapsed={isCollapsed}
          onClick={handleNavClick}
        />

        {hasPermission(PermissionCode.VIEW_COMPANIES) && (
          <NavItem
            href="/empresas"
            icon={<Building2 size={18} className={iconClass(pathname.startsWith('/empresas'))} />}
            label="Empresas"
            isActive={pathname.startsWith('/empresas')}
            isCollapsed={isCollapsed}
            onClick={handleNavClick}
          />
        )}

        {hasPermission(PermissionCode.VIEW_USERS) && (
          // ── Mejora 2: "Usuarios" ya no usa bg-zinc-900 text-white ──
          <NavItem
            href="/usuarios"
            icon={<User size={18} className={iconClass(pathname.startsWith('/usuarios'))} />}
            label="Usuarios"
            isActive={pathname.startsWith('/usuarios')}
            isCollapsed={isCollapsed}
            onClick={handleNavClick}
          />
        )}

        {hasPermission(PermissionCode.VIEW_ROLES) && (
          <NavItem
            href="/roles"
            icon={<ShieldCheck size={18} className={iconClass(pathname.startsWith('/roles'))} />}
            label="Roles y Permisos"
            isActive={pathname.startsWith('/roles')}
            isCollapsed={isCollapsed}
            onClick={handleNavClick}
          />
        )}

        {/* Grupo: Huella de Carbono */}
        {(hasPermission(PermissionCode.VIEW_CARBON_FOOTPRINT) ||
          hasPermission(PermissionCode.VIEW_CARBON_FOOTPRINT_ANALYSIS)) && (
          <div className="space-y-1">
            {isCollapsed ? (
              <NavItem
                href="/huella-carbono"
                icon={<Leaf size={18} className={iconClass(isHuellaActive)} />}
                label="Huella de Carbono"
                isActive={isHuellaActive}
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
              />
            ) : (
              <>
                {/* ── Mejora 4: cabecera de grupo como Link ── */}
                <Link
                  href="/huella-carbono"
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isHuellaActive
                      ? 'bg-teal-50/60 text-teal-600'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  )}
                >
                  <Leaf size={18} className={iconClass(isHuellaActive)} />
                  Huella de Carbono
                  <ChevronRight size={14} className="ml-auto opacity-40" />
                </Link>

                <div className="pl-8 pr-2 space-y-1">
                  {hasPermission(PermissionCode.VIEW_CARBON_FOOTPRINT) && (
                    <Link
                      href="/huella-carbono"
                      onClick={handleNavClick}
                      className={cn(
                        'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        pathname === '/huella-carbono' || pathname === '/huella-carbono/nueva'
                          ? 'text-teal-600 bg-teal-50/50'
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
                        pathname.startsWith('/huella-carbono/analisis') &&
                          !pathname.includes('/parametros') &&
                          !pathname.startsWith('/huella-carbono/analisis-v2')
                          ? 'text-teal-600 bg-teal-50/50'
                          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                      )}
                    >
                      Análisis huella de carbono
                    </Link>
                  )}

                  {hasPermission(PermissionCode.VIEW_CARBON_FOOTPRINT_ANALYSIS) && (
                    <Link
                      href="/huella-carbono/analisis-v2"
                      onClick={handleNavClick}
                      className={cn(
                        'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        pathname.startsWith('/huella-carbono/analisis-v2')
                          ? 'text-teal-600 bg-teal-50/50'
                          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                      )}
                    >
                      Análisis V2
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Grupo: Configuración */}
        {(hasPermission(PermissionCode.MANAGE_GASES) ||
          hasPermission(PermissionCode.MANAGE_EMISSION_SOURCES) ||
          hasPermission(PermissionCode.MANAGE_EMISSION_SOURCE_CATEGORIES)) && (
          <div className="space-y-1">
            {isCollapsed ? (
              <NavItem
                href="/configuracion/fuentes-emision"
                icon={<Settings size={18} className={iconClass(isSettingsActive)} />}
                label="Configuración"
                isActive={isSettingsActive}
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
              />
            ) : (
              <>
                {/* ── Mejora 4: cabecera de grupo como Link ── */}
                <Link
                  href="/configuracion/fuentes-emision"
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isSettingsActive
                      ? 'bg-teal-50/60 text-teal-600'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  )}
                >
                  <Settings size={18} className={iconClass(isSettingsActive)} />
                  Configuración
                  <ChevronRight size={14} className="ml-auto opacity-40" />
                </Link>

                <div className="pl-8 pr-2 space-y-1">
                  {hasPermission(PermissionCode.MANAGE_EMISSION_SOURCES) && (
                    <Link
                      href="/configuracion/fuentes-emision"
                      onClick={handleNavClick}
                      className={cn(
                        'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        pathname === '/configuracion/fuentes-emision'
                          ? 'text-teal-600 bg-teal-50/50'
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
                          ? 'text-teal-600 bg-teal-50/50'
                          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                      )}
                    >
                      Categorías de Fuentes
                    </Link>
                  )}

                  {hasPermission(PermissionCode.MANAGE_GASES) && (
                    <Link
                      href="/configuracion/gases"
                      onClick={handleNavClick}
                      className={cn(
                        'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        pathname === '/configuracion/gases'
                          ? 'text-teal-600 bg-teal-50/50'
                          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                      )}
                    >
                      Gases de Efecto Invernadero
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </nav>

      {/* ── Mejora 6: mini-perfil de usuario (útil en mobile) ── */}
      {userName && (
        <div className={cn(
          'border-t border-zinc-100 px-3 py-3',
          isCollapsed ? 'flex justify-center' : 'flex items-center gap-3'
        )}>
          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-black flex-shrink-0 border border-teal-200">
            {getInitials(userName)}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-zinc-900 truncate leading-tight">{userName}</p>
              <p className="text-[10px] text-zinc-500 truncate">{userRole || 'Usuario'}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Logout ── */}
      <div className="p-3 border-t border-zinc-100">
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Cerrar Sesión' : undefined}
          className={cn(
            'group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 hover:bg-red-50 hover:text-red-600 transition-colors',
            isCollapsed ? 'justify-center px-2' : ''
          )}
        >
          <LogOut size={18} className="text-zinc-400 group-hover:text-red-600 flex-shrink-0 transition-colors" />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};
