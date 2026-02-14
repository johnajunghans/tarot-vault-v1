import { create } from 'zustand';

export interface TitleData {
  name: string;
  addInfo?: string;
  draft?: boolean;
}

export interface SecondaryButton {
  text: string;
  action: () => void;
}

export interface PrimaryButton {
  text: string;
  action: (data: unknown) => void;
  disabled?: boolean;
}

export interface RightButtonGroup {
  primaryButton: PrimaryButton;
  secondaryButton?: SecondaryButton;
}

export interface TopbarState {
  title?: TitleData;
  rightButtonGroup?: RightButtonGroup;
}

export interface TopbarActions {
  setTitle: (title: TitleData | undefined) => void;
  setRightButtonGroup: (group: RightButtonGroup | undefined) => void;
  reset: () => void;
}

export type TopbarStore = TopbarState & TopbarActions;

const initialState: TopbarState = {
  title: undefined,
  rightButtonGroup: undefined,
};

export const useTopbarStore = create<TopbarStore>((set) => ({
  ...initialState,
  setTitle: (title) => set({ title }),
  setRightButtonGroup: (rightButtonGroup) => set({ rightButtonGroup }),
  reset: () => set(initialState),
}));
