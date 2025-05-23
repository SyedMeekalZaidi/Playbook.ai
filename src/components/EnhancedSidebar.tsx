import React, { useState, useEffect } from 'react';
import { ProcessTreeProvider } from './ProcessTreeContext';
import ProcessTree from './ProcessTree';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { PlaybookAPI } from '@/services/api'; // Import PlaybookAPI
import { FiUser, FiUsers, FiCopy } from 'react-icons/fi';
import Select from 'react-select';

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

// Helper to determine playbook type
function getPlaybookType(playbook: any, user: User) {
  if (playbook.type) return playbook.type;
  if (playbook.sourcePlaybook) return 'implementor';
  if (playbook.ownerId === user.id) return 'my';
  return 'collaboration';
}

function getPlaybookIcon(type: string) {
  if (type === 'implementor') return <FiCopy className="playbook-icon" title="Implemented Playbook" style={{ color: '#14213D' }} />;
  if (type === 'collaboration') return <FiUsers className="playbook-icon" title="Collaboration Playbook" style={{ color: '#14213D' }} />;
  return <FiUser className="playbook-icon" title="My Playbook" style={{ color: '#14213D' }} />;
}

function getDisplayName(playbook: any, type: string) {
  if (type === 'implementor' && playbook.sourcePlaybook?.name) return playbook.sourcePlaybook.name;
  let name = playbook.name;
  // Remove trailing ' <email> Implementation' (not Implementor)
  name = name.replace(/\s+[^\s]+@[^\s]+\s+Implementation$/, '');
  return name;
}

const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({
  defaultPlaybookId,
  onSelectProcess,
  onSelectNode,
  user
}) => {
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>(defaultPlaybookId || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaybooks = async () => {
      setLoading(true);
      setError(null);
      try {
        let myPlaybooks: any[] = [];
        let implementorPlaybooks: any[] = [];
        let collaborationPlaybooks: any[] = [];
        if (user.role === 'ADMIN') {
          myPlaybooks = await PlaybookAPI.getAll({ ownerId: user.id, isCopy: false });
        } else {
          myPlaybooks = await PlaybookAPI.getAll({ ownerId: user.id, isCopy: false });
        }
        implementorPlaybooks = await PlaybookAPI.getImplementorPlaybooks();
        collaborationPlaybooks = await PlaybookAPI.getCollaborationPlaybooks();

        // Tag each with a type
        const my = (myPlaybooks || []).map(pb => ({ ...pb, type: 'my' }));
        const impl = (implementorPlaybooks || []).map(pb => ({ ...pb, type: 'implementor' }));
        const collab = (collaborationPlaybooks || []).map(pb => ({ ...pb, type: 'collaboration' }));

        // Remove duplicates (by id)
        const all = [...my, ...impl, ...collab];
        const uniqueMap = new Map();
        all.forEach(pb => {
          uniqueMap.set(pb.id, pb);
        });
        const merged = Array.from(uniqueMap.values());
        setPlaybooks(merged);
        if (!selectedPlaybookId && merged.length > 0) {
          setSelectedPlaybookId(merged[0].id);
        }
      } catch (err: any) {
        console.error('Error fetching playbooks:', err);
        setError(err instanceof Error ? err.message : '[Sidebar] Failed to load playbooks');
      } finally {
        setLoading(false);
      }
    };
    fetchPlaybooks();
  }, [user.id, user.role, selectedPlaybookId]);

  const playbookOptions = playbooks.map(playbook => {
    const type = getPlaybookType(playbook, user);
    return {
      value: playbook.id,
      label: (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {getPlaybookIcon(type)}
          <span>{getDisplayName(playbook, type)}</span>
        </span>
      ),
      playbook,
      type,
    };
  });

  const selectedOption = playbookOptions.find(opt => opt.value === selectedPlaybookId) || null;

  return (
    <div className="sidebar-wrapper">
      <div className="playbook-selector">
        <Form.Group controlId="playbookSelect">
          <Form.Label>Select Playbook</Form.Label>
          <Select
            options={playbookOptions}
            value={selectedOption}
            onChange={opt => setSelectedPlaybookId(opt ? opt.value : '')}
            isClearable={false}
            isSearchable={true}
            classNamePrefix="react-select"
            styles={{
              option: (provided) => ({ ...provided, display: 'flex', alignItems: 'center' }),
              singleValue: (provided) => ({ ...provided, display: 'flex', alignItems: 'center' }),
            }}
          />
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