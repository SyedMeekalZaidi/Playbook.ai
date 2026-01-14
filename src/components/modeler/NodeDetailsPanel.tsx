/**
 * NodeDetailsPanel - Right sidebar for viewing/editing node documentation and parameters
 * Contains tabs: Node Editor | AI Magic Map
 */

'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileText, Sparkles, MousePointerClick } from 'lucide-react';
import { useNodeDetails } from '@/hooks/useNodeDetails';
import NodeEditorTab from './NodeEditorTab';
import MagicMapTab from './MagicMapTab';
import { MagicMapProvider } from './magic-map/MagicMapContext';

interface SelectedElement {
  element: {
    id: string;
    type: string;
    businessObject?: {
      name?: string;
      dbId?: string;
    };
  };
  databaseInfo?: {
    id: string;
    name: string;
    type: string;
    documentContent?: any;
  } | null;
}

interface NodeDetailsPanelProps {
  selectedElement: SelectedElement | null;
  playbookId: string;
  onProcessCreated: (processId: string) => void;
}

const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({ 
  selectedElement, 
  playbookId, 
  onProcessCreated 
}) => {
  // Controlled tab state - persists across node selection changes
  const [activeTab, setActiveTab] = React.useState<string>('editor');

  const {
    documentation,
    parameters,
    isDirty,
    isSaving,
    saveStatus,
    nodeId,
    nodeName,
    nodeType,
    setDocumentation,
    setParameters,
    updateParameter,
    addParameter,
    removeParameter,
    saveNow,
  } = useNodeDetails(selectedElement);

  return (
    <MagicMapProvider playbookId={playbookId} onProcessCreated={onProcessCreated}>
      <div className="h-full flex flex-col">
        {/* Tabs at the very top - ALWAYS VISIBLE */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <div className="p-3 border-b border-border bg-white/50 flex-shrink-0">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="editor" className="gap-2">
                <FileText className="h-4 w-4" />
                Node Editor
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-2">
                <Sparkles className="h-4 w-4" />
                AI Magic Map
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Node Editor Tab Content */}
          <TabsContent value="editor" className="flex-1 overflow-hidden m-0">
            {selectedElement?.databaseInfo ? (
              <NodeEditorTab
                nodeId={nodeId}
                nodeName={nodeName}
                nodeType={nodeType}
                documentation={documentation}
                setDocumentation={setDocumentation}
                parameters={parameters}
                setParameters={setParameters}
                updateParameter={updateParameter}
                addParameter={addParameter}
                removeParameter={removeParameter}
                isDirty={isDirty}
                isSaving={isSaving}
                saveStatus={saveStatus}
                saveNow={saveNow}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-oxford-blue mb-2">No Node Selected</h3>
                <p className="text-sm text-muted-foreground max-w-[240px]">
                  Click on a node in the diagram to view and edit its details
                </p>
              </div>
            )}
          </TabsContent>

          {/* AI Magic Map Tab Content */}
          <TabsContent value="ai" className="flex-1 overflow-hidden m-0">
            <MagicMapTab />
          </TabsContent>
        </Tabs>
      </div>
    </MagicMapProvider>
  );
};

export default NodeDetailsPanel;
