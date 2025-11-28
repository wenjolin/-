
import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle, ArrowRight, RefreshCw, Sparkles, MousePointer2, Lock, ShieldCheck, UserCheck, ZoomIn, ZoomOut, Save, Undo, Redo, Move, Type, Layers, Maximize, X, Check, Wand2, PenTool, Crop, MessageSquare, History, Settings, Layout, Send, Clock, User as UserIcon, GraduationCap, Crown, Zap, AlertOctagon, ArrowUpRight, ArrowDownLeft, ArrowUp, ArrowDown, ArrowLeft, ArrowRight as ArrowRightIcon, ThumbsUp, ThumbsDown, Eye, EyeOff, MapPin, Bot, Loader2, FolderOpen, PlayCircle, Mail, Printer, AlertCircle } from 'lucide-react';
import { analyzeFileWithAI, sendMessageToGemini } from '../services/geminiService';
import { AnalysisResult, PageView, EstimateData, Size, PrintColor, PaperType, User, UserRole, AnalysisIssue, ChatMessage } from '../types';
import AIChat from './AIChat';

interface FileUploadProps {
    onNavigate?: (page: PageView) => void;
    onProceedToEstimate?: (data: EstimateData) => void;
    user: User | null;
    onLogin: (role: UserRole) => void;
}

// Interfaces for Proofing Platform State
interface Comment {
    id: string;
    userId: string;
    userName: string;
    role: UserRole;
    text: string;
    timestamp: string;
    isSystem?: boolean; 
    x?: number; // X position on canvas (%)
    y?: number; // Y position on canvas (%)
}

interface Version {
    id: string;
    name: string;
    author: string;
    date: string;
    changes: string;
    isActive: boolean;
    status?: 'pending' | 'approved' | 'rejected'; 
}

// New: Project Interface for switching
interface Project {
    id: string;
    name: string;
    status: 'pending' | 'review_needed' | 'approved' | 'rejected';
    thumbnail?: string;
    lastModified: string;
    file: File | null; // Mock file reference
    analysisResult: AnalysisResult | null;
    versions: Version[];
    comments: Comment[];
}

type TabMode = 'editor' | 'comments' | 'history' | 'overview' | 'settings' | 'ai_chat' | 'projects';
type PlanType = 'free' | 'pro' | 'edu';

