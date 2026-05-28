'use client';

import React from 'react';
import Image from 'next/image';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { LoginSchema, LoginFormData } from '../types';
import { useLogin } from '../hooks/useLogin';

/**
 * Utility for tailwind class merging.
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Interactive login form component.
 * Features validation feedback, visibility toggling for passwords, and loading states.
 */
export const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const { login, isLoading } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    await login(data);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col items-center sm:items-start gap-6">
        <img
          src="/logo-app.png?v=2"
          alt="EcoCore Logo"
          width={280}
          height={220}
          className="object-contain"
          style={{ width: 'auto', height: 'auto' }}
        />
        <div className="space-y-2 text-center sm:text-left">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Bienvenido de nuevo
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Ingrese sus credenciales para acceder a su cuenta.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-700 dark:text-zinc-300"
            >
              Correo Electrónico
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-3 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-50 transition-colors">
                <Mail size={16} />
              </div>
              <input
                {...register('email')}
                id="email"
                placeholder="nombre@empresa.com"
                type="email"
                autoComplete="email"
                className={cn(
                  "flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-10 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 transition-all",
                  errors.email && "border-red-500 focus-visible:ring-red-500"
                )}
              />
            </div>
            {errors.email && (
              <p className="text-[0.8rem] font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium leading-none text-zinc-700 dark:text-zinc-300"
              >
                Contraseña
              </label>
              <a
                href="#"
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 underline-offset-4 hover:underline"
              >
                ¿Olvidó su contraseña?
              </a>
            </div>
            <div className="relative group">
              <div className="absolute left-3 top-3 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-50 transition-colors">
                <Lock size={16} />
              </div>
              <input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={cn(
                  "flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-10 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 transition-all",
                  errors.password && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 h-4 w-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[0.8rem] font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center space-x-2">
            <input
              {...register('rememberMe')}
              type="checkbox"
              id="remember"
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-300"
            />
            <label
              htmlFor="remember"
              className="text-sm font-medium leading-none text-zinc-600 dark:text-zinc-400 cursor-pointer"
            >
              Recordarme en este dispositivo
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="relative flex w-full h-11 items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus:ring-zinc-300 active:scale-[0.98]"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Iniciar Sesión'
          )}
        </button>
      </form>

      <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        ¿Aún no tiene una cuenta?{' '}
        <a
          href="#"
          className="font-semibold text-zinc-900 dark:text-zinc-50 underline-offset-4 hover:underline"
        >
          Contacte con soporte
        </a>
      </div>
    </div>
  );
};
