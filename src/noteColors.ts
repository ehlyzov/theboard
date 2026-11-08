export const NOTE_COLORS = {
  yellow: "#fff3bb",
  pink: "#fbe1ec",
  peach: "#ffe5d0",
  mint: "#dff1e6",
  blue: "#dfecfa",
  lavender: "#ebe2fa",
  gray: "#e9edf1",
  cream: "#f5eddc",
} as const;
export type NoteColor = keyof typeof NOTE_COLORS;
export const COLOR_NAMES: Record<NoteColor, string> = {
  yellow: "жёлтый",
  pink: "розовый",
  peach: "персиковый",
  mint: "мятный",
  blue: "голубой",
  lavender: "лавандовый",
  gray: "серый",
  cream: "кремовый",
};
