import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Flight } from "@shared/schema";
import { formatCarbonFootprint } from "@/lib/carbonUtils";
import { formatCurrency } from "@/lib/currencyUtils";
import { Leaf, Check, Trash, Edit, Book, CreditCard } from "lucide-react";
import { useAirlines, getAirlineName, getAirlineColor } from "@/hooks/useAirlines";
import JournalViewer from "./JournalViewer";

interface FlightTableProps {
  flights: Flight[];
  filters: any;
  onFilterChange: (name: string, value: string) => void;
  onRefresh: () => void;
}

const FlightTable = ({ flights, filters, onFilterChange, onRefresh }: FlightTableProps) => {
  const { toast } = useToast();
  const { airlines } = useAirlines();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: string } | null>(null);
  const [selectedFlights, setSelectedFlights] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 10;

  // Filter flights based on current filters and search
  const filteredFlights = flights.filter(flight => {
    if (filters.airport && 
        flight.departureAirportIata !== filters.airport && 
        flight.arrivalAirportIata !== filters.airport) {
      return false;
    }
    if (filters.airline && flight.airlineCode !== filters.airline) {
      return false;
    }
    if (filters.dateFrom && new Date(flight.flightDate) < new Date(filters.dateFrom)) {
      return false;
    }
    if (filters.dateTo && new Date(flight.flightDate) > new Date(filters.dateTo)) {
      return false;
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        flight.departureAirportIata.toLowerCase().includes(searchTerm) ||
        flight.arrivalAirportIata.toLowerCase().includes(searchTerm) ||
        (flight.airlineCode && flight.airlineCode.toLowerCase().includes(searchTerm)) ||
        (flight.flightNumber && flight.flightNumber.toLowerCase().includes(searchTerm)) ||
        (flight.aircraftType && flight.aircraftType.toLowerCase().includes(searchTerm))
      );
    }
    return true;
  });

  // Sort flights
  const sortedFlights = [...filteredFlights];
  if (sortConfig !== null) {
    sortedFlights.sort((a, b) => {
      const aVal = a[sortConfig.key as keyof Flight];
      const bVal = b[sortConfig.key as keyof Flight];
      
      // Handle null values
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (bVal === null) return sortConfig.direction === 'ascending' ? 1 : -1;
      
      // Normal comparison
      if (aVal < bVal) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }

  // Pagination
  const totalPages = Math.ceil(sortedFlights.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFlights = sortedFlights.slice(indexOfFirstItem, indexOfLastItem);

  const handleSort = (key: string) => {
    if (sortConfig?.key === key) {
      if (sortConfig.direction === 'ascending') {
        setSortConfig({ key, direction: 'descending' });
      } else {
        setSortConfig(null);
      }
    } else {
      setSortConfig({ key, direction: 'ascending' });
    }
  };

  const getSortIndicator = (key: string) => {
    if (sortConfig?.key === key) {
      return sortConfig.direction === 'ascending' ? '↑' : '↓';
    }
    return '';
  };

  const handleDelete = async (flightId: number) => {
    if (window.confirm('Are you sure you want to delete this flight?')) {
      try {
        setIsDeleting(true);
        await apiRequest('DELETE', `/api/flights/${flightId}`);
        toast({
          title: "Success",
          description: "Flight deleted successfully",
        });
        onRefresh();
      } catch (error) {
        console.error('Error deleting flight:', error);
        toast({
          title: "Error",
          description: "Failed to delete flight",
          variant: "destructive",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  const handleBatchDelete = async () => {
    if (selectedFlights.length === 0) {
      toast({
        title: "No flights selected",
        description: "Please select at least one flight to delete",
      });
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedFlights.length} selected flight${selectedFlights.length > 1 ? 's' : ''}?`)) {
      try {
        setIsDeleting(true);
        
        // Delete flights one by one
        let successCount = 0;
        
        for (const flightId of selectedFlights) {
          try {
            await apiRequest('DELETE', `/api/flights/${flightId}`);
            successCount++;
          } catch (error) {
            console.error(`Error deleting flight ${flightId}:`, error);
          }
        }
        
        toast({
          title: "Success",
          description: `Deleted ${successCount} of ${selectedFlights.length} flights`,
        });
        
        // Clear selection
        setSelectedFlights([]);
        
        // Refresh data
        onRefresh();
      } catch (error) {
        console.error('Error in batch delete:', error);
        toast({
          title: "Error",
          description: "There was an error during batch delete",
          variant: "destructive",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  const toggleFlightSelection = (flightId: number) => {
    setSelectedFlights(prev => {
      if (prev.includes(flightId)) {
        return prev.filter(id => id !== flightId);
      } else {
        return [...prev, flightId];
      }
    });
  };
  
  const toggleAllFlights = () => {
    if (selectedFlights.length === currentFlights.length) {
      // Deselect all
      setSelectedFlights([]);
    } else {
      // Select all current page flights
      setSelectedFlights(currentFlights.map(flight => flight.flightId));
    }
  };
  
  const handleToggleCarbonOffset = async (flightId: number, currentStatus: boolean) => {
    try {
      await apiRequest('PATCH', `/api/flights/${flightId}/carbon-offset`, {
        carbonOffset: !currentStatus
      });
      toast({
        title: "Success",
        description: currentStatus 
          ? "Flight no longer marked as carbon offset" 
          : "Flight marked as carbon offset",
      });
      onRefresh();
    } catch (error) {
      console.error('Error updating carbon offset status:', error);
      toast({
        title: "Error",
        description: "Failed to update carbon offset status",
        variant: "destructive",
      });
    }
  };

  const handleBatchCarbonOffset = async (setOffset: boolean) => {
    if (selectedFlights.length === 0) {
      toast({
        title: "No flights selected",
        description: "Please select at least one flight to update",
      });
      return;
    }
    
    const action = setOffset ? "mark as carbon offset" : "remove carbon offset from";
    
    if (window.confirm(`Are you sure you want to ${action} ${selectedFlights.length} selected flight${selectedFlights.length > 1 ? 's' : ''}?`)) {
      try {
        setIsDeleting(true); // Reuse the loading state
        
        // Update flights one by one
        let successCount = 0;
        
        for (const flightId of selectedFlights) {
          try {
            await apiRequest('PATCH', `/api/flights/${flightId}/carbon-offset`, {
              carbonOffset: setOffset
            });
            successCount++;
          } catch (error) {
            console.error(`Error updating flight ${flightId}:`, error);
          }
        }
        
        toast({
          title: "Success",
          description: `Updated carbon offset status for ${successCount} of ${selectedFlights.length} flights`,
        });
        
        // Clear selection
        setSelectedFlights([]);
        
        // Refresh data
        onRefresh();
      } catch (error) {
        console.error('Error in batch carbon offset update:', error);
        toast({
          title: "Error",
          description: "There was an error during the batch update",
          variant: "destructive",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  const renderPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={currentPage === i}
              onClick={() => setCurrentPage(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Always show first page
      pages.push(
        <PaginationItem key={1}>
          <PaginationLink
            isActive={currentPage === 1}
            onClick={() => setCurrentPage(1)}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      
      // Show ellipsis if not near the beginning
      if (currentPage > 3) {
        pages.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      // Show current page and nearby pages
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        if (i > 1 && i < totalPages) {
          pages.push(
            <PaginationItem key={i}>
              <PaginationLink
                isActive={currentPage === i}
                onClick={() => setCurrentPage(i)}
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }
      
      // Show ellipsis if not near the end
      if (currentPage < totalPages - 2) {
        pages.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              isActive={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }
    
    return pages;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-medium text-gray-900">Flight Data</h2>
          
          {selectedFlights.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {selectedFlights.length} flight{selectedFlights.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8"
                  onClick={() => handleBatchCarbonOffset(true)}
                  disabled={isDeleting}
                >
                  <Leaf className="mr-1 h-4 w-4" />
                  Mark as Offset
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8"
                  onClick={() => handleBatchCarbonOffset(false)}
                  disabled={isDeleting}
                >
                  <Leaf className="mr-1 h-4 w-4" />
                  Unmark Offset
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="h-8"
                  onClick={handleBatchDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Selected'}
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-2 md:mt-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <Input 
              type="text" 
              placeholder="Search flights..." 
              className="pl-10 w-full md:w-60"
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={currentFlights.length > 0 && selectedFlights.length === currentFlights.length}
                    onChange={toggleAllFlights}
                  />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('airlineCode')}
              >
                Airline {getSortIndicator('airlineCode')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                From → To
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('flightDate')}
              >
                Date {getSortIndicator('flightDate')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Flight #
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Aircraft
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('flightDurationHours')}
              >
                Duration {getSortIndicator('flightDurationHours')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('distanceMiles')}
              >
                Distance {getSortIndicator('distanceMiles')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('carbonFootprintKg')}
              >
                Carbon {getSortIndicator('carbonFootprintKg')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('tripCost')}
              >
                Trip Cost {getSortIndicator('tripCost')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Tags
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentFlights.length > 0 ? (
              currentFlights.map((flight) => (
                <tr key={flight.flightId} className={`hover:bg-gray-50 ${selectedFlights.includes(flight.flightId) ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={selectedFlights.includes(flight.flightId)}
                        onChange={() => toggleFlightSelection(flight.flightId)}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: getAirlineColor(flight.airlineCode, airlines) }}
                      ></div>
                      <div 
                        className="text-sm font-medium text-gray-900" 
                        title={`${getAirlineName(flight.airlineCode, airlines)} (${flight.airlineCode})`}
                      >
                        {getAirlineName(flight.airlineCode, airlines) || 'Unknown'} {flight.airlineCode ? 
                          <span className="text-xs text-gray-500">
                            ({flight.airlineCode})
                          </span> : ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{flight.departureAirportIata} → {flight.arrivalAirportIata}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(flight.flightDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{flight.flightNumber || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{flight.aircraftType || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{flight.flightDurationHours ? `${flight.flightDurationHours}h` : 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{flight.distanceMiles ? `${flight.distanceMiles} mi` : 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {flight.carbonFootprintKg ? (
                          <>
                            <span className="text-sm text-gray-900 mr-1">{formatCarbonFootprint(Number(flight.carbonFootprintKg))}</span>
                            {flight.carbonOffset && (
                              <div className="flex items-center text-green-600 bg-green-100 rounded-full px-1.5 py-0.5">
                                <Check className="h-3 w-3 mr-0.5" />
                                <span className="text-xs">Offset</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">Not calculated</span>
                        )}
                      </div>
                      {flight.carbonFootprintKg && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 ml-1 px-2 text-xs ${flight.carbonOffset ? 'text-red-500' : 'text-green-600'}`}
                          onClick={() => handleToggleCarbonOffset(flight.flightId, !!flight.carbonOffset)}
                        >
                          {flight.carbonOffset ? 'Unmark' : 'Mark Offset'}
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {flight.tripCost ? (
                        <div className="flex items-center">
                          <CreditCard className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                          <span className="text-sm font-medium">
                            {formatCurrency(Number(flight.tripCost), flight.tripCostCurrency || 'USD')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not specified</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {/* Tags would be fetched from flightTags relation */}
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Example
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-1">
                      {/* Journal entry view/edit button */}
                      <JournalViewer 
                        flightId={flight.flightId}
                        journalEntry={flight.journalEntry}
                        onJournalUpdated={onRefresh}
                      />
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary h-8 w-8 p-0"
                        title="Edit flight"
                        onClick={() => {
                          // Open the AddFlightModal with this flight's data for editing
                          onFilterChange('editFlightId', flight.flightId.toString());
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 h-8 w-8 p-0"
                        title="Delete flight"
                        onClick={() => handleDelete(flight.flightId)}
                        disabled={isDeleting}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                  No flights found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {filteredFlights.length > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredFlights.length)}
                </span>{" "}
                of <span className="font-medium">{filteredFlights.length}</span> flights
              </p>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }} 
                    className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}
                  />
                </PaginationItem>
                
                {renderPageNumbers()}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightTable;
