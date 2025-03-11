import 'bootstrap/dist/css/bootstrap.min.css';
import NavBar from "../components/NavBar";
import SectionBar from "../components/SectionBar";
import ResizableBar from "../components/ResizableBar";

function Diagram() {
  return (
    <div>
      {/* Navigation Bar */}
      <NavBar />
      
      {/* Section Bar */}
      <SectionBar />
      
      {/* Main Layout with Resizable Bar */}
      <div style={{ display: 'flex', height: 'calc(100vh - 112px)' }}>
        {/* Resizable Sidebar */}
        <ResizableBar />
        
        {/* Main Content */}
        <div style={{ flex: 1, padding: '20px' }}>
          <h1>Welcome to Rose Playbook</h1>
          <p>This is the main content area.</p>
        </div>
      </div>
    </div>
  );
}

export default Diagram;
