import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { insertFlightSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { calculateDistance } from "@/lib/flightUtils";
import { getAirportCoordinates, hasAirportCoordinates } from "@/lib/airportCoordinates";
import { calculateCarbonFootprint, formatCarbonFootprint } from "@/lib/carbonUtils";
import { Leaf, Info, Book } from "lucide-react";
import { useAirlines } from "@/hooks/useAirlines";
import { aircraftGroups } from "@/lib/aircraftData";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Extend the insert schema with validation rules
const formSchema = insertFlightSchema.extend({
  departureAirportIata: z.string().min(3).max(4).transform(val => val.toUpperCase()),
  arrivalAirportIata: z.string().min(3).max(4).transform(val => val.toUpperCase()),
  flightDate: z.string(),
  tags: z.string().optional(),
  tripCost: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  tripCostCurrency: z.string().optional().default("USD"),
}).omit({ userId: true, flightId: true, createdAt: true, distanceMiles: true, carbonFootprintKg: true });

interface AddFlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFlightAdded: () => void;
  editFlightId?: number;  // Optional ID for editing an existing flight
}

const AddFlightModal = ({ isOpen, onClose, onFlightAdded, editFlightId }: AddFlightModalProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);
  const [estimatedCarbonFootprint, setEstimatedCarbonFootprint] = useState<number | null>(null);
  const [journalContent, setJournalContent] = useState("");

  // Fetch airlines using our custom hook
  const { airlines, isLoading: isLoadingAirlines } = useAirlines();

  // Fetch airports for autocomplete
  const { data: airports } = useQuery({
    queryKey: ["/api/airports"],
    enabled: isOpen,
  });
  
  // Fetch aircraft types for dropdown
  const { data: aircraftTypes } = useQuery({
    queryKey: ["/api/aircraft-types"],
    enabled: isOpen,
  });

  // Fetch flight details if editing an existing flight
  const { data: flightToEdit, isLoading: isLoadingFlightToEdit } = useQuery({
    queryKey: ["/api/flights", editFlightId],
    enabled: isOpen && !!editFlightId,
  });

  const [isCarbonOffset, setIsCarbonOffset] = useState(false);
  const { register, handleSubmit, reset, control, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      departureAirportIata: "",
      arrivalAirportIata: "",
      airlineCode: "",
      flightDate: new Date().toISOString().split('T')[0],
      flightNumber: "",
      aircraftType: "",
      flightDurationHours: "",
      tags: "",
      tripCost: "",
      tripCostCurrency: "USD"
    }
  });
  
  // Watch departure and arrival airports to auto-calculate duration
  const departureAirport = useWatch({
    control,
    name: "departureAirportIata",
  });
  
  const arrivalAirport = useWatch({
    control,
    name: "arrivalAirportIata",
  });
  
  const airlineCode = useWatch({
    control,
    name: "airlineCode",
  });
  
  // Calculate estimated duration and distance when airports change
  // Populate form when editing an existing flight
  useEffect(() => {
    if (flightToEdit && editFlightId) {
      // Only set values when we have valid data
      if (flightToEdit.departureAirportIata) {
        setValue("departureAirportIata", flightToEdit.departureAirportIata);
      }
      
      if (flightToEdit.arrivalAirportIata) {
        setValue("arrivalAirportIata", flightToEdit.arrivalAirportIata);
      }
      
      setValue("airlineCode", flightToEdit.airlineCode || "NONE");
      
      // Safely handle date formatting
      if (flightToEdit.flightDate) {
        // Handle both string and Date objects
        const dateStr = typeof flightToEdit.flightDate === 'string' 
          ? flightToEdit.flightDate
          : flightToEdit.flightDate.toISOString();
          
        // Split at T to get just the date part (YYYY-MM-DD)
        setValue("flightDate", dateStr.split('T')[0]);
      }
      
      setValue("flightNumber", flightToEdit.flightNumber || "");
      setValue("aircraftType", flightToEdit.aircraftType || "");
      
      if (flightToEdit.flightDurationHours) {
        setValue("flightDurationHours", flightToEdit.flightDurationHours.toString());
      }
      
      if (flightToEdit.tags) {
        setValue("tags", flightToEdit.tags);
      }
      
      // Set trip cost fields if available
      if (flightToEdit.tripCost) {
        setValue("tripCost", flightToEdit.tripCost.toString());
      }
      
      setValue("tripCostCurrency", flightToEdit.tripCostCurrency || "USD");
      
      // Set carbon offset state
      setIsCarbonOffset(flightToEdit.isCarbonOffset || false);
      
      // Set journal content if available
      if (flightToEdit.journalEntry) {
        setJournalContent(flightToEdit.journalEntry as string);
      }

      // Set estimated values
      if (flightToEdit.distanceMiles) {
        setEstimatedDistance(flightToEdit.distanceMiles);
      }

      if (flightToEdit.flightDurationHours) {
        setEstimatedDuration(flightToEdit.flightDurationHours);
      }

      if (flightToEdit.carbonFootprintKg) {
        setEstimatedCarbonFootprint(flightToEdit.carbonFootprintKg);
      }
    }
  }, [flightToEdit, editFlightId, setValue]);

  // Calculate distance, duration, and carbon footprint when airports change
  useEffect(() => {
    if (departureAirport && arrivalAirport && 
        departureAirport.length >= 3 && arrivalAirport.length >= 3 &&
        hasAirportCoordinates(departureAirport) && hasAirportCoordinates(arrivalAirport)) {
      
      const depCoords = getAirportCoordinates(departureAirport);
      const arrCoords = getAirportCoordinates(arrivalAirport);
      
      // Calculate distance
      const distance = calculateDistance(
        depCoords[1], // latitude
        depCoords[0], // longitude
        arrCoords[1], // latitude
        arrCoords[0]  // longitude
      );
      setEstimatedDistance(distance);
      
      // Estimate duration (average speed of 500 miles per hour)
      const durationHours = distance / 500;
      // Round to nearest 0.1
      const roundedDuration = Math.round(durationHours * 10) / 10;
      setEstimatedDuration(roundedDuration);
      
      // Set the duration field if it's empty
      if (!watch("flightDurationHours")) {
        setValue("flightDurationHours", roundedDuration.toString());
      }
      
      // Calculate carbon footprint
      const aircraftType = watch("aircraftType");
      const carbonFootprint = calculateCarbonFootprint(distance, 1, aircraftType);
      setEstimatedCarbonFootprint(carbonFootprint);
    } else {
      // Only reset these values if we're not editing an existing flight
      if (!editFlightId) {
        setEstimatedDistance(null);
        setEstimatedDuration(null);
        setEstimatedCarbonFootprint(null);
      }
    }
  }, [departureAirport, arrivalAirport, setValue, watch, editFlightId]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Format flight number with airline code prefix if needed
      let formattedFlightNumber = data.flightNumber;
      // Only format if airlineCode is valid (not NONE)
      if (data.airlineCode && data.airlineCode !== "NONE" && data.flightNumber && !data.flightNumber.startsWith(data.airlineCode)) {
        formattedFlightNumber = `${data.airlineCode}${data.flightNumber}`;
      }
      
      // Set airlineCode to null if it's "NONE"
      if (data.airlineCode === "NONE") {
        data.airlineCode = "";
      }
      
      const flightData = {
        ...data,
        flightNumber: formattedFlightNumber,
        flightDurationHours: data.flightDurationHours ? parseFloat(data.flightDurationHours) : null,
        carbonFootprintKg: estimatedCarbonFootprint || null,
        isCarbonOffset: isCarbonOffset || false,
        journalEntry: journalContent || null
      };
      
      if (editFlightId) {
        // Update existing flight
        await apiRequest('PATCH', `/api/flights/${editFlightId}`, flightData);
        
        toast({
          title: "Success",
          description: "Flight updated successfully",
        });
      } else {
        // Add new flight
        await apiRequest('POST', '/api/flights', flightData);
        
        toast({
          title: "Success",
          description: "Flight added successfully",
        });
      }
      
      reset();
      setJournalContent("");
      onFlightAdded();
    } catch (error) {
      console.error('Error saving flight:', error);
      toast({
        title: "Error",
        description: editFlightId ? "Failed to update flight" : "Failed to add flight",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95%] sm:max-w-[500px] p-5 md:p-6">
        <DialogHeader className="mb-3 relative">
          <button 
            onClick={handleClose} 
            className="absolute right-0 top-0 rounded-full w-7 h-7 bg-muted hover:bg-muted-foreground/20 flex items-center justify-center"
            aria-label="Close dialog"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </button>
          <DialogTitle className="text-lg md:text-xl">{editFlightId ? "Edit Flight" : "Add New Flight"}</DialogTitle>
          <DialogDescription className="text-sm">
            Fill in the details of your flight. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-3 py-2 px-1">
            {/* Carbon Footprint Preview - Only show if available */}
            {estimatedCarbonFootprint && (
              <div className="bg-green-50 p-2 rounded-lg flex items-center shadow-sm">
                <div className="bg-green-100 p-1.5 rounded-full mr-2">
                  <Leaf className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-green-800">Est. Carbon: {formatCarbonFootprint(estimatedCarbonFootprint)}</h4>
                </div>
              </div>
            )}
            
            {/* Airports Row */}
            <div className="grid grid-cols-2 gap-2">
              {/* Departure Airport */}
              <div className="flex flex-col space-y-1">
                <Label htmlFor="departureAirportIata" className="text-xs">
                  From (IATA) *
                </Label>
                <div className="relative">
                  <Input
                    id="departureAirportIata"
                    placeholder="e.g. PDX"
                    {...register("departureAirportIata")}
                    className={`${errors.departureAirportIata ? "border-red-500" : ""} h-8 px-2 text-xs`}
                    autoCapitalize="characters"
                  />
                </div>
                {errors.departureAirportIata && (
                  <p className="text-xs text-red-500">{errors.departureAirportIata.message as string}</p>
                )}
              </div>
              
              {/* Arrival Airport */}
              <div className="flex flex-col space-y-1">
                <Label htmlFor="arrivalAirportIata" className="text-xs">
                  To (IATA) *
                </Label>
                <div className="relative">
                  <Input
                    id="arrivalAirportIata"
                    placeholder="e.g. SEA"
                    {...register("arrivalAirportIata")}
                    className={`${errors.arrivalAirportIata ? "border-red-500" : ""} h-8 px-2 text-xs`}
                    autoCapitalize="characters"
                  />
                </div>
                {errors.arrivalAirportIata && (
                  <p className="text-xs text-red-500">{errors.arrivalAirportIata.message as string}</p>
                )}
              </div>
            </div>
            
            {/* Airline and Date Row */}
            <div className="grid grid-cols-2 gap-2">
              {/* Airline */}
              <div className="flex flex-col space-y-1">
                <Label htmlFor="airlineCode" className="text-xs">Airline</Label>
                <Select
                  onValueChange={(value) => setValue("airlineCode", value)}
                  defaultValue={watch("airlineCode")}
                >
                  <SelectTrigger 
                    id="airlineCode"
                    className={`${errors.airlineCode ? "border-red-500" : ""} h-8 text-xs px-2`}
                  >
                    <SelectValue placeholder="Select airline" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[150px]">
                    <SelectItem value="NONE" className="py-1 text-xs">Unknown</SelectItem>
                    {airlines.map((airline) => (
                      <SelectItem 
                        key={airline.airlineId} 
                        value={airline.airlineId}
                        style={{
                          color: airline.brandColorPrimary || undefined
                        }}
                        className="py-1 text-xs"
                      >
                        {airline.airlineId} - {airline.airlineName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.airlineCode && (
                  <p className="text-xs text-red-500">{errors.airlineCode.message as string}</p>
                )}
              </div>
              
              {/* Flight Date */}
              <div className="flex flex-col space-y-1">
                <Label htmlFor="flightDate" className="text-xs">Date *</Label>
                <Input
                  id="flightDate"
                  type="date"
                  {...register("flightDate")}
                  className={`${errors.flightDate ? "border-red-500" : ""} h-8 px-2 text-xs`}
                />
                {errors.flightDate && (
                  <p className="text-xs text-red-500">{errors.flightDate.message as string}</p>
                )}
              </div>
            </div>
            
            {/* Flight Number & Aircraft Row */}
            <div className="grid grid-cols-2 gap-2">
              {/* Flight Number */}
              <div className="flex flex-col space-y-1">
                <Label htmlFor="flightNumber" className="text-xs">
                  Flight #
                  {airlineCode && airlineCode !== "NONE" && (
                    <span className="ml-1 text-xs text-green-600">(with {airlineCode})</span>
                  )}
                </Label>
                <div className="flex">
                  {airlineCode && airlineCode !== "NONE" && (
                    <div className="flex items-center justify-center h-8 px-1.5 text-xs border border-r-0 rounded-l-md border-input bg-muted">
                      {airlineCode}
                    </div>
                  )}
                  <Input
                    id="flightNumber"
                    placeholder={airlineCode && airlineCode !== "NONE" ? "123" : "AS123"}
                    {...register("flightNumber")}
                    className={`${errors.flightNumber ? "border-red-500" : ""} ${airlineCode && airlineCode !== "NONE" ? "rounded-l-none" : ""} h-8 px-2 text-xs`}
                    onChange={(e) => {
                      // Remove any airline code prefix if the user manually types it
                      const value = e.target.value;
                      if (airlineCode && airlineCode !== "NONE" && value.startsWith(airlineCode)) {
                        setValue("flightNumber", value.substring(airlineCode.length));
                      } else {
                        setValue("flightNumber", value);
                      }
                    }}
                  />
                </div>
                {errors.flightNumber && (
                  <p className="text-xs text-red-500">{errors.flightNumber.message as string}</p>
                )}
              </div>
              
              {/* Aircraft Type */}
              <div className="flex flex-col space-y-1">
                <Label htmlFor="aircraftType" className="text-xs">Aircraft</Label>
                <Select
                  onValueChange={(value) => setValue("aircraftType", value)}
                  defaultValue={watch("aircraftType")}
                >
                  <SelectTrigger 
                    id="aircraftType"
                    className={`${errors.aircraftType ? "border-red-500" : ""} h-8 text-xs px-2`}
                  >
                    <SelectValue placeholder="Select aircraft" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[150px]">
                    <SelectItem value="Unknown" className="py-1 text-xs">Unknown</SelectItem>
                    {aircraftGroups.map((group) => (
                      <SelectGroup key={group.label}>
                        <SelectLabel className="text-xs font-medium py-0.5">{group.label}</SelectLabel>
                        {group.options.map((aircraft) => (
                          <SelectItem key={aircraft} value={aircraft} className="py-1 text-xs">
                            {aircraft}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                    <SelectGroup>
                      <SelectLabel className="text-xs font-medium py-0.5">Other</SelectLabel>
                      <SelectItem value="Other (specify in tags)" className="py-1 text-xs">
                        Other (specify in tags)
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.aircraftType && (
                  <p className="text-xs text-red-500">{errors.aircraftType.message as string}</p>
                )}
              </div>
            </div>
            
            {/* Trip Cost Row */}
            <div className="grid grid-cols-2 gap-2">
              {/* Trip Cost Amount */}
              <div className="flex flex-col space-y-1">
                <Label htmlFor="tripCost" className="text-xs">Trip Cost</Label>
                <Input
                  id="tripCost"
                  placeholder="e.g. 350.00"
                  {...register("tripCost")}
                  className="h-8 px-2 text-xs"
                  type="number"
                  step="0.01"
                  min="0"
                />
                {errors.tripCost && (
                  <p className="text-xs text-red-500">{errors.tripCost.message as string}</p>
                )}
              </div>
              
              {/* Currency */}
              <div className="flex flex-col space-y-1">
                <Label htmlFor="tripCostCurrency" className="text-xs">Currency</Label>
                <Select
                  onValueChange={(value) => setValue("tripCostCurrency", value)}
                  defaultValue={watch("tripCostCurrency") || "USD"}
                >
                  <SelectTrigger 
                    id="tripCostCurrency"
                    className="h-8 px-2 text-xs"
                  >
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD ($)</SelectItem>
                    <SelectItem value="AUD">AUD ($)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tripCostCurrency && (
                  <p className="text-xs text-red-500">{errors.tripCostCurrency.message as string}</p>
                )}
              </div>
            </div>
            
            {/* Tags */}
            <div className="flex flex-col space-y-1">
              <Label htmlFor="tags" className="text-xs">Tags</Label>
              <Input
                id="tags"
                placeholder="e.g. Vacation;Business"
                {...register("tags")}
                className={`${errors.tags ? "border-red-500" : ""} h-8 px-2 text-xs`}
              />
              {errors.tags && (
                <p className="text-xs text-red-500">{errors.tags.message as string}</p>
              )}
            </div>
            
            {/* Journal Entry */}
            <div className="flex flex-col space-y-1 mt-2">
              <div className="flex items-center">
                <Book className="h-4 w-4 mr-2 text-primary" />
                <Label htmlFor="journalEntry" className="text-xs font-medium">Flight Journal</Label>
              </div>
              <p className="text-xs text-gray-500">Record your experiences, notes, and memories</p>
              <div className="border rounded-md">
                <ReactQuill 
                  theme="snow" 
                  value={journalContent} 
                  onChange={setJournalContent}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      [{ 'color': [] }, { 'background': [] }],
                      ['link'],
                      ['clean']
                    ],
                  }}
                  formats={[
                    'header',
                    'bold', 'italic', 'underline', 'strike',
                    'list', 'bullet',
                    'color', 'background',
                    'link'
                  ]}
                  className="min-h-[150px]"
                />
              </div>
            </div>
            
            {/* Hidden Duration Field - Auto-calculated */}
            <input
              type="hidden"
              id="flightDurationHours"
              {...register("flightDurationHours")}
              value={estimatedDuration?.toString() || ""}
            />
          </div>
          
          {/* Carbon Offset Option */}
          {estimatedCarbonFootprint && (
            <div className="flex items-center space-x-2 mt-2 mb-2 border-t pt-2 px-1 border-gray-100">
              <Checkbox 
                id="isCarbonOffset" 
                className="h-3.5 w-3.5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                checked={isCarbonOffset}
                onCheckedChange={(checked) => setIsCarbonOffset(checked === true)} 
              />
              <Label htmlFor="isCarbonOffset" className="text-xs cursor-pointer">
                Carbon offset ({formatCarbonFootprint(estimatedCarbonFootprint)})
              </Label>
            </div>
          )}
          
          <DialogFooter className="pt-2 pb-1 px-1 gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="h-8 px-3 text-xs"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="h-8 px-3 text-xs"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Flight"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFlightModal;
