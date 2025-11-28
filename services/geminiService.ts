
import { GoogleGenAI, Chat } from "@google/genai";
import { AI_SYSTEM_INSTRUCTION } from "../constants";
import { AnalysisResult } from "../types";

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

export const initializeChat = async () => {
  if (!process.env.API_KEY) {
    console.warn("API Key is missing.");
    return null;
  }

  try {
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chat = genAI.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: AI_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });
    chatSession = chat;
    return chat;
  } catch (error) {
    console.error("Failed to initialize Gemini:", error);
    return null;
  }
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!chatSession) {
    // If not initialized (e.g. no key), return a mock response for demo purposes if user tries to chat without key
    if (!process.env.API_KEY) {
       return "請先設定 Google Gemini API Key 才能啟用 AI 諮詢功能。(這是一個示範回應)";
    }
    await initializeChat();
  }

  if (chatSession) {
    try {
        const result = await chatSession.sendMessage({
            message: message
        });
        return result.text || "抱歉，我現在無法回答，請稍後再試。";
    } catch (e) {
        console.error(e);
        return "連線發生錯誤，請檢查您的網路或 API Key。";
    }
  }
  
  return "系統初始化失敗。";
};

// Mock function for analyzing files (Simulating the 'Augmented' part of RAG for files)
export const analyzeFileWithAI = async (fileName: string, localPreviewUrl: string): Promise<AnalysisResult> => {
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Scenario 1: Poster with Specific Visual Issues requested by User
      // "出血不足", "文字太靠邊", "解析度過低", "RGB警告"
      if (fileName.toLowerCase().includes("poster") || fileName.toLowerCase().includes("海報") || fileName.toLowerCase().includes("demo")) {
        resolve({
          score: 65,
          summary: "海報分析完成 (需修正)",
          previewUrl: localPreviewUrl,
          issues: [
            {
              type: 'error',
              title: '出血不足',
              description: '背景圖未延伸至紅色框線處，裁切時可能會留下白邊。請將背景圖片往外拉滿 3mm。',
              visualType: 'bleed',
              visualLabel: '需往外拉 3mm',
              rect: { x: 50, y: 50, w: 90, h: 90 } // Simulating the content area vs full page
            },
            {
              type: 'warning',
              title: '文字太靠邊 (安全區)',
              description: '標題文字距離邊緣過近，可能會被裁切到。請將重要文字往內移動至黃色虛線框內。',
              visualType: 'safe-zone',
              visualLabel: '請往內縮',
              rect: { x: 88, y: 92, w: 20, h: 8 } // Bottom right text area
            },
            {
              type: 'warning',
              title: '圖片解析度偏低',
              description: '此區域圖片僅 72dpi，印刷後會出現馬賽克或模糊。建議更換為 300dpi 以上的素材。',
              visualType: 'resolution',
              visualLabel: '僅 72 DPI (模糊警告)',
              rect: { x: 30, y: 40 } // Specific image location
            },
            {
              type: 'error',
              title: '檔案為 RGB 模式',
              description: '偵測到檔案使用螢幕顯色 (RGB)，印刷會產生明顯色差。請轉為 CMYK 模式。',
              visualType: 'global',
              visualLabel: 'RGB 模式警告',
            }
          ]
        });
      } 
      // Scenario 2: Perfect File
      else if (fileName.toLowerCase().includes("final") || fileName.toLowerCase().includes("ok")) {
         resolve({
          score: 98,
          summary: "完美檔案",
          previewUrl: localPreviewUrl,
          issues: [
            {
              type: 'success',
              title: '解析度 300dpi',
              description: '圖片解析度足夠，印刷效果清晰。',
              visualType: 'none'
            },
            {
              type: 'success',
              title: '含出血設定 (3mm)',
              description: '出血設定正確。',
              visualType: 'none'
            }
          ]
        });
      } 
      // Scenario 3: General File
      else {
         resolve({
          score: 70,
          summary: "一般文件分析完成",
          previewUrl: localPreviewUrl,
          issues: [
            {
              type: 'error',
              title: '出血不足',
              description: '請將背景往外延伸至紅色框線處。',
              visualType: 'bleed',
              visualLabel: '出血不足',
              rect: { x: 50, y: 50, w: 95, h: 95 }
            }
          ]
        });
      }
    }, 2000);
  });
};
