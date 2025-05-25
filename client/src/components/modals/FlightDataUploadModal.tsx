import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface FlightDataUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFlightsUploaded: (count: number) => void;
}

const FlightDataUploadModal = ({ isOpen, onClose, onFlightsUploaded }: FlightDataUploadModalProps) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Check if file is a supported type (CSV or Excel)
      const isCSV = selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv');
      const isExcel = 
        selectedFile.type === 'application/vnd.ms-excel' || 
        selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        selectedFile.name.endsWith('.xlsx') || 
        selectedFile.name.endsWith('.xls');
        
      if (!isCSV && !isExcel) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV or Excel file",
          variant: "destructive",
        });
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB
        toast({
          title: "File too large",
          description: "File size should be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
      setUploadError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      
      // Check if file is a supported type (CSV or Excel)
      const isCSV = droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv');
      const isExcel = 
        droppedFile.type === 'application/vnd.ms-excel' || 
        droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        droppedFile.name.endsWith('.xlsx') || 
        droppedFile.name.endsWith('.xls');
        
      if (!isCSV && !isExcel) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV or Excel file",
          variant: "destructive",
        });
        return;
      }
      
      if (droppedFile.size > 10 * 1024 * 1024) { // 10MB
        toast({
          title: "File too large",
          description: "File size should be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setFile(droppedFile);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a spreadsheet file to upload",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Use the new AI-powered endpoint that supports multiple file formats
      const response = await fetch('/api/flights/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      const data = await response.json();
      
      if (data.errors && data.errors.length > 0) {
        // Some rows had errors but some were imported
        if (data.count > 0) {
          toast({
            title: "Partial Success",
            description: `${data.count} flights imported. Some rows had errors.`,
            variant: "default",
          });
          setUploadError(`Imported ${data.count} flights with ${data.errors.length} errors. See details below.`);
        } else {
          // No rows were imported
          toast({
            title: "Import Failed",
            description: "No flights were imported due to errors",
            variant: "destructive",
          });
          setUploadError(`Import failed: ${data.errors.length} errors found. See details below.`);
        }
      } else {
        // All rows imported successfully
        toast({
          title: "Success",
          description: `${data.count} flights imported successfully`,
          variant: "default",
        });
        onFlightsUploaded(data.count);
        handleClose();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      let errorMessage = "Failed to process your flight data";
      
      if (error instanceof Error) {
        if (error.message.includes("Could not identify") || 
            error.message.includes("Missing required headers") || 
            error.message.includes("Could not map required headers")) {
          errorMessage = error.message;
        }
      }
      
      setUploadError(errorMessage);
      
      toast({
        title: "Error",
        description: "Failed to process flight data. See details below.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadCSVTemplate = () => {
    // Create CSV template content
    const csvContent = `departure_airport_iata,arrival_airport_iata,airline_code,flight_date,flight_duration_hours,flight_number,aircraft_type,tags
PDX,ANC,AS,2025-05-15,3.5,123,B738,Vacation;Family
SFO,LAX,UA,2025-06-01,1.2,456,A320,Business
JFK,LHR,BA,2025-07-10,7.5,112,B777,Vacation;Long-haul
`;
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'flight_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDownloadExcelTemplate = () => {
    toast({
      title: "Excel Template",
      description: "Our system can intelligently process Excel files with any column format. Just upload your file and our AI will do the rest!",
      variant: "default",
      duration: 3000,
    });
    
    // For users who prefer a more structured starting point
    fetch('/api/flights/template/excel')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to download Excel template');
        }
        return response.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'flight_template.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(error => {
        console.error('Error downloading Excel template:', error);
        toast({
          title: "Error",
          description: "Failed to download Excel template. Please try again.",
          variant: "destructive",
        });
      });
  };
  
  const handleAIHelpInfo = () => {
    toast({
      title: "AI-Powered Import",
      description: "Our system uses Google Gemini AI to intelligently identify fields in your spreadsheet, even with non-standard headers!",
      variant: "default",
      duration: 5000,
    });
  };

  const handleClose = () => {
    setFile(null);
    setUploadError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Flight Data</DialogTitle>
          <DialogDescription>
            Upload a spreadsheet with your flight data. CSV and Excel formats are supported with AI-powered field detection.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {uploadError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {uploadError}
              </AlertDescription>
            </Alert>
          )}
          
          <div 
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
              isDragging ? 'border-primary bg-primary-50' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-1 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <div className="flex text-sm text-gray-600">
                <label 
                  htmlFor="file-upload" 
                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-600"
                >
                  <span>Upload a file</span>
                  <Input
                    id="file-upload"
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                CSV or Excel files up to 10MB
              </p>
              {file && (
                <p className="text-sm text-primary mt-2">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>
          
          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="required-fields">
              <AccordionTrigger>Required Fields</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm mb-2">Your CSV must include these fields (names can vary):</p>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  <li><strong>Departure Airport</strong> (e.g., departure_airport_iata, from, origin)</li>
                  <li><strong>Arrival Airport</strong> (e.g., arrival_airport_iata, to, destination)</li>
                  <li><strong>Airline Code</strong> (e.g., airline_code, airline, carrier)</li>
                  <li><strong>Flight Date</strong> (e.g., flight_date, date, departure_date) - format: YYYY-MM-DD</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="optional-fields">
              <AccordionTrigger>Optional Fields</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm mb-2">These fields are optional but enhance your flight data:</p>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  <li><strong>Flight Duration</strong> (e.g., flight_duration_hours, duration, hours)</li>
                  <li><strong>Flight Number</strong> (e.g., flight_number, flight_no, flight#)</li>
                  <li><strong>Aircraft Type</strong> (e.g., aircraft_type, aircraft, plane, equipment)</li>
                  <li><strong>Tags</strong> (e.g., tags, categories, labels) - use semicolons to separate multiple tags</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="common-formats">
              <AccordionTrigger>AI-Powered Field Detection</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm mb-2">Our new AI-powered system can intelligently identify fields from various formats:</p>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  <li>Airline website exports (United, American, Delta, etc.)</li>
                  <li>Travel agency itineraries (Expedia, Kayak, Booking.com)</li>
                  <li>Trip tracking app exports (TripIt, App in the Air, etc.)</li>
                  <li>Flight logging software (FlightLogger, MyFlights, etc.)</li>
                  <li>Custom spreadsheets with nonstandard headers</li>
                </ul>
                <p className="text-sm mt-2 font-medium text-primary-600">Our AI can understand your data even if column names don't match exactly!</p>
                <p className="text-sm mt-2">For best results, include a few rows of real flight data in your spreadsheet.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <div className="mt-4 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Templates and Help:</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAIHelpInfo}
                className="h-8 flex items-center gap-1 text-xs"
              >
                <span>AI-powered</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04Z"></path>
                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04Z"></path>
                </svg>
              </Button>
            </div>
            <div className="flex space-x-4">
              <Button 
                variant="link" 
                onClick={handleDownloadCSVTemplate}
                className="p-0 h-auto text-primary"
              >
                CSV Template
              </Button>
              <Button 
                variant="link" 
                onClick={handleDownloadExcelTemplate}
                className="p-0 h-auto text-primary"
              >
                Excel Template
              </Button>
            </div>
            <p className="text-xs text-gray-500 italic">
              Our AI will identify your data regardless of format, but templates can be helpful for creating new spreadsheets.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              "Upload & Process"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FlightDataUploadModal;