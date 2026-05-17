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

// Merged mock data — real production zips, captured via
// /scripts/capture-mock-fixtures.sh. Lives at /mocks/<DatasetName>.json
// at repo root (outside dashboard/ so it never ships to upt-one).
// Each file's shape is already what data.set() expects: top-level keys
// = dataset names, each pointing to { tds, <TableName>: [...rows] }.
import billing from '../../../mocks/BillingV1.json';
import maintenance from '../../../mocks/MaintenanceV1.json';
import operations from '../../../mocks/OperationsV1.json';
import safety from '../../../mocks/SafetyV2.json';
export const mockData = Object.assign({}, billing, maintenance, operations, safety);
