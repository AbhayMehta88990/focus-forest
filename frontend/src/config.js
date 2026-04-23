// In production (Vercel), use relative URLs so requests go through Vercel's proxy
// In development, use localhost backend directly
const isDev = !import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND_URL === '';
const backendUrl = isDev ? 'http://localhost:3001' : '';

// BASE_URL: empty string in production = relative URLs = same-origin (no CORS issues)
export const BASE_URL = backendUrl;
export const API_URL = `${backendUrl}/api`;

// WebSocket must connect directly to Render (Vercel doesn't proxy WebSockets)
const wsBackend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
export const WS_URL = wsBackend.replace(/^http/, 'ws') + '/ws';
