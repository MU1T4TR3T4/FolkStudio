import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Image as ImageIcon, Palette, ShoppingBag, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Início", href: "/dashboard", icon: LayoutDashboard },
    // { name: "Minhas Artes", href: "/dashboard/designs", icon: ImageIcon },
    { name: "Criar Arte", href: "/dashboard/studio", icon: Palette },
    { name: "Pedidos", href: "/dashboard/orders", icon: ShoppingBag },
    { name: "Minhas Estampas", href: "/dashboard/estampas", icon: ImageIcon },
    { name: "Chat", href: "/dashboard/chat", icon: MessageSquare },
];

export function Sidebar() {
    return (
        <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
            <div className="flex h-16 items-center px-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <Image
                        src="/logo/folk-logo-sem-fundo1.png"
                        alt="FOLK Logo"
                        width={100}
                        height={40}
                        className="object-contain"
                    />
                </div>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-6">
                {navigation.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                            "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                            "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                        )}
                    >
                        <item.icon
                            className="mr-3 h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors"
                            aria-hidden="true"
                        />
                        {item.name}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">US</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">Usuário</span>
                        <span className="text-xs text-gray-500">Gratuito</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
