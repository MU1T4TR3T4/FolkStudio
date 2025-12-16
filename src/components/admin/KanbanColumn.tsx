import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface KanbanColumnProps {
    title: string;
    count: number;
    icon: LucideIcon;
    color: "blue" | "yellow" | "green" | "gray";
    children: ReactNode;
}

export default function KanbanColumn({ title, count, icon: Icon, color, children }: KanbanColumnProps) {
    const colorClasses = {
        blue: "border-t-[3px] border-[#0073ea]",
        yellow: "border-t-[3px] border-[#fdab3d]",
        green: "border-t-[3px] border-[#00c875]",
        gray: "border-t-[3px] border-[#676879]",
    };

    const headerTextColors = {
        blue: "text-[#0073ea]",
        yellow: "text-[#fdab3d]",
        green: "text-[#00c875]",
        gray: "text-[#676879]",
    };

    return (
        <div className="flex flex-col h-full min-w-[280px]">
            {/* Header */}
            <div className={`bg-white rounded-t-lg p-3 flex items-center justify-between shadow-sm mb-2 ${colorClasses[color]}`}>
                <div className="flex items-center gap-2">
                    <h3 className={`font-medium text-sm ${headerTextColors[color]}`}>{title}</h3>
                </div>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                    {count}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-1">
                <div className="space-y-2">
                    {children}
                </div>
            </div>
        </div>
    );
}
