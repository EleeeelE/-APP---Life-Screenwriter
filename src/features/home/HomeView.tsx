import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const HomeView: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="fixed inset-0 bg-[#8b947e] flex flex-col items-center justify-center z-[100] page-transition overflow-hidden">
            <button
                onClick={() => navigate('/calendar')}
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
};
