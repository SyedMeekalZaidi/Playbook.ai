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
import EnhancedSidebar from '@/components/EnhancedSidebar';
import { useUser } from '@/components/UserContext';

interface Playbook {
    id: string;
    name: string;
    shortDescription?: string;
    createdAt?: string;
    Process: Process[];
}

interface Process {
    id: string;
    name: string;
}

interface Event {
    id: string;
    name: string;
    playbookId: string;
    description?: string;
}

export default function Dashboard() {
    const router = useRouter();

    const user = useUser();
    if (!user) {
        return
    }
    console.log('[Admin Dashboard] user:', user.id)

    // playbook variables
    const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
    const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook>()

    // create Playbook Modal variables
    const [playbookName, setPlaybookName] = useState('');
    const [playbookDescription, setPlaybookDescription] = useState('');
    const [showCreatePlaybookModal, setShowCreatePlaybook] = useState(false);

    // view playbook card Modal variables
    const [openPlaybookCard, setOpenPlaybookCard] = useState(false);

    // UI display errors / animations
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [playbooksLoading, setPlaybooksLoading] = useState<boolean>(true);

    // fetch playbooks based on user's id
    useEffect(() => {
        const fetchPlaybooks = async () => {
            setPlaybooksLoading(true);
            setError(null);

            try {
                const endpoint = `/api/playbook?userId=${user.id}`//&includeProcess=true`
                const response = await fetch(endpoint);

                if (!response.ok) throw new Error(`[Admin Dashboard] Failed to fetch playbooks: ${response.status}`)

                const data = await response.json();
                console.log('[Admin Dashboard] Playbooks loaded:', data.length);

                setPlaybooks(data || [])



            } catch (error:any) {
                console.error("[Admin Dashboard] Error loading playbooks:", error);
                setError("Failed to load playbooks. Please try again.");
            } finally {
                setPlaybooksLoading(false);
            }
        };

        fetchPlaybooks();
    }, [user.id])


    const handleShowPlaybookModal = () => setShowCreatePlaybook(true);

    const handleClosePlaybookModal = () => {
        setShowCreatePlaybook(false);
        setPlaybookName('');
        setPlaybookDescription('');
        setError(null);
    };

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
            handleClosePlaybookModal();
        } catch (error: any) {
            console.error("Error creating playbook:", error);
            setError(error.message || "Failed to create playbook. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    // onClick={() => router.push(`/playbook/${playbook.id}`)}
    const handleOpenPlaybookCard = (playbook:Playbook) => {
        setSelectedPlaybook(playbook);
        setOpenPlaybookCard(true);
    }

    const handleClosePlaybookCard = () => {
        // setSelectedPlaybook(null);
        setOpenPlaybookCard(false);
        setError(null);
    }


    return (
        <>
            {/* Main content column */}
            <Container className="py-4 px-4 flex-grow-1">
                {/* Welcome header */}
               <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Welcome, {user?.email?.split('@')[0] || 'User'}
                    </h1>
                </div>

                {/* Playbooks */}
                <section className="mb-8">
                    {/* Create playbook button */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="text-2xl font-semibold" style={{ color: '#14213D' }}>Playbooks</h2>
                        <Button
                            variant="primary"
                            onClick={handleShowPlaybookModal}
                            className="border-0"
                            style={{ backgroundColor: '#14213D', color: 'white' }}
                        >
                            Create Playbook
                        </Button>
                    </div>

                    {/* Display user's playbooks */}
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
                                        onClick={() => handleOpenPlaybookCard(playbook)}
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
                                onClick={handleShowPlaybookModal}
                                style={{ backgroundColor: '#14213D', color: 'white' }}
                            >
                                Create Your First Playbook
                            </Button>
                        </div>
                    )}
                </section>

            </Container>

            {/* Create playbook Modal */}
            <Modal show={showCreatePlaybookModal} onHide={handleClosePlaybookModal} centered>
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
                        <Button variant="secondary" onClick={handleClosePlaybookModal}>
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
            <Modal show={openPlaybookCard} onHide={handleClosePlaybookCard} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#14213D', color: 'white' }}>
                    <Modal.Title>{selectedPlaybook?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}
                    {selectedPlaybook?.shortDescription && (
                        <p className="text-muted">{selectedPlaybook.shortDescription}</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClosePlaybookCard}>
                        Close
                    </Button>

                    <Button variant="secondary" onClick={() => router.push(`/playbook/${selectedPlaybook?.id}`)}>
                        Open Playbook
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}


