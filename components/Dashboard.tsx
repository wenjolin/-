
import React, { useState } from 'react';
import { PrintOrder, User, UserRole } from '../types';
import { FileText, Clock, AlertCircle, CheckCircle, RefreshCcw, X, Printer, Lock, UserCircle, ShieldCheck, LayoutGrid, List } from 'lucide-react';

interface DashboardProps {
    orders: PrintOrder[];
    user: User | null;
    onLogin: (role: UserRole) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, user, onLogin }) => {
  const [selectedOrder, setSelectedOrder] = useState<PrintOrder | null>(null);
  const [viewMode, setViewMode] = useState<'my_orders' | 'class_orders'>('my_orders');

  // Login Required View
  if (!user) {
      return (
          <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 bg-gray-50">
              <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-md w-full text-center border border-gray-100">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Lock size={32} className="text-gray-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">請登入查看訂單</h2>
                  <p className="text-gray-500 mb-8">
                      為了保護隱私，只有登入使用者可以查看個人的印刷訂單與進度。
                  </p>
                  
                  <div className="space-y-3">
                      <button 
                        onClick={() => onLogin('student')}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                      >
                          我是學生 (登入)
                      </button>
                      <button 
                        onClick={() => onLogin('teacher')}
                        className="w-full py-3 bg-white text-gray-700 font-bold rounded-xl border-2 border-gray-200 hover:border-gray-400 hover:text-gray-900 transition-all"
                      >
                          我是老師 (登入)
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // Determine which orders to show
  const filteredOrders = orders.filter(order => {
      if (user.role === 'teacher' && viewMode === 'class_orders') {
          return true; // Show all orders for teacher in class view
      }
      return order.owner === user.name; // Show only my orders
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
        case 'analyzing': return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">AI 分析中</span>;
        case 'review_needed': return <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs flex items-center gap-1"><AlertCircle size={12}/> 需修正</span>;
        case 'ready_to_print': return <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs flex items-center gap-1"><CheckCircle size={12}/> 等待印製</span>;
        case 'printing': return <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs flex items-center gap-1"><RefreshCcw size={12} className="animate-spin"/> 印製中</span>;
        case 'completed': return <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs flex items-center gap-1"><CheckCircle size={12}/> 已完成</span>;
        default: return null;
    }
  };

  // Calculate stats based on filtered orders
  const activeOrders = filteredOrders.filter(o => o.status === 'printing' || o.status === 'ready_to_print').length;
  const issueOrders = filteredOrders.filter(o => o.status === 'review_needed').length;
  const totalItems = filteredOrders.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[calc(100vh-4rem)]">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                    {user.role === 'teacher' && viewMode === 'class_orders' ? '全班作業追蹤' : '我的訂單管理'}
                </h1>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-600 flex items-center gap-2">
                    <UserCircle size={14} />
                    {user.name} ({user.role === 'teacher' ? '教師' : '學生'})
                </span>
            </div>
            <p className="text-gray-500 text-sm mt-1">
                {user.role === 'teacher' && viewMode === 'class_orders' 
                    ? '此模式可查看所有學生的印刷作業進度' 
                    : '查看您的歷史印刷記錄與目前進度'}
            </p>
        </div>
        
        {/* Teacher Role Switcher */}
        {user.role === 'teacher' && (
             <div className="bg-white border border-gray-200 p-1 rounded-lg flex shadow-sm">
                 <button 
                    onClick={() => setViewMode('my_orders')}
                    className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors ${
                        viewMode === 'my_orders' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
                    }`}
                 >
                     <FileText size={16} />
                     我的教材
                 </button>
                 <button 
                    onClick={() => setViewMode('class_orders')}
                    className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors ${
                        viewMode === 'class_orders' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
                    }`}
                 >
                     <LayoutGrid size={16} />
                     全班作業
                 </button>
             </div>
        )}
      </div>
      
      <div className="grid gap-6">
         {/* Order Stats */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm">進行中訂單</p>
                    <p className="text-2xl font-bold text-gray-900">{activeOrders}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-full text-blue-600"><Clock /></div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm">待確認事項</p>
                    <p className="text-2xl font-bold text-red-600">{issueOrders}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-full text-red-600"><AlertCircle /></div>
            </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm">總訂單數</p>
                    <p className="text-2xl font-bold text-green-600">{totalItems}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-full text-green-600"><List /></div>
            </div>
         </div>

         {/* Order List */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 font-medium text-gray-600 grid grid-cols-12 gap-4">
                <div className="col-span-4 md:col-span-3">檔案 / 訂單號</div>
                <div className="hidden md:block md:col-span-2">申請人</div>
                <div className="col-span-4 md:col-span-3">規格</div>
                <div className="hidden md:block md:col-span-1">金額</div>
                <div className="col-span-2 md:col-span-2">狀態</div>
                <div className="col-span-2 md:col-span-1 text-right">操作</div>
            </div>
            {filteredOrders.length === 0 ? (
                <div className="p-16 text-center text-gray-500 flex flex-col items-center">
                    <div className="bg-gray-100 p-4 rounded-full mb-4">
                        <FileText size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">尚無訂單資料</h3>
                    <p className="text-sm mt-1">您目前沒有相關的印刷訂單。</p>
                </div>
            ) : (
                filteredOrders.map((order) => (
                    <div key={order.id} className="p-4 border-b border-gray-100 hover:bg-blue-50/50 transition-colors grid grid-cols-12 gap-4 items-center group">
                        <div className="col-span-4 md:col-span-3">
                            <div className="font-medium text-gray-900 text-sm md:text-base truncate" title={order.fileName}>{order.fileName}</div>
                            <div className="text-xs text-gray-500">{order.id}</div>
                            <div className="text-xs text-gray-400 md:hidden">{order.uploadDate}</div>
                        </div>
                        <div className="hidden md:block md:col-span-2">
                             <span className="text-sm text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{order.owner}</span>
                        </div>
                        <div className="col-span-4 md:col-span-3 text-sm text-gray-600">
                            {order.details}
                        </div>
                        <div className="hidden md:block md:col-span-1 text-sm font-medium text-gray-900">
                            {order.price ? `$${order.price}` : '-'}
                        </div>
                        <div className="col-span-2 md:col-span-2">
                            {getStatusBadge(order.status)}
                        </div>
                        <div className="col-span-2 md:col-span-1 text-right">
                            <button 
                                onClick={() => setSelectedOrder(order)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                詳情
                            </button>
                        </div>
                        {/* Issues Alert Row */}
                        {order.issues && order.issues.length > 0 && (
                            <div className="col-span-12 bg-red-50 p-3 rounded-lg mt-2 text-sm text-red-700 flex flex-col md:flex-row gap-2 md:items-center">
                                <span className="font-bold flex items-center gap-1"><AlertCircle size={14}/> AI 檢測發現問題：</span>
                                <span className="flex-1">{order.issues.join(', ')}</span>
                                <button className="bg-white border border-red-200 text-red-600 px-3 py-1 rounded text-xs hover:bg-red-100 w-fit">
                                    數位校稿
                                </button>
                            </div>
                        )}
                    </div>
                ))
            )}
         </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in flex flex-col">
                  {/* Modal Header */}
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl sticky top-0">
                      <div>
                          <div className="flex items-center gap-3">
                              <h2 className="text-xl font-bold text-gray-900">訂單詳情</h2>
                              {getStatusBadge(selectedOrder.status)}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">訂單編號：{selectedOrder.id}</p>
                      </div>
                      <button 
                          onClick={() => setSelectedOrder(null)}
                          className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                      >
                          <X size={20} />
                      </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-8">
                      {/* Owner Info (Visible to Teacher) */}
                      {user.role === 'teacher' && selectedOrder.owner !== user.name && (
                           <div className="flex items-center gap-3 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-100">
                               <ShieldCheck size={18} />
                               <span>這是 <strong>{selectedOrder.owner}</strong> 的作業訂單。</span>
                           </div>
                      )}

                      {/* File Info */}
                      <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm text-blue-600">
                              <FileText size={24} />
                          </div>
                          <div>
                              <h3 className="font-bold text-gray-900">{selectedOrder.fileName}</h3>
                              <p className="text-sm text-gray-500">上傳日期：{selectedOrder.uploadDate}</p>
                          </div>
                      </div>

                      {/* Specs Grid */}
                      <div>
                          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                              <Printer size={18} className="text-gray-400" />
                              印刷規格
                          </h4>
                          {selectedOrder.specs ? (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                      <span className="text-xs text-gray-500 block mb-1">尺寸</span>
                                      <span className="font-medium text-gray-900">{selectedOrder.specs.size}</span>
                                  </div>
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                      <span className="text-xs text-gray-500 block mb-1">色彩</span>
                                      <span className="font-medium text-gray-900">{selectedOrder.specs.color}</span>
                                  </div>
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                      <span className="text-xs text-gray-500 block mb-1">紙張</span>
                                      <span className="font-medium text-gray-900 text-sm">{selectedOrder.specs.paper}</span>
                                  </div>
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                      <span className="text-xs text-gray-500 block mb-1">加工</span>
                                      <span className="font-medium text-gray-900">{selectedOrder.specs.processing}</span>
                                  </div>
                              </div>
                          ) : (
                              <p className="text-gray-500 text-sm">此訂單無詳細規格資料 (舊訂單)。</p>
                          )}
                      </div>

                      {/* Timeline / Progress */}
                      <div>
                          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                              <Clock size={18} className="text-gray-400" />
                              作業進度
                          </h4>
                          <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
                               {selectedOrder.timeline ? (
                                   selectedOrder.timeline.map((event, idx) => (
                                       <div key={idx} className="relative pl-6">
                                           {/* Dot */}
                                           <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ring-2 
                                               ${event.isCompleted ? 'bg-green-500 ring-green-100' : event.isCurrent ? 'bg-blue-500 ring-blue-100 animate-pulse' : 'bg-gray-300 ring-gray-100'}
                                           `}></div>
                                           
                                           <div className="flex justify-between items-start">
                                               <div>
                                                   <p className={`font-bold text-sm ${event.isCurrent ? 'text-blue-600' : 'text-gray-800'}`}>
                                                       {event.status}
                                                   </p>
                                                   {event.status === '可以取件' && !event.isCompleted && (
                                                       <p className="text-xs text-orange-500 mt-1">預計時間</p>
                                                   )}
                                               </div>
                                               <span className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                                                   {event.time}
                                               </span>
                                           </div>
                                       </div>
                                   ))
                               ) : (
                                   <p className="text-gray-500 text-sm pl-6">無進度追蹤資料。</p>
                               )}
                          </div>
                      </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl mt-auto">
                      <div className="flex justify-between items-center">
                          <div>
                              <p className="text-sm text-gray-500">訂單總金額</p>
                              <p className="text-2xl font-bold text-gray-900">${selectedOrder.price}</p>
                          </div>
                          <div className="flex gap-3">
                              <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">
                                  聯絡客服
                              </button>
                              <button 
                                  onClick={() => setSelectedOrder(null)}
                                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm"
                              >
                                  關閉
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
