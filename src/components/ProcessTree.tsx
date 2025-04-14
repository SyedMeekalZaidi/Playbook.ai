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
    if (playbookId) {
      fetchTreeData(playbookId);
    }
  }, [playbookId]);

  const buildProcessTree = () => {
    type TreeProcess = typeof processes[number] & {
      subProcesses: TreeProcess[];
      nodes: typeof nodes;
    };

    const processMap = new Map<string, TreeProcess>();
    const rootProcesses: TreeProcess[] = [];

    // First pass: enrich each process
    processes.forEach(process => {
      processMap.set(process.id, {
        ...process,
        subProcesses: [],
        nodes: nodes.filter(node => node.processId === process.id)
      });
    });

    // Second pass: link parent-child
    processes.forEach(process => {
      const current = processMap.get(process.id);
      if (!current) return;

      if (process.parentId) {
        const parent = processMap.get(process.parentId);
        if (parent) {
          parent.subProcesses.push(current);
        } else {
          rootProcesses.push(current); // fallback to root if parent not found
        }
      } else {
        rootProcesses.push(current);
      }
    });

    return rootProcesses;
  };

  const handleProcessClick = (e: React.MouseEvent, processId: string) => {
    e.stopPropagation();
    setActiveItem(processId);
    toggleProcessExpand(processId);
    onSelectProcess?.(processId);
  };

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setActiveItem(nodeId);
    onSelectNode?.(nodeId);
  };

  const getNodeIcon = (type?: string) => {
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

  const renderProcessTree = (items: ReturnType<typeof buildProcessTree>, depth = 0): JSX.Element[] => {
    return items.map(process => {
      const isExpanded = expandedProcesses.has(process.id);
      const isActive = activeItemId === process.id;
      const hasChildren = process.subProcesses.length > 0 || process.nodes.length > 0;

      return (
        <li 
          key={process.id} 
          className={`sidebar-item process-item ${isActive ? 'active' : ''}`}
          style={{ paddingLeft: `${depth * 8 + 16}px` }}
        >
          <div className="collapsible" onClick={(e) => handleProcessClick(e, process.id)}>
            <span className="item-name">{process.name}</span>
            {hasChildren && (
              <span className={`expand-icon ${isExpanded ? '' : 'collapsed'}`}>▾</span>
            )}
          </div>

          {isExpanded && (
            <>
              {/* Render nodes */}
              {process.nodes.length > 0 && (
                <ul className="nested-list">
                  {process.nodes.map(node => (
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
              {process.subProcesses.length > 0 && (
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

  const tree = buildProcessTree();

  return (
    <div className="sidebar">
      <h5>Process Map</h5>
      {tree.length > 0 ? (
        <ul className="sidebar-list">
          {renderProcessTree(tree)}
        </ul>
      ) : (
        <div className="empty-state">No processes found for this playbook.</div>
      )}
    </div>
  );
};

export default ProcessTree;
