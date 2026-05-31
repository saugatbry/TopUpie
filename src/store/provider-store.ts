import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Provider = 'subdub' | 'hindi'

interface IProviderStore {
  provider: Provider
  setProvider: (provider: Provider) => void
}

export const useProviderStore = create<IProviderStore>()(
  persist(
    (set) => ({
      provider: 'subdub' as Provider,
      setProvider: (provider: Provider) => set({ provider }),
    }),
    {
      name: 'provider-preference',
      partialize: (state) => ({ provider: state.provider }),
    },
  ),
)
