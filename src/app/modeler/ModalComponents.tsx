'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Tab, Tabs } from 'react-bootstrap';
import { Playbook, Process } from './interfaces';

interface ModalComponentsProps {
  isClient: boolean;
  showNameDialog: boolean;
  setShowNameDialog: (show: boolean) => void;
  showDeleteConfirm: boolean;
  isLoadingPlaybooks: boolean;
  playbooks: Playbook[];
  playbookId: string;
  setPlaybookId: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  processName: string;
  setProcessName: (name: string) => void;
  isLoading: boolean;
  handleStartNewDiagram: () => void;
  isLoadingProcesses: boolean;
  playbookProcesses: Process[];
  selectedExistingProcess: string;
  setSelectedExistingProcess: (id: string) => void;
  handleLoadExistingProcess: () => void;
  setShowDeleteConfirm: (show: boolean) => void;
  handleDeleteProcess: () => void;
  processNameForDelete: string;
}

const ClientOnlyModal = ({ children, ...props }: React.ComponentProps<typeof Modal>) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <Modal {...props}>{children}</Modal>;
};

export const ModalComponents: React.FC<ModalComponentsProps> = ({
  isClient,
  showNameDialog,
  setShowNameDialog,
  showDeleteConfirm,
  isLoadingPlaybooks,
  playbooks,
  playbookId,
  setPlaybookId,
  activeTab,
  setActiveTab,
  processName,
  setProcessName,
  isLoading,
  handleStartNewDiagram,
  isLoadingProcesses,
  playbookProcesses,
  selectedExistingProcess,
  setSelectedExistingProcess,
  handleLoadExistingProcess,
  setShowDeleteConfirm,
  handleDeleteProcess,
  processNameForDelete,
}) => {
  return (
    <>
      {isClient && (
        <ClientOnlyModal 
          show={showNameDialog} 
          onHide={() => setShowNameDialog(false)} 
          backdrop="static" 
          keyboard={false}
        >
          <Modal.Header>
            <Modal.Title>BPMN Process Modeler</Modal.Title>
            <Button
              variant="close"
              onClick={() => setShowNameDialog(false)}
              style={{ position: 'absolute', right: '10px', top: '10px', padding: '0.25rem', lineHeight: '1' }}
              aria-label="Close"
            />
          </Modal.Header>
          <Modal.Body>
            {isLoadingPlaybooks ? (
              <div className="text-center my-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading playbooks...</p>
              </div>
            ) : (
              <>
                {playbooks.length > 0 ? (
                  <Form.Group className="mb-3">
                    <Form.Label>Select a playbook:</Form.Label>
                    <Form.Select
                      value={playbookId}
                      onChange={(e) => setPlaybookId(e.target.value)}
                    >
                      {playbooks.map(pb => (
                        <option key={pb.id} value={pb.id}>{pb.name}</option>
                      ))}
                    </Form.Select>
                    <div className="text-muted small mt-1">
                      Total playbooks: {playbooks.length}
                    </div>
                  </Form.Group>
                ) : (
                  <div className="alert alert-warning">
                    No playbooks available. Creating a default playbook...
                  </div>
                )}

                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => k && setActiveTab(k)}
                  className="mb-3"
                >
                  <Tab eventKey="new" title="Create New Process">
                    <Form.Group className="mb-3">
                      <Form.Label>Enter a name for your new process:</Form.Label>
                      <Form.Control
                        type="text"
                        value={processName}
                        onChange={(e) => setProcessName(e.target.value)}
                        placeholder="My Business Process"
                        autoFocus
                        disabled={!playbookId}
                      />
                    </Form.Group>
                    <Button
                      variant="primary"
                      className="w-100"
                      onClick={handleStartNewDiagram}
                      disabled={!processName.trim() || !playbookId || isLoading || isLoadingPlaybooks}
                    >
                      {isLoading ? 'Creating...' : 'Create New Process'}
                    </Button>
                  </Tab>
                  <Tab eventKey="load" title="Load Existing Process">
                    {isLoadingProcesses ? (
                      <div className="text-center my-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Loading processes...</p>
                      </div>
                    ) : playbookProcesses.length > 0 ? (
                      <>
                        <Form.Group className="mb-3">
                          <Form.Label>Select an existing process:</Form.Label>
                          <Form.Select
                            value={selectedExistingProcess}
                            onChange={(e) => setSelectedExistingProcess(e.target.value)}
                          >
                            <option value="">-- Select a process --</option>
                            {playbookProcesses.map(proc => (
                              <option key={proc.id} value={proc.id}>{proc.name}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                        <Button
                          variant="primary"
                          className="w-100"
                          onClick={handleLoadExistingProcess}
                          disabled={!selectedExistingProcess || isLoading}
                        >
                          {isLoading ? 'Loading...' : 'Load Process'}
                        </Button>
                      </>
                    ) : (
                      <div className="alert alert-info">
                        No processes available in this playbook. Create a new one instead.
                      </div>
                    )}
                  </Tab>
                </Tabs>
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="justify-content-between">
            <div className="text-muted small">
              {activeTab === 'new' ? 'Creating a new process...' : 'Loading an existing process...'}
            </div>
          </Modal.Footer>
        </ClientOnlyModal>
      )}

      {isClient && (
        <ClientOnlyModal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Deletion</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="alert alert-danger">
              <p>Are you sure you want to delete the process "{processNameForDelete}"?</p>
              <p>This action cannot be undone and all associated data will be permanently removed.</p>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteProcess}>
              Delete Process
            </Button>
          </Modal.Footer>
        </ClientOnlyModal>
      )}
    </>
  );
};