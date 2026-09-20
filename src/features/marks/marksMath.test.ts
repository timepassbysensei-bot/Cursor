import { describe, it, expect } from "vitest";
import {
  calculateStudentResult,
  computeBatchStats,
  computeRanks,
  type StudentMarkRow,
  type SubjectColumn,
} from "./marksMath";

const COLS: SubjectColumn[] = [
  { subject_id: "math", name: "Maths", max_marks: 100 },
  { subject_id: "eng", name: "English", max_marks: 100 },
];

function row(cells: Record<string, { marks_obtained: number | null; is_absent: boolean }>, id = "s1"): StudentMarkRow {
  return { student_id: id, student_name: "Student", cells };
}

describe("calculateStudentResult", () => {
  it("computes totals and pass when all subjects present and above passing", () => {
    const r = row({ math: { marks_obtained: 70, is_absent: false }, eng: { marks_obtained: 55, is_absent: false } });
    const result = calculateStudentResult(r, COLS, 33);
    expect(result.isComplete).toBe(true);
    expect(result.totalObtained).toBe(125);
    expect(result.totalMax).toBe(200);
    expect(result.percentage).toBe(62.5);
    expect(result.pass).toBe(true);
  });

  it("marks fail when one subject is below the per-subject passing threshold", () => {
    const r = row({ math: { marks_obtained: 90, is_absent: false }, eng: { marks_obtained: 20, is_absent: false } });
    const result = calculateStudentResult(r, COLS, 33);
    expect(result.isComplete).toBe(true);
    expect(result.pass).toBe(false);
  });

  it("treats missing marks as incomplete — never as zero", () => {
    const r = row({ math: { marks_obtained: 90, is_absent: false } });
    const result = calculateStudentResult(r, COLS, 33);
    expect(result.isComplete).toBe(false);
    expect(result.totalObtained).toBeNull();
  });

  it("treats a single absent subject as incomplete but not absent-entirely", () => {
    const r = row({ math: { marks_obtained: 80, is_absent: false }, eng: { marks_obtained: null, is_absent: true } });
    const result = calculateStudentResult(r, COLS, 33);
    expect(result.isComplete).toBe(false);
    expect(result.isAbsentEntirely).toBe(false);
  });

  it("flags absent-entirely only when every subject is absent", () => {
    const r = row({ math: { marks_obtained: null, is_absent: true }, eng: { marks_obtained: null, is_absent: true } });
    const result = calculateStudentResult(r, COLS, 33);
    expect(result.isComplete).toBe(false);
    expect(result.isAbsentEntirely).toBe(true);
  });

  it("handles empty rows", () => {
    const result = calculateStudentResult(row({}), COLS, 33);
    expect(result.isComplete).toBe(false);
    expect(result.totalMax).toBe(200);
  });
});

describe("computeBatchStats", () => {
  it("aggregates pass/fail/absent/incomplete counts and average", () => {
    const rows: StudentMarkRow[] = [
      row({ math: { marks_obtained: 80, is_absent: false }, eng: { marks_obtained: 70, is_absent: false } }, "a"),
      row({ math: { marks_obtained: 50, is_absent: false }, eng: { marks_obtained: 10, is_absent: false } }, "b"),
      row({ math: { marks_obtained: null, is_absent: true }, eng: { marks_obtained: null, is_absent: true } }, "c"),
      row({ math: { marks_obtained: 60, is_absent: false } }, "d"),
    ];
    const stats = computeBatchStats(rows, COLS, 33);
    expect(stats.passCount).toBe(1);
    expect(stats.failCount).toBe(1);
    expect(stats.absentCount).toBe(1);
    expect(stats.incompleteCount).toBe(1);
    expect(stats.averagePercent).toBe(52.5);
    expect(stats.highest?.studentName).toBe("Student");
  });
});

describe("computeRanks", () => {
  it("assigns shared ranks for ties and skips incomplete rows", () => {
    const rows: StudentMarkRow[] = [
      row({ math: { marks_obtained: 90, is_absent: false }, eng: { marks_obtained: 90, is_absent: false } }, "top"),
      row({ math: { marks_obtained: 80, is_absent: false }, eng: { marks_obtained: 80, is_absent: false } }, "mid1"),
      row({ math: { marks_obtained: 80, is_absent: false }, eng: { marks_obtained: 80, is_absent: false } }, "mid2"),
      row({ math: { marks_obtained: 10, is_absent: false } }, "incomplete"),
    ];
    const ranks = computeRanks(rows, COLS);
    expect(ranks.top).toBe(1);
    expect(ranks.mid1).toBe(2);
    expect(ranks.mid2).toBe(2);
    expect(ranks.incomplete).toBeUndefined();
  });
});
