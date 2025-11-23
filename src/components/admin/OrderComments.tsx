"use client";

import { useState } from "react";
import { Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Comment {
    id: string;
    orderId: string;
    user: string;
    text: string;
    timestamp: string;
}

interface OrderCommentsProps {
    orderId: string;
    comments: Comment[];
    onAddComment: (text: string) => void;
}

export default function OrderComments({ orderId, comments, onAddComment }: OrderCommentsProps) {
    const [newComment, setNewComment] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newComment.trim()) {
            toast.error("Digite um comentário");
            return;
        }

        onAddComment(newComment.trim());
        setNewComment("");
    };

    const orderComments = comments.filter(c => c.orderId === orderId);

    return (
        <div className="space-y-4">
            {/* Lista de Comentários */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {orderComments.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum comentário ainda</p>
                    </div>
                ) : (
                    orderComments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900">{comment.user}</span>
                                <span className="text-xs text-gray-500">
                                    {new Date(comment.timestamp).toLocaleString("pt-BR", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    })}
                                </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                        </div>
                    ))
                )}
            </div>

            {/* Formulário de Novo Comentário */}
            <form onSubmit={handleSubmit} className="space-y-3">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Adicione um comentário interno..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                />
                <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={!newComment.trim()}
                >
                    <Send className="h-4 w-4" />
                    Enviar Comentário
                </Button>
            </form>
        </div>
    );
}
