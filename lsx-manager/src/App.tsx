import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { ConfigModal } from './components/ConfigModal';
import { OrderList } from './components/OrderList';
import { OrderDetailView } from './components/OrderDetailView';
import { DailyReportModal } from './components/DailyReportModal';
import { NotificationMenu } from './components/NotificationMenu';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import type { LSXData, ActivityLog, ProductType, User } from './types';
import { LoginScreen } from './components/LoginScreen';
import {
  Settings,
  FileText,
  ClipboardList,
  Bell,
  Search,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { api } from './utils/api';
import { uuid } from './utils/uuid';
import { DEFAULT_PRINT_CONFIG, type PrintConfig } from './utils/printConfig';

const ORDERS_STORAGE_KEY = 'lsx_orders';
const TEMPLATE_KEY = 'lsx_task_templates';
const LOGS_STORAGE_KEY = 'lsx_activity_logs';
const PRODUCT_TYPES_KEY = 'lsx_product_types';

const DEFAULT_TEMPLATES = ["Cắt phôi", "Dập", "Tiện thô", "Tiện tinh", "Phay", "Khoan", "Nhiệt luyện", "Mạ", "Đóng gói"];

// Wrapper for OrderDetailView to handle Routing params
const OrderDetailRouteWrapper = ({
  orders,
  filteredOrders,
  onUpdate,
  onDelete,
  taskTemplates,
  onUpdateTemplates,
  onLogActivity,
  printConfig,
  productTypes,
  onUpdateProductTypes,
  currentUser
}: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const order = orders.find((o: any) => o.id === id);

  if (!order) {
    return <Navigate to="/" replace />;
  }

  // Navigation Logic based on filtered list
  const activeOrderIndex = filteredOrders.findIndex((o: any) => o.id === id);
  const hasPrevious = activeOrderIndex > 0;
  const hasNext = activeOrderIndex > -1 && activeOrderIndex < filteredOrders.length - 1;

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && hasPrevious) {
      navigate('/order/' + filteredOrders[activeOrderIndex - 1].id);
    } else if (direction === 'next' && hasNext) {
      navigate('/order/' + filteredOrders[activeOrderIndex + 1].id);
    }
  };

  return (
    <OrderDetailView
      data={order}
      onUpdate={onUpdate}
      onBack={() => navigate('/')}
      onDelete={() => onDelete(order.id)}
      taskTemplates={taskTemplates}
      onUpdateTemplates={onUpdateTemplates}
      onLogActivity={onLogActivity}
      printConfig={printConfig}
      productTypes={productTypes}
      onUpdateProductTypes={onUpdateProductTypes}
      hasPrevious={hasPrevious}
      hasNext={hasNext}
      onNavigate={handleNavigate}
      currentUser={currentUser}
    />
  );
};

