import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJournalStore } from '../../store/useJournalStore';

export const CalendarView: React.FC = () => {
    const navigate = useNavigate();
    const history = useJournalStore(state => state.history);

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const hasTodayReview = !!history[todayKey];

    // Trash Can State
    const [isTrashOpen, setIsTrashOpen] = useState(false);
    const [trashText, setTrashText] = useState('');
    const [isBurning, setIsBurning] = useState(false);

    const handleDiscard = () => {
        setIsBurning(true);
        setTimeout(() => {
            setTrashText('');
            setIsBurning(false);
            setIsTrashOpen(false);
        }, 1500); // Animation duration
    };

    const startNewReview = (dateKey?: string) => {
        const targetDate = dateKey || todayKey;
        if (history[targetDate]) {
            // If review exists, go to viewer
            navigate(`/review/${targetDate}`);
        } else {
            // Else go to editor
            navigate(`/editor/${targetDate}`);
        }
    };

    // Calendar Navigation State
    const [viewDate, setViewDate] = useState(new Date());

    const changeMonth = (increment: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setViewDate(newDate);
    };

    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`empty-${i}`} className="h-12 lg:h-16"></div>);

    for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const hasReview = !!history[dateKey];
        const isToday = todayKey === dateKey;
        const isSelectable = true;

        days.push(
            <button key={d} disabled={!isSelectable} onClick={() => startNewReview(dateKey)}
                className={`h-12 lg:h-16 rounded-lg border flex flex-col items-center justify-center transition-all duration-500 relative overflow-hidden group/day ${hasReview
                    ? 'border-[#8b947e] bg-[#8b947e]/5 text-[#333] shadow-sm hover:scale-110 hover:shadow-md hover:bg-[#8b947e]/10'
                    : isToday
                        ? 'border-[#2d4030] bg-[#334035]/5 text-[#1e2b21] shadow-lg ring-2 ring-[#2d4030]/20 hover:scale-110 hover:shadow-xl hover:z-20'
                        : 'border-black/5 bg-white/30 text-gray-300 hover:text-gray-500 hover:bg-gray-50 hover:border-black/10 cursor-pointer'
                    }`}
            >
                <span className="font-industrial text-lg lg:text-xl font-black group-hover/day:scale-110 transition-transform">{d}</span>
                {hasReview && <div className="text-[7px] font-industrial mt-0.5 text-[#8b947e] font-bold opacity-60 group-hover/day:opacity-100">REEL</div>}
                {isToday && !hasReview && <div className="text-[8px] font-industrial mt-1 bg-[#2d4030] text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse shadow-sm tracking-wider">TODAY</div>}
            </button>
        );
    }

    return (
        <div className="max-w-6xl mx-auto h-screen flex flex-col lg:overflow-hidden pt-4 pb-8 px-6 page-transition relative">
            <div className="watermark top-10 right-10 text-[120px] pointer-events-none">STUDIO</div>

            {/* Mind Recycling Overlay */}
            {isTrashOpen && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className={`relative w - full max - w - lg transition - all duration - 1000 ${isBurning ? 'animate-crumple-dump' : 'opacity-100 scale-100'} `}>
                        {/* Paper/Scrap Styling */}
                        <div className="bg-[#f0f0f0] pattern-grid-lg p-8 rounded-sm shadow-2xl transform rotate-1 border border-gray-300 relative">
                            {/* Tape Effect */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-yellow-100/50 backdrop-blur-sm transform -rotate-2 border-l border-r border-white/20 shadow-sm"></div>

                            <div className="text-[#333] font-industrial text-[12px] tracking-[0.5em] font-black mb-6 uppercase text-center border-b-2 border-[#333] pb-2">
                                SCRIPT SCRAPS // 废稿箱
                            </div>

                            <textarea
                                autoFocus
                                value={trashText}
                                onChange={(e) => setTrashText(e.target.value)}
                                placeholder="Type your worries here to discard them..."
                                className="w-full h-60 bg-transparent text-[#333] placeholder:text-gray-400 font-serif text-xl leading-relaxed focus:outline-none resize-none"
                                style={{
                                    backgroundImage: 'linear-gradient(transparent 95%, #999 95%)',
                                    backgroundSize: '100% 2rem',
                                    lineHeight: '2rem'
                                }}
                            />

                            <div className="absolute -right-8 -bottom-8">
                                <i className="fas fa-pencil-alt text-6xl text-gray-200 transform -rotate-45"></i>
                            </div>
                        </div>

                        <div className="mt-12 flex justify-center gap-8">
                            <button
                                onClick={() => setIsTrashOpen(false)}
                                className="px-6 py-2 rounded-full text-white/40 font-industrial text-[10px] tracking-[0.2em] hover:text-white transition-all uppercase"
                            >
                                Keep it
                            </button>
                            <button
                                onClick={handleDiscard}
                                disabled={!trashText.trim() || isBurning}
                                className={`group relative px - 8 py - 3 rounded - full bg - red - 500 text - white font - industrial text - [12px] tracking - [0.2em] uppercase transition - all duration - 300 shadow - [0_0_20px_rgba(239, 68, 68, 0.4)] ${!trashText.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:bg-red-600 hover:shadow-[0_0_40px_rgba(239,68,68,0.6)]'} `}
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <i className="fas fa-trash"></i>
                                    {isBurning ? "DISCARDING..." : "CRUMPLE & THROW"}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="flex justify-between items-end mb-6 shrink-0">
                <div className="space-y-1">
                    <h1 className="font-industrial text-5xl font-black text-[#333] tracking-tighter leading-none hover:tracking-[-0.05em] transition-all duration-700 cursor-default">STUDIO REEL</h1>
                    <div className="text-[10px] font-industrial text-[#8b947e] flex items-center gap-4 font-bold tracking-[0.3em]">
                        <span>CATALOGUE</span>
                        <div className="w-1 h-1 bg-[#8b947e]/30 rounded-full"></div>
                        <span>{currentYear} / {String(currentMonth + 1).padStart(2, '0')}</span>
                    </div>
                </div>
                <button onClick={() => navigate('/')} className="font-industrial text-[10px] text-gray-400 font-bold tracking-[0.4em] hover:text-[#333] hover:scale-110 transition-all mb-2">EXIT</button>
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
                            onClick={() => navigate('/archive')}
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
                            <div className={`w - 3 h - 3 rounded - full shadow - sm transition - all duration - 1000 ${hasTodayReview ? 'bg-[#8b947e]' : 'bg-red-400 animate-pulse scale-125'} `}></div>
                        </div>

                        <div className="flex-1 kuddo-card rounded-[32px] p-6 bg-[#333]/5 border-2 border-white/50 flex flex-col justify-center text-center opacity-60 transition-all duration-500 hover:opacity-100 hover:bg-white hover:border-[#8b947e]/20 hover:shadow-md group relative">
                            <div className="font-industrial text-[8px] tracking-[0.5em] text-[#8b947e] font-bold mb-2 group-hover:scale-110 transition-transform">PROD. NOTE</div>
                            <p className="text-[10px] italic font-serif leading-relaxed text-[#333]/70 px-4 group-hover:text-[#333] transition-colors">"The best script is the one you live with intention."</p>

                            {/* Mind Recycling Trigger - Integrated into layout */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsTrashOpen(true);
                                }}
                                className="absolute bottom-3 right-3 text-[#333]/60 hover:text-red-500 transition-all p-2 hover:scale-110 z-10 flex items-center justify-center bg-white/50 rounded-full w-8 h-8 shadow-sm hover:shadow-md"
                                title="Mind Recycling"
                            >
                                <i className="fas fa-trash-alt text-sm"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:w-2/3 kuddo-card rounded-[40px] p-6 lg:p-8 border-t-8 border-t-[#333] shadow-xl relative flex flex-col lg:min-h-0 transition-all duration-700 hover:shadow-2xl">
                    <div className="flex justify-between items-center mb-6 shrink-0">
                        <div className="flex items-center gap-6">
                            <button onClick={() => changeMonth(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors group/nav">
                                <i className="fas fa-chevron-left text-lg text-gray-300 group-hover/nav:text-[#333] transition-colors"></i>
                            </button>
                            <h2 className="font-industrial text-3xl font-black text-[#333] tracking-tighter hover:tracking-normal transition-all duration-500 cursor-default min-w-[240px] text-center">
                                {currentMonth + 1}月 <span className="text-[#8b947e] mx-1 opacity-40">/</span> {currentYear}
                            </h2>
                            <button onClick={() => changeMonth(1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors group/nav">
                                <i className="fas fa-chevron-right text-lg text-gray-300 group-hover/nav:text-[#333] transition-colors"></i>
                            </button>
                        </div>                        <div className="flex gap-2">
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
