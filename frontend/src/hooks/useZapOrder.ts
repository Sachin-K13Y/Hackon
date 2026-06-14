import { create } from 'zustand';

interface ZapOrderStore {
    pending: boolean;        // user is mid-Zap-flow (came from Edit Cart)
    situationName: string;
    setPending: (situationName: string) => void;
    clear: () => void;
}

export const useZapOrder = create<ZapOrderStore>((set) => ({
    pending: false,
    situationName: '',
    setPending: (situationName) => set({ pending: true, situationName }),
    clear: () => set({ pending: false, situationName: '' }),
}));
