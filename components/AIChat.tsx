import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Info } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessageToGemini } from '../services/geminiService';

interface AIChatProps {
  mode?: 'full' | 'embedded';
  initialMessage?: string;
  onAnalyzeIntent?: (text: string) => void;
  className?: string;
}

const AIChat: React.FC<AIChatProps> = ({ 
  mode = 'full', 
  initialMessage,
  onAnalyzeIntent,
  className = ''
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: initialMessage || '嗨！我是你的印刷小幫手 Re:Print AI。我可以幫你解答關於紙張選擇、報價估算或檔案規格的問題。例如你可以問我：「霧膜是什麼？」或「印 50 本 A4 彩色要多少錢？」'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    // Trigger intent analysis for highlighting features (if callback provided)
    if (onAnalyzeIntent) {
      onAnalyzeIntent(userMsg.text);
    }

    try {
      const responseText = await sendMessageToGemini(userMsg.text);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
       const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "抱歉，連線發生錯誤。",
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Preset questions from the PDF (Only show in full mode)
  const presetQuestions = [
    "A3 彩色銅版紙 50 張多少錢？",
    "什麼是霧膜？",
    "Canva 做海報解析度夠嗎？",
    "出血是什麼意思？"
  ];

  // Styles based on mode
  const isEmbedded = mode === 'embedded';
  
  const containerClass = isEmbedded 
    ? `h-full flex flex-col bg-[#1a1a1a] ${className}`
    : `bg-gray-50 min-h-[calc(100vh-4rem)] p-4 md:p-8 flex justify-center ${className}`;

  const wrapperClass = isEmbedded
    ? "flex-1 flex flex-col overflow-hidden"
    : "w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[80vh]";

  const headerClass = isEmbedded
    ? "p-4 border-b border-[#333] bg-[#252526]"
    : "bg-blue-600 p-4 flex items-center justify-between";

  const chatAreaClass = isEmbedded
    ? "flex-1 overflow-y-auto p-4 space-y-4 bg-[#1a1a1a]"
    : "flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50";

  const userBubbleClass = "bg-blue-600 text-white rounded-tr-none";
  const botBubbleClass = isEmbedded 
    ? "bg-[#333] text-gray-200 rounded-tl-none border border-[#444]"
    : "bg-white text-gray-800 border border-gray-100 rounded-tl-none";
    
  const inputAreaClass = isEmbedded
    ? "p-4 border-t border-[#333] bg-[#252526]"
    : "bg-white p-4 border-t border-gray-100";

  const inputClass = isEmbedded
    ? "w-full bg-[#121212] border border-[#333] rounded-full pl-4 pr-10 py-2.5 text-sm text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none"
    : "flex-1 px-4 py-3 bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl outline-none transition-all";

  return (
    <div className={containerClass}>
      <div className={wrapperClass}>
        {/* Header */}
        <div className={headerClass}>
          <div className="flex items-center gap-3">
            {!isEmbedded && (
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="text-white" />
              </div>
            )}
            {isEmbedded && <Bot size={18} className="text-blue-400" />}
            
            <div>
              <h2 className={`${isEmbedded ? 'text-white' : 'text-white'} font-bold ${isEmbedded ? 'text-base' : 'text-lg'}`}>
                {isEmbedded ? 'AI 印刷規格顧問' : 'AI 印刷規格顧問'}
              </h2>
              {!isEmbedded && <p className="text-blue-100 text-xs">Based on Gemini 2.5 • RAG Technology</p>}
            </div>
          </div>
          {!isEmbedded && (
            <button title="Info" className="text-blue-200 hover:text-white">
              <Info size={20} />
            </button>
          )}
        </div>

        {/* Chat Area */}
        <div className={chatAreaClass}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isEmbedded && (
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 
                    ${msg.role === 'user' ? 'bg-gray-200' : 'bg-blue-100'}`}>
                    {msg.role === 'user' ? <User size={16} className="text-gray-600" /> : <Bot size={16} className="text-blue-600" />}
                    </div>
                )}
                
                <div className={`p-3 md:p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? userBubbleClass : botBubbleClass}`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
               <div className={`flex gap-3 max-w-[80%]`}>
                 {!isEmbedded && (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                        <Bot size={16} className="text-blue-600" />
                    </div>
                 )}
                 <div className={`${isEmbedded ? 'bg-[#333] border-[#444]' : 'bg-white border-gray-100'} p-3 md:p-4 rounded-2xl rounded-tl-none border shadow-sm flex items-center gap-2`}>
                   <Loader2 className={`animate-spin ${isEmbedded ? 'text-blue-400' : 'text-blue-600'}`} size={16} />
                   <span className={`${isEmbedded ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                     {isEmbedded ? '正在思考解決方案...' : '正在查詢印刷知識庫... (Thinking)'}
                   </span>
                 </div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={inputAreaClass}>
           {/* Suggestions (Only in Full Mode) */}
           {!isEmbedded && messages.length < 3 && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
              {presetQuestions.map((q, i) => (
                <button 
                  key={i}
                  onClick={() => {
                    setInputText(q);
                  }}
                  className="whitespace-nowrap px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
           )}
           
          <div className={`${isEmbedded ? 'relative' : 'flex gap-2'}`}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={isEmbedded ? "例如：出血要怎麼加？" : "輸入問題，例如：印 50 本 A4 需要多久？"}
              className={inputClass}
              disabled={isLoading}
            />
            
            {isEmbedded ? (
                <button 
                    onClick={handleSend}
                    disabled={isLoading || !inputText.trim()}
                    className="absolute right-1 top-1 p-1.5 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors disabled:opacity-30"
                >
                    <Send size={14} />
                </button>
            ) : (
                <button
                    onClick={handleSend}
                    disabled={isLoading || !inputText.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl px-5 flex items-center justify-center transition-colors"
                >
                    <Send size={20} />
                </button>
            )}
          </div>
          {!isEmbedded && (
            <div className="text-center mt-2">
                <p className="text-xs text-gray-400">AI 可能會產生錯誤訊息，重要報價請以「即時估價」頁面為準。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChat;