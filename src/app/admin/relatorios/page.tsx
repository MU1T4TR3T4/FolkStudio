"use client";

import { useState } from "react";
import { FileText, Download, FileSpreadsheet, Calendar, Filter } from "lucide-react";
import { toast, Toaster } from "sonner";
import * as XLSX from "xlsx";

type ReportType = "pedidos" | "clientes" | "producao";

export default function RelatoriosPage() {
    const [reportType, setReportType] = useState<ReportType>("pedidos");
    const [dateStart, setDateStart] = useState("");
    const [dateEnd, setDateEnd] = useState("");
    const [statusFilter, setStatusFilter] = useState("todos");
    const [clientFilter, setClientFilter] = useState("todos");
    const [previewData, setPreviewData] = useState<any[]>([]);

    function generateReport() {
        try {
            let data: any[] = [];

            switch (reportType) {
                case "pedidos":
                    data = generateOrdersReport();
                    break;
                case "clientes":
                    data = generateClientsReport();
                    break;
                case "producao":
                    data = generateProductionReport();
                    break;
            }

            setPreviewData(data);
            toast.success(`Relatório gerado com ${data.length} registros`);
        } catch (error) {
            console.error("Erro ao gerar relatório:", error);
            toast.error("Erro ao gerar relatório");
        }
    }

    function generateOrdersReport() {
        const orders = JSON.parse(localStorage.getItem("folk_studio_orders") || "[]");
        let filtered = [...orders];

        // Filtro por data
        if (dateStart) {
            filtered = filtered.filter(o => new Date(o.createdAt) >= new Date(dateStart));
        }
        if (dateEnd) {
            filtered = filtered.filter(o => new Date(o.createdAt) <= new Date(dateEnd));
        }

        // Filtro por status
        if (statusFilter !== "todos") {
            filtered = filtered.filter(o => (o.adminStatus || "novo") === statusFilter);
        }

        // Filtro por cliente
        if (clientFilter !== "todos") {
            filtered = filtered.filter(o => o.clientName === clientFilter);
        }

        return filtered.map(order => ({
            "ID": order.id.slice(0, 8),
            "Cliente": order.clientName || "-",
            "Data": new Date(order.createdAt).toLocaleDateString("pt-BR"),
            "Status": order.adminStatus || "novo",
            "Quantidade": order.totalQty,
            "Cor": order.color,
            "Material": order.material,
            "Responsável": order.responsible || "-",
            "Observações": order.observations || "-"
        }));
    }

    function generateClientsReport() {
        const clients = JSON.parse(localStorage.getItem("folk_clients") || "[]");
        const orders = JSON.parse(localStorage.getItem("folk_studio_orders") || "[]");

        return clients.map((client: any) => {
            const clientOrders = orders.filter((o: any) => o.clientName === client.name);
            return {
                "Nome": client.name,
                "Email": client.email,
                "Telefone": client.phone || "-",
                "Total de Pedidos": clientOrders.length,
                "Data de Cadastro": new Date(client.createdAt).toLocaleDateString("pt-BR"),
                "Endereço": client.address || "-"
            };
        });
    }

    function generateProductionReport() {
        const employees = JSON.parse(localStorage.getItem("folk_employees") || "[]");
        const orders = JSON.parse(localStorage.getItem("folk_studio_orders") || "[]");

        let filtered = [...orders];

        // Filtro por data
        if (dateStart) {
            filtered = filtered.filter(o => new Date(o.createdAt) >= new Date(dateStart));
        }
        if (dateEnd) {
            filtered = filtered.filter(o => new Date(o.createdAt) <= new Date(dateEnd));
        }

        return employees.map((emp: any) => {
            const empOrders = filtered.filter((o: any) => o.responsible === emp.name);
            const produced = empOrders.filter((o: any) =>
                o.adminStatus === "pronto" || o.adminStatus === "entregue"
            );

            return {
                "Funcionário": emp.name,
                "Cargo": emp.role === "admin" ? "Administrador" : "Funcionário",
                "Status": emp.isActive ? "Ativo" : "Inativo",
                "Pedidos Atribuídos": empOrders.length,
                "Pedidos Produzidos": produced.length,
                "Taxa de Conclusão": empOrders.length > 0
                    ? `${Math.round((produced.length / empOrders.length) * 100)}%`
                    : "0%"
            };
        });
    }

    function exportToExcel() {
        if (previewData.length === 0) {
            toast.error("Gere um relatório primeiro");
            return;
        }

        try {
            const worksheet = XLSX.utils.json_to_sheet(previewData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");

            const filename = `relatorio-${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, filename);

            toast.success("Relatório exportado em Excel!");
        } catch (error) {
            console.error("Erro ao exportar Excel:", error);
            toast.error("Erro ao exportar Excel");
        }
    }

    function exportToCSV() {
        if (previewData.length === 0) {
            toast.error("Gere um relatório primeiro");
            return;
        }

        try {
            const worksheet = XLSX.utils.json_to_sheet(previewData);
            const csv = XLSX.utils.sheet_to_csv(worksheet);

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `relatorio-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Relatório exportado em CSV!");
        } catch (error) {
            console.error("Erro ao exportar CSV:", error);
            toast.error("Erro ao exportar CSV");
        }
    }

    // Obter clientes únicos para filtro
    const orders = JSON.parse(localStorage.getItem("folk_studio_orders") || "[]");
    const uniqueClients = Array.from(new Set(orders.map((o: any) => o.clientName).filter(Boolean)));

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Gere e exporte relatórios em Excel ou CSV
                </p>
            </div>

            {/* Configuração do Relatório */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
                <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Configuração do Relatório</h3>

                    {/* Tipo de Relatório */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <button
                            onClick={() => setReportType("pedidos")}
                            className={`p-4 border-2 rounded-lg transition-all ${reportType === "pedidos"
                                    ? "border-indigo-500 bg-indigo-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                        >
                            <FileText className={`h-6 w-6 mx-auto mb-2 ${reportType === "pedidos" ? "text-indigo-600" : "text-gray-400"
                                }`} />
                            <p className={`text-sm font-medium ${reportType === "pedidos" ? "text-indigo-900" : "text-gray-700"
                                }`}>
                                Relatório de Pedidos
                            </p>
                        </button>

                        <button
                            onClick={() => setReportType("clientes")}
                            className={`p-4 border-2 rounded-lg transition-all ${reportType === "clientes"
                                    ? "border-indigo-500 bg-indigo-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                        >
                            <FileText className={`h-6 w-6 mx-auto mb-2 ${reportType === "clientes" ? "text-indigo-600" : "text-gray-400"
                                }`} />
                            <p className={`text-sm font-medium ${reportType === "clientes" ? "text-indigo-900" : "text-gray-700"
                                }`}>
                                Relatório de Clientes
                            </p>
                        </button>

                        <button
                            onClick={() => setReportType("producao")}
                            className={`p-4 border-2 rounded-lg transition-all ${reportType === "producao"
                                    ? "border-indigo-500 bg-indigo-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                        >
                            <FileText className={`h-6 w-6 mx-auto mb-2 ${reportType === "producao" ? "text-indigo-600" : "text-gray-400"
                                }`} />
                            <p className={`text-sm font-medium ${reportType === "producao" ? "text-indigo-900" : "text-gray-700"
                                }`}>
                                Relatório de Produção
                            </p>
                        </button>
                    </div>

                    {/* Filtros */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filtros
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Período */}
                            {(reportType === "pedidos" || reportType === "producao") && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Data Início
                                        </label>
                                        <input
                                            type="date"
                                            value={dateStart}
                                            onChange={(e) => setDateStart(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Data Fim
                                        </label>
                                        <input
                                            type="date"
                                            value={dateEnd}
                                            onChange={(e) => setDateEnd(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Status (apenas para pedidos) */}
                            {reportType === "pedidos" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                    >
                                        <option value="todos">Todos</option>
                                        <option value="novo">Novo</option>
                                        <option value="producao">Em Produção</option>
                                        <option value="pronto">Pronto</option>
                                        <option value="entregue">Entregue</option>
                                    </select>
                                </div>
                            )}

                            {/* Cliente (apenas para pedidos) */}
                            {reportType === "pedidos" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Cliente
                                    </label>
                                    <select
                                        value={clientFilter}
                                        onChange={(e) => setClientFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                    >
                                        <option value="todos">Todos</option>
                                        {uniqueClients.map((client: any) => (
                                            <option key={client} value={client}>{client}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botão Gerar */}
                    <div className="pt-4">
                        <button
                            onClick={generateReport}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                            <FileText className="h-5 w-5" />
                            Gerar Relatório
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview */}
            {previewData.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900">Preview do Relatório</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {previewData.length} registro(s) encontrado(s)
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={exportToCSV}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                <FileText className="h-4 w-4" />
                                Exportar CSV
                            </button>
                            <button
                                onClick={exportToExcel}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                                Exportar Excel
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    {Object.keys(previewData[0] || {}).map((key) => (
                                        <th
                                            key={key}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            {key}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {previewData.slice(0, 10).map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        {Object.values(row).map((value: any, cellIdx) => (
                                            <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {value}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {previewData.length > 10 && (
                            <div className="p-4 text-center text-sm text-gray-500 border-t border-gray-200">
                                Mostrando 10 de {previewData.length} registros. Exporte para ver todos.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Estado Vazio */}
            {previewData.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                        Configure os filtros e clique em "Gerar Relatório" para visualizar os dados
                    </p>
                </div>
            )}
        </div>
    );
}
