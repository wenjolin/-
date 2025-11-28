
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AIChat from './components/AIChat';
import FileUpload from './components/FileUpload';
import Calculator from './components/Calculator';
import Dashboard from './components/Dashboard';
import { PageView, EstimateData, PrintOrder, User, UserRole } from './types';
import { MOCK_ORDERS } from './constants';

function App() {
  const [currentPage, setCurrentPage] = useState<PageView>(PageView.HOME);
  const [estimateData, setEstimateData] = useState<EstimateData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  // Initialize orders with mock data
  const [orders, setOrders] = useState<PrintOrder[]>(MOCK_ORDERS as PrintOrder[]);

  const handleProceedToEstimate = (data: EstimateData) => {
    setEstimateData(data);
    setCurrentPage(PageView.CALCULATOR);
  };

  const handleAddOrder = (newOrder: PrintOrder) => {
    setOrders(prev => [newOrder, ...prev]);
  };

  const handleLogin = (role: UserRole) => {
    setUser({
      name: role === 'teacher' ? '王老師' : '陳同學',
      role: role
    });
  };

  const handleLogout = () => {
    setUser(null);
  };

  const renderPage = () => {
    switch (currentPage) {
      case PageView.HOME:
        return <Hero onNavigate={setCurrentPage} />;
      case PageView.AI_CHAT:
        return <AIChat />;
      case PageView.UPLOAD:
        return (
          <FileUpload 
            onNavigate={setCurrentPage} 
            onProceedToEstimate={handleProceedToEstimate}
            user={user}
            onLogin={handleLogin}
          />
        );
      case PageView.CALCULATOR:
        return (
          <Calculator 
            initialData={estimateData} 
            onAddOrder={handleAddOrder}
            onNavigate={setCurrentPage}
            user={user}
          />
        );
      case PageView.DASHBOARD:
        return (
          <Dashboard 
            orders={orders} 
            user={user}
            onLogin={handleLogin}
          />
        );
      default:
        return <Hero onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Navbar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      <main className="animate-fade-in">
        {renderPage()}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2025 Re:Print AI - 學生印刷 OK 蹦. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
