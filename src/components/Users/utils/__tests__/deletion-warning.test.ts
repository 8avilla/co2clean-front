import { describe, it, expect } from 'vitest';
import { buildUserDeletionWarningHtml } from '../deletion-warning';

describe('buildUserDeletionWarningHtml', () => {
  it('debería mostrar un mensaje simple sin empresas asociadas', () => {
    const html = buildUserDeletionWarningHtml({
      userName: 'Ana',
      impact: { companies: 0 },
      isCurrentUser: false,
    });
    expect(html).toContain('Ana');
    expect(html).not.toContain('asociado');
    expect(html).toContain('no se puede deshacer');
  });

  it('debería avisar de las empresas asociadas con singular y plural', () => {
    const one = buildUserDeletionWarningHtml({ userName: 'Ana', impact: { companies: 1 }, isCurrentUser: false });
    const many = buildUserDeletionWarningHtml({ userName: 'Ana', impact: { companies: 3 }, isCurrentUser: false });
    expect(one).toContain('1 empresa');
    expect(one).toContain('ella');
    expect(many).toContain('3 empresas');
    expect(many).toContain('ellas');
  });

  it('debería advertir que es la cuenta propia y que se cerrará la sesión', () => {
    const html = buildUserDeletionWarningHtml({ userName: 'Ana', impact: { companies: 0 }, isCurrentUser: true });
    expect(html).toContain('tu propia cuenta');
    expect(html).toContain('cerrará tu sesión');
  });

  it('debería escapar el HTML del nombre', () => {
    const html = buildUserDeletionWarningHtml({
      userName: '<script>alert(1)</script>',
      impact: { companies: 0 },
      isCurrentUser: false,
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
