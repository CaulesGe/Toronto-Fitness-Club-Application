// API Configuration
// Read the backend base URL from the build/runtime environment. When building the
// frontend image we can pass REACT_APP_API_BASE_URL to inject the correct backend
// route (for example https://tfc-backend-...); otherwise fall back to '/api' for
// local development (you can use `npm start` with a proxy or run the backend on
// the same origin).

// production
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

//local development
// export const API_BASE_URL = 'http://localhost:8000';