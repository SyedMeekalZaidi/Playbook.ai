/**
 * DiagramPreview - Mini BPMN diagram viewer for chat bubbles
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
// CRITICAL: Use full dist bundle, not lib/Viewer (missing moddle packages)
import Viewer from 'bpmn-js/dist/bpmn-navigated-viewer.production.min.js';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import { Loader2, AlertCircle, Maximize2 } from 'lucide-react';

interface DiagramPreviewProps {
  xml: string;
  onClick: () => void;
  className?: string;
}

const DiagramPreview: React.FC<DiagramPreviewProps> = ({ xml, onClick, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !xml) return;

    let viewer: any = null;
    let mounted = true;

    // Initialize viewer and import XML
    const initializeViewer = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Create viewer instance
        viewer = new Viewer({
          container: containerRef.current!,
        });

        viewerRef.current = viewer;
        
        // IMPORTANT: Wait a tick for the viewer canvas to be ready
        await new Promise(resolve => setTimeout(resolve, 0));
        
        if (!mounted) return; // Component unmounted during init
        
        // Clean XML
        const cleanedXml = xml
          .replace(/^\uFEFF/, '')
          .replace(/[\u200B-\u200D\uFEFF]/g, '')
          .trim();
        
        console.log('[DiagramPreview] Importing XML length:', cleanedXml.length);
        
        // Import XML
        const result = await viewer.importXML(cleanedXml);
        
        if (!mounted) return; // Component unmounted during import
        
        if (result.warnings && result.warnings.length > 0) {
          console.warn('[DiagramPreview] Import warnings:', result.warnings);
        }
        
        // Zoom to fit
        const canvas = viewer.get('canvas');
        canvas.zoom('fit-viewport');
        
        setIsLoading(false);
      } catch (err: any) {
        if (!mounted) return;
        
        console.error('[DiagramPreview] Failed to import XML:', err);
        console.error('[DiagramPreview] XML first 200 chars:', xml.substring(0, 200));
        setError('Failed to render diagram');
        setIsLoading(false);
      }
    };

    initializeViewer();

    // Cleanup
    return () => {
      mounted = false;
      if (viewer) {
        try {
          viewer.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      viewerRef.current = null;
    };
  }, [xml]);

  return (
    <>
      {/* Hide process label (Process_1) in diagram preview */}
      <style jsx global>{`
        .djs-container .djs-group[data-element-id="Process_1"],
        .djs-container .djs-label[data-element-id="Process_1"] {
          display: none !important;
        }
      `}</style>
      
      <div
        onClick={onClick}
        className={`relative w-[280px] h-[180px] border border-border bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group ${className}`}
      >
        {/* Diagram container */}
        <div ref={containerRef} className="absolute inset-0 w-full h-full rounded-lg overflow-hidden" />

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-gold" />
            <span className="text-xs text-muted-foreground">Rendering...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white rounded-lg">
          <div className="flex flex-col items-center gap-2 text-center p-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <span className="text-xs text-muted-foreground">{error}</span>
          </div>
        </div>
      )}

      {/* Expand hint on hover */}
      {!isLoading && !error && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-oxford-blue/90 text-white rounded-md px-2 py-1 flex items-center gap-1">
            <Maximize2 className="h-3 w-3" />
            <span className="text-xs">Expand</span>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default DiagramPreview;
