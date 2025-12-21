import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useJournalStore } from '../../store/useJournalStore';
import { DIRECTOR_TIPS } from '../../constants';

export const ReviewViewer: React.FC = () => {
    const navigate = useNavigate();
    const { date } = useParams<{ date: string }>();
    const history = useJournalStore(state => state.history);

    const viewingReview = date ? history[date] : null;

    if (!viewingReview) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <div className="text-xl font-bold text-gray-400">Review not found for {date}</div>
                <button onClick={() => navigate('/calendar')} className="underline">Back to Calendar</button>
            </div>
        );
    }

    const { state: s, report: r } = viewingReview;

    const handleRewrite = () => {
        // Navigate to editor with this date. 
        // Note: This logic assumes we want to edit the EXISTING state.
        // The Editor component will load draft. IF we want to rewrite a finalized review,
        // we might need to populate the draft with this review's state first.
        // For now, let's assume the user manually copies or we implement "restore to draft" later.
        // Actually, in the original App.tsx, handleRewrite did: setState(viewingReview.state).
        // So we should populate the draft store with this state before navigating.
        useJournalStore.getState().saveDraft(date!, s);
        navigate(`/editor/${date}`);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-10 page-transition pb-24 relative pt-12 px-6">
            <header className="flex justify-between items-center py-6 border-b border-[#333]/5">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/calendar')} className="font-industrial text-[10px] flex items-center gap-2 hover:opacity-100 opacity-40 transition-all font-bold group tracking-widest hover:translate-x-[-4px]">
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
                            <div className="font-industrial text-4xl font-black tracking-tighter uppercase drop-shadow-md group-hover:tracking-wider transition-all duration-700 text-white/95">{r?.genreTag || 'Unclassified'}</div>
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
                                <div className="font-industrial text-3xl font-black tracking-tighter text-white/90">{r?.stats?.narrative ?? '-'}</div>
                            </div>

                            <div className="transition-all duration-500 group-hover:translate-y-[-2px]">
                                <div className="text-[9px] font-industrial font-bold text-[#8b947e]/60 mb-1.5 tracking-[0.2em]">CONTROL</div>
                                <div className="font-industrial text-3xl font-black tracking-tighter text-white/90">{r?.stats?.control ?? '-'}</div>
                            </div>

                            <div className="transition-all duration-500 group-hover:translate-y-[-2px]">
                                <div className="text-[9px] font-industrial font-bold text-[#8b947e]/60 mb-1.5 tracking-[0.2em]">INSIGHT</div>
                                <div className="font-industrial text-3xl font-black tracking-tighter text-white/90">{r?.stats?.insight ?? '-'}</div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end opacity-20 font-industrial text-[7px] tracking-[0.5em] font-bold pb-1">
                            <div>AUTH: STUDIO EDITION</div>
                            <div className="mt-1">SN: {date?.replace(/-/g, '')}-REEL</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-10 relative">
                {/* 金句与原则显示模块 */}
                {s?.act6?.items && s.act6.items.length > 0 && (
                    <div className="kuddo-card rounded-[28px] p-8 relative shadow-sm hover:border-[#8b947e]/20 transition-all">
                        <h3 className="font-industrial text-[#8b947e] text-[10px] font-bold tracking-[0.4em] mb-6 uppercase">ACT 06 // LORE & ARCHIVES</h3>
                        <div className="space-y-4">
                            {s.act6.items.map((item, i) => (
                                <div key={i} className={`p-4 rounded-xl ${item.type === 'quote' ? 'bg-[#f2f0e9]/40 border-l-2 border-[#8b947e]/40' : 'bg-gray-50/60 border-l-2 border-gray-300'}`}>
                                    <div className="font-industrial text-[7px] font-bold mb-1 opacity-40 uppercase">{item.type === 'quote' ? 'GOLDEN QUOTE' : 'CORE PRINCIPLE'}</div>
                                    <p className={`text-sm leading-relaxed text-[#333] ${item.type === 'quote' ? 'font-serif italic' : 'font-medium'}`}>{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="kuddo-card rounded-[28px] p-8 relative shadow-sm transition-all duration-500 hover:shadow-md hover:border-[#8b947e]/20 group">
                    <h3 className="font-industrial text-[#8b947e] text-[10px] font-bold tracking-[0.4em] mb-6 uppercase opacity-60 group-hover:opacity-100 transition-opacity">ACT 01 // KEY FRAMES</h3>
                    <div className="space-y-4">
                        {[s?.act1?.high1, s?.act1?.high2, s?.act1?.high3].map((h, i) => h && (
                            <div key={i} className="flex gap-4 border-b border-gray-50 pb-4 last:border-0 hover:translate-x-2 transition-transform duration-300">
                                <span className="font-industrial text-[#8b947e] font-black text-sm opacity-20 group-hover:opacity-40 transition-opacity">0{i + 1}</span>
                                <span className="text-sm font-medium leading-relaxed text-[#333] break-words flex-1">{h}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="kuddo-card rounded-[28px] p-8 relative shadow-sm hover:shadow-md hover:border-[#8b947e]/20 transition-all duration-500 group">
                        <h3 className="font-industrial text-[#8b947e] text-[10px] font-bold tracking-[0.4em] mb-6 uppercase group-hover:text-[#333] transition-colors">ACT 02 // CONFLICT</h3>
                        <div className="space-y-4">
                            <div className="text-sm leading-relaxed text-[#333] break-words">{s?.act2?.fact || '-'}</div>
                            <div className="text-sm italic opacity-70 leading-relaxed font-serif break-words border-l-2 border-[#8b947e]/30 pl-3">{s?.act2?.notes || '-'}</div>
                        </div>
                    </div>
                    <div className="kuddo-card rounded-[28px] p-8 relative shadow-sm hover:shadow-md hover:border-[#8b947e]/20 transition-all duration-500 group">
                        <h3 className="font-industrial text-[#8b947e] text-[10px] font-bold tracking-[0.4em] mb-6 uppercase group-hover:text-[#333] transition-colors">ACT 03 // B-ROLL</h3>
                        <div className="text-sm italic leading-relaxed text-[#333] opacity-80 border-l-2 border-[#8b947e]/20 pl-4 font-serif break-words">"{s?.act3?.gratitude || '-'}"</div>
                    </div>
                </div>

                {s?.act4?.entries && Object.keys(s.act4.entries).length > 0 && (
                    <div className="kuddo-card rounded-[28px] p-8 relative shadow-sm hover:border-[#8b947e]/20 transition-all duration-500 group">
                        <h3 className="font-industrial text-[#8b947e] text-[10px] font-bold tracking-[0.4em] mb-6 uppercase group-hover:text-[#333] transition-colors">ACT 04 // DIRECTOR'S COMMENTARY</h3>
                        <div className="space-y-6">
                            {Object.entries(s.act4.entries).map(([idx, content]) => (
                                <div key={idx} className="border-l-2 border-[#8b947e]/10 pl-4 hover:border-[#8b947e] transition-colors duration-500 group/entry">
                                    <div className="text-[8px] font-industrial text-[#8b947e] mb-1 font-bold tracking-widest uppercase opacity-60 group-hover/entry:opacity-100 transition-opacity">{DIRECTOR_TIPS[parseInt(idx)]?.title || "NOTE"}</div>
                                    <p className="text-sm leading-relaxed text-gray-700 break-words">{content as string}</p>
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
                        {r?.directorsCut || 'No Director\'s Cut'}
                    </div>
                    <div className="pt-8 border-t border-white/10">
                        <div className="font-industrial text-[9px] font-bold tracking-[0.4em] mb-6 text-[#8b947e] uppercase">SCRIPT NOTES</div>
                        <div className="text-sm leading-relaxed tracking-wide font-light break-words transition-opacity">
                            {(() => {
                                const notes = r?.scriptNotes;
                                if (!notes) return <div className="opacity-80">No Script Notes</div>;

                                // Regex to match "1." or "1、" style numbering
                                const regex = /(\d+\s*[.．、]\s*)/;
                                if (!regex.test(notes)) return <div className="opacity-80 whitespace-pre-wrap">{notes}</div>;

                                const parts = notes.split(regex);
                                const elements = [];

                                // Handle intro text
                                if (parts[0].trim()) {
                                    elements.push(<div key="intro" className="opacity-80 mb-6 whitespace-pre-wrap">{parts[0].trim()}</div>);
                                }

                                // Handle list items
                                for (let i = 1; i < parts.length; i += 2) {
                                    const numStr = parts[i];
                                    const content = parts[i + 1];
                                    // Extract just the number for styling, removing punctuation
                                    const num = numStr.replace(/[^0-9]/g, '').padStart(2, '0');

                                    if (content) {
                                        elements.push(
                                            <div key={i} className="flex gap-4 mb-4 last:mb-0 group/note pl-1">
                                                <div className="font-industrial font-bold text-[#8b947e] text-[10px] pt-[3px] opacity-40 group-hover/note:opacity-100 transition-opacity shrink-0">
                                                    {num}
                                                </div>
                                                <div className="flex-1 opacity-80 group-hover/note:opacity-100 transition-opacity text-white/90">
                                                    {content.trim().replace(/^[;；]/, '')}
                                                </div>
                                            </div>
                                        );
                                    }
                                }
                                return <div>{elements}</div>;
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
