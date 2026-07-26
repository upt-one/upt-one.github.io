// Production stand-in for the mock fixtures. vite.config.mjs aliases `$fixtures` here for any
// build that is not mock mode, so the fixture glob is never even resolved and a production
// bundle cannot contain fixture bytes. This is enforced by module resolution, not by
// tree-shaking: an eager import.meta.glob is transformed into static imports before any
// dead-branch elimination could drop it (learned the hard way, #46).
export const fixtures = {}
