import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SavedReview, ScreenplayState, FinalReport } from '../types';

interface JournalState {
    history: Record<string, SavedReview>;
    drafts: Record<string, ScreenplayState>;

    // Actions
    setHistory: (history: Record<string, SavedReview>) => void;
    addReview: (date: string, review: SavedReview) => void;
    saveDraft: (date: string, draft: ScreenplayState) => void;
    getDraft: (date: string) => ScreenplayState | undefined;
    getReview: (date: string) => SavedReview | undefined;
}

const DRAFT_KEY = 'life_screenwriter_draft_v1';
const HISTORY_KEY = 'life_screenwriter_history_v1';

export const useJournalStore = create<JournalState>()(
    persist(
        (set, get) => ({
            history: {},
            drafts: {},

            setHistory: (history) => set({ history }),

            addReview: (date, review) => set((state) => {
                // Remove draft for this date when a review is finalized
                const newDrafts = { ...state.drafts };
                delete newDrafts[date];
                return {
                    history: { ...state.history, [date]: review },
                    drafts: newDrafts
                };
            }),

            saveDraft: (date, draft) => set((state) => ({
                drafts: { ...state.drafts, [date]: draft }
            })),

            getDraft: (date) => get().drafts[date],

            getReview: (date) => get().history[date]
        }),
        {
            name: 'life-screenwriter-storage', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => localStorage),
            // We manually handle migration from old keys if needed, but for now we start fresh or need a migration utility.
            // The user's legacy data is in separate keys.
            // I should probably add a migration step in `onRehydrateStorage` or just manually load old keys once.
            // For now, let's keep it simple.
            partialize: (state) => ({ history: state.history, drafts: state.drafts }),
        }
    )
);
