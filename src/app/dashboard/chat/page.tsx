"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";

interface Message {
    id: string;
    content: string;
    isAdmin: boolean;
    createdAt: string;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadMessages();
        // Auto-refresh a cada 5 segundos
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    async function loadMessages() {
        try {
            const res = await fetch("/api/chat/list");
            const data = await res.json();
            if (data.status === "success") {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function handleSend() {
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const res = await fetch("/api/chat/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newMessage }),
            });

            const data = await res.json();
            if (data.status === "success") {
                setNewMessage("");
                loadMessages();
            } else {
                toast.error("Erro ao enviar mensagem");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao enviar mensagem");
        } finally {
            setSending(false);
        }
    }

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <Toaster position="top-right" richColors />

            {/* Cabeçalho */}
            <div className="pb-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Chat de Suporte</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Converse com nossa equipe para tirar dúvidas
                </p>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center py-12">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Nenhuma mensagem ainda</p>
                        <p className="text-sm text-gray-400 mt-1">Envie uma mensagem para começar</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.isAdmin ? "justify-start" : "justify-end"}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-lg px-4 py-2 ${msg.isAdmin
                                        ? "bg-gray-100 text-gray-900"
                                        : "bg-blue-600 text-white"
                                    }`}
                            >
                                <p className="text-sm">{msg.content}</p>
                                <p className={`text-xs mt-1 ${msg.isAdmin ? "text-gray-500" : "text-blue-100"}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensagem */}
            <div className="pt-4 border-t border-gray-200">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={sending}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
