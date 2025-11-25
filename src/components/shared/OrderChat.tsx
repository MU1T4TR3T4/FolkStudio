"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ChatMessage {
    id: string;
    orderId: string;
    text: string;
    authorType: "admin" | "client";
    authorName: string;
    timestamp: string;
}

interface OrderChatProps {
    orderId: string;
    currentUserType: "admin" | "client";
    userName?: string; // Nome do usuário atual
}

export default function OrderChat({ orderId, currentUserType, userName }: OrderChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadMessages();
        // Polling simples para simular tempo real (já que é localStorage)
        const interval = setInterval(loadMessages, 2000);
        return () => clearInterval(interval);
    }, [orderId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    function loadMessages() {
        try {
            const savedMessages = localStorage.getItem("folk_order_chat_messages");
            if (savedMessages) {
                const allMessages: ChatMessage[] = JSON.parse(savedMessages);
                const orderMessages = allMessages.filter(m => m.orderId === orderId);
                // Ordenar por timestamp
                orderMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                // Só atualiza se houver mudança para evitar re-render desnecessário
                setMessages(prev => {
                    if (JSON.stringify(prev) !== JSON.stringify(orderMessages)) {
                        return orderMessages;
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.error("Erro ao carregar mensagens:", error);
        }
    }

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim()) return;

        const message: ChatMessage = {
            id: crypto.randomUUID(),
            orderId,
            text: newMessage.trim(),
            authorType: currentUserType,
            authorName: userName || (currentUserType === "admin" ? "Atendimento" : "Cliente"),
            timestamp: new Date().toISOString()
        };

        try {
            const savedMessages = localStorage.getItem("folk_order_chat_messages");
            const allMessages: ChatMessage[] = savedMessages ? JSON.parse(savedMessages) : [];
            allMessages.push(message);
            localStorage.setItem("folk_order_chat_messages", JSON.stringify(allMessages));

            setNewMessage("");
            loadMessages(); // Recarrega imediatamente

            // Se for mensagem do cliente, chamar ChatGPT para resposta automática
            if (currentUserType === "client") {
                try {
                    // Preparar contexto do pedido
                    const orderContext = `Pedido ID: ${orderId}`;

                    // Obter histórico de mensagens deste pedido
                    const orderMessages = allMessages.filter(m => m.orderId === orderId);

                    const response = await fetch("/api/chat/gpt", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            message: message.text,
                            conversationHistory: orderMessages.slice(-10).map(m => ({
                                content: m.text,
                                isAdmin: m.authorType === "admin"
                            })),
                            orderContext: orderContext,
                        }),
                    });

                    const data = await response.json();

                    if (data.status === "success" && data.reply) {
                        // Adicionar resposta do ChatGPT
                        const gptReply: ChatMessage = {
                            id: crypto.randomUUID(),
                            orderId,
                            text: data.reply,
                            authorType: "admin",
                            authorName: "Assistente Virtual",
                            timestamp: new Date().toISOString()
                        };

                        const updatedMessages = localStorage.getItem("folk_order_chat_messages");
                        const currentMessages: ChatMessage[] = updatedMessages ? JSON.parse(updatedMessages) : [];
                        currentMessages.push(gptReply);
                        localStorage.setItem("folk_order_chat_messages", JSON.stringify(currentMessages));
                        loadMessages();
                    }
                } catch (error) {
                    console.error("Erro ao obter resposta do ChatGPT:", error);
                    // Não mostrar erro para o usuário, apenas log
                }
            }
        } catch (error) {
            toast.error("Erro ao enviar mensagem");
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            {/* Header do Chat */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-2 shadow-sm">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Chat com {currentUserType === "admin" ? "Cliente" : "Atendimento"}</h3>
            </div>

            {/* Lista de Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                        <MessageCircle className="h-12 w-12 opacity-20" />
                        <p className="text-sm">Nenhuma mensagem ainda.</p>
                        <p className="text-xs">Inicie a conversa!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.authorType === currentUserType;
                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                            >
                                <div className={`flex items-center gap-2 mb-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                    <span className="text-xs font-medium text-gray-600">
                                        {msg.authorName}
                                    </span>
                                    {msg.authorType === "admin" ? (
                                        <ShieldCheck className="h-3 w-3 text-blue-600" />
                                    ) : (
                                        <User className="h-3 w-3 text-gray-600" />
                                    )}
                                </div>
                                <div
                                    className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${isMe
                                        ? "bg-blue-600 text-white rounded-tr-none"
                                        : "bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm"
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 px-1">
                                    {new Date(msg.timestamp).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!newMessage.trim()}
                        className="rounded-full h-10 w-10 bg-blue-600 hover:bg-blue-700"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </div>
    );
}
