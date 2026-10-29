// src/config.js
// Backend base URL.
// Set REACT_APP_API_URL in Netlify (Site configuration -> Environment variables)
// or in a local .env file. Falls back to your current Render service.
export const API_URL = (
  process.env.REACT_APP_API_URL || "https://notesappbackend-og5z.onrender.com"
).replace(/\/$/, "");
