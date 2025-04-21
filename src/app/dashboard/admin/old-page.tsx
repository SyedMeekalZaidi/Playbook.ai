'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import { BsArrowRight } from 'react-icons/bs';
import { FiFileText, FiSettings } from 'react-icons/fi';
import 'bootstrap/dist/css/bootstrap.min.css';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/ClientSessionProvider';
import EnhancedSidebar from '@/components/EnhancedSidebar';
import { useUser } from '@/components/UserContext';

interface Process {
    id: string;
    name: string;
}

interface Playbook {
    id: string;
    name: string;
    shortDescription?: string;
    createdAt?: string;
}

// interface User {
//     id: string; // Supabase Auth user ID
//     email: string;
//     role: string;
// }
interface Event {
    id: string;
    name: string;
    playbookId: string;
    description?: string;
}

export default function Dashboard() {
    const router = useRouter();
    // const { user: authUser, session: authSession } = useAuth(); // Use the auth context instead of local state
    const [processes, setProcesses] = useState<Process[]>([]);
    const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
    const [playbooksLoading, setPlaybooksLoading] = useState<boolean>(true);
    // const [user, setUser] = useState<User | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [playbookName, setPlaybookName] = useState('');
    const [playbookDescription, setPlaybookDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);

    const user = useUser();

    const [showCreateEventModal, setShowCreateEventModal] = useState(false);
    const [eventName, setEventName] = useState('');
    const [events, setEvents] =useState<Event[]>([])
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    // Fetch processes
    useEffect(() => {
        const fetchProcesses = async () => {
            try {
                const response = await fetch('/api/process');
                if (!response.ok) throw new Error("Failed to fetch processes");
                const data = await response.json();
                setProcesses(data);
            } catch (error) {
                console.error("error loading processes:", error);
            }
        };

        fetchProcesses();
    }, []);

    // Fetch playbooks via API instead of direct Supabase access
    useEffect(() => {
        const fetchPlaybooks = async () => {
            if (!user?.id) {
                console.log('[Dashboard] No user ID available yet, skipping playbook fetch');
                return;
            }

            console.log('[Dashboard] Fetching playbooks for user:', user.id);
            setPlaybooksLoading(true);
            setError(null);

            try {
                // Use the API endpoint instead of direct Supabase access
                const response = await fetch(`/api/playbook?userId=${user.id}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch playbooks: ${response.status}`);
                }

                const data = await response.json();
                console.log('[Dashboard] Playbooks loaded:', data.length);
                setPlaybooks(data || []);
            } catch (error: any) {
                console.error("[Dashboard] Error loading playbooks:", error);
                setError("Failed to load playbooks. Please try again.");
            } finally {
                setPlaybooksLoading(false);
            }
        };

        // Only fetch if we have a user ID
        if (user?.id) {
            fetchPlaybooks();
        }
    }, [user?.id]); // Only depend on user.id, not the entire user object

    const handleCloseModal = () => {
        setShowCreateModal(false);
        setPlaybookName('');
        setPlaybookDescription('');
        setError(null);
    };

    const handleShowModal = () => setShowCreateModal(true);

    const handleCreatePlaybook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!playbookName.trim()) return;

        // Make sure we have a user ID
        if (!user?.id) {
            setError("You must be logged in to create a playbook");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/playbook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: playbookName,
                    shortDescription: playbookDescription || undefined,
                    ownerId: user.id,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create playbook");
            }

            const newPlaybook = await response.json();

            // Update the playbooks list with the new playbook at the beginning
            setPlaybooks([newPlaybook, ...playbooks]);
            handleCloseModal();
        } catch (error: any) {
            console.error("Error creating playbook:", error);
            setError(error.message || "Failed to create playbook. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcessSelect = (processId: string) => {
        setSelectedProcessId(processId);
        console.log(`Selected process: ${processId}`);
        // You can add additional logic here, like fetching process details
    };

    const handleNodeSelect = (nodeId: string) => {
        console.log(`Selected node: ${nodeId}`);
        // You can add additional logic here, like fetching node details
    };

    // Add a function to check if a process has parameters
    const checkProcessParameters = async (processId: string) => {
        try {
            const response = await fetch(`/api/process/parameters?processId=${processId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch process parameters');
            }
            const data = await response.json();
            return data.length > 0;
        } catch (error) {
            console.error("Error checking process parameters:", error);
            return false;
        }
    };

    // Update the handleParametersClick function to point to the new page
    const handleParametersClick = async (processId: string) => {
        // Now we just direct to the combined process page
        router.push(`/processes/process?id=${processId}`);
    };

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
        // setEventDescription('');
        setError(null);
    };
    const handleShowEventModal = () => setShowCreateEventModal(true);

    return (
        <div className="page-container bg-gray-50 min-h-screen">
            <NavBar />
            <div className="d-flex flex-column flex-lg-row pt-2">
                {/* Sidebar column - commented until errors are fixed */}
                <div className="sidebar-column px-3 py-3">
                    {
                    <EnhancedSidebar
                        userId={user?.id}
                        onSelectProcess={handleProcessSelect}
                        onSelectNode={handleNodeSelect}
                    />
                    }
                </div>

                {/* Main content column */}
                <Container className="py-4 px-4 flex-grow-1">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">
                            Welcome, {user?.email?.split('@')[0] || 'User'}
                        </h1>
                    </div>

                    <section className="mb-8">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="text-2xl font-semibold" style={{ color: '#14213D' }}>Playbooks</h2>
                            <Button
                                variant="primary"
                                onClick={handleShowModal}
                                className="border-0"
                                style={{ backgroundColor: '#14213D', color: 'white' }}
                            >
                                Create Playbook
                            </Button>
                        </div>

                        {playbooksLoading ? (
                            <div className="text-center py-8">
                                <Spinner animation="border" role="status" style={{ color: '#FEC872' }}>
                                    <span className="visually-hidden">Loading...</span>
                                </Spinner>
                                <p className="mt-2 text-gray-600">Loading your playbooks...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8 bg-gray-100 rounded-lg">
                                <p className="text-danger">{error}</p>
                                <Button
                                    variant="primary"
                                    onClick={() => window.location.reload()}
                                    style={{ backgroundColor: '#14213D', color: 'white', marginTop: '10px' }}
                                >
                                    Retry
                                </Button>
                            </div>
                        ) : playbooks.length > 0 ? (
                            <Row xs={1} md={2} lg={3} className="g-4">
                                {playbooks.map((playbook) => (
                                    <Col key={playbook.id}>
                                        <Card
                                            className="h-100 shadow-sm transition-all duration-200 cursor-pointer"
                                            onClick={() => router.push(`/playbook/${playbook.id}`)}
                                            style={{
                                                borderLeft: '4px solid #FEC872',
                                                transform: 'translateY(0)',
                                                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-5px)';
                                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
                                            }}
                                        >
                                            <Card.Body className="d-flex flex-column">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <Card.Title className="text-xl mb-0" style={{ color: '#14213D' }}>
                                                        {playbook.name}
                                                    </Card.Title>
                                                    <BsArrowRight style={{ color: '#FEC872', fontSize: '1.2rem' }} />
                                                </div>

                                                {playbook.shortDescription && (
                                                    <Card.Text className="text-muted flex-grow-1">
                                                        {playbook.shortDescription}
                                                    </Card.Text>
                                                )}

                                                <div className="mt-3 text-muted small">
                                                    {playbook.createdAt && (
                                                        <span>Created: {new Date(playbook.createdAt).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        ) : (
                            <div className="text-center py-8 bg-gray-100 rounded-lg">
                                <p className="text-gray-600 mb-4">You haven't created any playbooks yet</p>
                                <Button
                                    variant="primary"
                                    onClick={handleShowModal}
                                    style={{ backgroundColor: '#14213D', color: 'white' }}
                                >
                                    Create Your First Playbook
                                </Button>
                            </div>
                        )}
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4" style={{ color: '#14213D' }}>Processes</h2>
                        <div className='d-flex flex-wrap gap-4'>
                            {processes.map((process: Process) => (
                                <Card
                                    key={process.id}
                                    style={{
                                        width: '18rem',
                                        borderLeft: '4px solid #FEC872',
                                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out'
                                    }}
                                    className={`shadow-sm ${selectedProcessId === process.id ? 'border-primary' : ''}`}
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
                                        <div className="d-flex justify-content-between mt-3">
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
                                        </div>

                                        {/* Removed the View button */}
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
                                        onClick={() => router.push('/processes/process')}
                                        className="text-decoration-none"
                                        style={{ color: '#14213D' }}
                                    >
                                        <div className="mb-2">
                                            <i className="bi bi-plus-circle" style={{ fontSize: '2rem' }}></i>
                                        </div>
                                        Create New Process
                                    </Button>
                                </Card.Body>
                            </Card>
                        </div>
                    </section>


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
            </div>

            {/* Create Playbook Modal */}
            <Modal show={showCreateModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#14213D', color: 'white' }}>
                    <Modal.Title>Create New Playbook</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreatePlaybook}>
                    <Modal.Body>
                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        )}

                        <Form.Group className="mb-3" controlId="playbookName">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={playbookName}
                                onChange={(e) => setPlaybookName(e.target.value)}
                                placeholder="Enter playbook name"
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="playbookDescription">
                            <Form.Label>Short Description (optional)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={playbookDescription}
                                onChange={(e) => setPlaybookDescription(e.target.value)}
                                placeholder="Brief description of your playbook"
                                maxLength={280}
                            />
                            <Form.Text className="text-muted">
                                {playbookDescription.length}/280 characters
                            </Form.Text>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={!playbookName.trim() || isLoading}
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
                            ) : 'Create Playbook'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Create Event Modal */}
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
        </div>
    );
}