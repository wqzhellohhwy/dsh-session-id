// src/index.ts
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { zstdDecompressSync } from "node:zlib";
var name = "dsh-session-id";
var inject = ["webServer"];
var MAX_REPORTS = 24;
var reports = [];
var SESSION_ID_RE = /^(?:session-)?[0-9a-fA-F][0-9a-fA-F-]{7,63}$/;
var TRASH_NAME_RE = /^\d{10,16}-(?:session-)?[0-9a-fA-F][0-9a-fA-F-]{7,63}$/;
var TRASH_META = "trash-meta.json";
var pendingCommand = null;
var commandSeq = 0;
function takeCommand() {
  const command = pendingCommand;
  pendingCommand = null;
  return command;
}
function dshHome() {
  const fromEnv = process.env.DSH_HOME;
  return typeof fromEnv === "string" && fromEnv !== "" ? fromEnv : join(homedir(), ".dsh");
}
function sessionsRoot() {
  return join(dshHome(), "sessions");
}
function trashRoot() {
  return join(dshHome(), "sessions-trash");
}
function projcacheSessionsDir() {
  return join(dshHome(), "storages", "session_projcache", "sessions");
}
var TITLE_TTL_MS = 6e4;
var titleCache = /* @__PURE__ */ new Map();
function cleanProjectionTitle(raw) {
  if (typeof raw !== "string" || raw.trim() === "") return void 0;
  let text = raw;
  const teammate = /You are teammate "([^"\n]{1,60})/.exec(text);
  if (teammate !== null) {
    text = teammate[1].replace(/["',;:.!?]+$/, "");
  } else if (text.trimStart().startsWith("<")) {
    text = text.replace(/<[^>]*>[\s\S]*?<\/[^>]*>/g, " ");
    if (text.trim() === "") text = raw.replace(/<[^>]*>/g, " ");
  }
  const firstLine = text.split("\n")[0].replace(/\s+/g, " ").trim();
  if (firstLine === "") return void 0;
  return firstLine.slice(0, 40);
}
function cleanIdentityLabel(raw) {
  if (typeof raw !== "string") return void 0;
  const text = raw.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  if (text === "") return void 0;
  return text.slice(0, 40);
}
function projectionTitleOf(sessionId) {
  const now = Date.now();
  const hit = titleCache.get(sessionId);
  if (hit !== void 0 && now - hit.at < TITLE_TTL_MS) return hit.title;
  const dir = projcacheSessionsDir();
  const bare = sessionId.replace(/^session-/, "");
  let title;
  for (const name2 of [`${sessionId}.json`, `${bare}.json`]) {
    const file = join(dir, name2);
    if (!existsSync(file)) continue;
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8"));
      const rows = parsed?.record?.rows;
      title = cleanIdentityLabel(rows?.subagent?.val?.identity?.label) ?? cleanIdentityLabel(rows?.subagent?.val?.label) ?? cleanProjectionTitle(rows?.title?.val);
    } catch {
      title = void 0;
    }
    break;
  }
  if (titleCache.size > 4e3) titleCache.clear();
  titleCache.set(sessionId, { at: now, title });
  return title;
}
function findSessionDir(sessionId) {
  const root = sessionsRoot();
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return void 0;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const candidate = join(root, entry.name, sessionId);
    if (existsSync(candidate)) return candidate;
  }
  return void 0;
}
function sessionDirIndex() {
  const index = /* @__PURE__ */ new Map();
  const root = sessionsRoot();
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return index;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = join(root, entry.name);
    let children;
    try {
      children = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const child of children) {
      if (child.isDirectory()) index.set(child.name, join(dir, child.name));
    }
  }
  return index;
}
function purgeProjectionFiles(sessionId) {
  const dir = projcacheSessionsDir();
  const bare = sessionId.replace(/^session-/, "");
  let removed = 0;
  for (const name2 of [`${sessionId}.json`, `${bare}.json`]) {
    const file = join(dir, name2);
    if (!existsSync(file)) continue;
    try {
      rmSync(file, { force: true });
      removed += 1;
    } catch {
    }
  }
  return removed;
}
async function purgeProjection(ctx, sessionId) {
  const bare = sessionId.replace(/^session-/, "");
  let viaDomain = false;
  try {
    const table = ctx?.get?.("storageDomain")?.get?.("session_projcache")?.table?.("sessions");
    if (typeof table?.delete === "function") {
      viaDomain = true;
      for (const key of [sessionId, bare]) {
        try {
          await table.delete(key);
        } catch {
        }
      }
    }
  } catch {
  }
  return { viaDomain, filesRemoved: purgeProjectionFiles(sessionId) };
}
async function quiesceSession(ctx, sessionId) {
  try {
    await ctx?.get?.("schedule")?.stopSessionTasks?.(sessionId);
  } catch {
  }
}
async function purgeRelatedData(ctx, sessionId) {
  const detail = {
    projectionViaDomain: false,
    projectionFiles: 0,
    unarchived: false,
    unpinned: false,
    detached: 0,
    scheduleRemoved: 0,
    pluginFiles: 0
  };
  const projection = await purgeProjection(ctx, sessionId);
  detail.projectionViaDomain = projection.viaDomain;
  detail.projectionFiles = projection.filesRemoved;
  try {
    const registry = ctx?.get?.("workspaceRegistry");
    if (registry !== void 0) {
      try {
        await registry.unarchiveSession?.(sessionId);
        detail.unarchived = true;
      } catch {
      }
      try {
        await registry.unpinSession?.(sessionId);
        detail.unpinned = true;
      } catch {
      }
      try {
        const entities = typeof registry.list === "function" ? registry.list() : [];
        for (const entity of entities ?? []) {
          const ids = Array.isArray(entity?.sessionIds) ? entity.sessionIds : [];
          if (!ids.includes(sessionId)) continue;
          await entity.detachSession?.(sessionId);
          detail.detached += 1;
        }
      } catch {
      }
    }
  } catch {
  }
  try {
    const schedule = ctx?.get?.("schedule");
    if (schedule !== void 0) {
      const rows = typeof schedule.list === "function" ? schedule.list({ sessionId }) ?? [] : [];
      for (const row of rows) {
        try {
          await schedule.delete?.({ id: row?.id, sessionId });
          detail.scheduleRemoved += 1;
        } catch {
        }
      }
    }
  } catch {
  }
  try {
    const file = join(dshHome(), "redteam-mode", "state", "sessions", `${sessionId}.json`);
    if (existsSync(file)) {
      rmSync(file, { force: true });
      detail.pluginFiles += 1;
    }
  } catch {
  }
  return detail;
}
function readTrashMeta(dir) {
  try {
    const parsed = JSON.parse(readFileSync(join(dir, TRASH_META), "utf8"));
    return typeof parsed === "object" && parsed !== null ? parsed : void 0;
  } catch {
    return void 0;
  }
}
function listTrashItems() {
  const root = trashRoot();
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return [];
  }
  const items = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = join(root, entry.name);
    const meta = readTrashMeta(dir);
    const sessionId = typeof meta?.sessionId === "string" ? meta.sessionId : TRASH_NAME_RE.test(entry.name) ? entry.name.replace(/^\d+-/, "") : void 0;
    items.push({
      name: entry.name,
      sessionId,
      at: typeof meta?.at === "number" ? meta.at : void 0,
      originalDir: typeof meta?.originalDir === "string" ? meta.originalDir : void 0
    });
  }
  items.sort((a, b) => a.name < b.name ? 1 : -1);
  return items;
}
async function deleteSessionDir(ctx, sessionId, purge) {
  if (!SESSION_ID_RE.test(sessionId)) return { ok: false, error: "invalid session id" };
  const dir = findSessionDir(sessionId);
  const inTrash = listTrashItems().filter((item) => item.sessionId === sessionId);
  if (dir === void 0 && inTrash.length === 0 && purge !== true) {
    return {
      ok: false,
      error: "session directory not found",
      sessionId,
      hint: "\u5B83\u53EF\u80FD\u5DF2\u7ECF\u88AB\u5220\u8FC7\uFF1B\u7528\u300C\u5F7B\u5E95\u5220\u9664\u300D\u6E05\u6389\u4ECD\u5728\u7684\u6295\u5F71/\u8BB0\u5F55\u6B8B\u7559"
    };
  }
  if (dir !== void 0 && !dir.startsWith(sessionsRoot())) {
    return { ok: false, error: "refusing to delete outside sessions root", dir };
  }
  await quiesceSession(ctx, sessionId);
  if (purge === true) {
    if (dir !== void 0) rmSync(dir, { recursive: true, force: true });
    const trashRemoved = [];
    for (const item of inTrash) {
      try {
        rmSync(join(trashRoot(), item.name), { recursive: true, force: true });
        trashRemoved.push(item.name);
      } catch {
      }
    }
    const related = await purgeRelatedData(ctx, sessionId);
    return { ok: true, mode: "purge", dir, trashRemoved, sessionId, related };
  }
  if (dir === void 0) {
    const projection2 = await purgeProjection(ctx, sessionId);
    return { ok: true, mode: "trash", alreadyInTrash: true, trashName: inTrash[0]?.name, sessionId, projection: projection2 };
  }
  const trash = trashRoot();
  mkdirSync(trash, { recursive: true });
  const name2 = `${Date.now()}-${sessionId}`;
  const target = join(trash, name2);
  renameSync(dir, target);
  const projection = await purgeProjection(ctx, sessionId);
  try {
    writeFileSync(join(target, TRASH_META), `${JSON.stringify({ sessionId, originalDir: dir, at: Date.now() }, void 0, 2)}
`, "utf8");
  } catch {
  }
  return { ok: true, mode: "trash", dir, to: target, name: name2, sessionId, projection };
}
async function purgeTrashItems(ctx, names) {
  const root = trashRoot();
  const wanted = Array.isArray(names) && names.length > 0 ? names : void 0;
  const removed = [];
  const failed = [];
  let projectionRemoved = 0;
  for (const item of listTrashItems()) {
    if (wanted !== void 0 && !wanted.includes(item.name)) continue;
    if (!TRASH_NAME_RE.test(item.name)) {
      failed.push({ name: item.name, error: "invalid trash name" });
      continue;
    }
    const dir = join(root, item.name);
    if (!dir.startsWith(root)) {
      failed.push({ name: item.name, error: "outside trash root" });
      continue;
    }
    try {
      rmSync(dir, { recursive: true, force: true });
      if (typeof item.sessionId === "string" && SESSION_ID_RE.test(item.sessionId)) {
        const related = await purgeRelatedData(ctx, item.sessionId);
        projectionRemoved += related.projectionFiles;
      }
      removed.push(item.name);
    } catch (error) {
      failed.push({ name: item.name, error: String(error?.message ?? error) });
    }
  }
  if (wanted !== void 0) {
    for (const name2 of wanted) {
      if (!removed.includes(name2) && !failed.some((item) => item.name === name2)) failed.push({ name: name2, error: "not found" });
    }
  }
  return { ok: failed.length === 0, removed, failed, projectionRemoved };
}
function projectKey(cwd) {
  let readable = "";
  let separatorRun = false;
  for (const ch of cwd) {
    if (ch === "/" || ch === "\\" || ch === ":") {
      if (!separatorRun) readable += "-";
      separatorRun = true;
      continue;
    }
    if (/^[A-Za-z0-9._-]$/.test(ch)) {
      readable += ch;
      separatorRun = false;
      continue;
    }
    readable += `~${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
    separatorRun = false;
  }
  const trimmed = readable.replace(/^-+/, "") || "root";
  return `--${trimmed.slice(0, 251)}--`;
}
function readHeaderCwd(dir) {
  for (const name2 of ["session.v4.jsonl.zstd", "session.jsonl.zstd"]) {
    const file = join(dir, name2);
    if (!existsSync(file)) continue;
    try {
      const text = zstdDecompressSync(readFileSync(file)).toString("utf8");
      for (const line of text.split("\n")) {
        if (line.trim() === "") continue;
        const parsed = JSON.parse(line);
        if (typeof parsed?.cwd === "string" && parsed.cwd !== "") return parsed.cwd;
        break;
      }
    } catch {
    }
  }
  return void 0;
}
function restoreTrashItem(name2) {
  if (typeof name2 !== "string" || !TRASH_NAME_RE.test(name2)) return { ok: false, error: "invalid trash name" };
  const root = trashRoot();
  const dir = join(root, name2);
  if (!dir.startsWith(root) || !existsSync(dir)) return { ok: false, error: "trash item not found" };
  const meta = readTrashMeta(dir);
  let original = typeof meta?.originalDir === "string" ? meta.originalDir : void 0;
  let inferred = false;
  if (original === void 0) {
    const cwd = readHeaderCwd(dir);
    if (cwd !== void 0) {
      original = join(sessionsRoot(), projectKey(cwd), name2.replace(/^\d+-/, ""));
      inferred = true;
    }
  }
  if (original === void 0 || !original.startsWith(sessionsRoot())) {
    return { ok: false, error: "cannot determine original path (no metadata and no readable session header)", dir };
  }
  if (existsSync(original)) return { ok: false, error: "original path already exists", dir: original };
  mkdirSync(join(original, ".."), { recursive: true });
  renameSync(dir, original);
  try {
    rmSync(join(original, TRASH_META), { force: true });
  } catch {
  }
  return { ok: true, restored: original, name: name2, inferred };
}
function isLoopback(req) {
  const addr = req?.socket?.remoteAddress ?? "";
  return addr === "127.0.0.1" || addr === "::1" || addr === "::ffff:127.0.0.1";
}
function sendJson(res, code, body) {
  res.writeHead(code, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}
async function readJsonBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 64 * 1024) raw = raw.slice(0, 64 * 1024);
    });
    req.on("end", () => {
      try {
        resolve(raw === "" ? {} : JSON.parse(raw));
      } catch {
        resolve(void 0);
      }
    });
    req.on("error", () => resolve(void 0));
  });
}
function summarize(report) {
  if (report === void 0) return null;
  return {
    at: report.at,
    phase: report.phase,
    plugin: report.plugin,
    build: report.build,
    entryMounted: report.entryMounted,
    slotEntries: report.slotEntries,
    sessionCount: report.sessionCount,
    archivedCount: report.archivedCount,
    localeRegistered: report.localeRegistered,
    hasArchived: report.hasArchived,
    hasJump: report.hasJump,
    hasArchiveAction: report.hasArchiveAction,
    hasUiWorkspace: report.hasUiWorkspace,
    deletedLocally: report.deletedLocally,
    styleRev: report.styleRev,
    settings: report.settings,
    rowProbe: report.rowProbe,
    samples: report.samples,
    rowWidth: report.rowWidth,
    rows: report.rows,
    toolbar: report.toolbar,
    look: report.look,
    items: report.items,
    first: report.first,
    sessionId: report.sessionId,
    ok: report.ok,
    url: report.url,
    args: report.args,
    locate: report.locate,
    archiveJump: report.archiveJump,
    subagentProbe: report.subagentProbe,
    target: report.target,
    purge: report.purge,
    confirm: report.confirm,
    removeMessage: report.removeMessage,
    archivedBefore: report.archivedBefore,
    archivedAfter: report.archivedAfter,
    present: report.present,
    stillListed: report.stillListed,
    skipped: report.skipped,
    reason: report.reason,
    errorName: report.errorName,
    error: report.error,
    already: report.already,
    wasArchived: report.wasArchived,
    attempts: report.attempts,
    targetVisible: report.targetVisible,
    targetVisibleBeforeClick: report.targetVisibleBeforeClick,
    timelineLastVisible: report.timelineLastVisible,
    timelineExtended: report.timelineExtended,
    behaviorUsed: report.behaviorUsed
  };
}
function apply(ctx) {
  const { webServer } = ctx;
  ctx.effect(() => {
    const disposers = [
      // client 上报：页面里的插件每次状态变化 POST 一次
      webServer.register({
        kind: "exact",
        path: "/api/session-id/report",
        handler: async (req, res) => {
          if (!isLoopback(req)) return sendJson(res, 403, { ok: false, error: "forbidden: loopback-only" });
          const body = await readJsonBody(req);
          if (body === void 0) return sendJson(res, 400, { ok: false, error: "invalid JSON" });
          reports.push({ at: Date.now(), ...body });
          while (reports.length > MAX_REPORTS) reports.shift();
          const command = takeCommand();
          sendJson(res, 200, command === null ? { ok: true, count: reports.length } : { ok: true, count: reports.length, commands: [command.command], args: command.args });
        }
      }),
      // 远程自检：给页面下发一条一次性指令（默认打开面板；探针指令可带 target/purge/confirm 参数）
      webServer.register({
        kind: "exact",
        path: "/api/session-id/selftest",
        handler: (req, res) => {
          if (!isLoopback(req)) return sendJson(res, 403, { ok: false, error: "forbidden: loopback-only" });
          let command = "open-panel";
          const args = {};
          try {
            const url = new URL(String(req.url ?? ""), "http://127.0.0.1");
            const asked = url.searchParams.get("command");
            if (asked === "probe-row-hit" || asked === "probe-trash" || asked === "probe-locate" || asked === "probe-subagent" || asked === "probe-delete") command = asked;
            const target = url.searchParams.get("target");
            if (typeof target === "string" && SESSION_ID_RE.test(target)) args.target = target;
            const purge = url.searchParams.get("purge");
            if (purge === "1" || purge === "0") args.purge = purge === "1";
            const confirm = url.searchParams.get("confirm");
            if (typeof confirm === "string" && confirm !== "") args.confirm = confirm.slice(0, 16);
          } catch {
          }
          pendingCommand = { command, seq: ++commandSeq, at: Date.now(), args };
          sendJson(res, 200, {
            ok: true,
            queued: pendingCommand,
            note: "\u5C06\u5728\u4E0B\u4E00\u6B21\u9875\u9762\u5FC3\u8DF3\uFF08\u226430s\uFF1B\u5237\u65B0\u9875\u9762\u5219 \u22642s\uFF09\u65F6\u6267\u884C\uFF0C\u968F\u540E\u4E0A\u62A5\u5BF9\u5E94\u9636\u6BB5"
          });
        }
      }),
      // 批量取会话标题（T4：官方 list 快照给不出子代理可读名，标题在投影缓存里）
      webServer.register({
        kind: "exact",
        path: "/api/session-id/titles",
        handler: async (req, res) => {
          if (!isLoopback(req)) return sendJson(res, 403, { ok: false, error: "forbidden: loopback-only" });
          if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "method not allowed" });
          const body = await readJsonBody(req);
          if (body === void 0) return sendJson(res, 400, { ok: false, error: "invalid JSON" });
          const asked = Array.isArray(body.sessionIds) ? body.sessionIds.filter((id) => typeof id === "string" && SESSION_ID_RE.test(id)) : [];
          const wanted = asked.slice(0, 200);
          const titles = {};
          for (const id of wanted) {
            const title = projectionTitleOf(id);
            if (title !== void 0) titles[id] = title;
          }
          sendJson(res, 200, { ok: true, asked: asked.length, served: wanted.length, titles });
        }
      }),
      // 批量解析会话目录绝对路径（面板「路径」按钮复制用；回收站里的条目给回收站目录）
      webServer.register({
        kind: "exact",
        path: "/api/session-id/paths",
        handler: async (req, res) => {
          if (!isLoopback(req)) return sendJson(res, 403, { ok: false, error: "forbidden: loopback-only" });
          if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "method not allowed" });
          const body = await readJsonBody(req);
          if (body === void 0) return sendJson(res, 400, { ok: false, error: "invalid JSON" });
          const asked = Array.isArray(body.sessionIds) ? body.sessionIds.filter((id) => typeof id === "string") : [];
          const index = sessionDirIndex();
          const trashed = asked.length === 0 ? [] : listTrashItems();
          const paths = {};
          for (const id of asked) {
            if (!SESSION_ID_RE.test(id)) continue;
            const dir = index.get(id);
            if (dir !== void 0) {
              paths[id] = dir;
              continue;
            }
            const inTrash = trashed.find((item) => item.sessionId === id);
            if (inTrash !== void 0) paths[id] = join(trashRoot(), inTrash.name);
          }
          sendJson(res, 200, { ok: true, root: sessionsRoot(), paths });
        }
      }),
      // 删除会话（purge=false 移入回收站，true 彻底删除含投影缓存）
      webServer.register({
        kind: "exact",
        path: "/api/session-id/delete",
        handler: async (req, res) => {
          if (!isLoopback(req)) return sendJson(res, 403, { ok: false, error: "forbidden: loopback-only" });
          if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "method not allowed" });
          const body = await readJsonBody(req);
          if (body === void 0) return sendJson(res, 400, { ok: false, error: "invalid JSON" });
          const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
          let result;
          try {
            result = await deleteSessionDir(ctx, sessionId, body.purge === true);
          } catch (error) {
            result = { ok: false, error: String(error?.message ?? error) };
          }
          reports.push({ at: Date.now(), phase: body.purge === true ? "delete-purge" : "delete-trash", sessionId, ok: result.ok === true });
          while (reports.length > MAX_REPORTS) reports.shift();
          sendJson(res, result.ok === true ? 200 : 400, result);
        }
      }),
      // 列回收站
      webServer.register({
        kind: "exact",
        path: "/api/session-id/trash",
        handler: (req, res) => {
          if (!isLoopback(req)) return sendJson(res, 403, { ok: false, error: "forbidden: loopback-only" });
          const items = listTrashItems();
          sendJson(res, 200, { ok: true, root: trashRoot(), count: items.length, items });
        }
      }),
      // 回收站彻底删除（names 指定若干条，all=true 清空）
      webServer.register({
        kind: "exact",
        path: "/api/session-id/trash/purge",
        handler: async (req, res) => {
          if (!isLoopback(req)) return sendJson(res, 403, { ok: false, error: "forbidden: loopback-only" });
          if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "method not allowed" });
          const body = await readJsonBody(req);
          if (body === void 0) return sendJson(res, 400, { ok: false, error: "invalid JSON" });
          let result;
          try {
            result = await purgeTrashItems(ctx, body.all === true ? void 0 : body.names);
          } catch (error) {
            result = { ok: false, error: String(error?.message ?? error) };
          }
          reports.push({ at: Date.now(), phase: "trash-purge", removed: result.removed?.length ?? 0, projectionRemoved: result.projectionRemoved ?? 0, ok: result.ok === true });
          while (reports.length > MAX_REPORTS) reports.shift();
          sendJson(res, result.ok === true ? 200 : 400, result);
        }
      }),
      // 回收站恢复
      webServer.register({
        kind: "exact",
        path: "/api/session-id/trash/restore",
        handler: async (req, res) => {
          if (!isLoopback(req)) return sendJson(res, 403, { ok: false, error: "forbidden: loopback-only" });
          if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "method not allowed" });
          const body = await readJsonBody(req);
          if (body === void 0) return sendJson(res, 400, { ok: false, error: "invalid JSON" });
          let result;
          try {
            result = restoreTrashItem(body.name);
          } catch (error) {
            result = { ok: false, error: String(error?.message ?? error) };
          }
          reports.push({ at: Date.now(), phase: "trash-restore", name: body.name, ok: result.ok === true });
          while (reports.length > MAX_REPORTS) reports.shift();
          sendJson(res, result.ok === true ? 200 : 400, result);
        }
      }),
      // 全量状态查询
      webServer.register({
        kind: "exact",
        path: "/api/session-id/status",
        handler: (req, res) => {
          if (!isLoopback(req)) return sendJson(res, 403, { ok: false, error: "forbidden: loopback-only" });
          const latest = reports[reports.length - 1];
          let trash = -1;
          try {
            trash = listTrashItems().length;
          } catch {
          }
          sendJson(res, 200, {
            ok: true,
            hostPid: process.pid,
            plugin: name,
            reports: reports.length,
            pendingCommand,
            trashCount: trash,
            trashRoot: trashRoot(),
            latest: summarize(latest),
            history: reports.map(summarize)
          });
        }
      })
    ];
    ctx.logger?.info?.("dsh-session-id: host face loaded (/api/session-id/{report,selftest,status,delete,paths,trash,titles})");
    return () => {
      for (const dispose of disposers) if (typeof dispose === "function") dispose();
    };
  }, "session-id: routes");
}
export {
  apply,
  inject,
  name
};
//# sourceMappingURL=index.js.map
