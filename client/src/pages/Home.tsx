import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

const Home = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };
  
  const handleDemoMode = async () => {
    try {
      toast({
        title: "Starting Demo Mode",
        description: "Creating demo account and loading sample data...",
      });
      
      // Create demo user account and log in
      const createResponse = await fetch('/api/demo/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!createResponse.ok) {
        throw new Error("Failed to create demo account");
      }
      
      // Import demo data
      const importResponse = await fetch('/api/demo/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!importResponse.ok) {
        throw new Error("Failed to import demo data");
      }
      
      const importData = await importResponse.json();
      
      toast({
        title: "Demo Mode Ready!",
        description: `Successfully loaded ${importData.count} flights. Redirecting to dashboard...`,
      });
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Demo mode error:", error);
      toast({
        title: "Demo Mode Error",
        description: "Failed to start demo mode. Please try again or sign in.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with Logo */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 content-container">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
              <h1 className="text-xl font-semibold text-gray-900">Solstice Navigator</h1>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleDemoMode}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                Try Demo
              </Button>
              <Button
                onClick={handleLogin}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1">
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 content-container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Track Your</span>
                  <span className="block text-primary">Flight Journey</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl">
                  Solstice Navigator helps you visualize your aviation adventures. Log flights, track statistics, and see your global footprint.
                </p>
                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleLogin}
                    className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg"
                  >
                    Get Started
                  </Button>
                  <Button 
                    onClick={handleDemoMode}
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/10 px-8 py-6 text-lg"
                  >
                    Try Demo
                  </Button>
                </div>
              </div>
              <div className="hidden md:block">
                <img
                  src="https://images.unsplash.com/photo-1521295121783-8a321d551ad2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Flight paths visualization"
                  className="w-full rounded-lg shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 content-container">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900">Key Features</h2>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                Everything you need to track and visualize your flight journey.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="bg-primary-100 p-3 rounded-full inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Interactive Map</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Visualize your flights on an interactive global map with color-coded routes.
                  </p>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="bg-primary-100 p-3 rounded-full inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                      <path d="M3 5v14a2 2 0 0 0 2 2h16" />
                      <path d="M18 12H9" />
                      <path d="m15 9-3 3 3 3" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Easy Data Import</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Import flight data via CSV upload or add flights manually with a simple form.
                  </p>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="bg-primary-100 p-3 rounded-full inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Detailed Analytics</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Track key metrics like miles flown, airlines, and hours in the air.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 content-container">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Solstice Navigator. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
