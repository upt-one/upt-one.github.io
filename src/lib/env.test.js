// Smoke test for the env module — verifies vitest pipeline works end-to-end
// and that VITE_USE_MOCK is read correctly when set via vitest.config.js's
// test.env block.

import { describe, it, expect } from 'vitest';
import { useMock } from './env';

describe('env', () => {
    it('useMock is true in test environment (vitest.config sets VITE_USE_MOCK=1)', () => {
        expect(useMock).toBe(true);
    });
});
