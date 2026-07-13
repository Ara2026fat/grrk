import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { bootstrapServices } from "./services/container";
import "./styles/index.css";

// Composition root must run before the app renders (see services/container.ts).
// Stage 1: bootstrapServices is async (it seeds Master Data), so rendering
// waits for it — otherwise the first paint could race the seed and briefly
// show empty dropdowns.
async function bootstrap() {
  await bootstrapServices();

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
