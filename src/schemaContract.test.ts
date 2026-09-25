import { describe, expect, it } from "vitest";

/**
 * Guards against the class of bug where a page selects columns the migrations
 * never created (for example `videos.duration` instead of `duration_text`),
 * which typechecks fine but fails at runtime with a PostgREST 400.
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
      const column = line.match(
        /^"?([a-z_][a-z0-9_]*)"?\s+(uuid|text|int|integer|numeric|boolean|timestamptz|date|jsonb|bigint|serial)/i
      );
      if (column) columns.add(column[1]);
    }
    tables.set(table, columns);
  }
  return tables;
}

/**
 * Resolves module-level string constants such as
 * `const VIDEO_COLUMNS = "id, title, ..."` so a select that uses one is still
 * checked. Expressions that are not purely string literals joined by `+` are
 * skipped, which keeps object and array literals out of the map.
 */
function parseStringConstants(source: string): Map<string, string> {
  const constants = new Map<string, string>();
  const constRe = /const\s+([A-Za-z_$][\w$]*)\s*=\s*([\s\S]*?);/g;
  let match: RegExpExecArray | null;

  while ((match = constRe.exec(source)) !== null) {
    const [, name, expression] = match;
    const parts = [...expression.matchAll(/"([^"]*)"|'([^']*)'/g)].map((part) => part[1] ?? part[2] ?? "");
    if (parts.length === 0) continue;
    const remainder = expression.replace(/"([^"]*)"|'([^']*)'/g, "").replace(/\+/g, "").trim();
    if (remainder.length > 0) continue;
    constants.set(name, parts.join(""));
  }
  return constants;
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

/**
 * Supabase Storage is also reached through `.from(...)`, and these names are
 * buckets rather than tables.
 */
const STORAGE_BUCKETS = new Set(["gallery", "audio", "avatars"]);

/** Splits a select list on top-level commas only, so `a(x, y)` stays intact. */
function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const character of input) {
    if (character === "(") depth += 1;
    else if (character === ")") depth -= 1;
    if (character === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += character;
  }
  parts.push(current);
  return parts;
}

function parseColumns(raw: string): string[] {
  const columns: string[] = [];
  for (const part of splitTopLevel(raw)) {
    const token = part.trim();
    if (!token || token === "*") continue;
    // Embedded resources (`profiles(full_name)`) resolve against other tables;
    // only plain columns are validated here.
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
    const constants = parseStringConstants(source);
    const fromRe = /\.from\(\s*"(\w+)"\s*\)/g;
    let match: RegExpExecArray | null;
    while ((match = fromRe.exec(source)) !== null) {
      const table = match[1];
      if (STORAGE_BUCKETS.has(table)) continue;
      // Only look as far as the next `.from(` so a later statement's select
      // can never be attributed to this table.
      const rest = source.slice(match.index + match[0].length);
      const nextFrom = rest.indexOf(".from(");
      const window = nextFrom === -1 ? rest : rest.slice(0, nextFrom);
      const select = window.match(/\.select\(\s*(?:"([^"]*)"|([A-Za-z_$][\w$]*))/);
      if (!select) continue;
      const raw = select[1] ?? constants.get(select[2] ?? "") ?? null;
      if (raw === null) continue;
      found.push({ file, table, columns: parseColumns(raw) });
    }
  }
  return found;
}

function findViolations(selections: Selection[], tables: Map<string, Set<string>>): string[] {
  const problems: string[] = [];
  for (const { file, table, columns } of selections) {
    const known = tables.get(table);
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

const EXPECTED_TABLES = [
  "profiles",
  "videos",
  "gallery_items",
  "audio_tracks",
  "messages",
  "broadcasts",
  "broadcast_deliveries",
  "sponsorship_leads",
  "site_content",
  "chat_knowledge",
  "audit_logs",
] as const;

describe("database schema contract", () => {
  it("declares every table the app relies on", () => {
    for (const table of EXPECTED_TABLES) {
      expect(tables.get(table), `missing table ${table}`).toBeDefined();
    }
  });

  it("declares the columns the public and admin queries select", () => {
    expect(tables.get("videos")?.has("youtube_id")).toBe(true);
    expect(tables.get("videos")?.has("is_published")).toBe(true);
    expect(tables.get("gallery_items")?.has("alt_text")).toBe(true);
    expect(tables.get("audio_tracks")?.has("is_active")).toBe(true);
    expect(tables.get("profiles")?.has("status")).toBe(true);
    expect(tables.get("messages")?.has("message_type")).toBe(true);
    expect(tables.get("broadcasts")?.has("audience_type")).toBe(true);
    expect(tables.get("broadcast_deliveries")?.has("read_at")).toBe(true);
    expect(tables.get("sponsorship_leads")?.has("campaign_objective")).toBe(true);
    expect(tables.get("site_content")?.has("content_key")).toBe(true);
    expect(tables.get("chat_knowledge")?.has("is_active")).toBe(true);
    expect(tables.get("audit_logs")?.has("admin_user_id")).toBe(true);
  });

  it("finds select statements to validate across every data service", () => {
    expect(selections.length).toBeGreaterThanOrEqual(25);
    const files = new Set(selections.map((selection) => selection.file));
    for (const service of [
      "./services/admin.ts",
      "./services/auth.ts",
      "./services/client.ts",
      "./services/content.ts",
    ]) {
      expect(files.has(service), `no selections found in ${service}`).toBe(true);
    }
  });

  it("checks the column lists held in constants, not just inline strings", () => {
    // `select(VIDEO_COLUMNS)` must be resolved, otherwise the highest-risk
    // queries in the app are never validated.
    const videoSelection = selections.find(
      (selection) => selection.table === "videos" && selection.columns.includes("youtube_id")
    );
    expect(videoSelection, "videos select using a column constant was not resolved").toBeDefined();
  });

  it("only selects tables and columns that exist in the migrations", () => {
    expect(findViolations(selections, tables)).toEqual([]);
  });

  it("keeps role and status changes out of client-writable policies", () => {
    const rls = Object.entries(migrationFiles)
      .filter(([file]) => file.includes("rls"))
      .map(([, sql]) => sql)
      .join("\n");

    // Clients may update their own profile row...
    expect(rls).toContain("profiles_update_own");
    // ...but a trigger restores role/status unless the caller is an admin.
    const schema = Object.values(migrationFiles).join("\n");
    expect(schema).toContain("guard_profile_privileged_columns");
    expect(schema).toContain("new.role := old.role");
    expect(schema).toContain("new.status := old.status");
  });

  it("gives anonymous visitors a way to write contact messages only", () => {
    const rls = Object.entries(migrationFiles)
      .filter(([file]) => file.includes("rls"))
      .map(([, sql]) => sql)
      .join("\n");

    expect(rls).toContain("messages_public_insert");
    expect(rls).toContain("message_type = 'contact'");
    expect(rls).toContain("sender_user_id is null");
    expect(rls).toContain("sponsorship_public_insert");
  });

  it("keeps the chatbot knowledge base out of the browser", () => {
    const rls = Object.entries(migrationFiles)
      .filter(([file]) => file.includes("rls"))
      .map(([, sql]) => sql)
      .join("\n");

    // The only policy on chat_knowledge is the admin one — there is no
    // public read policy at all.
    expect(rls).toContain("chat_knowledge_admin_manage");
    expect(rls).not.toMatch(/create policy chat_knowledge_public/);
  });
});
