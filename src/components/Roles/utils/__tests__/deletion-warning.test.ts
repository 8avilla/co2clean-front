import { describe, it, expect } from 'vitest';
import { buildRoleDeletionWarningHtml } from '../deletion-warning';

describe('buildRoleDeletionWarningHtml', () => {
  it('debería indicar que ningún usuario tiene el rol', () => {
    const html = buildRoleDeletionWarningHtml('Auditor', { users: 0 });
    expect(html).toContain('Auditor');
    expect(html).toContain('Ningún usuario');
  });

  it('debería avisar del número de usuarios afectados en singular', () => {
    const html = buildRoleDeletionWarningHtml('Auditor', { users: 1 });
    expect(html).toContain('1 usuario lo tiene');
    expect(html).toContain('se quedará');
  });

  it('debería avisar del número de usuarios afectados en plural', () => {
    const html = buildRoleDeletionWarningHtml('Auditor', { users: 12 });
    expect(html).toContain('12 usuarios lo tienen');
    expect(html).toContain('se quedarán');
  });

  it('debería escapar el HTML del nombre', () => {
    const html = buildRoleDeletionWarningHtml('<b onclick=x>', { users: 0 });
    expect(html).not.toContain('<b onclick');
    expect(html).toContain('&lt;b onclick=x&gt;');
  });
});
