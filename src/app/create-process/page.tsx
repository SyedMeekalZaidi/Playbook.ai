'use client';
import React, {useState} from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Sidebar from '@/components/SideBar';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { Dropdown, DropdownButton } from "react-bootstrap";
import '@/styles/create-process.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface Parameter { //the individual parameter
    id: number; // (for UI control only)
    name: string; //(question/title)
    type: string;
    mandatory: boolean;
    options: [];
    //info: string
}

export default function newProcess () {
    const [processName, setProcessName] = useState('');

    const [paramList, setParamList] = useState<Parameter[]>([]);
    const [nextParamId, setNextParamId] = useState<number>(1);

    const handleAddParam = () => {
        const newParam: Parameter = {
            id: nextParamId,
            name: '',
            type: 'Checkbox',
            mandatory: false,
            options: []
        }

        setParamList([...paramList, newParam]);
        setNextParamId(nextParamId + 1);
    }

    const handleRemoveParam = (id:number) => {setParamList(prevList => prevList.filter(param => param.id !== id));}


    const renderParamBox = (param:Parameter) => {
        return (
            <div key={param.id} className='question-box border-b'>
                {/* Param name */}
                <div className='flex flex-row'>
                    <input
                        className='question-input'
                        type="text"
                        placeholder='Enter parameter'
                        value={param.name}
                        onChange={(e) =>
                            setParamList(prevList =>
                                prevList.map(p =>
                                    p.id === param.id ? { ...p, name: e.target.value } : p
                                )
                            )
                        }
                    />
                </div>

                {/* Question type */}
                <div className='flex flex-row justify-between border-b'>
                    <div className='flex flex-row ml-3'>
                        <DropdownButton id={`dropdown-basic-button-${param.id}`} title={`Type: ${param.type}`}>
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
                        onChange={() =>
                            setParamList(prevList =>
                                prevList.map(p =>
                                    p.id === param.id ? { ...p, mandatory: !p.mandatory } : p
                                )
                            )
                        }
                    />
                    <button onClick={() => handleRemoveParam(param.id)}>
                        <img src="/trashcan.png" alt="remove" />
                    </button>
                </div>

                <div className='mt-3'>
                    {renderQuestionField(param.type)}
                </div>
            </div>
        )
    }

    const renderQuestionField = (questionType: string) => {
        switch (questionType) {
            case "Checkbox":
                return (
                    <div>
                        <label>
                            <input type="checkbox" />
                            <input type="text" placeholder='Enter your question' />
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

    const updateQuestionType = (id:number, newType:string) => {
        setParamList(prevList =>
            prevList.map(param =>
                param.id === id ? { ...param, type: newType } : param
            )
        );
    }

    const router = useRouter();
    const handleSave = async () => {

        // add validations

        try {
            const response = await fetch("/api/process/parameter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    processName,
                    parameters: paramList.map(({ id, ...param }) => param), // Remove `id` since it's for UI control
                }),
            });

            if (!response.ok) {
                console.log("Response not OK(page.tsx try):", response);
                throw new Error("Failed to save parameters.(page.tsx)");
            }

            const result = await response.json();
            console.log("Parameters saved:", result);
            alert("Process saved successfully!");

            router.push('/dashboard');

        } catch (error) {
            console.error(error);
            alert("Error saving the process.");
        }
    }

    // Manually add one item on component mount as default
    React.useEffect(() => {
        handleAddParam();
    }, []);

    return (
        <div>
           <NavBar/>

           {/* Main Container */}
           <div className='flex flex-row'>
                <Sidebar/>

                {/* content*/}
                <div className='main-container '>
                    {/* progress bar */}
                    <div className="steps">
                        <div className="step active">1. Assign a PIC</div>
                        <div className="step active">2. Gather Needs & Feasibility</div>
                        <div className="step">3. Confirm Collaboration</div>
                        <div className="step">4. Create Event</div>
                    </div>

                    <div className='content-container'>
                        <div className='button-bar'>
                            <button onClick={() => handleAddParam()}>
                                <img src="/plus.png" alt="add question" />
                            </button>
                        </div>

                        {/* container where param box will be added */}
                        <div id='content' className='content'>
                            {/* Process name */}
                            <input
                                className='question-input'
                                type="text"
                                placeholder='Enter process ID'
                                value={processName}
                                onChange={(e) => setProcessName(e.target.value)}
                            />

                            {paramList.map((param) => (renderParamBox(param)))}
                        </div>
                    </div>
                </div>
                <Button onClick={() => handleSave()}
                    className='fixed right-0 bottom-0 m-3'>
                        Save
                </Button>
           </div>
            <style jsx>{`
                .steps {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
                border-bottom: 1px solid #ddd;
                }
                .step {
                padding: 10px;
                color: #999;
                border-bottom: 3px solid transparent;
                flex: 1;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s ease-in-out;
                border-radius: 8px;
                }
                .step.active {
                color: #000;
                border-bottom: 3px solid #f0ad4e;
                }
            `}</style>
        </div>
    )
}

