import { config } from "config";

export const environment = {
  production: true,
  // ⚠️ IMPORTANT: Update this with your production backend URL
  // Example: 'https://your-backend-domain.com'
  // Make sure your backend allows CORS from https://ibrahimsaliba.github.io
  apiURL: config.apiUrl // TODO: Replace with production API URL
};