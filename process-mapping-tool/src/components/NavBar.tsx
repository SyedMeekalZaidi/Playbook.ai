import React from "react";
import { Navbar, Nav } from "react-bootstrap";

const NavBar: React.FC = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="ps-3">
      <Navbar.Brand href="#home">Rose Playbook</Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="me-auto">
          <Nav.Link href="#diagram">Diagram</Nav.Link>
          <Nav.Link href="#project-structure">Project Structure</Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default NavBar;
