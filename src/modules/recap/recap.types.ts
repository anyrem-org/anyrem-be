export type SummaryPayload = {
  date: string;
  noteCount: number;
  groups: { category: string; notes: { title: string; snippet: string }[] }[];
};
