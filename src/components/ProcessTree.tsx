interface ProcessTreeProps {
  processes: Process[];
  onSelectProcess: (processId: string) => void;
}

const ProcessTree: React.FC<ProcessTreeProps> = ({ processes, onSelectProcess }) => {
  // Find root processes (those without parents)
  const rootProcesses = processes.filter(p => !p.parentId);
  
  const renderProcess = (process: Process) => {
    // Find children of this process
    const children = processes.filter(p => p.parentId === process.id);
    
    return (
      <div key={process.id} className="process-item">
        <div 
          className="process-name" 
          onClick={() => onSelectProcess(process.id)}
        >
          {process.name}
        </div>
        
        {children.length > 0 && (
          <div className="process-children" style={{ marginLeft: '15px' }}>
            {children.map(child => renderProcess(child))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="process-tree">
      {rootProcesses.map(process => renderProcess(process))}
    </div>
  );
};