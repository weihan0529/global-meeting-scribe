
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
      
      <div className="flex items-center gap-4">
        <Link to="/meeting-history">
          <Button variant="ghost" size="sm">
            Meeting History
          </Button>
        </Link>
      </div>
    </header>
  );
};

export default Header;
