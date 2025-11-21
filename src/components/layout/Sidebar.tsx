import Link from "next/link";
import { LayoutDashboard, Palette, ShoppingBag, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Estúdio", href: "/dashboard/studio", icon: Palette },
    { name: "Pedidos", href: "/dashboard/orders", icon: ShoppingBag },
    { name: "Configurações", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
    return (
        <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
            <div className="flex h-16 items-center justify-center border-b border-gray-800">
                <h1 className="text-xl font-bold tracking-wider">INK<span className="text-blue-500">PRESS</span></h1>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto py-4">
                <nav className="flex-1 space-y-1 px-2">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "group flex items-center rounded-md px-2 py-2 text-sm font-medium hover:bg-gray-800 hover:text-white",
                                "text-gray-300"
                            )}
                        >
                            <item.icon
                                className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-white"
                                aria-hidden="true"
                            />
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="border-t border-gray-800 p-4">
                <button className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white">
                    <LogOut
                        className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-white"
                        aria-hidden="true"
                    />
                    Sair
                </button>
            </div>
        </div>
    );
}
