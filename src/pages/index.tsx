import 'bootstrap/dist/css/bootstrap.min.css';
import NavBar from "../components/NavBar";

function App() {
  return (
    <div>
      {/* Navigation Bar */}
      <NavBar />
        
        {/* Main Content */}
        <div style={{ flex: 1, padding: '20px' }}>
          <h1>Main page</h1>
          <p>Use navigation bar to move between pages</p>
        </div>
      </div>
  );
}

export default App;
