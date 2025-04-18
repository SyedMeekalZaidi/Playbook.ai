'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Modal from 'react-bootstrap/Modal';


import 'bootstrap/dist/css/bootstrap.min.css';
import { useUser } from "@/components/UserContext";
import { Form, Spinner } from 'react-bootstrap';
import { FiFileText, FiSettings } from 'react-icons/fi';
import { BsArrowRight } from 'react-icons/bs';


interface Playbook {
    id: string;
    name: string;
    shortDescription?: string;
}

interface Event {
    id: string;
    name: string;
    playbookId: string;
    description?: string;
}

export default function UserDashboard(){
    const user = useUser()
    if (!user) return <div>Loading...</div>

    const router = useRouter();
    const [showCreateEventModal, setShowCreateEventModal] = useState(false);
    const [eventName, setEventName] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [events, setEvents] =useState<Event[]>([])
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
    const [playbookName, setPlaybookName] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // fetch playbooks with status 'PUBLISHED'
    useEffect(() => {
        const fetchPlaybooks = async () => {
            try {
                // dcurrently doesnt filter for publisjed playbooks
                const response = await fetch('/api/playbook?status=PUBLISHED');
                if (!response.ok) {
                    throw new Error("Failed to fetch playbooks");
                }
                const data = await response.json();
                // console.log("Fetched playbooks:", data);
                setPlaybooks(data || []);

            } catch (error) {
                console.error("Error fetching playbooks:", error);
            }
        };

        fetchPlaybooks();
    }, []);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch(`/api/event?userId=${user.id}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch events");
                }
                const data = await response.json();
                setEvents(data || []);
                // console.log(data)
            } catch (error) {
                console.error("Error fetching events:", error);
            }
        };
        fetchEvents();

    }, [])


    const handleCreateEvent = async (e:React.FormEvent) => {
        // router.push('/events/new')
        e.preventDefault();

        // need to choose a playbook.
        if(!playbookName.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const selectedPlaybook = playbooks.find((p) => p.name === playbookName);
            if (selectedPlaybook) {
                router.push(`/events/new?playbookId=${selectedPlaybook.id}`);
            }
            else throw Error(`Could not find playbook ${playbookName}`)
        } catch (error:any) {
            setError(error.message || "Failed to create event. Please try again later.")
        } finally {setIsLoading(false)}

    }

    const handleCloseEventModal = () => {
        setShowCreateEventModal(false);
        setPlaybookName("");
        setEventName('');
        setEventDescription('');
        setError(null);
    };
    const handleShowEventModal = () => setShowCreateEventModal(true);

    return (
        <>
            {/* Main content column */}
            <Container className="py-4 px-4 flex-grow-1">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Welcome, {user.email?.split('@')[0] || 'User'}
                    </h1>
                </div>

                <section className='mb-8'>
                    <h2 className="text-2xl font-semibold mb-4" style={{ color: '#14213D' }}>Events</h2>
                    <div className='d-flex flex-wrap gap-4'>
                    {events.map((process: Event) => (
                            <Card
                                key={process.id}
                                style={{
                                    width: '18rem',
                                    borderLeft: '4px solid #FEC872',
                                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out'
                                }}
                                className={`shadow-sm ${selectedEventId === process.id ? 'border-primary' : ''}`}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
                                }}
                            >
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <Card.Title style={{ color: '#14213D' }}>{process.name}</Card.Title>
                                        <BsArrowRight style={{ color: '#FEC872' }} />
                                    </div>

                                    {/* Action buttons */}
                                    {/* <div className="d-flex justify-content-between mt-3">
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => router.push(`/processes/${process.id}/docs`)}
                                            className="d-flex align-items-center"
                                            style={{ borderColor: '#14213D', color: '#14213D' }}
                                        >
                                            <FiFileText className="me-1" /> Docs
                                        </Button>

                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handleParametersClick(process.id)}
                                            className="d-flex align-items-center"
                                            style={{ borderColor: '#FEC872', color: '#14213D' }}
                                        >
                                            <FiSettings className="me-1" /> Parameters
                                        </Button>
                                    </div> */}

                                </Card.Body>
                            </Card>
                        ))}
                        <Card
                            style={{ width: '18rem' }}
                            className="border-dashed border-2 d-flex justify-content-center align-items-center"
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = '#f8f8f8';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = '';
                            }}
                        >
                            <Card.Body className="text-center">
                                <Button
                                    variant="link"
                                    onClick={handleShowEventModal}
                                    className="text-decoration-none"
                                    style={{ color: '#14213D' }}
                                >
                                    <div className="mb-2">
                                        <i className="bi bi-plus-circle" style={{ fontSize: '2rem' }}></i>
                                    </div>
                                    Create New Event
                                </Button>
                            </Card.Body>
                        </Card>
                    </div>
                </section>
            </Container>

            <Modal show={showCreateEventModal} onHide={handleCloseEventModal} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#14213D', color: 'white' }}>
                    <Modal.Title>Create New Event</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateEvent}>
                    <Modal.Body>
                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        )}

                        <Form.Group className="mb-3" controlId="eventCategory">
                            <Form.Label>Playbook</Form.Label>
                            <Form.Control
                                as="select"
                                value={playbookName}
                                onChange={(e) => setPlaybookName(e.target.value)}
                                required
                            >
                                <option value="" disabled>--Select a playbook--</option>
                                {playbooks.map((playbook) => (
                                    <option key={playbook.id} value={playbook.name}>
                                        {playbook.name}
                                    </option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseEventModal}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            // disabled={!eventName.trim() || isLoading}
                            disabled={!playbookName || isLoading}
                            style={{ backgroundColor: '#14213D', color: 'white' }}
                        >
                            {isLoading ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                        className="me-2"
                                    />
                                    Creating...
                                </>
                            ) : 'Create Event'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    )
}