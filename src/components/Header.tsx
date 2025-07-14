
import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import LanguageToggle from "./LanguageToggle";

interface HeaderProps {
  showLanguageToggle?: boolean;
}

const Header = ({ showLanguageToggle = true }: HeaderProps) => {
  const isMobile = useIsMobile();
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Simulated login state

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center">
        <Link to="/dashboard" className="flex items-center">
          <img 
            src="/lovable-uploads/b89c5324-4f8c-41b5-8773-d90385700b53.png" 
            alt="Unisono Logo" 
            className="h-8 w-8 mr-2" 
          />
          {!isMobile && (
            <span className="text-xl font-roboto font-bold text-primary">
              Unisono
            </span>
          )}
        </Link>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        {showLanguageToggle && <LanguageToggle />}

        {isLoggedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative rounded-full h-8 w-8 p-0"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" alt="User" />
                  <AvatarFallback className="bg-primary text-white">
                    JD
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Subscription</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsLoggedIn(false)}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLoggedIn(true)}
            className="text-primary hover:text-primary-dark"
          >
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
