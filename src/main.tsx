import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { storageService } from "./services/storage";

// Initialize storage with sample data
storageService.initialize();

createRoot(document.getElementById("root")!).render(<App />);
