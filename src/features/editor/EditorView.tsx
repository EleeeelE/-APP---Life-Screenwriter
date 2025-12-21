import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useJournalStore } from '../../store/useJournalStore';
import { ACT_TITLES, DIRECTOR_TIPS } from '../../constants';
import { generateFinalAudit } from '../../geminiService';
import { ScreenplayState } from '../../types';

const DEFAULT_STATE: ScreenplayState = {
    act1: { high1: '', high2: '', high3: '' },
    act2: { fact: '', notes: '' },
    act3: { gratitude: '' },
    act4: { entries: {} },
    act5: { goal1: '', goal2: '', goal3: '' },
    act6: { items: [] }
};

export const EditorView: React.FC = () => {
    const navigate = useNavigate();
    const { date } = useParams<{ date: string }>();
    const saveDraft = useJournalStore(state => state.saveDraft);
    const getDraft = useJournalStore(state => state.getDraft);
    const addReview = useJournalStore(state => state.addReview);

    // Ensure we have a date, if not redirect or use today
    // In React Router, we should generally ensure the route matches parameter.
    const effectiveDate = date || new Date().toISOString().split('T')[0];

    const [currentStep, setCurrentStep] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);

    // Initial state loading
    const [state, setState] = useState<ScreenplayState>(() => {
        const draft = getDraft(effectiveDate);
        return draft || DEFAULT_STATE;
    });

    // Save draft on change
    useEffect(() => {
        saveDraft(effectiveDate, state);
    }, [state, effectiveDate, saveDraft]);

    const handleAutoResize = (e: React.ChangeEvent<HTMLTextAreaElement> | React.UIEvent<HTMLTextAreaElement>) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
    };

    // Auto-resize effects
    useEffect(() => {
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(ta => {
            ta.style.height = 'auto';
            ta.style.height = `${ta.scrollHeight}px`;
        });
    }, [currentStep, state.act4.entries, state.act6.items]);

    const handleSubmit = async () => {
        setIsGenerating(true);
        try {
            const report = await generateFinalAudit(state);
            const newReview = {
                date: effectiveDate,
                state: state,
                report: report,
                timestamp: Date.now()
            };
            addReview(effectiveDate, newReview);
            navigate(`/review/${effectiveDate}`);
        } catch (e) {
            console.error(e);
            alert(e instanceof Error ? e.message : "Submission failed. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrev = () => setCurrentStep(s => Math.max(0, s - 1));
    const handleNextStep = () => setCurrentStep(s => Math.min(6, s + 1));
    const currentAct = ACT_TITLES[currentStep] || { title: "", desc: "" };
    const labelStyle = "font-industrial text-[12px] text-gray-800 font-black tracking-[0.2em] uppercase block mb-1";

    const inputAreaStyle = "w-full input-line py-2 text-lg font-bold placeholder:text-gray-400 text-[#333] resize-none min-h-[44px] h-auto overflow-hidden";
    const textareaStyle = "w-full input-line py-3 resize-none placeholder:text-gray-400 text-base leading-relaxed text-[#333] min-h-[112px] h-auto overflow-hidden";

    const renderActNav = () => (
        <div className="flex justify-center items-center gap-1.5 mb-8 p-3 bg-white/50 backdrop-blur-md rounded-2xl shadow-inner border border-black/5 overflow-x-auto">
            {[0, 1, 2, 3, 4, 5, 6].map(i => {
                const isActive = currentStep === i;
                return (
                    <button
                        key={i}
                        onClick={() => setCurrentStep(i)}
                        className={`min-w-[40px] h-10 flex items-center justify-center rounded-xl font-industrial text-xs font-black transition-all duration-300 ${isActive
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
                            className={`relative overflow-hidden kuddo-btn-primary px-16 py-5 rounded-full text-base shadow-[0_20px_50px_rgba(0,0,0,0.1)] active:scale-95 disabled:opacity-100 tracking-[0.4em] font-black uppercase transition-all duration-500 group ${isGenerating ? 'bg-[#333] text-white cursor-wait' : 'hover:shadow-[0_25px_60px_rgba(139,148,126,0.3)] hover:-translate-y-1'}`}
                        >
                            <span className="relative z-10 transition-all duration-500 group-hover:tracking-[0.6em] flex items-center gap-2">
                                {isGenerating && <i className="fas fa-circle-notch animate-spin text-[#8b947e]"></i>}
                                {isGenerating ? "正在剪辑 (CUTTING...)" : "确认发布剧本"}
                            </span>
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
        <div className="max-w-lg mx-auto space-y-8 page-transition py-4 relative mt-4 px-6">
            <header className="flex justify-between items-end border-b-2 border-[#333] pb-4 mb-8">
                <div className="flex-1">
                    <div className="font-industrial text-3xl font-black text-[#333] leading-none tracking-tighter hover:tracking-[-0.05em] transition-all duration-700">ACT 0{currentStep + 1}</div>
                    <span className="font-industrial text-[11px] text-[#8b947e] font-bold tracking-[0.3em] uppercase mt-2 block">{currentAct.title}</span>
                </div>
                <button onClick={() => navigate('/calendar')} className="text-gray-400 hover:text-black hover:scale-125 transition-all p-2"><i className="fas fa-times text-xl"></i></button>
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
