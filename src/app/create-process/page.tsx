'use client';
import React, {useState} from 'react';
import NavBar from '@/components/NavBar';
import Sidebar from '@/components/SideBar';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import '@/styles/create-process.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface QuestionBox {
    id: number;
    content: React.JSX.Element;
}

export default function newProcess () {
    const [questionList, setQuestionList] = useState<QuestionBox[]>([]);
    const [nextId, setNextId] = useState<number>(1);

    const questionBox = () => { //temporary.
        return (
            <div className='question-box border-b'>
                <div className='flex flex-row'>
                    <input className='question-input'type="text" placeholder='Enter your question'/>
                </div>
                <div className='flex flex-row justify-between border-b'>
                    <div className='flex flex-row'>
                        <p>Type: check box</p>
                        {/*  add dropdown menu here*/}
                    </div>
                    <Form.Check
                        type='checkbox'
                        label='Mandatory?'
                        id={`mandatory-checkbox-${nextId}`}
                    />
                    <button onClick={() => handleRemoveQuestion(nextId)}>
                        <img src="/trashcan.png" alt="remove" />
                    </button>
                </div>
                <div>
                    <p>question answers here</p>
                </div>
            </div>
        )
    }

    const handleAddQuestion = () => {
        const newQuestion: QuestionBox = {
            id:nextId,
            content: (
                <div className='question-box border-b'>
                    <div className='flex flex-row'>
                        <input className='question-input'type="text" placeholder='Enter your question'/>
                    </div>
                    <div className='flex flex-row justify-between'>
                        <div className='flex flex-row border-1'>
                            <p>Type: check box  V</p>
                            {/*  add dropdown menu here*/}
                        </div>
                        <Form.Check
                            type='checkbox'
                            label='Mandatory?'
                            id={`mandatory-checkbox-${nextId}`}
                        />
                        <button onClick={() => handleRemoveQuestion(nextId)}>
                            <img src="/trashcan.png" alt="remove" />
                        </button>
                    </div>
                    <div>
                        <p>question answers here</p>
                    </div>
                </div>
            )
        }

        setQuestionList((prevList) => [...prevList, newQuestion]);
        setNextId(nextId + 1);
    };

    const handleRemoveQuestion = (id:number) => {
        setQuestionList((prevList) => prevList.filter((box) => box.id !== id));
    }

    const handleSaveProcess = () => {

    }


    return (
        <div>
           <NavBar/>

           {/* Main Container */}
           <div className='flex flex-row'>
                <Sidebar/>

                {/* content*/}
                <div className='main-container '>
                    <div className="steps">
                        <div className="step active">1. Assign a PIC</div>
                        <div className="step active">2. Gather Needs & Feasibility</div>
                        <div className="step">3. Confirm Collaboration</div>
                        <div className="step">4. Create Event</div>
                    </div>

                    <div className='content-container'>
                        <div className='button-bar'>
                            <button onClick={() => handleAddQuestion()}>
                                <img src="/plus.png" alt="add question" />
                            </button>
                            {/* <button>
                                <img src="/plus.png" alt="add question" />
                            </button>
                            <button>
                                <img src="/plus.png" alt="add question" />
                            </button> */}
                        </div>

                        {/* container where question box will be added */}
                        <div id='content' className='content'>
                            <input className='question-input' type="text" placeholder='Enter process name' />
                            {questionBox()}
                            {questionList.map((box) => (
                                <div key={box.id}>
                                    {box.content}
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
                <Button onClick={() => handleSaveProcess}
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