function App() {
  // Session Persistence: Init user from localStorage
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('lsx_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [orders, setOrders] = useState<LSXData[]>([]);

  // NOTE: removed activeOrderId and currentView in favor of Routing

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [taskTemplates, setTaskTemplates] = useState<string[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [printConfig, setPrintConfig] = useState<PrintConfig>(DEFAULT_PRINT_CONFIG);

  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDelete: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    isDelete: true,
  });

  const navigate = useNavigate();
  const location = useLocation();

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

  // Persist User Session
  useEffect(() => {
    if (user) {
      localStorage.setItem('lsx_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('lsx_user');
    }
  }, [user]);

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
      id: uuid(),
      timestamp: new Date().toISOString(),
      orderId,
      orderName,
      action,
      itemId: extraDetails.itemId,
      itemName: extraDetails.itemName,
      taskId: extraDetails.taskId,
      taskName: extraDetails.taskName,
      details: extraDetails.details || {},
      performedBy: user?.name || 'Unknown',
      role: user?.role || 'unknown'
    };
    setActivityLogs(prev => [log, ...prev].slice(0, 10000));
    await api.saveLog(log);
  };

  const handleImportOrder = async (newOrder: LSXData) => {
    if (!newOrder.id) newOrder.id = uuid();

    // Optimistic update
    setOrders(prev => [newOrder, ...prev]);

    try {
      await api.saveOrder(newOrder);
    } catch (error) {
      console.error("Failed to save order:", error);
      alert("Lỗi: Không thể lưu đơn hàng vào hệ thống! Vui lòng kiểm tra kết nối server.\n" + (error instanceof Error ? error.message : String(error)));
      // Revert optimistic update
      setOrders(prev => prev.filter(o => o.id !== newOrder.id));
    }
  };

  const handleSelectOrder = (orderId: string) => {
    navigate(`/order/${orderId}`);
    setIsMobileSidebarOpen(false); // Close sidebar on selection/navigate
  };

  const handleUpdateActiveOrder = async (updatedOrder: LSXData) => {
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));

    try {
      await api.saveOrder(updatedOrder);
    } catch (error) {
      console.error("Failed to save order update:", error);
      alert("Lỗi: Không thể lưu cập nhật! \n" + (error instanceof Error ? error.message : String(error)));
      // Note: Reverting update is harder without keeping previous state ref. 
      // For now, we fetch orders again to sync with server
      const dbOrders = await api.getOrders();
      setOrders(dbOrders);
    }
  };

  // Logic needs ID now, not relying on activeOrderId
  const handleDeleteOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    setConfirmation({
      isOpen: true,
      title: 'Xóa đơn hàng',
      message: 'Bạn có chắc muốn xóa đơn hàng này? Hành động này không thể hoàn tác.',
      isDelete: true,
      onConfirm: async () => {
        if (order?.id) {
          await api.deleteOrder(order.id);
          addLog('order_deleted', order.id, order.meta.phieuXuat, {});
        }
        setOrders(prev => prev.filter(o => o.id !== orderId));
        navigate('/'); // Go back to list after delete
      }
    });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'order' | 'customer' | 'product' | 'product_name' | 'size'>('all');
  const [isSearchMenuOpen, setIsSearchMenuOpen] = useState(false);

  // Search logic
  const filteredOrders = orders.filter(order => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    // 1. Search by order (phieuXuat & donHangSo)
    const matchOrder = () => {
      const matchPhieu = order.meta.phieuXuat.toLowerCase().includes(q);
      const donHangSo = order.meta.donHangSo || '';
      const matchDonHangSoText = donHangSo.toLowerCase().includes(q);
      // Flexible numeric search: "S-088.24" matches "8824"
      const queryDigits = q.replace(/\D/g, '');
      const sourceDigits = donHangSo.replace(/\D/g, '');
      const matchDonHangSoNumeric = queryDigits.length > 0 && sourceDigits.includes(queryDigits);
      return matchPhieu || matchDonHangSoText || matchDonHangSoNumeric;
    };

    // 2. Search by customer (khachHang)
    const matchCustomer = () => order.meta.khachHang.toLowerCase().includes(q);

    // 3. Search by product code (any item in items matching marking or other ID fields if exist)
    // NOTE: 'marking' field in LSXItem seems to be the closest to a product code or identifier on the physical item
    const matchProductCode = () => order.items.some(item =>
      (item.marking && item.marking.toLowerCase().includes(q))
    );

    // 4. Search by product name
    const matchProductName = () => order.items.some(item =>
      item.tenHangHoa.toLowerCase().includes(q)
    );

    // 5. Search by size (quyTe) - Only check quyCach as requested
    const matchSize = () => order.items.some(item =>
      (item.quyCach && item.quyCach.toLowerCase().includes(q))
    );

    switch (searchType) {
      case 'order': return matchOrder();
      case 'customer': return matchCustomer();
      case 'product': return matchProductCode(); // Mapping "Mã sản phẩm" to marking
      case 'product_name': return matchProductName(); // "Tên sản phẩm"
      case 'size': return matchSize();
      case 'all':
      default:
        // Combined search for 'all'
        return matchOrder() || matchCustomer() || matchProductCode() || matchProductName() || matchSize();
    }
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

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  const isOrderDetails = location.pathname.startsWith('/order/');

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-[280px] md:w-64 bg-white border-r border-surface-200 flex flex-col shrink-0
        transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex justify-between items-center">
          <div className="flex justify-center cursor-pointer hover:opacity-80 transition-opacity w-full md:w-auto" onClick={() => navigate('/')}>
            <img src="/logo-alpha.png" alt="Alpha Logo" className="h-10 md:h-12 w-auto object-contain mx-auto" />
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden text-surface-400 hover:text-surface-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-surface-400 uppercase tracking-widest px-4 mb-2">Trung tâm</div>
          <SidebarItem
            icon={ClipboardList}
            label="Lệnh sản xuất"
            active={!isOrderDetails && location.pathname === '/'} // Active if at root
            onClick={() => navigate('/')}
          />

          <div className="pt-6 text-[10px] font-bold text-surface-400 uppercase tracking-widest px-4 mb-2">Hệ thống</div>
          <SidebarItem
            icon={FileText}
            label="Báo cáo"
            onClick={() => setIsReportModalOpen(true)}
          />
          {user?.role === 'admin' && (
            <SidebarItem
              icon={Settings}
              label="Cấu hình"
              onClick={() => setIsConfigModalOpen(true)}
            />
          )}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-surface-50 rounded-2xl p-4 flex items-center gap-3 border border-surface-100">
            <div className="w-10 h-10 rounded-full bg-surface-200 overflow-hidden">
              <img src={`https://ui-avatars.com/api/?name=${user.name}&background=0c87eb&color=fff`} alt="User" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-bold text-surface-900 truncate">{user.name}</div>
              <div className="text-[10px] text-surface-500 truncate">{user.username}@lsx.com</div>
            </div>
            <button
              onClick={() => setUser(null)}
              className="text-surface-400 hover:text-red-500 transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 md:h-20 bg-white border-b border-surface-200 flex items-center justify-between px-4 md:px-8 shrink-0 gap-4">
          <div className="flex items-center gap-2 md:gap-4 flex-1 max-w-2xl">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-surface-500 hover:bg-surface-50 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative w-full flex items-center bg-surface-50 rounded-2xl border border-surface-200 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 transition-all duration-300 shadow-sm hover:shadow-md z-20">

              {/* Custom Dropdown Trigger */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setIsSearchMenuOpen(!isSearchMenuOpen)}
                  onBlur={() => setTimeout(() => setIsSearchMenuOpen(false), 200)}
                  className="h-10 md:h-12 flex items-center gap-2 pl-3 md:pl-4 pr-3 text-sm font-semibold text-surface-700 hover:bg-surface-100/50 rounded-l-2xl transition-colors border-r border-surface-200"
                >
                  <span className="min-w-[90px] text-left">
                    {searchType === 'all' && 'Tất cả'}
                    {searchType === 'order' && 'Đơn hàng'}
                    {searchType === 'customer' && 'Khách hàng'}
                    {searchType === 'product' && 'Mã sản phẩm'}
                    {searchType === 'product_name' && 'Tên sản phẩm'}
                    {searchType === 'size' && 'Kích thước'}
                  </span>
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`text-surface-400 transition-transform duration-200 ${isSearchMenuOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isSearchMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-surface-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                    {[
                      { value: 'all', label: 'Tất cả' },
                      { value: 'order', label: 'Đơn hàng' },
                      { value: 'customer', label: 'Khách hàng' },
                      { value: 'product', label: 'Mã sản phẩm' },
                      { value: 'product_name', label: 'Tên sản phẩm' },
                      { value: 'size', label: 'Kích thước' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSearchType(option.value as any);
                          setIsSearchMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between
                          ${searchType === option.value
                            ? 'bg-brand-50 text-brand-700 font-medium'
                            : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                          }`}
                      >
                        {option.label}
                        {searchType === option.value && (
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative flex-1">
                <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-surface-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type="text"
                  placeholder={
                    searchType === 'all' ? "Tìm kiếm lệnh sản xuất..." :
                      searchType === 'order' ? "Nhập số đơn hàng, phiếu xuất..." :
                        searchType === 'customer' ? "Nhập tên khách hàng..." :
                          searchType === 'product' ? "Nhập mã sản phẩm..." :
                            searchType === 'product_name' ? "Nhập tên sản phẩm..." :
                              "Nhập kích thước (VD: M12x90)..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none py-2 md:py-3 pl-10 md:pl-12 pr-4 text-sm focus:ring-0 placeholder:text-surface-400 text-surface-900 font-medium h-10 md:h-12 rounded-lg md:rounded-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative text-surface-500 hover:text-brand-600 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] text-white rounded-full flex items-center justify-center font-bold border-2 border-white">
                {activityLogs.length > 99 ? '99+' : activityLogs.length}
              </span>
            </button>

            <NotificationMenu
              logs={activityLogs}
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
            />


          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <Routes>
            <Route path="/" element={
              <OrderList
                orders={filteredOrders}
                onSelectOrder={handleSelectOrder}
                onImportOrder={handleImportOrder}
                isDashboardView={false} // Default view
                currentUser={user}
              />
            } />
            <Route path="/order/:id" element={
              <OrderDetailRouteWrapper
                orders={orders}
                filteredOrders={filteredOrders}
                onUpdate={handleUpdateActiveOrder}
                onDelete={handleDeleteOrder}
                taskTemplates={taskTemplates}
                onUpdateTemplates={handleUpdateTemplates}
                onLogActivity={addLog}
                printConfig={printConfig}
                productTypes={productTypes}
                onUpdateProductTypes={handleUpdateProductTypes}
                currentUser={user}
              />
            } />
          </Routes>
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

      <DeleteConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
        isDelete={confirmation.isDelete}
      />
    </div>
  );
}

export default App;
