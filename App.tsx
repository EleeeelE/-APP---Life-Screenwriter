
import React, { useState, useEffect } from 'react';
import { 
  ScreenplayState, 
  FinalReport,
  SavedReview 
} from './types';
import { 
  ACT_TITLES, 
  DIRECTOR_TIPS 
} from './constants';
import { generateFinalAudit } from './geminiService';

const DRAFT_KEY = 'life_screenwriter_draft_v1';
const HISTORY_KEY = 'life_screenwriter_history_v1';

// 默认状态模版，用于数据合并
const DEFAULT_STATE: ScreenplayState = {
  act1: { high1: '', high2: '', high3: '' },
  act2: { fact: '', notes: '' },
  act3: { gratitude: '' },
  act4: { entries: {} },
  act5: { goal1: '', goal2: '', goal3: '' }
};

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'calendar' | 'editor' | 'viewer'>('home');
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<Record<string, SavedReview>>({});
  const [viewingReview, setViewingReview] = useState<SavedReview | null>(null);

  // 初始化状态，确保所有字段都存在
  const [state, setState] = useState<ScreenplayState>(DEFAULT_STATE);

  const todayKey = new Date().toISOString().split('T')[0];
  const hasTodayReview = !!history[todayKey];

  // 强化版数据加载逻辑
  useEffect(() => {
    // 1. 加载历史记录
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }

    // 2. 加载草稿并进行防御性合并
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        // 关键逻辑：将默认状态作为基底，覆盖上已保存的数据
        // 这样即使代码里新增了 act6，旧数据里没有 act6，合并后也会有 act6 的初始值，不会报错
        setState(prev => ({
          ...DEFAULT_STATE,
          ...parsedDraft,
          // 深度合并对象字段
          act1: { ...DEFAULT_STATE.act1, ...(parsedDraft.act1 || {}) },
          act2: { ...DEFAULT_STATE.act2, ...(parsedDraft.act2 || {}) },
          act3: { ...DEFAULT_STATE.act3, ...(parsedDraft.act3 || {}) },
          act4: { ...DEFAULT_STATE.act4, ...(parsedDraft.act4 || {}) },
          act5: { ...DEFAULT_STATE.act5, ...(parsedDraft.act5 || {}) },
        }));
      } catch (e) {
        console.warn("Draft recovery failed, using default state", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  }, [state]);

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

  const renderHome = () => (
    <div className="fixed inset-0 bg-[#8b947e] flex flex-col items-center justify-center z-[100] page-transition overflow-hidden">
      <button 
        onClick={() => setView('calendar')}
        className="typewriter-white relative w-full max-w-[540px] aspect-square flex flex-col items-center justify-center outline-none mt-24"
      >
        <div className="paper-sheet paper-anim absolute top-[-60px] w-72 h-80 z-10 flex flex-col items-center p-10 pt-20 text-[#333] border border-black/5 bg-white">
           <div className="font-industrial text-[34px] font-black leading-none tracking-tighter mb-2 text-black/80">LIFE</div>
           <div className="font-industrial text-[34px] font-black leading-none tracking-tighter text-black/80">SCREENWRITER</div>
           <div className="h-[2px] w-14 bg-black/10 my-8"></div>
           <div className="font-industrial text-[10px] opacity-25 tracking-[0.5em] font-bold">CHAPTER ONE</div>
           <div className="mt-auto opacity-[0.03] pb-10">
              <i className="fas fa-quote-right text-[120px]"></i>
           </div>
        </div>
        <div className="typewriter-chassis relative mt-40 w-[460px] h-[300px] z-20 flex flex-col items-center shadow-2xl border-white/40">
           <div className="chrome-bar absolute -top-8 w-[106%] h-16 rounded-[40px] flex items-center justify-between px-10 z-30">
              <div className="w-12 h-12 rounded-full bg-white border border-black/10 flex items-center justify-center shadow-lg">
                 <div className="w-6 h-2 bg-black/5 rounded-full"></div>
              </div>
              <div className="w-full h-10 bg-gradient-to-b from-[#ccc] via-[#fff] to-[#aaa] mx-4 rounded-lg border border-black/5 shadow-inner"></div>
              <div className="w-12 h-12 rounded-full bg-white border border-black/10 flex items-center justify-center shadow-lg">
                 <div className="w-6 h-2 bg-black/5 rounded-full"></div>
              </div>
           </div>
           <div className="mt-16 bg-black/[0.03] border border-black/5 px-12 py-3 rounded-full shadow-inner">
              <span className="font-industrial text-[12px] text-black/40 font-black tracking-[0.6em]">ELITE ARCHIVE PRO</span>
           </div>
           <div className="grid grid-cols-7 gap-4 mt-12 px-12">
              {Array(21).fill(0).map((_, i) => (
                <div key={i} className="mechanical-key-ring w-8 h-8 flex items-center justify-center">
                  <div className="mechanical-key-cap w-7 h-7 rounded-full">{String.fromCharCode(65 + (i % 26))}</div>
                </div>
              ))}
           </div>
           <div className="mechanical-key-ring w-72 h-7 mt-8 rounded-full flex items-center justify-center">
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
    for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`empty-${i}`} className="h-20 sm:h-28"></div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasReview = !!history[dateKey];
      const isToday = todayKey === dateKey;
      const isSelectable = hasReview || isToday;
      days.push(
        <button key={d} disabled={!isSelectable} onClick={() => startNewReview(dateKey)}
          className={`h-20 sm:h-28 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-500 relative overflow-hidden ${hasReview ? 'border-[#8b947e] bg-[#8b947e]/5 text-[#333] shadow-sm' : isToday ? 'border-[#333] bg-white text-[#333] shadow-md ring-1 ring-black/5' : 'border-black/5 bg-white/30 text-gray-300 cursor-default opacity-40'}`}
        >
          <span className="font-industrial text-2xl font-black">{d}</span>
          {hasReview && <div className="text-[9px] font-industrial mt-1 text-[#8b947e] font-bold">ARCHIVED</div>}
          {isToday && !hasReview && <div className="text-[9px] font-industrial mt-1 text-gray-400 font-bold">LIVE</div>}
        </button>
      );
    }

    return (
      <div className="max-w-3xl mx-auto space-y-12 page-transition relative pt-16 pb-32 px-6">
        <div className="watermark top-20 -left-20 text-[180px]">TIMELINE</div>
        <header className="text-center space-y-4 py-12 relative">
          <div className="font-industrial text-7xl font-black text-[#333] tracking-tighter leading-none mb-4">STUDIO REEL</div>
          <div className="text-[11px] font-industrial text-[#8b947e] flex items-center justify-center gap-6 font-bold tracking-[0.3em]">
            <span>MONTHLY CATALOGUE</span>
            <div className="w-1.5 h-1.5 bg-[#8b947e]/30 rounded-full"></div>
            <span>{currentYear} / {String(currentMonth + 1).padStart(2, '0')}</span>
          </div>
        </header>
        <div className="space-y-6">
          <button onClick={() => startNewReview()} className="w-full kuddo-card rounded-3xl p-10 flex items-center justify-between group transition-all duration-500 hover:bg-[#333] hover:text-white border-2 border-dashed border-[#8b947e]/20 hover:border-[#333] hover:shadow-2xl">
            <div className="text-left">
              <div className="font-industrial text-3xl font-black leading-tight mb-2">NEW SCREENPLAY</div>
              <div className="text-[11px] font-industrial opacity-50 group-hover:opacity-100 tracking-[0.2em] font-bold uppercase">PROD DATE: {todayKey}</div>
            </div>
            <div className="w-20 h-20 bg-[#8b947e]/10 group-hover:bg-white/10 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110"><i className="fas fa-plus text-3xl"></i></div>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="kuddo-card rounded-3xl p-8 flex items-center justify-between">
            <div>
              <div className="font-industrial text-[11px] text-gray-400 font-bold mb-2 tracking-[0.2em]">SCRIPTS TOTAL</div>
              <div className="font-industrial text-4xl font-black">{Object.keys(history).length}</div>
            </div>
            <i className="fas fa-box-open text-3xl text-[#8b947e]/30"></i>
          </div>
          <div className="kuddo-card rounded-3xl p-8 flex items-center justify-between">
            <div>
              <div className="font-industrial text-[11px] text-gray-400 font-bold mb-2 tracking-[0.2em]">CURRENT STATUS</div>
              <div className="font-industrial text-sm font-black text-[#333]">{hasTodayReview ? "COMPLETED" : "RECORDING..."}</div>
            </div>
            <i className={`fas fa-circle text-2xl transition-all duration-1000 ${hasTodayReview ? 'text-[#8b947e]' : 'text-red-400 animate-pulse'}`}></i>
          </div>
        </div>
        <div className="kuddo-card rounded-[40px] p-12 space-y-10 pt-16 border-t-8 border-t-[#333] shadow-lg relative">
          <div className="flex justify-between items-center border-b border-gray-100 pb-8">
            <h2 className="font-industrial text-4xl font-black text-[#333] tracking-tighter">{currentMonth + 1}月 <span className="text-[#8b947e] mx-1 opacity-40">/</span> {currentYear}</h2>
          </div>
          <div className="grid grid-cols-7 gap-4">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(w => <div key={w} className="text-center text-[10px] font-industrial text-gray-400 font-black mb-4 tracking-widest">{w}</div>)}
            {days}
          </div>
        </div>
        <footer className="text-center py-16">
          <button onClick={() => setView('home')} className="font-industrial text-[11px] text-gray-400 font-bold tracking-[0.5em] hover:text-[#333] transition-colors">EXIT TO MAIN REEL</button>
        </footer>
      </div>
    );
  };

  const renderViewer = () => {
    if (!viewingReview) return null;
    const { state: s, report: r, date } = viewingReview;
    
    return (
      <div className="max-w-3xl mx-auto space-y-12 page-transition pb-32 relative pt-16 px-6">
        <header className="flex justify-between items-center py-10 border-b-2 border-[#333]/5">
          <button onClick={() => setView('calendar')} className="font-industrial text-xs flex items-center gap-3 hover:opacity-100 opacity-40 transition-all font-bold group tracking-widest">
            <i className="fas fa-chevron-left transition-transform group-hover:-translate-x-1"></i> BACK TO CATALOGUE
          </button>
          <div className="text-right">
            <div className="font-industrial text-4xl font-black leading-none text-[#333] tracking-tighter">{date}</div>
            <div className="text-[10px] font-industrial text-[#8b947e] tracking-[0.3em] font-bold mt-3">RELEASE NO. {viewingReview.timestamp.toString().slice(-4)}</div>
          </div>
        </header>

        <div className="vip-card-gradient rounded-[40px] p-12 text-[#333] shadow-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-12">
            <div className="space-y-2">
              <div className="font-industrial text-[11px] font-bold opacity-40 tracking-[0.2em]">CLASSIFICATION</div>
              <div className="font-industrial text-4xl font-black tracking-tighter uppercase">{r.genreTag}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-10 border-t-2 border-[#333]/5 pt-12">
            <div><div className="text-[11px] font-industrial font-bold opacity-40 mb-2 tracking-[0.2em]">NARRATIVE</div><div className="font-industrial text-4xl font-black">{r.stats.narrative}</div></div>
            <div><div className="text-[11px] font-industrial font-bold opacity-40 mb-2 tracking-[0.2em]">CONTROL</div><div className="font-industrial text-4xl font-black">{r.stats.control}</div></div>
            <div><div className="text-[11px] font-industrial font-bold opacity-40 mb-2 tracking-[0.2em]">INSIGHT</div><div className="font-industrial text-4xl font-black">{r.stats.insight}</div></div>
          </div>
        </div>

        <div className="space-y-12 relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-dashed border-l-2 border-gray-100 -z-10"></div>
          
          <div className="kuddo-card rounded-[32px] p-10 relative ml-8 shadow-sm">
            <div className="absolute -left-9 top-10 w-4 h-4 bg-[#8b947e] rounded-full ring-4 ring-white"></div>
            <h3 className="font-industrial text-[#8b947e] text-[11px] font-bold tracking-[0.4em] mb-10 uppercase opacity-60">ACT 01 // KEY FRAMES</h3>
            <div className="space-y-6">
              {[s.act1.high1, s.act1.high2, s.act1.high3].map((h, i) => h && (
                <div key={i} className="flex gap-6 border-b border-gray-50 pb-6 last:border-0">
                  <span className="font-industrial text-[#8b947e] font-black text-xl opacity-20">0{i+1}</span>
                  <span className="text-lg font-medium leading-relaxed text-[#333]">{h}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ml-8">
            <div className="kuddo-card rounded-[32px] p-10 relative shadow-sm border-t-4 border-t-red-100">
              <h3 className="font-industrial text-red-400 text-[11px] font-bold tracking-[0.4em] mb-10 uppercase">ACT 02 // CONFLICT</h3>
              <div className="space-y-8">
                <div><div className="text-base leading-relaxed text-[#333]">{s.act2.fact}</div></div>
                <div><div className="text-base italic opacity-70 leading-relaxed font-serif">{s.act2.notes}</div></div>
              </div>
            </div>
            <div className="kuddo-card rounded-[32px] p-10 relative shadow-sm border-t-4 border-t-orange-100">
              <h3 className="font-industrial text-orange-400 text-[11px] font-bold tracking-[0.4em] mb-10 uppercase">ACT 03 // B-ROLL</h3>
              <div className="text-lg italic leading-relaxed text-[#333] opacity-80 border-l-4 border-[#8b947e]/20 pl-6 bg-gray-50/30 py-6 rounded-r-2xl font-serif">"{s.act3.gratitude}"</div>
            </div>
          </div>

          {s.act4.entries && Object.keys(s.act4.entries).length > 0 && (
            <div className="kuddo-card rounded-3xl p-10 ml-8 relative shadow-sm">
              <div className="absolute -left-11 top-10 w-4 h-4 bg-blue-300 rounded-full ring-4 ring-white"></div>
              <h3 className="font-industrial text-blue-400 text-[11px] font-bold tracking-[0.4em] mb-10 uppercase">ACT 04 // DIRECTOR'S COMMENTARY</h3>
              <div className="space-y-10">
                {Object.entries(s.act4.entries).map(([idx, content]) => (
                  <div key={idx} className="border-l-2 border-blue-50 pl-6">
                    <div className="text-[10px] font-industrial text-blue-300 mb-2 font-bold tracking-widest">{DIRECTOR_TIPS[parseInt(idx)]?.title || "未知锦囊"}</div>
                    <p className="text-lg leading-relaxed text-gray-700">{content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="kuddo-card rounded-[48px] p-16 bg-[#333] text-white/90 ml-8 shadow-2xl relative border border-white/5">
            <h2 className="font-industrial text-xl font-black mb-12 flex items-center gap-6">
              <span className="w-1.5 h-6 bg-[#8b947e]"></span>
              DIRECTOR'S CUT
            </h2>
            <div className="text-xl font-serif italic leading-relaxed opacity-95 first-letter:text-5xl first-letter:font-industrial first-letter:mr-4 first-letter:float-left mb-16 tracking-wide">
              {r.directorsCut || "镜头对准空无一人的片场，今日是一页白纸。没有高光与冲突，只有时间流逝的静默。这并非停滞，而是暴风雨前的宁静。主角站在幕后调整呼吸，准备在下一场戏重夺叙事权，打破这令人窒息的空白。"}
            </div>
            <div className="pt-12 border-t border-white/10">
              <div className="font-industrial text-[11px] font-bold tracking-[0.4em] mb-10 text-[#8b947e] uppercase">SCRIPT NOTES // REVISION STRATEGY</div>
              <div className="whitespace-pre-wrap opacity-80 text-lg leading-relaxed tracking-wide font-light">{r.scriptNotes}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEditor = () => {
    const handlePrev = () => setCurrentStep(s => Math.max(0, s - 1));
    const handleNextStep = () => setCurrentStep(s => Math.min(5, s + 1));
    const currentAct = ACT_TITLES[currentStep] || { title: "", desc: "" };
    const labelStyle = "font-industrial text-[16px] text-gray-800 font-black tracking-[0.2em] uppercase block mb-2";
    const inputStyle = "w-full input-line py-5 text-xl font-bold placeholder:text-gray-400 text-[#333]";
    const textareaStyle = "w-full input-line py-5 h-32 resize-none placeholder:text-gray-400 text-lg leading-relaxed text-[#333]";

    if (currentStep === 5) {
      return (
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-32 space-y-12 text-center page-transition">
          <div className="w-40 h-40 border-8 border-[#8b947e]/20 border-t-[#8b947e] rounded-full flex items-center justify-center animate-spin duration-[3000ms]"><i className="fas fa-clapperboard text-5xl text-[#333]"></i></div>
          <div className="space-y-6">
            <h2 className="font-industrial text-5xl font-black text-[#333] tracking-tighter">终章：制片人终审报告</h2>
            <p className="text-gray-700 font-industrial text-[14px] tracking-[0.3em] font-bold uppercase">提交后，AI将为你生成导演剪辑版叙事及职业点数</p>
          </div>
          <div className="flex flex-col items-center gap-6">
            <button onClick={handleSubmit} disabled={isGenerating} className="kuddo-btn-primary px-20 py-6 rounded-full text-xl shadow-2xl active:scale-95 disabled:opacity-50 tracking-[0.3em] font-black">
              {isGenerating ? "正在生成剧本..." : "确认提交剧本"}
            </button>
            <button onClick={handlePrev} disabled={isGenerating} className="font-industrial text-[12px] font-black opacity-40 hover:opacity-100 transition-all flex items-center gap-3 tracking-[0.3em] uppercase">
              <i className="fas fa-chevron-left"></i> 回到上一幕
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto space-y-12 page-transition py-16 relative mt-16 px-6">
        <header className="flex justify-between items-end border-b-4 border-[#333] pb-6 mb-12">
          <div className="flex-1"><div className="font-industrial text-5xl font-black text-[#333] leading-none tracking-tighter">ACT 0{currentStep + 1}</div><span className="font-industrial text-[14px] text-[#8b947e] font-bold tracking-[0.4em] uppercase mt-4 block">{currentAct.title}</span></div>
          <button onClick={() => setView('calendar')} className="text-gray-500 hover:text-black transition-all mb-2 p-3 hover:rotate-90"><i className="fas fa-times text-2xl"></i></button>
        </header>

        <div className="kuddo-card rounded-[40px] p-12 space-y-12 shadow-xl border-t-8 border-[#333] bg-white/80 backdrop-blur-sm">
          <p className="text-lg font-bold text-[#333] leading-relaxed tracking-tight border-l-4 border-[#8b947e] pl-6 py-2 bg-[#8b947e]/5 rounded-r-xl">{currentAct.desc}</p>
          
          {currentStep === 0 && (
            <div className="space-y-16">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-4">
                  <label className={labelStyle}>高光 {i}</label>
                  <input type="text" placeholder="输入名场面..." className={inputStyle} value={(state.act1 as any)[`high${i}`]} onChange={(e) => setState(s => ({ ...s, act1: { ...s.act1, [`high${i}`]: e.target.value } }))} />
                </div>
              ))}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-16">
              <div className="space-y-4">
                <label className={labelStyle}>场记单</label><textarea className={textareaStyle} placeholder="焦虑或挫败的事实..." value={state.act2.fact} onChange={(e) => setState(s => ({ ...s, act2: { ...s.act2, fact: e.target.value } }))} />
              </div>
              <div className="space-y-4">
                <label className={labelStyle}>编剧笔记</label><textarea className={`${textareaStyle} italic font-serif`} placeholder="外部冲突还是内部矛盾？" value={state.act2.notes} onChange={(e) => setState(s => ({ ...s, act2: { ...s.act2, notes: e.target.value } }))} />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <label className={labelStyle}>素材</label><textarea className="w-full input-line py-5 h-64 resize-none text-3xl font-serif italic placeholder:text-gray-400 leading-relaxed text-[#333]" placeholder="记录令你感激的小事..." value={state.act3.gratitude} onChange={(e) => setState(s => ({ ...s, act3: { ...s.act3, gratitude: e.target.value } }))} />
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-12">
              <div className="grid grid-cols-2 gap-4">
                {DIRECTOR_TIPS.map((tip, idx) => (
                  <button key={idx} onClick={() => {
                    const newEntries = { ...(state.act4.entries || {}) };
                    if (newEntries[idx] === undefined) newEntries[idx] = '';
                    else delete newEntries[idx];
                    setState(s => ({ ...s, act4: { entries: newEntries } }));
                  }} className={`p-4 rounded-2xl border-2 text-left transition-all ${state.act4.entries && state.act4.entries[idx] !== undefined ? 'border-[#333] bg-[#333] text-white' : 'border-black/5 bg-gray-50/50'}`}>
                    <div className="font-industrial text-[10px] font-black tracking-widest">{tip.title}</div>
                  </button>
                ))}
              </div>
              {(!state.act4.entries || Object.keys(state.act4.entries).length === 0) && <div className="text-center py-10 text-gray-400 font-industrial text-xs tracking-widest">请选择剧作锦囊进行深度拆解（可多选）</div>}
              <div className="space-y-12">
                {state.act4.entries && Object.keys(state.act4.entries).map((key) => {
                  const idx = parseInt(key);
                  return (
                    <div key={idx} className="space-y-6 page-transition pt-8 border-t border-black/5">
                      <div className="text-sm text-gray-700 italic border-l-4 border-[#8b947e] pl-6 bg-black/[0.02] py-4 rounded-r-xl">{DIRECTOR_TIPS[idx]?.description || ""}</div>
                      <label className={labelStyle}>{DIRECTOR_TIPS[idx]?.title || "锦囊"} 剖析</label>
                      <textarea className="w-full input-line py-5 h-40 resize-none placeholder:text-gray-400 text-lg font-medium leading-relaxed text-[#333]" placeholder="开始你的深度剖析..." value={state.act4.entries[idx]} onChange={(e) => {
                        const newEntries = { ...state.act4.entries };
                        newEntries[idx] = e.target.value;
                        setState(s => ({ ...s, act4: { entries: newEntries } }));
                      }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-16">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-4">
                  <label className={labelStyle}>重头戏 {i}</label>
                  <input type="text" placeholder="设定通关标准..." className={inputStyle} value={(state.act5 as any)[`goal${i}`]} onChange={(e) => setState(s => ({ ...s, act5: { ...s.act5, [`goal${i}`]: e.target.value } }))} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center px-8 pt-10">
          <button onClick={handlePrev} className={`font-industrial text-[12px] font-black opacity-50 hover:opacity-100 transition-all flex items-center gap-4 tracking-[0.3em] uppercase ${currentStep === 0 ? 'invisible' : ''}`}><i className="fas fa-chevron-left text-[12px]"></i> 上一幕</button>
          <button onClick={handleNextStep} className="kuddo-btn-primary px-20 py-5 rounded-full shadow-2xl text-sm tracking-[0.3em] font-black">下一幕</button>
        </div>
      </div>
    );
  };

  return <div className="min-h-screen pt-4 sm:pt-12 pb-20 px-4 sm:px-6">{view === 'home' ? renderHome() : view === 'calendar' ? renderCalendar() : view === 'viewer' ? renderViewer() : renderEditor()}</div>;
};

export default App;
