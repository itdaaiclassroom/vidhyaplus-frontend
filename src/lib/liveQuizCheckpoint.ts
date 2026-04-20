/**
 * Browser console checkpoints for live quiz / attendance flow.
 * Filter DevTools console by: LIVE_QUIZ_CHECK
 * Disable: VITE_LIVE_QUIZ_CHECKPOINTS=0 in .env
 */
export function liveQuizCheckpoint(stage: string, data?: unknown): void {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env?.VITE_LIVE_QUIZ_CHECKPOINTS === "0") return;
  } catch {
    /* ignore */
  }
  console.log(`[LIVE_QUIZ_CHECK] [teacher_ui] ${stage}`, data !== undefined ? data : "");
}
