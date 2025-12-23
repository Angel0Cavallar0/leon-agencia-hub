import { LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";
import { NavLink } from "./NavLink";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type SidebarProps = {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const { signOut } = useAuth();
  const { logoUrl, logoIconUrl } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  useEffect(() => {
    setIsCollapsed(collapsed);
  }, [collapsed]);

  const containerWidth = isCollapsed ? "w-20" : "w-64";
  const iconClassName = isCollapsed ? "h-6 w-6" : "h-5 w-5";

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
    onToggleCollapse?.();
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200",
        containerWidth
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center border-b border-sidebar-border",
          isCollapsed ? "p-3" : "p-4"
        )}
      >
        {(isCollapsed ? logoIconUrl : logoUrl) ? (
          <img
            src={isCollapsed ? logoIconUrl || logoUrl : logoUrl}
            alt="Logo"
            className={cn(
              "h-10 object-contain",
              isCollapsed ? "w-10" : "w-auto",
              isCollapsed ? "mx-auto" : undefined
            )}
          />
        ) : (
          <h2
            className={cn(
              "text-xl font-bold text-sidebar-foreground truncate",
              isCollapsed ? "text-sm" : undefined
            )}
          >
            Leon Manager
          </h2>
        )}
      </div>

      <nav className="relative flex-1 p-4 space-y-2">
        <NavLink
          to="/dashboard"
          end
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isCollapsed ? "justify-center" : undefined
          )}
          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
        >
          <LayoutDashboard className={iconClassName} />
          {!isCollapsed && <span className="font-medium">Dashboard</span>}
        </NavLink>
      </nav>

      <div
        className={cn(
          "border-t border-[#006B52] px-4 py-2",
          isCollapsed ? "px-2" : undefined
        )}
      >
        <div className="flex items-center justify-between">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleCollapse}
                  aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
                  className="flex items-center justify-center p-2 text-sidebar-foreground transition-colors hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                >
                  {isCollapsed ? (
                    <PanelLeftOpen className={iconClassName} />
                  ) : (
                    <PanelLeftClose className={iconClassName} />
                  )}
                  <span className="sr-only">{isCollapsed ? "Expandir menu" : "Recolher menu"}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">{isCollapsed ? "Expandir" : "Recolher"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={signOut}
                  aria-label="Sair"
                  className="flex items-center justify-center p-2 text-sidebar-foreground transition-colors hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                >
                  <LogOut className={iconClassName} />
                  <span className="sr-only">Sair</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Sair</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </aside>
  );
}
