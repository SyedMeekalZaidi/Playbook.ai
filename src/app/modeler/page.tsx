'use client';

import React from 'react';
import styles from './page.module.css';
import NavBar from '../../components/NavBar';
import BpmnModelerComponent from '../../components/BpmnModeler';
import { ModalComponents } from './ModalComponents';
import { DebugPanel } from './DebugPanel';
import { useModeler } from './useModeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

export default function ModelerPage() {
  const {
    modelerRef,
    processName,
    processId,
    playbookId,
    playbooks,
    processes,
    playbookProcesses,
    selectedExistingProcess,
    nodes,
    debugEntries,
    selectedElement,
    loadError,
    showNameDialog,
    showSaveSuccess,
    showDeleteConfirm,
    saveMessage,
    isClient,
    isLoading,
    isLoadingPlaybooks,
    isLoadingProcesses,
    activeTab,
    setPlaybookId,
    setProcessName,
    setSelectedExistingProcess,
    setActiveTab,
    setShowDeleteConfirm, // Added to destructure
    handleStartNewDiagram,
    handleLoadExistingProcess,
    handleElementSelect,
    handleSaveDiagram,
    handleDeleteProcess,
    handleElementCreate,
    handleElementUpdate,
    handleElementDelete,
    handleSaveSuccess,
  } = useModeler();

  return (
    <div className="page-container">
      <NavBar />
      <main className={`${styles.main} pt-4`}>
        <h1 className={styles.title}>BPMN Process Modeler</h1>
        <p className={styles.description}>
          Create and edit BPMN diagrams with database integration
        </p>

        <ModalComponents
          isClient={isClient}
          showNameDialog={showNameDialog}
          showDeleteConfirm={showDeleteConfirm}
          isLoadingPlaybooks={isLoadingPlaybooks}
          playbooks={playbooks}
          playbookId={playbookId}
          setPlaybookId={setPlaybookId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          processName={processName}
          setProcessName={setProcessName}
          isLoading={isLoading}
          handleStartNewDiagram={handleStartNewDiagram}
          isLoadingProcesses={isLoadingProcesses}
          playbookProcesses={playbookProcesses}
          selectedExistingProcess={selectedExistingProcess}
          setSelectedExistingProcess={setSelectedExistingProcess}
          handleLoadExistingProcess={handleLoadExistingProcess}
          setShowDeleteConfirm={setShowDeleteConfirm}
          handleDeleteProcess={handleDeleteProcess}
          processNameForDelete={processName}
        />

        {showSaveSuccess && (
          <div className={styles.successAlert}>
            <span>{saveMessage}</span>
          </div>
        )}

        {loadError && (
          <div className={styles.errorPanel}>
            <h3>Error Loading Diagram</h3>
            <p>{loadError}</p>
          </div>
        )}

        {processId && !showNameDialog && (
          <>
            <div className={styles.processHeader}>
              <h2>{processName}</h2>
              <div className={styles.processInfo}>
                <span>Process ID: {processId}</span>
                <span>Playbook: {playbooks.find(p => p.id === playbookId)?.name || playbookId}</span>
                <span>Nodes: {nodes.length}</span>
              </div>
            </div>

            <div className={styles.modelerWrapper}>
              <BpmnModelerComponent
                ref={modelerRef}
                processes={processes}
                nodes={nodes}
                onElementSelect={handleElementSelect}
                onElementCreate={handleElementCreate}
                onElementUpdate={handleElementUpdate}
                onElementDelete={handleElementDelete}
                onSave={handleSaveSuccess}
                onError={(error) => setLoadError(error)}
                playbookId={playbookId}
                processId={processId}
              />

              <div className={styles.actionsBar}>
                <button
                  className={styles.saveButton}
                  onClick={handleSaveDiagram}
                >
                  Save Diagram
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => setShowDeleteConfirm(true)} // Use destructured setShowDeleteConfirm
                >
                  Delete Process
                </button>
              </div>
            </div>

            <DebugPanel
              selectedElement={selectedElement}
              debugEntries={debugEntries}
              processes={processes}
              nodes={nodes}
            />
          </>
        )}
      </main>
    </div>
  );
}