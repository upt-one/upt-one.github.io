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

// Fixtures auto-load via import.meta.glob (closes the #10 manual-import ritual):
// in THIS repo mocks/*.json exist and get bundled for dev/CI; on upt-one.github.io
// the mocks/ dir does not travel with the shipped source, the glob matches nothing
// at build time, and mockData is {} with zero fixture bytes in the public build.
// Capture fixtures with scripts/capture-mock-fixtures.ps1 (+ the #46 enricher while
// the feeds' division column rolls out).
const fixtures = import.meta.glob('../../../mocks/*.json', { eager: true, import: 'default' });
export const mockData = Object.assign({}, ...Object.values(fixtures));
