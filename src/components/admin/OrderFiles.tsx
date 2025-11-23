"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X, Download, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface OrderFile {
    id: string;
    orderId: string;
    name: string;
    type: string;
    size: number;
    content: string; // Base64
    uploadedAt: string;
    uploadedBy: string;
}

interface OrderFilesProps {
    orderId: string;
    files: OrderFile[];
    onUpload: (file: OrderFile) => void;
    onDelete: (fileId: string) => void;
}

export default function OrderFiles({ orderId, files, onUpload, onDelete }: OrderFilesProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limite de 2MB para não estourar o localStorage
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Arquivo muito grande. Máximo 2MB.");
            return;
        }

        setIsUploading(true);
        try {
            const base64 = await convertToBase64(file);
            const adminUser = localStorage.getItem("folk_admin_user") || "Admin";

            const newFile: OrderFile = {
                id: crypto.randomUUID(),
                orderId,
                name: file.name,
                type: file.type,
                size: file.size,
                content: base64 as string,
                uploadedAt: new Date().toISOString(),
                uploadedBy: adminUser
            };

            onUpload(newFile);
            toast.success("Arquivo anexado com sucesso!");
        } catch (error) {
            console.error("Erro ao processar arquivo:", error);
            toast.error("Erro ao processar arquivo");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const convertToBase64 = (file: File) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const handleDownload = (file: OrderFile) => {
        const link = document.createElement("a");
        link.href = file.content;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const orderFiles = files.filter(f => f.orderId === orderId);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Arquivos Anexados ({orderFiles.length})</h3>
                <div className="relative">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="gap-2"
                    >
                        <Upload className="h-4 w-4" />
                        {isUploading ? "Enviando..." : "Anexar Arquivo"}
                    </Button>
                </div>
            </div>

            {orderFiles.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Nenhum arquivo anexado</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {orderFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-white rounded border border-gray-200">
                                    {file.type.startsWith("image/") ? (
                                        <ImageIcon className="h-5 w-5 text-blue-500" />
                                    ) : (
                                        <FileText className="h-5 w-5 text-gray-500" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString("pt-BR")} por {file.uploadedBy}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDownload(file)}
                                    title="Baixar"
                                >
                                    <Download className="h-4 w-4 text-gray-500" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onDelete(file.id)}
                                    title="Excluir"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
