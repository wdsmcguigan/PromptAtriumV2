import { ChevronDown, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface MobileTabItem {
  value: string;
  label: string;
}

interface MobileTabDropdownProps {
  tabs: MobileTabItem[];
  value: string;
  onValueChange: (value: string) => void;
  count?: number;
  triggerClassName?: string;
  align?: "start" | "center" | "end";
  "data-testid"?: string;
}

export function MobileTabDropdown({
  tabs,
  value,
  onValueChange,
  count,
  triggerClassName,
  align = "start",
  "data-testid": dataTestId,
}: MobileTabDropdownProps) {
  const current = tabs.find((t) => t.value === value);
  const currentLabel = current?.label ?? tabs[0]?.label ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
            triggerClassName
          )}
          data-testid={dataTestId ?? "button-mobile-tab-dropdown"}
        >
          <span className="font-semibold text-lg">{currentLabel}</span>
          {typeof count === "number" && (
            <Badge variant="secondary">{count}</Badge>
          )}
          <ChevronDown className="h-4 w-4 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-52">
        {tabs.map((tab) => (
          <DropdownMenuItem
            key={tab.value}
            onClick={() => onValueChange(tab.value)}
            className="cursor-pointer"
            data-testid={`mobile-tab-option-${tab.value}`}
          >
            <span className={cn(tab.value === value && "font-semibold")}>
              {tab.label}
            </span>
            {tab.value === value && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
