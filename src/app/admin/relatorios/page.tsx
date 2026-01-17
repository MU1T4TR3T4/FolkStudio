"use client";
import { useEffect, useState } from "react";
import { Download, Search, Filter, FileText, Users, Box, BarChart3, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { getAllOrders, Order } from "@/lib/orders";
import { getClients, Client } from "@/lib/clients";
import { getAllUsers, User } from "@/lib/auth";
import { toast } from "sonner";

// --- Types ---
type ReportType = 'orders' | 'clients' | 'production' | 'team' | 'overview';

// --- Components ---

function StatCard({ title, value, icon: Icon, colorClass }: { title: string, value: string | number, icon: any, colorClass: string }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10 text-opacity-100`}>
                <Icon className={`h-6 w-6 ${colorClass.replace('bg-', 'text-')}`} />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<ReportType>('orders');
    const [loading, setLoading] = useState(true);

    // Data
    const [orders, setOrders] = useState<Order[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    // Filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [filteredData, setFilteredData] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [activeTab, orders, clients, users, startDate, endDate, statusFilter]);

    async function loadData() {
        try {
            setLoading(true);
            const [ordersData, clientsData, usersData] = await Promise.all([
                getAllOrders(),
                getClients(),
                getAllUsers()
            ]);
            setOrders(ordersData);
            setClients(clientsData);
            setUsers(usersData);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar dados dos relatórios.");
        } finally {
            setLoading(false);
        }
    }

    function applyFilters() {
        let data: any[] = [];

        if (activeTab === 'clients') {
            data = clients;
            // Client filters usually just search, but could be date joined if available
            if (startDate && endDate) {
                // Assuming clients have created_at
                data = data.filter(c => {
                    if (!c.created_at) return true;
                    const d = new Date(c.created_at);
                    return d >= new Date(startDate) && d <= new Date(endDate);
                });
            }
        } else {
            // Orders, Production, Team all based on Orders mainly
            data = orders;

            if (startDate) {
                data = data.filter(o => new Date(o.created_at) >= new Date(startDate));
            }
            if (endDate) {
                // End of day
                const end = new Date(endDate);
                end.setHours(23, 59, 59);
                data = data.filter(o => new Date(o.created_at) <= end);
            }
            if (statusFilter !== 'all') {
                data = data.filter(o => o.status === statusFilter);
            }
        }

        setFilteredData(data);
    }

    function exportToExcel() {
        if (filteredData.length === 0) {
            toast.error("Sem dados para exportar.");
            return;
        }

        let exportData: any[] = [];

        // Map data based on active tab to ensure clean columns
        if (activeTab === 'orders') {
            exportData = filteredData.map(o => {
                const creator = users.find(u => u.id === o.created_by) || users.find(u => u.email === o.created_by);
                const creatorName = creator ? creator.full_name : (o.created_by || 'Sistema');
                return {
                    ID: o.id,
                    Cliente: o.customer_name,
                    "Data Criação": new Date(o.created_at).toLocaleDateString(),
                    Status: o.status,
                    Produto: o.product_type || o.productType || '-',
                    Quantidade: o.quantity,
                    Cor: o.color,
                    "Preço Total": o.total_price,
                    Responsável: creatorName,
                    Observações: o.notes || '-'
                };
            });
        } else if (activeTab === 'clients') {
            exportData = filteredData.map(c => ({
                Nome: c.name,
                Email: c.email || '-',
                Telefone: c.phone || '-',
                Empresa: c.company_name || '-',
                "Data Cadastro": c.created_at ? new Date(c.created_at).toLocaleDateString() : '-',
                Cidade: c.address_city || '-',
                Estado: c.address_state || '-'
            }));
        } else if (activeTab === 'production') {
            exportData = filteredData.map(o => {
                const creator = users.find(u => u.id === o.created_by) || users.find(u => u.email === o.created_by);
                const creatorName = creator ? creator.full_name : (o.created_by || 'Sistema');
                return {
                    Pedido: o.id,
                    Stage: o.kanban_stage || o.status,
                    "Iniciado Em": new Date(o.created_at).toLocaleDateString(),
                    "Dias em Produção": Math.floor((new Date().getTime() - new Date(o.created_at).getTime()) / (1000 * 3600 * 24)),
                    Responsável: creatorName
                };
            });
        } else if (activeTab === 'team') {
            // Summarize by team member
            const teamStats: { [key: string]: any } = {};
            filteredData.forEach(o => {
                const memberId = o.assigned_to || o.created_by || 'Não Atribuído';
                const user = users.find(u => u.id === memberId || u.email === memberId);
                const memberName = user ? user.full_name : memberId;

                if (!teamStats[memberName]) {
                    teamStats[memberName] = {
                        Membro: memberName,
                        "Total Pedidos": 0,
                        "Atividades Concluídas": 0,
                        "Última Atividade": o.created_at
                    };
                }
                teamStats[memberName]["Total Pedidos"]++;

                // Count completed activities (status completed or kanban finalized/delivered)
                if (['completed', 'finalized', 'delivered'].includes(o.status) || ['finalized', 'delivery'].includes(o.kanban_stage || '')) {
                    teamStats[memberName]["Atividades Concluídas"]++;
                }

                if (new Date(o.created_at) > new Date(teamStats[memberName]["Última Atividade"])) {
                    teamStats[memberName]["Última Atividade"] = o.created_at;
                }
            });
            exportData = Object.values(teamStats);
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `relatorio_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Relatório CSV exportado com sucesso!");
    }

    // --- Render Helpers ---

    const renderHeader = () => (
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 p-8 bg-white border-b sticky top-0 z-10">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Central de Relatórios</h1>
                <p className="text-gray-500 mt-1">Análise detalhada de pedidos, clientes e produtividade da equipe.</p>
            </div>
            <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm hover:shadow-md"
            >
                <Download className="h-5 w-5" />
                Exportar CSV
            </button>
        </div>
    );

    const renderFilters = () => (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4" /> Configuração do Relatório
            </h3>
            <div className="flex flex-col md:flex-row gap-4 items-end">
                {/* Type Selection */}
                <div className="flex-1 w-full space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Tipo de Relatório</label>
                    <div className="flex rounded-lg overflow-hidden border border-gray-200 divide-x divide-gray-200">
                        {[
                            { id: 'orders', label: 'Pedidos', icon: FileText },
                            { id: 'clients', label: 'Clientes', icon: Users },
                            { id: 'production', label: 'Produção', icon: Box },
                            { id: 'team', label: 'Equipe', icon: Users }, // Reused icon or maybe UserCog
                        ].map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setActiveTab(type.id as ReportType)}
                                className={`flex items-center justify-center gap-2 flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === type.id
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <type.icon className="h-4 w-4" />
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date Range */}
                <div className="w-full md:w-auto space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Período</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Status (Only for Orders/Production) */}
                {['orders', 'production'].includes(activeTab) && (
                    <div className="w-full md:w-48 space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Status</label>
                        <select
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Todos</option>
                            <option value="pending">Pendente</option>
                            <option value="in_production">Em Produção</option>
                            <option value="completed">Concluído</option>
                            <option value="cancelled">Cancelado</option>
                        </select>
                    </div>
                )}
            </div>
        </div>
    );

    const renderTable = () => {
        if (loading) return <div className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" /><p className="mt-2 text-gray-500">Gerando relatório...</p></div>;

        if (activeTab === 'orders') {
            return (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-semibold border-b">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">CLIENTE</th>
                                <th className="px-6 py-4">DATA</th>
                                <th className="px-6 py-4">STATUS</th>
                                <th className="px-6 py-4">MATERIAL</th>
                                <th className="px-6 py-4">COR</th>
                                <th className="px-6 py-4">QTD</th>
                                <th className="px-6 py-4">RESPONSÁVEL</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredData.map((o: Order) => {
                                const creator = users.find(u => u.id === o.created_by) || users.find(u => u.email === o.created_by);
                                const creatorName = creator ? creator.full_name : (o.created_by || 'Sistema');
                                return (
                                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3 font-mono text-xs text-gray-500">#{o.id.slice(0, 8)}</td>
                                        <td className="px-6 py-3 font-medium text-gray-900">{o.customer_name}</td>
                                        <td className="px-6 py-3 text-gray-600">{new Date(o.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}>
                                                {o.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-gray-600">{o.product_type}</td>
                                        <td className="px-6 py-3 text-gray-600 max-w-[150px] truncate">{o.color}</td>
                                        <td className="px-6 py-3 font-medium text-gray-900">{o.quantity}</td>
                                        <td className="px-6 py-3 text-gray-600">{creatorName}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            );
        }

        if (activeTab === 'clients') {
            return (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-semibold border-b">
                            <tr>
                                <th className="px-6 py-4">NOME</th>
                                <th className="px-6 py-4">EMAIL</th>
                                <th className="px-6 py-4">TELEFONE</th>
                                <th className="px-6 py-4">EMPRESA</th>
                                <th className="px-6 py-4">CIDADE/UF</th>
                                <th className="px-6 py-4">DATA CADASTRO</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredData.map((c: Client) => (
                                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-gray-900">{c.name}</td>
                                    <td className="px-6 py-3 text-gray-600">{c.email || '-'}</td>
                                    <td className="px-6 py-3 text-gray-600">{c.phone || '-'}</td>
                                    <td className="px-6 py-3 text-gray-600">{c.company_name || '-'}</td>
                                    <td className="px-6 py-3 text-gray-600">{c.address_city && c.address_state ? `${c.address_city}/${c.address_state}` : '-'}</td>
                                    <td className="px-6 py-3 text-gray-600">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        if (activeTab === 'production') {
            return (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-semibold border-b">
                            <tr>
                                <th className="px-6 py-4">PEDIDO</th>
                                <th className="px-6 py-4">STATUS ATUAL</th>
                                <th className="px-6 py-4">KANBAN STAGE</th>
                                <th className="px-6 py-4">INICIADO EM</th>
                                <th className="px-6 py-4">TEMPO EM PRODUÇÃO</th>
                                <th className="px-6 py-4">RESPONSÁVEL</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredData.map((o: Order) => {
                                const days = Math.floor((new Date().getTime() - new Date(o.created_at).getTime()) / (1000 * 3600 * 24));
                                const creator = users.find(u => u.id === o.created_by) || users.find(u => u.email === o.created_by);
                                const creatorName = creator ? creator.full_name : (o.created_by || 'Sistema');
                                return (
                                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3 font-mono text-xs text-gray-500">#{o.id.slice(0, 8)}</td>
                                        <td className="px-6 py-3 font-medium text-gray-900">{o.status}</td>
                                        <td className="px-6 py-3 text-gray-600 uppercase tracking-wide text-xs">{o.kanban_stage?.replace('_', ' ') || '-'}</td>
                                        <td className="px-6 py-3 text-gray-600">{new Date(o.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${days > 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {days} dias
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-gray-600">{creatorName}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            );
        }

        if (activeTab === 'team') {
            // Calculate stats on the fly for team view table
            const teamStats: any[] = [];
            const map = new Map();

            filteredData.forEach(o => {
                const memberId = o.assigned_to || o.created_by || 'Não Atribuído';
                const user = users.find(u => u.id === memberId || u.email === memberId);
                const memberName = user ? user.full_name : memberId;

                if (!map.has(memberName)) {
                    map.set(memberName, { name: memberName, total: 0, completed: 0, lastActive: o.created_at });
                }
                const stats = map.get(memberName);
                stats.total++;

                if (['completed', 'finalized', 'delivered'].includes(o.status) || ['finalized', 'delivery'].includes(o.kanban_stage || '')) {
                    stats.completed++;
                }

                if (new Date(o.created_at) > new Date(stats.lastActive)) stats.lastActive = o.created_at;
            });

            Array.from(map.values()).forEach(v => teamStats.push(v));

            return (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <div className="p-4 bg-yellow-50 text-yellow-800 text-xs rounded-t-xl mb-0 border-b border-yellow-100">
                        Nota: Relatório baseado pormenorizadamente nos pedidos atribuídos ou criados por cada membro.
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-semibold border-b">
                            <tr>
                                <th className="px-6 py-4">MEMBRO</th>
                                <th className="px-6 py-4 text-center">TOTAL PEDIDOS</th>
                                <th className="px-6 py-4 text-center">ATIVIDADES CONCLUÍDAS</th>
                                <th className="px-6 py-4">ÚLTIMA ATIVIDADE</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {teamStats.map((stats, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-gray-900 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                            {stats.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        {stats.name}
                                    </td>
                                    <td className="px-6 py-3 text-center text-gray-900 font-bold">{stats.total}</td>
                                    <td className="px-6 py-3 text-center text-green-600 font-medium">{stats.completed}</td>
                                    <td className="px-6 py-3 text-gray-500">{new Date(stats.lastActive).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            {renderHeader()}

            <div className="p-8 max-w-[1920px] mx-auto">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total de Pedidos"
                        value={orders.length}
                        icon={FileText}
                        colorClass="bg-blue-500"
                    />
                    <StatCard
                        title="Total de Clientes"
                        value={clients.length}
                        icon={Users}
                        colorClass="bg-purple-500"
                    />
                    <StatCard
                        title="Pedidos Concluídos"
                        value={orders.filter(o => o.status === 'completed' || o.kanban_stage === 'finalized').length}
                        icon={Box}
                        colorClass="bg-green-500"
                    />
                    <StatCard
                        title="Em Produção"
                        value={orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length}
                        icon={BarChart3}
                        colorClass="bg-yellow-500"
                    />
                </div>

                {renderFilters()}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Preview do Relatório</h3>
                        <span className="text-sm text-gray-500">{filteredData.length} registros encontrados</span>
                    </div>
                    {renderTable()}
                </div>
            </div>
        </div>
    );
}
