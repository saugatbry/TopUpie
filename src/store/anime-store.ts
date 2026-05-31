import { create } from 'zustand'
import { IAnimeDetails } from '@/types/anime-details'

interface IAnimeStore {
    anime: IAnimeDetails | null,
    setAnime: (state: IAnimeDetails) => void
    selectedEpisode: string,
    setSelectedEpisode: (state: string) => void
    watchType: 'subdub' | 'hindi',
    setWatchType: (state: 'subdub' | 'hindi') => void
}

export const useAnimeStore = create<IAnimeStore>((set) => ({
    anime: null,
    setAnime: (state: IAnimeDetails) => set({ anime: state }),

    selectedEpisode: '',
    setSelectedEpisode: (state: string) => set({ selectedEpisode: state }),

    watchType: 'subdub',
    setWatchType: (state: 'subdub' | 'hindi') => set({ watchType: state }),
}))
