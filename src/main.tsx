import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { bootstrapServices } from "./services/container";
import "./styles/index.css";

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
    let details: string;
    if (err instanceof Error) {
      details = `${err.name}: ${err.message}\n\n${err.stack ?? ""}`;
    } else {
      try {
        details = JSON.stringify(err, Object.getOwnPropertyNames(err as object), 2);
      } catch {
        details = String(err);
      }
    }
    root.render(
      <div style={{ padding: "2rem", fontFamily: "monospace", direction: "ltr", textAlign: "left" }}>
        <h1 style={{ color: "#b91c1c" }}>Startup Error</h1>
        <p>The app failed to initialize. Details below:</p>
        <pre style={{ whiteSpace: "pre-wrap", background: "#fef2f2", padding: "1rem", borderRadius: "8px" }}>
          {details}
        </pre>
      </div>
    );
  }
}

bootstrap();
