import './SideBar.css';

function Sidebar() {
  return (
    <div className="sidebar-wrapper">
      <div className="sidebar">
        <h5>Pre Event</h5>
        <ul className="sidebar-list">
          <li className="sidebar-item active">
            <div className="collapsible">
              Establish a Collaboration
              <span className="expand-icon">&gt;</span>
            </div>
            <ul className="nested-list">
              <li>Assign a PIC</li>
              <li className="bold">Gather Needs & Feasibility</li>
              <li>Confirm Collaboration</li>
              <li>Create Event</li>
            </ul>
          </li>
          <li className="sidebar-item">Register Event in canScreen</li>
          <li className="sidebar-item">Site Planning</li>
          <li className="sidebar-item">Volunteer Management</li>
          <li className="sidebar-item">Event Promotion</li>
        </ul>

        <h5>Event</h5>
        <ul className="sidebar-list">
          <li className="sidebar-item">Eligibility Check</li>
          <li className="sidebar-item">Educate Participant</li>
          <li className="sidebar-item">Register Participant</li>
          <li className="sidebar-item">Collecting Samples</li>
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;
