
export enum PageView {
  HOME = 'HOME',
  UPLOAD = 'UPLOAD',
  CALCULATOR = 'CALCULATOR',
  DASHBOARD = 'DASHBOARD',
  AI_CHAT = 'AI_CHAT'
}

export type UserRole = 'student' | 'teacher';

export interface User {
  name: string;
  role: UserRole;
}

export interface OrderSpecs {
  size: string;
  color: string;
  paper: string;
  processing: string;
  quantity: number;
}

export interface TimelineEvent {
  status: string;
  time: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface PrintOrder {
  id: string;
  owner: string;
  fileName: string;
  status: 'analyzing' | 'review_needed' | 'ready_to_print' | 'printing' | 'completed';
  uploadDate: string;
  details: string;
  price: number; 
  issues: string[];
  specs?: OrderSpecs;
  timeline?: TimelineEvent[];
  estimatedPickup?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export enum PaperType {
  PLAIN = '一般影印紙 (70g)',
  DOUBLE_A = 'Double A (80g)',
  COATED = '銅版紙 (150g)',
  IVORY = '象牙卡 (220g)'
}

export enum PrintColor {
  BW = '黑白',
  COLOR = '彩色'
}

export enum Size {
  A4 = 'A4',
  A3 = 'A3',
  B4 = 'B4'
}

// Data structure to pass from AI Analysis to Calculator
export interface EstimateData {
  fileName?: string;
  size: Size;
  color: PrintColor;
  paper: PaperType;
  quantity: number;
  hasMatte: boolean;
  source: 'AI_AUTO' | 'MANUAL';
}

// New types for Visual Markings
export type VisualType = 'bleed' | 'safe-zone' | 'resolution' | 'global' | 'none';

export interface Rect {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  w?: number; // percentage width
  h?: number; // percentage height
}

export interface AnalysisIssue {
  type: 'error' | 'warning' | 'success';
  title: string;
  description: string; // The "Plain Language" advice
  visualType: VisualType; // How to draw it on canvas
  visualLabel?: string; // Short label for the marker (e.g. "240 DPI")
  rect?: Rect; // Coordinates for the box/marker
}

export interface AnalysisResult {
  score: number;
  summary: string;
  previewUrl?: string; 
  issues: AnalysisIssue[];
}
