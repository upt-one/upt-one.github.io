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

// mockData stays empty in committed code — IMPORTANT: do NOT commit
// imports of /mocks/*.json from here. The deploy workflow ships this
// file to upt-one.github.io (public) and the mocks/ dir does NOT travel
// with it, so the build fails on upt-one. For local mock-mode dev,
// temporarily add imports of the fixtures (captured via
// /scripts/capture-mock-fixtures.sh) and revert before commit:
//
//   import billing from '../../../mocks/BillingV1.json';
//   import maintenance from '../../../mocks/MaintenanceV1.json';
//   import operations from '../../../mocks/OperationsV1.json';
//   export const mockData = Object.assign({}, billing, maintenance, operations);
//
// Follow-up: gated-conditional import or a `mock.local.js` pattern so
// local fixtures don't require manual revert. Tracked under #10.
export const mockData = {};
