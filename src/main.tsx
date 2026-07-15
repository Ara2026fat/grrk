import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { bootstrapServices } from "./services/container";
import "./styles/index.css";

// Composition root must run before the app renders (see services/container.ts).
// Stage 1: bootstrapServices is async (it seeds Master Data), so rendering
// waits for it — otherwise the first paint could race the seed and briefly
// show empty dropdowns.
//
// Wrapped in try/catch: if bootstrap fails (e.g. a backend connectivity
// issue), we still render the app and surface the error instead of leaving
// a blank white screen.
async function bootstrap() {
  const root = ReactDOM.createRoot(document.getElementById("root")!);
  try {
    await bootstrapServices();
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error("Bootstrap failed:", err);
    root.render(
      <div style={{ padding: "2rem", fontFamily: "monospace", direction: "ltr", textAlign: "left" }}>
        <h1 style={{ color: "#b91c1c" }}>Startup Error</h1>
        <p>The app failed to initialize. Details below:</p>
        <pre style={{ whiteSpace: "pre-wrap", background: "#fef2f2", padding: "1rem", borderRadius: "8px" }}>
          {err instanceof Error ? `${err.name}: ${err.message}\n\n${err.stack}` : String(err)}
        </pre>
      </div>
    );
  }
}

bootstrap();
