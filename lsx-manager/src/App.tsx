import { useState, useEffect } from 'react';
import { ConfigModal } from './components/ConfigModal';
import { OrderList } from './components/OrderList';
import { OrderDetailView } from './components/OrderDetailView';
import { DailyReportModal } from './components/DailyReportModal';
import type { LSXData, ActivityLog } from './types';
import { Settings, FileText } from 'lucide-react';
import { api } from './utils/api';

const ORDERS_STORAGE_KEY = 'lsx_orders';
const TEMPLATE_KEY = 'lsx_task_templates';
const LOGS_STORAGE_KEY = 'lsx_activity_logs';

const DEFAULT_TEMPLATES = ["Cắt phôi", "Dập", "Tiện thô", "Tiện tinh", "Phay", "Khoan", "Nhiệt luyện", "Mạ", "Đóng gói"];

function App() {
  const [orders, setOrders] = useState<LSXData[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [taskTemplates, setTaskTemplates] = useState<string[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Initial Load from API + Migration
  useEffect(() => {
    const initData = async () => {
      // 1. Check if we need to migrate from localStorage
      const localOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      const localTemplates = localStorage.getItem(TEMPLATE_KEY);
      const localLogs = localStorage.getItem(LOGS_STORAGE_KEY);

      // Load from API first
      let dbOrders = await api.getOrders();
      let dbTemplates = await api.getSettings<string[]>('task_templates');
      let dbLogs = await api.getLogs();

      // Migration Logic: If DB is empty but localStorage has data, migrate it
      if (dbOrders.length === 0 && localOrders) {
        try {
          const parsed = JSON.parse(localOrders);
          for (const order of parsed) {
            await api.saveOrder(order);
          }
          dbOrders = parsed;
          localStorage.removeItem(ORDERS_STORAGE_KEY);
        } catch (e) { console.error("Migration failed", e); }
      }

      if (!dbTemplates && localTemplates) {
        try {
          const parsed = JSON.parse(localTemplates);
          await api.saveSettings('task_templates', parsed);
          dbTemplates = parsed;
          localStorage.removeItem(TEMPLATE_KEY);
        } catch (e) { console.error("Migration failed", e); }
      }

      if (dbLogs.length === 0 && localLogs) {
        try {
          const parsed = JSON.parse(localLogs);
          for (const log of parsed) {
            await api.saveLog(log);
          }
          dbLogs = parsed;
          localStorage.removeItem(LOGS_STORAGE_KEY);
        } catch (e) { console.error("Migration failed", e); }
      }

      // Set state
      setOrders(dbOrders);
      setTaskTemplates(dbTemplates || DEFAULT_TEMPLATES);
      setActivityLogs(dbLogs);
    };

    initData();
  }, []);

  const handleUpdateTemplates = async (newTemplates: string[]) => {
    setTaskTemplates(newTemplates);
    await api.saveSettings('task_templates', newTemplates);
  };

  const addLog = async (action: ActivityLog['action'], orderId: string, orderName: string, extraDetails: Partial<Omit<ActivityLog, 'id' | 'timestamp' | 'action' | 'orderId' | 'orderName'>>) => {
    const log: ActivityLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      orderId,
      orderName,
      action,
      itemId: extraDetails.itemId,
      itemName: extraDetails.itemName,
      taskId: extraDetails.taskId,
      taskName: extraDetails.taskName,
      details: extraDetails.details || {}
    };
    setActivityLogs(prev => [log, ...prev].slice(0, 10000));
    await api.saveLog(log);
  };

  const handleImportOrder = async (newOrder: LSXData) => {
    if (!newOrder.id) newOrder.id = crypto.randomUUID();
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    await api.saveOrder(newOrder);
  };

  const handleSelectOrder = (orderId: string) => {
    setActiveOrderId(orderId);
  };

  const handleUpdateActiveOrder = async (updatedOrder: LSXData) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    await api.saveOrder(updatedOrder);
  };

  const handleDeleteActiveOrder = async () => {
    const order = orders.find(o => o.id === activeOrderId);
    if (confirm("Bạn có chắc muốn xóa đơn hàng này? Hành động này không thể hoàn tác.")) {
      if (order?.id) {
        await api.deleteOrder(order.id);
        addLog('order_deleted', order.id, order.meta.phieuXuat, {});
      }
      setOrders(prev => prev.filter(o => o.id !== activeOrderId));
      setActiveOrderId(null);
    }
  };

  const activeOrder = orders.find(o => o.id === activeOrderId);

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans text-gray-800">

      {!activeOrderId && (
        <div className="fixed top-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 shadow-sm transition-colors text-sm font-medium"
          >
            <FileText className="w-4 h-4" />
            Báo cáo
          </button>
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 shadow-sm transition-colors text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            Cấu hình
          </button>
        </div>
      )}

      {activeOrderId && activeOrder ? (
        <OrderDetailView
          data={activeOrder}
          onUpdate={handleUpdateActiveOrder}
          onBack={() => setActiveOrderId(null)}
          onDelete={handleDeleteActiveOrder}
          taskTemplates={taskTemplates}
          onUpdateTemplates={handleUpdateTemplates}
          onLogActivity={addLog}
        />
      ) : (
        <OrderList
          orders={orders}
          onSelectOrder={handleSelectOrder}
          onImportOrder={handleImportOrder}
        />
      )}

      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        templates={taskTemplates}
        onUpdateTemplates={handleUpdateTemplates}
      />

      <DailyReportModal
        logs={activityLogs}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
}

export default App;
