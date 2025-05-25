import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Flight } from "@shared/schema";
import { printifyService } from "@/services/printify";
import html2canvas from "html2canvas";
import PrintifyConfigStatus from "@/components/PrintifyConfigForm";
import { Loader2 } from "lucide-react";
import PrintifyProductForm from "@/components/PrintifyProductForm";
import { AlertTriangle } from "lucide-react";

const PrintifyProducts = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [printifyStatus, setPrintifyStatus] = useState({
    isConfigured: false,
    isInitialized: false
  });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Fetch flights
  const { data: flights } = useQuery<Flight[]>({
    queryKey: ["/api/flights"],
    enabled: isAuthenticated,
  });

  // Check if Printify is configured and get captured image from localStorage if available
  useEffect(() => {
    checkPrintifyStatus();
    
    // Check for captured map image in localStorage
    const storedImage = localStorage.getItem('capturedMapImage');
    if (storedImage) {
      setCapturedImage(storedImage);
      // Clear the storage to avoid using stale images
      // localStorage.removeItem('capturedMapImage'); // Uncomment if you want to clear after use
    }
  }, []);

  const checkPrintifyStatus = async () => {
    try {
      const response = await fetch('/api/printify/config');
      const { isConfigured } = await response.json();
      
      setPrintifyStatus({
        isConfigured,
        isInitialized: true
      });
    } catch (error) {
      console.error("Error checking Printify status:", error);
      setPrintifyStatus({
        isConfigured: false,
        isInitialized: true
      });
    }
  };

  const handleCapturePage = async () => {
    setIsCapturing(true);
    toast({
      title: "Capturing map",
      description: "Preparing to create your printed product...",
      variant: "default",
    });

    try {
      // Find the map element
      const mapElement = document.querySelector('.ol-viewport');
      
      if (!mapElement) {
        toast({
          title: "Error",
          description: "Map element not found. Please go to the dashboard first.",
          variant: "destructive",
        });
        setIsCapturing(false);
        return;
      }

      // Capture the map
      const canvas = await html2canvas(mapElement as HTMLElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#111827", // Dark background
      });
      
      const image = canvas.toDataURL('image/png');
      setCapturedImage(image);
      
      toast({
        title: "Success",
        description: "Map captured successfully. You can now create products!",
        variant: "default",
      });
    } catch (error) {
      console.error("Error capturing map:", error);
      toast({
        title: "Error",
        description: "Failed to capture map image. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsCapturing(false);
  };

  if (authLoading || !printifyStatus.isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If Printify is not configured, show a message
  if (!printifyStatus.isConfigured) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header user={user} />
        
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Printify Integration</h1>
              <p className="text-muted-foreground mt-2">
                Create physical products featuring your flight maps
              </p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                  Printify Not Configured
                </CardTitle>
                <CardDescription>
                  The Printify integration is not available at this time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  The administrator needs to configure the Printify API token to enable product creation.
                  Please check back later or contact support.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Printify Products</h1>
            <p className="text-muted-foreground mt-2">
              Create physical products featuring your flight maps
            </p>
          </div>
          
          <Tabs defaultValue="capture" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="capture">Capture Map</TabsTrigger>
              <TabsTrigger value="create">Create Products</TabsTrigger>
              <TabsTrigger value="orders">Order History</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
            </TabsList>
            
            <TabsContent value="capture" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Capture Your Flight Map</CardTitle>
                  <CardDescription>
                    Take a screenshot of your current map view to use on products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    To create a custom product with your flight map, you'll need to:
                  </p>
                  
                  <ol className="list-decimal pl-5 space-y-2 mb-6">
                    <li>Go to the Dashboard to view your flight map</li>
                    <li>Use the "Capture for Printify" button on the map</li>
                    <li>You'll be redirected back here with your captured map</li>
                  </ol>
                  
                  {!capturedImage ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        onClick={() => window.location.href = '/dashboard'}
                        className="w-full sm:w-auto"
                      >
                        Go to Dashboard to Capture Map
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 rounded-md">
                      <p className="text-green-800 dark:text-green-200 text-sm font-medium">
                        Map has been successfully captured! You can now create products.
                      </p>
                    </div>
                  )}
                  
                  {capturedImage && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-2">Preview:</h3>
                      <div className="border rounded-md p-2 bg-muted/30">
                        <img 
                          src={capturedImage} 
                          alt="Captured flight map" 
                          className="w-full max-h-[300px] object-contain rounded"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="create" className="space-y-4">
              {!capturedImage ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No Image Captured</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>You need to capture your map first before creating products.</p>
                    <Button 
                      onClick={() => document.querySelector('[data-value="capture"]')?.dispatchEvent(new MouseEvent('click'))} 
                      variant="outline" 
                      className="mt-4"
                    >
                      Go to Capture
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Create Products with Your Map</CardTitle>
                      <CardDescription>
                        Turn your flight visualization into physical products
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PrintifyProductForm 
                        imageUrl={capturedImage}
                        flights={flights || []}
                      />
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Orders</CardTitle>
                  <CardDescription>
                    Track the status of your Printify orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Your order history will appear here once you've placed orders.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="status" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Printify Status</CardTitle>
                  <CardDescription>
                    Check the current status of the Printify integration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PrintifyConfigStatus onRefresh={checkPrintifyStatus} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PrintifyProducts;