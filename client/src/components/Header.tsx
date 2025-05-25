import { User } from "@shared/schema";
import { useState } from "react";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  user?: User | null;
}

const Header = ({ user }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
            <Link href="/">
              <h1 className="text-xl font-semibold text-gray-900 cursor-pointer">Solstice Navigator</h1>
            </Link>
          </div>
          
          {/* Main Navigation */}
          {user && (
            <div className="hidden md:flex space-x-6 mx-6">
              <Link href="/dashboard">
                <span className="text-sm font-medium text-gray-700 hover:text-primary cursor-pointer">Dashboard</span>
              </Link>
              <Link href="/carbon-offset">
                <span className="text-sm font-medium text-gray-700 hover:text-primary cursor-pointer">Carbon Offset</span>
              </Link>
              <Link href="/printify">
                <span className="text-sm font-medium text-gray-700 hover:text-primary cursor-pointer">Print Products</span>
              </Link>
            </div>
          )}
          
          {/* User Menu */}
          {user ? (
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-2 focus:outline-none">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImageUrl || undefined} />
                    <AvatarFallback>
                      {user.displayName?.charAt(0) || user.firstName?.charAt(0) || user.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium">
                    {user.displayName || user.firstName || user.email}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                      Profile
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/settings">
                    <DropdownMenuItem className="cursor-pointer">
                      Settings
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/carbon-offset">
                    <DropdownMenuItem className="cursor-pointer">
                      Carbon Offset
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/printify">
                    <DropdownMenuItem className="cursor-pointer">
                      Print Products
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/api/logout" className="cursor-pointer">
                      Sign out
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <a 
              href="/api/login" 
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              Sign in
            </a>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
