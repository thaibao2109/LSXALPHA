import { useState, useEffect } from 'react';
import { ConfigModal } from './components/ConfigModal';
import { OrderList } from './components/OrderList';
import { OrderDetailView } from './components/OrderDetailView';
import { DailyReportModal } from './components/DailyReportModal';
import type { LSXData, ActivityLog, ProductType } from './types';
import {
  Settings,
  FileText,
  ClipboardList,
  Bell,
  Search,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { api } from './utils/api';
import { DEFAULT_PRINT_CONFIG, type PrintConfig } from './utils/printConfig';

const ORDERS_STORAGE_KEY = 'lsx_orders';
const TEMPLATE_KEY = 'lsx_task_templates';
const LOGS_STORAGE_KEY = 'lsx_activity_logs';
const PRODUCT_TYPES_KEY = 'lsx_product_types';

const DEFAULT_TEMPLATES = ["Cắt phôi", "Dập", "Tiện thô", "Tiện tinh", "Phay", "Khoan", "Nhiệt luyện", "Mạ", "Đóng gói"];

type ViewState = 'dashboard' | 'orders';

function App() {
  const [orders, setOrders] = useState<LSXData[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('orders');

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [taskTemplates, setTaskTemplates] = useState<string[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [printConfig, setPrintConfig] = useState<PrintConfig>(DEFAULT_PRINT_CONFIG);

  // Initial Load from API + Migration
  useEffect(() => {
    const initData = async () => {
      const localOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      const localTemplates = localStorage.getItem(TEMPLATE_KEY);
      const localLogs = localStorage.getItem(LOGS_STORAGE_KEY);
      const localProductTypes = localStorage.getItem(PRODUCT_TYPES_KEY);

      let dbOrders = await api.getOrders();
      let dbTemplates = await api.getSettings<string[]>('task_templates');
      let dbProductTypes = await api.getSettings<ProductType[]>('product_types');
      let dbLogs = await api.getLogs();
      let dbPrintConfig = await api.getSettings<PrintConfig>('print_config');

      if (dbOrders.length === 0 && localOrders) {
        try {
          const parsed = JSON.parse(localOrders);
          for (const order of parsed) await api.saveOrder(order);
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

      if (!dbProductTypes && localProductTypes) {
        try {
          const parsed = JSON.parse(localProductTypes);
          await api.saveSettings('product_types', parsed);
          dbProductTypes = parsed;
          localStorage.removeItem(PRODUCT_TYPES_KEY);
        } catch (e) { console.error("Migration failed", e); }
      }

      if (dbLogs.length === 0 && localLogs) {
        try {
          const parsed = JSON.parse(localLogs);
          for (const log of parsed) await api.saveLog(log);
          dbLogs = parsed;
          localStorage.removeItem(LOGS_STORAGE_KEY);
        } catch (e) { console.error("Migration failed", e); }
      }

      setOrders(dbOrders);
      setTaskTemplates(dbTemplates || DEFAULT_TEMPLATES);
      setProductTypes(dbProductTypes || []);
      setActivityLogs(dbLogs);
      setPrintConfig(dbPrintConfig || DEFAULT_PRINT_CONFIG);
    };

    initData();
  }, []);

  const handleUpdateTemplates = async (newTemplates: string[]) => {
    setTaskTemplates(newTemplates);
    await api.saveSettings('task_templates', newTemplates);
  };

  const handleUpdateProductTypes = async (newProductTypes: ProductType[]) => {
    setProductTypes(newProductTypes);
    await api.saveSettings('product_types', newProductTypes);
  };

  const handleUpdatePrintConfig = async (newConfig: PrintConfig) => {
    setPrintConfig(newConfig);
    await api.saveSettings('print_config', newConfig);
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

  const [searchQuery, setSearchQuery] = useState('');

  const activeOrder = orders.find(o => o.id === activeOrderId);

  // Search logic
  const filteredOrders = orders.filter(order => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    // 1. Search by order (phieuXuat)
    const matchOrder = order.meta.phieuXuat.toLowerCase().includes(q);

    // 2. Search by customer (khachHang)
    const matchCustomer = order.meta.khachHang.toLowerCase().includes(q);

    // 3. Search by product name (any item in items)
    const matchProduct = order.items.some(item =>
      item.tenHangHoa.toLowerCase().includes(q)
    );

    return matchOrder || matchCustomer || matchProduct;
  });

  // --- UI Components ---

  const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
        ? 'bg-brand-50 text-brand-600 font-semibold'
        : 'text-surface-500 hover:bg-surface-100 hover:text-surface-900'
        }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-brand-600' : 'text-surface-400 group-hover:text-surface-600'}`} />
      <span className="text-sm">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-600" />}
    </button>
  );

  return (
    <div className="flex h-screen bg-surface-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-surface-200 flex flex-col shrink-0">
        <div className="p-6 flex justify-center">
          <img src="/logo-alpha.png" alt="Alpha Logo" className="h-12 w-auto object-contain mx-auto" />
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <div className="text-[10px] font-bold text-surface-400 uppercase tracking-widest px-4 mb-2">Trung tâm</div>
          <SidebarItem
            icon={ClipboardList}
            label="Lệnh sản xuất"
            active={!activeOrderId}
            onClick={() => { setCurrentView('orders'); setActiveOrderId(null); }}
          />

          <div className="pt-6 text-[10px] font-bold text-surface-400 uppercase tracking-widest px-4 mb-2">Hệ thống</div>
          <SidebarItem
            icon={FileText}
            label="Báo cáo"
            onClick={() => setIsReportModalOpen(true)}
          />
          <SidebarItem
            icon={Settings}
            label="Cấu hình"
            onClick={() => setIsConfigModalOpen(true)}
          />
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-surface-50 rounded-2xl p-4 flex items-center gap-3 border border-surface-100">
            <div className="w-10 h-10 rounded-full bg-surface-200 overflow-hidden">
              <img src="https://ui-avatars.com/api/?name=Admin&background=0c87eb&color=fff" alt="User" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-bold text-surface-900 truncate">Quản trị viên</div>
              <div className="text-[10px] text-surface-500 truncate">admin@lsx.com</div>
            </div>
            <button className="text-surface-400 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-surface-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Tìm đơn hàng, khách hàng hoặc sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-surface-500 hover:text-brand-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] text-white rounded-full flex items-center justify-center font-bold border-2 border-white">3</span>
            </button>
            <div className="h-6 w-px bg-surface-200" />
            <button className="flex items-center gap-2 group">
              <span className="text-sm font-medium text-surface-700 group-hover:text-brand-600 transition-colors">Việt Nam</span>
              <ChevronDown className="w-4 h-4 text-surface-400" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeOrderId && activeOrder ? (
            <OrderDetailView
              data={activeOrder}
              onUpdate={handleUpdateActiveOrder}
              onBack={() => setActiveOrderId(null)}
              onDelete={handleDeleteActiveOrder}
              taskTemplates={taskTemplates}
              onUpdateTemplates={handleUpdateTemplates}
              onLogActivity={addLog}
              printConfig={printConfig}
              productTypes={productTypes}
              onUpdateProductTypes={handleUpdateProductTypes}
            />
          ) : (
            <OrderList
              orders={filteredOrders}
              onSelectOrder={handleSelectOrder}
              onImportOrder={handleImportOrder}
              isDashboardView={currentView === 'dashboard'}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        templates={taskTemplates}
        defaultTemplates={DEFAULT_TEMPLATES}
        onUpdateTemplates={handleUpdateTemplates}
        printConfig={printConfig}
        onUpdatePrintConfig={handleUpdatePrintConfig}
        productTypes={productTypes}
        onUpdateProductTypes={handleUpdateProductTypes}
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
