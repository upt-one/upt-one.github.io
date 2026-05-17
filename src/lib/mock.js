// Mock data + auth stubs for VITE_USE_MOCK mode.
//
// When VITE_USE_MOCK=true, auth.js + data.js short-circuit through this
// module instead of running the real MSAL + Graph flow. Lets you `npm run dev`
// without an M365 login and see the dashboard rendering against seeded data.
//
// FIXTURES: drop JSON files in /mocks/<name>.json (REPO ROOT, outside
// dashboard/). The deploy workflow only ships an allowlist of files inside
// dashboard/, so fixtures at the repo root can never leak to upt-one.github.io.
// See /mocks/README.md for capture steps + Vite fs.allow config.

// Stub user — what oMsal.getAllAccounts()[0] would return after a successful login.
export const mockUser = {
    username: 'dev@mock.local',
    name: 'Mock Dev User',
    homeAccountId: 'mock-account-id',
    environment: 'login.microsoftonline.com',
    tenantId: '343581ac-7887-44b2-91c3-96c7fc5b4a6d',
    localAccountId: 'mock-local-id',
};

// Stub access token — never sent to a real API in mock mode.
export const mockAccessToken = 'mock-access-token-not-real';

// Merged mock data. Replace this with imports of real fixtures in dashboard/mocks/.
// Shape must match what `data.set(...)` expects in data.js — i.e., what
// getData produces: an object whose top-level keys are dataset names, each
// pointing to { tds: '<timestamp>', <TableName>: [...rows] }.
//
// As fixtures land, import them and Object.assign(...) them here.
//
// Example (once /mocks/billing.json exists at repo root):
//   import billing from '../../../mocks/billing.json';
//   export const mockData = Object.assign({}, billing);
// Note: requires `server.fs.allow: ['../mocks']` (or similar) in
// vite.config.mjs to lift Vite's default project-root sandbox.
//
// Until fixtures are captured, mockData is an empty object — the dashboard
// will render section frames but no tile data.
export const mockData = {};
