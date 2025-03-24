// components/BpmnModeler.tsx
'use client';

import { useEffect, useRef } from 'react';
import BpmnJSModeler from 'bpmn-js/lib/Modeler';
import Clipboard from 'diagram-js/lib/features/clipboard/Clipboard';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

interface BpmnModelerProps {
  diagramUrl: string;
  className?: string;
  id?: string;
}

const additionalModulesMap: Record<string, any[]> = {
  'first-modeler': [['clipboard', ['value', new Clipboard()]]],
  'second-modeler': [['clipboard', ['value', new Clipboard()]]]
};

export default function BpmnModeler({ diagramUrl, className, id = '__default' }: BpmnModelerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const additionalModules = additionalModulesMap[id] || [];
    
    modelerRef.current = new BpmnJSModeler({
      container: containerRef.current,
      additionalModules
    });

    const loadDiagram = async () => {
      try {
        const response = await fetch(diagramUrl);
        const diagramXML = await response.text();
        await modelerRef.current.importXML(diagramXML);
      } catch (err) {
        console.error('Error loading diagram:', err);
      }
    };

    loadDiagram();

    return () => {
      modelerRef.current?.destroy();
    };
  }, [diagramUrl, id]);

  return <div ref={containerRef} className={className} />;
}