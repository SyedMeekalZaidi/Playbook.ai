'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tabs, Tab, Alert, Spinner, Button, Form, ListGroup } from 'react-bootstrap';
import EnhancedSidebar from '@/components/EnhancedSidebar';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft } from 'react-icons/fi';
import 'bootstrap/dist/css/bootstrap.min.css';

interface Playbook {
    id: string;
    name: string;
    shortDescription: string;
    Process: Process[];
}

interface Event {
    name: string;
}

interface Process {
    id: string;
    name: string;
    description?: string;
    Node: Node[]
    parentToProcesses: ProcessDependency[];
    nextToProcesses: ProcessDependency[];
}

interface ProcessDependency {
    id: string;
    parentProcessId: string;
    processId: string;
    trigger?: string;
}

interface Node {
    id:string;
    name: string;
    type: string;
    description?: string;
    ProcessParameter: ProcessParameter[];
}

interface ProcessParameter {
    id: string;
    name: string;
    type: string;
    mandatory: boolean;
    info?: string;
    options: string[]
}

interface Option {
    id: number; // for rendering purposeses.
    text: string;
    value?: string; // user's response.
}


export default function NewEventPage() {
    const searchParams = useSearchParams();
    const playbookId = searchParams.get('playbookId');
    const router = useRouter();
    const cancel_endpoint = `/playbook/${playbookId}`

    if (!playbookId){
        console.error("Error: No playbook id found [New Event Page]");
        return;
    }

    const [playbook, setPlaybook] = useState<Playbook>();
    const [processes, setProcesses] = useState<Process[]>([]);

    const [currentProcess, setCurrentProcess] = useState<Process>();
    const [nextProcess, setNextProcess] = useState<Process>();
    const [firstProcess, setFirstProcess] = useState<Process>();

    // fetch the playbook's content
    useEffect(() => {
        const fetchPlaybook = async () => {
            try {
                const response = await fetch(`/api/playbook?id=${playbookId}&includeAll=true`)

                if (!response.ok) throw new Error("[New Event Page] Failed to fetch playbook");

                const data:Playbook = await response.json();

                setPlaybook(data)
                setProcesses(data.Process || [])
                // console.log(data.Process);


            } catch (error: any) {
                console.error(error.message || "[New Event Page] Error fetching playbook.")
            }
        }
        fetchPlaybook();
    }, [])

    useEffect(() => {
        const setProcessOrder = () => {
            processes.find((process: Process) => {
                if (process.nextToProcesses.length === 0) {
                    console.log(process)
                    const dependency: ProcessDependency = process.parentToProcesses[0];

                    setFirstProcess(process);

                    setCurrentProcess(process);
                    setNextProcess(processes.find((p: Process) => p.id === dependency.processId));
                }
            })
        }

        setProcessOrder()
    }, [processes])

    const renderNodes = (nodeList:Node[]) => {
        return (
            nodeList.map((node) => (
                <Card key={node.id} className='mb-2'>
                    <Card.Body>
                        <Card.Title>{node.name}</Card.Title>
                        {/* show description if available */}
                        {node.description? <Card.Text>{node.description}</Card.Text> : null}

                        <hr />
                        {renderParameters(node.ProcessParameter)}
                    </Card.Body>
                </Card>
            ))
        )
    }

    const renderParameters = (parameters: ProcessParameter[]) => {

        // parameters.forEach((param) => {
        //     param.options = param.options.map((option, index) => ({
        //         id: index,
        //         text: option
        //     }));
        // });

        return (
            parameters.map((param) => (
                <Form.Group key={param.id} className="mb-3">
                    <Form.Label>{param.name}</Form.Label>
                    {(param.type === "Checkbox" || param.type === "Radio") && (
                        <Form.Group>
                            {param.options.map((text) => (
                                <Form.Check
                                    key={`${param.id}-${text}`}
                                    type={param.type === "Checkbox" ? "checkbox" : "radio"}
                                    label= {text}
                                    // value={option.id}
                                    onChange={(e) => {
                                        const isChecked = e.target.checked;
                                        // console.log(`Option ${option.text} is ${isChecked ? 'checked' : 'unchecked'}`);
                                    }}
                                />
                            ))}
                        </Form.Group>
                    )}
                    {param.type === "Textbox" && (
                        <Form.Control type="text" placeholder="Enter your response" />
                    )}
                    {param.type === "Dropdown" && (
                        <Form.Select>
                            <option value="">Select an option</option>
                            {param.options.map((option) => (
                                <option
                                    key={`${param.id}-${option}`}
                                    value=""
                                    // onChange={} // store value
                                >{option}</option>
                            ))}
                        </Form.Select>
                    )}
                </Form.Group>
            ))
        )
    }

    const renderProcesses = () => {
        // console.log("proceses:", processes)
        // console.log("first: ", currentProcess)
        // console.log('next:', nextProcess)
        // return (
        //     <div>
        //         {processes.map((process) => (
        //             <Card key={process.id} className='p-2 mb-4 mr-4'>
        //                 <Card.Title className='p-2'>{process.name}</Card.Title>
        //                 <Card.Body>{renderNodes(process.Node)}</Card.Body>
        //             </Card>
        //         ))}
        //     </div>
        // )
        return (
            <div>
                <Card key={currentProcess?.id} className='p-2 mb-4 mr-4'>
                    <Card.Title className='p-2'>{currentProcess?.name}</Card.Title>
                    <Card.Body>{renderNodes(currentProcess?.Node ?? [])}</Card.Body>
                </Card>
            </div>
        )
    }

    const handleSave = () => {
        // check that all mandatory params have been answered

    }

    const handleNext = () => {
        if (nextProcess) {
            setCurrentProcess(nextProcess);
            const dependency = nextProcess.parentToProcesses[0];
            setNextProcess(processes.find((p: Process) => p.id === dependency?.processId));
        }
    }

    const handleBack = () => {
        const dependency = currentProcess?.nextToProcesses[0];
        if (dependency) {
            const previousProcess = processes.find((p: Process) => p.id === dependency.parentProcessId);
            setNextProcess(currentProcess);
            setCurrentProcess(previousProcess);
        }
    }

    return (
        <div className="d-flex flex-column flex-lg-row pt-2">
            {/* Sidebar */}
            <div className="sidebar-column px-3 py-3">
                playbooks processses here.
            </div>

            {/* Main content */}
            <Container className='py-4'>
                <div className="mb-4">
                    <Button
                        variant="link"
                        className="text-decoration-none"
                        onClick={() => router.push('/dashboard')}
                    >
                        <FiArrowLeft className="me-2" /> Back to Dashboard
                    </Button>
                    <Card className='p-3'>
                        <Card.Title className='mb-4'>{playbook?.name}</Card.Title>
                        <Card.Text className='mb-2'>
                            {playbook?.shortDescription || "No Description available"}
                        </Card.Text>
                        <Card.Body>
                            <Form>
                                <Form.Group className="mb-3" controlId="eventName">
                                    <Form.Label>Event Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter event name"
                                        onChange={(e) => {
                                            const name = e.target.value;
                                            // Handle event name change
                                            // console.log("Event Name:", name);
                                        }}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="eventDescription">
                                    <Form.Label>Event Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Enter event description"
                                        onChange={(e) => {
                                            const description = e.target.value;
                                            // Handle event description change
                                            // console.log("Event Description:", description);
                                        }}
                                    />
                                </Form.Group>
                            </Form>
                        </Card.Body>
                    </Card>

                </div>

                {renderProcesses()}

                <div className="mt-4 d-flex justify-content-between">
                    {/* cancel button */}
                    <Button
                        onClick={() => router.push(cancel_endpoint)}
                        variant="outline-secondary"
                    >
                        Cancel
                    </Button>


                    <div className='d-flex'>
                        {/* back */}
                        {currentProcess !== firstProcess && (
                            <Button
                                onClick={handleBack}
                                variant='outline-secondary'
                            > Back
                            </Button>
                        )}
                        {/* save / next */}
                        {nextProcess ? ( // go to next process
                        // next button
                        <Button
                            onClick={handleNext}
                            variant="primary"
                            // disabled={isSubmitting}
                            style={{ backgroundColor: '#14213D', borderColor: '#14213D', borderRadius: '8px' }}
                            className="d-flex align-items-center"
                        > Next
                        </Button>
                    ): (
                        // save button
                        <Button
                            onClick={handleSave}
                            variant="primary"
                            // disabled={isSubmitting}
                            style={{ backgroundColor: '#14213D', borderColor: '#14213D', borderRadius: '8px' }}
                            className="d-flex align-items-center"
                        > Save
                            {/* {isSubmitting ? (
                                <>
                                    <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FiSave size="1em" className="me-1" /> Save {isNewProcess ? 'Process' : 'Changes'}
                                </>
                            )} */}
                        </Button>
                        )}


                    </div>

                </div>
            </Container>
        </div>
    );
}