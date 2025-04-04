'use client';
import React from 'react';
import { Navbar, Nav} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './NavBar.css'; // Import the CSS file

const NavBar: React.FC = () => {
  return (
    <div>
      <Navbar bg="dark" variant="dark" expand="lg">
        {/* <Container> */}
          <div className="navbar-brand d-flex align-items-center">
            <img className='logo' src="/rose-logo.png" alt="Logo" />
            <span className="ms-2 text-white">The Rose Playbook</span>
          </div>

          <Navbar.Toggle className='navbar-toggle' aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href='/dashboard'>Dashboard</Nav.Link>
            <Nav.Link href="/project-structure">Project Structure</Nav.Link>
            <Nav.Link href="/diagram">Diagram</Nav.Link>
            <Nav.Link href="/modeler">Modeler</Nav.Link>
          </Nav>
          <Nav className="ms-auto">
            <Nav.Link href="/account">Account</Nav.Link>
          </Nav>
        </Navbar.Collapse>
        {/* </Container> */}
      </Navbar>
      {/* <SectionBar/> */}
    </div>

  );
};

export default NavBar;
