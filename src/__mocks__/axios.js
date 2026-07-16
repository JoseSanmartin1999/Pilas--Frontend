import { vi } from 'vitest';

const axios = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(() => axios),
    defaults: { headers: { common: {} } },
    interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
    },
};

export default axios;
