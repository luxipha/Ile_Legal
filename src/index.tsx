import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";

// Buffer polyfill for Web3.Storage in browser
import { Buffer } from 'buffer';
(globalThis as any).Buffer = Buffer;
(window as any).Buffer = Buffer;
(global as any).Buffer = Buffer;

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);