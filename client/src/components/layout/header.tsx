import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Menu, Sun, Moon, LogIn, LogOut, Shield } from "lucide-react";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onToggleSidebar: () => void;
  onShowLogin: () => void;
}

export function Header({ onToggleSidebar, onShowLogin }: HeaderProps) {
  const { currentUser, logout, isAdmin } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // In a real app, we would apply the dark mode to the document
    // document.documentElement.classList.toggle('dark');
  };
  
  return (
    <header className="bg-primary-700 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden text-white hover:bg-primary-600 focus:ring-offset-primary-700"
            onClick={onToggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Sistema de Meritocracia</h1>
            <p className="text-sm text-primary-200">20ª CIPM</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleDarkMode}
            className="text-white hover:bg-primary-600 focus:ring-offset-primary-700"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          {currentUser ? (
            isAdmin ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="secondary"
                    className="flex items-center space-x-2"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={logout}
                className="text-white hover:bg-primary-600 focus:ring-offset-primary-700"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            )
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onShowLogin}
              className="text-white hover:bg-primary-600 focus:ring-offset-primary-700"
            >
              <LogIn className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
