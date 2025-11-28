
import React, { useState, useEffect } from 'react';
import { PaperType, PrintColor, Size, EstimateData, PrintOrder, PageView, User } from '../types';
import { PAPER_MULTIPLIER, PRICING_RULES } from '../constants';
import { Calculator as CalcIcon, DollarSign, Clock, Sparkles, X, CheckCircle2, FileInput, AlertCircle } from 'lucide-react';

interface CalculatorProps {
    initialData?: EstimateData | null;
    onAddOrder: (order: PrintOrder) => void;
    onNavigate: (page: PageView) => void;
    user: User | null;
}

const Calculator: React.FC<CalculatorProps> = ({ initialData, onAddOrder, onNavigate, user }) => {
  const [size, setSize] = useState<Size>(Size.A4);
  const [color, setColor] = useState<PrintColor>(PrintColor.COLOR);
  const [paper, setPaper] = useState<PaperType>(PaperType.PLAIN);
  const [quantity, setQuantity] = useState<number>(50);
  const [hasMatte, setHasMatte] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  
  // New state for File Name and Modal
  const [fileName, setFileName] = useState("");
  const [showAutoFillMsg, setShowAutoFillMsg] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<PrintOrder | null>(null);

  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load initial data from AI Analysis if available
  useEffect(() => {
    if (initialData) {
        setSize(initialData.size);
        setColor(initialData.color);
        setPaper(initialData.paper);
        setQuantity(initialData.quantity);
        setHasMatte(initialData.hasMatte);
        if (initialData.fileName) {
            setFileName(initialData.fileName);
        }
        setShowAutoFillMsg(true);

        // Auto dismiss message after 5 seconds
        const timer = setTimeout(() => setShowAutoFillMsg(false), 5000);
        return () => clearTimeout(timer);
    }
  }, [initialData]);

  useEffect(() => {
    const basePrice = PRICING_RULES[size][color];
    const paperMulti = PAPER_MULTIPLIER[paper];
    let unitPrice = basePrice * paperMulti;
    
    if (hasMatte) {
        unitPrice += size === Size.A3 ? 4 : 2;
    }

    if (quantity > 100) unitPrice *= 0.9;
    
    setTotalPrice(Math.round(unitPrice * quantity));
  }, [size, color, paper, quantity, hasMatte]);

  const validateForm = () => {
      const newErrors: { [key: string]: string } = {};
      let isValid = true;

      if (!fileName.trim()) {
          newErrors.fileName = "請輸入檔案名稱或專案名稱";
          isValid = false;
      }

      setErrors(newErrors);
      return isValid;
  };

  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFileName(e.target.value);
      // Clear error when user types
      if (errors.fileName) {
          setErrors(prev => ({ ...prev, fileName: '' }));
      }
  };

  const handleCreateOrder = () => {
    if (!validateForm()) {
        // Scroll to top or provide visual feedback
        return;
    }

    const now = new Date();
    const timeString = `${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Calculate estimated pickup time (Simple logic: +3 hours for normal, +1 day for processing)
    const pickupDate = new Date(now.getTime() + (hasMatte ? 24 : 3) * 60 * 60 * 1000);
    const pickupString = `${(pickupDate.getMonth()+1).toString().padStart(2, '0')}-${pickupDate.getDate().toString().padStart(2, '0')} ${pickupDate.getHours().toString().padStart(2, '0')}:${pickupDate.getMinutes().toString().padStart(2, '0')}`;

    const newOrder: PrintOrder = {
        id: `ORD-2025-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        owner: user ? user.name : '訪客',
        fileName: fileName,
        status: 'ready_to_print', 
        uploadDate: now.toISOString().split('T')[0],
        details: `${size} / ${color} / ${paper} ${hasMatte ? '/ 上霧膜' : ''} / ${quantity}份`,
        price: totalPrice,
        issues: [],
        estimatedPickup: pickupString,
        specs: {
            size: size,
            color: color,
            paper: paper,
            processing: hasMatte ? '上霧膜' : '無',
            quantity: quantity
        },
        timeline: [
            { status: '訂單建立', time: timeString, isCompleted: true, isCurrent: false },
            { status: '檔案審核', time: timeString, isCompleted: true, isCurrent: false },
            { status: '排程印製', time: '等待中', isCompleted: false, isCurrent: true },
            { status: '可以取件', time: `預計 ${pickupString}`, isCompleted: false, isCurrent: false },
        ]
    };

    onAddOrder(newOrder);
    setCreatedOrder(newOrder);
    setShowSuccessModal(true);
  };

  return (
    <div className="bg-blue-50 min-h-[calc(100vh-4rem)] p-4 md:p-12 flex justify-center items-start">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        
        {/* Auto-fill notification toast */}
        {showAutoFillMsg && (
            <div className="absolute -top-16 left-0 right-0 z-10 animate-fade-in-down">
                <div className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center justify-between mx-auto max-w-md">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-yellow-300" />
                        <span className="font-medium">AI 已根據您的檔案自動帶入建議規格！</span>
                    </div>
                    <button onClick={() => setShowAutoFillMsg(false)} className="hover:bg-blue-700 p-1 rounded">
                        <X size={16} />
                    </button>
                </div>
            </div>
        )}

        {/* Left: Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                    <CalcIcon />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">即時估價</h2>
                    <p className="text-xs text-gray-500 mt-1">自訂規格或由 AI 推薦</p>
                </div>
            </div>

            {/* Error Banner */}
            {Object.keys(errors).length > 0 && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r flex items-start gap-3">
                    <AlertCircle className="text-red-500 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-bold text-red-700 text-sm">請補全必要資訊</h4>
                        <p className="text-red-600 text-sm mt-1">
                            {errors.fileName && <span>• 檔案名稱為必填項目<br/></span>}
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {/* File Name Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        專案 / 檔案名稱 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={fileName}
                            onChange={handleFileNameChange}
                            placeholder="例如：期末報告.pdf"
                            className={`w-full pl-10 p-3 border rounded-lg outline-none focus:ring-2 transition-all
                                ${errors.fileName 
                                    ? 'bg-red-50 border-red-500 text-red-900 focus:ring-red-500 placeholder-red-300' 
                                    : 'bg-gray-50 border-gray-200 focus:ring-blue-500'}
                            `}
                        />
                        <FileInput className={`absolute left-3 top-3.5 ${errors.fileName ? 'text-red-500' : 'text-gray-400'}`} size={18} />
                    </div>
                    {errors.fileName && (
                        <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.fileName}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">紙張尺寸</label>
                    <div className="grid grid-cols-3 gap-3">
                        {Object.values(Size).map((s) => (
                            <button
                                key={s}
                                onClick={() => setSize(s)}
                                className={`py-2 px-4 rounded-lg border font-medium transition-all ${
                                    size === s 
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' 
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">印刷色彩</label>
                    <div className="grid grid-cols-2 gap-3">
                        {Object.values(PrintColor).map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`py-2 px-4 rounded-lg border font-medium transition-all ${
                                    color === c 
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' 
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">紙張材質</label>
                    <select 
                        value={paper} 
                        onChange={(e) => setPaper(e.target.value as PaperType)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {Object.values(PaperType).map((p) => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">加工選項</label>
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input 
                            type="checkbox" 
                            checked={hasMatte}
                            onChange={(e) => setHasMatte(e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700">上霧膜 (防潑水、質感佳)</span>
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">數量</label>
                    <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
        </div>

        {/* Right: Summary */}
        <div className="space-y-6 sticky top-24">
            <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-xl">
                <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">預估總金額</h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold tracking-tight">${totalPrice}</span>
                    <span className="text-gray-400">TWD</span>
                </div>
                
                <div className="mt-8 space-y-3 border-t border-gray-700 pt-6 text-sm text-gray-300">
                    <div className="flex justify-between items-center">
                        <span>訂單建立人</span>
                        <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded text-xs">{user ? user.name : '訪客'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span>檔案</span>
                        <span className={`font-medium max-w-[150px] truncate ${!fileName ? 'text-red-400 italic' : 'text-white'}`}>
                            {fileName || '未填寫'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>規格</span>
                        <span className="text-white font-medium">{size} / {color}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>紙張</span>
                        <span className="text-white font-medium">{paper}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>加工</span>
                        <span className="text-white font-medium">{hasMatte ? '上霧膜' : '無'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>數量</span>
                        <span className="text-white font-medium">{quantity} 張</span>
                    </div>
                </div>

                <button 
                    onClick={handleCreateOrder}
                    className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50"
                >
                    <DollarSign size={20} />
                    確認規格並下單
                </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex items-start gap-4">
                <div className="bg-green-100 p-2 rounded-full text-green-600 mt-1">
                    <Clock size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-gray-800">預計交期</h4>
                    <p className="text-gray-600 mt-1 text-sm">
                        一般件：約 3 小時後可取件<br/>
                        {hasMatte && <span className="text-orange-600 block mt-1">含加工：需 +1 個工作天</span>}
                    </p>
                </div>
            </div>
        </div>

      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center relative animate-scale-in">
                <button 
                    onClick={() => setShowSuccessModal(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X size={24} />
                </button>
                
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} className="text-green-600" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">訂單建立成功！</h3>
                <p className="text-gray-600 mb-6">
                    您的訂單 <span className="font-mono font-bold text-blue-600">{createdOrder?.id}</span> 已送出。<br/>
                    訂單歸戶：<span className="font-bold">{createdOrder?.owner}</span>
                </p>

                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left text-sm text-gray-600 space-y-2">
                     <div className="flex justify-between">
                        <span>預估金額：</span>
                        <span className="font-bold text-gray-900">${totalPrice}</span>
                     </div>
                     <div className="flex justify-between">
                        <span>取件方式：</span>
                        <span className="font-bold text-gray-900">門市自取</span>
                     </div>
                     <div className="flex justify-between">
                        <span>預計取件：</span>
                        <span className="font-bold text-blue-600">{createdOrder?.estimatedPickup}</span>
                     </div>
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={() => onNavigate(PageView.DASHBOARD)}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                    >
                        前往訂單管理 (Dashboard)
                    </button>
                    <button 
                        onClick={() => setShowSuccessModal(false)}
                        className="w-full py-3 text-gray-500 font-medium hover:text-gray-700"
                    >
                        繼續估價
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Calculator;
