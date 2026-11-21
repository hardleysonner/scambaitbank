/* Pure Scam Bait Bingo rules (no DOM), shared by the UI and the unit tests. */
export const LINES = [[0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24],[0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24],[0,6,12,18,24],[4,8,12,16,20]];
export const FREE = 12;
export const LEVELS = 7;
export const LUNCH_AFTER = 10;

export const freshCells = () => Array.from({ length: 25 }, (_, i) => ({ state: i === FREE ? "free" : "closed", task: "" }));
export const findLine = (cells) => LINES.find((l) => l.every((i) => ["ok", "free"].includes(cells[i].state)));
export const lunchDue = ({ accepted, lunchDone }) => accepted === LUNCH_AFTER && !lunchDone;
export const nextLevel = (level) => Math.min(LEVELS, level + 1);
