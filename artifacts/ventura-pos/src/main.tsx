import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

// Runtime API base URL: empty means relative paths via Vite proxy
// This ensures same-origin cookies work correctly in the Replit preview iframe
const apiBase = "";
setBaseUrl(apiBase);

// Bearer token fallback for environments where cross-origin cookies don't persist
// (e.g. Replit preview iframe over HTTPS → HTTP backend)
setAuthTokenGetter(() => {
  try {
    return localStorage.getItem("tiamo:token");
  } catch {
    return null;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
