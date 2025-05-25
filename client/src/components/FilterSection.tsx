import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { aircraftGroups, getAllAircraftTypes } from "@/lib/aircraftData";

interface FilterSectionProps {
  filters: {
    airport: string;
    airline: string;
    aircraft: string; // Added aircraft filter
    dateFrom: string;
    dateTo: string;
    tags: string;
    search: string;
  };
  onFilterChange: (name: string, value: string) => void;
  onClearFilters: () => void;
  airlines?: any[];
  aircraftTypes?: string[]; // Added aircraft types array
  onToggleHeatmap: () => void;
  onAddFlight: () => void;
  onUploadCSV: () => void;
}

const FilterSection = ({
  filters,
  onFilterChange,
  onClearFilters,
  airlines = [],
  aircraftTypes = [],
  onToggleHeatmap,
  onAddFlight,
  onUploadCSV
}: FilterSectionProps) => {
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg shadow mb-6 p-4">
      <div className="flex flex-col md:flex-row justify-between mb-4">
        <h2 className="text-lg font-medium mb-2 md:mb-0">Filter Flights</h2>
        
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={onToggleHeatmap}
            variant="outline"
            className="text-sm"
            size="sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2h8a4 4 0 0 1 4 4v16l-8-5.46L4 22V6a4 4 0 0 1 4-4Z" />
            </svg>
            <span>Heatmap</span>
          </Button>
          
          <Button 
            onClick={onAddFlight}
            variant="outline"
            className="text-sm text-primary border-primary"
            size="sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add Flight</span>
          </Button>
          
          <Button 
            onClick={onUploadCSV}
            className="text-sm bg-primary hover:bg-primary/90 text-white"
            size="sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>Upload CSV</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Airport Filter */}
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-1">Airport</Label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </div>
            <Input
              type="text"
              placeholder="Any airport (IATA)"
              value={filters.airport}
              onChange={(e) => onFilterChange('airport', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {/* Airline Filter */}
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-1">Airline</Label>
          <Select
            value={filters.airline || "all"}
            onValueChange={(value) => onFilterChange('airline', value === "all" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Airlines" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Airlines</SelectItem>
              {airlines.map((airline) => (
                <SelectItem key={airline.airlineId} value={airline.airlineId}>
                  {airline.airlineName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Aircraft Type Filter */}
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-1">Aircraft</Label>
          <Select
            value={filters.aircraft || "all"}
            onValueChange={(value) => onFilterChange('aircraft', value === "all" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Aircraft" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              <SelectItem value="all">All Aircraft</SelectItem>
              
              {/* Common manufacturers as quick filters */}
              <SelectGroup>
                <SelectLabel>Manufacturers</SelectLabel>
                <SelectItem value="Airbus">All Airbus</SelectItem>
                <SelectItem value="Boeing">All Boeing</SelectItem>
                <SelectItem value="Embraer">All Embraer</SelectItem>
                <SelectItem value="Bombardier">All Bombardier</SelectItem>
              </SelectGroup>
              
              {/* Commonly used aircraft types */}
              <SelectGroup>
                <SelectLabel>Common Types</SelectLabel>
                <SelectItem value="Boeing 737">Boeing 737</SelectItem>
                <SelectItem value="Boeing 787">Boeing 787</SelectItem>
                <SelectItem value="Airbus A320">Airbus A320</SelectItem>
                <SelectItem value="Airbus A330">Airbus A330</SelectItem>
                <SelectItem value="Airbus A350">Airbus A350</SelectItem>
              </SelectGroup>
              
              {/* Option to show all aircraft in a searchable dropdown */}
              <SelectGroup>
                <SelectLabel>Historical Aircraft</SelectLabel>
                <SelectItem value="Concorde">Concorde</SelectItem>
                <SelectItem value="DC-10">DC-10</SelectItem>
                <SelectItem value="Boeing 707">Boeing 707</SelectItem>
                <SelectItem value="Boeing 727">Boeing 727</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        
        {/* Date Range Filter */}
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-1">Date Range</Label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <Input
                type="date"
                className="pl-10"
                value={filters.dateFrom}
                onChange={(e) => onFilterChange('dateFrom', e.target.value)}
              />
            </div>
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <Input
                type="date"
                className="pl-10"
                value={filters.dateTo}
                onChange={(e) => onFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Tags Filter */}
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-1">Tags</Label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
            </div>
            <Input
              type="text"
              placeholder="Search by tags"
              value={filters.tags}
              onChange={(e) => onFilterChange('tags', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>
      
      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.airport && (
            <Badge variant="secondary" className="text-sm rounded-full px-3 py-1">
              <span className="text-gray-800">{filters.airport}</span>
              <Button 
                variant="ghost"
                size="sm"
                className="ml-1 p-0 h-auto hover:bg-transparent text-gray-500 hover:text-gray-700"
                onClick={() => onFilterChange('airport', '')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </Badge>
          )}
          
          {filters.airline && (
            <Badge variant="secondary" className="text-sm rounded-full px-3 py-1">
              <span className="text-gray-800">
                {airlines.find((a) => a.airlineId === filters.airline)?.airlineName || filters.airline}
              </span>
              <Button 
                variant="ghost"
                size="sm"
                className="ml-1 p-0 h-auto hover:bg-transparent text-gray-500 hover:text-gray-700"
                onClick={() => onFilterChange('airline', '')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </Badge>
          )}
          
          {filters.dateFrom && (
            <Badge variant="secondary" className="text-sm rounded-full px-3 py-1">
              <span className="text-gray-800">From: {filters.dateFrom}</span>
              <Button 
                variant="ghost"
                size="sm"
                className="ml-1 p-0 h-auto hover:bg-transparent text-gray-500 hover:text-gray-700"
                onClick={() => onFilterChange('dateFrom', '')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </Badge>
          )}
          
          {filters.dateTo && (
            <Badge variant="secondary" className="text-sm rounded-full px-3 py-1">
              <span className="text-gray-800">To: {filters.dateTo}</span>
              <Button 
                variant="ghost"
                size="sm"
                className="ml-1 p-0 h-auto hover:bg-transparent text-gray-500 hover:text-gray-700"
                onClick={() => onFilterChange('dateTo', '')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </Badge>
          )}
          
          {filters.aircraft && (
            <Badge variant="secondary" className="text-sm rounded-full px-3 py-1">
              <span className="text-gray-800">Aircraft: {filters.aircraft}</span>
              <Button 
                variant="ghost"
                size="sm"
                className="ml-1 p-0 h-auto hover:bg-transparent text-gray-500 hover:text-gray-700"
                onClick={() => onFilterChange('aircraft', '')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </Badge>
          )}
          
          {filters.tags && (
            <Badge variant="secondary" className="text-sm rounded-full px-3 py-1">
              <span className="text-gray-800">Tags: {filters.tags}</span>
              <Button 
                variant="ghost"
                size="sm"
                className="ml-1 p-0 h-auto hover:bg-transparent text-gray-500 hover:text-gray-700"
                onClick={() => onFilterChange('tags', '')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </Badge>
          )}
          
          <Button
            variant="link"
            className="text-primary hover:text-primary/90 p-0 h-auto text-sm"
            onClick={onClearFilters}
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default FilterSection;
