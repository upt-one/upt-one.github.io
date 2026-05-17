// Build-time environment flags exposed via Vite's import.meta.env.
//
// VITE_USE_MOCK: when true, dashboard bypasses MSAL login + Graph fetch
// and uses fixtures from dashboard/mocks/ instead. Useful for local dev
// without an M365 login and for tests.
//
// Set via: VITE_USE_MOCK=1 npm run dev
// Or use the npm script: npm run dev:mock

export const useMock = !!import.meta.env.VITE_USE_MOCK;
