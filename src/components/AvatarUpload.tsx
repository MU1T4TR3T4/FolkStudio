"use client";

import { useState, useRef } from "react";
import { Upload, User, X } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { uploadAvatar } from "@/lib/profile";

interface AvatarUploadProps {
    currentAvatarUrl?: string | null;
    userId: string;
    onUploadSuccess: (url: string) => void;
}

export default function AvatarUpload({ currentAvatarUrl, userId, onUploadSuccess }: AvatarUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tamanho
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            toast.error("Arquivo muito grande. Máximo 2MB.");
            return;
        }

        // Validar tipo
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Formato não suportado. Use JPG, PNG ou WEBP.");
            return;
        }

        // Criar preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        setSelectedFile(file);
    }

    async function handleUpload() {
        if (!selectedFile) return;

        setUploading(true);
        try {
            const result = await uploadAvatar(selectedFile, userId);

            if (!result.success) {
                toast.error(result.error || "Erro ao fazer upload");
                return;
            }

            toast.success("Foto atualizada com sucesso!");
            onUploadSuccess(result.url!);
            setSelectedFile(null);
        } catch (error) {
            console.error("Erro ao fazer upload:", error);
            toast.error("Erro ao fazer upload");
        } finally {
            setUploading(false);
        }
    }

    function handleCancel() {
        setPreview(currentAvatarUrl || null);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Avatar Preview */}
            <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                    {preview ? (
                        <img
                            src={preview}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                            <User className="h-16 w-16 text-white" />
                        </div>
                    )}
                </div>

                {/* Upload Button Overlay */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                    disabled={uploading}
                >
                    <Upload className="h-4 w-4" />
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* Action Buttons */}
            {selectedFile && (
                <div className="flex gap-2">
                    <Button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {uploading ? "Enviando..." : "Salvar Foto"}
                    </Button>
                    <Button
                        onClick={handleCancel}
                        variant="outline"
                        disabled={uploading}
                    >
                        Cancelar
                    </Button>
                </div>
            )}

            <p className="text-xs text-gray-500 text-center">
                JPG, PNG ou WEBP. Máximo 2MB.
            </p>
        </div>
    );
}
