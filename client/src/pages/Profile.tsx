import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const ProfilePage = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  // If not authenticated and not loading, redirect to home
  if (!isLoading && !isAuthenticated) {
    setLocation("/");
    return null;
  }

  // Loading state
  if (isLoading || !user) {
    return (
      <div className="container mx-auto my-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Extract initials for avatar fallback
  const getInitials = () => {
    let initials = "";
    if (user.firstName) {
      initials += user.firstName[0];
    }
    if (user.lastName) {
      initials += user.lastName[0];
    }
    return initials || user.email?.[0] || "U";
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    // Currently, we don't have an endpoint to update the profile as the user data
    // comes from Replit Auth. We'll just show a toast message.
    
    setTimeout(() => {
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
      setIsUpdating(false);
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-8 content-container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Profile</h1>
        <Button variant="outline" onClick={() => setLocation("/dashboard")} className="gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Back to Dashboard
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                {user.profileImageUrl ? (
                  <AvatarImage src={user.profileImageUrl} alt={user.firstName || 'User'} />
                ) : null}
                <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-xl font-semibold">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
              </div>
              <div className="w-full mt-4">
                <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                <p>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not Available'}</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = "/api/logout"}>
                Logout
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Tabs Section */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="account">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="account">Account Settings</TabsTrigger>
              <TabsTrigger value="privacy">Privacy & Data</TabsTrigger>
            </TabsList>
            
            {/* Account Settings */}
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account information</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile}>
                    <div className="grid gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input 
                            id="firstName"
                            disabled
                            placeholder="First Name" 
                            defaultValue={user.firstName || ''} 
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input 
                            id="lastName"
                            disabled
                            placeholder="Last Name" 
                            defaultValue={user.lastName || ''} 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email"
                          disabled 
                          placeholder="Email" 
                          defaultValue={user.email || ''} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-yellow-600">
                          Profile information is managed by your Replit account. 
                          To update your information, please update your Replit profile.
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <Button type="submit" disabled={true}>
                        {isUpdating ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                          </>
                        ) : (
                          "Update Profile"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Privacy & Data */}
            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy & Data</CardTitle>
                  <CardDescription>Manage your privacy settings and data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium">Data Export</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Download a copy of your flight data and account information.
                      </p>
                      <Button variant="outline" className="mt-4">
                        Export Data
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Permanently delete your account and all associated data.
                      </p>
                      <Button variant="destructive" className="mt-4">
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;