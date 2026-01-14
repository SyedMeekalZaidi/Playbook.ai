/**
 * DocumentationViewer - Renders HTML documentation in preview mode
 * Displays styled prose typography with empty state
 */

'use client';

import React from 'react';
import { FileText } from 'lucide-react';

interface DocumentationViewerProps {
  content: string;
}

const DocumentationViewer: React.FC<DocumentationViewerProps> = ({ content }) => {
  // Empty state
  if (!content || content === '<p></p>' || content.trim() === '') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          No documentation added yet.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Switch to Edit mode to add content.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3">
      <div 
        className="tiptap-content prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};

export default DocumentationViewer;
