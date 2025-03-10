import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import './NavBar.css'; // Import the CSS file

const NavBar: React.FC = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="/" className="navbar-brand-custom">
          Rose Playbook
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="/project-structure">Project Structure</Nav.Link>
            <Nav.Link href="/diagram">Diagram</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;
