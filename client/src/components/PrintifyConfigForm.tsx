import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { printifyService } from "@/services/printify";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PrintifyConfigStatusProps = {
  onRefresh: () => void;
};

// This is now a status display rather than a configuration form
const PrintifyConfigStatus = ({ onRefresh }: PrintifyConfigStatusProps) => {
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<{
    isConfigured: boolean;
    message: string;
  }>({
    isConfigured: false,
    message: "Checking Printify configuration..."
  });

  useEffect(() => {
    checkPrintifyConfig();
  }, []);

  const checkPrintifyConfig = async () => {
    setIsChecking(true);
    
    try {
      const response = await fetch('/api/printify/config');
      const data = await response.json();
      
      if (data.isConfigured) {
        setStatus({
          isConfigured: true,
          message: "Printify is configured and ready to use."
        });
      } else {
        setStatus({
          isConfigured: false,
          message: "Printify API token is not configured. Please contact the administrator."
        });
      }
    } catch (error) {
      console.error("Error checking Printify configuration:", error);
      setStatus({
        isConfigured: false,
        message: "Error checking Printify configuration. Please try again."
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleRefresh = () => {
    checkPrintifyConfig();
    onRefresh();
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center">
          <div className={`h-3 w-3 rounded-full mr-2 ${status.isConfigured ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium">{status.message}</span>
        </div>
        
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isChecking}
          >
            {isChecking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              "Refresh"
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PrintifyConfigStatus;