import React from 'react';
import { PageView } from '../types';
import { ArrowRight, CheckCircle2, Zap, MessageSquare, Upload, Printer, LayoutDashboard } from 'lucide-react';

interface HeroProps {
  onNavigate: (page: PageView) => void;
}

const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 text-center lg:pt-24 lg:text-left">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
          <div>
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
              <span className="block xl:inline">不再擔心印錯版</span>{' '}
              <span className="block text-blue-600 xl:inline">學生的 AI 印刷管家</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-lg text-gray-500 sm:text-xl md:mt-5 md:max-w-3xl lg:mx-0">
              Re:Print AI 提供即時檔案健檢、24H 智能諮詢與自動估價。解決「出血」、「解析度」與「版本混亂」的痛點，讓交作業更安心。
            </p>
            <div className="mt-10 sm:flex sm:justify-center lg:justify-start gap-4">
              <button
                onClick={() => onNavigate(PageView.UPLOAD)}
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 shadow-lg shadow-blue-200 transition-all hover:-translate-y-1"
              >
                立即上傳檢查
                <ArrowRight className="ml-2 -mr-1 h-5 w-5" />
              </button>
              <button
                onClick={() => onNavigate(PageView.AI_CHAT)}
                className="mt-3 w-full flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-blue-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 md:mt-0"
              >
                諮詢 AI 顧問
              </button>
            </div>
          </div>
          
          {/* Hero Image / Illustration */}
          <div className="mt-12 lg:mt-0 relative">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 max-w-md mx-auto transform rotate-2 hover:rotate-0 transition-transform duration-500">
               <div className="flex items-center gap-3 border-b pb-4 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">AI 智能檢檔報告</h3>
                    <p className="text-xs text-gray-500">Just now</p>
                  </div>
               </div>
               <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">解析度檢測</span>
                    <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">300dpi (OK)</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">出血區設定</span>
                    <span className="text-orange-500 font-medium bg-orange-50 px-2 py-0.5 rounded">未設定 (警告)</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">尺寸</span>
                    <span className="text-gray-800">A4 (210x297mm)</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded text-sm text-gray-600 mt-2">
                    <p className="font-medium text-blue-600 mb-1">AI 建議：</p>
                    您的檔案缺少出血，若需滿版列印請四周各加 3mm。
                  </div>
               </div>
            </div>
            
            {/* Floating Badges */}
            <div className="absolute -top-4 -right-4 bg-white p-3 rounded-lg shadow-lg flex items-center gap-2 animate-bounce duration-[2000ms]">
               <MessageSquare className="text-blue-500" size={20} />
               <span className="font-bold text-sm text-gray-700">24h 在線</span>
            </div>
             <div className="absolute bottom-10 -left-8 bg-white p-3 rounded-lg shadow-lg flex items-center gap-2">
               <Zap className="text-yellow-500" size={20} />
               <span className="font-bold text-sm text-gray-700">秒速估價</span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                <Upload />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">一鍵自動檢檔</h3>
              <p className="text-gray-500">上傳 PDF，AI 自動分析解析度、色彩模式與出血設定，秒出報告。</p>
           </div>
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-600">
                <Printer />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">透明化估價</h3>
              <p className="text-gray-500">選規格、紙張、加工，價格即時試算。不再怕被印刷店老闆「隨便算」。</p>
           </div>
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4 text-purple-600">
                <LayoutDashboard />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">全流程追蹤</h3>
              <p className="text-gray-500">從交稿、審核到製作完成，Line/Web 同步通知，掌握作業進度。</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;