const FileUpload: React.FC<FileUploadProps> = ({ onNavigate, onProceedToEstimate, user, onLogin }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'result'>('idle');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [hoveredIssue, setHoveredIssue] = useState<number | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // --- Proofing Mode State ---
  const [isProofing, setIsProofing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(85);
  const [fixedIssues, setFixedIssues] = useState<number[]>([]);
  const [activeTool, setActiveTool] = useState<'move' | 'hand' | 'comment' | 'crop'>('move');
  
  // Layer Visibility State
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [viewSettings, setViewSettings] = useState({
      showImage: true,
      showAiMarks: true,
      showComments: true
  });

  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<TabMode>('editor');
  
  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [tempMarker, setTempMarker] = useState<{x: number, y: number} | null>(null); 
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Settings / Plans
  const [currentPlan, setCurrentPlan] = useState<PlanType>('free');

  // Versions
  const [versions, setVersions] = useState<Version[]>([]);

  // Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Force Print Modal State
  const [showForcePrintModal, setShowForcePrintModal] = useState(false);

  // Email Notification State
  const [showEmailToast, setShowEmailToast] = useState(false);

  // --- MOCK DATA FOR PROJECTS ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Init Mock Projects
  useEffect(() => {
      const mockProjectsData: Project[] = [
          {
              id: 'p1',
              name: '社團海報_v1.pdf',
              status: 'review_needed',
              lastModified: '剛剛',
              file: null,
              analysisResult: null, // Will be populated on select
              versions: [
                  { id: 'v1', name: 'Version 1.0', author: '陳同學', date: '10:30', changes: '原始上傳', isActive: true, status: 'pending' }
              ],
              comments: [
                  { id: 'c1', userId: 'teacher1', userName: '王老師', role: 'teacher', text: '出血看起來還是不夠，請再檢查一下。', timestamp: '10:35', x: 85, y: 15 }
              ]
          },
          {
              id: 'p2',
              name: '期末報告封面_被退回.pdf',
              status: 'rejected',
              lastModified: '2小時前',
              file: null,
              analysisResult: null,
              versions: [
                  { id: 'v2', name: 'Version 1.2', author: '陳同學', date: '昨天', changes: '調整標題', isActive: true, status: 'rejected' }
              ],
              comments: [
                   { id: 'c2', userId: 'system', userName: '系統通知', role: 'teacher', text: '❌ 老師已退回此版本。原因：解析度嚴重不足，印出來會糊掉。', timestamp: '09:00', isSystem: true }
              ]
          },
          {
              id: 'p3',
              name: '活動傳單_Final.pdf',
              status: 'approved',
              lastModified: '3小時前',
              file: null,
              analysisResult: null,
              versions: [
                  { id: 'v3', name: 'Version 2.0', author: 'AI 自動修復', date: '昨天', changes: '已修正所有錯誤', isActive: true, status: 'approved' }
              ],
              comments: [
                   { id: 'c3', userId: 'system', userName: '系統通知', role: 'teacher', text: '✅ 老師已確認並通過此版本 (Version 2.0)。', timestamp: '08:30', isSystem: true }
              ]
          }
      ];
      setProjects(mockProjectsData);
  }, []);

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (analysisResult?.previewUrl) {
        URL.revokeObjectURL(analysisResult.previewUrl);
      }
    };
  }, [analysisResult?.previewUrl]);

  useEffect(() => {
      if (activeTab === 'comments') {
          commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  }, [comments, activeTab]);

  // --- Logic to Switch Project ---
  const handleSwitchProject = async (projectId: string) => {
      const targetProject = projects.find(p => p.id === projectId);
      if (!targetProject) return;

      setCurrentProjectId(projectId);
      
      // Mock loading generic analysis result for the switched project if empty
      // In a real app, this would fetch from DB
      let result = targetProject.analysisResult;
      if (!result) {
          // Generate fake result based on status
          const isApproved = targetProject.status === 'approved';
          const isRejected = targetProject.status === 'rejected';
          
          // Mock File
          const mockFile = new File([""], targetProject.name, { type: "application/pdf" });
          setFile(mockFile);
          
          // We use a placeholder image or the current one for demo continuity
          // In real app, fetch specific image
          const resultData: AnalysisResult = {
              score: isApproved ? 98 : isRejected ? 45 : 70,
              summary: targetProject.name,
              // Reuse existing preview or placeholder
              previewUrl: analysisResult?.previewUrl || '', 
              issues: isApproved ? [] : [
                  {
                      type: 'error',
                      title: isRejected ? '嚴重解析度不足' : '出血設定錯誤',
                      description: '請依照指示修正。',
                      visualType: isRejected ? 'resolution' : 'bleed',
                      visualLabel: isRejected ? '72 DPI' : '未設定出血',
                      rect: { x: 50, y: 50, w: 60, h: 60 }
                  }
              ]
          };
          setAnalysisResult(resultData);
      } else {
          setAnalysisResult(result);
      }

      setVersions(targetProject.versions);
      setComments(targetProject.comments);
      // If approved, maybe hide marks by default to show clean preview
      setViewSettings(prev => ({ ...prev, showAiMarks: targetProject.status !== 'approved' }));
  };


  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setStatus('uploading');
    
    const objectUrl = URL.createObjectURL(uploadedFile);

    setTimeout(() => {
        setStatus('analyzing');
        analyzeFileWithAI(uploadedFile.name, objectUrl).then(result => {
             setAnalysisResult(result);
             setStatus('result');
             
             // Initialize Comments/Versions for this new file upload
             setVersions([
                 { id: 'v1', name: 'Version 1.0', author: user?.name || '訪客', date: 'Just now', changes: '原始上傳檔案', isActive: true, status: 'pending' }
             ]);
             setComments([
                 { id: '1', userId: 'teacher1', userName: '王老師', role: 'teacher', text: '請注意這份海報的出血設定，AI 似乎偵測到邊緣有文字。', timestamp: '10:30', x: 85, y: 15 }
             ]);
             
             // Add to projects list as current
             const newProj: Project = {
                 id: `new_${Date.now()}`,
                 name: uploadedFile.name,
                 status: 'review_needed',
                 lastModified: '剛剛',
                 file: uploadedFile,
                 analysisResult: result,
                 versions: [{ id: 'v1', name: 'Version 1.0', author: user?.name || '訪客', date: 'Just now', changes: '原始上傳檔案', isActive: true, status: 'pending' }],
                 comments: [{ id: '1', userId: 'teacher1', userName: '王老師', role: 'teacher', text: '請注意這份海報的出血設定，AI 似乎偵測到邊緣有文字。', timestamp: '10:30', x: 85, y: 15 }]
             };
             setProjects(prev => [newProj, ...prev]);
             setCurrentProjectId(newProj.id);
        });
    }, 1500);
  };

  const reset = () => {
    setFile(null);
    setStatus('idle');
    setAnalysisResult(null);
    setHoveredIssue(null);
    setFixedIssues([]);
    setIsProofing(false);
  };

  const handleNextStep = () => {
    if (!onProceedToEstimate || !analysisResult || !file) return;

    let suggestedSize = Size.A4;
    let suggestedPaper = PaperType.DOUBLE_A;
    let suggestedColor = PrintColor.COLOR;
    let suggestedMatte = false;

    const summaryLower = analysisResult.summary.toLowerCase();
    const fileNameLower = file.name.toLowerCase();

    if (summaryLower.includes('海報') || fileNameLower.includes('poster') || summaryLower.includes('a3')) {
        suggestedSize = Size.A3;
        suggestedPaper = PaperType.COATED;
    } else if (summaryLower.includes('b4')) {
        suggestedSize = Size.B4;
    }

    if (summaryLower.includes('一般') || summaryLower.includes('文件')) {
        suggestedPaper = PaperType.PLAIN;
    }

    const estimateData: EstimateData = {
        fileName: file.name,
        size: suggestedSize,
        color: suggestedColor,
        paper: suggestedPaper,
        quantity: 1,
        hasMatte: suggestedMatte,
        source: 'AI_AUTO'
    };

    onProceedToEstimate(estimateData);
  };
  
  // Force Print Handler (Shows Modal)
  const handleForcePrint = () => {
      setShowForcePrintModal(true);
  };

  const handleConfirmForcePrint = () => {
      setShowForcePrintModal(false);
      handleNextStep();
  };

  const handleEnterProofing = () => {
      if (user) {
          setIsProofing(true);
          // Default to editor tab
          setActiveTab('editor');
      } else {
          setShowLoginModal(true);
      }
  };

  const handleModalLogin = (role: UserRole) => {
      onLogin(role);
      setShowLoginModal(false);
      setIsProofing(true);
  };

  const handleFixIssue = (index: number) => {
      setFixedIssues(prev => [...prev, index]);
      const newVer: Version = {
          id: `v${versions.length + 1}`,
          name: `Version 1.${versions.length}`,
          author: 'AI Assistant',
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          changes: `修復問題 #${index + 1}`,
          isActive: true,
          status: 'pending'
      };
      setVersions(prev => prev.map(v => ({...v, isActive: false})).concat(newVer));
  };

  const handleSaveProofing = () => {
      setIsProofing(false);
      if (analysisResult) {
          setAnalysisResult({
              ...analysisResult,
              score: Math.min(100, analysisResult.score + (fixedIssues.length * 10))
          });
      }
  };

  // Student: Submit to Teacher
  const handleStudentSubmit = () => {
      // 1. Show Email Toast
      setShowEmailToast(true);
      setTimeout(() => setShowEmailToast(false), 4000);

      // 2. Update Project Status
      if (currentProjectId) {
          setProjects(prev => prev.map(p => p.id === currentProjectId ? { ...p, status: 'review_needed' } : p));
      }
      
      // 3. Log System Comment
      const sysMsg: Comment = {
          id: Date.now().toString(),
          userId: 'system',
          userName: '系統通知',
          role: 'student',
          text: `📧 學生已送出審核。通知信已發送至 teacher@demo.edu`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true
      };
      setComments(prev => [...prev, sysMsg]);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (activeTab === 'comments') {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setTempMarker({ x, y });
      }
  };

  const handleSendComment = () => {
      if (!newComment.trim() || !user) return;
      if (!tempMarker) {
          alert("請先點擊圖片選擇留言標籤的位置！");
          return;
      }
      const comment: Comment = {
          id: Date.now().toString(),
          userId: user.role, 
          userName: user.name,
          role: user.role,
          text: newComment,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          x: tempMarker.x,
          y: tempMarker.y
      };
      setComments(prev => [...prev, comment]);
      setNewComment('');
      setTempMarker(null);
  };

  // Chat Intent Analysis Logic
  const handleChatIntent = (text: string) => {
    if (!analysisResult) return;
    
    // Map keywords to visual types found in AnalysisIssue
    const keywords: Record<string, string> = {
        '出血': 'bleed',
        'bleed': 'bleed',
        '邊緣': 'bleed',
        '解析度': 'resolution',
        'dpi': 'resolution',
        '畫質': 'resolution',
        '模糊': 'resolution',
        '安全區': 'safe-zone',
        '文字': 'safe-zone',
        '靠邊': 'safe-zone',
        'rgb': 'global',
        '色彩': 'global',
        '顏色': 'global'
    };

    const lowerText = text.toLowerCase();
    
    // Search for match
    for (const [key, type] of Object.entries(keywords)) {
        if (lowerText.includes(key.toLowerCase())) {
            // Find the first relevant issue in the current analysis result
            const issueIdx = analysisResult.issues.findIndex((issue, idx) => 
                issue.visualType === type && !fixedIssues.includes(idx)
            );

            if (issueIdx !== -1) {
                // Perform Highlighting
                setHoveredIssue(issueIdx);
                setViewSettings(prev => ({ ...prev, showAiMarks: true }));
                
                // If not in editor tab (though chat is a tab), ensure marks are visible. 
                // Note: The canvas is always visible in proofing mode.
                
                // Auto-clear highlight after 4 seconds to create a "flash" effect
                setTimeout(() => {
                    setHoveredIssue(null);
                }, 4000);
                
                return; // Stop after first match
            }
        }
    }
  };

  const handleApproveVersion = () => {
    const activeIdx = versions.findIndex(v => v.isActive);
    if (activeIdx === -1) return;

    const updatedVersions = [...versions];
    updatedVersions[activeIdx].status = 'approved';
    setVersions(updatedVersions);

    const sysMsg: Comment = {
        id: Date.now().toString(),
        userId: 'system',
        userName: '系統通知',
        role: 'teacher',
        text: `✅ 老師已確認並通過此版本 (${updatedVersions[activeIdx].name})。`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
    };
    setComments(prev => [...prev, sysMsg]);
    setActiveTab('comments');
    
    // Update project status in list
    if (currentProjectId) {
        setProjects(prev => prev.map(p => p.id === currentProjectId ? { ...p, status: 'approved' } : p));
    }
  };

  const handleRejectVersion = () => {
      if (!rejectReason.trim()) return;

      const activeIdx = versions.findIndex(v => v.isActive);
      if (activeIdx === -1) return;

      const updatedVersions = [...versions];
      updatedVersions[activeIdx].status = 'rejected';
      setVersions(updatedVersions);

      const sysMsg: Comment = {
        id: Date.now().toString(),
        userId: 'system',
        userName: '系統通知',
        role: 'teacher',
        text: `❌ 老師已退回此版本。原因：${rejectReason}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
    };
    setComments(prev => [...prev, sysMsg]);
    
    setShowRejectModal(false);
    setRejectReason('');
    setActiveTab('comments');
    
    // Update project status in list
    if (currentProjectId) {
        setProjects(prev => prev.map(p => p.id === currentProjectId ? { ...p, status: 'rejected' } : p));
    }
  };

  const renderIssueMarker = (issue: AnalysisIssue, idx: number, isFixed: boolean) => {
      if (isFixed || !issue.rect) return null;

      if (issue.visualType === 'bleed') {
          return (
              <div key={idx} className="absolute inset-0 z-20 pointer-events-none">
                  <div 
                    style={{ 
                        left: `${issue.rect.x}%`, 
                        top: `${issue.rect.y}%`,
                        width: `${issue.rect.w}%`,
                        height: `${issue.rect.h}%`
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 border-[3px] border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] transition-all duration-300
                       ${hoveredIssue === idx ? 'scale-110 shadow-[0_0_40px_rgba(239,68,68,0.9)]' : ''}
                    `}
                  >
                        <div className="absolute top-1/2 -left-12 -translate-y-1/2 flex flex-col items-center animate-bounce-left">
                            <ArrowLeft className="text-red-500 fill-red-500 drop-shadow-md" size={32} strokeWidth={3} />
                            <span className="text-[10px] font-bold text-red-500 bg-black/70 px-1 rounded">往外拉</span>
                        </div>
                        <div className="absolute top-1/2 -right-12 -translate-y-1/2 flex flex-col items-center animate-bounce-right">
                            <ArrowRightIcon className="text-red-500 fill-red-500 drop-shadow-md" size={32} strokeWidth={3} />
                             <span className="text-[10px] font-bold text-red-500 bg-black/70 px-1 rounded">往外拉</span>
                        </div>
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce-up">
                            <ArrowUp className="text-red-500 fill-red-500 drop-shadow-md" size={32} strokeWidth={3} />
                             <span className="text-[10px] font-bold text-red-500 bg-black/70 px-1 rounded">往外拉</span>
                        </div>
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce-down">
                            <ArrowDown className="text-red-500 fill-red-500 drop-shadow-md" size={32} strokeWidth={3} />
                             <span className="text-[10px] font-bold text-red-500 bg-black/70 px-1 rounded">往外拉</span>
                        </div>
                  </div>
                  <div 
                    style={{ top: `${(issue.rect.y - (issue.rect.h||0)/2)}%`, left: '50%' }}
                    className={`absolute -translate-x-1/2 -translate-y-12 bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border-2 border-white z-30 whitespace-nowrap transition-transform duration-300
                        ${hoveredIssue === idx ? 'scale-125' : ''}
                    `}
                  >
                      <AlertOctagon size={16} className="text-yellow-300" />
                      {issue.visualLabel || issue.title}
                  </div>
              </div>
          );
      }

      if (issue.visualType === 'safe-zone') {
          return (
              <div 
                  key={idx}
                  style={{ 
                      left: `${issue.rect.x}%`, 
                      top: `${issue.rect.y}%`,
                      width: `${issue.rect.w}%`,
                      height: `${issue.rect.h}%`
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none transition-all duration-300
                      ${hoveredIssue === idx ? 'scale-110' : ''}
                  `}
              >
                   <div className="w-full h-full border-2 border-yellow-400 border-dashed bg-yellow-400/20 shadow-[0_0_10px_rgba(250,204,21,0.4)]"></div>
                   <div className="absolute -left-8 top-1/2 -translate-y-1/2 animate-pulse flex items-center">
                       <ArrowRightIcon className="text-yellow-400 drop-shadow-md" size={24} strokeWidth={3} />
                       <span className="text-[10px] font-bold text-yellow-400 bg-black/70 px-1 rounded ml-1">內縮</span>
                   </div>
                   <div className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg border-2 border-white whitespace-nowrap z-30 transition-transform duration-300
                       ${hoveredIssue === idx ? 'scale-125' : ''}
                   `}>
                      ⚠️ {issue.visualLabel || '文字請往內移'}
                   </div>
              </div>
          );
      }

      if (issue.visualType === 'resolution') {
          return (
              <div 
                  key={idx}
                  style={{ left: `${issue.rect.x}%`, top: `${issue.rect.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer"
                  onMouseEnter={() => setHoveredIssue(idx)}
                  onMouseLeave={() => setHoveredIssue(null)}
              >
                  <span className={`absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-25 animate-ping
                       ${hoveredIssue === idx ? 'scale-150' : ''}
                  `}></span>
                  <div className={`relative bg-red-600 text-white px-3 py-1.5 rounded-lg shadow-xl border-2 border-white flex items-center gap-2 transform transition-transform
                       ${hoveredIssue === idx ? 'scale-125' : 'hover:scale-110'}
                  `}>
                      <AlertTriangle size={16} className="text-yellow-300" />
                      <span className="font-bold text-xs whitespace-nowrap">{issue.visualLabel || 'DPI 過低'}</span>
                  </div>
              </div>
          );
      }

      return (
          <div 
             key={idx}
             style={{ left: `${issue.rect.x}%`, top: `${issue.rect.y}%` }}
             className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
          >
              <div className={`relative inline-flex items-center justify-center w-8 h-8 rounded-full shadow-lg border-2 border-[#1e1e1e] bg-gray-600 text-white transition-transform
                  ${hoveredIssue === idx ? 'scale-125 bg-blue-500' : ''}
              `}>
                 <span className="font-bold text-sm">{idx + 1}</span>
              </div>
          </div>
      );
  };

  const renderCommentMarker = (comment: Comment) => {
      if (!comment.x || !comment.y || comment.isSystem) return null;
      return (
          <div 
              key={comment.id}
              style={{ left: `${comment.x}%`, top: `${comment.y}%` }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 group cursor-pointer"
              onClick={() => setActiveTab('comments')}
          >
              <div className={`relative w-8 h-8 rounded-full shadow-lg border-2 border-white flex items-center justify-center text-white
                ${comment.role === 'teacher' ? 'bg-blue-600' : 'bg-purple-600'}
              `}>
                   <MessageSquare size={14} />
                   <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></div>
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white text-gray-800 text-xs p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-40">
                  <div className="font-bold mb-1">{comment.userName}:</div>
                  <div className="truncate">{comment.text}</div>
              </div>
          </div>
      );
  };

  const getStatusDisplay = (status: string, role: UserRole | undefined) => {
      if (role === 'teacher') {
          if (status === 'review_needed') return { label: '待審核', color: 'bg-orange-900 text-orange-400 border-orange-700' };
          if (status === 'approved') return { label: '已審核 (通過)', color: 'bg-green-900 text-green-400 border-green-700' };
          if (status === 'rejected') return { label: '已審核 (退回)', color: 'bg-gray-700 text-gray-300 border-gray-600' };
          if (status === 'pending') return { label: '草稿', color: 'text-gray-500' };
      } else {
          // Student View
          if (status === 'review_needed') return { label: '待確認', color: 'bg-orange-900 text-orange-400 border-orange-700' };
          if (status === 'approved') return { label: '已接受', color: 'bg-green-900 text-green-400 border-green-700' };
          if (status === 'rejected') return { label: '被退回', color: 'bg-red-900 text-red-400 border-red-700' };
          if (status === 'pending') return { label: '草稿', color: 'text-gray-500' };
      }
      return { label: status, color: 'text-gray-500' };
  };

  const activeVersion = versions.find(v => v.isActive);
  const isRejected = activeVersion?.status === 'rejected';
  const isApproved = activeVersion?.status === 'approved';

  // --- RENDER: Digital Proofing Platform (Embedded) ---
  if (isProofing && analysisResult) {
      const globalIssues = analysisResult.issues.filter(i => i.visualType === 'global' && !fixedIssues.includes(analysisResult.issues.indexOf(i)));

      return (
          <div className="fixed inset-0 z-50 bg-[#1e1e1e] text-white flex flex-col font-sans animate-fade-in">
              {/* Email Notification Toast */}
              {showEmailToast && (
                  <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-down">
                      <div className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-blue-400/50">
                          <Mail size={20} className="text-white" />
                          <div>
                              <h4 className="font-bold text-sm">通知信已發送</h4>
                              <p className="text-xs text-blue-100">系統已通知老師審核此檔案 (teacher@demo.edu)</p>
                          </div>
                          <Check className="text-blue-200 ml-2" size={16} />
                      </div>
                  </div>
              )}

              {/* Top Toolbar */}
              <div className="h-14 bg-[#252526] border-b border-[#333] flex items-center justify-between px-4 shadow-md z-30">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setIsProofing(false)} className="p-2 hover:bg-[#333] rounded-lg text-gray-400 hover:text-white transition-colors">
                          <X size={20} />
                      </button>
                      <div className="flex flex-col">
                          <span className="font-bold text-sm text-gray-200 flex items-center gap-2">
                              {file?.name}
                              {isApproved && <span className="bg-green-900 text-green-400 text-xs px-1.5 rounded border border-green-700">Approved</span>}
                              {isRejected && <span className="bg-red-900 text-red-400 text-xs px-1.5 rounded border border-red-700">Rejected</span>}
                          </span>
                          <span className="text-xs text-green-400 flex items-center gap-1">
                              <ShieldCheck size={10} /> 數位校稿模式
                          </span>
                      </div>
                  </div>

                  {/* Center Controls */}
                  <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-[#1e1e1e] rounded-lg p-1 border border-[#333]">
                          <button onClick={() => setZoomLevel(z => Math.max(10, z - 10))} className="p-1.5 hover:bg-[#333] rounded text-gray-300"><ZoomOut size={16} /></button>
                          <span className="text-xs font-mono w-12 text-center text-gray-300">{zoomLevel}%</span>
                          <button onClick={() => setZoomLevel(z => Math.min(200, z + 10))} className="p-1.5 hover:bg-[#333] rounded text-gray-300"><ZoomIn size={16} /></button>
                      </div>

                      <div className="relative">
                          <button 
                            onClick={() => setShowLayerMenu(!showLayerMenu)}
                            className={`p-2 rounded-lg border flex items-center gap-2 transition-colors ${showLayerMenu ? 'bg-blue-600/20 text-blue-400 border-blue-500/50' : 'bg-[#1e1e1e] border-[#333] text-gray-300 hover:bg-[#333]'}`}
                            title="顯示/隱藏圖層"
                          >
                             <Layers size={18} />
                             <span className="text-xs font-medium">檢視</span>
                          </button>
                          {showLayerMenu && (
                              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-[#252526] border border-[#444] rounded-xl shadow-xl p-2 z-50 animate-scale-in">
                                  <div className="text-xs text-gray-500 px-2 py-1 mb-1 font-bold">圖層顯示設定</div>
                                  <button 
                                    onClick={() => setViewSettings(p => ({...p, showImage: !p.showImage}))}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#333] transition-colors"
                                  >
                                      <span className="text-sm text-gray-300">原始圖檔</span>
                                      {viewSettings.showImage ? <Eye size={16} className="text-blue-400"/> : <EyeOff size={16} className="text-gray-600"/>}
                                  </button>
                                  <button 
                                    onClick={() => setViewSettings(p => ({...p, showAiMarks: !p.showAiMarks}))}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#333] transition-colors"
                                  >
                                      <span className="text-sm text-gray-300">AI 建議</span>
                                      {viewSettings.showAiMarks ? <Eye size={16} className="text-blue-400"/> : <EyeOff size={16} className="text-gray-600"/>}
                                  </button>
                                  <button 
                                    onClick={() => setViewSettings(p => ({...p, showComments: !p.showComments}))}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#333] transition-colors"
                                  >
                                      <span className="text-sm text-gray-300">留言標籤</span>
                                      {viewSettings.showComments ? <Eye size={16} className="text-blue-400"/> : <EyeOff size={16} className="text-gray-600"/>}
                                  </button>
                              </div>
                          )}
                          {showLayerMenu && <div className="fixed inset-0 z-40" onClick={() => setShowLayerMenu(false)}></div>}
                      </div>
                  </div>

                  <div className="flex items-center gap-3">
                       {/* Force Print Button */}
                       {!isApproved && (
                          <button 
                              onClick={handleForcePrint}
                              className="flex items-center gap-2 px-3 py-1.5 border border-red-900/50 text-red-400 hover:bg-red-900/20 rounded-md text-sm font-bold transition-colors mr-2"
                          >
                              <AlertTriangle size={14} />
                              不修正直接送印
                          </button>
                       )}

                      {/* Teacher Controls */}
                      {user?.role === 'teacher' && (
                          <div className="flex items-center gap-2 mr-4 border-r border-[#333] pr-4">
                              <button 
                                  onClick={() => setShowRejectModal(true)}
                                  disabled={activeVersion?.status === 'rejected'}
                                  className={`flex items-center gap-1 px-3 py-1.5 border rounded-md text-sm font-bold transition-colors
                                    ${activeVersion?.status === 'rejected' 
                                        ? 'bg-red-900 text-white border-red-700 opacity-50 cursor-not-allowed' 
                                        : 'bg-red-900/30 text-red-400 border-red-900/50 hover:bg-red-900/50'}
                                  `}
                              >
                                  <ThumbsDown size={14} />
                                  {activeVersion?.status === 'rejected' ? '已退稿' : '退稿'}
                              </button>
                              <button 
                                  onClick={handleApproveVersion}
                                  disabled={activeVersion?.status === 'approved'}
                                  className={`flex items-center gap-1 px-3 py-1.5 border rounded-md text-sm font-bold transition-colors
                                    ${activeVersion?.status === 'approved' 
                                        ? 'bg-green-900 text-white border-green-700 opacity-50 cursor-not-allowed' 
                                        : 'bg-green-900/30 text-green-400 border-green-900/50 hover:bg-green-900/50'}
                                  `}
                              >
                                  <ThumbsUp size={14} />
                                  {activeVersion?.status === 'approved' ? '已確認' : '確認版本'}
                              </button>
                          </div>
                      )}

                      {/* Student Controls: Submit for Review */}
                      {user?.role === 'student' && !isApproved && (
                          <button 
                              onClick={handleStudentSubmit}
                              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-sm font-medium transition-colors mr-2"
                          >
                              <Mail size={16} />
                              送出審核
                          </button>
                      )}

                      <button 
                          onClick={handleSaveProofing}
                          className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors"
                      >
                          <Save size={16} />
                          儲存並離開
                      </button>
                  </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                  {/* Far Left Main Navigation Rail */}
                  <div className="w-16 bg-[#1e1e1e] border-r border-[#333] flex flex-col items-center py-4 gap-6 z-20">
                      <button 
                          onClick={() => setActiveTab('editor')}
                          className={`p-3 rounded-xl transition-all ${activeTab === 'editor' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
                          title="編輯器"
                      >
                          <PenTool size={24} />
                      </button>
                      
                      {/* Project Switcher Tab */}
                      <button 
                          onClick={() => setActiveTab('projects')}
                          className={`p-3 rounded-xl transition-all ${activeTab === 'projects' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
                          title="專案列表"
                      >
                          <FolderOpen size={24} />
                      </button>

                      <button 
                          onClick={() => setActiveTab('comments')}
                          className={`p-3 rounded-xl transition-all relative ${activeTab === 'comments' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
                          title="溝通留言"
                      >
                          <MessageSquare size={24} />
                          {comments.length > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1e1e1e]"></span>}
                      </button>
                      <button 
                          onClick={() => setActiveTab('ai_chat')}
                          className={`p-3 rounded-xl transition-all ${activeTab === 'ai_chat' ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                          title="AI 顧問"
                      >
                          <Bot size={24} />
                      </button>
                      <button 
                          onClick={() => setActiveTab('history')}
                          className={`p-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
                          title="版本歷程"
                      >
                          <History size={24} />
                      </button>
                      <div className="mt-auto">
                        <button 
                            onClick={() => setActiveTab('settings')}
                            className={`p-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
                            title="設定與方案"
                        >
                            <Settings size={24} />
                        </button>
                      </div>
                  </div>

                  {/* Secondary Left Sidebar (Tools) - Only Visible in Editor Mode */}
                  {activeTab === 'editor' && (
                      <div className="w-14 bg-[#252526] border-r border-[#333] flex flex-col items-center py-4 gap-4 z-20 animate-slide-in-left">
                          {[
                              { id: 'move', icon: <Move size={20} />, label: '移動' },
                              { id: 'crop', icon: <Crop size={20} />, label: '裁切' },
                              { id: 'text', icon: <Type size={20} />, label: '文字' },
                              { id: 'layers', icon: <Layers size={20} />, label: '圖層' },
                          ].map(tool => (
                              <button
                                  key={tool.id}
                                  onClick={() => setActiveTool(tool.id as any)}
                                  className={`p-3 rounded-xl transition-all ${activeTool === tool.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-[#333] hover:text-gray-200'}`}
                                  title={tool.label}
                              >
                                  {tool.icon}
                              </button>
                          ))}
                      </div>
                  )}

                  {/* Center Canvas Area */}
                  <div className="flex-1 bg-[#121212] relative overflow-auto flex items-center justify-center p-8">
                      
                      {/* Approved Overlay */}
                      {isApproved && (
                          <div className="absolute inset-0 z-[45] bg-black/60 backdrop-blur-sm flex items-center justify-center flex-col animate-fade-in">
                              <div className="bg-[#252526] p-8 rounded-2xl shadow-2xl border border-green-500/50 text-center max-w-md w-full animate-scale-in">
                                   <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-400 border border-green-900">
                                       <CheckCircle size={40} />
                                   </div>
                                   <h3 className="text-2xl font-bold text-white mb-2">此檔案已審核通過</h3>
                                   <p className="text-gray-400 mb-8">沒有發現其他問題，您可以直接進行估價與印製。</p>
                                   <button 
                                      onClick={handleNextStep}
                                      className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-lg shadow-lg shadow-green-900/50 flex items-center justify-center gap-2 transition-all hover:scale-105"
                                   >
                                       <Zap size={20} className="text-yellow-300" />
                                       前往即時估價
                                   </button>
                                   <button 
                                      onClick={() => {
                                          // Temporarily modify state to view canvas without overlay? 
                                          // For now, just switch to a version that isn't approved or just unapprove logic (demo only)
                                          // Or better: just a close button that keeps overlay hidden until refresh
                                      }}
                                      className="mt-4 text-sm text-gray-500 hover:text-gray-300 underline"
                                   >
                                       僅預覽檔案 (唯讀)
                                   </button>
                              </div>
                          </div>
                      )}

                      {/* Global Warnings Banner */}
                      {activeTab === 'editor' && viewSettings.showAiMarks && globalIssues.length > 0 && !isApproved && (
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-2xl">
                             <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 rounded-xl shadow-2xl flex items-center gap-4 animate-bounce-in-down border-2 border-orange-400/50">
                                <div className="bg-white/20 p-2 rounded-full animate-pulse">
                                    <AlertTriangle size={24} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-lg">色彩模式警告</h4>
                                    <div className="flex flex-col gap-1 mt-1">
                                        {globalIssues.map((issue, i) => (
                                            <p key={i} className="text-sm opacity-90">{issue.description}</p>
                                        ))}
                                    </div>
                                </div>
                                <button className="px-4 py-2 bg-white text-orange-700 rounded-lg font-bold text-sm hover:bg-orange-50 transition-colors">
                                    一鍵轉 CMYK
                                </button>
                             </div>
                          </div>
                      )}

                      {/* Canvas Wrapper */}
                      <div 
                          className={`relative shadow-2xl transition-transform duration-200 ease-out p-12 bg-[#0a0a0a] ${activeTab === 'comments' ? 'cursor-crosshair' : 'cursor-default'}`}
                          style={{ 
                              transform: `scale(${zoomLevel / 100})`,
                              transformOrigin: 'center center'
                          }}
                          onClick={handleCanvasClick}
                      >
                          <div className="relative">
                            {analysisResult.previewUrl && viewSettings.showImage ? (
                                <img 
                                    src={analysisResult.previewUrl} 
                                    alt="Proofing Canvas" 
                                    className="max-w-[800px] bg-white pointer-events-none block"
                                />
                            ) : (
                                <div className="w-[800px] h-[600px] bg-[#1a1a1a] flex items-center justify-center border-2 border-dashed border-[#333] text-gray-600">
                                   <EyeOff size={48} />
                                   <span className="ml-2">原圖已隱藏</span>
                                </div>
                            )}
                            
                            {/* Visual Markers (AI Issues) - Hide if approved */}
                            {viewSettings.showAiMarks && !isApproved && analysisResult.issues.map((issue, idx) => {
                                const isFixed = fixedIssues.includes(idx);
                                return renderIssueMarker(issue, idx, isFixed);
                            })}

                            {/* Comment Tags */}
                            {viewSettings.showComments && comments.map((comment) => (
                                renderCommentMarker(comment)
                            ))}

                            {/* Temp Marker */}
                            {tempMarker && activeTab === 'comments' && (
                                <div 
                                    style={{ left: `${tempMarker.x}%`, top: `${tempMarker.y}%` }}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-40 animate-bounce"
                                >
                                    <MapPin size={32} className="text-blue-500 fill-blue-500/30 drop-shadow-lg" />
                                </div>
                            )}
                          </div>
                      </div>
                  </div>

                  {/* Dynamic Right Inspection Panel */}
                  <div className="w-96 bg-[#1e1e1e] border-l border-[#333] flex flex-col z-20 shadow-xl">
                      
                      {/* --- Tab: Project Switcher --- */}
                      {activeTab === 'projects' && (
                          <div className="flex flex-col h-full">
                              <div className="p-4 border-b border-[#333]">
                                  <h3 className="font-bold text-gray-100 flex items-center gap-2">
                                      <FolderOpen size={18} className="text-yellow-400" />
                                      我的專案列表
                                  </h3>
                                  <p className="text-xs text-gray-500 mt-1">點擊以切換不同檔案進行校稿</p>
                              </div>
                              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                  {projects.map((p) => {
                                      const isCurrent = currentProjectId === p.id;
                                      // Logic for Status Display Text & Color based on Role
                                      const statusInfo = getStatusDisplay(p.status, user?.role);
                                      
                                      return (
                                          <div 
                                              key={p.id}
                                              onClick={() => handleSwitchProject(p.id)}
                                              className={`p-4 rounded-xl border cursor-pointer transition-all hover:bg-[#252526] flex items-center gap-4
                                                  ${isCurrent ? 'bg-[#252526] border-blue-500 ring-1 ring-blue-500' : 'border-[#333]'}
                                              `}
                                          >
                                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                                                  ${p.status === 'approved' ? 'bg-green-900/20 text-green-400' : 
                                                    p.status === 'rejected' ? 'bg-red-900/20 text-red-400' : 
                                                    'bg-blue-900/20 text-blue-400'}
                                              `}>
                                                  <FileText size={20} />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                  <h4 className={`font-bold text-sm truncate ${isCurrent ? 'text-white' : 'text-gray-300'}`}>
                                                      {p.name}
                                                  </h4>
                                                  <div className="flex items-center gap-2 mt-1">
                                                      <span className={`text-[10px] px-1.5 rounded border ${statusInfo.color}`}>
                                                          {statusInfo.label}
                                                      </span>
                                                      <span className="text-[10px] text-gray-500">{p.lastModified}</span>
                                                  </div>
                                              </div>
                                              {isCurrent && <CheckCircle size={16} className="text-blue-500" />}
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                      )}

                      {/* --- Tab: Editor (AI Suggestions) --- */}
                      {activeTab === 'editor' && (
                          <>
                            <div className="p-4 border-b border-[#333]">
                                <h3 className="font-bold text-gray-100 flex items-center gap-2">
                                    <Sparkles size={18} className="text-purple-400" />
                                    AI 智能修復建議
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">請點擊下方項目查看「白話文」修正指示</p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {analysisResult.issues.map((issue, idx) => {
                                    const isFixed = fixedIssues.includes(idx);
                                    if (issue.type === 'success') return null;

                                    return (
                                        <div 
                                            key={idx} 
                                            className={`bg-[#252526] rounded-xl p-4 border transition-all duration-300 hover:shadow-lg
                                                ${isFixed ? 'border-green-900/50 bg-green-900/10' : 'border-[#333] hover:border-gray-500'}
                                                ${hoveredIssue === idx ? 'ring-1 ring-blue-500' : ''}
                                            `}
                                            onMouseEnter={() => setHoveredIssue(idx)}
                                            onMouseLeave={() => setHoveredIssue(null)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                                        isFixed ? 'bg-green-600' : issue.type === 'error' ? 'bg-red-600' : 'bg-orange-500'
                                                    }`}>
                                                        {idx + 1}
                                                    </div>
                                                    <span className={`font-bold text-base ${isFixed ? 'text-green-400 decoration-slate-500' : 'text-white'}`}>
                                                        {issue.title}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2 mb-4 bg-[#1e1e1e] p-3 rounded-lg border border-[#333]">
                                                <ArrowRight className="text-gray-500 mt-0.5 flex-shrink-0" size={16} />
                                                <p className="text-sm text-gray-300 font-medium leading-relaxed">
                                                    {issue.description}
                                                </p>
                                            </div>

                                            {!isFixed && (
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleFixIssue(idx)}
                                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
                                                    >
                                                        <Wand2 size={16} />
                                                        一鍵修復
                                                    </button>
                                                </div>
                                            )}
                                            
                                            {isFixed && (
                                                <div className="flex items-center gap-2 text-xs text-green-400 font-medium bg-green-900/20 p-2 rounded-lg justify-center">
                                                    <CheckCircle size={14} />
                                                    修復完成
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                          </>
                      )}

                      {/* --- Tab: AI Chat --- */}
                      {activeTab === 'ai_chat' && (
                         <AIChat 
                            mode="embedded"
                            initialMessage="嗨！我是你的印刷規格顧問。正在修圖遇到困難嗎？你可以問我「出血要怎麼加？」或「為什麼解析度不足？」"
                            onAnalyzeIntent={handleChatIntent}
                         />
                      )}

                      {/* --- Tab: Comments --- */}
                      {activeTab === 'comments' && (
                          <div className="flex flex-col h-full">
                              <div className="p-4 border-b border-[#333]">
                                  <h3 className="font-bold text-gray-100 flex items-center gap-2">
                                      <MessageSquare size={18} className="text-blue-400" />
                                      校稿溝通
                                  </h3>
                              </div>
                              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#1a1a1a]">
                                  {comments.map((comment) => {
                                      if (comment.isSystem) {
                                          return (
                                              <div key={comment.id} className="flex justify-center my-2">
                                                  <div className="bg-[#252526] border border-[#444] rounded-lg px-4 py-2 text-xs text-gray-300 flex items-center gap-2 shadow-sm">
                                                      {comment.text.includes('✅') ? <CheckCircle size={14} className="text-green-500"/> : 
                                                       comment.text.includes('📧') ? <Mail size={14} className="text-blue-400"/> :
                                                       <AlertTriangle size={14} className="text-red-500"/>}
                                                      <span>{comment.text.replace('✅ ', '').replace('❌ ', '').replace('📧 ', '')}</span>
                                                      <span className="text-[10px] text-gray-500 ml-2">{comment.timestamp}</span>
                                                  </div>
                                              </div>
                                          )
                                      }
                                      const isMe = user && comment.role === user.role;
                                      return (
                                          <div key={comment.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                              <div className={`max-w-[85%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                                  <div className="flex items-center gap-2 mb-1">
                                                      {!isMe && <div className="w-5 h-5 rounded-full bg-blue-900 text-blue-200 flex items-center justify-center text-xs">{comment.userName[0]}</div>}
                                                      <span className="text-xs text-gray-500">{comment.userName}</span>
                                                      <span className="text-[10px] text-gray-600">{comment.timestamp}</span>
                                                  </div>
                                                  <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
                                                      isMe 
                                                        ? 'bg-blue-600 text-white rounded-tr-none' 
                                                        : 'bg-[#333] text-gray-200 rounded-tl-none border border-[#444]'
                                                  }`}>
                                                      {comment.text}
                                                  </div>
                                              </div>
                                          </div>
                                      );
                                  })}
                                  <div ref={commentsEndRef} />
                              </div>
                              <div className="p-4 border-t border-[#333] bg-[#252526]">
                                  <div className="relative">
                                      <input 
                                          type="text" 
                                          value={newComment}
                                          onChange={(e) => setNewComment(e.target.value)}
                                          onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                                          placeholder={tempMarker ? "輸入訊息..." : "請先點擊圖片定位..."}
                                          disabled={!tempMarker}
                                          className="w-full bg-[#121212] border border-[#333] rounded-full pl-4 pr-10 py-2.5 text-sm text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                      />
                                      <button 
                                          onClick={handleSendComment}
                                          disabled={!tempMarker || !newComment.trim()}
                                          className="absolute right-1 top-1 p-1.5 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors disabled:opacity-30"
                                      >
                                          <Send size={14} />
                                      </button>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* --- Tab: History --- */}
                      {activeTab === 'history' && (
                          <div className="flex flex-col h-full">
                              <div className="p-4 border-b border-[#333]">
                                  <h3 className="font-bold text-gray-100 flex items-center gap-2">
                                      <History size={18} className="text-orange-400" />
                                      版本歷程
                                  </h3>
                              </div>
                              <div className="flex-1 overflow-y-auto p-4">
                                  <div className="relative border-l border-[#333] ml-3 space-y-8 py-2">
                                      {versions.map((ver, idx) => (
                                          <div key={ver.id} className="relative pl-6">
                                              <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-[#1e1e1e] ${ver.isActive ? 'bg-green-500 scale-125' : 'bg-gray-500'}`}></div>
                                              <div className={`bg-[#252526] p-3 rounded-lg border ${ver.isActive ? 'border-green-500/30' : 'border-[#333]'}`}>
                                                  <div className="flex justify-between items-start mb-1">
                                                      <span className={`font-bold text-sm ${ver.isActive ? 'text-green-400' : 'text-gray-200'}`}>{ver.name}</span>
                                                      {ver.status === 'approved' && <span className="flex items-center gap-1 text-[10px] bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded border border-green-900"><CheckCircle size={10}/> Approved</span>}
                                                      {ver.status === 'rejected' && <span className="flex items-center gap-1 text-[10px] bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded border border-red-900"><XCircle size={10}/> Rejected</span>}
                                                  </div>
                                                  <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                                                      <span>{ver.author}</span> • <span>{ver.date}</span>
                                                  </div>
                                                  <p className="text-xs text-gray-400 bg-[#1e1e1e] p-2 rounded border border-[#333]">
                                                      {ver.changes}
                                                  </p>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      )}
                      
                      {/* --- Tab: Settings --- */}
                      {activeTab === 'settings' && (
                          <div className="flex flex-col h-full bg-[#1a1a1a]">
                              <div className="p-4 border-b border-[#333]">
                                  <h3 className="font-bold text-gray-100 flex items-center gap-2">
                                      <Settings size={18} className="text-gray-400" />
                                      設定與方案
                                  </h3>
                              </div>
                              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                  <div 
                                    onClick={() => setCurrentPlan('free')}
                                    className={`relative p-4 rounded-xl border cursor-pointer transition-all ${currentPlan === 'free' ? 'bg-[#252526] border-blue-500 ring-1 ring-blue-500' : 'bg-[#1e1e1e] border-[#333] opacity-60 hover:opacity-100'}`}
                                  >
                                      <div className="flex justify-between items-center mb-2">
                                          <div className="flex items-center gap-2">
                                              <UserIcon size={18} className="text-gray-400" />
                                              <h4 className="font-bold text-white">免費版 (Free)</h4>
                                          </div>
                                          {currentPlan === 'free' && <CheckCircle size={18} className="text-blue-500" />}
                                      </div>
                                      <ul className="text-xs text-gray-400 space-y-1 pl-6 list-disc">
                                          <li>基礎 AI 檢測</li>
                                      </ul>
                                  </div>

                                  <div 
                                    onClick={() => setCurrentPlan('pro')}
                                    className={`relative p-4 rounded-xl border cursor-pointer transition-all ${currentPlan === 'pro' ? 'bg-gradient-to-br from-[#252526] to-blue-900/20 border-blue-400 ring-1 ring-blue-400' : 'bg-[#1e1e1e] border-[#333] opacity-60 hover:opacity-100'}`}
                                  >
                                      <div className="flex justify-between items-center mb-2">
                                          <div className="flex items-center gap-2">
                                              <Crown size={18} className="text-yellow-400" />
                                              <h4 className="font-bold text-white">專業版 (Pro)</h4>
                                          </div>
                                          {currentPlan === 'pro' && <CheckCircle size={18} className="text-blue-400" />}
                                      </div>
                                      <ul className="text-xs text-gray-300 space-y-1 pl-6 list-disc">
                                          <li>無限 AI 修復</li>
                                      </ul>
                                      <div className="mt-3 text-right">
                                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-bold">$150 / 月</span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>
              </div>

              {/* Reject Modal */}
              {showRejectModal && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
                      <div className="bg-[#252526] text-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-[#333] animate-scale-in">
                          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                              <AlertTriangle className="text-red-500" size={20} />
                              確認退回此版本？
                          </h3>
                          <textarea
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="請輸入退稿原因，例如：出血設定仍有問題..."
                              className="w-full h-24 bg-[#1e1e1e] border border-[#444] rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-red-500 mb-4 resize-none"
                              autoFocus
                          />
                          <div className="flex gap-3 justify-end">
                              <button 
                                  onClick={() => setShowRejectModal(false)}
                                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                              >
                                  取消
                              </button>
                              <button 
                                  onClick={handleRejectVersion}
                                  disabled={!rejectReason.trim()}
                                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors"
                              >
                                  確認退回
                              </button>
                          </div>
                      </div>
                  </div>
              )}

              {/* Force Print Warning Modal */}
              {showForcePrintModal && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
                      <div className="bg-[#252526] text-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-[#333] animate-scale-in">
                          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-yellow-500">
                              <AlertTriangle size={24} className="fill-yellow-500/20" />
                              確定要直接送印？
                          </h3>
                          
                          <div className="bg-[#1e1e1e] p-4 rounded-lg border border-yellow-900/30 mb-6">
                              <p className="text-sm text-gray-300 mb-3">
                                  系統偵測到檔案仍有以下問題，若不修正直接送印，成品可能會有瑕疵：
                              </p>
                              <ul className="space-y-2 mb-4">
                                  {analysisResult.issues.filter(i => i.type !== 'success' && !fixedIssues.includes(analysisResult.issues.indexOf(i))).map((issue, idx) => (
                                      <li key={idx} className="flex items-start gap-2 text-xs text-red-300 bg-red-900/10 p-2 rounded">
                                          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                                          <span>{issue.title}</span>
                                      </li>
                                  ))}
                                  {analysisResult.issues.filter(i => i.type !== 'success' && !fixedIssues.includes(analysisResult.issues.indexOf(i))).length === 0 && (
                                      <li className="text-xs text-gray-400 italic">無重大錯誤 (仍建議再次檢查)</li>
                                  )}
                              </ul>
                              <p className="text-xs text-yellow-600 font-bold flex items-center gap-1">
                                  <AlertCircle size={12} />
                                  您需自行承擔印製風險
                              </p>
                          </div>

                          <div className="flex gap-3 justify-end">
                              <button 
                                  onClick={() => setShowForcePrintModal(false)}
                                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                              >
                                  返回修正
                              </button>
                              <button 
                                  onClick={handleConfirmForcePrint}
                                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-red-900/20"
                              >
                                  <Printer size={16} />
                                  忽略警告，前往估價
                              </button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // --- RENDER: Default File Upload & Results View ---
  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] p-4 md:p-12 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">AI 智能檔案健檢</h2>
          <p className="mt-2 text-gray-600">上傳您的設計稿，系統將快速掃描常見印刷錯誤。</p>
        </div>

        {status === 'idle' && (
          <div 
            className={`max-w-4xl mx-auto relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300
              ${dragActive ? 'border-blue-500 bg-blue-50 scale-102' : 'border-gray-300 bg-white hover:border-blue-400'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.png,.ai,.psd"
            />
            <div className="flex flex-col items-center pointer-events-none">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <Upload size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-700">拖放檔案至此或點擊上傳</h3>
              <p className="text-sm text-gray-500 mt-2">支援 PDF, JPG, PNG, AI (Max 50MB)</p>
              <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-sm">
                選擇檔案
              </button>
            </div>
          </div>
        )}

        {(status === 'uploading' || status === 'analyzing') && (
            <div className="max-w-4xl mx-auto bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100 min-h-[400px] flex flex-col justify-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                    <svg className="animate-spin w-full h-full text-blue-200" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75 text-blue-600" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        {status === 'analyzing' ? <Sparkles className="text-yellow-500 animate-pulse" /> : <Upload className="text-blue-500" />}
                    </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {status === 'uploading' ? '檔案上傳中...' : 'AI 正在掃描檔案規格...'}
                </h3>
            </div>
        )}

        {status === 'result' && analysisResult && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
                <div className={`p-6 text-white flex justify-between items-center ${analysisResult.score >= 90 ? 'bg-green-600' : analysisResult.score >= 60 ? 'bg-orange-500' : 'bg-red-600'}`}>
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl tracking-tight">{file?.name}</h3>
                            <p className="text-white/80 text-sm">檢測完成</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-black tracking-tighter">{analysisResult.score}</div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-80">健康度</div>
                    </div>
                </div>

                <div className="p-6 md:p-8 bg-gray-50/50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="flex flex-col gap-4">
                             <div className="relative bg-gray-800 rounded-xl overflow-hidden border border-gray-300 shadow-inner group aspect-[1/1.414]">
                                 {analysisResult.previewUrl ? (
                                    <img 
                                        src={analysisResult.previewUrl} 
                                        alt="Preview" 
                                        className="w-full h-full object-contain transition-opacity" 
                                    />
                                 ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                        <FileText size={64} />
                                    </div>
                                 )}
                                 
                                 {analysisResult.issues.map((issue, idx) => (
                                    issue.rect && (
                                       <div 
                                         key={idx}
                                         style={{ left: `${issue.rect.x}%`, top: `${issue.rect.y}%` }}
                                         className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300
                                           ${hoveredIssue === idx ? 'scale-125 z-20' : 'scale-100 z-10'}
                                         `}
                                         onMouseEnter={() => setHoveredIssue(idx)}
                                         onMouseLeave={() => setHoveredIssue(null)}
                                       >
                                          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                                             issue.type === 'error' ? 'bg-red-400' : issue.type === 'warning' ? 'bg-orange-400' : 'bg-green-400'
                                          }`}></span>
                                          <div className={`relative inline-flex items-center justify-center w-6 h-6 rounded-full shadow border-2 border-white ${
                                             issue.type === 'error' ? 'bg-red-600' : issue.type === 'warning' ? 'bg-orange-500' : 'bg-green-500'
                                          } text-white font-bold text-xs`}>
                                             {idx + 1}
                                          </div>
                                       </div>
                                    )
                                 ))}
                                 
                                 <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none">
                                    <span className="bg-black/60 text-white px-3 py-1 rounded-full text-xs backdrop-blur-md flex items-center justify-center gap-2 mx-auto w-fit">
                                       <MousePointer2 size={12} />
                                       可視化錯誤位置預覽
                                    </span>
                                 </div>
                             </div>
                        </div>

                        <div className="flex flex-col h-full">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                                <AlertTriangle size={20} className="text-gray-500" />
                                檢測項目清單
                            </h4>
                            
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1">
                                {analysisResult.issues.map((issue, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`flex items-center justify-between p-4 border-b border-gray-100 last:border-0 transition-colors
                                            ${hoveredIssue === idx ? 'bg-blue-50' : 'hover:bg-gray-50'}
                                        `}
                                        onMouseEnter={() => setHoveredIssue(idx)}
                                        onMouseLeave={() => setHoveredIssue(null)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                                                 issue.type === 'error' ? 'bg-red-600' : issue.type === 'warning' ? 'bg-orange-500' : 'bg-green-500'
                                            }`}>
                                                {idx + 1}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                 {issue.type === 'error' && <XCircle size={18} className="text-red-500" />}
                                                 {issue.type === 'warning' && <AlertTriangle size={18} className="text-orange-500" />}
                                                 {issue.type === 'success' && <CheckCircle size={18} className="text-green-500" />}
                                                 <span className={`font-medium ${issue.type === 'success' ? 'text-gray-700' : 'text-gray-900'}`}>
                                                     {issue.title}
                                                 </span>
                                            </div>
                                        </div>
                                        
                                        <div className={`text-xs font-bold px-2 py-1 rounded uppercase
                                            ${issue.type === 'error' ? 'bg-red-100 text-red-700' : 
                                              issue.type === 'warning' ? 'bg-orange-100 text-orange-700' : 
                                              'bg-green-100 text-green-700'}
                                        `}>
                                            {issue.type === 'error' ? '錯誤' : issue.type === 'warning' ? '警告' : '通過'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-4 bg-gray-100 p-4 rounded-lg text-sm text-gray-500">
                                <p>註：若檔案有紅字錯誤，建議使用校稿平台進行修正以避免印刷瑕疵。</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-gray-200">
                        <div className="relative group">
                            <button 
                                onClick={handleEnterProofing}
                                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-3 group"
                            >
                                {user ? (
                                    <>
                                        <MousePointer2 size={24} className="group-hover:-translate-y-1 transition-transform" />
                                        <div className="text-left">
                                            <div className="text-lg leading-none">進入數位校稿平台 (編輯與修正)</div>
                                            <div className="text-xs text-blue-100 font-normal mt-1 opacity-90">
                                                身分：{user.role === 'teacher' ? '老師 (已授權)' : '學生 (已登入)'}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Lock size={24} />
                                        <div className="text-left">
                                            <div className="text-lg leading-none">進入數位校稿平台</div>
                                            <div className="text-xs text-blue-100 font-normal mt-1 opacity-90">需登入後使用</div>
                                        </div>
                                    </>
                                )}
                            </button>
                        </div>

                        {isRejected && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-center gap-2 text-red-700 text-sm font-bold animate-pulse">
                                <AlertTriangle size={16} />
                                老師已退回此版本，請進入校稿平台查看原因並修正。
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button 
                                onClick={reset}
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-600 font-medium rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={18} />
                                重新上傳
                            </button>
                            <button 
                                onClick={handleNextStep}
                                disabled={isRejected}
                                className={`flex-1 px-4 py-3 border font-medium rounded-xl flex items-center justify-center gap-2 transition-colors
                                    ${isRejected 
                                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                    }
                                `}
                            >
                                {isRejected ? '需修正才可繼續' : '繼續估價'}
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>

      {showLoginModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-0 overflow-hidden animate-scale-in">
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white text-center">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20">
                          <ShieldCheck size={32} className="text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold">需要身份驗證</h3>
                      <p className="text-gray-300 text-sm mt-1">請登入以繼續訪問外部校稿平台</p>
                  </div>
                  
                  <div className="p-6">
                      <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6 flex gap-3">
                          <AlertTriangle className="text-yellow-600 flex-shrink-0" size={20} />
                          <p className="text-sm text-yellow-800 text-left leading-relaxed">
                              <strong>為何需要登入？</strong><br/>
                              數位校稿平台允許直接修改設計檔案。為了保障您的設計著作權與檔案安全，我們嚴格限制未經授權的訪問。
                          </p>
                      </div>

                      <div className="space-y-3">
                          <button 
                              onClick={() => handleModalLogin('teacher')}
                              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
                          >
                              <UserCheck size={20} />
                              我是老師 (直接進入)
                          </button>
                          <button 
                              onClick={() => handleModalLogin('student')}
                              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 hover:border-blue-500 text-gray-700 hover:text-blue-600 rounded-xl font-bold transition-all"
                          >
                              我是學生 (登入)
                          </button>
                      </div>
                      
                      <button 
                          onClick={() => setShowLoginModal(false)}
                          className="mt-6 text-gray-400 hover:text-gray-600 text-sm font-medium"
                      >
                          取消並返回
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default FileUpload;