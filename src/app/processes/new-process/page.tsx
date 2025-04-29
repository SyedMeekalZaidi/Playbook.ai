'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { Container, Row, Col, Card, Tabs, Tab, Alert, Spinner } from 'react-bootstrap';
import NavBar from '@/components/NavBar';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft, FiInfo } from 'react-icons/fi';
import '@/styles/new-process.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

interface Playbook {
    name: string;
    Process: Process[];
}

interface Process {
    id: string,
    name: string,
    description: string | null,
    nodes: Node[],
    playbookId: string,
    parentId: string | null,
    subProcesses: Process[]
    nextProcesses: ProcessDependency[]
    prevProcesses: ProcessDependency[]
}

interface Node {
    id: number,
    name: string,
    type: string,
    description: string | null,
    parameters: NodeParameter[]
}

interface NodeParameter {
    id: number
    name: string
    type: string
    mandatory: boolean
    info: string | null
    options: Option[]
}

interface Option {
    id: number,
    text: string
}

interface ProcessParameter {
    name: string
    type: string
    mandatory: boolean
    options: string[]
}

interface ProcessDependency {
    fromId: string | null,
    toId: string | null,
    playbookId: string
}

export default function NewProcessPage() {
    const searchParams = useSearchParams();
    // the playbook this process belongs to.
    const playbookId = searchParams.get('playbookId');

    if (!playbookId){
        console.error("[New Process Page] new processes must belong to a playbook.")
    }

    const router = useRouter();
    const returnEndpoint = `/playbook/${playbookId}`


    const [playbook, setPlaybook] = useState<Playbook>();
    const [existingProcesses, setExistingProcesses] = useState<Process[]>([]);

    const [fromProcess, setFromProcess] = useState<Process | null>(null);

    const [activeTab, setActiveTab] = useState('nodes');
    const [processName, setProcessName] = useState('');
    const [processDescription, setProcessDescription] = useState('');

    const [nodeList, setNodeList] = useState<Node[]>([]);
    const [nextNodeId, setNextNodeId] = useState<number>(1);
    const [processParameters, setProcessParameters] = useState<ProcessParameter[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // fetch existing processes by playbook id.
    useEffect(() => {
        const fetchProcesses = async () => {
            try {
                setIsLoading(true);
                const endpoint = `/api/playbook?id=${playbookId}&includeProcess=true`
                const response = await fetch(endpoint);

                if (!response.ok) throw new Error(`[New Process Page] Failed to fetch playbooks: ${response.status}`)

                const data:Playbook = await response.json();

                setPlaybook(data);
                setExistingProcesses(data.Process || [])

            } catch (error: any) {
                console.error(error.message || "[New Process Page] Error fetching playbook")
            }

            setIsLoading(false);

        }

        fetchProcesses();
    }, [])

    // Node operations:
    const handleAddNode = () => {
        const newNode: Node = {
            id: nextNodeId,
            name: '',
            type: 'Task',
            description: null,
            parameters: [],
        }

        setNodeList([...nodeList, newNode]);
        handleAddParameter(newNode.id);  // add one parameter as default
        setNextNodeId(nextNodeId + 1);
    }
    const handleRemoveNode = (id: number) => {
        setNodeList(prevList => prevList.filter(node => node.id !== id));
    }

    // Node Parameter operations:
    const handleAddParameter = (nodeId: number) => {
        const maxParamId = nodeList
            .find(node => node.id === nodeId)
            ?.parameters.reduce((maxId, param) => Math.max(maxId, param.id), 0) ?? nodeId;

        const paramId = Math.round((maxParamId + 0.1) * 100) / 100;

        const newParam: NodeParameter = {
            id: paramId,
            name: '',
            type: 'Checkbox',
            mandatory: false,
            info: '',
            options: [],
        }

        setNodeList(prevList =>
            prevList.map(node =>
                node.id === nodeId
                    ? { ...node, parameters: [...node.parameters, newParam] }
                    : node
            )
        );
    }

    const handleRemoveParameter = (paramId: number) => {
        console.log("Removing parameter with ID:", paramId);

        setNodeList(prevList => {
            return prevList.map(node => {
                // Check if this node contains the parameter
                const hasParameter = node.parameters.some(param => param.id === paramId);

                if (hasParameter) {
                    // If found, filter out the parameter
                    return {
                        ...node,
                        parameters: node.parameters.filter(param => param.id !== paramId)
                    };
                }

                // Otherwise return the node unchanged
                return node;
            });
        });
    };

    // Process parameter operations:
    const handleAddProcessParameter = () => {
        setProcessParameters([...processParameters, {
            name: '',
            type: 'Textbox',
            mandatory: false,
            options: []
        }]);
    };

    const handleRemoveProcessParameter = (index: number) => {
        setProcessParameters(processParameters.filter((_, i) => i !== index));
    };

    const handleProcessParameterChange = (index: number, field: string, value: any) => {
        setProcessParameters(processParameters.map((param, i) =>
            i === index ? { ...param, [field]: value } : param
        ));
    };

    // Handle options for parameters
    const handleAddProcessParameterOption = (index: number) => {
        setProcessParameters(processParameters.map((param, i) =>
            i === index ? { ...param, options: [...param.options, ''] } : param
        ));
    };

    const handleProcessParameterOptionChange = (paramIndex: number, optionIndex: number, value: string) => {
        setProcessParameters(processParameters.map((param, i) =>
            i === paramIndex
                ? {
                    ...param,
                    options: param.options.map((opt, oi) => oi === optionIndex ? value : opt)
                  }
                : param
        ));
    };

    const handleRemoveProcessParameterOption = (paramIndex: number, optionIndex: number) => {
        setProcessParameters(processParameters.map((param, i) =>
            i === paramIndex
                ? {
                    ...param,
                    options: param.options.filter((_, oi) => oi !== optionIndex)
                  }
                : param
        ));
    };

    // Handle options for node parameters
    const handleAddOption = (nodeId: number, paramId: number) => {
        setNodeList(prevList =>
            prevList.map(node =>
                node.id === nodeId
                    ? {
                        ...node,
                        parameters: node.parameters.map(param =>
                            param.id === paramId
                                ? {
                                    ...param,
                                    options: [
                                        ...param.options,
                                        { id: param.options.length, text: '' }
                                    ]
                                  }
                                : param
                        )
                      }
                    : node
            )
        );
    };

    const handleOptionChange = (nodeId: number, paramId: number, optionId: number, value: string) => {
        setNodeList(prevList =>
            prevList.map(node =>
                node.id === nodeId
                    ? {
                        ...node,
                        parameters: node.parameters.map(param =>
                            param.id === paramId
                                ? {
                                    ...param,
                                    options: param.options.map(option =>
                                        option.id === optionId
                                            ? { ...option, text: value }
                                            : option
                                    )
                                  }
                                : param
                        )
                      }
                    : node
            )
        );
    };

    const handleRemoveOption = (nodeId: number, paramId: number, optionId: number) => {
        setNodeList(prevList =>
            prevList.map(node =>
                node.id === nodeId
                    ? {
                        ...node,
                        parameters: node.parameters.map(param =>
                            param.id === paramId
                                ? {
                                    ...param,
                                    options: param.options.filter(option => option.id !== optionId)
                                  }
                                : param
                        )
                      }
                    : node
            )
        );
    };

    const updateNodeType = (id: number, newType: string) => {
        setNodeList(prevList =>
            prevList.map(node =>
                node.id === id ? { ...node, type: newType } : node
            )
        );
    }

    const updateQuestionType = (id: number, type: string) => {
        setNodeList(prevList =>
            prevList.map(node =>
                node.parameters.find(param => param.id === id)
                    ? {
                        ...node,
                        parameters: node.parameters.map(param =>
                            param.id === id ? { ...param, type } : param
                        )
                      }
                    : node
            )
        );
    }

    // Render functions for the UI components
    const renderQuestionField = (nodeId: number, param: NodeParameter) => {
        switch (param.type) {
            case "Checkbox":
                return (
                    <div className="mb-3">
                        {param.options.length > 0 ? (
                            param.options.map((option, index) => (
                                <div key={option.id} className="d-flex mb-2 align-items-center">
                                    <div className="d-flex align-items-center flex-grow-1">
                                        <Form.Check type="checkbox" disabled style={{ marginRight: '10px' }} />
                                        <Form.Control
                                            type="text"
                                            value={option.text}
                                            onChange={(e) => handleOptionChange(nodeId, param.id, option.id, e.target.value)}
                                            placeholder="Enter option"
                                        />
                                    </div>
                                    <Button
                                        variant="link"
                                        className="text-danger"
                                        onClick={() => handleRemoveOption(nodeId, param.id, option.id)}
                                    >
                                        <FiTrash2 />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-muted mb-2">No options added. Add an option with the + button.</div>
                        )}
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleAddOption(nodeId, param.id)}
                            className="d-flex align-items-center"
                            style={{ borderRadius: '8px' }}
                        >
                            <FiPlus size="1em" className="me-1" /> Add Option
                        </Button>
                    </div>
                );
            case "Radio":
                return (
                    <div className="mb-3">
                        {param.options.length > 0 ? (
                            param.options.map((option, index) => (
                                <div key={option.id} className="d-flex mb-2 align-items-center">
                                    <div className="d-flex align-items-center flex-grow-1">
                                        <Form.Check
                                            type="radio"
                                            name={`radio-group-${nodeId}-${param.id}`}
                                            disabled
                                            style={{ marginRight: '10px' }}
                                        />
                                        <Form.Control
                                            type="text"
                                            value={option.text}
                                            onChange={(e) => handleOptionChange(nodeId, param.id, option.id, e.target.value)}
                                            placeholder="Enter option"
                                        />
                                    </div>
                                    <Button
                                        variant="link"
                                        className="text-danger"
                                        onClick={() => handleRemoveOption(nodeId, param.id, option.id)}
                                    >
                                        <FiTrash2 />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-muted mb-2">No options added. Add an option with the + button.</div>
                        )}
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleAddOption(nodeId, param.id)}
                            className="d-flex align-items-center"
                            style={{ borderRadius: '8px' }}
                        >
                            <FiPlus size="1em" className="me-1" /> Add Option
                        </Button>
                    </div>
                );
            case "Textbox":
                return (
                    <Form.Control
                        as="textarea"
                        placeholder="User will enter text here..."
                        disabled
                        style={{ background: '#f8f8f8' }}
                    />
                );
            case "Number":
                return (
                    <Form.Control
                        type="number"
                        placeholder="User will enter a number here..."
                        disabled
                        style={{ background: '#f8f8f8' }}
                    />
                );
            case "Date":
                return (
                    <Form.Control
                        type="date"
                        disabled
                        style={{ background: '#f8f8f8' }}
                    />
                );
            case "Dropdown":
                return (
                    <div className="mb-3">
                        <Form.Select disabled style={{ background: '#f8f8f8', marginBottom: '10px' }}>
                            <option>Select an option...</option>
                            {param.options.map((option) => (
                                <option key={option.id}>{option.text}</option>
                            ))}
                        </Form.Select>

                        {param.options.length > 0 ? (
                            param.options.map((option) => (
                                <div key={option.id} className="d-flex mb-2 align-items-center">
                                    <Form.Control
                                        type="text"
                                        value={option.text}
                                        onChange={(e) => handleOptionChange(nodeId, param.id, option.id, e.target.value)}
                                        placeholder="Enter option"
                                        className="flex-grow-1"
                                    />
                                    <Button
                                        variant="link"
                                        className="text-danger"
                                        onClick={() => handleRemoveOption(nodeId, param.id, option.id)}
                                    >
                                        <FiTrash2 />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-muted mb-2">No options added. Add an option with the + button.</div>
                        )}
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleAddOption(nodeId, param.id)}
                            className="d-flex align-items-center"
                            style={{ borderRadius: '8px' }}
                        >
                            <FiPlus size="1em" className="me-1" /> Add Option
                        </Button>
                    </div>
                );
            default:
                return null;
        }
    };

    const renderNodeBox = (node: Node) => {
        return (
            <Card key={node.id} className="mb-4 shadow-sm" style={{ borderLeft: '3px solid #FEC872' }}>
                <Card.Header className="bg-white">
                    <Row>
                        <Col md={8}>
                            <Form.Control
                                type="text"
                                placeholder="Enter Node title"
                                value={node.name}
                                onChange={(e) =>
                                    setNodeList(prevList =>
                                        prevList.map(p =>
                                            p.id === node.id ? { ...p, name: e.target.value } : p
                                        )
                                    )
                                }
                                className="border-0 font-weight-bold"
                                style={{ fontSize: '1.1rem' }}
                            />
                        </Col>
                        <Col md={4} className="d-flex justify-content-end">
                            <Form.Select
                                value={node.type}
                                onChange={(e) => updateNodeType(node.id, e.target.value)}
                                className="mx-2"
                                style={{ maxWidth: '150px' }}
                            >
                                <option value="Event">Event</option>
                                <option value="Task">Task</option>
                                <option value="Gateway">Gateway</option>
                                <option value="Subprocess">Subprocess</option>
                            </Form.Select>
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleRemoveNode(node.id)}
                                className="d-flex align-items-center"
                            >
                                <FiTrash2 />
                            </Button>
                        </Col>
                    </Row>
                </Card.Header>
                <Card.Body>
                    <div className="d-flex justify-content-between mb-3">
                        <h6>Parameters</h6>
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleAddParameter(node.id)}
                            style={{ borderColor: '#FEC872', color: '#14213D', borderRadius: '8px' }}
                            className="d-flex align-items-center"
                        >
                            <FiPlus size="1em" className="me-1" /> Add Parameter
                        </Button>
                    </div>

                    {node.parameters.length === 0 ? (
                        <div className="text-center text-muted py-4 bg-light rounded">
                            No parameters defined for this node.
                        </div>
                    ) : (
                        node.parameters.map((param) => (
                            <Card key={param.id} className="mb-3 shadow-sm">
                                <Card.Body>
                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Parameter Name</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Enter parameter name"
                                                    value={param.name}
                                                    onChange={(e) => {
                                                        const newName = e.target.value;
                                                        setNodeList(prevList =>
                                                            prevList.map(n =>
                                                                n.id === node.id
                                                                    ? {
                                                                        ...n,
                                                                        parameters: n.parameters.map(p =>
                                                                            p.id === param.id
                                                                                ? {...p, name: newName}
                                                                                : p
                                                                        )
                                                                      }
                                                                    : n
                                                            )
                                                        );
                                                    }}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label>Type</Form.Label>
                                                <Form.Select
                                                    value={param.type}
                                                    onChange={(e) => updateQuestionType(param.id, e.target.value)}
                                                >
                                                    <option value="Textbox">Textbox</option>
                                                    <option value="Dropdown">Dropdown</option>
                                                    <option value="Checkbox">Checkbox</option>
                                                    <option value="Radio">Radio Buttons</option>
                                                    <option value="Number">Number</option>
                                                    <option value="Date">Date</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Group className="mt-md-4">
                                                <Form.Check
                                                    type="checkbox"
                                                    label="Required"
                                                    checked={param.mandatory}
                                                    onChange={() => {
                                                        setNodeList(prevList =>
                                                            prevList.map(n =>
                                                                n.id === node.id
                                                                    ? {
                                                                        ...n,
                                                                        parameters: n.parameters.map(p =>
                                                                            p.id === param.id
                                                                                ? {...p, mandatory: !p.mandatory}
                                                                                : p
                                                                        )
                                                                      }
                                                                    : n
                                                            )
                                                        );
                                                    }}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={1} className="d-flex align-items-end justify-content-end">
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleRemoveParameter(param.id)}
                                            >
                                                <FiTrash2 />
                                            </Button>
                                        </Col>
                                    </Row>

                                    <div className="mt-3">
                                        {renderQuestionField(node.id, param)}
                                    </div>
                                </Card.Body>
                            </Card>
                        ))
                    )}
                </Card.Body>
            </Card>
        );
    };

    const renderProcessParameters = () => {
        return (
            <div>
                <div className="d-flex justify-content-between mb-3">
                    <h5>Process Parameters</h5>
                    <Button
                        variant="outline-primary"
                        onClick={handleAddProcessParameter}
                        style={{ borderColor: '#FEC872', color: '#14213D', borderRadius: '8px' }}
                        className="d-flex align-items-center"
                    >
                        <FiPlus size="1em" className="me-1" /> Add Parameter
                    </Button>
                </div>

                {processParameters.length === 0 ? (
                    <div className="text-center py-5 bg-light rounded">
                        <p className="text-muted mb-3">No parameters added yet for this process.</p>
                        <Button
                            onClick={handleAddProcessParameter}
                            variant="outline-primary"
                            style={{ borderColor: '#FEC872', color: '#14213D', borderRadius: '8px' }}
                            className="d-flex align-items-center mx-auto"
                        >
                            <FiPlus size="1em" className="me-1" /> Add Your First Parameter
                        </Button>
                    </div>
                ) : (
                    processParameters.map((param, index) => (
                        <Card key={index} className="mb-3 shadow-sm" style={{ borderLeft: '3px solid #FEC872' }}>
                            <Card.Body>
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Parameter Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={param.name}
                                                onChange={(e) => handleProcessParameterChange(index, 'name', e.target.value)}
                                                placeholder="Enter parameter name"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label>Type</Form.Label>
                                            <Form.Select
                                                value={param.type}
                                                onChange={(e) => handleProcessParameterChange(index, 'type', e.target.value)}
                                            >
                                                <option value="Textbox">Textbox</option>
                                                <option value="Dropdown">Dropdown</option>
                                                <option value="Checkbox">Checkbox</option>
                                                <option value="Radio">Radio Buttons</option>
                                                <option value="Number">Number</option>
                                                <option value="Date">Date</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Group className="mt-md-4">
                                            <Form.Check
                                                type="checkbox"
                                                label="Required"
                                                checked={param.mandatory}
                                                onChange={(e) => handleProcessParameterChange(index, 'mandatory', e.target.checked)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={1} className="d-flex align-items-end justify-content-end">
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleRemoveProcessParameter(index)}
                                        >
                                            <FiTrash2 />
                                        </Button>
                                    </Col>
                                </Row>

                                {(param.type === 'Dropdown' || param.type === 'Checkbox' || param.type === 'Radio') && (
                                    <div className="mt-3">
                                        <Form.Label>Options</Form.Label>
                                        {param.options.map((option, optIndex) => (
                                            <Row key={optIndex} className="mb-2">
                                                <Col md={10}>
                                                    <Form.Control
                                                        type="text"
                                                        value={option}
                                                        onChange={(e) => handleProcessParameterOptionChange(index, optIndex, e.target.value)}
                                                        placeholder={`Option ${optIndex + 1}`}
                                                    />
                                                </Col>
                                                <Col md={2} className="d-flex align-items-center">
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleRemoveProcessParameterOption(index, optIndex)}
                                                    >
                                                        <FiTrash2 />
                                                    </Button>
                                                </Col>
                                            </Row>
                                        ))}
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => handleAddProcessParameterOption(index)}
                                            className="mt-2 d-flex align-items-center"
                                            style={{ borderRadius: '8px' }}
                                        >
                                            <FiPlus size="1em" className="me-1" /> Add Option
                                        </Button>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    ))
                )}
            </div>
        );
    };

    const renderFromProcessTooltip = () => {
        return (
            <OverlayTrigger
                placement='right'
                overlay={
                    <Tooltip id="tooltip-id">
                        The process that must be completed before this process
                    </Tooltip>
                }
            >
                <Form.Label><FiInfo/></Form.Label>

            </OverlayTrigger>
        )
    }

    // save new process
    const handleValidations = () => {
        // validations:
        // check that process name doesnt match any within same playbook.
        // check all nodes have names
        // check all node and process parameters have names
        // check all params have at least 1 option.
            // check all options have names.
        setError(null)
        if (!processName.trim()){
            setError("Process name cannot be empty");
            setActiveTab('nodes');
            return false;
        }

        if (existingProcesses.some(process => process.name.trim().toLowerCase() === processName.trim().toLowerCase())) {
            setError("Process names must be unique within the same playbook.");
            setActiveTab('nodes');
            return false;
        }

        if (nodeList.length > 0) {
            for (const node of nodeList) {
                if (!node.name.trim()) {
                    setError("All nodes must have a name.");
                    setActiveTab('nodes');
                    return false;
                }

                for (const param of node.parameters) {
                    if (!param.name.trim()) {
                        setError(`Empty parameter in "${node.name}"`);
                        setActiveTab('nodes');
                        return false;
                    }

                    if (param.type === 'Checkbox' || param.type === 'Radio' || param.type === 'Dropdown') {
                        if (!param.options.length) {
                            setError(`Parameter "${param.name}" of node "${node.name}" must have at least 1 option`)
                            setActiveTab('nodes');
                            return false;
                        }
                        else {
                            for (const option of param.options) {
                                if (!option.text.trim()) {
                                    setError(`Option in parameter "${param.name}" of node "${node.name}" must have a name.`);
                                    setActiveTab('nodes');
                                    return false;
                                }
                            }
                        }
                    }


                }
            }
            console.log('All nodes ok.')
        }

        if (processParameters.length > 0){
            for (const param of processParameters) {
                if (!param.name.trim()){
                    setError(`Process parameters must have a name`)
                    setActiveTab('parameters')
                    return false;
                }
            }
        }

        // console.log('All ok.')
        return true;
    }

    const handleSave = async () => {

        if (!handleValidations()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const endpoint = `/api/process`;
            // Transform node parameters and options for API
            const transformedNodes = nodeList.map(node => ({
                name: node.name,
                type: node.type,
                parameters: node.parameters.map(param => ({
                    name: param.name,
                    type: param.type,
                    mandatory: param.mandatory,
                    options: param.options.map(opt => opt.text)
                }))
            }));


            // Format process parameters for API
            const formattedProcessParams = processParameters.map(param => ({
                name: param.name,
                type: param.type,
                mandatory: param.mandatory,
                options: param.options
            }));

            const payload = {
                playbookId: playbookId,
                // processId: existingProcessId,
                processName: processName,
                shortDescription: processDescription || undefined,
                nodeList: transformedNodes,
                processParameters: formattedProcessParams,
                processDependency: fromProcess ? {
                    parentProcessId: fromProcess.id,
                    // playbookId: playbookId,
                    trigger: 'PENDING',
                } : null

            };

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.log(response)
                throw new Error("[New Process Page] Failed to save process");
            }

            // const savedData = await response.json();


            setIsSubmitting(false);
            setSuccessMessage('Process created successfully. Redirecting...');
            setTimeout(() => router.push(returnEndpoint), 1500);

        } catch (error: any) {
            console.error(error.message || "[New Process Page] Error saving process:");
            setError("Failed to save process. Please try again.");
            setIsSubmitting(false)
        }

    }

    if (isLoading) {
        return (
            <div>
                {/* <NavBar /> */}
                <Container className="py-5">
                    <div className="d-flex justify-content-center">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <div>
            <Container className="py-4">
                {/* header */}
                <div className="mb-4">
                    <h1 className="mt-2" style={{ color: '#14213D' }}>
                        Create a New Process
                    </h1>
                </div>

                {error && (
                    <Alert variant="danger" onClose={() => setError(null)} dismissible>
                        {error}
                    </Alert>
                )}

                {successMessage && (
                    <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>
                        {successMessage}
                    </Alert>
                )}

                {/* Enter Process name and description  */}
                <Card className="mb-4">
                    <Card.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Process Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter Process name"
                                value={processName}
                                onChange={(e) => setProcessName(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group className='mb-3'>
                            <Form.Label>Description (optional)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                placeholder="Enter a short description"
                                value={processDescription}
                                onChange={(e) => setProcessDescription(e.target.value)}
                            />
                        </Form.Group>

                        {/* Process dependencies. */}
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label> From Process</Form.Label>
                                    {renderFromProcessTooltip()}

                                    <Form.Select
                                        value={fromProcess?.name}
                                        onChange={(e) => {
                                            const selectedProcess = existingProcesses.find(process => process.name === e.target.value);
                                            setFromProcess(selectedProcess || null);
                                        }}
                                        style={{ maxWidth: '250px' }}
                                    >
                                        <option key="no-process" value="">No process</option>
                                        {existingProcesses.map((process) => (
                                            <option
                                                key={process.id}
                                                value={process.name}
                                            >
                                                {process.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            {/* <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Next Process</Form.Label>
                                    <Form.Select>
                                        <option value="">No next Process</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="archived">Archived</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col> */}
                        </Row>
                    </Card.Body>
                </Card>

                {/* Content */}
                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'nodes')} className="mb-4">
                    {/* Nodes tab */}
                    <Tab eventKey="nodes" title="Nodes">
                        <div className="d-flex justify-content-between mb-3">
                            <h5>Process Nodes</h5>
                            <Button
                                variant="outline-primary"
                                onClick={handleAddNode}
                                style={{ borderColor: '#FEC872', color: '#14213D', borderRadius: '8px' }}
                                className="d-flex align-items-center"
                            >
                                <FiPlus size="1em" className="me-1" /> Add Node
                            </Button>
                        </div>

                        {/* Display all nodes. */}
                        {nodeList.map((node) => renderNodeBox(node))}
                        {nodeList.length === 0 && (
                            <div className="text-center py-5 bg-light rounded">
                                <p className="text-muted mb-3">No nodes added yet.</p>
                                <Button
                                    onClick={handleAddNode}
                                    variant="outline-primary"
                                    style={{ borderColor: '#FEC872', color: '#14213D', borderRadius: '8px' }}
                                    className="d-flex align-items-center mx-auto"
                                >
                                    <FiPlus size="1em" className="me-1" /> Add Your First Node
                                </Button>
                            </div>
                        )}

                    </Tab>

                    {/* Process parameters tab */}
                    <Tab eventKey="parameters" title="Process Parameters">
                        {renderProcessParameters()}
                    </Tab>
                </Tabs>

                {/* Save and cancel buttons */}
                <div className="mt-4 d-flex justify-content-between">
                    <Button
                        onClick={() => router.replace(returnEndpoint)}
                        variant="outline-secondary"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleSave()}
                        variant="primary"
                        disabled={isSubmitting}
                        style={{ backgroundColor: '#14213D', borderColor: '#14213D', borderRadius: '8px' }}
                        className="d-flex align-items-center"
                    >
                        {isSubmitting ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <FiSave size="1em" className="me-1" /> Create Process
                            </>
                        )}
                    </Button>
                </div>
            </Container>
        </div>
    )
}
