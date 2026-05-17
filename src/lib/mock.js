// Mock data + auth stubs for VITE_USE_MOCK mode.
//
// When VITE_USE_MOCK=true, auth.js + data.js short-circuit through this
// module instead of running the real MSAL + Graph flow. Lets you `npm run dev`
// without an M365 login and see the dashboard rendering against seeded data.
//
// FIXTURES: drop JSON files in dashboard/mocks/<name>.json — captured from
// real production drive outputs (zipped feed-agent artifacts). Each file is
// imported here and merged into a single data object the same shape getData
// produces in production. See dashboard/mocks/README.md for capture steps.

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
// Example (once dashboard/mocks/billing.json exists):
//   import billing from '../../mocks/billing.json';
//   export const mockData = Object.assign({}, billing);
//
// Until fixtures are captured, mockData is an empty object — the dashboard
// will render section frames but no tile data.
export const mockData = {};
