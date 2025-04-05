'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import NavBar from "../../components/NavBar";
import SideBar from "../../components/SideBar";
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import 'bootstrap/dist/css/bootstrap.min.css';
import { getSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';

interface Process {
    id: string;
    name: string;
}

interface Playbook {
    id: string;
    name: string;
    shortDescription?: string;
}

interface User {
    id: string; // Supabase Auth user ID
    email: string;
    role: string;
}

export default function Dashboard() {
    const router = useRouter();
    const [session, setSession] = useState<any>(null);
    const [processes, setProcesses] = useState<Process[]>([]);
    const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [playbookName, setPlaybookName] = useState('');
    const [playbookDescription, setPlaybookDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Fetch session data directly from Supabase
    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                setUser({
                    id: user.id,
                    email: user.email || '',
                    role: user.user_metadata?.role || 'USER'
                });
                setSession({ user });
            }
        };
        
        fetchUserData();
    }, []);

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

    // Fetch playbooks
    useEffect(() => {
        const fetchPlaybooks = async () => {
            if (user) {
                try {
                    // Fetch playbooks where user is owner
                    const { data, error } = await supabase
                        .from('Playbook')
                        .select('*')
                        .eq('ownerId', user.id)
                        .eq('isDeleted', false);
                        
                    if (error) throw error;
                    setPlaybooks(data || []);
                } catch (error) {
                    console.error("Error loading playbooks:", error);
                }
            }
        };

        if (user) {
            fetchPlaybooks();
        }
    }, [user]);

    const handleCloseModal = () => {
        setShowCreateModal(false);
        setPlaybookName('');
        setPlaybookDescription('');
    };

    const handleShowModal = () => setShowCreateModal(true);

    const handleCreatePlaybook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!playbookName.trim()) return;
        
        // Make sure we have a user ID
        if (!user?.id) {
            console.error("Cannot create playbook: No user ID available");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/playbook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: playbookName,
                    shortDescription: playbookDescription || undefined,
                    ownerId: user.id, // Ensure user ID is always set
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create playbook");
            }
            
            const newPlaybook = await response.json();
            
            setPlaybooks([...playbooks, newPlaybook]);
            handleCloseModal();
        } catch (error: any) {
            console.error("Error creating playbook:", error);
            // You could add an error state and display to user here
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-container bg-gray-50 min-h-screen">
            <NavBar />
            <div className="flex pt-2">
                <SideBar />
                <Container className="py-4 px-4 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">
                            Welcome, {user?.email?.split('@')[0] || 'User'}
                        </h1>
                    </div>

                    <section className="mb-8">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="text-2xl font-semibold text-gray-700 m-0">Playbooks</h2>
                            <Button 
                                variant="primary" 
                                onClick={handleShowModal}
                                className="bg-blue-600 hover:bg-blue-700 border-0"
                            >
                                Create Playbook
                            </Button>
                        </div>

                        {playbooks.length > 0 ? (
                            <Row xs={1} md={2} lg={3} className="g-4">
                                {playbooks.map((playbook) => (
                                    <Col key={playbook.id}>
                                        <Card className="h-100 shadow-sm hover:shadow-md transition-shadow">
                                            <Card.Body>
                                                <Card.Title className="text-xl">{playbook.name}</Card.Title>
                                                {playbook.shortDescription && (
                                                    <Card.Text className="text-muted">
                                                        {playbook.shortDescription}
                                                    </Card.Text>
                                                )}
                                            </Card.Body>
                                            <Card.Footer className="bg-transparent border-0">
                                                <Button 
                                                    variant="outline-primary"
                                                    onClick={() => router.push(`/playbook/${playbook.id}`)}
                                                >
                                                    Open
                                                </Button>
                                            </Card.Footer>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        ) : (
                            <div className="text-center py-8 bg-gray-100 rounded-lg">
                                <p className="text-gray-600 mb-4">You haven't created any playbooks yet</p>
                                <Button variant="primary" onClick={handleShowModal}>
                                    Create Your First Playbook
                                </Button>
                            </div>
                        )}
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Processes</h2>
                        <div className='d-flex flex-wrap gap-4'>
                            {processes.map((process: Process) => (
                                <Card key={process.id} style={{ width: '18rem' }} className="shadow-sm">
                                    <Card.Body>
                                        <Card.Title>{process.name}</Card.Title>
                                        <Button 
                                            variant="outline-primary" 
                                            onClick={() => router.push(`/process/${process.id}`)}
                                        >
                                            View
                                        </Button>
                                    </Card.Body>
                                </Card>
                            ))}
                            <Card style={{ width: '18rem' }} className="border-dashed border-2 d-flex justify-content-center align-items-center">
                                <Card.Body className="text-center">
                                    <Button 
                                        variant="link" 
                                        onClick={() => router.push('/create-process')}
                                        className="text-primary text-decoration-none"
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
                </Container>
            </div>

            {/* Create Playbook Modal */}
            <Modal show={showCreateModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Create New Playbook</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreatePlaybook}>
                    <Modal.Body>
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
                        >
                            {isLoading ? 'Creating...' : 'Create Playbook'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}