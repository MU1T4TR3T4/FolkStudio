import { Bell, User } from "lucide-react";

export function Header() {
    return (
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
            <div className="flex items-center">
                {/* Espaço para breadcrumbs ou título da página se necessário */}
                <h2 className="text-lg font-semibold text-gray-800">Bem-vindo de volta</h2>
            </div>
            <div className="flex items-center space-x-4">
                <button className="rounded-full p-1 text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Notificações</span>
                    <Bell className="h-6 w-6" />
                </button>
                <div className="relative">
                    <button className="flex items-center rounded-full bg-gray-100 p-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                        <span className="sr-only">Menu do usuário</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                            <User className="h-5 w-5" />
                        </div>
                    </button>
                </div>
            </div>
        </header>
    );
}
