import { SUBJECTS, SUBJECT_CODE_MAP, type Subject, type MarkValue } from "./exam-store";

export interface InstituteRow {
  roll: string;
  enrollment: string;
  name: string;
  branch?: string;
  section?: string;
  marks: Partial<Record<Subject, MarkValue>>;
  result?: string;
}

// Roll numbers can appear as "B2-084" or "B2-84"; enrollment ids match exactly.
// Returns every comparable form of an id so lookups survive formatting differences.
export function idVariants(value: string): string[] {
  const t = String(value ?? "").trim().toUpperCase();
  if (!t) return [];
  const out = new Set<string>([t, t.replace(/[^A-Z0-9]/g, "")]);
  const m = t.match(/^([A-Z]+\d*)[-\s]?0*(\d+)$/);
  if (m) {
    const digits = String(parseInt(m[2], 10));
    out.add(`${m[1]}${digits}`);
    out.add(`${m[1]}-${digits}`);
  }
  return [...out];
}

export function normName(value: string): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export interface StudentIdLike {
  roll: string;
  enrollment: string;
  name?: string;
}

export function buildStudentIndex<T extends StudentIdLike>(students: T[]): Map<string, T> {
  const index = new Map<string, T>();
  for (const student of students) {
    for (const key of [...idVariants(student.roll), ...idVariants(student.enrollment)]) {
      if (!index.has(key)) index.set(key, student);
    }
    if (student.name) {
      const nameKey = `name:${normName(student.name)}`;
      if (!index.has(nameKey)) index.set(nameKey, student);
    }
  }
  return index;
}

export function lookupStudent<T extends StudentIdLike>(
  index: Map<string, T>,
  roll: string,
  enrollment: string,
  name?: string,
): T | undefined {
  for (const key of [...idVariants(roll), ...idVariants(enrollment)]) {
    const hit = index.get(key);
    if (hit) return hit;
  }
  if (name) {
    const nameKey = `name:${normName(name)}`;
    const hit = index.get(nameKey);
    if (hit) return hit;
  }
  return undefined;
}

const normHeader = (value: unknown) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const isSubjectCode = (value: unknown) => /^bt\d{3}$/.test(normHeader(value));

