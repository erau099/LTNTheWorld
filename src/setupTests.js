import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Automatically clean up React DOM after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
