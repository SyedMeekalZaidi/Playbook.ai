'use client';
import React, {useState} from 'react';
import { useRouter } from 'next/navigation';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { Dropdown, DropdownButton } from "react-bootstrap";
import '@/styles/new-process.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavBar from '@/components/NavBar';

interface Process {
    name: string,
    description: string | null,
    nodes: Node[],
    playbookId: string,
    parentId: string | null,
    subProcesses: Process[]
    nextProcesses: ProcessOrder[]
    prevProcesses: ProcessOrder[]
}

interface ProcessOrder {
    fromId: string | null,
    toId: string | null,
    playbookId: string
}

interface Node {
    id: number,      // (for UI control only)
    name: string,
    type: string,   // Event | Task |  Gateway | ... (bpmn symbols)
    description: string | null,
    // processId: string,
    parameters: NodeParameter[]
}

interface NodeParameter {
    id: number      // (for UI control only)
    name: string    //(question/title)
    type: string    // checkbox | textbox | radio | ...
    mandatory: boolean
    info: string | null
    options: option[]
}
interface option {
    id: number,
    text: string
}

export default function newProcess () {
    const [processName, setProcessName] = useState('');
    const [nodeList, setNodeList] = useState<Node[]>([])
    const [nextNodeId, setNextNodeId] = useState<number>(1);

    const router = useRouter();

    const handleAddNode = () => {
        // creates new node object and adds it to the list
        const newNode: Node = {
            id: nextNodeId,
            name: '',
            type: 'Task',
            description: null,
            parameters: [],
            // processId: '',
        }


        setNodeList([...nodeList, newNode])

        handleAddParameter(newNode.id)  // add one parameter as default

        setNextNodeId(nextNodeId + 1)
    }

    const handleRemoveNode = (id:number) => {
        setNodeList(prevList => prevList.filter(node => node.id !== id));
    }


    const handleAddParameter = (nodeId:number) => {
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

    const handleRemoveParameter = (paramId:number) => {
        const node = nodeList.find(node => node.id === Math.floor(paramId));
        if (node) {
            const updatedParameters = node.parameters.filter(param => param.id !== paramId);
            setNodeList(prevList =>
            prevList.map(n =>
                n.id === node.id
                ? { ...n, parameters: updatedParameters }
                : n
            )
            );
        }
    }

    const handleAddOption = () => {}

    const handleRemoveOption = () => {}

    const renderNodeBox = (node:Node) => {
        // create node box html element
        return (
            <div key={node.id} className='question-box border-b'>
                {/* node name */}
                <input
                    className='question-input'
                    type="text"
                    placeholder='Enter Node title'
                    value={node.name}
                    onChange={(e) =>
                        setNodeList(prevList =>
                            prevList.map(p =>
                                p.id === node.id ? { ...p, name: e.target.value } : p
                            )
                        )
                    }
                />

                <div className='flex flex-row justify-between border-b'>
                    <div className='flex flex-row ml-3'>
                        <DropdownButton id={`dropdown-button-${node.id}`} title={`Type: ${node.type}`}>
                            <Dropdown.Item onClick={() => updateNodeType(node.id, "Event")}>Event</Dropdown.Item>
                            <Dropdown.Item onClick={() => updateNodeType(node.id, "Task")}>Task</Dropdown.Item>
                            <Dropdown.Item onClick={() => updateNodeType(node.id, "Subprocess")}>Subprocess</Dropdown.Item>
                        </DropdownButton>
                    </div>

                    <div className='mt-2'>
                        <button onClick={() => handleAddParameter(node.id)}>
                            <img src="/images/plus.png" alt="add-param" />
                        </button>
                        <button className='ml-2' onClick={() => handleRemoveNode(node.id)}>
                            <img src="/images/trash.png" alt="remove-node" />
                        </button>
                    </div>
                </div>

                <div className='m-6'>
                    {node.parameters.map((param) => renderParamBox(param))}
                </div>
            </div>
        )
    }

    const renderParamBox = (param:NodeParameter) => {
        // parameter html element
        return (
            <div key={param.id} className='question-box'>
                <input
                    type="text"
                    className='question-input'
                    placeholder='Enter parameter'
                    value={param.name}
                    onChange={(e) => {
                        setNodeList(prevList =>
                            prevList.map(node =>
                                node.id === Math.floor(param.id)
                                    ? {
                                        ...node,
                                        parameters: node.parameters.map(p =>
                                            p.id === param.id ? { ...p, name: e.target.value } : p
                                        )
                                    }
                                    : node
                            )
                        );
                    }}
                />

                {/* Question type */}
                <div className='flex flex-row justify-between border-b'>
                    <div className='flex flex-row ml-3'>
                        <DropdownButton id={`dropdown-button-${param.id}`} title={`Type: ${param.type}`}>
                            <Dropdown.Item onClick={() => updateQuestionType(param.id, "Checkbox")}>Checkbox</Dropdown.Item>
                            <Dropdown.Item onClick={() => updateQuestionType(param.id, "Radio")}>Radio</Dropdown.Item>
                            <Dropdown.Item onClick={() => updateQuestionType(param.id, "Textbox")}>Textbox</Dropdown.Item>
                        </DropdownButton>
                    </div>

                    {/* Mandatory */}
                    <Form.Check
                        type='checkbox'
                        label='Mandatory?'
                        id={`mandatory-checkbox-${param.id}`}
                        checked={param.mandatory}
                        onChange={() => {
                            setNodeList(prevList =>
                                prevList.map(node =>
                                    node.id === Math.floor(param.id)
                                        ? {
                                            ...node,
                                            parameters: node.parameters.map(p =>
                                                p.id === param.id ? { ...p, mandatory: !p.mandatory } : p
                                            )
                                        }
                                        : node
                                )
                            );

                        }}
                    />
                    <button onClick={() => handleRemoveParameter(param.id)}>
                        <img src="/images/trash.png" alt="remove-param" />
                    </button>
                </div>

                <div className='flex flex-row mt-3 justify-between'>
                    <div  className="flex-1">
                        {renderQuestionField(param.type)}
                    </div>
                    {(param.type === "Checkbox" || param.type === "Radio") && (
                        <button onClick={() => handleAddOption()}>
                            <img src="/images/plus.png" alt="add-option" />
                        </button>
                    )}
                </div>
            </div>
        )
    }

    const updateNodeType = (id:number, newType:string) => {
        setNodeList(prevList =>
            prevList.map(node =>
                node.id === id ? { ...node, type: newType } : node
            )
        );
    }

    const updateQuestionType = (id:number, type:string) => {
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

    const renderQuestionField = (questionType: string) => {
        switch (questionType) {
            case "Checkbox":
                return (
                    <div>
                        <label>
                            <input type="checkbox" />
                            <input type="text" placeholder='Enter option' />
                        </label>
                    </div>
                );
            case "Radio":
                return (
                    <div className="flex flex-col space-y-1">
                        <label>
                            <input type="radio" name="radio-group" />
                            <input type="text" placeholder='Enter option'/>
                        </label>
                    </div>
                );
            case "Textbox":
                return <textarea placeholder="Enter response..." className="border p-2 rounded w-full" />;
            default:
                return null;
        }
    };


    const handleSave = async() => {
        // add validations here
        // ensure process name is not empty,...
        if (!processName.trim()) {
            alert("Process name cannot be empty.");
            return;
        }

        if (nodeList.length === 0) {
            alert("At least one node must be added.");
            return;
        }

        for (const node of nodeList) {
            if (!node.name.trim()) {
            // alert(`Node with ID ${node.id} must have a name.`);
            alert("Each node must have a title")
            return;
            }

            // for (const param of node.parameters) {
            //     if (!param.name.trim()) {
            //         // alert(`Parameter with ID ${param.id} in Node ${node.id} must have a name.`);
            //         alert("Empty fields detected")
            //         return;
            //     }

            //     if ((param.type === "Checkbox" || param.type === "Radio") && param.options.length === 0) {
            //         // alert(`Parameter with ID ${param.id} in Node ${node.id} must have at least one option.`);
            //         alert("Empty fields detected")
            //         return;
            //     }
            // }

        }
        try {
            const response = await fetch("/api/process/new-process", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    processName,
                    nodeList,
                })
            });

            if (!response.ok){
                console.error("Error saving process (page.tsx)");
                throw new Error("Failed to save process");
            }

            alert("Process created successfully");
            router.push('/dashboard');

        } catch (error) {
            alert("Failed to save process");
        }
    }


    // Manually add one item on component mount as default
    React.useEffect(() => {
        handleAddNode();
    }, []);

    return (
        <div>
            <NavBar/>
            <div className='flex flex-row mt-7 gap-8'>
                <div className='border-r-2 border-black-400 p-3'>
                    <p>sidebar temporarily disabled</p>
                </div>

                {/* Main content */}
                <div className='flex flex-col p-3'>
                    {/* <p>progress bar</p> */}

                    <div className='flex flex-row flex-1'>
                        <div className='button-bar'>
                            <button onClick={() => handleAddNode()}>
                                <img src="/images/plus.png" alt="add new node" />
                            </button>
                        </div>

                        <div className='content'>
                            <input
                                className='question-input'
                                placeholder='Enter Process name'
                                type="text"
                                value={processName}
                                onChange={(e) => setProcessName(e.target.value)}
                            />

                            {nodeList.map((node) => (renderNodeBox(node)))}
                        </div>
                    </div>
                    <Button onClick={handleSave} className='fixed right-0 bottom-0 m-3'>
                        Save Process
                    </Button>
                </div>
            </div>
        </div>
    )
}

