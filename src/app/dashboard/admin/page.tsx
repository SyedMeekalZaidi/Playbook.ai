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
import 'bootstrap/dist/css/bootstrap.min.css';
import { useUser } from '@/components/UserContext';
import { PlaybookAPI } from '@/services/api'; // Import the API service
import { Playbook, Process as PlaybookProcess } from '@/types/api'; // Import Playbook type

export default function Dashboard() {
    const router = useRouter();
    const user = useUser();

    const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
    const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | undefined>(undefined);
    const [playbookName, setPlaybookName] = useState('');
    const [playbookDescription, setPlaybookDescription] = useState('');
    const [showCreatePlaybookModal, setShowCreatePlaybook] = useState(false);
    const [openPlaybookCard, setOpenPlaybookCard] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [playbooksLoading, setPlaybooksLoading] = useState<boolean>(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareEmail, setShareEmail] = useState('');
    const [sharing, setSharing] = useState(false);
    const [shareError, setShareError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchPlaybooks = async () => {
            setPlaybooksLoading(true);
            setError(null);
            try {
                const data = await PlaybookAPI.getAll({ ownerId: user.id });
                setPlaybooks(data || []);
            } catch (error: any) {
                setError(error.message || "Failed to load playbooks. Please try again.");
            } finally {
                setPlaybooksLoading(false);
            }
        };
        fetchPlaybooks();
    }, [user]);

    if (!user) return (
        <Container className="py-4 px-4 flex-grow-1 text-center">
            <Spinner animation="border" style={{ color: '#FEC872' }} />
            <p className="mt-2 text-gray-600">Loading user data...</p>
        </Container>
    );

    const handleShowPlaybookModal = () => setShowCreatePlaybook(true);
    const handleClosePlaybookModal = () => {
        setShowCreatePlaybook(false);
        setPlaybookName('');
        setPlaybookDescription('');
        setError(null);
    };

    const handleCreatePlaybook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!playbookName.trim() || !user?.id) {
            setError(!user?.id ? "You must be logged in to create a playbook" : "Playbook name is required");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const newPlaybook = await PlaybookAPI.create({
                name: playbookName,
                shortDescription: playbookDescription || undefined,
                ownerId: user.id,
            });
            setPlaybooks([newPlaybook, ...playbooks]);
            handleClosePlaybookModal();
        } catch (error: any) {
            setError(error.message || "Failed to create playbook.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenPlaybookCard = (playbook: Playbook) => {
        setSelectedPlaybook(playbook);
        setOpenPlaybookCard(true);
    };

    const handleClosePlaybookCard = () => {
        setOpenPlaybookCard(false);
        setSelectedPlaybook(undefined);
        setShareError(null);
        setShareEmail('');
    };

    const handleSharePlaybook = async () => {
        if (!selectedPlaybook || !shareEmail.trim()) {
            setShareError("Playbook and email are required to share.");
            return;
        }
        setSharing(true);
        setShareError(null);
        try {
            const userRes = await fetch(`/api/user?email=${shareEmail}`);
            const userData = await userRes.json();

            if (!userRes.ok || !userData?.id) {
                throw new Error("User not found with the provided email.");
            }

            await PlaybookAPI.share(selectedPlaybook.id, { userId: userData.id });
            setShowShareModal(false);
            setShareEmail('');
        } catch (error: any) {
            setShareError(error.message || "Error sharing playbook.");
        } finally {
            setSharing(false);
        }
    };

    return (
        <>
            <Container className="py-4 px-4 flex-grow-1">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Welcome, {user?.email?.split('@')[0] || 'Admin'}
                    </h1>
                </div>
                <section className="mb-8">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="text-2xl font-semibold" style={{ color: '#14213D' }}>Playbooks</h2>
                        <Button variant="primary" onClick={handleShowPlaybookModal} style={{ backgroundColor: '#14213D', color: 'white' }}>
                            Create Playbook
                        </Button>
                    </div>
                    {playbooksLoading ? (
                        <div className="text-center py-8">
                            <Spinner animation="border" style={{ color: '#FEC872' }} />
                            <p className="mt-2 text-gray-600">Loading your playbooks...</p>
                        </div>
                    ) : error && !playbooksLoading ? (
                        <div className="text-center py-8 bg-gray-100 rounded-lg">
                            <p className="text-danger">{error}</p>
                            <Button onClick={() => window.location.reload()} style={{ backgroundColor: '#14213D', color: 'white', marginTop: '10px' }}>
                                Retry
                            </Button>
                        </div>
                    ) : playbooks.length > 0 ? (
                        <Row xs={1} md={2} lg={3} className="g-4">
                            {playbooks.map((playbook) => (
                                <Col key={playbook.id}>
                                    <Card className="h-100 shadow-sm">
                                        <Card.Body>
                                            <Card.Title>{playbook.name}</Card.Title>
                                            <Card.Text>{playbook.shortDescription || "No description available."}</Card.Text>
                                            <Button variant="outline-dark" onClick={() => handleOpenPlaybookCard(playbook)}>View</Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <div className="text-center py-8 bg-gray-100 rounded-lg">
                            <p className="text-gray-600 mb-4">You haven't created any playbooks yet</p>
                            <Button onClick={handleShowPlaybookModal} style={{ backgroundColor: '#14213D', color: 'white' }}>
                                Create Your First Playbook
                            </Button>
                        </div>
                    )}
                </section>
            </Container>

            <Modal show={showCreatePlaybookModal} onHide={handleClosePlaybookModal} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#14213D', color: 'white' }}>
                    <Modal.Title>Create New Playbook</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreatePlaybook}>
                    <Modal.Body>
                        {error && <div className="alert alert-danger">{error}</div>}
                        <Form.Group className="mb-3" controlId="playbookNameModal">
                            <Form.Label>Name</Form.Label>
                            <Form.Control type="text" value={playbookName} onChange={(e) => setPlaybookName(e.target.value)} required />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="playbookDescriptionModal">
                            <Form.Label>Description (optional)</Form.Label>
                            <Form.Control as="textarea" rows={3} value={playbookDescription} onChange={(e) => setPlaybookDescription(e.target.value)} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClosePlaybookModal}>Cancel</Button>
                        <Button type="submit" variant="primary" disabled={!playbookName.trim() || isLoading} style={{ backgroundColor: '#14213D' }}>
                            {isLoading ? <Spinner animation="border" size="sm" className="me-2" /> : null} Create Playbook
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal show={openPlaybookCard} onHide={handleClosePlaybookCard} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#14213D', color: 'white' }}>
                    <Modal.Title>{selectedPlaybook?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPlaybook?.shortDescription && (
                        <p className="text-muted">{selectedPlaybook.shortDescription}</p>
                    )}
                    {!selectedPlaybook?.shortDescription && (
                        <p className="text-muted">No description available.</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClosePlaybookCard}>Close</Button>
                    <Button variant="warning" onClick={() => { setOpenPlaybookCard(false); setShowShareModal(true); }}>Share</Button>
                    <Button variant="primary" style={{ backgroundColor: '#14213D', color: 'white' }} onClick={() => router.push(`/playbook/${selectedPlaybook?.id}`)}>Open Playbook</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showShareModal} onHide={() => { setShowShareModal(false); setShareError(null); setShareEmail(''); }} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#14213D', color: 'white' }}>
                    <Modal.Title>Share {selectedPlaybook?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {shareError && <div className="alert alert-danger">{shareError}</div>}
                    <Form.Group>
                        <Form.Label>Email of user to share with</Form.Label>
                        <Form.Control
                            type="email"
                            value={shareEmail}
                            onChange={(e) => setShareEmail(e.target.value)}
                            placeholder="e.g. user@example.com"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => { setShowShareModal(false); setShareError(null); setShareEmail(''); }}>Cancel</Button>
                    <Button
                        variant="primary"
                        onClick={handleSharePlaybook}
                        disabled={sharing || !shareEmail.trim()}
                        style={{ backgroundColor: '#14213D', color: 'white' }}
                    >
                        {sharing ? <Spinner size="sm" animation="border" className="me-2" /> : null}
                        Share
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}