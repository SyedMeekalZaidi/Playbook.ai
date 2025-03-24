// components/BpmnViewer.tsx
'use client';

import { useEffect, useRef } from 'react';
import BpmnJSViewer from 'bpmn-js/lib/Viewer';
import BpmnJSNavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

interface BpmnViewerProps {
  diagramUrl: string;
  viewerType: 'viewer' | 'navigated-viewer';
  className?: string;
}

const editorMap = {
  'viewer': BpmnJSViewer,
  'navigated-viewer': BpmnJSNavigatedViewer
};

export default function BpmnViewer({ diagramUrl, viewerType, className }: BpmnViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const BpmnJS = editorMap[viewerType];
    viewerRef.current = new BpmnJS({
      container: containerRef.current
    });

    const loadDiagram = async () => {
      try {
        const response = await fetch(diagramUrl);
        const diagramXML = await response.text();
        await viewerRef.current.importXML(diagramXML);
      } catch (err) {
        console.error('Error loading diagram:', err);
      }
    };

    loadDiagram();

    return () => {
      viewerRef.current?.destroy();
    };
  }, [diagramUrl, viewerType]);

  return <div ref={containerRef} className={className} />;
}