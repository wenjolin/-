
import { PaperType, PrintColor, Size } from './types';

export const APP_NAME = "經典數位印刷";
export const TEAM_NAME = "Re:Print AI";

export const PRICING_RULES = {
  [Size.A4]: {
    [PrintColor.BW]: 1,
    [PrintColor.COLOR]: 5,
  },
  [Size.A3]: {
    [PrintColor.BW]: 2,
    [PrintColor.COLOR]: 10,
  },
  [Size.B4]: {
    [PrintColor.BW]: 1.5,
    [PrintColor.COLOR]: 8,
  }
};

export const PAPER_MULTIPLIER = {
  [PaperType.PLAIN]: 1,
  [PaperType.DOUBLE_A]: 1.2,
  [PaperType.COATED]: 2.5,
  [PaperType.IVORY]: 3.5
};

export const MOCK_ORDERS = [
  {
    id: "ORD-2025-001",
    owner: "陳同學",
    fileName: "期末專題報告_final_v3.pdf",
    status: "printing",
    uploadDate: "2025-10-27",
    details: "A4 / 彩色 / Double A / 膠裝",
    price: 350,
    issues: [],
    estimatedPickup: "2025-10-27 16:30",
    specs: {
      size: 'A4',
      color: '彩色',
      paper: 'Double A (80g)',
      processing: '膠裝',
      quantity: 50
    },
    timeline: [
      { status: '訂單建立', time: '10-27 10:30', isCompleted: true, isCurrent: false },
      { status: '檔案審核', time: '10-27 10:35', isCompleted: true, isCurrent: false },
      { status: '印製中', time: '10-27 11:00', isCompleted: false, isCurrent: true },
      { status: '可以取件', time: '預計 16:30', isCompleted: false, isCurrent: false },
    ]
  },
  {
    id: "ORD-2025-002",
    owner: "陳同學",
    fileName: "社團海報.pdf",
    status: "review_needed",
    uploadDate: "2025-10-28",
    details: "A3 / 銅版紙 / 20張",
    price: 400,
    issues: ["解析度不足 (72dpi)", "出血區未設定"],
    estimatedPickup: "待確認",
    specs: {
      size: 'A3',
      color: '彩色',
      paper: '銅版紙 (150g)',
      processing: '無',
      quantity: 20
    },
    timeline: [
      { status: '訂單建立', time: '10-28 09:00', isCompleted: true, isCurrent: false },
      { status: '檔案審核', time: '10-28 09:02', isCompleted: false, isCurrent: true },
      { status: '印製中', time: '-', isCompleted: false, isCurrent: false },
      { status: '可以取件', time: '-', isCompleted: false, isCurrent: false },
    ]
  },
  {
    id: "ORD-2025-003",
    owner: "王老師",
    fileName: "課程講義_Week5.pdf",
    status: "completed",
    uploadDate: "2025-10-20",
    details: "A4 / 黑白 / 一般紙 / 100份",
    price: 100,
    issues: [],
    estimatedPickup: "2025-10-20 12:00",
    specs: {
      size: 'A4',
      color: '黑白',
      paper: '一般影印紙 (70g)',
      processing: '無',
      quantity: 100
    },
    timeline: [
      { status: '訂單建立', time: '10-20 08:00', isCompleted: true, isCurrent: false },
      { status: '檔案審核', time: '10-20 08:05', isCompleted: true, isCurrent: false },
      { status: '印製中', time: '10-20 09:00', isCompleted: true, isCurrent: false },
      { status: '可以取件', time: '10-20 12:00', isCompleted: true, isCurrent: true },
    ]
  }
];

export const AI_SYSTEM_INSTRUCTION = `
You are "Re:Print AI", a specialized printing consultant for the platform "Student Printing Band-Aid" (學生印刷 OK 蹦).
Your goal is to help students with printing tasks, explaining technical terms, and providing estimates.

Key Knowledge Base:
1. Pricing:
   - A4 B/W: $1, Color: $5
   - A3 B/W: $2, Color: $10 (approximate)
   - Coating/Matte finish (霧膜) adds protection and a premium feel, good for waterproofing. adds about $2-5 per sheet.
   - Binding (膠裝) usually takes 1 working day.

2. Common Issues:
   - "Bleed" (出血): Essential for edge-to-edge printing. Needs 3mm extra on all sides.
   - "Resolution" (解析度): For print, always recommend 300dpi. 72dpi is for screens and will look blurry.
   - "CMYK vs RGB": Screens use RGB, Printers use CMYK. Colors might shift.

3. Persona:
   - Friendly, encouraging, but professional.
   - Use Traditional Chinese (繁體中文).
   - If a student asks "How much is...", give an estimate but remind them to use the calculator for exact pricing.
   - If a student asks about "Canva", remind them to export as "PDF Print" (PDF 列印) not "Standard".

Answer concisely.
`;
