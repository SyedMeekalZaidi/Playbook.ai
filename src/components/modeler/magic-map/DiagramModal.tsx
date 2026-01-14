/**
 * DiagramModal - Full-size diagram viewer with "Create as New Process" action
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
// CRITICAL: Use full dist bundle, not lib/Viewer (missing moddle packages)
import Viewer from 'bpmn-js/dist/bpmn-navigated-viewer.production.min.js';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Plus, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DiagramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  xml: string | null;
  suggestedName?: string | null; // AI-suggested process name
  onCreateProcess: (xml: string, name: string) => Promise<void>;
}

const DiagramModal: React.FC<DiagramModalProps> = ({
  open,
  onOpenChange,
  xml,
  suggestedName,
  onCreateProcess,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create process form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [processName, setProcessName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Import diagram when XML changes
  useEffect(() => {
    console.log('[DiagramModal] useEffect triggered', {
      hasContainer: !!containerRef.current,
      hasXml: !!xml,
      xmlLength: xml?.length,
      open,
    });

    if (!xml || !open) {
      console.log('[DiagramModal] Early return - missing xml or not open', {
        hasXml: !!xml,
        open,
      });
      return;
    }

    let viewer: any = null;
    let mounted = true;

    // Initialize viewer and import XML
    const initializeViewer = async () => {
      console.log('[DiagramModal] 🚀 Starting initialization');
      setIsLoading(true);
      setError(null);
      
      try {
        // CRITICAL: Wait for the container ref to be populated (Portal mounting delay)
        console.log('[DiagramModal] ⏳ Waiting for container ref to be ready...');
        let attempts = 0;
        while (!containerRef.current && mounted && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 50));
          attempts++;
          console.log(`[DiagramModal] 🔄 Container check attempt ${attempts}/50`);
        }
        
        if (!containerRef.current) {
          console.error('[DiagramModal] ❌ Container ref never became available after 2.5s');
          setError('Failed to initialize viewer container');
          setIsLoading(false);
          return;
        }
        
        console.log('[DiagramModal] ✓ Container ref is ready!', {
          attempts,
          containerDimensions: {
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight,
          },
        });
        
        if (!mounted) {
          console.log('[DiagramModal] ❌ Component unmounted during container wait');
          return;
        }
        
        console.log('[DiagramModal] 📦 Creating Viewer instance...');
        
        // Create viewer instance
        viewer = new Viewer({
          container: containerRef.current,
        });

        viewerRef.current = viewer;
        console.log('[DiagramModal] ✓ Viewer instance created');
        
        // Wait for the viewer's internal canvas to initialize
        console.log('[DiagramModal] ⏳ Waiting for canvas initialization (100ms)...');
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('[DiagramModal] ✓ Canvas initialization wait complete');
        
        if (!mounted) {
          console.log('[DiagramModal] ❌ Component unmounted during canvas wait');
          return;
        }
        
        // Clean XML
        const cleanedXml = xml
          .replace(/^\uFEFF/, '')
          .replace(/[\u200B-\u200D\uFEFF]/g, '')
          .trim();
        
        console.log('[DiagramModal] 📄 Importing XML...', {
          xmlLength: cleanedXml.length,
          startsWithXml: cleanedXml.startsWith('<?xml'),
        });
        
        // Import XML
        const importStart = Date.now();
        const result = await viewer.importXML(cleanedXml);
        const importDuration = Date.now() - importStart;
        
        console.log('[DiagramModal] ✓ XML imported successfully', {
          duration: `${importDuration}ms`,
          hasWarnings: result.warnings && result.warnings.length > 0,
        });
        
        if (!mounted) {
          console.log('[DiagramModal] ❌ Component unmounted after import');
          return;
        }
        
        // Zoom to fit
        console.log('[DiagramModal] 🔍 Zooming to fit viewport...');
        const canvas = viewer.get('canvas');
        canvas.zoom('fit-viewport');
        console.log('[DiagramModal] ✓ Zoom complete');
        
        console.log('[DiagramModal] 🎉 Initialization complete - setting isLoading to false');
        setIsLoading(false);
      } catch (err: any) {
        if (!mounted) {
          console.log('[DiagramModal] ❌ Error after unmount (ignored)');
          return;
        }
        
        console.error('[DiagramModal] ❌ Failed to import XML:', {
          error: err,
          errorMessage: err.message,
          xmlPreview: xml?.substring(0, 200),
        });
        setError('Failed to render diagram');
        setIsLoading(false);
      }
    };

    console.log('[DiagramModal] 🏁 Calling initializeViewer()');
    initializeViewer();

    // Cleanup
    return () => {
      console.log('[DiagramModal] 🧹 Cleanup function called');
      mounted = false;
      if (viewer) {
        try {
          viewer.destroy();
          console.log('[DiagramModal] ✓ Viewer destroyed');
        } catch (e) {
          console.log('[DiagramModal] ⚠️ Error destroying viewer (ignored):', e);
        }
      }
      viewerRef.current = null;
    };
  }, [xml, open]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setShowCreateForm(false);
      setProcessName('');
      setCreateError(null);
      setCreateSuccess(false);
    }
  }, [open]);

  const handleCreateClick = () => {
    setShowCreateForm(true);
    setCreateError(null);
    // Pre-fill with suggested name if available
    if (suggestedName) {
      setProcessName(suggestedName);
    }
  };

  const handleCreateSubmit = async () => {
    if (!processName.trim() || !xml) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      await onCreateProcess(xml, processName.trim());
      setCreateSuccess(true);
      
      // Close modal after brief success indicator
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    } catch (err: any) {
      console.error('[DiagramModal] Failed to create process:', err);
      setCreateError(err.message || 'Failed to create process. Please try again.');
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isCreating) {
      handleCreateSubmit();
    }
  };

  return (
    <>
      {/* Hide process label (Process_1) in diagram */}
      <style jsx global>{`
        .djs-container .djs-group[data-element-id="Process_1"],
        .djs-container .djs-label[data-element-id="Process_1"] {
          display: none !important;
        }
      `}</style>
      
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="xl" className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Preview Diagram</DialogTitle>
          </DialogHeader>

          {/* Diagram viewer - FULL SIZE */}
          <div className="flex-1 min-h-[65vh] relative bg-white border border-border rounded-lg overflow-hidden">
            <div ref={containerRef} className="absolute inset-0 w-full h-full" />

          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
                <span className="text-sm text-muted-foreground">Rendering diagram...</span>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="flex flex-col items-center gap-2 text-center p-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <span className="text-sm text-muted-foreground">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <DialogFooter className="flex flex-col gap-3 sm:justify-stretch">
          {/* Create as New Process button */}
          {!showCreateForm && !createSuccess && (
            <Button
              onClick={handleCreateClick}
              disabled={isLoading || !!error}
              className="bg-oxford-blue hover:bg-oxford-blue/90 w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create as New Process
            </Button>
          )}

          {/* Create form (animated reveal) */}
          <AnimatePresence>
            {showCreateForm && !createSuccess && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden w-full"
              >
                <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg border border-border w-full">
                  {/* Process Name Input - Horizontal layout with inline button */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full">
                    <label className="text-sm font-medium text-foreground whitespace-nowrap">
                      Process Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter process name..."
                      value={processName}
                      onChange={(e) => setProcessName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isCreating}
                      className="flex-1 w-full min-w-0"
                      autoFocus
                    />
                    <Button
                      onClick={handleCreateSubmit}
                      disabled={!processName.trim() || isCreating}
                      className="bg-oxford-blue hover:bg-oxford-blue/90 sm:w-auto w-full whitespace-nowrap"
                    >
                      {isCreating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Confirm
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Error message */}
                  {createError && (
                    <p className="text-xs text-red-600">{createError}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success indicator */}
          {createSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Process created successfully!
              </span>
            </motion.div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default DiagramModal;

