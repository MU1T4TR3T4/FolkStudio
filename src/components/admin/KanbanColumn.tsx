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
        blue: "bg-blue-50 border-blue-200 text-blue-700",
        yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
        green: "bg-green-50 border-green-200 text-green-700",
        gray: "bg-gray-50 border-gray-200 text-gray-700",
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className={`${colorClasses[color]} border-2 rounded-t-xl p-4 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <h3 className="font-semibold">{title}</h3>
                </div>
                <span className="bg-white px-2 py-1 rounded-full text-sm font-bold">
                    {count}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 bg-gray-50 border-2 border-t-0 border-gray-200 rounded-b-xl p-4 overflow-y-auto min-h-[400px]">
                <div className="space-y-3">
                    {children}
                </div>
            </div>
        </div>
    );
}
