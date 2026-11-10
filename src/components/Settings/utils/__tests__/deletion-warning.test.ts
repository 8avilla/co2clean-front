import { describe, it, expect } from 'vitest';
import {
  buildCategoryDeletionWarningHtml,
  buildGasDeletionWarningHtml,
  buildPlainDeletionHtml,
  buildSourceDeletionWarningHtml,
} from '../deletion-warning';

describe('settings deletion-warning', () => {
  it('buildPlainDeletionHtml debería nombrar el elemento y escapar HTML', () => {
    const html = buildPlainDeletionHtml('el gas', '<i>CO2</i>');
    expect(html).toContain('el gas');
    expect(html).not.toContain('<i>');
    expect(html).toContain('&lt;i&gt;CO2&lt;/i&gt;');
  });

  describe('gas', () => {
    it('debería indicar que no tiene factores', () => {
      expect(buildGasDeletionWarningHtml('Metano', { factors: 0 })).toContain('No tiene factores');
    });

    it('debería listar los factores con singular y plural', () => {
      expect(buildGasDeletionWarningHtml('Metano', { factors: 1 })).toContain('1 factor de emisión');
      expect(buildGasDeletionWarningHtml('Metano', { factors: 14 })).toContain('14 factores de emisión');
    });
  });

  describe('tipo de fuente', () => {
    it('debería indicar que no tiene fuentes', () => {
      expect(buildCategoryDeletionWarningHtml('Combustión', { sources: 0 })).toContain('No tiene fuentes');
    });

    it('debería listar las fuentes asociadas', () => {
      const html = buildCategoryDeletionWarningHtml('Combustión', { sources: 3 });
      expect(html).toContain('3 fuentes de emisión');
      expect(html).toContain('también se verán afectados');
    });
  });

  describe('fuente de emisión', () => {
    it('debería indicar que no tiene datos asociados', () => {
      const html = buildSourceDeletionWarningHtml('Diésel', { factors: 0, commercialUnits: 0 });
      expect(html).toContain('No tiene factores ni unidades comerciales');
    });

    it('debería listar solo lo que existe', () => {
      const onlyFactors = buildSourceDeletionWarningHtml('Diésel', { factors: 2, commercialUnits: 0 });
      expect(onlyFactors).toContain('2 factores de emisión');
      expect(onlyFactors).not.toContain('unidad');

      const both = buildSourceDeletionWarningHtml('Diésel', { factors: 1, commercialUnits: 4 });
      expect(both).toContain('1 factor de emisión');
      expect(both).toContain('4 unidades comerciales');
    });

    it('debería escapar el nombre', () => {
      const html = buildSourceDeletionWarningHtml('<b>x</b>', { factors: 0, commercialUnits: 0 });
      expect(html).not.toContain('<b>x</b>');
    });
  });
});
