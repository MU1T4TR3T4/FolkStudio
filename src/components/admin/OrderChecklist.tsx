interface ChecklistItem {
    id: string;
    label: string;
    completed: boolean;
}

interface OrderChecklistProps {
    items: ChecklistItem[];
    onToggle: (id: string) => void;
}

export default function OrderChecklist({ items, onToggle }: OrderChecklistProps) {
    const completedCount = items.filter(item => item.completed).length;
    const progress = (completedCount / items.length) * 100;

    return (
        <div className="space-y-4">
            {/* Barra de Progresso */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progresso</span>
                    <span className="text-sm text-gray-500">{completedCount}/{items.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Lista de Tarefas */}
            <div className="space-y-2">
                {items.map((item) => (
                    <label
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                        <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => onToggle(item.id)}
                            className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                        />
                        <span className={`flex-1 text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {item.label}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
}
