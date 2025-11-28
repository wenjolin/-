
import React from 'react';
import { Menu, X, Printer, MessageCircle, Upload, LayoutDashboard, Home, UserCircle, LogOut } from 'lucide-react';
import { PageView, User, UserRole } from '../types';
import { APP_NAME } from '../constants';

interface NavbarProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  user: User | null;
  onLogin: (role: UserRole) => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, user, onLogin, onLogout }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showLoginMenu, setShowLoginMenu] = React.useState(false);

  const navItems = [
    { id: PageView.HOME, label: '首頁', icon: <Home size={18} /> },
    { id: PageView.UPLOAD, label: 'AI 智能檢檔', icon: <Upload size={18} /> },
    { id: PageView.CALCULATOR, label: '即時估價', icon: <Printer size={18} /> },
    { id: PageView.AI_CHAT, label: '印刷顧問', icon: <MessageCircle size={18} /> },
    { id: PageView.DASHBOARD, label: '我的訂單', icon: <LayoutDashboard size={18} /> },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate(PageView.HOME)}>
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-30 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">JINGDIAN</div>
              <span className="font-bold text-xl text-gray-800 tracking-tight">{APP_NAME}</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 
                  ${currentPage === item.id 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}

            {/* User Profile Section */}
            <div className="ml-4 pl-4 border-l border-gray-200 relative">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex flex-col text-right">
                    <span className="text-sm font-bold text-gray-800">{user.name}</span>
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                      {user.role === 'teacher' ? '教師' : '學生'}
                    </span>
                  </div>
                  <button 
                    onClick={onLogout}
                    title="登出"
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <button 
                    onClick={() => setShowLoginMenu(!showLoginMenu)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors"
                  >
                    <UserCircle size={18} />
                    登入
                  </button>
                  
                  {showLoginMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-scale-in">
                      <button 
                        onClick={() => { onLogin('student'); setShowLoginMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      >
                        學生登入
                      </button>
                      <button 
                        onClick={() => { onLogin('teacher'); setShowLoginMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      >
                        老師登入
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium 
                  ${currentPage === item.id 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            
            {/* Mobile Login */}
            <div className="border-t border-gray-100 pt-2 mt-2">
              {user ? (
                 <div className="px-3 py-3 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gray-800 block">{user.name}</span>
                      <span className="text-xs text-gray-500">{user.role === 'teacher' ? '教師身分' : '學生身分'}</span>
                    </div>
                    <button onClick={onLogout} className="text-red-500 text-sm font-medium">登出</button>
                 </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                  <button onClick={() => { onLogin('student'); setIsOpen(false); }} className="py-2 bg-gray-100 rounded text-center text-sm font-medium">學生登入</button>
                  <button onClick={() => { onLogin('teacher'); setIsOpen(false); }} className="py-2 bg-gray-100 rounded text-center text-sm font-medium">老師登入</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
