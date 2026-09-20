export interface SubjectColumn {
  subject_id: string;
  name: string;
  max_marks: number;
}

export interface MarkCell {
  marks_obtained: number | null;
  is_absent: boolean;
}

export interface StudentMarkRow {
  student_id: string;
  student_name: string;
  cells: Record<string, MarkCell>;
}

export interface StudentResult {
  totalObtained: number | null;
  totalMax: number;
  percentage: number | null;
  isComplete: boolean;
  isAbsentEntirely: boolean;
  pass: boolean | null;
}

/**
 * Pure marks-math helpers shared by admin review, reports and student results.
 * Missing marks are NEVER treated as zero.
 */
export function calculateStudentResult(
  row: StudentMarkRow,
  columns: SubjectColumn[],
  passingPerSubjectPercent = 0
): StudentResult {
  const totalMax = columns.reduce((sum, c) => sum + (c.max_marks || 0), 0);
  const anyAbsent = columns.some((c) => row.cells[c.subject_id]?.is_absent);
  let obtained = 0;
  let allPresent = true;

  for (const col of columns) {
    const cell = row.cells[col.subject_id];
    if (!cell) {
      allPresent = false;
      continue;
    }
    if (cell.is_absent) {
      allPresent = false;
      continue;
    }
    if (cell.marks_obtained == null) {
      allPresent = false;
      continue;
    }
    obtained += cell.marks_obtained;
  }

  const isComplete = allPresent && columns.length > 0;
  const totalObtained = isComplete ? obtained : null;

  if (!isComplete) {
    return {
      totalObtained: null,
      totalMax,
      percentage: null,
      isComplete: false,
      isAbsentEntirely: anyAbsent && obtained === 0 && !rowHasAnyMark(row, columns),
      pass: null,
    };
  }

  const percentage = totalMax > 0 ? Math.round((obtained / totalMax) * 1000) / 10 : null;

  let pass = true;
  for (const col of columns) {
    const cell = row.cells[col.subject_id];
    const max = col.max_marks || 0;
    if (max <= 0 || passingPerSubjectPercent <= 0) continue;
    const need = (max * passingPerSubjectPercent) / 100;
    if (!cell || cell.is_absent || cell.marks_obtained == null || cell.marks_obtained < need) {
      pass = false;
    }
  }

  return { totalObtained, totalMax, percentage, isComplete: true, isAbsentEntirely: false, pass };
}

function rowHasAnyMark(row: StudentMarkRow, columns: SubjectColumn[]): boolean {
  return columns.some((c) => {
    const cell = row.cells[c.subject_id];
    return cell && !cell.is_absent && cell.marks_obtained != null;
  });
}

export interface TestStats {
  averagePercent: number | null;
  highest: { studentName: string; percent: number } | null;
  lowest: { studentName: string; percent: number } | null;
  passCount: number;
  failCount: number;
  incompleteCount: number;
  absentCount: number;
}

export function computeBatchStats(
  rows: StudentMarkRow[],
  columns: SubjectColumn[],
  passingPerSubjectPercent = 0
): TestStats {
  const entries: { name: string; percent: number }[] = [];
  let passCount = 0;
  let failCount = 0;
  let incompleteCount = 0;
  let absentCount = 0;

  for (const row of rows) {
    const result = calculateStudentResult(row, columns, passingPerSubjectPercent);
    if (result.isAbsentEntirely) {
      absentCount++;
      continue;
    }
    if (!result.isComplete) {
      incompleteCount++;
      continue;
    }
    if (result.pass) passCount++;
    else failCount++;
    if (result.percentage != null && entries.every((e) => e.percent !== result.percentage || e.name !== row.student_name)) {
      entries.push({ name: row.student_name, percent: result.percentage });
    }
  }

  const averagePercent =
    entries.length > 0
      ? Math.round((entries.reduce((s, e) => s + e.percent, 0) / entries.length) * 10) / 10
      : null;
  const sorted = [...entries].sort((a, b) => b.percent - a.percent);
  const highest = sorted[0] ? { studentName: sorted[0].name, percent: sorted[0].percent } : null;
  const lowest = sorted[sorted.length - 1]
    ? { studentName: sorted[sorted.length - 1].name, percent: sorted[sorted.length - 1].percent }
    : null;

  return { averagePercent, highest, lowest, passCount, failCount, incompleteCount, absentCount };
}

export function computeRanks(
  rows: StudentMarkRow[],
  columns: SubjectColumn[]
): Record<string, number> {
  const ranked: { id: string; pct: number }[] = [];
  for (const row of rows) {
    const r = calculateStudentResult(row, columns, 0);
    if (r.isComplete && r.percentage != null) {
      ranked.push({ id: row.student_id, pct: r.percentage });
    }
  }
  ranked.sort((a, b) => b.pct - a.pct);
  const ranks: Record<string, number> = {};
  let lastPct: number | null = null;
  let lastRank = 0;
  ranked.forEach((entry, index) => {
    if (lastPct !== null && entry.pct === lastPct) {
      ranks[entry.id] = lastRank;
    } else {
      ranks[entry.id] = index + 1;
      lastRank = index + 1;
      lastPct = entry.pct;
    }
  });
  return ranks;
}
