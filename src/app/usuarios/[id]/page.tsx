'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { UserForm } from '@/components/Users/components/UserForm';
import { UserService } from '@/components/Users/services/user.service';
import { User } from '@/components/Users/types';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { PermissionCode } from '@/shared/constants/permissions';
import { Loader2 } from 'lucide-react';

export default function EditUserPage() {
  const params = useParams();
  const id = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await UserService.getUserById(id);
        setUser(data);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="animate-spin text-zinc-900" size={40} />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-zinc-900">Usuario no encontrado</h2>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.UPDATE_USERS} redirectTo="/usuarios">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Editar Usuario</h1>
            <p className="text-sm text-zinc-500">Modifica los permisos y datos del usuario.</p>
          </div>
          <UserForm initialData={user} isEditing />
        </div>
      </PermissionGuard>
    </MainLayout>
  );
}
