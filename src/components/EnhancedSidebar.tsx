import React, { useState, useEffect } from 'react';
import { ProcessTreeProvider } from './ProcessTreeContext';
import ProcessTree from './ProcessTree';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { PlaybookAPI } from '@/services/api'; // Import PlaybookAPI

interface Playbook {
  id: string;
  name: string;
  shortDescription?: string;
}

interface User {
  id: string;
  email: string;
  role: string;
}

interface EnhancedSidebarProps {
  defaultPlaybookId?: string;
  onSelectProcess?: (processId: string) => void;
  onSelectNode?: (nodeId: string) => void;
  user: User; // must pass User as input
}

const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({
  defaultPlaybookId,
  onSelectProcess,
  onSelectNode,
  user
}) => {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>(defaultPlaybookId || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaybooks = async () => {
      setLoading(true);
      setError(null);

      try {
        let fetchedPlaybooks;
        if (user.role === 'ADMIN') {
          fetchedPlaybooks = await PlaybookAPI.getAll({ ownerId: user.id });
        } else { // Assuming 'USER' or other roles see published playbooks
          fetchedPlaybooks = await PlaybookAPI.getAll({ status: 'PUBLISHED' });
        }

        setPlaybooks(fetchedPlaybooks || []);

        // If no playbook is selected and we have playbooks, select the first one
        if (!selectedPlaybookId && fetchedPlaybooks && fetchedPlaybooks.length > 0) {
          setSelectedPlaybookId(fetchedPlaybooks[0].id);
        }

      } catch (err: any) {
        console.error('Error fetching playbooks:', err);
        setError(err instanceof Error ? err.message : '[Sidebar] Failed to load playbooks');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaybooks();
  }, [user.id, user.role, selectedPlaybookId]); // Added user.role dependency

  const handlePlaybookChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlaybookId(e.target.value);
  };

  return (
    <div className="sidebar-wrapper">
      <div className="playbook-selector">
        <Form.Group controlId="playbookSelect">
          <Form.Label>Select Playbook</Form.Label>
          <Form.Select
            value={selectedPlaybookId}
            onChange={handlePlaybookChange}
            disabled={loading || playbooks.length === 0}
          >
            {playbooks.length === 0 ? (
              <option value="">No playbooks available</option>
            ) : (
              <>
                <option value="">-- Select a Playbook --</option>
                {playbooks.map(playbook => (
                  <option key={playbook.id} value={playbook.id}>
                    {playbook.name}
                  </option>
                ))}
              </>
            )}
          </Form.Select>
        </Form.Group>

        {loading && (
          <div className="text-center my-2">
            <Spinner animation="border" size="sm" role="status" style={{ color: '#FEC872' }}>
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        )}
      </div>

      {selectedPlaybookId ? (
        <ProcessTreeProvider>
          <ProcessTree
            playbookId={selectedPlaybookId}
            onSelectProcess={onSelectProcess}
            onSelectNode={onSelectNode}
          />
        </ProcessTreeProvider>
      ) : (
        <div className="sidebar no-playbook">
          <p className="text-center pt-4">
            {error ? (
              <span className="text-danger">{error}</span>
            ) : (
              <span>Select a playbook to view its process tree</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedSidebar;