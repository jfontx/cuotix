import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const spec = fs.readFileSync(path.resolve(root, '../docs/openapi.yaml'), 'utf8');

// Prefijo con el que `app.ts` monta cada router
const MOUNTS: Record<string, string> = {
  auth: '/auth',
  me: '/me',
  services: '/services',
  groups: '/groups',
  memberships: '/memberships',
  notifications: '/notifications',
  payments: '/payments',
  ratings: '/ratings',
  reports: '/reports',
  users: '/users',
};

function routesInCode() {
  const found: string[] = [];
  for (const [file, prefix] of Object.entries(MOUNTS)) {
    const src = fs.readFileSync(path.join(root, 'src/routes', `${file}.ts`), 'utf8');
    for (const m of src.matchAll(/router\.(get|post|patch|put|delete)\(\s*'([^']*)'/g)) {
      const sub = m[2] === '/' ? '' : m[2].replace(/:(\w+)/g, '{$1}');
      found.push(`${m[1]} ${prefix}${sub}`);
    }
  }
  return found;
}

/** Operaciones declaradas en el YAML como `METHOD path` (parser mínimo para no añadir dependencias). */
function routesInSpec() {
  const found: string[] = [];
  let current = '';
  for (const line of spec.split('\n')) {
    if (line.startsWith('components:')) break;
    const p = line.match(/^ {2}(\/\S*):\s*$/);
    if (p) current = p[1];
    const m = line.match(/^ {4}(get|post|patch|put|delete):\s*$/);
    if (m && current) found.push(`${m[1]} ${current}`);
  }
  return found;
}

describe('OpenAPI', () => {
  it('documenta todos los endpoints del código', () => {
    const documented = new Set(routesInSpec());
    const missing = routesInCode().filter((r) => !documented.has(r));
    expect(missing).toEqual([]);
  });

  it('no documenta endpoints que ya no existen', () => {
    const real = new Set([...routesInCode(), 'get /health']);
    expect(routesInSpec().filter((r) => !real.has(r))).toEqual([]);
  });

  it('declara versión de OpenAPI y esquema de seguridad Bearer', () => {
    expect(spec).toMatch(/^openapi: 3\.0\.3/m);
    expect(spec).toContain('bearerAuth');
  });
});
