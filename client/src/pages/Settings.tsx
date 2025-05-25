import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const SettingsPage = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Settings state
  const [mapTheme, setMapTheme] = useState("light");
  const [showTutorial, setShowTutorial] = useState(true);
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [defaultView, setDefaultView] = useState("map");
  const [dashboardLayout, setDashboardLayout] = useState("standard");
  const [isSaving, setIsSaving] = useState(false);

  // If not authenticated and not loading, redirect to home
  if (!isLoading && !isAuthenticated) {
    setLocation("/");
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto my-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate saving settings (would typically save to backend/localStorage)
    setTimeout(() => {
      toast({
        title: "Settings Saved",
        description: "Your application settings have been updated successfully.",
      });
      setIsSaving(false);
    }, 1000);
  };

  const handleResetSettings = () => {
    // Reset to defaults
    setMapTheme("light");
    setShowTutorial(true);
    setHeatmapEnabled(true);
    setDefaultView("map");
    setDashboardLayout("standard");
    
    toast({
      title: "Settings Reset",
      description: "Your application settings have been reset to defaults.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 content-container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Application Settings</h1>
        <Button variant="outline" onClick={() => setLocation("/dashboard")} className="gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Back to Dashboard
        </Button>
      </div>
      
      <Tabs defaultValue="appearance">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how Solstice Navigator looks</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings}>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="mapTheme">Map Theme</Label>
                    <Select value={mapTheme} onValueChange={setMapTheme}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a map theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light Mode</SelectItem>
                        <SelectItem value="dark">Dark Mode</SelectItem>
                        <SelectItem value="satellite">Satellite</SelectItem>
                        <SelectItem value="terrain">Terrain</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">Choose the default map visualization theme</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dashboardLayout">Dashboard Layout</Label>
                    <Select value={dashboardLayout} onValueChange={setDashboardLayout}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dashboard layout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="map-focused">Map-Focused</SelectItem>
                        <SelectItem value="data-focused">Data-Focused</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">How components are arranged on the dashboard</p>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleResetSettings}
                  >
                    Reset to Defaults
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      "Save Settings"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Manage your usage preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings}>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="showTutorial">Show Tutorial</Label>
                      <p className="text-sm text-muted-foreground">
                        Show the tutorial popup for new users
                      </p>
                    </div>
                    <Switch 
                      id="showTutorial" 
                      checked={showTutorial}
                      onCheckedChange={setShowTutorial}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="heatmapEnabled">Enable Heatmap</Label>
                      <p className="text-sm text-muted-foreground">
                        Show the heatmap visualization option for flight density
                      </p>
                    </div>
                    <Switch 
                      id="heatmapEnabled" 
                      checked={heatmapEnabled}
                      onCheckedChange={setHeatmapEnabled}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="defaultView">Default View</Label>
                    <Select value={defaultView} onValueChange={setDefaultView}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select default view" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="map">Map View</SelectItem>
                        <SelectItem value="table">Table View</SelectItem>
                        <SelectItem value="stats">Statistics View</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">Choose which view loads first when opening the dashboard</p>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleResetSettings}
                  >
                    Reset to Defaults
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      "Save Settings"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Manage your flight data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Import Data</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Import flight data from various sources.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline">
                      Import from CSV
                    </Button>
                    <Button variant="outline">
                      Import from Excel
                    </Button>
                    <Button variant="outline">
                      Import from API
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium">Export Data</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Export your flight data in various formats.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline">
                      Export as CSV
                    </Button>
                    <Button variant="outline">
                      Export as Excel
                    </Button>
                    <Button variant="outline">
                      Export as PDF
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium text-destructive">Clear Data</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Delete all your flight data. This action cannot be undone.
                  </p>
                  <Button variant="destructive" className="mt-4">
                    Delete All Flight Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;