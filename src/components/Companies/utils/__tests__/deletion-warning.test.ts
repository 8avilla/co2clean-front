import { describe, it, expect } from 'vitest';
import { buildDeletionWarningHtml, hasDependentData } from '../deletion-warning';

describe('deletion-warning', () => {
  it('hasDependentData debería ser falso cuando no hay datos asociados', () => {
    expect(hasDependentData({ headquarters: 0, activityRecords: 0, analyses: 0 })).toBe(false);
  });

  it('hasDependentData debería ser verdadero si hay sedes, registros o análisis', () => {
    expect(hasDependentData({ headquarters: 1, activityRecords: 0, analyses: 0 })).toBe(true);
    expect(hasDependentData({ headquarters: 0, activityRecords: 2, analyses: 0 })).toBe(true);
    expect(hasDependentData({ headquarters: 0, activityRecords: 0, analyses: 3 })).toBe(true);
  });

  it('debería mostrar un mensaje simple cuando no hay datos asociados', () => {
    const html = buildDeletionWarningHtml('EcoCore', { headquarters: 0, activityRecords: 0, analyses: 0 });
    expect(html).toContain('EcoCore');
    expect(html).not.toContain('<li>');
  });

  it('debería listar los datos asociados con singular y plural', () => {
    const html = buildDeletionWarningHtml('EcoCore', { headquarters: 1, activityRecords: 1200, analyses: 2 });
    expect(html).toContain('1 sede<');
    expect(html).toContain('registros de actividad');
    expect(html).toContain('2 análisis de huella de carbono');
  });

  it('debería escapar el HTML del nombre de la empresa', () => {
    const html = buildDeletionWarningHtml('<img src=x onerror=alert(1)>', {
      headquarters: 0,
      activityRecords: 0,
      analyses: 0,
    });
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });
});
