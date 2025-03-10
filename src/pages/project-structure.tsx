import 'bootstrap/dist/css/bootstrap.min.css';
import NavBar from "../components/NavBar";

function ProjectStructure() {
  return (
    <div>
      {/* Navigation Bar */}
      <NavBar />
        
        {/* Main Content */}
        <div style={{ flex: 1, padding: '20px' }}>
          <h1>Project Structure stuff here</h1>
        </div>
      </div>
  );
}

export default ProjectStructure;
