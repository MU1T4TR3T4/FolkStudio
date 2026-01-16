"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Search, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getClients, Client } from "@/lib/clients";

interface ClientSelectProps {
    value?: string;
    onSelect: (client: Client) => void;
    className?: string;
}

export function ClientSelect({ value, onSelect, className }: ClientSelectProps) {
    const [open, setOpen] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadClients();

        // Click outside listener
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Update internal state if value prop changes (and we have loaded clients)
    useEffect(() => {
        if (value && clients.length > 0) {
            const found = clients.find(c => c.id === value);
            if (found) setSelectedClient(found);
        }
    }, [value, clients]);

    async function loadClients() {
        setLoading(true);
        try {
            const data = await getClients();
            setClients(data);
        } catch (error) {
            console.error("Failed to load clients", error);
        } finally {
            setLoading(false);
        }
    }

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.company_name && client.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSelect = (client: Client) => {
        setSelectedClient(client);
        onSelect(client);
        setOpen(false);
        setSearchTerm("");
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Selecionar Cliente
            </label>
            <div className="relative">
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full flex items-center justify-between bg-white text-left font-normal border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500/20 px-3 py-2 h-auto"
                    onClick={() => setOpen(!open)}
                    type="button"
                >
                    {selectedClient ? (
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="font-medium text-gray-900 truncate">{selectedClient.name}</span>
                            {selectedClient.company_name && (
                                <span className="text-gray-500 text-xs truncate">- {selectedClient.company_name}</span>
                            )}
                        </div>
                    ) : (
                        <span className="text-gray-500">Selecione um cliente...</span>
                    )}
                    {loading ? (
                        <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
                    ) : (
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    )}
                </Button>

                {open && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <div className="flex items-center border-b px-3 py-2 bg-gray-50/50">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                                placeholder="Buscar cliente..."
                                className="flex h-6 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-gray-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto p-1">
                            {filteredClients.length === 0 ? (
                                <div className="py-6 text-center text-sm text-gray-500">
                                    Nenhum cliente encontrado.
                                </div>
                            ) : (
                                filteredClients.map((client) => (
                                    <div
                                        key={client.id}
                                        className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-blue-50 hover:text-blue-700 transition-colors ${selectedClient?.id === client.id ? "bg-blue-50 text-blue-700" : "text-gray-900"
                                            }`}
                                        onClick={() => handleSelect(client)}
                                    >
                                        <div className="flex flex-col flex-1 pl-1">
                                            <span className="font-medium">{client.name}</span>
                                            {client.company_name && (
                                                <span className="text-xs text-gray-500">{client.company_name}</span>
                                            )}
                                        </div>
                                        {selectedClient?.id === client.id && (
                                            <Check className="ml-auto h-4 w-4 opacity-100 text-blue-600" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        {/* Optional: Add button to create new client here if needed later */}
                    </div>
                )}
            </div>
        </div>
    );
}
