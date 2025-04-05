import React, { useEffect } from 'react';
import { useProcessTree } from './ProcessTreeContext';
import './SideBar.css';

interface ProcessTreeProps {
  playbookId: string;
  onSelectProcess?: (processId: string) => void;
  onSelectNode?: (nodeId: string) => void;
}

const ProcessTree: React.FC<ProcessTreeProps> = ({ 
  playbookId, 
  onSelectProcess, 
  onSelectNode 
}) => {
  const { 
    processes,
    nodes,
    loading,
    error,
    activeItemId,
    expandedProcesses,
    fetchTreeData,
    setActiveItem,
    toggleProcessExpand
  } = useProcessTree();

  useEffect(() => {
    fetchTreeData(playbookId);
  }, [playbookId, fetchTreeData]);

  // Build the process tree structure
  const buildProcessTree = () => {
    if (!processes.length) return [];
    
    const processMap = new Map();
    const rootProcesses = [];
    
    // First pass: create process objects with empty children arrays
    processes.forEach(process => {
      processMap.set(process.id, {
        ...process,
        subProcesses: [],
        nodes: nodes.filter(node => node.processId === process.id)
      });
    });
    
    // Second pass: build the tree structure
    processes.forEach(process => {
      const processWithData = processMap.get(process.id);
      
      if (process.parentId && processMap.has(process.parentId)) {
        // Add as child to parent
        const parentProcess = processMap.get(process.parentId);
        parentProcess.subProcesses.push(processWithData);
      } else {
        // Add to root processes
        rootProcesses.push(processWithData);
      }
    });
    
    return rootProcesses;
  };

  const handleProcessClick = (e: React.MouseEvent, processId: string) => {
    e.stopPropagation();
    setActiveItem(processId);
    toggleProcessExpand(processId);
    if (onSelectProcess) {
      onSelectProcess(processId);
    }
  };

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setActiveItem(nodeId);
    if (onSelectNode) {
      onSelectNode(nodeId);
    }
  };

  const getNodeIcon = (type: string | undefined) => {
    switch (type?.toLowerCase()) {
      case 'task':
      case 'usertask':
        return '⚙️';
      case 'startevent':
        return '▶️';
      case 'endevent':
        return '⏹️';
      case 'gateway':
        return '◇';
      case 'exclusivegateway':
        return '✧';
      case 'parallelgateway':
        return '⫱';
      case 'inclusivegateway':
        return '◯';
      default:
        return '•';
    }
  };

  const renderProcessTree = (processes: any[], depth = 0) => {
    return processes.map(process => {
      const isExpanded = expandedProcesses.has(process.id);
      const hasChildren = (process.subProcesses && process.subProcesses.length > 0) || 
                          (process.nodes && process.nodes.length > 0);
      const isActive = activeItemId === process.id;
      
      return (
        <li 
          key={process.id} 
          className={`sidebar-item process-item ${isActive ? 'active' : ''}`}
          style={{ paddingLeft: `${depth * 8 + 16}px` }}
        >
          <div 
            className="collapsible" 
            onClick={(e) => handleProcessClick(e, process.id)}
          >
            <span className="item-name">{process.name}</span>
            {hasChildren && (
              <span className={`expand-icon ${isExpanded ? '' : 'collapsed'}`}>
                ▾
              </span>
            )}
          </div>
          
          {isExpanded && (
            <>
              {/* Render nodes for this process */}
              {process.nodes && process.nodes.length > 0 && (
                <ul className="nested-list">
                  {process.nodes.map((node: any) => (
                    <li 
                      key={node.id} 
                      className={`node-item ${activeItemId === node.id ? 'active' : ''}`}
                      onClick={(e) => handleNodeClick(e, node.id)}
                    >
                      <span className="node-icon">{getNodeIcon(node.type)}</span>
                      <span className="node-name">{node.name}</span>
                    </li>
                  ))}
                </ul>
              )}
              
              {/* Render sub-processes recursively */}
              {process.subProcesses && process.subProcesses.length > 0 && (
                <ul className="nested-process-list">
                  {renderProcessTree(process.subProcesses, depth + 1)}
                </ul>
              )}
            </>
          )}
        </li>
      );
    });
  };

  if (loading) {
    return <div className="sidebar loading">Loading process tree...</div>;
  }

  if (error) {
    return <div className="sidebar error">{error}</div>;
  }

  const processTree = buildProcessTree();

  return (
    <div className="sidebar">
      <h5>Process Map</h5>
      {processTree.length > 0 ? (
        <ul className="sidebar-list">
          {renderProcessTree(processTree)}
        </ul>
      ) : (
        <div className="empty-state">
          No processes found for this playbook.
        </div>
      )}
    </div>
  );
};

export default ProcessTree;