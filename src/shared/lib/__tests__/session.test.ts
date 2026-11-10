import { describe, it, expect, beforeEach } from 'vitest';
import { getActiveCompany, getActiveCompanyId, getCurrentUserId, getStoredUser } from '../session';

describe('session', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('debería devolver undefined cuando no hay sesión guardada', () => {
    expect(getStoredUser()).toBeUndefined();
    expect(getActiveCompany()).toBeNull();
    expect(getActiveCompanyId()).toBeUndefined();
    expect(getCurrentUserId()).toBeUndefined();
  });

  it('debería leer el usuario, su id y la empresa activa', () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 'u1', name: 'Ana', company: { id: 'c1', name: 'EcoCore' }, permissions: ['A'] }),
    );
    expect(getStoredUser()).toMatchObject({ id: 'u1', name: 'Ana', permissions: ['A'] });
    expect(getCurrentUserId()).toBe('u1');
    expect(getActiveCompany()).toEqual({ id: 'c1', name: 'EcoCore' });
    expect(getActiveCompanyId()).toBe('c1');
  });

  it('debería devolver null en la empresa cuando el usuario no tiene empresa activa', () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u1', company: null }));
    expect(getActiveCompany()).toBeNull();
    expect(getActiveCompanyId()).toBeUndefined();
  });

  it('debería tolerar JSON malformado sin lanzar', () => {
    localStorage.setItem('user', '{not json');
    expect(getStoredUser()).toBeUndefined();
    expect(getActiveCompany()).toBeNull();
  });
});
