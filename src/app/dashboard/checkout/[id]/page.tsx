"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner";

interface Order {
    id: string;
    previewUrl: string;
    model: string;
    color: string;
    createdAt: string;
}

export default function CheckoutPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        address: ""
    });

    useEffect(() => {
        async function fetchOrder() {
            if (!id) return;
            try {
                const res = await fetch(`/api/orders/get?id=${id}`);
                const data = await res.json();

                if (data.status === "success") {
                    setOrder(data.order);
                } else {
                    setError(data.message || "Erro ao carregar pedido");
                    toast.error(data.message || "Erro ao carregar pedido");
                }
            } catch (err) {
                setError("Erro de conexão");
                toast.error("Erro de conexão");
            } finally {
                setLoading(false);
            }
        }

        fetchOrder();
    }, [id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.phone || !formData.address) {
            toast.error("Por favor, preencha todos os campos.");
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch("/api/orders/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: id,
                    ...formData
                })
            });

            const data = await res.json();

            if (data.status === "success") {
                toast.success("Pedido enviado com sucesso!");
                setTimeout(() => {
                    router.push("/dashboard/pedidos");
                }, 2000);
            } else {
                toast.error(data.message || "Erro ao enviar pedido");
                setSubmitting(false);
            }
        } catch (err) {
            toast.error("Erro de conexão ao enviar pedido");
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
    };

    const modelMap: Record<string, string> = {
        short: "Manga Curta",
        long: "Manga Longa",
    };

    const colorMap: Record<string, string> = {
        white: "Branco",
        black: "Preto",
        blue: "Azul",
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] gap-4">
                <p className="text-red-500 font-medium">{error || "Pedido não encontrado"}</p>
                <Button variant="outline" onClick={() => router.push("/dashboard/pedidos")}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Pedidos
                </Button>
            </div>
        );
    }

    return (
        <div className="container max-w-lg mx-auto py-8 px-4 space-y-8">
            <Toaster position="top-right" richColors />

            <div className="flex items-center gap-2 mb-6">
                <Button variant="ghost" size="sm" className="-ml-2" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">Finalizar Pedido</h1>
            </div>

            {/* Resumo do Pedido */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 items-center">
                <div className="h-20 w-20 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
                    <img
                        src={order.previewUrl}
                        alt="Prévia"
                        className="w-full h-full object-contain"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">Camiseta Personalizada</h3>
                    <p className="text-sm text-gray-500">
                        {modelMap[order.model] || order.model} • {colorMap[order.color] || order.color}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Criado em {formatDate(order.createdAt)}
                    </p>
                </div>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="space-y-4">
                    <h2 className="font-semibold text-gray-900 border-b pb-2">Dados de Entrega</h2>

                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-gray-700">Nome Completo</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Seu nome completo"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium text-gray-700">Telefone / WhatsApp</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="(00) 00000-0000"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="address" className="text-sm font-medium text-gray-700">Endereço Completo</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                            placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
                            required
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-medium"
                    disabled={submitting}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Enviando...
                        </>
                    ) : (
                        "Finalizar Pedido"
                    )}
                </Button>
            </form>
        </div>
    );
}
