import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  ListTodo, 
  BarChart, 
  Users, 
  Settings
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { isAdmin } = useAuth();
  
  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/events", label: "Histórico de Eventos", icon: ListTodo },
    { href: "/analytics", label: "Análise de Desempenho", icon: BarChart },
    { href: "/teams", label: "Equipes", icon: Users },
  ];
  
  if (isAdmin) {
    links.push({ href: "/admin", label: "Administração", icon: Settings });
  }
  
  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-auto overflow-y-auto",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="p-4 space-y-6">
        <div className="border-b pb-4 mb-4">
          <h2 className="text-lg font-bold text-primary-700">Navegação</h2>
        </div>
        
        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = location === link.href;
            const Icon = link.icon;
            
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                onClick={onClose}
                className={cn(
                  "flex items-center px-4 py-3 rounded-md cursor-pointer transition-colors",
                  isActive 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 mt-6 border-t">
          <div className="flex flex-col space-y-1 text-sm text-gray-500">
            <span>Versão 2.0</span>
            <span>© 2023 20ª CIPM</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
