import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserCompaniesPanel } from '../UserCompaniesPanel';
import { UserService } from '../../services/user.service';
import { CompanyService } from '@/components/Companies/services/company.service';
import { RoleService } from '@/components/Roles/services/role.service';
import { confirmDelete } from '@/shared/lib/confirm-dialog';
import type { ApiUserCompany } from '../../types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/shared/lib/confirm-dialog', () => ({ confirmDelete: vi.fn() }));
vi.mock('../../services/user.service', () => ({
  UserService: {
    getUserCompanies: vi.fn(),
    associateCompany: vi.fn(),
    disassociateCompany: vi.fn(),
  },
}));
vi.mock('@/components/Companies/services/company.service', () => ({
  CompanyService: { getCompanies: vi.fn() },
}));
vi.mock('@/components/Roles/services/role.service', () => ({
  RoleService: { getRoles: vi.fn() },
}));

const association: ApiUserCompany = {
  id: 'a1',
  userId: 'u1',
  companyId: 'c1',
  roleId: 'r1',
  company: { id: 'c1', name: 'EcoCore', nit: '1' },
  role: { id: 'r1', name: 'Auditor' },
  createdAt: '',
  updatedAt: '',
};

describe('UserCompaniesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(CompanyService.getCompanies).mockResolvedValue([
      { id: 'c1', name: 'EcoCore', nit: '1', email: 'a@b.co' },
      { id: 'c2', name: 'Cámara', nit: '2', email: 'c@d.co' },
    ]);
    vi.mocked(RoleService.getRoles).mockResolvedValue([
      { id: 'r1', name: 'Auditor' },
    ] as Awaited<ReturnType<typeof RoleService.getRoles>>);
    vi.mocked(UserService.getUserCompanies).mockResolvedValue([association]);
  });

  it('debería listar las empresas asociadas y reportar el conteo', async () => {
    const onCountChange = vi.fn();
    render(<UserCompaniesPanel userId="u1" onCountChange={onCountChange} />);
    expect(await screen.findByText('Auditor', { selector: 'span' })).toBeInTheDocument();
    await waitFor(() => expect(onCountChange).toHaveBeenLastCalledWith(1));
  });

  it('debería ofrecer solo las empresas aún no asociadas', async () => {
    render(<UserCompaniesPanel userId="u1" />);
    const select = await screen.findByLabelText('Empresa');
    await waitFor(() => expect(select).toHaveTextContent('Cámara'));
    expect(select).not.toHaveTextContent('EcoCore');
  });

  it('debería asociar una empresa con su rol', async () => {
    vi.mocked(UserService.associateCompany).mockResolvedValue(association);
    render(<UserCompaniesPanel userId="u1" />);
    const company = await screen.findByLabelText('Empresa');
    await waitFor(() => expect(company).toHaveTextContent('Cámara'));
    await userEvent.selectOptions(company, 'c2');
    await userEvent.selectOptions(screen.getByLabelText('Rol en esta Empresa'), 'r1');
    await userEvent.click(screen.getByRole('button', { name: /Asociar/ }));
    await waitFor(() => expect(UserService.associateCompany).toHaveBeenCalledWith('u1', 'c2', 'r1'));
  });

  it('debería pedir confirmación antes de desasociar y respetar la respuesta', async () => {
    vi.mocked(confirmDelete).mockResolvedValue(false);
    render(<UserCompaniesPanel userId="u1" />);
    await userEvent.click(await screen.findByRole('button', { name: 'Desasociar EcoCore' }));
    expect(confirmDelete).toHaveBeenCalled();
    expect(UserService.disassociateCompany).not.toHaveBeenCalled();

    vi.mocked(confirmDelete).mockResolvedValue(true);
    vi.mocked(UserService.disassociateCompany).mockResolvedValue(undefined);
    await userEvent.click(screen.getByRole('button', { name: 'Desasociar EcoCore' }));
    await waitFor(() => expect(UserService.disassociateCompany).toHaveBeenCalledWith('u1', 'c1'));
  });
});
