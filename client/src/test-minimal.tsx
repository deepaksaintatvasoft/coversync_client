import { createRoot } from "react-dom/client";

function TestApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>CoverSync Test</h1>
      <p>If you can see this, React is working correctly.</p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<TestApp />);