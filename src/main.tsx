import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import './frontend_api/kccp.css';

createRoot(document.getElementById("root")!).render(<App />);
  