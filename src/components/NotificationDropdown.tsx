"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, Check, Package, MessageCircle, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, Notification } from "@/lib/notifications";
import { Button } from "./ui/button";

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        loadNotifications();
        loadUnreadCount();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(() => {
            loadUnreadCount();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Close dropdown when clicking outside
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    async function loadNotifications() {
        setLoading(true);
        const result = await getNotifications();
        if (result.success) {
            setNotifications(result.data as Notification[]);
        }
        setLoading(false);
    }

    async function loadUnreadCount() {
        const result = await getUnreadCount();
        if (result.success) {
            setUnreadCount(result.count);
        }
    }

    async function handleNotificationClick(notification: Notification) {
        // Mark as read
        if (!notification.is_read) {
            await markAsRead(notification.id);
            loadUnreadCount();
            loadNotifications();
        }

        // Navigate to link if exists
        if (notification.link) {
            router.push(notification.link);
        }

        setIsOpen(false);
    }

    async function handleMarkAllAsRead() {
        const result = await markAllAsRead();
        if (result.success) {
            loadNotifications();
            loadUnreadCount();
        }
    }

    function getNotificationIcon(type: Notification['type']) {
        switch (type) {
            case 'new_order':
                return <Package className="h-5 w-5 text-blue-600" />;
            case 'order_in_production':
                return <TrendingUp className="h-5 w-5 text-orange-600" />;
            case 'order_ready':
                return <Check className="h-5 w-5 text-green-600" />;
            case 'new_message':
                return <MessageCircle className="h-5 w-5 text-purple-600" />;
            default:
                return <Bell className="h-5 w-5 text-gray-600" />;
        }
    }

    function getTimeAgo(dateString: string) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'agora';
        if (diffMins < 60) return `há ${diffMins} min`;
        if (diffHours < 24) return `há ${diffHours}h`;
        if (diffDays === 1) return 'há 1 dia';
        return `há ${diffDays} dias`;
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) loadNotifications();
                }}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <Bell className="h-5 w-5 text-gray-700" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Notificações</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                        >
                            <X className="h-4 w-4 text-gray-500" />
                        </button>
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">
                                Carregando...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                <p>Nenhuma notificação</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium text-gray-900 ${!notification.is_read ? 'font-semibold' : ''
                                                    }`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {getTimeAgo(notification.created_at)}
                                                </p>
                                            </div>
                                            {!notification.is_read && (
                                                <div className="flex-shrink-0">
                                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && unreadCount > 0 && (
                        <div className="p-3 border-t border-gray-200">
                            <Button
                                onClick={handleMarkAllAsRead}
                                variant="ghost"
                                size="sm"
                                className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                                Marcar todas como lidas
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
