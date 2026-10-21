// Build-time environment flags exposed via Vite's import.meta.env.
//
// VITE_USE_MOCK: when true, dashboard bypasses MSAL login + Graph fetch
// and uses fixtures from dashboard/mocks/ instead. Useful for local dev
// without an M365 login and for tests.
//
// Set via: VITE_USE_MOCK=1 npm run dev
// Or use the npm script: npm run dev:mock

export const useMock = !!import.meta.env.VITE_USE_MOCK;

// VITE_LOCAL_DATA: local real-data run, no sign-in. MSAL is skipped and the Graph read goes to
// the dev server's /__graph proxy, which holds the token (scripts/dev-local.ps1).
export const useLocalData = !!import.meta.env.VITE_LOCAL_DATA;
