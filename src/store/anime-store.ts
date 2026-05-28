import { create } from 'zustand'
import { IAnimeDetails } from '@/types/anime-details'

interface IAnimeStore {
    anime: IAnimeDetails | null,
    setAnime: (state: IAnimeDetails) => void
    selectedEpisode: string,
    setSelectedEpisode: (state: string) => void
}

export const useAnimeStore = create<IAnimeStore>((set) => ({
    anime: null,
    setAnime: (state: IAnimeDetails) => set({ anime: state }),

    selectedEpisode: '',
    setSelectedEpisode: (state: string) => set({ selectedEpisode: state }),
}))