// Accepts:
// 1. Institute format: "Sr. No. | Roll No. | Name | BT205 | BT203 | BT204 | BT102 | BT201 | Total | % | Result"
// 2. Simplified format with Father Name: "Sr. No. | Name | Father Name | Branch | BT205 | BT203 | BT204 | BT102 | BT201"
// 3. App template: "Student Name | Roll Number | Enrollment Number | Branch | Section | Semester"
export function parseInstituteSheet(rows: unknown[][]): InstituteRow[] {
  const headerIdx = rows.findIndex((row) => {
    if (!Array.isArray(row)) return false;
    const hasName = row.some((cell) =>
      ["name", "studentname", "student", "candidatename"].includes(normHeader(cell)),
    );
    const hasId = row.some((cell) =>
      [
        "rollno",
        "rollnumber",
        "roll",
        "rollnumberid",
        "srno",
        "srnumber",
        "sr",
        "serialno",
        "serialnumber",
        "sno",
        "enrollmentnumber",
        "enrollment",
        "enrollmentno",
      ].includes(normHeader(cell)),
    );
    const hasSubject = row.some((cell) => isSubjectCode(cell));
    return hasName && (hasId || hasSubject);
  });

  if (headerIdx === -1) return [];

  const header = rows[headerIdx] ?? [];
  const colOf = (names: string[]) =>
    header.findIndex((cell) => names.includes(normHeader(cell)));

  const nameCol = colOf(["name", "studentname", "student", "candidatename"]);
  let rollCol = colOf(["rollno", "rollnumber", "roll", "rollnumberid"]);
  const enrollCol = colOf(["enrollmentnumber", "enrollment", "enrollmentno", "enrollno"]);
  const srCol = colOf(["srno", "srnumber", "srno.", "sr", "serialno", "serialnumber", "sno", "srn"]);
  const branchCol = colOf(["branch", "department", "dept", "stream"]);
  const sectionCol = colOf(["section", "sec"]);

  // If no explicit Roll No column, fallback to Sr. No. column or Enrollment
  if (rollCol === -1) {
    if (srCol !== -1) {
      rollCol = srCol;
    } else if (enrollCol !== -1) {
      rollCol = enrollCol;
    }
  }

  const subjectCols: Array<{ col: number; code: Subject }> = [];
  header.forEach((cell, col) => {
    if (isSubjectCode(cell)) {
      const rawCode = normHeader(cell).toUpperCase();
      const code = SUBJECT_CODE_MAP[rawCode] ?? (SUBJECTS.includes(rawCode as Subject) ? (rawCode as Subject) : null);
      if (code) subjectCols.push({ col, code });
    }
  });

  if (nameCol === -1 && rollCol === -1) return [];

  const parsed: InstituteRow[] = [];
  let autoRollCounter = 1;

  for (const row of rows.slice(headerIdx + 1)) {
    if (!Array.isArray(row)) continue;
    const cell = (col: number) => String(row[col] ?? "").trim();
    const name = nameCol >= 0 ? cell(nameCol) : "";
    const rollCell = rollCol >= 0 ? cell(rollCol) : "";
    const enrollCell = enrollCol >= 0 ? cell(enrollCol) : "";
    const srCell = srCol >= 0 ? cell(srCol) : "";
    const branchCell = branchCol >= 0 ? cell(branchCol) : "";
    const sectionCell = sectionCol >= 0 ? cell(sectionCol) : "";

    // Ignore empty summary / total rows
    if (!name && !rollCell && !srCell) continue;
    if (name.toLowerCase().includes("total") || name.toLowerCase().includes("average")) continue;

    // Determine student roll:
    // If Sr. No. has a standard roll like B2-84, use it. Otherwise use rollCell or srCell.
    let roll = "";
    if (/^[A-Za-z]+\d*[-_]\d+/i.test(srCell)) {
      roll = srCell;
    } else if (rollCell) {
      roll = rollCell;
    } else if (srCell) {
      roll = srCell;
    } else if (enrollCell) {
      roll = enrollCell;
    } else {
      roll = `STU-${String(autoRollCounter++).padStart(3, "0")}`;
    }

    const enrollment = enrollCell || (rollCell !== roll && rollCell ? rollCell : roll);

    const marks: Partial<Record<Subject, MarkValue>> = {};
    for (const { col, code } of subjectCols) {
      const raw = cell(col).trim().toUpperCase();
      if (!raw) continue;
      if (raw === "A") {
        marks[code] = "A";
        continue;
      }
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) marks[code] = n;
    }

    parsed.push({
      roll,
      enrollment,
      name,
      branch: branchCell || undefined,
      section: sectionCell || undefined,
      marks,
    });
  }

  return parsed;
}

// Parses one result row per text line, as produced by the institute result PDF:
// "B2-84 0246AL251176 Saurav Gupta 20 16 17 20 14 87 87 Pass"
// Absent subjects are written as "A" and simply get no mark.
export function parsePdfResultLines(lines: string[]): InstituteRow[] {
  const parsed: InstituteRow[] = [];
  for (const raw of lines) {
    const line = String(raw ?? "").replace(/\s+/g, " ").trim();
    if (!line) continue;
    const tokens = line.split(" ");
    const resultIdx = tokens.findIndex((token, i) => i > 0 && /^(pass|fail)$/i.test(token));
    if (resultIdx < 3) continue;
    const roll = tokens[0] ?? "";
    const enrollment = tokens[1] ?? "";
    if (!/^[A-Za-z]+\d*/i.test(roll) || !enrollment) continue;
    const tail = tokens.slice(resultIdx - 7, resultIdx); // 5 subject marks + total + %
    if (tail.length < 7) continue;
    const markTokens = tail.slice(0, 5);
    if (!markTokens.every((t) => /^a$/i.test(t) || /^-?\d+(\.\d+)?$/.test(t))) continue;
    const name = tokens.slice(2, resultIdx - 7).join(" ").trim();
    if (!name) continue;

    const marks: Partial<Record<Subject, MarkValue>> = {};
    SUBJECTS.forEach((code, i) => {
      const token = (markTokens[i] ?? "").trim().toUpperCase();
      if (!token) return;
      if (token === "A") {
        marks[code] = "A";
        return;
      }
      const n = Number(token);
      if (Number.isFinite(n) && n >= 0) marks[code] = n;
    });
    parsed.push({ roll, enrollment, name, marks, result: tokens[resultIdx] });
  }
  return parsed;
}
