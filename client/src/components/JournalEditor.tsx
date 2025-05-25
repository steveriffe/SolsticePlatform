import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface JournalEditorProps {
  flightId: number;
  initialContent?: any;
  onClose: () => void;
  onSave: () => void;
}

const JournalEditor = ({ flightId, initialContent, onClose, onSave }: JournalEditorProps) => {
  const [content, setContent] = useState(initialContent || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Toolbar configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link', 'image'
  ];

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await apiRequest('PATCH', `/api/flights/${flightId}/journal`, {
        journalEntry: content
      });
      
      toast({
        title: 'Success',
        description: 'Journal entry saved successfully',
      });
      
      onSave();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to save journal entry',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Flight Journal</h3>
        <p className="text-sm text-gray-500 mb-4">
          Record your flight experiences, notes, and memories
        </p>
        
        <div className="border rounded-md mb-4">
          <ReactQuill 
            theme="snow" 
            value={content} 
            onChange={setContent}
            modules={modules}
            formats={formats}
            className="min-h-[200px]"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Journal'}
        </Button>
      </div>
    </div>
  );
};

export default JournalEditor;