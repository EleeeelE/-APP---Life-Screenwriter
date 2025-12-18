
import React, { useState, useEffect, useRef } from 'react';
import { 
  ScreenplayState, 
  FinalReport,
  SavedReview,
  LoreItem
} from './types.ts';
import { 
  ACT_TITLES, 
  DIRECTOR_TIPS 
} from './constants.tsx';
import { generateFinalAudit } from './geminiService.ts';

const DRAFT_KEY = 'life_screenwriter_draft_v1';
const HISTORY_KEY = 'life_screenwriter_history_v1';
const VIEW_KEY = 'life_screenwriter_current_view_v1';
const STEP_KEY = 'life_screenwriter_current_step_v1';
const VIEWING_DATE_KEY = 'life_screenwriter_viewing_date_v1';

const DEFAULT_STATE: ScreenplayState = {
  act1: { high1: '', high2: '', high3: '' },
  act2: { fact: '', notes: '' },
  act3: { gratitude: '' },
  act4: { entries: {} },
  act5: { goal1: '', goal2: '', goal3: '' },
  act6: { items: [] }
};

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'calendar' | 'editor' | 'viewer' | 'archive'>('home');
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<Record<string, SavedReview>>({});
  const [viewingReview, setViewingReview] = useState<SavedReview | null>(null);
  const [archiveTab, setArchiveTab] = useState<'quote' | 'principle'>('quote');

  const [state, setState] = useState<ScreenplayState>(DEFAULT_STATE);

  const todayKey = new Date().toISOString().split('T')[0];
  const hasTodayReview = !!history[todayKey];

  // 初始化加载数据
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    let parsedHistory: Record<string, SavedReview> = {};
    if (savedHistory) {
      try {
        parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }

    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setState(prev => ({
          ...DEFAULT_STATE,
          ...parsedDraft,
        }));
      } catch (e) {
        console.warn("Draft recovery failed, using default state", e);
      }
    }

    // 恢复导航状态
    const savedView = localStorage.getItem(VIEW_KEY) as any;
    const savedStep = localStorage.getItem(STEP_KEY);
    const savedViewingDate = localStorage.getItem(VIEWING_DATE_KEY);

    if (savedView && ['home', 'calendar', 'editor', 'viewer', 'archive'].includes(savedView)) {
      setView(savedView);
      if (savedStep) setCurrentStep(parseInt(savedStep));
      if (savedView === 'viewer' && savedViewingDate && parsedHistory[savedViewingDate]) {
        setViewingReview(parsedHistory[savedViewingDate]);
      } else if (savedView === 'viewer' && !savedViewingDate) {
        setView('calendar');
      }
    }
  }, []);

  // 持久化导航状态
  useEffect(() => {
    localStorage.setItem(VIEW_KEY, view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem(STEP_KEY, currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    if (viewingReview) {
      localStorage.setItem(VIEWING_DATE_KEY, viewingReview.date);
    } else {
      localStorage.removeItem(VIEWING_DATE_KEY);
    }
  }, [viewingReview]);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  }, [state]);

  const handleAutoResize = (e: React.ChangeEvent<HTMLTextAreaElement> | React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  useEffect(() => {
    if (view === 'editor') {
      const textareas = document.querySelectorAll('textarea');
      textareas.forEach(ta => {
        ta.style.height = 'auto';
        ta.style.height = `${ta.scrollHeight}px`;
      });
    }
  }, [view, currentStep, state.act4.entries, state.act6.items]);

  const saveToHistory = (report: FinalReport) => {
    const dateKey = new Date().toISOString().split('T')[0];
    const newReview: SavedReview = {
      date: dateKey,
      state: state,
      report: report,
      timestamp: Date.now()
    };
    const updatedHistory = { ...history, [dateKey]: newReview };
    setHistory(updatedHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    localStorage.removeItem(DRAFT_KEY);
    return newReview;
  };

  const handleSubmit = async () => {
    setIsGenerating(true);
    try {
      const report = await generateFinalAudit(state);
      const newReview = saveToHistory(report);
      setViewingReview(newReview);
      setView('viewer');
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Submission failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const startNewReview = (dateKey?: string) => {
    const targetDate = dateKey || todayKey;
    if (history[targetDate]) {
      setViewingReview(history[targetDate]);
      setView('viewer');
    } else if (targetDate === todayKey) {
      setCurrentStep(0);
      setView('editor');
    }
  };

  const handleRewrite = () => {
    if (viewingReview) {
      setState(viewingReview.state);
      setView('editor');
      setCurrentStep(0);
    }
  };

  const getAllArchiveItems = (type: 'quote' | 'principle') => {
    const items: Array<{text: string, date: string}> = [];
    Object.entries(history).forEach(([date, review]) => {
      if (review.state.act6?.items) {
        review.state.act6.items.forEach(item => {
          if (item.type === type) {
            items.push({ text: item.text, date });
          }
        });
      }
    });
    return items.sort((a, b) => b.date.localeCompare(a.date));
  };

  const renderHome = () => (
    <div className="fixed inset-0 bg-[#8b947e] flex flex-col items-center justify-center z-[100] page-transition overflow-hidden">
      <button 
        onClick={() => setView('calendar')}
        className="typewriter-white relative w-full max-w-[540px] aspect-square flex flex-col items-center justify-center outline-none mt-24"
      >
        <div className="paper-sheet paper-anim absolute top-[-60px] w-72 h-80 z-10 flex flex-col items-center p-10 pt-20 text-[#333] border border-black/5 bg-white">
           <div className="font-industrial text-[34px] font-black leading-none tracking-tighter mb-2 text-black/80 transition-all duration-500 hover:tracking-[0.2em]">LIFE</div>
           <div className="font-industrial text-[34px] font-black leading-none tracking-tighter text-black/80 transition-all duration-500 hover:tracking-[0.2em]">SCREENWRITER</div>
           <div className="h-[2px] w-14 bg-black/10 my-8"></div>
           <div className="font-industrial text-[10px] opacity-25 tracking-[0.5em] font-bold">CHAPTER ONE</div>
           <div className="mt-auto opacity-[0.03] pb-10">
              <i className="fas fa-quote-right text-[120px]"></i>
           </div>
        </div>
        <div className="typewriter-chassis relative mt-40 w-[460px] h-[300px] z-20 flex flex-col items-center shadow-2xl border-white/40 group">
           <div className="chrome-bar absolute -top-8 w-[106%] h-16 rounded-[40px] flex items-center justify-between px-10 z-30 transition-all duration-700 group-hover:brightness-110">
              <div className="w-12 h-12 rounded-full bg-white border border-black/10 flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:rotate-12">
                 <div className="w-6 h-2 bg-black/5 rounded-full"></div>
              </div>
              <div className="w-full h-10 bg-gradient-to-b from-[#ccc] via-[#fff] to-[#aaa] mx-4 rounded-lg border border-black/5 shadow-inner"></div>
              <div className="w-12 h-12 rounded-full bg-white border border-black/10 flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:-rotate-12">
                 <div className="w-6 h-2 bg-black/5 rounded-full"></div>
              </div>
           </div>
           <div className="mt-16 bg-black/[0.03] border border-black/5 px-12 py-3 rounded-full shadow-inner transition-all duration-500 group-hover:bg-black/[0.06]">
              <span className="font-industrial text-[12px] text-black/40 font-black tracking-[0.6em]">ELITE ARCHIVE PRO</span>
           </div>
           <div className="grid grid-cols-7 gap-4 mt-12 px-12">
              {Array(21).fill(0).map((_, i) => (
                <div key={i} className="mechanical-key-ring w-8 h-8 flex items-center justify-center transition-transform duration-300 group-hover:scale-95">
                  <div className="mechanical-key-cap w-7 h-7 rounded-full">{String.fromCharCode(65 + (i % 26))}</div>
                </div>
              ))}
           </div>
           <div className="mechanical-key-ring w-72 h-7 mt-8 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-y-90">
              <div className="mechanical-key-cap w-full h-full rounded-full"></div>
           </div>
        </div>
        <div className="w-[500px] h-14 bg-black/15 blur-[60px] rounded-[100%] mt-12 scale-x-110"></div>
        <div className="absolute bottom-[-100px] font-industrial text-[11px] text-white/50 tracking-[1em] uppercase animate-pulse">Begin the Narrative</div>
      </button>
    </div>
  );

  const renderCalendar = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`empty-${i}`} className="h-12 lg:h-16"></div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasReview = !!history[dateKey];
      const isToday = todayKey === dateKey;
      const isSelectable = hasReview || isToday;
      days.push(
        <button key={d} disabled={!isSelectable} onClick={() => startNewReview(dateKey)}
          className={`h-12 lg:h-16 rounded-lg border flex flex-col items-center justify-center transition-all duration-500 relative overflow-hidden group/day ${
            hasReview 
              ? 'border-[#8b947e] bg-[#8b947e]/5 text-[#333] shadow-sm hover:scale-110 hover:shadow-md hover:bg-[#8b947e]/10' 
              : isToday 
                ? 'border-[#333] bg-white text-[#333] shadow-md ring-1 ring-black/5 hover:scale-110 hover:shadow-xl hover:z-20' 
                : 'border-black/5 bg-white/30 text-gray-300 cursor-default opacity-40'
          }`}
        >
          <span className="font-industrial text-lg lg:text-xl font-black group-hover/day:scale-110 transition-transform">{d}</span>
          {hasReview && <div className="text-[7px] font-industrial mt-0.5 text-[#8b947e] font-bold opacity-60 group-hover/day:opacity-100">REEL</div>}
          {isToday && !hasReview && <div className="text-[7px] font-industrial mt-0.5 text-gray-400 font-bold animate-pulse">LIVE</div>}
        </button>
      );
    }

    return (
      <div className="max-w-6xl mx-auto h-screen flex flex-col lg:overflow-hidden pt-4 pb-8 px-6 page-transition relative">
        <div className="watermark top-10 right-10 text-[120px] pointer-events-none">STUDIO</div>
        
        <header className="flex justify-between items-end mb-6 shrink-0">
          <div className="space-y-1">
            <h1 className="font-industrial text-5xl font-black text-[#333] tracking-tighter leading-none hover:tracking-[-0.05em] transition-all duration-700 cursor-default">STUDIO REEL</h1>
            <div className="text-[10px] font-industrial text-[#8b947e] flex items-center gap-4 font-bold tracking-[0.3em]">
              <span>CATALOGUE</span>
              <div className="w-1 h-1 bg-[#8b947e]/30 rounded-full"></div>
              <span>{currentYear} / {String(currentMonth + 1).padStart(2, '0')}</span>
            </div>
          </div>
          <button onClick={() => setView('home')} className="font-industrial text-[10px] text-gray-400 font-bold tracking-[0.4em] hover:text-[#333] hover:scale-110 transition-all mb-2">EXIT</button>
        </header>

        <div className="flex flex-col lg:flex-row gap-6 flex-1 lg:min-h-0">
          <div className="lg:w-1/3 flex flex-col gap-6 shrink-0">
            <button 
              onClick={() => startNewReview()} 
              className="w-full kuddo-card rounded-[32px] p-8 flex flex-col justify-between group transition-all duration-500 hover:bg-[#333] hover:text-white border-2 border-dashed border-[#8b947e]/20 hover:border-[#333] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] hover:-translate-y-2 h-48 overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 -rotate-12 translate-x-full group-hover:-translate-x-full pointer-events-none"></div>
              <div className="space-y-1 relative z-10">
                <div className="font-industrial text-2xl font-black leading-tight group-hover:tracking-wider transition-all duration-500">NEW SCREENPLAY</div>
                <div className="text-[9px] font-industrial opacity-50 group-hover:opacity-100 tracking-[0.2em] font-bold uppercase">PROD DATE: {todayKey}</div>
              </div>
              <div className="flex justify-end relative z-10">
                <div className="w-12 h-12 bg-[#8b947e]/10 group-hover:bg-white/10 rounded-full flex items-center justify-center transition-all duration-500 group-hover:rotate-90 group-hover:scale-125">
                  <i className="fas fa-plus text-xl"></i>
                </div>
              </div>
            </button>

            <div className="flex-1 flex flex-col gap-6">
              <button 
                onClick={() => setView('archive')}
                className="w-full kuddo-card rounded-[32px] p-6 flex items-center justify-between shadow-sm border-l-4 border-l-[#8b947e] transition-all duration-500 hover:shadow-lg hover:-translate-y-1 group bg-white"
              >
                <div>
                  <div className="font-industrial text-[9px] text-gray-400 font-bold mb-1 tracking-[0.2em] group-hover:text-[#8b947e] transition-colors">CREATIVE ARCHIVE</div>
                  <div className="font-industrial text-xl font-black group-hover:tracking-widest transition-all">创作素材库</div>
                </div>
                <i className="fas fa-bookmark text-2xl text-[#8b947e] opacity-40 group-hover:rotate-12 transition-all"></i>
              </button>

              <div className="kuddo-card rounded-[32px] p-6 flex items-center justify-between shadow-sm border-l-4 border-l-[#333]/10 transition-all duration-500 hover:shadow-lg hover:-translate-y-1 group">
                <div className="flex-1">
                  <div className="font-industrial text-[9px] text-gray-400 font-bold mb-1 tracking-[0.2em]">CURRENT STATUS</div>
                  <div className="font-industrial text-lg font-black text-[#333] truncate pr-4 group-hover:text-[#8b947e] transition-colors">
                    {hasTodayReview ? "COMPLETED" : "RECORDING..."}
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full shadow-sm transition-all duration-1000 ${hasTodayReview ? 'bg-[#8b947e]' : 'bg-red-400 animate-pulse scale-125'}`}></div>
              </div>

              <div className="flex-1 kuddo-card rounded-[32px] p-6 bg-[#333]/5 border-2 border-white/50 flex flex-col justify-center text-center opacity-60 transition-all duration-500 hover:opacity-100 hover:bg-white hover:border-[#8b947e]/20 hover:shadow-md group">
                 <div className="font-industrial text-[8px] tracking-[0.5em] text-[#8b947e] font-bold mb-2 group-hover:scale-110 transition-transform">PROD. NOTE</div>
                 <p className="text-[10px] italic font-serif leading-relaxed text-[#333]/70 px-4 group-hover:text-[#333] transition-colors">"The best script is the one you live with intention."</p>
              </div>
            </div>
          </div>

          <div className="lg:w-2/3 kuddo-card rounded-[40px] p-6 lg:p-8 border-t-8 border-t-[#333] shadow-xl relative flex flex-col lg:min-h-0 transition-all duration-700 hover:shadow-2xl">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="font-industrial text-3xl font-black text-[#333] tracking-tighter hover:tracking-normal transition-all duration-500 cursor-default">
                {currentMonth + 1}月 <span className="text-[#8b947e] mx-1 opacity-40">/</span> {currentYear}
              </h2>
              <div className="flex gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-400/20 hover:bg-red-400 transition-colors cursor-pointer"></div>
                 <div className="w-2 h-2 rounded-full bg-blue-400/20 hover:bg-blue-400 transition-colors cursor-pointer"></div>
                 <div className="w-2 h-2 rounded-full bg-[#8b947e]/20 hover:bg-[#8b947e] transition-colors cursor-pointer"></div>
              </div>
            </div>
            
            <div className="flex-1 lg:min-h-0 overflow-y-auto lg:overflow-visible">
              <div className="grid grid-cols-7 gap-2 lg:gap-3">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(w => (
                  <div key={w} className="text-center text-[9px] font-industrial text-gray-400 font-black pb-2 tracking-widest hover:text-[#333] transition-colors cursor-default">{w}</div>
                ))}
                {days}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderArchive = () => {
    const items = getAllArchiveItems(archiveTab);
    return (
      <div className="max-w-3xl mx-auto h-screen flex flex-col pt-12 pb-24 px-6 page-transition relative">
        <header className="flex justify-between items-center mb-10 shrink-0">
          <div className="space-y-1">
            <button 
              onClick={() => setView('calendar')}
              className="font-industrial text-[10px] text-gray-400 hover:text-[#333] flex items-center gap-2 mb-2 transition-all font-bold tracking-[0.3em] group"
            >
              <i className="fas fa-chevron-left group-hover:-translate-x-1 transition-transform"></i> BACK TO STUDIO
            </button>
            <h1 className="font-industrial text-5xl font-black text-[#333] tracking-tighter">CREATIVE ARCHIVE</h1>
          </div>
        </header>

        <div className="flex gap-8 mb-8 shrink-0">
          <button 
            onClick={() => setArchiveTab('quote')}
            className={`font-industrial text-xs tracking-[0.3em] font-black pb-2 border-b-2 transition-all ${archiveTab === 'quote' ? 'border-[#8b947e] text-[#333]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            GOLDEN QUOTES // 金句
          </button>
          <button 
            onClick={() => setArchiveTab('principle')}
            className={`font-industrial text-xs tracking-[0.3em] font-black pb-2 border-b-2 transition-all ${archiveTab === 'principle' ? 'border-[#8b947e] text-[#333]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            CORE PRINCIPLES // 原则
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
              <i className={`fas ${archiveTab === 'quote' ? 'fa-quote-left' : 'fa-scroll'} text-6xl`}></i>
              <p className="font-industrial tracking-[0.2em] font-bold">EMPTY ARCHIVE</p>
            </div>
          ) : (
            items.map((item, i) => (
              <div key={i} className="kuddo-card rounded-2xl p-6 border-l-4 border-l-[#8b947e]/20 hover:border-l-[#8b947e] transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-industrial text-[8px] text-gray-400 font-bold tracking-[0.3em]">{item.date}</span>
                  <i className={`fas ${archiveTab === 'quote' ? 'fa-quote-right' : 'fa-bookmark'} text-[10px] text-[#8b947e]/30 group-hover:scale-125 transition-transform`}></i>
                </div>
                <p className={`text-lg leading-relaxed text-[#333] ${archiveTab === 'quote' ? 'font-serif italic' : 'font-bold'}`}>
                  {item.text}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderViewer = () => {
    if (!viewingReview) return null;
    const { state: s, report: r, date } = viewingReview;
    
    return (
      <div className="max-w-2xl mx-auto space-y-10 page-transition pb-24 relative pt-12 px-6">
        <header className="flex justify-between items-center py-6 border-b border-[#333]/5">
          <div className="flex items-center gap-6">
            <button onClick={() => setView('calendar')} className="font-industrial text-[10px] flex items-center gap-2 hover:opacity-100 opacity-40 transition-all font-bold group tracking-widest hover:translate-x-[-4px]">
              <i className="fas fa-chevron-left transition-transform group-hover:-translate-x-1"></i> BACK
            </button>
            <button onClick={handleRewrite} className="font-industrial text-[10px] flex items-center gap-2 hover:opacity-100 opacity-40 transition-all font-bold group tracking-widest text-[#8b947e] hover:scale-110">
              <i className="fas fa-edit"></i> REWRITE
            </button>
          </div>
          <div className="text-right">
            <div className="font-industrial text-2xl font-black leading-none text-[#333] tracking-tighter">{date}</div>
          </div>
        </header>

        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#2d3329] to-[#1a1f18] text-white shadow-2xl group border border-[#8b947e]/30 transition-all duration-700 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#8b947e]/5 blur-[60px] rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
          
          <div className="relative p-8 md:p-10 flex flex-col gap-10">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-[#8b947e] rounded-full animate-pulse shadow-[0_0_8px_#8b947e]"></div>
                   <div className="font-industrial text-[10px] font-bold text-[#8b947e] tracking-[0.4em] opacity-80 uppercase">Classification</div>
                </div>
                <div className="font-industrial text-4xl font-black tracking-tighter uppercase drop-shadow-md group-hover:tracking-wider transition-all duration-700 text-white/95">{r.genreTag}</div>
              </div>
              
              <div className="text-right flex flex-col items-end pt-1">
                <div className="font-industrial text-[8px] opacity-30 tracking-[0.4em] mb-1 uppercase font-bold">Prod. Grade</div>
                <div className="flex gap-1.5 text-[#8b947e]">
                   {Array(5).fill(0).map((_, i) => <i key={i} className="fas fa-star text-[9px] group-hover:scale-110 transition-transform" style={{ transitionDelay: `${i * 100}ms` }}></i>)}
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-8 border-t border-white/5 relative">
              <div className="grid grid-cols-3 gap-10 md:gap-14">
                <div className="transition-all duration-500 group-hover:translate-y-[-2px]">
                  <div className="text-[9px] font-industrial font-bold text-[#8b947e]/60 mb-1.5 tracking-[0.2em]">NARRATIVE</div>
                  <div className="font-industrial text-3xl font-black tracking-tighter text-white/90">{r.stats.narrative}</div>
                </div>
                
                <div className="transition-all duration-500 group-hover:translate-y-[-2px]">
                  <div className="text-[9px] font-industrial font-bold text-[#8b947e]/60 mb-1.5 tracking-[0.2em]">CONTROL</div>
                  <div className="font-industrial text-3xl font-black tracking-tighter text-white/90">{r.stats.control}</div>
                </div>
                
                <div className="transition-all duration-500 group-hover:translate-y-[-2px]">
                  <div className="text-[9px] font-industrial font-bold text-[#8b947e]/60 mb-1.5 tracking-[0.2em]">INSIGHT</div>
                  <div className="font-industrial text-3xl font-black tracking-tighter text-white/90">{r.stats.insight}</div>
                </div>
              </div>

              <div className="flex flex-col items-end opacity-20 font-industrial text-[7px] tracking-[0.5em] font-bold pb-1">
                 <div>AUTH: STUDIO EDITION</div>
                 <div className="mt-1">SN: {date.replace(/-/g, '')}-REEL</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-10 relative">
          {/* 金句与原则显示模块 */}
          {s.act6?.items && s.act6.items.length > 0 && (
            <div className="kuddo-card rounded-[28px] p-8 relative shadow-sm hover:border-[#8b947e]/20 transition-all">
              <h3 className="font-industrial text-[#8b947e] text-[9px] font-bold tracking-[0.4em] mb-6 uppercase">ACT 06 // LORE & ARCHIVES</h3>
              <div className="space-y-4">
                {s.act6.items.map((item, i) => (
                  <div key={i} className={`p-4 rounded-xl ${item.type === 'quote' ? 'bg-[#f2f0e9]/40 border-l-2 border-[#8b947e]/40' : 'bg-gray-50/60 border-l-2 border-gray-300'}`}>
                    <div className="font-industrial text-[7px] font-bold mb-1 opacity-40 uppercase">{item.type === 'quote' ? 'GOLDEN QUOTE' : 'CORE PRINCIPLE'}</div>
                    <p className={`text-base leading-relaxed text-[#333] ${item.type === 'quote' ? 'font-serif italic' : 'font-medium'}`}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="kuddo-card rounded-[28px] p-8 relative shadow-sm transition-all duration-500 hover:shadow-md hover:border-[#8b947e]/20 group">
            <h3 className="font-industrial text-[#8b947e] text-[9px] font-bold tracking-[0.4em] mb-6 uppercase opacity-60 group-hover:opacity-100 transition-opacity">ACT 01 // KEY FRAMES</h3>
            <div className="space-y-4">
              {[s.act1.high1, s.act1.high2, s.act1.high3].map((h, i) => h && (
                <div key={i} className="flex gap-4 border-b border-gray-50 pb-4 last:border-0 hover:translate-x-2 transition-transform duration-300">
                  <span className="font-industrial text-[#8b947e] font-black text-sm opacity-20 group-hover:opacity-40 transition-opacity">0{i+1}</span>
                  <span className="text-base font-medium leading-relaxed text-[#333] break-words flex-1">{h}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="kuddo-card rounded-[28px] p-8 relative shadow-sm border-t-2 border-t-red-100 hover:shadow-md hover:-translate-y-1 transition-all duration-500">
              <h3 className="font-industrial text-red-400 text-[9px] font-bold tracking-[0.4em] mb-6 uppercase">ACT 02 // CONFLICT</h3>
              <div className="space-y-4">
                <div className="text-sm leading-relaxed text-[#333] break-words">{s.act2.fact}</div>
                <div className="text-sm italic opacity-70 leading-relaxed font-serif break-words border-l-2 border-red-50 pl-3">{s.act2.notes}</div>
              </div>
            </div>
            <div className="kuddo-card rounded-[28px] p-8 relative shadow-sm border-t-2 border-t-orange-100 hover:shadow-md hover:-translate-y-1 transition-all duration-500">
              <h3 className="font-industrial text-orange-400 text-[9px] font-bold tracking-[0.4em] mb-6 uppercase">ACT 03 // B-ROLL</h3>
              <div className="text-base italic leading-relaxed text-[#333] opacity-80 border-l-2 border-[#8b947e]/20 pl-4 font-serif break-words">"{s.act3.gratitude}"</div>
            </div>
          </div>

          {s.act4.entries && Object.keys(s.act4.entries).length > 0 && (
            <div className="kuddo-card rounded-[28px] p-8 relative shadow-sm hover:border-blue-100 transition-all duration-500">
              <h3 className="font-industrial text-blue-400 text-[9px] font-bold tracking-[0.4em] mb-6 uppercase">ACT 04 // DIRECTOR'S COMMENTARY</h3>
              <div className="space-y-6">
                {Object.entries(s.act4.entries).map(([idx, content]) => (
                  <div key={idx} className="border-l border-blue-50 pl-4 hover:border-blue-400 transition-colors duration-500">
                    <div className="text-[8px] font-industrial text-blue-300 mb-1 font-bold tracking-widest uppercase">{DIRECTOR_TIPS[parseInt(idx)]?.title || "NOTE"}</div>
                    <p className="text-sm leading-relaxed text-gray-700 break-words">{content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="kuddo-card rounded-[36px] p-10 bg-[#333] text-white/90 shadow-2xl relative border border-white/5 transition-all duration-700 hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
            <h2 className="font-industrial text-base font-black mb-8 flex items-center gap-4">
              <span className="w-1 h-4 bg-[#8b947e] animate-pulse"></span>
              DIRECTOR'S CUT
            </h2>
            <div className="text-base font-serif italic leading-relaxed opacity-95 mb-10 tracking-wide break-words hover:opacity-100 transition-opacity">
              {r.directorsCut}
            </div>
            <div className="pt-8 border-t border-white/10">
              <div className="font-industrial text-[9px] font-bold tracking-[0.4em] mb-6 text-[#8b947e] uppercase">SCRIPT NOTES</div>
              <div className="whitespace-pre-wrap opacity-80 text-sm leading-relaxed tracking-wide font-light break-words hover:opacity-100 transition-opacity">{r.scriptNotes}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEditor = () => {
    const handlePrev = () => setCurrentStep(s => Math.max(0, s - 1));
    const handleNextStep = () => setCurrentStep(s => Math.min(6, s + 1));
    const currentAct = ACT_TITLES[currentStep] || { title: "", desc: "" };
    const labelStyle = "font-industrial text-[12px] text-gray-800 font-black tracking-[0.2em] uppercase block mb-1";
    
    const inputAreaStyle = "w-full input-line py-2 text-lg font-bold placeholder:text-gray-400 text-[#333] resize-none min-h-[44px] h-auto overflow-hidden";
    const textareaStyle = "w-full input-line py-3 resize-none placeholder:text-gray-400 text-base leading-relaxed text-[#333] min-h-[112px] h-auto overflow-hidden";

    // 幕跳转横幅
    const renderActNav = () => (
      <div className="flex justify-center items-center gap-1.5 mb-8 p-3 bg-white/50 backdrop-blur-md rounded-2xl shadow-inner border border-black/5 overflow-x-auto">
        {[0, 1, 2, 3, 4, 5, 6].map(i => {
          const isActive = currentStep === i;
          return (
            <button 
              key={i} 
              onClick={() => setCurrentStep(i)}
              className={`min-w-[40px] h-10 flex items-center justify-center rounded-xl font-industrial text-xs font-black transition-all duration-300 ${
                isActive 
                  ? 'bg-[#8b947e] text-white shadow-lg scale-110' 
                  : 'text-gray-400 hover:text-[#333] hover:bg-black/5'
              }`}
            >
              {i === 6 ? <i className="fas fa-clapperboard"></i> : (i + 1)}
            </button>
          );
        })}
      </div>
    );

    if (currentStep === 6) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-[110] page-transition overflow-hidden bg-[#f2f0e9]">
          <div className="absolute inset-0 pointer-events-none opacity-20" 
               style={{ background: 'radial-gradient(circle at center, #8b947e 0%, transparent 70%)' }}></div>
          
          <div className="relative max-w-lg w-full flex flex-col items-center justify-center p-12 text-center space-y-12 pb-24">
            {renderActNav()}
            
            <div className="relative group">
              <div className="absolute inset-0 bg-[#8b947e]/10 blur-[80px] group-hover:bg-[#8b947e]/20 transition-all duration-1000"></div>
              <div className="relative w-48 h-48 flex items-center justify-center">
                <div className="absolute inset-0 border-[3px] border-dashed border-[#8b947e]/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-4 border-[2px] border-solid border-[#333]/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                
                <div className={`w-32 h-32 bg-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 ${isGenerating ? 'scale-90 opacity-80' : 'group-hover:scale-110'}`}>
                  <div className={`relative ${isGenerating ? 'animate-bounce' : ''}`}>
                    <i className={`fas fa-clapperboard text-5xl text-[#333] transition-colors ${isGenerating ? 'text-[#8b947e]' : ''}`}></i>
                    {isGenerating && (
                       <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#8b947e] rounded-full animate-ping"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-industrial text-4xl md:text-5xl font-black text-[#333] tracking-tighter leading-tight whitespace-nowrap group-hover:tracking-tight transition-all duration-700">
                终章：制片人终审报告
              </h2>
              <div className="h-0.5 w-16 bg-[#8b947e]/30 mx-auto rounded-full group-hover:w-32 transition-all duration-700"></div>
              <p className="text-gray-500 font-industrial text-[12px] tracking-[0.4em] font-bold uppercase max-w-[280px] mx-auto leading-loose">
                {isGenerating ? "正在后期剪辑中..." : (
                  <>
                    提交剧本，<br />
                    AI将为你生成导演剪辑版复盘
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-col items-center gap-8 w-full mb-8">
              <button 
                onClick={handleSubmit} 
                disabled={isGenerating} 
                className={`relative overflow-hidden kuddo-btn-primary px-16 py-5 rounded-full text-base shadow-[0_20px_50px_rgba(0,0,0,0.1)] active:scale-95 disabled:opacity-50 tracking-[0.4em] font-black uppercase transition-all duration-500 group ${isGenerating ? 'bg-[#333]' : 'hover:shadow-[0_25px_60px_rgba(139,148,126,0.3)] hover:-translate-y-1'}`}
              >
                <span className="relative z-10 transition-all duration-500 group-hover:tracking-[0.6em]">{isGenerating ? "剪辑中 (ROLLING...)" : "确认发布剧本"}</span>
                {!isGenerating && <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-[30deg]"></div>}
              </button>
              
              <button 
                onClick={handlePrev} 
                disabled={isGenerating} 
                className="group relative flex items-center justify-center gap-3 py-4 px-8 rounded-xl transition-all hover:bg-black/5 active:scale-95"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full border border-black/10 group-hover:border-[#8b947e] transition-colors">
                  <i className="fas fa-chevron-left text-[12px] group-hover:text-[#8b947e] transition-colors group-hover:-translate-x-1 transition-transform"></i>
                </div>
                <span className="font-industrial text-sm font-black text-[#333] opacity-50 group-hover:opacity-100 group-hover:text-[#8b947e] tracking-[0.4em] transition-all uppercase">
                  回到上一幕
                </span>
              </button>
            </div>

            <div className="absolute bottom-8 font-industrial text-[8px] opacity-10 tracking-[0.8em] font-bold pointer-events-none">
              SCREENWRITER STUDIO PREVIEW // V1.0
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-lg mx-auto space-y-8 page-transition py-12 relative mt-12 px-6">
        <header className="flex justify-between items-end border-b-2 border-[#333] pb-4 mb-8">
          <div className="flex-1">
            <div className="font-industrial text-3xl font-black text-[#333] leading-none tracking-tighter hover:tracking-[-0.05em] transition-all duration-700">ACT 0{currentStep + 1}</div>
            <span className="font-industrial text-[11px] text-[#8b947e] font-bold tracking-[0.3em] uppercase mt-2 block">{currentAct.title}</span>
          </div>
          <button onClick={() => setView('calendar')} className="text-gray-400 hover:text-black hover:scale-125 transition-all p-2"><i className="fas fa-times text-xl"></i></button>
        </header>

        {renderActNav()}

        <div className="kuddo-card rounded-[32px] p-8 space-y-8 shadow-lg border-t-4 border-[#333] bg-white/80 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl">
          <p className="text-base font-bold text-[#333] leading-relaxed tracking-tight border-l-2 border-[#8b947e] pl-4 py-1 bg-[#8b947e]/5 rounded-r-lg transition-all duration-500 hover:bg-[#8b947e]/10">{currentAct.desc}</p>
          
          {currentStep === 0 && (
            <div className="space-y-10">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2 group">
                  <label className={`${labelStyle} group-focus-within:text-[#8b947e] transition-colors`}>高光 {i}</label>
                  <textarea 
                    placeholder="输入名场面..." 
                    className={inputAreaStyle} 
                    rows={1}
                    value={(state.act1 as any)[`high${i}`]} 
                    onInput={handleAutoResize}
                    onChange={(e) => {
                      setState(s => ({ ...s, act1: { ...s.act1, [`high${i}`]: e.target.value } }));
                    }} 
                  />
                </div>
              ))}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-10">
              <div className="space-y-2 group">
                <label className={`${labelStyle} group-focus-within:text-[#8b947e] transition-colors`}>场记单</label>
                <textarea 
                  className={textareaStyle} 
                  placeholder="焦虑或挫败的事实..." 
                  value={state.act2.fact} 
                  onInput={handleAutoResize}
                  onChange={(e) => setState(s => ({ ...s, act2: { ...s.act2, fact: e.target.value } }))} 
                />
              </div>
              <div className="space-y-2 group">
                <label className={`${labelStyle} group-focus-within:text-[#8b947e] transition-colors`}>编剧笔记</label>
                <textarea 
                  className={`${textareaStyle} italic font-serif`} 
                  placeholder="外部冲突还是内部矛盾？" 
                  value={state.act2.notes} 
                  onInput={handleAutoResize}
                  onChange={(e) => setState(s => ({ ...s, act2: { ...s.act2, notes: e.target.value } }))} 
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-2 group">
              <label className={`${labelStyle} group-focus-within:text-[#8b947e] transition-colors`}>素材</label>
              <textarea 
                className="w-full input-line py-3 resize-none text-2xl font-serif italic placeholder:text-gray-400 leading-relaxed text-[#333] h-auto overflow-hidden" 
                placeholder="记录令你感激的小事..." 
                value={state.act3.gratitude} 
                onInput={handleAutoResize}
                onChange={(e) => setState(s => ({ ...s, act3: { ...s.act3, gratitude: e.target.value } }))} 
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-3">
                {DIRECTOR_TIPS.map((tip, idx) => (
                  <button key={idx} onClick={() => {
                    const newEntries = { ...(state.act4.entries || {}) };
                    if (newEntries[idx] === undefined) newEntries[idx] = '';
                    else delete newEntries[idx];
                    setState(s => ({ ...s, act4: { entries: newEntries } }));
                  }} className={`p-3 rounded-xl border text-left transition-all duration-300 ${state.act4.entries && state.act4.entries[idx] !== undefined ? 'border-[#333] bg-[#333] text-white shadow-md scale-105' : 'border-black/5 bg-gray-50/50 hover:bg-black/5 hover:-translate-y-1'}`}>
                    <div className="font-industrial text-[8px] font-black tracking-widest">{tip.title}</div>
                  </button>
                ))}
              </div>
              {(!state.act4.entries || Object.keys(state.act4.entries).length === 0) && <div className="text-center py-6 text-gray-400 font-industrial text-[9px] tracking-widest animate-pulse">请点击上方锦囊进行拆解</div>}
              <div className="space-y-8">
                {state.act4.entries && Object.keys(state.act4.entries).map((key) => {
                  const idx = parseInt(key);
                  return (
                    <div key={idx} className="space-y-4 page-transition pt-6 border-t border-black/5 group/entry">
                      <div className="text-[11px] text-gray-600 italic border-l-2 border-[#8b947e] pl-4 bg-black/[0.01] py-3 rounded-r-lg group-hover/entry:bg-[#8b947e]/5 transition-colors">{DIRECTOR_TIPS[idx]?.description || ""}</div>
                      <label className={`${labelStyle} group-focus-within/entry:text-[#8b947e]`}>{DIRECTOR_TIPS[idx]?.title || "剖析"}</label>
                      <textarea 
                        className="w-full input-line py-3 resize-none placeholder:text-gray-400 text-base font-medium leading-relaxed text-[#333] h-auto overflow-hidden min-h-[128px]" 
                        placeholder="开始你的深度剖析..." 
                        value={state.act4.entries[idx]} 
                        onInput={handleAutoResize}
                        onChange={(e) => {
                          const newEntries = { ...state.act4.entries };
                          newEntries[idx] = e.target.value;
                          setState(s => ({ ...s, act4: { entries: newEntries } }));
                        }} 
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-10">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2 group">
                  <label className={`${labelStyle} group-focus-within:text-[#8b947e] transition-colors`}>重头戏 {i}</label>
                  <textarea 
                    placeholder="设定通关标准..." 
                    className={inputAreaStyle} 
                    rows={1}
                    value={(state.act5 as any)[`goal${i}`]} 
                    onInput={handleAutoResize}
                    onChange={(e) => setState(s => ({ ...s, act5: { ...s.act5, [`goal${i}`]: e.target.value } }))} 
                  />
                </div>
              ))}
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-8">
              <div className="space-y-6">
                {state.act6.items.map((item, i) => (
                  <div key={i} className="kuddo-card rounded-2xl p-6 border border-[#8b947e]/10 shadow-sm relative group/item">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            const newItems = [...state.act6.items];
                            newItems[i].type = 'quote';
                            setState(s => ({ ...s, act6: { items: newItems } }));
                          }}
                          className={`font-industrial text-[8px] font-black tracking-widest px-3 py-1 rounded-full transition-all ${item.type === 'quote' ? 'bg-[#8b947e] text-white' : 'bg-gray-100 text-gray-400'}`}
                        >
                          QUOTE / 金句
                        </button>
                        <button 
                          onClick={() => {
                            const newItems = [...state.act6.items];
                            newItems[i].type = 'principle';
                            setState(s => ({ ...s, act6: { items: newItems } }));
                          }}
                          className={`font-industrial text-[8px] font-black tracking-widest px-3 py-1 rounded-full transition-all ${item.type === 'principle' ? 'bg-[#333] text-white' : 'bg-gray-100 text-gray-400'}`}
                        >
                          PRINCIPLE / 原则
                        </button>
                      </div>
                      <button 
                        onClick={() => {
                          const newItems = state.act6.items.filter((_, idx) => idx !== i);
                          setState(s => ({ ...s, act6: { items: newItems } }));
                        }}
                        className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover/item:opacity-100"
                      >
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                    </div>
                    <textarea 
                      className={`w-full bg-transparent resize-none overflow-hidden placeholder:text-gray-300 text-lg leading-relaxed focus:outline-none ${item.type === 'quote' ? 'font-serif italic' : 'font-bold'}`}
                      placeholder={item.type === 'quote' ? "记录打动人心的金句..." : "总结值得恪守的原则..."}
                      value={item.text}
                      onInput={handleAutoResize}
                      onChange={(e) => {
                        const newItems = [...state.act6.items];
                        newItems[i].text = e.target.value;
                        setState(s => ({ ...s, act6: { items: newItems } }));
                      }}
                    />
                  </div>
                ))}
              </div>

              <button 
                onClick={() => {
                  setState(s => ({
                    ...s,
                    act6: {
                      items: [...(s.act6?.items || []), { text: '', type: 'quote' }]
                    }
                  }));
                }}
                className="w-full py-6 border-2 border-dashed border-[#8b947e]/20 rounded-2xl flex items-center justify-center gap-3 text-gray-400 hover:border-[#8b947e]/40 hover:text-[#8b947e] hover:bg-[#8b947e]/5 transition-all group"
              >
                <i className="fas fa-plus-circle transition-transform group-hover:rotate-90"></i>
                <span className="font-industrial text-[10px] font-black tracking-widest">ADD NEW ENTRY</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center px-4 pt-8 pb-12">
          <button onClick={handlePrev} className={`font-industrial text-[10px] font-black opacity-30 hover:opacity-100 transition-all flex items-center gap-3 tracking-[0.2em] uppercase hover:-translate-x-2 ${currentStep === 0 ? 'invisible' : ''}`}><i className="fas fa-chevron-left"></i> 上一幕</button>
          <button onClick={handleNextStep} className={`kuddo-btn-primary px-10 py-4 rounded-full shadow-lg text-xs tracking-[0.2em] font-black uppercase hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all ${currentStep === 6 ? 'invisible' : ''}`}>下一幕</button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-4 sm:pt-8 pb-16 px-4 sm:px-6">
      {view === 'home' ? renderHome() : 
       view === 'calendar' ? renderCalendar() : 
       view === 'archive' ? renderArchive() :
       view === 'viewer' ? renderViewer() : renderEditor()}
    </div>
  );
};

export default App;
