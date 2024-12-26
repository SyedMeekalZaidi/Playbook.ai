import 'bootstrap/dist/css/bootstrap.min.css';
import NavBar from "./components/NavBar.tsx";
import ResizableBar from "./components/ResizableBar.tsx";

function App() {
  return (
    <div>
      <NavBar />
      <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
        <ResizableBar />
        <div style={{ flex: 1, padding: '20px' }}>
          <h1>Welcome to Rose Playbook</h1>
          <p>This is the main content area.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
