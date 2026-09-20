import { describe, expect, it } from "vitest";

/**
 * Guards against the class of bug where a page selects columns that the
 * migration never created (e.g. `resources.resource_type`), which makes the
 * page fail at runtime with a PostgREST 400 while still typechecking.
 */

// Raw file contents are loaded through Vite so the contract check needs no
// Node fs typings and stays inside the project's type graph.
const migrationFiles = import.meta.glob("../supabase/migrations/*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const sourceFiles = import.meta.glob("./**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function readMigrations(): string {
  return Object.values(migrationFiles).join("\n");
}

/** table -> set of column names declared in CREATE TABLE blocks. */
function parseTables(sql: string): Map<string, Set<string>> {
  const tables = new Map<string, Set<string>>();
  const tableRe = /create table if not exists public\.(\w+)\s*\(([\s\S]*?)\n\);/gi;
  let match: RegExpExecArray | null;
  while ((match = tableRe.exec(sql)) !== null) {
    const [, table, body] = match;
    const columns = new Set<string>();
    for (const rawLine of body.split("\n")) {
      const line = rawLine.trim().replace(/,$/, "");
      if (!line || /^(primary|unique|foreign|constraint|check)\b/i.test(line)) continue;
      const col = line.match(/^"?([a-z_][a-z0-9_]*)"?\s+(uuid|text|int|integer|numeric|boolean|timestamptz|date|jsonb|bigint|serial)/i);
      if (col) columns.add(col[1]);
    }
    tables.set(table, columns);
  }
  return tables;
}

function sourceEntries(): { file: string; source: string }[] {
  return Object.entries(sourceFiles)
    .filter(([file]) => !/\.test\.tsx?$/.test(file))
    .map(([file, source]) => ({ file, source }));
}

interface Selection {
  file: string;
  table: string;
  columns: string[];
}

/** Storage buckets are also reached via `.from(...)`; they are not tables. */
const NON_TABLE_SOURCES = new Set(["media"]);

/** Splits a select list on top-level commas only, so `a(x, y)` stays intact. */
function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of input) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  parts.push(current);
  return parts;
}

function parseColumns(raw: string): string[] {
  const columns: string[] = [];
  for (const part of splitTopLevel(raw)) {
    const token = part.trim();
    if (!token || token === "*") continue;
    // Embedded resources (`batches(name)`) and spreads (`batch:batches(x)`)
    // resolve against other tables; only plain columns are validated here.
    if (token.includes("(") || token.includes(")")) continue;
    if (token.includes("!")) continue;
    const name = token.includes(":") ? token.slice(token.indexOf(":") + 1) : token;
    columns.push(name.trim());
  }
  return columns;
}

function collectSelections(): Selection[] {
  const found: Selection[] = [];
  for (const { file, source } of sourceEntries()) {
    const fromRe = /\.from\(\s*"(\w+)"\s*\)/g;
    let match: RegExpExecArray | null;
    while ((match = fromRe.exec(source)) !== null) {
      const table = match[1];
      if (NON_TABLE_SOURCES.has(table)) continue;
      // Only look as far as the next `.from(` so a later statement's select
      // can never be attributed to this table.
      const rest = source.slice(match.index + match[0].length);
      const nextFrom = rest.indexOf(".from(");
      const window = nextFrom === -1 ? rest : rest.slice(0, nextFrom);
      const select = window.match(/\.select\(\s*"([^"]*)"/);
      if (!select) continue;
      found.push({ file, table, columns: parseColumns(select[1]) });
    }
  }
  return found;
}

function findViolations(
  selections: Selection[],
  tableMap: Map<string, Set<string>>
): string[] {
  const problems: string[] = [];
  for (const { file, table, columns } of selections) {
    const known = tableMap.get(table);
    if (!known) {
      problems.push(`${file}: table "${table}" is not defined in any migration`);
      continue;
    }
    for (const column of columns) {
      if (!known.has(column)) {
        problems.push(`${file}: "${table}.${column}" is not a column in the migrations`);
      }
    }
  }
  return problems;
}

const tables = parseTables(readMigrations());
const selections = collectSelections();

describe("database schema contract", () => {
  it("parses the migration tables", () => {
    expect(tables.size).toBeGreaterThan(15);
    expect(tables.get("resources")).toBeDefined();
    expect(tables.get("resources")?.has("url")).toBe(true);
    expect(tables.get("resources")?.has("kind")).toBe(true);
  });

  it("finds select statements to validate", () => {
    expect(selections.length).toBeGreaterThan(10);
  });

  it("only selects columns that exist in the migrations", () => {
    expect(findViolations(selections, tables)).toEqual([]);
  });

  it("detects a mismatch when one is present (guard is not vacuous)", () => {
    const violations = findViolations(
      [
        { file: "src/pages/public/Resources.tsx", table: "resources", columns: ["resource_type"] },
        { file: "src/pages/Nowhere.tsx", table: "ghost_table", columns: ["id"] },
      ],
      tables
    );
    expect(violations).toHaveLength(2);
    expect(violations[0]).toContain("resources.resource_type");
    expect(violations[1]).toContain("ghost_table");
  });

  it("filters resources by the status values the schema allows", () => {
    const entry = sourceEntries().find(({ file }) => file.endsWith("pages/public/Resources.tsx"));
    expect(entry, "Resources page should be collected").toBeDefined();
    expect(entry!.source).not.toMatch(/resource_type|file_url|external_url/);
    expect(entry!.source).toMatch(/\.eq\("status",\s*"active"\)/);
  });
});
