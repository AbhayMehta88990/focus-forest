const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const BASE_URL = backendUrl;
export const API_URL = `${backendUrl}/api`;
export const WS_URL = backendUrl.replace(/^http/, 'ws') + '/ws';
