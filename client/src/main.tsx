import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "@/utils/telegraf"; // Load telegraf utilities

createRoot(document.getElementById("root")!).render(<App />);
