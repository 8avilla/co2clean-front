import { describe, it, expect } from 'vitest';
import { CompanySchema } from '../index';

const validCompany = {
  name: 'EcoCore SAS',
  nit: '890.903.938-8',
  email: 'info@ecocore.co',
  departmentId: 'd1',
  municipalityId: 'm1',
  address: 'Carrera 50 # 10 - 20',
};

const getNitMessage = (nit: string): string | undefined => {
  const result = CompanySchema.safeParse({ ...validCompany, nit });
  return result.success ? undefined : result.error.issues.find(i => i.path[0] === 'nit')?.message;
};

describe('CompanySchema', () => {
  it('debería aceptar una empresa válida', () => {
    expect(CompanySchema.safeParse(validCompany).success).toBe(true);
  });

  it('debería aceptar un NIT sin dígito de verificación', () => {
    expect(getNitMessage('890903938')).toBeUndefined();
  });

  it('debería rechazar un NIT con formato inválido', () => {
    expect(getNitMessage('ABC-123456')).toContain('Formato inválido');
  });

  it('debería rechazar un dígito de verificación incorrecto', () => {
    expect(getNitMessage('890.903.938-1')).toContain('dígito de verificación');
  });
});
