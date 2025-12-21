import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJournalStore } from '../../store/useJournalStore';

export const ArchiveView: React.FC = () => {
    const navigate = useNavigate();
    const [archiveTab, setArchiveTab] = useState<'quote' | 'principle'>('quote');
    const history = useJournalStore(state => state.history);

    const getAllArchiveItems = (type: 'quote' | 'principle') => {
        const items: Array<{ text: string, date: string }> = [];
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

    const items = getAllArchiveItems(archiveTab);

    // Data Backup & Recovery
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const drafts = useJournalStore.getState().drafts;
        const backupData = {
            version: 1,
            exportedAt: new Date().toISOString(),
            history,
            drafts
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `life-screenwriter-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);

                // Simple validation
                if (!data.history && !data.drafts) {
                    alert('Invalid backup file format');
                    return;
                }

                if (window.confirm('Importing will OVERWRITE your current data with the backup. Are you sure?')) {
                    useJournalStore.setState({
                        history: data.history || {},
                        drafts: data.drafts || {}
                    });
                    alert('Data restored successfully!');
                    window.location.reload(); // Reload to refresh all components
                }
            } catch (error) {
                console.error('Import failed:', error);
                alert('Failed to parse backup file');
            }
        };
        reader.readAsText(file);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="max-w-3xl mx-auto h-screen flex flex-col pt-12 pb-24 px-6 page-transition relative">
            <header className="flex justify-between items-center mb-10 shrink-0">
                <div className="space-y-1">
                    <button
                        onClick={() => navigate('/calendar')}
                        className="font-industrial text-[10px] text-gray-400 hover:text-[#333] flex items-center gap-2 mb-2 transition-all font-bold tracking-[0.3em] group"
                    >
                        <i className="fas fa-chevron-left group-hover:-translate-x-1 transition-transform"></i> BACK TO STUDIO
                    </button>
                    <h1 className="font-industrial text-5xl font-black text-[#333] tracking-tighter">CREATIVE ARCHIVE</h1>
                </div>

                {/* Backup Controls */}
                <div className="flex gap-4">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImport}
                        accept=".json"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 text-[10px] font-industrial font-bold tracking-[0.2em] border border-gray-200 hover:border-[#8b947e] hover:text-[#8b947e] transition-all rounded"
                    >
                        IMPORT DATA
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 text-[10px] font-industrial font-bold tracking-[0.2em] bg-[#333] text-white hover:bg-[#8b947e] transition-all rounded shadow-md"
                    >
                        EXPORT DATA
                    </button>
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
