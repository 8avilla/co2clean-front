import { describe, it, expect } from 'vitest';
import type { ApiCompany, ApiHeadquarter } from '../../types';
import {
  CompanyListItem,
  countHeadquartersByCompany,
  matchesCompanySearch,
  normalizeSearchText,
  sortCompanies,
} from '../company-list.utils';

const buildCompany = (overrides: Partial<ApiCompany> = {}): ApiCompany => ({
  id: 'c1',
  name: 'EcoCore SAS',
  nit: '900.123.456-7',
  email: 'info@ecocore.co',
  ...overrides,
});

const buildItem = (overrides: Partial<CompanyListItem> = {}): CompanyListItem => ({
  ...buildCompany(),
  headquartersCount: 0,
  ...overrides,
});

describe('company-list.utils', () => {
  describe('normalizeSearchText', () => {
    it('debería quitar tildes y pasar a minúsculas', () => {
      expect(normalizeSearchText('  Bogotá D.C. ')).toBe('bogota d.c.');
    });
  });

  describe('countHeadquartersByCompany', () => {
    it('debería contar las sedes por empresa', () => {
      const headquarters = [
        { id: 'h1', name: 'A', companyId: 'c1' },
        { id: 'h2', name: 'B', companyId: 'c1' },
        { id: 'h3', name: 'C', companyId: 'c2' },
      ] as ApiHeadquarter[];
      const counts = countHeadquartersByCompany(headquarters);
      expect(counts.get('c1')).toBe(2);
      expect(counts.get('c2')).toBe(1);
      expect(counts.get('c3')).toBeUndefined();
    });
  });

  describe('matchesCompanySearch', () => {
    it('debería coincidir con todo cuando la búsqueda está vacía', () => {
      expect(matchesCompanySearch(buildCompany(), '   ')).toBe(true);
    });

    it('debería buscar por nombre sin importar tildes ni mayúsculas', () => {
      const company = buildCompany({ name: 'Cámara de Comercio' });
      expect(matchesCompanySearch(company, 'camara')).toBe(true);
      expect(matchesCompanySearch(company, 'CÁMARA')).toBe(true);
    });

    it('debería buscar por NIT sin importar puntos ni guiones', () => {
      const company = buildCompany({ nit: '900.123.456-7' });
      expect(matchesCompanySearch(company, '900123456')).toBe(true);
      expect(matchesCompanySearch(company, '900.123')).toBe(true);
      expect(matchesCompanySearch(company, '111')).toBe(false);
    });

    it('debería buscar por correo', () => {
      expect(matchesCompanySearch(buildCompany(), 'ecocore.co')).toBe(true);
    });

    it('no debería coincidir por NIT cuando la búsqueda no tiene dígitos', () => {
      expect(matchesCompanySearch(buildCompany({ name: 'Otra', email: 'x@y.co' }), '---')).toBe(false);
    });
  });

  describe('sortCompanies', () => {
    const items = [
      buildItem({ id: '1', name: 'Zeta', nit: '900.000.002-1', headquartersCount: 1 }),
      buildItem({ id: '2', name: 'Álamo', nit: '900.000.010-1', headquartersCount: 5 }),
      buildItem({ id: '3', name: 'Beta', nit: '900.000.003-1', headquartersCount: 0 }),
    ];

    it('debería ordenar por nombre ascendente respetando tildes', () => {
      expect(sortCompanies(items, 'name', 'asc').map(i => i.id)).toEqual(['2', '3', '1']);
    });

    it('debería ordenar por nombre descendente', () => {
      expect(sortCompanies(items, 'name', 'desc').map(i => i.id)).toEqual(['1', '3', '2']);
    });

    it('debería ordenar el NIT de forma numérica', () => {
      expect(sortCompanies(items, 'nit', 'asc').map(i => i.id)).toEqual(['1', '3', '2']);
    });

    it('debería ordenar por cantidad de sedes', () => {
      expect(sortCompanies(items, 'headquarters', 'desc').map(i => i.id)).toEqual(['2', '1', '3']);
    });

    it('no debería modificar el arreglo original', () => {
      const copy = [...items];
      sortCompanies(items, 'name', 'asc');
      expect(items).toEqual(copy);
    });
  });
});
