import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { AuthService } from '../services/auth.service';
import { LoginFormData } from '../types';

/**
 * Custom hook to manage login state and submission logic.
 * Handles loading states, success redirection, and error messaging.
 */
export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const login = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await AuthService.login(data);
      
      // Store token in cookies (secure only on HTTPS connections)
      Cookies.set('auth-token', response.token, { 
        expires: 7, 
        secure: false, 
        sameSite: 'strict' 
      });

      // Store user info in localStorage for UI consumption
      localStorage.setItem('user', JSON.stringify(response.user));
      
      toast.success('¡Bienvenido!', {
        description: `Has iniciado sesión como ${response.user.name}`,
      });

      // Redirect to dashboard or home
      router.push('/');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      toast.error('Error de inicio de sesión', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    isLoading,
  };
};
