'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { RoleForm } from '@/components/Roles/components/RoleForm';
import { RoleService } from '@/components/Roles/services/role.service';
import { Role } from '@/components/Roles/types';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { PermissionCode } from '@/shared/constants/permissions';
import { Loader2 } from 'lucide-react';

export default function EditRolePage() {
  const params = useParams();
  const id = params.id as string;
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const data = await RoleService.getRoleById(id);
        setRole(data);
      } catch (error) {
        console.error('Error fetching role:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      </MainLayout>
    );
  }

  if (!role) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-zinc-900">Rol no encontrado</h2>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.MANAGE_ROLES} redirectTo="/roles">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Editar Rol: {role.name}</h1>
            <p className="text-sm text-zinc-500">Ajusta los permisos asociados a este rol.</p>
          </div>
          <RoleForm initialData={role} isEditing />
        </div>
      </PermissionGuard>
    </MainLayout>
  );
}
