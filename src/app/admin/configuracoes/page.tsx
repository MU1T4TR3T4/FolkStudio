"use client";

import { useEffect, useState } from "react";
import { Settings, Plus, Edit, Trash2, Save, X } from "lucide-react";
import { toast, Toaster } from "sonner";

interface TshirtType {
    id: string;
    name: string;
    colors: string[];
    sizes: string[];
    isActive: boolean;
}

const DEFAULT_TYPES: TshirtType[] = [
    {
        id: "1",
        name: "Algodão",
        colors: ["Branca", "Preta", "Azul", "Vermelha", "Verde", "Amarela"],
        sizes: ["P", "M", "G", "GG", "XG"],
        isActive: true,
    },
    {
        id: "2",
        name: "Poliéster",
        colors: ["Branca", "Preta", "Azul", "Cinza"],
        sizes: ["P", "M", "G", "GG"],
        isActive: true,
    },
];

export default function ConfiguracoesPage() {
    const [types, setTypes] = useState<TshirtType[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        name: "",
        colors: "",
        sizes: "",
    });

    useEffect(() => {
        loadConfig();
    }, []);

    function loadConfig() {
        try {
            const saved = localStorage.getItem("folk_system_config");
            if (saved) {
                const config = JSON.parse(saved);
                setTypes(config.tshirtTypes || DEFAULT_TYPES);
            } else {
                // Inicializar com tipos padrão
                setTypes(DEFAULT_TYPES);
                saveConfig(DEFAULT_TYPES);
            }
        } catch (error) {
            console.error("Erro ao carregar configurações:", error);
            setTypes(DEFAULT_TYPES);
        }
    }

    function saveConfig(updatedTypes: TshirtType[]) {
        try {
            const config = {
                tshirtTypes: updatedTypes,
                defaultSettings: {
                    defaultMaterial: updatedTypes[0]?.name || "Algodão",
                    defaultColor: "Branca",
                },
            };
            localStorage.setItem("folk_system_config", JSON.stringify(config));
        } catch (error) {
            console.error("Erro ao salvar configurações:", error);
            toast.error("Erro ao salvar configurações");
        }
    }

    function handleEdit(type: TshirtType) {
        setEditingId(type.id);
        setEditForm({
            name: type.name,
            colors: type.colors.join(", "),
            sizes: type.sizes.join(", "),
        });
    }

    function handleSaveEdit(id: string) {
        if (!editForm.name.trim()) {
            toast.error("Nome é obrigatório");
            return;
        }

        const colors = editForm.colors
            .split(",")
            .map((c) => c.trim())
            .filter((c) => c);
        const sizes = editForm.sizes
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);

        if (colors.length === 0) {
            toast.error("Adicione pelo menos uma cor");
            return;
        }

        if (sizes.length === 0) {
            toast.error("Adicione pelo menos um tamanho");
            return;
        }

        const updated = types.map((t) =>
            t.id === id
                ? { ...t, name: editForm.name.trim(), colors, sizes }
                : t
        );

        setTypes(updated);
        saveConfig(updated);
        setEditingId(null);
        toast.success("Tipo atualizado com sucesso!");
    }

    function handleCancelEdit() {
        setEditingId(null);
        setEditForm({ name: "", colors: "", sizes: "" });
    }

    function handleToggleActive(id: string) {
        const updated = types.map((t) =>
            t.id === id ? { ...t, isActive: !t.isActive } : t
        );
        setTypes(updated);
        saveConfig(updated);

        const type = updated.find(t => t.id === id);
        toast.success(`Tipo ${type?.isActive ? 'ativado' : 'desativado'} com sucesso!`);
    }

    function handleDelete(id: string) {
        const type = types.find((t) => t.id === id);
        if (!type) return;

        if (!confirm(`Excluir tipo "${type.name}"?`)) return;

        const updated = types.filter((t) => t.id !== id);
        setTypes(updated);
        saveConfig(updated);
        toast.success("Tipo excluído com sucesso!");
    }

    function handleAddNew() {
        const newType: TshirtType = {
            id: crypto.randomUUID(),
            name: "Novo Tipo",
            colors: ["Branca", "Preta"],
            sizes: ["P", "M", "G"],
            isActive: true,
        };

        const updated = [...types, newType];
        setTypes(updated);
        saveConfig(updated);
        setEditingId(newType.id);
        setEditForm({
            name: newType.name,
            colors: newType.colors.join(", "),
            sizes: newType.sizes.join(", "),
        });
        toast.success("Novo tipo adicionado! Edite os dados.");
    }

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gerencie tipos de camisetas, cores e tamanhos disponíveis
                    </p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                    <Plus className="h-4 w-4" />
                    Novo Tipo
                </button>
            </div>

            {/* Tipos de Camisetas */}
            <div className="space-y-4">
                {types.map((type) => (
                    <div
                        key={type.id}
                        className={`bg-white rounded-xl border shadow-sm overflow-hidden ${type.isActive ? "border-gray-200" : "border-gray-300 opacity-60"
                            }`}
                    >
                        {editingId === type.id ? (
                            // Modo de Edição
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nome do Tipo *
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Ex: Algodão, Poliéster..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Cores Disponíveis * (separadas por vírgula)
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.colors}
                                        onChange={(e) => setEditForm({ ...editForm, colors: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Ex: Branca, Preta, Azul, Vermelha..."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Cores: {editForm.colors.split(",").filter(c => c.trim()).length}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tamanhos Disponíveis * (separados por vírgula)
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.sizes}
                                        onChange={(e) => setEditForm({ ...editForm, sizes: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Ex: P, M, G, GG, XG..."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Tamanhos: {editForm.sizes.split(",").filter(s => s.trim()).length}
                                    </p>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => handleSaveEdit(type.id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                                    >
                                        <Save className="h-4 w-4" />
                                        Salvar
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Modo de Visualização
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{type.name}</h3>
                                        <span
                                            className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${type.isActive
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-700"
                                                }`}
                                        >
                                            {type.isActive ? "Ativo" : "Inativo"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(type)}
                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(type.id)}
                                            className={`px-3 py-1 text-sm rounded-lg transition-colors ${type.isActive
                                                    ? "text-yellow-700 hover:bg-yellow-50"
                                                    : "text-green-700 hover:bg-green-50"
                                                }`}
                                        >
                                            {type.isActive ? "Desativar" : "Ativar"}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(type.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                            Cores Disponíveis ({type.colors.length})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {type.colors.map((color, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                                >
                                                    {color}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                            Tamanhos Disponíveis ({type.sizes.length})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {type.sizes.map((size, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                                                >
                                                    {size}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {types.length === 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">
                            Nenhum tipo de camiseta cadastrado. Clique em "Novo Tipo" para começar.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
