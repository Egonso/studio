if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  throw new Error('This module can only be imported on the server.');
}

export {};
