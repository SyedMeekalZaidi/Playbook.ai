import NavBar from "../components/NavBar";
import SideBar from "../components/SideBar";
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';

import 'bootstrap/dist/css/bootstrap.min.css';
// import '../styles/dashboard.css';



export default function Dashboard () {
    return (
        <div>
            <NavBar/>

            <div className="flex gap-10">
                <SideBar/>
                <div className="flex-auto">
                    <h1>dashboard</h1>
                    <div className="d-flex gap-2 mb-2">
                        <Button>
                            Plan New Event
                        </Button>
                        <Button>
                            Create New Process
                        </Button>
                    </div>

                    <h2>Events</h2>
                    <div className="d-flex gap-2 mb-2">
                        <Card style={{ width: '18rem' }}>
                            <Card.Img variant="top" src="#" />
                            <Card.Body>
                                <Card.Title>Event 1</Card.Title>
                                <Card.Text>
                                Some quick example text to build on the card title and make up the
                                bulk of the card's content.
                                </Card.Text>
                                <Button variant="primary">Go somewhere</Button>
                            </Card.Body>
                        </Card>

                        <Card style={{ width: '18rem' }}>
                            <Card.Img variant="top" src="#" />
                            <Card.Body>
                                <Card.Title>Event 2</Card.Title>
                                <Card.Text>
                                Some quick example text to build on the card title and make up the
                                bulk of the card's content.
                                </Card.Text>
                                <Button variant="primary">Go somewhere</Button>
                            </Card.Body>
                        </Card>
                    </div>

                </div>

            </div>
        </div>

    )

}