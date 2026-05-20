'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  LogOut,
  Building2,
  User,
  ShieldCheck,
  Leaf
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AuthService } from '@/components/Auth/services/auth.service';
import { usePermission } from '@/shared/hooks/usePermission';
import { PermissionCode } from '@/shared/constants/permissions';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Sidebar = () => {
  const pathname = usePathname();
  const { hasPermission } = usePermission();

  const handleLogout = () => {
    AuthService.logout();
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 h-screen bg-white border-r border-zinc-200 flex flex-col fixed left-0 top-0 overflow-y-auto z-20">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-100 flex-shrink-0">
        <Image
          src="/logo-app.png"
          alt="CleanCO2 Logo"
          width={220}
          height={180}
          className="object-contain"
          style={{ width: 'auto', height: 'auto' }}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {/* Inicio */}
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            pathname === '/'
              ? "bg-blue-50 text-blue-600"
              : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
          )}
        >
          <Home size={18} className={pathname === '/' ? "text-blue-600" : "text-zinc-400"} />
          Inicio
        </Link>

        {/* Empresas */}
        {hasPermission(PermissionCode.VIEW_COMPANIES) && (
          <Link
            href="/empresas"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith('/empresas')
                ? "bg-teal-50 text-teal-600"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            )}
          >
            <Building2 size={18} className={pathname.startsWith('/empresas') ? "text-teal-600" : "text-zinc-400"} />
            Empresas
          </Link>
        )}

        {/* Usuarios */}
        {hasPermission(PermissionCode.VIEW_USERS) && (
          <Link
            href="/usuarios"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith('/usuarios')
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            )}
          >
            <User size={18} className={pathname.startsWith('/usuarios') ? "text-white" : "text-zinc-400"} />
            Usuarios
          </Link>
        )}

        {/* Roles y Permisos */}
        {hasPermission(PermissionCode.VIEW_ROLES) && (
          <Link
            href="/roles"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith('/roles')
                ? "bg-blue-50 text-blue-600"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            )}
          >
            <ShieldCheck size={18} className={pathname.startsWith('/roles') ? "text-blue-600" : "text-zinc-400"} />
            Roles y Permisos
          </Link>
        )}

        {/* Huella de Carbono */}
        {hasPermission(PermissionCode.VIEW_CARBON_FOOTPRINT) ||
         hasPermission(PermissionCode.VIEW_CARBON_FOOTPRINT_ANALYSIS) ||
         hasPermission(PermissionCode.MANAGE_EMISSION_FACTORS) ? (
          <div className="space-y-1">
            <div
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith('/huella-carbono')
                  ? "bg-emerald-50 text-emerald-600"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              <div className="flex items-center gap-3">
                <Leaf size={18} className={pathname.startsWith('/huella-carbono') ? "text-emerald-600" : "text-zinc-400"} />
                Huella de Carbono
              </div>
            </div>

            <div className="pl-9 pr-2 space-y-1 mt-1">
              {hasPermission(PermissionCode.VIEW_CARBON_FOOTPRINT) && (
                <Link
                  href="/huella-carbono"
                  className={cn(
                    "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === '/huella-carbono' || pathname === '/huella-carbono/nueva'
                      ? "text-emerald-600 bg-emerald-50/50"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                  )}
                >
                  Registro de emisiones
                </Link>
              )}

              {hasPermission(PermissionCode.VIEW_CARBON_FOOTPRINT_ANALYSIS) && (
                <Link
                  href="/huella-carbono/analisis"
                  className={cn(
                    "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname.startsWith('/huella-carbono/analisis') && !pathname.includes('/parametros')
                      ? "text-emerald-600 bg-emerald-50/50"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                  )}
                >
                  Análisis huella de carbono
                </Link>
              )}

              {hasPermission(PermissionCode.MANAGE_EMISSION_FACTORS) && (
                <Link
                  href="/huella-carbono/parametros"
                  className={cn(
                    "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === '/huella-carbono/parametros'
                      ? "text-emerald-600 bg-emerald-50/50"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                  )}
                >
                  Factores de emisión
                </Link>
              )}
            </div>
          </div>
        ) : null}

      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-zinc-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} className="text-zinc-400 group-hover:text-red-500" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};
