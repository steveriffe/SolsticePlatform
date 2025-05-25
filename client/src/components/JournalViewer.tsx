import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Book, Edit } from 'lucide-react';
import JournalEditor from './JournalEditor';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface JournalViewerProps {
  flightId: number;
  journalEntry: any;
  onJournalUpdated: () => void;
}

const JournalViewer = ({ flightId, journalEntry, onJournalUpdated }: JournalViewerProps) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const hasJournal = journalEntry && Object.keys(journalEntry).length > 0;

  const openEditor = () => {
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
  };

  const handleSaved = () => {
    onJournalUpdated();
    closeEditor();
  };

  const openPreview = () => {
    setIsPreviewOpen(true);
  };

  return (
    <>
      {hasJournal ? (
        <Button
          variant="ghost"
          size="sm"
          className="text-primary h-8 w-8 p-0 mr-1"
          title="View journal"
          onClick={openPreview}
        >
          <Book className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="ghost" 
          size="sm"
          className="text-primary h-8 w-8 p-0 mr-1"
          title="Add journal"
          onClick={openEditor}
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <JournalEditor
            flightId={flightId}
            initialContent={journalEntry}
            onClose={closeEditor}
            onSave={handleSaved}
          />
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Flight Journal</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setIsPreviewOpen(false);
                  setIsEditorOpen(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
            
            <div className="prose max-w-none border rounded-md p-4 bg-white">
              <div dangerouslySetInnerHTML={{ __html: journalEntry }} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JournalViewer;