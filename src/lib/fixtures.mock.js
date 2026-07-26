// Mock-mode fixture loader. Only ever resolved when VITE_USE_MOCK is set (see the $fixtures
// alias in vite.config.mjs). Fixtures live in /mocks at the repo root, outside dashboard/,
// and hold real customer rows, so they must never reach a production build.
export const fixtures = import.meta.glob('../../../mocks/*.json', { eager: true, import: 'default' })
