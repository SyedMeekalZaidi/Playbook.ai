'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { Button, Card, Container, Modal, Spinner } from 'react-bootstrap';
import { BsArrowRight } from 'react-icons/bs';
import { FiFileText, FiSettings } from 'react-icons/fi';
import EnhancedSidebar from '@/components/EnhancedSidebar';
import { useUser } from '@/components/UserContext';

interface PageProps {
    params: Promise<{ id: string }>;
  }

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
    // playbookId: string;
    description?: string;
}

const PlaybookPage = ({params}:PageProps) => {
    const { id: playbookId } = use(params);
    const router = useRouter();

    const user = useUser();
    if (!user) return <div>Loading...</div>

    // playbook variables
    const [playbook, setPlaybook] = useState<Playbook>();

    // process variables
    const [processes, setProcesses] = useState<Process[]>([]);
    const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
    const [processesLoading, setProcessesLoading] = useState(true);

    // events variables
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    // get playbook by id
    useEffect(() => {
        const fetchPlaybook = async () => {
            try {
                const endpoint = `/api/playbook?id=${playbookId}`
                const response = await fetch(endpoint);

                if (!response.ok) throw new Error(`[Playbook [id] page] Failed to fetch playbook: ${response.status}`)

                const data = await response.json();

                setPlaybook(data)

            } catch (error:any) {
                console.error("[Playbook [id] page] Error fetching playbook:", error);
            }
        };
        fetchPlaybook();
    }, [])

    // fetch processes by playbook id.
    useEffect(() => {
        const fetchProcesses = async () => {
            try {
                setProcessesLoading(true)
                const endpoint = `/api/process?playbookId=${playbookId}`
                const response = await fetch(endpoint);

                if (!response.ok) throw new Error(`[Playbook [id] page] Failed to fetch playbooks: ${response.status}`)

                const data = await response.json();
                console.log('[Playbook [id] page] Processes loaded:', data.length);

                setProcesses(data);
                setProcessesLoading(false)
            } catch (error: any) {
                console.error(error.message || "[Playbook [id] page] Error fetching processes")
            }
        }
        fetchProcesses();
    }, [])


    const handleParametersClick = (processId:string) => {
        // onClick={() => router.push(`/processes/${process.id}/docs`)}
        console.info('[Playbook page] functionality not implemented yet')
    }

    const handleDocsClick = (processId: string) => {
        console.info('[Playbook page] functionality not implemented yet')
    }

    const handleCreateNewProcess = () => {
        router.push(`/processes/new-process?playbookId=${playbookId}`)
    }

    const handleCreateNewEvent = () => {
        // redirect to another page - pass playbook's id
        // display that playbook's processes.
        router.push(`/events/new?playbookId=${playbookId}`)
    }

    return (
        <>
            <Container className="py-4 px-4 flex-grow-1">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">
                        {playbook?.name}
                    </h1>
                    <p>{playbook?.shortDescription || "No description"}</p>
                </div>

                {/* Processes */}
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4" style={{ color: '#14213D' }}>Processes</h2>
                    <div className='d-flex flex-wrap gap-4'>

                        {processesLoading? (
                            <div className="text-center py-8">
                                <Spinner animation="border" role="status" style={{ color: '#FEC872' }}>
                                    <span className="visually-hidden">Loading...</span>
                                </Spinner>
                                <p className="mt-2 text-gray-600">Loading your processes...</p>
                            </div>
                        ) : processes.length > 0? (
                            <>
                            {/* Create new process button */}
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
                                        onClick={() => handleCreateNewProcess()}
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
                                                onClick={() => handleDocsClick(process.id)}
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
                            </>
                        ) :(
                            <div className="text-center py-8 bg-gray-100 rounded-lg">
                                <p className="text-gray-600 mb-4">You haven't created any playbooks yet</p>
                                <Button
                                    variant="primary"
                                    onClick={handleCreateNewProcess}
                                    style={{ backgroundColor: '#14213D', color: 'white' }}
                                >
                                    Create The First Process
                                </Button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Events  */}
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
                                    onClick={handleCreateNewEvent}
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
        </>
    );
};

export default PlaybookPage;