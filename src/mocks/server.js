import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Shared MSW server instance used across all unit tests
export const server = setupServer(...handlers);
