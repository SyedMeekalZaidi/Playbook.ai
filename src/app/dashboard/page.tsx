'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import NavBar from "../../components/NavBar";
import SideBar from "../../components/SideBar";
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import 'bootstrap/dist/css/bootstrap.min.css';

interface Process {
    id: string;
    name: string;
}

export default function Dashboard () {
    const router = useRouter();

    const [processes, setProcesses] = useState<Process[]>([]);

    useEffect(() => {
        const fetchProcesses = async () => {
            try {
                const response = await fetch('/api/process');

                if (!response.ok) throw new Error("Failed to fetch processes");

                const data = await response.json();
                setProcesses(data);

            } catch (error){
                console.error("error loading processes:", error);
            }
        };

        fetchProcesses();
    }, [])


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
                        <Button onClick={() => router.push('/create-process')}>
                            Create New Process
                        </Button>
                    </div>

                    <h2>Events</h2>
                    <div className="d-flex gap-2 mb-2">
                        <Card style={{ width: '18rem' }}>
                            <Card.Img variant="top" src="#" />
                            <Card.Body>
                                <Card.Title>Event1-test</Card.Title>
                                <Card.Text>
                                Placeholder
                                </Card.Text>
                                <Button variant="primary">View</Button>
                            </Card.Body>
                        </Card>
                    </div>

                    <h2>Processes</h2>
                    <div className='d-flex gap-2 mb-2'>
                        {processes.map((process:Process) => (
                            <div key={process.id} className="bg-white shadow-md rounded-lg p-4">
                                <h3 className="text-lg font-semibold">{process.name}</h3>
                                {/* <p className="text-gray-500">Process ID: {process.id}</p> */}
                            </div>
                        ))}

                        {/* <Card style={{ width: '18rem' }}>
                            <Card.Img variant="top" src="#" />
                            <Card.Body>
                                <Card.Title>Process-test</Card.Title>
                                    <Card.Text>
                                    Placeholder
                                    </Card.Text>
                                <Button variant="primary">View</Button>
                            </Card.Body>
                        </Card> */}
                    </div>
                </div>
            </div>
        </div>
    )
}