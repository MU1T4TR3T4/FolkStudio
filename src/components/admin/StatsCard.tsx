import { LucideIcon } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: number;
    icon: LucideIcon;
    color: "blue" | "yellow" | "green" | "gray" | "purple" | "indigo" | "emerald" | "red";
    subtitle?: string;
}

export default function StatsCard({ title, value, icon: Icon, color, subtitle }: StatsCardProps) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600 border-blue-200",
        yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
        green: "bg-green-50 text-green-600 border-green-200",
        gray: "bg-gray-50 text-gray-600 border-gray-200",
        purple: "bg-purple-50 text-purple-600 border-purple-200",
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
        red: "bg-red-50 text-red-600 border-red-200",
    };

    const iconColorClasses = {
        blue: "bg-blue-100 text-blue-600",
        yellow: "bg-yellow-100 text-yellow-600",
        green: "bg-green-100 text-green-600",
        gray: "bg-gray-100 text-gray-600",
        purple: "bg-purple-100 text-purple-600",
        indigo: "bg-indigo-100 text-indigo-600",
        emerald: "bg-emerald-100 text-emerald-600",
        red: "bg-red-100 text-red-600",
    };

    return (
        <div className={`bg-white rounded-xl border-2 ${colorClasses[color]} p-6 hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                    )}
                </div>
                <div className={`w-12 h-12 rounded-lg ${iconColorClasses[color]} flex items-center justify-center`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
}
