window.__ModuleLoader__.load({ id: "dsh-session-id", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(index_exports);
var React3 = __toESM(require("react"), 1);

// src/client/panel.tsx
var React2 = __toESM(require("react"), 1);
var import_react_dom = require("react-dom");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/icons.tsx
var React = __toESM(require("react"), 1);
var base = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true
};
function SessionIdIcon(props) {
  return React.createElement(
    "svg",
    { ...base, ...props },
    React.createElement("rect", { x: 1.5, y: 3.5, width: 13, height: 9, rx: 1.5, key: "r" }),
    React.createElement("path", { d: "M4 6.5h2M4 9h2M7.5 6.5h4.5M7.5 9h4.5", key: "p" })
  );
}
function CopyIcon(props) {
  return React.createElement(
    "svg",
    { ...base, ...props },
    React.createElement("rect", { x: 5.5, y: 5.5, width: 9, height: 9, rx: 1.5, key: "r" }),
    React.createElement("path", { d: "M2.5 10.5v-7A1.5 1.5 0 0 1 4 2h5.5", key: "p" })
  );
}
function CheckIcon(props) {
  return React.createElement("svg", { ...base, ...props }, React.createElement("path", { d: "M3 8.5 6.5 12l6.5-8" }));
}
function CloseIcon(props) {
  return React.createElement("svg", { ...base, ...props }, React.createElement("path", { d: "M4 4l8 8M12 4l-8 8" }));
}
function TrashIcon(props) {
  return React.createElement(
    "svg",
    { ...base, ...props },
    React.createElement("path", { d: "M2.5 4.5h11", key: "a" }),
    React.createElement("path", { d: "M6 4.5V3a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1.5", key: "b" }),
    React.createElement("path", { d: "M3.8 4.5l.7 8a1 1 0 0 0 1 .9h5a1 1 0 0 0 1-.9l.7-8", key: "c" }),
    React.createElement("path", { d: "M6.8 7v4M9.2 7v4", key: "d" })
  );
}
function ArchiveIcon(props) {
  return React.createElement(
    "svg",
    { ...base, ...props },
    React.createElement("rect", { x: 2.5, y: 3, width: 11, height: 3, rx: 1, key: "a" }),
    React.createElement("path", { d: "M3.5 6.5v6a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-6", key: "b" }),
    React.createElement("path", { d: "M6.5 9h3", key: "c" })
  );
}
function LocateIcon(props) {
  return React.createElement(
    "svg",
    { ...base, ...props },
    React.createElement("circle", { cx: 8, cy: 8, r: 4.2, key: "a" }),
    React.createElement("path", { d: "M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2", key: "b" })
  );
}
function SubagentIcon(props) {
  return React.createElement(
    "svg",
    { ...base, ...props },
    React.createElement("path", { d: "M3.5 3v4.5a2 2 0 0 0 2 2h5", key: "a" }),
    React.createElement("circle", { cx: 3.5, cy: 2.5, r: 1.2, key: "b" }),
    React.createElement("circle", { cx: 12, cy: 9.5, r: 1.5, key: "c" })
  );
}
function EyeOffIcon(props) {
  return React.createElement(
    "svg",
    { ...base, ...props },
    React.createElement("path", { d: "M2 8s2.4-4 6-4 6 4 6 4-2.4 4-6 4-6-4-6-4z", key: "a" }),
    React.createElement("circle", { cx: 8, cy: 8, r: 1.6, key: "b" }),
    React.createElement("path", { d: "M3 3l10 10", key: "c" })
  );
}

// src/client/styles.ts
var SESSION_ID_PLUGIN_ATTR = "session-id";
var SESSION_ID_PART = {
  entry: "entry",
  panel: "panel",
  toolbar: "toolbar",
  search: "search",
  searchScope: "search-scope",
  sort: "sort",
  filter: "filter",
  autoscroll: "autoscroll",
  locate: "locate",
  list: "list",
  row: "row",
  check: "check",
  copy: "copy",
  path: "path",
  jump: "jump",
  parent: "parent",
  subagent: "subagent",
  archive: "archive",
  hide: "hide",
  remove: "remove",
  trash: "trash",
  hiddenArea: "hidden-area",
  group: "group",
  workspace: "workspace",
  more: "more",
  close: "close",
  batch: "batch"
};
var CSS = `
[data-dsh-plugin="${SESSION_ID_PLUGIN_ATTR}"] {
  box-sizing: border-box;
  /* \u8BED\u4E49\u8272\u8C03\uFF08\u5404\u81EA\u5E26\u4E3B\u9898\u53D8\u91CF + \u515C\u5E95\u503C\uFF09 */
  --sid-blue: var(--dsw-alias-brand-primary, #4d6bfe);
  --sid-orange: var(--dsw-alias-state-warning-primary, #d97706);
  --sid-green: var(--dsw-alias-state-success-primary, #16a34a);
  --sid-red: var(--dsw-alias-state-error-primary, #dc2626);
  --sid-cyan: var(--dsw-alias-state-business-primary, #0891b2);
  --sid-neutral: var(--dsw-alias-border-l2, rgba(127,127,127,.28));
  /* \u538B\u5728\u5B9E\u5FC3\u54C1\u724C\u8272\u4E0A\u7684\u6587\u5B57\uFF1A\u6D45\u8272\u4E3B\u9898=\u767D\u3001\u6DF1\u8272\u4E3B\u9898=\u8FD1\u9ED1\u3002\u7981\u5199\u6B7B #fff\uFF08\u6DF1\u8272\u4E0B brand-primary \u662F\u8FD1\u767D\uFF0C\u767D\u5B57\u76F4\u63A5\u770B\u4E0D\u89C1\uFF09\u3002 */
  --sid-on-brand: var(--dsw-alias-label-primary-foreground, #fff);
  /* \u7EDF\u4E00\u63A7\u4EF6\u9AD8\u5EA6\uFF1A\u9876\u90E8\u52A8\u4F5C\u4E0E\u884C\u5185\u52A8\u4F5C\u5404\u4E00\u5957\uFF0C\u4FDD\u8BC1"\u540C\u6392\u540C\u9AD8" */
  --sid-h-top: 30px;
  --sid-h-row: 30px;
}

/* \u2500\u2500 \u4FA7\u8FB9\u680F\u5E95\u90E8\u5165\u53E3 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.sid-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: none;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #6b6b6b);
  cursor: pointer;
  transition: background-color .12s, color .12s, box-shadow .12s;
  font: inherit;
}
.sid-trigger[data-wide="wide"] {
  flex: auto;
  justify-content: flex-start;
  width: auto;
  min-width: 0;
  padding: 0 10px;
  border-radius: 8px;
}
.sid-trigger:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.12));
  color: var(--dsw-alias-label-primary, #1a1a1a);
}
.sid-trigger:active:not(:disabled) { background: var(--dsw-alias-interactive-bg-active, rgba(127,127,127,.18)); }
.sid-trigger:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--dsw-alias-bg-layer-2, transparent), 0 0 0 4px var(--sid-blue);
}
.sid-trigger-label {
  display: none;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 14px;
  line-height: 20px;
}
.sid-trigger[data-wide="wide"] .sid-trigger-label { display: inline; }

/* \u2500\u2500 \u9762\u677F\u9AA8\u67B6 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
/*
 * Windows \u684C\u9762\u7248\u9876\u90E8\u6709\u4E00\u6761 40px \u9AD8\u3001z-index 1100 \u7684\u7A97\u53E3\u6807\u9898\u680F\u5C42\uFF08\u539F\u751F drag \u533A\uFF09\uFF0C
 * \u6211\u7684\u6D6E\u5C42\u662F z-index 1000 \u2014\u2014 \u9762\u677F\u4E00\u65E6\u9876\u5230\u89C6\u53E3\u9876\u90E8\uFF0C\u90A3\u6761\u5C31\u4F1A\u88AB\u5B83\u538B\u4F4F\uFF0C\u8868\u73B0\u4E3A
 * \u300C\u6309\u94AE\u4E0A\u534A\u90E8\u5206\u70B9\u4E0D\u52A8\u300D\u3002\u6240\u4EE5 overlay \u7528 padding-top \u628A\u6574\u5757\u5185\u5BB9\u538B\u5230\u6807\u9898\u680F\u4E0B\u65B9
 * \uFF08\u5B98\u65B9\u7684 settings overlay \u4E5F\u662F\u8FD9\u4E48\u505A\u7684\uFF1A\u7ED9 overlay \u52A0 padding-top\uFF09\u3002
 */
.sid-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--dsh-windows-titlebar-height, 0px) 24px 24px;
}
.sid-mask {
  position: absolute;
  inset: 0;
  background: var(--dsw-alias-bg-mask-1, rgba(0,0,0,.35));
  backdrop-filter: var(--dsw-mask-blur, blur(2px));
}
/* \u56FA\u5B9A\u5C3A\u5BF8\uFF1A\u5185\u5BB9\u591A\u5C11\u90FD\u4E0D\u53D8\uFF08\u5207\u6362\u9690\u85CF\u533A/\u56DE\u6536\u7AD9\u65F6\u9762\u677F\u4E0D\u518D\u7F29\u6210\u5C0F\u6846\uFF09 */
.sid-panel {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 9px;
  box-sizing: border-box;
  /* \u9762\u677F\u5BBD\u5EA6\uFF1A\u7531\u8BBE\u7F6E\u91CC\u7684\u6863\u4F4D\u5199\u8FDB --sid-panel-width\uFF080/\u7F3A\u7701 = \u81EA\u9002\u5E94 92vw\uFF09 */
  width: var(--sid-panel-width, 86vw);
  max-width: 100%;
  height: calc(100vh - var(--dsh-windows-titlebar-height, 0px) - 48px);
  min-height: 480px;
  padding: 14px 18px 14px;
  border-radius: 16px;
  background: var(--dsw-alias-bg-layer-2, #fff);
  color: var(--dsw-alias-label-primary, #1a1a1a);
  box-shadow: var(--dsw-shadow-lv3, 0 12px 40px rgba(0,0,0,.18));
  font-size: 14px;
  line-height: 22px;
}
.sid-header { display: flex; align-items: center; gap: 12px; }
.sid-heading { flex: 1; min-width: 0; }
/* \u6807\u9898\u4E0E\u8BA1\u6570\u540C\u4E00\u884C\uFF08\u7701\u6389\u4E00\u6574\u884C\uFF09 */
.sid-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 26px;
}
.sid-count-inline {
  color: var(--dsw-alias-label-secondary, #6b6b6b);
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  white-space: nowrap;
}
.sid-subtitle { margin-top: 2px; color: var(--dsw-alias-label-secondary, #6b6b6b); font-size: 12px; line-height: 18px; }

/* \u2500\u2500 \u9876\u90E8\u52A8\u4F5C\u6309\u94AE\uFF1A\u9690\u85CF\u533A / \u56DE\u6536\u7AD9 / \u8BBE\u7F6E / \u5173\u95ED \u2014\u2014 \u540C\u4E00\u5C0F\u5C3A\u5BF8\u3001\u540C\u4E00\u547D\u4E2D\u533A \u2500\u2500 */
.sid-head-actions { display: inline-flex; align-items: center; gap: 6px; flex: none; }
.sid-icon-btn,
.sid-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  box-sizing: border-box;
  flex: none;
  min-width: 64px;
  height: var(--sid-h-top);
  padding: 0 10px;
  border: 1px solid var(--sid-neutral);
  border-radius: 9px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #6b6b6b);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
  transition: background-color .12s, color .12s, border-color .12s;
}
.sid-icon-btn:hover,
.sid-close:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.12));
  color: var(--dsw-alias-label-primary, #1a1a1a);
}
.sid-close:hover {
  border-color: var(--sid-red);
  color: var(--sid-red);
  background: color-mix(in srgb, var(--sid-red) 10%, transparent);
}
.sid-icon-btn:focus-visible,
.sid-close:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--dsw-alias-bg-layer-2, transparent), 0 0 0 4px var(--sid-blue);
}
.sid-icon-btn[data-on="true"] {
  color: var(--sid-blue);
  border-color: var(--sid-blue);
  background: color-mix(in srgb, var(--sid-blue) 10%, transparent);
}
.sid-icon-btn[data-tone="trash"]:hover {
  color: var(--sid-orange);
  border-color: var(--sid-orange);
  background: color-mix(in srgb, var(--sid-orange) 10%, transparent);
}
.sid-close-label { white-space: nowrap; }

/* \u2500\u2500 \u8BBE\u7F6E\u6761\uFF1A\u7F51\u683C\u6392\u7248\uFF08\u6807\u7B7E\u5217 + \u63A7\u4EF6\u7EC4\u5217\uFF09\uFF0C\u7D27\u51D1\u4E0D\u6563 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.sid-settings {
  display: block;
  flex: none;
  padding: 10px 12px;
  border: 1px solid var(--sid-neutral);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1, rgba(127,127,127,.05));
  font-size: 13px;
}
.sid-settings-grid { display: grid; grid-template-columns: 72px 1fr; gap: 8px 10px; align-items: center; }
.sid-settings-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
/* \u7EC4\u5185\u7EB5\u5411\u5806\u4E24\u884C\uFF08\u9762\u677F\u5BBD\u5EA6\uFF1A\u81EA\u9002\u5E94\u4E00\u884C\u3001\u56FA\u5B9A\u4E00\u884C\uFF09 */
.sid-settings-stack { flex-direction: column; align-items: flex-start; gap: 6px; }
.sid-settings-line { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
/* \u8BBE\u7F6E\u91CC\u7684\u5F00\u5173\u6536\u4E00\u53F7\uFF1A\u4E00\u884C\u80FD\u653E\u4E0B\u8BE5\u9879\u7684\u5168\u90E8\u5F00\u5173 */
.sid-settings .sid-action { height: 26px; padding: 0 6px; gap: 4px; font-size: 12px; }
/* \u9884\u8BBE\u5C0F\u6309\u94AE\uFF1A\u70B9\u4E00\u4E0B\u5C31\u628A\u503C\u586B\u8FDB\u65C1\u8FB9\u7684\u8F93\u5165\u6846\uFF08"\u53EF\u9009"\uFF09 */
.sid-chip {
  flex: none;
  height: 24px;
  padding: 0 9px;
  border: 1px solid var(--sid-neutral);
  border-radius: 12px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #6b6b6b);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  line-height: 22px;
}
.sid-chip:hover { border-color: var(--sid-blue); color: var(--sid-blue); }
.sid-chip[data-on="true"] {
  border-color: var(--sid-blue);
  color: var(--sid-blue);
  background: color-mix(in srgb, var(--sid-blue) 10%, transparent);
}
.sid-settings-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.sid-settings-label { color: var(--dsw-alias-label-secondary, #6b6b6b); font-size: 12px; }
/* \u8BBE\u7F6E\u91CC\u7684\u6570\u5B57\u8F93\u5165\uFF1A\u7A84\u6846\uFF08\u6700\u591A\u653E 4 \u4F4D\u6570\uFF09\uFF0C\u65C1\u8FB9\u7684 chip \u7ED9\u9884\u8BBE */
.sid-num {
  flex: none;
  width: 58px;
  height: 26px;
  padding: 0 4px;
  border: 1px solid var(--sid-neutral);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1, transparent);
  color: inherit;
  font: inherit;
  font-size: 13px;
  text-align: center;
}
.sid-num:focus { outline: none; border-color: var(--sid-blue); }
.sid-num:disabled { opacity: .5; }
.sid-settings-hint { flex: none; color: var(--dsw-alias-label-tertiary, #8a8a8a); font-size: 11px; }
.sid-settings-row .sid-select { padding: 5px 8px; font-size: 12px; }

/* \u2500\u2500 \u6279\u91CF\u64CD\u4F5C\u6761\uFF1A\u5E38\u9A7B\u663E\u793A\uFF08\u4E0D\u518D\u7B49\u52FE\u9009\u624D\u51FA\u73B0\uFF09\uFF0C\u5355\u884C\u4E0D\u6362\u884C \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.sid-batch {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding: 5px 10px;
  border: 1px solid var(--sid-neutral);
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1, rgba(127,127,127,.05));
}
/* \u6761\u5185\u6309\u94AE\u4E0E\u5DE5\u5177\u680F\u540C\u9AD8\u540C\u5B57\u53F7\uFF08\u4E24\u884C\u89C6\u89C9\u4E00\u81F4\uFF09\uFF0C\u5E76\u53BB\u6389\u56FE\u6807\u817E\u51FA\u5BBD\u5EA6 */
.sid-batch .sid-action { height: 30px; padding: 0 7px; gap: 0; font-size: 13px; }
.sid-batch[data-active="true"] {
  border-color: var(--sid-blue);
  background: color-mix(in srgb, var(--sid-blue) 8%, transparent);
}
.sid-batch-count { flex: none; color: var(--dsw-alias-label-secondary, #6b6b6b); font-size: 12px; white-space: nowrap; }
/* \u8BA1\u6570 / \u5168\u9009\u63D0\u793A\uFF1A\u63A8\u5230\u6700\u53F3 */
.sid-batch-tail { margin-left: auto; }
.sid-batch[data-active="true"] .sid-batch-count { color: var(--sid-blue); font-weight: 500; }

/* \u2500\u2500 \u5206\u7EC4\u89C6\u56FE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.sid-group { display: flex; flex-direction: column; gap: 6px; }
.sid-group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0 0;
  padding: 0 4px;
  color: var(--dsw-alias-label-secondary, #6b6b6b);
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
}
.sid-group-title[data-ungrouped="true"] { color: var(--sid-cyan); }
.sid-group-count { color: var(--dsw-alias-label-tertiary, #8a8a8a); font-weight: 400; }

/*
 * \u5DE5\u5177\u680F\uFF1A\u5F3A\u5236\u4E00\u884C\uFF08\u641C\u7D22\u6846\u662F\u552F\u4E00\u53EF\u538B\u7F29\u9879\uFF0C\u5B81\u53EF\u5B83\u53D8\u7A84\u4E5F\u4E0D\u6362\u884C\uFF09\u3002
 *
 * flex: none \u5FC5\u987B\u5199 \u2014\u2014 \u9762\u677F\u662F\u56FA\u5B9A\u9AD8\u5EA6\u7684\u7EB5\u5411 flex \u5BB9\u5668\uFF0C\u5DE5\u5177\u680F/\u6279\u91CF\u6761\u82E5\u53EF\u6536\u7F29\uFF0C
 * \u5185\u5BB9\u4E00\u591A\u5C31\u4F1A\u88AB\u6309\u6BD4\u4F8B\u538B\u6241\uFF08\u8868\u73B0\u4E3A\u6309\u94AE\u6587\u5B57\u88AB\u88C1\u6389\u4E00\u534A\uFF09\u3002\u53EA\u6709\u5217\u8868\u9762\u677F\u8BE5\u5438\u6536\u6536\u7F29\u3002
 */
.sid-toolbar { display: flex; align-items: center; gap: 6px; flex: none; flex-wrap: nowrap; overflow-x: auto; }
.sid-search {
  flex: 1 1 90px;
  min-width: 44px;
  height: var(--sid-h-top);
  padding: 0 10px;
  border: 1px solid var(--sid-neutral);
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1, transparent);
  color: inherit;
  font: inherit;
  font-size: 13px;
}
.sid-search:focus { outline: none; border-color: var(--sid-blue); }
/* \u5DE5\u5177\u680F\u91CC\u7684\u52A8\u4F5C\u6309\u94AE\uFF08\u5B9A\u4F4D\u5F53\u524D\uFF09\u4E5F\u6536\u4E00\u53F7\uFF0C\u7ED9\u641C\u7D22\u6846\u817E\u5730\u65B9 */
.sid-toolbar .sid-action { padding: 0 7px; }
.sid-select {
  flex: none;
  max-width: 150px;
  height: var(--sid-h-top);
  padding: 0 6px;
  border: 1px solid var(--sid-neutral);
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1, transparent);
  color: inherit;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.sid-select:focus { outline: none; border-color: var(--sid-blue); }
/*
 * \u5DE5\u5177\u680F\u91CC\u7684\u4E0B\u62C9\u7EDF\u4E00\u56FA\u5B9A\u5BBD\u5EA6\u3002
 *
 * \u5173\u952E\uFF1A\u5149\u6709 width \u6CA1\u7528 \u2014\u2014 select \u4F5C\u4E3A flex item \u9ED8\u8BA4 min-width: auto\uFF0C
 * \u5B83\u7B49\u4E8E\u300C\u6700\u957F option \u7684 min-content \u5BBD\u5EA6\u300D\uFF0C\u4F1A\u628A width \u53CD\u8FC7\u6765\u6491\u5F00\uFF08\u5DE5\u4F5C\u533A\u540D/\u8DEF\u5F84
 * \u4E00\u957F\u5C31\u6491\u6B6A\u6574\u884C\uFF09\u3002\u6240\u4EE5\u5FC5\u987B\u663E\u5F0F min-width: 0 + max-width \u4E00\u8D77\u9501\u6B7B\u3002
 *
 * \u6CE8\u610F\uFF1A\u672C\u6587\u4EF6\u91CC\u7684 CSS \u662F\u6A21\u677F\u5B57\u7B26\u4E32\uFF0CCSS \u6CE8\u91CA\u5185\u7EDD\u4E0D\u80FD\u518D\u51FA\u73B0\u53CD\u5F15\u53F7
 * \uFF08\u4F1A\u63D0\u524D\u7ED3\u675F\u5B57\u7B26\u4E32\uFF0C\u5386\u53F2\u4E8B\u6545\uFF1A\u6574\u9875 import failed\uFF09\u3002scripts/check.mjs \u5DF2\u52A0 lint \u62E6\u5B83\u3002
 */
.sid-toolbar .sid-select { width: 108px; min-width: 0; max-width: 108px; }
/* \u641C\u7D22\u8303\u56F4\u4E0B\u62C9\uFF1A\u9009\u9879\u77ED\uFF08\u5168\u90E8 / ID / \u540D\u79F0\uFF09\uFF0C\u518D\u7A84\u4E00\u70B9\u7ED9\u641C\u7D22\u6846\u817E\u5730\u65B9 */
.sid-toolbar .sid-select-narrow { width: 84px; min-width: 0; max-width: 84px; }
.sid-count { flex: none; margin-left: auto; color: var(--dsw-alias-label-secondary, #6b6b6b); font-size: 12px; white-space: nowrap; }

/* \u2500\u2500 \u5217\u8868 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.sid-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  /* \u5217\u8868\u662F\u552F\u4E00\u5438\u6536\u6536\u7F29\u7684\u5143\u7D20\uFF1A\u9762\u677F\u9AD8\u5EA6\u56FA\u5B9A\uFF0C\u591A\u51FA\u6765\u7684\u7A7A\u95F4\u5F52\u5217\u8868\u5E76\u8BA9\u5B83\u81EA\u5DF1\u6EDA\u52A8 */
  flex: 1 1 auto;
  min-height: 80px;
  overflow-y: auto;
  margin: 0 -4px;
  padding: 0 4px;
}
.sid-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: var(--dsw-alias-bg-layer-1, rgba(127,127,127,.06));
  transition: background-color .12s, border-color .12s;
  /* \u957F\u5217\u8868\u7684\u5173\u952E\uFF1A\u89C6\u53E3\u5916\u7684\u884C\u8DF3\u8FC7\u6E32\u67D3\u4E0E\u5E03\u5C40 */
  content-visibility: auto;
  contain-intrinsic-size: auto 76px;
}
/* \u884C\u672C\u4F53\uFF08\u9664\u6587\u5B57\u533A\uFF09\u53EF\u70B9\u8DF3\u8F6C\uFF1A\u7A7A\u767D\u5904 cursor \u662F pointer\uFF0C\u53EA\u6709\u771F\u6B63\u6709\u5B57\u7684\u8282\u70B9\u662F text */
.sid-row[data-clickable="true"] { cursor: pointer; }
.sid-row[data-clickable="true"]:hover { border-color: color-mix(in srgb, var(--sid-cyan) 45%, transparent); }
.sid-row[data-active="true"] {
  /* \u5F53\u524D\u4F1A\u8BDD\uFF1A\u5E38\u9A7B\u84DD\u8272\u5DE6\u8FB9\u6846\uFF08\u5217\u8868\u91CC\u59CB\u7EC8\u6709\u4E00\u70B9\u989C\u8272\u63D0\u793A\uFF09 */
  border-color: var(--sid-blue);
  box-shadow: inset 3px 0 0 0 var(--sid-blue);
}
.sid-row[data-selected="true"] {
  border-color: var(--sid-blue);
  background: color-mix(in srgb, var(--sid-blue) 10%, transparent);
}
/* \u5B50\u4EE3\u7406\u884C\uFF1A\u5DE6\u4FA7\u4E00\u6761\u9752\u7EBF\uFF0C\u63D0\u793A\u5B83\u4E0D\u662F\u666E\u901A\u4F1A\u8BDD */
.sid-row[data-subagent="true"] { border-left: 3px solid color-mix(in srgb, var(--sid-cyan) 55%, transparent); }

/*
 * \u52FE\u9009\u5217\uFF1A\u6574\u5217\u6491\u6EE1\u884C\u9AD8\uFF08align-self: stretch\uFF09\uFF0C\u70B9\u51FB\u4E00\u5F8B\u541E\u6389\u4E0D\u5192\u6CE1\u3002
 * \u4E0A\u4E00\u7248\u662F 24px \u7684\u5C0F\u65B9\u5757\uFF0C\u884C\u6BD4\u5B83\u9AD8\uFF0C\u52FE\u9009\u6846\u4E0A\u4E0B\u90A3\u6761\u4ECD\u5C5E\u4E8E\u884C\u672C\u4F53\u2014\u2014
 * \u60F3\u70B9\u52FE\u9009\u3001\u70B9\u504F\u4E00\u70B9\u5C31\u8DF3\u5230\u522B\u7684\u4F1A\u8BDD\u3002\u73B0\u5728\u6574\u5217\u90FD\u5F52\u52FE\u9009\u5217\uFF0C\u70B9\u7A7A\u767D\u65E2\u4E0D\u8DF3\u8F6C\u4E5F\u4E0D\u52FE\u9009\u3002
 */
.sid-row-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  flex: none;
  width: 24px;
  padding: 0;
  cursor: default;
}
.sid-row-check input {
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
  accent-color: var(--sid-blue);
}

/* \u6587\u5B57\u533A\uFF1A\u6309\u5185\u5BB9\u5360\u5BBD\uFF0C**\u4E0D\u8BBE\u4E0A\u9650**\u2014\u2014\u5DE6\u5217\u4E00\u76F4\u94FA\u5230\u53F3\u8FB9\u6309\u94AE\u4E3A\u6B62\uFF08\u7528\u6237\u8981\u6C42\u4E0D\u7559\u7A7A\u767D\uFF09 */
.sid-row-info { display: flex; flex-direction: column; gap: 2px; flex: 1 1 auto; min-width: 0; }
.sid-row-line { display: flex; align-items: center; gap: 6px; min-width: 0; }
.sid-row-title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: 500;
  cursor: text;
}
.sid-row-title[data-active="true"] { color: var(--sid-blue); }
/* \u4F1A\u8BDD ID\uFF1A**\u6C38\u8FDC\u5355\u884C**\uFF0C\u8D85\u51FA\u7528\u7701\u7565\u53F7\uFF08\u5B8C\u6574 ID \u7528\u884C\u5185\u300CID\u300D\u952E\u590D\u5236\uFF09 */
.sid-row-id {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow-wrap: normal;
  color: var(--dsw-alias-label-secondary, #6b6b6b);
  font-family: var(--dsw-font-family-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 12px;
  line-height: 18px;
  user-select: text;
  cursor: text;
}
/* \u66F4\u65B0\u65F6\u95F4\uFF1A\u72EC\u7ACB\u4E00\u884C\uFF0C\u8DDF\u5728\u4F1A\u8BDD ID \u4E0B\u9762 */
/*
 * \u6CE8\u610F align-self: flex-start \u2014\u2014 \u8FD9\u4E24\u884C\u662F .sid-row-info\uFF08\u7EB5\u5411 flex\uFF09\u7684\u76F4\u63A5\u5B50\u9879\uFF0C
 * \u9ED8\u8BA4 stretch \u4F1A\u628A\u5B83\u4EEC\u6491\u6EE1\u6574\u5217\u5BBD\u5EA6\uFF1A\u6587\u5B57\u53EA\u5360\u524D\u4E00\u5C0F\u6BB5\uFF0C\u53F3\u8FB9\u90A3\u4E00\u5927\u7247\u4ECD\u5C5E\u4E8E\u8FD9\u4E2A span
 * \uFF08\u4E8E\u662F\u663E\u793A I \u578B\u5149\u6807\u3001\u4E14\u70B9\u5B83\u88AB\u5F53\u4F5C"\u6587\u5B57\u533A"\uFF09\u3002\u6539\u6210\u6309\u5185\u5BB9\u5BBD\u5EA6\u6536\u7F29\u540E\uFF0C\u53F3\u4FA7\u7A7A\u767D\u624D
 * \u771F\u6B63\u9732\u51FA\u6765\uFF0C\u5F52\u884C\u672C\u4F53\uFF08\u624B\u578B\u5149\u6807\u3001\u53EF\u70B9\u8DF3\u8F6C\uFF09\u3002
 *
 * \u26A0\uFE0F \u672C\u6587\u4EF6\u91CC\u7684 CSS \u662F\u4E00\u4E2A\u6A21\u677F\u5B57\u7B26\u4E32\uFF1A**CSS \u6CE8\u91CA\u5185\u7EDD\u4E0D\u80FD\u518D\u51FA\u73B0\u53CD\u5F15\u53F7**\uFF0C
 * \u5426\u5219\u4F1A\u63D0\u524D\u7ED3\u675F\u6A21\u677F\u5B57\u7B26\u4E32\uFF0C\u540E\u9762\u7684 CSS \u4F1A\u88AB\u5F53\u6210 JS \u8868\u8FBE\u5F0F\u6C42\u503C\uFF08\u5386\u53F2\u4E0A\u56E0\u6B64
 * \u51FA\u73B0\u8FC7 "row is not defined" \u8FD9\u79CD\u6574\u9875 import \u5931\u8D25\uFF09\u3002scripts/check.mjs \u4F1A\u62E6\u3002
 */
.sid-row-time {
  align-self: flex-start;
  color: var(--dsw-alias-label-secondary, #6b6b6b);
  font-size: 11px;
  line-height: 16px;
  opacity: .85;
  cursor: text;
}

.sid-badge {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0 6px;
  border-radius: 6px;
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
}
.sid-badge-current { background: var(--sid-blue); color: var(--sid-on-brand); }
.sid-badge-archived {
  background: color-mix(in srgb, var(--sid-orange) 14%, transparent);
  color: var(--sid-orange);
  border: 1px solid color-mix(in srgb, var(--sid-orange) 40%, transparent);
}
.sid-badge-hidden {
  background: color-mix(in srgb, var(--sid-neutral) 22%, transparent);
  color: var(--dsw-alias-label-secondary, #6b6b6b);
  border: 1px solid color-mix(in srgb, var(--sid-neutral) 60%, transparent);
}
.sid-badge-subagent {
  background: color-mix(in srgb, var(--sid-cyan) 14%, transparent);
  color: var(--sid-cyan);
  border: 1px solid color-mix(in srgb, var(--sid-cyan) 45%, transparent);
}

.sid-row-actions { display: inline-flex; align-items: center; gap: 6px; flex: none; }

/* \u2500\u2500 \u884C\u5185\u52A8\u4F5C\u6309\u94AE\uFF1A\u5C0F\u5C3A\u5BF8\u3001\u540C\u6392\u540C\u9AD8\uFF1B\u5F52\u6863/\u53D6\u6D88\u5F52\u6863\u7B49\u957F \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.sid-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-sizing: border-box;
  flex: none;
  height: var(--sid-h-row);
  padding: 0 8px;
  border: 1px solid var(--sid-neutral);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  line-height: 18px;
  white-space: nowrap;
  transition: background-color .12s, color .12s, border-color .12s;
}
/* \u5F52\u6863 / \u53D6\u6D88\u5F52\u6863\uFF1A\u5404\u6309\u81EA\u5DF1\u7684\u6587\u5B57\u5BBD\u5EA6\uFF0C\u4E0D\u5F3A\u884C\u7B49\u5BBD\uFF082 \u5B57\u7684\u300C\u5F52\u6863\u300D\u5C31\u8BE5\u6BD4 4 \u5B57\u7684\u7A84\uFF09 */
.sid-action:disabled { opacity: .55; cursor: not-allowed; }

.sid-action[data-tone="copy"]:hover {
  color: var(--sid-blue); border-color: var(--sid-blue);
  background: color-mix(in srgb, var(--sid-blue) 10%, transparent);
}
.sid-action[data-tone="archive"]:hover {
  color: var(--sid-orange); border-color: var(--sid-orange);
  background: color-mix(in srgb, var(--sid-orange) 10%, transparent);
}
.sid-action[data-tone="unarchive"]:hover {
  color: var(--sid-green); border-color: var(--sid-green);
  background: color-mix(in srgb, var(--sid-green) 10%, transparent);
}
.sid-action[data-tone="danger"]:hover:not(:disabled),
.sid-action[data-tone="danger"]:focus-visible {
  color: var(--sid-red); border-color: var(--sid-red);
  background: color-mix(in srgb, var(--sid-red) 10%, transparent);
}
.sid-action[data-tone="locate"]:hover {
  color: var(--sid-cyan); border-color: var(--sid-cyan);
  background: color-mix(in srgb, var(--sid-cyan) 10%, transparent);
}
.sid-action[data-tone="neutral"]:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.12)); }
/* \u5F53\u6807\u7B7E\u7528\u5F97\uFF08\u8BBE\u7F6E\u91CC\u7684\u590D\u9009\u5F00\u5173\uFF09\uFF1A\u9009\u4E2D\u6001\u4E0A\u8272 */
.sid-action[data-on="true"] {
  border-color: var(--sid-blue);
  color: var(--sid-blue);
  background: color-mix(in srgb, var(--sid-blue) 10%, transparent);
}

.sid-action[data-copied="true"] {
  border-color: var(--sid-green);
  color: var(--sid-green);
  background: color-mix(in srgb, var(--sid-green) 10%, transparent);
}
.sid-action[data-failed="true"] {
  border-color: var(--sid-red);
  color: var(--sid-red);
  background: color-mix(in srgb, var(--sid-red) 10%, transparent);
}
.sid-action[data-done="true"] {
  border-color: var(--sid-green);
  color: var(--sid-green);
  background: color-mix(in srgb, var(--sid-green) 10%, transparent);
}

.sid-confirm {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: none;
  padding: 2px 4px 2px 8px;
  border: 1px solid var(--sid-red);
  border-radius: 9px;
  background: color-mix(in srgb, var(--sid-red) 8%, transparent);
  font-size: 12px;
  line-height: 18px;
  color: var(--sid-red);
  white-space: nowrap;
}

.sid-empty { padding: 32px 0; color: var(--dsw-alias-label-secondary, #6b6b6b); text-align: center; }
.sid-more {
  align-self: center;
  margin: 8px 0 2px;
  padding: 8px 16px;
  border: 1px dashed var(--sid-neutral);
  border-radius: 10px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #6b6b6b);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
}
.sid-more:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.12)); color: var(--sid-blue); border-color: var(--sid-blue); }
.sid-error {
  padding: 6px 10px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--sid-red) 12%, transparent);
  color: var(--sid-red);
  font-size: 12px;
}
.sid-hint {
  padding: 5px 10px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--sid-cyan) 12%, transparent);
  color: var(--sid-cyan);
  font-size: 12px;
}

/* \u56DE\u6536\u7AD9\u89C6\u56FE\u590D\u7528\u4F1A\u8BDD\u884C\u7684 .sid-row \u7ED3\u6784\uFF0C\u4E0D\u53E6\u7ACB\u6837\u5F0F\u3002 */
`;
function installStyles() {
  for (const stale of Array.from(document.querySelectorAll(`style[data-plugin="${SESSION_ID_PLUGIN_ATTR}"]`))) {
    stale.remove();
  }
  const style = document.createElement("style");
  style.dataset.plugin = SESSION_ID_PLUGIN_ATTR;
  style.dataset.rev = "1.8.0";
  style.textContent = CSS;
  document.head.appendChild(style);
  return () => {
    style.remove();
  };
}

// src/client/report.ts
var REPORT_PATH = "/api/session-id/report";
async function report(phase, extra = {}) {
  try {
    const body = JSON.stringify({
      phase,
      at: Date.now(),
      url: typeof location === "undefined" ? "" : location.href,
      ...extra
    });
    const response = await fetch(REPORT_PATH, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true
    });
    if (!response.ok) return void 0;
    return await response.json();
  } catch {
    return void 0;
  }
}

// src/client/panel.tsx
var DEFAULT_PANEL_WIDTH = 860;
var DEFAULT_AUTO_WIDTH_PERCENT = 80;
var PANEL_WIDTH_RANGE = { min: 560, max: 4e3 };
var AUTO_WIDTH_RANGE = { min: 40, max: 100 };
function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}
function panelWidthCss(settings) {
  return settings.autoWidth ? `${clamp(settings.autoWidthPercent, AUTO_WIDTH_RANGE.min, AUTO_WIDTH_RANGE.max)}vw` : `${clamp(settings.panelWidth, PANEL_WIDTH_RANGE.min, PANEL_WIDTH_RANGE.max)}px`;
}
var UNGROUPED_KEY = "__ungrouped__";
var DEFAULT_SETTINGS = {
  defaultFilter: "all",
  lastFilter: "all",
  searchScope: "all",
  subagentFilter: "all",
  workspaceFilter: "",
  deleteMode: "trash",
  deleteNoConfirm: false,
  purgeNoConfirm: false,
  closeOnOpen: true,
  autoLocate: true,
  grouped: false,
  autoWidth: false,
  panelWidth: DEFAULT_PANEL_WIDTH,
  autoWidthPercent: DEFAULT_AUTO_WIDTH_PERCENT
};
var EMPTY_IDS = /* @__PURE__ */ new Set();
function noopSubscribe() {
  return () => {
  };
}
var INITIAL_ROWS = 60;
var ROW_PAGE = 200;
var MAX_ROWS = 2e3;
function currentSessionId(list) {
  if (typeof list.current === "string" && list.current !== "") return list.current;
  for (const id of list.ids ?? []) {
    const row = list.byId[id];
    if (row !== void 0 && (row.retainedBy?.mainView ?? 0) > 0) return id;
  }
  return void 0;
}
function relativeTimeLabel(updatedAt, now, t) {
  const diff = Math.max(0, now - updatedAt);
  const minute = 6e4;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return String(t("panel.time.now"));
  if (diff < hour) return String(t("panel.time.minutes", { n: Math.floor(diff / minute) }));
  if (diff < day) return String(t("panel.time.hours", { n: Math.floor(diff / hour) }));
  return String(t("panel.time.days", { n: Math.floor(diff / day) }));
}
function sortRows(rows, mode) {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    if (a.blank === true !== (b.blank === true)) return a.blank === true ? 1 : -1;
    if (mode === "title") {
      return (a.displayTitle ?? a.id).toLowerCase().localeCompare((b.displayTitle ?? b.id).toLowerCase());
    }
    const delta = (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
    return mode === "updatedAsc" ? -delta : delta;
  });
  return sorted;
}
function filterAllows(filter, archived) {
  if (filter === "hideArchived") return !archived;
  if (filter === "onlyArchived") return archived;
  return true;
}
function subagentAllows(filter, isSubagent) {
  if (filter === "hide") return !isSubagent;
  if (filter === "only") return isSubagent;
  return true;
}
function isSubagentRow(row) {
  return row.origin === "subagent";
}
function titleOf(row) {
  return row.displayTitle !== void 0 && row.displayTitle !== "" ? row.displayTitle : row.id;
}
function plainCopyText(rows, kind) {
  return rows.map((row) => kind === "id" ? row.id : titleOf(row)).join("\n");
}
async function copyToClipboard(rows, kind, pathsOf) {
  if (rows.length === 0) return false;
  let text;
  if (kind === "path") {
    let map = {};
    try {
      if (pathsOf !== void 0) map = await pathsOf(rows.map((row) => row.id));
    } catch {
      map = {};
    }
    text = rows.map((row) => map[row.id] ?? row.id).join("\n");
  } else {
    text = plainCopyText(rows, kind);
  }
  let ok = false;
  try {
    ok = await (0, import_dsh_client_ui_primitives.writeClipboard)(text);
  } catch {
    ok = false;
  }
  report(ok ? `copied-${kind}` : `copy-${kind}-failed`, { count: rows.length });
  return ok;
}
function SessionRow({ session, isCurrent, isArchived, isHidden, isSubagent, selected, actions, hidden, settings, canDelete, onToggleSelect, onClose, t }) {
  const [copyStatus, setCopyStatus] = React2.useState(void 0);
  const [confirming, setConfirming] = React2.useState(false);
  const [status, setStatus] = React2.useState("idle");
  const title = titleOf(session);
  const updatedAt = session.updatedAt;
  const timeLabel = updatedAt === void 0 ? void 0 : String(t("panel.updatedAt", { t: relativeTimeLabel(updatedAt, Date.now(), t) }));
  const stop = (event) => {
    event.stopPropagation();
  };
  const handleCopy = (kind) => {
    void copyToClipboard([session], kind, actions.paths).then((ok) => {
      setCopyStatus(ok ? kind : "failed");
      window.setTimeout(() => {
        setCopyStatus(void 0);
      }, 1200);
    });
  };
  const runDelete = (purge) => {
    if (actions.remove === void 0 || status === "busy") return;
    setStatus("busy");
    void actions.remove(session.id, purge).then((result) => {
      if (result.ok) {
        setStatus("done");
        setConfirming(false);
        report(purge ? "deleted-purge" : "deleted-trash", { sessionId: session.id });
      } else {
        setStatus("failed");
        report("delete-failed", { sessionId: session.id, message: result.message ?? "" });
      }
    }).catch(() => {
      setStatus("failed");
    });
  };
  const handleDeleteClick = () => {
    setStatus("idle");
    if (settings.deleteNoConfirm) runDelete(settings.deleteMode === "purge");
    else setConfirming(true);
  };
  const handleArchiveToggle = () => {
    const action = isArchived ? actions.unarchive : actions.archive;
    if (action === void 0 || status === "busy") return;
    setStatus("busy");
    void action(session.id).then((result) => {
      if (result.ok) {
        setStatus(isArchived ? "unarchived" : "archived");
        report(isArchived ? "unarchived" : "archived", { sessionId: session.id });
        window.setTimeout(() => {
          setStatus("idle");
        }, 1500);
      } else {
        setStatus("failed");
        report("archive-failed", { sessionId: session.id, message: result.message ?? "" });
      }
    }).catch(() => {
      setStatus("failed");
    });
  };
  const handleRowClick = () => {
    if (actions.open === void 0) return;
    try {
      const selection = window.getSelection();
      if (selection !== null && selection !== void 0 && selection.toString() !== "") return;
    } catch {
    }
    actions.open(session.id);
    report("jumped", { sessionId: session.id });
    if (settings.closeOnOpen) onClose();
  };
  const copyTone = (kind) => copyStatus === kind ? "true" : void 0;
  const clickable = actions.open !== void 0;
  return /* @__PURE__ */ React2.createElement(
    "div",
    {
      className: "sid-row",
      "data-dsh-part": SESSION_ID_PART.row,
      "data-active": isCurrent ? "true" : void 0,
      "data-selected": selected ? "true" : void 0,
      "data-hidden": isHidden ? "true" : void 0,
      "data-subagent": isSubagent ? "true" : void 0,
      "data-clickable": clickable ? "true" : "false",
      title: clickable ? String(t("panel.jumpHint")) : void 0,
      onClick: clickable ? handleRowClick : void 0
    },
    /* @__PURE__ */ React2.createElement("div", { className: "sid-row-check", onClick: stop }, /* @__PURE__ */ React2.createElement(
      "input",
      {
        type: "checkbox",
        "data-dsh-part": SESSION_ID_PART.check,
        checked: selected,
        onChange: () => {
          onToggleSelect(session.id);
        }
      }
    )),
    /* @__PURE__ */ React2.createElement("span", { className: "sid-row-info" }, /* @__PURE__ */ React2.createElement("span", { className: "sid-row-line" }, /* @__PURE__ */ React2.createElement("span", { className: "sid-row-title", "data-active": isCurrent ? "true" : void 0, title }, title), isCurrent ? /* @__PURE__ */ React2.createElement("span", { className: "sid-badge sid-badge-current" }, t("panel.current")) : null, isSubagent ? /* @__PURE__ */ React2.createElement("span", { className: "sid-badge sid-badge-subagent" }, /* @__PURE__ */ React2.createElement(SubagentIcon, { width: 11, height: 11 }), t("panel.subagent")) : null, isArchived ? /* @__PURE__ */ React2.createElement("span", { className: "sid-badge sid-badge-archived" }, /* @__PURE__ */ React2.createElement(ArchiveIcon, { width: 11, height: 11 }), t("panel.archived")) : null, isHidden ? /* @__PURE__ */ React2.createElement("span", { className: "sid-badge sid-badge-hidden" }, /* @__PURE__ */ React2.createElement(EyeOffIcon, { width: 11, height: 11 }), t("panel.hide")) : null), /* @__PURE__ */ React2.createElement("span", { className: "sid-row-line" }, /* @__PURE__ */ React2.createElement("span", { className: "sid-row-id", title: session.id }, session.id)), timeLabel === void 0 ? null : /* @__PURE__ */ React2.createElement("span", { className: "sid-row-time" }, timeLabel)),
    /* @__PURE__ */ React2.createElement("span", { className: "sid-row-actions", onClick: stop }, /* @__PURE__ */ React2.createElement(
      "button",
      {
        type: "button",
        className: "sid-action",
        "data-tone": "copy",
        "data-copied": copyTone("id"),
        title: String(t("panel.copyIdTitle")),
        onClick: () => {
          handleCopy("id");
        }
      },
      copyStatus === "id" ? /* @__PURE__ */ React2.createElement(CheckIcon, { width: 12, height: 12 }) : /* @__PURE__ */ React2.createElement(CopyIcon, { width: 12, height: 12 }),
      t("panel.copyId")
    ), /* @__PURE__ */ React2.createElement(
      "button",
      {
        type: "button",
        className: "sid-action",
        "data-tone": "copy",
        "data-copied": copyTone("name"),
        title: String(t("panel.copyNameTitle")),
        onClick: () => {
          handleCopy("name");
        }
      },
      copyStatus === "name" ? /* @__PURE__ */ React2.createElement(CheckIcon, { width: 12, height: 12 }) : /* @__PURE__ */ React2.createElement(CopyIcon, { width: 12, height: 12 }),
      t("panel.copyName")
    ), /* @__PURE__ */ React2.createElement(
      "button",
      {
        type: "button",
        className: "sid-action",
        "data-tone": "copy",
        "data-copied": copyTone("path"),
        "data-dsh-part": SESSION_ID_PART.copy,
        title: String(t("panel.copyPathTitle")),
        onClick: () => {
          handleCopy("path");
        }
      },
      copyStatus === "path" ? /* @__PURE__ */ React2.createElement(CheckIcon, { width: 12, height: 12 }) : /* @__PURE__ */ React2.createElement(CopyIcon, { width: 12, height: 12 }),
      t("panel.copyPath")
    ), (isArchived ? actions.unarchive : actions.archive) !== void 0 ? /* @__PURE__ */ React2.createElement(
      "button",
      {
        type: "button",
        className: "sid-action",
        "data-tone": isArchived ? "unarchive" : "archive",
        "data-dsh-part": SESSION_ID_PART.archive,
        "data-done": status === "archived" || status === "unarchived" ? "true" : void 0,
        title: String(isArchived ? t("panel.unarchiveTitle") : t("panel.archiveTitle")),
        disabled: status === "busy",
        onClick: handleArchiveToggle
      },
      /* @__PURE__ */ React2.createElement(ArchiveIcon, { width: 12, height: 12 }),
      isArchived ? t("panel.unarchive") : t("panel.archive")
    ) : null, hidden !== void 0 ? /* @__PURE__ */ React2.createElement(
      "button",
      {
        type: "button",
        className: "sid-action",
        "data-tone": isHidden ? "unarchive" : "neutral",
        "data-dsh-part": SESSION_ID_PART.hide,
        title: String(isHidden ? t("panel.unhideTitle") : t("panel.hideTitle")),
        onClick: () => {
          hidden.toggle(session.id);
          report(isHidden ? "unhidden" : "hidden", { sessionId: session.id });
        }
      },
      /* @__PURE__ */ React2.createElement(EyeOffIcon, { width: 12, height: 12 }),
      isHidden ? t("panel.unhide") : t("panel.hide")
    ) : null, canDelete && actions.remove !== void 0 ? confirming ? /* @__PURE__ */ React2.createElement("span", { className: "sid-confirm" }, t("panel.deleteConfirm"), /* @__PURE__ */ React2.createElement("button", { type: "button", className: "sid-action", "data-tone": "danger", "data-dsh-part": SESSION_ID_PART.remove, disabled: status === "busy", onClick: () => {
      runDelete(false);
    } }, t("panel.deleteTrash")), /* @__PURE__ */ React2.createElement("button", { type: "button", className: "sid-action", "data-tone": "danger", disabled: status === "busy", onClick: () => {
      runDelete(true);
    } }, t("panel.deletePurge")), /* @__PURE__ */ React2.createElement("button", { type: "button", className: "sid-action", "data-tone": "neutral", onClick: () => {
      setConfirming(false);
      setStatus("idle");
    } }, t("panel.deleteNo"))) : /* @__PURE__ */ React2.createElement(
      "button",
      {
        type: "button",
        className: "sid-action",
        "data-tone": "danger",
        "data-dsh-part": SESSION_ID_PART.remove,
        "data-done": status === "done" ? "true" : void 0,
        "data-failed": status === "failed" ? "true" : void 0,
        title: String(status === "failed" ? t("panel.deleteFailed") : t("panel.deleteHint")),
        disabled: status === "busy" || status === "done",
        onClick: handleDeleteClick
      },
      status === "done" ? /* @__PURE__ */ React2.createElement(CheckIcon, { width: 12, height: 12 }) : /* @__PURE__ */ React2.createElement(TrashIcon, { width: 12, height: 12 }),
      status === "done" ? t("panel.deleted") : t("panel.delete")
    ) : null)
  );
}
function TrashRow({ item, title, selected, busy, onToggleSelect, onRestore, onPurge, t }) {
  const stop = (event) => {
    event.stopPropagation();
  };
  const timeLabel = item.at === void 0 ? void 0 : new Date(item.at).toLocaleString();
  const idText = item.sessionId ?? item.name;
  return /* @__PURE__ */ React2.createElement("div", { className: "sid-row", "data-dsh-part": SESSION_ID_PART.trash }, /* @__PURE__ */ React2.createElement("div", { className: "sid-row-check", onClick: stop }, /* @__PURE__ */ React2.createElement(
    "input",
    {
      type: "checkbox",
      "data-dsh-part": SESSION_ID_PART.check,
      checked: selected,
      onChange: () => {
        onToggleSelect(item.name);
      }
    }
  )), /* @__PURE__ */ React2.createElement("span", { className: "sid-row-info" }, title === void 0 || title === "" ? null : /* @__PURE__ */ React2.createElement("span", { className: "sid-row-line" }, /* @__PURE__ */ React2.createElement("span", { className: "sid-row-title", title }, title)), /* @__PURE__ */ React2.createElement("span", { className: "sid-row-line" }, /* @__PURE__ */ React2.createElement("span", { className: "sid-row-id", title: idText }, idText), timeLabel === void 0 ? null : /* @__PURE__ */ React2.createElement("span", { className: "sid-badge sid-badge-hidden" }, timeLabel)), item.originalDir === void 0 ? null : /* @__PURE__ */ React2.createElement("span", { className: "sid-row-time", title: item.originalDir }, item.originalDir)), /* @__PURE__ */ React2.createElement("span", { className: "sid-row-actions", onClick: stop }, onRestore === void 0 ? null : /* @__PURE__ */ React2.createElement("button", { type: "button", className: "sid-action", "data-tone": "unarchive", disabled: busy, onClick: () => {
    onRestore(item.name);
  } }, t("panel.trash.restore")), onPurge === void 0 ? null : /* @__PURE__ */ React2.createElement("button", { type: "button", className: "sid-action", "data-tone": "danger", disabled: busy, onClick: () => {
    onPurge(item.name);
  } }, t("panel.trash.purge"))));
}
function SessionIdPanel({
  list,
  archived,
  workspaces,
  hidden,
  actions = {},
  settings,
  onSettingsChange,
  hiddenIds,
  initialView,
  onClose,
  t
}) {
  const snapshot = React2.useSyncExternalStore(list.subscribe, list.getSnapshot);
  const archivedSet = React2.useSyncExternalStore(
    archived?.subscribe ?? noopSubscribe,
    archived?.getSnapshot ?? (() => EMPTY_IDS)
  );
  const hiddenSet = React2.useSyncExternalStore(
    hidden?.subscribe ?? noopSubscribe,
    hidden?.getSnapshot ?? (() => EMPTY_IDS)
  );
  const workspaceItems = React2.useSyncExternalStore(
    workspaces?.subscribe ?? noopSubscribe,
    workspaces?.getSnapshot ?? (() => ({ items: [] }))
  ).items ?? [];
  const current = React2.useMemo(() => currentSessionId(snapshot), [snapshot]);
  const [filter, setFilter] = React2.useState(
    settings.defaultFilter === "last" ? settings.lastFilter : settings.defaultFilter
  );
  const [sortMode, setSortMode] = React2.useState("updatedDesc");
  const [search, setSearch] = React2.useState("");
  const [visibleCount, setVisibleCount] = React2.useState(INITIAL_ROWS);
  const [view, setView] = React2.useState(initialView ?? "list");
  const [showSettings, setShowSettings] = React2.useState(false);
  const [selected, setSelected] = React2.useState(() => /* @__PURE__ */ new Set());
  const [batchBusy, setBatchBusy] = React2.useState(false);
  const [batchConfirm, setBatchConfirm] = React2.useState(false);
  const [note, setNote] = React2.useState(void 0);
  const [trashItems, setTrashItems] = React2.useState(void 0);
  const [trashError, setTrashError] = React2.useState(void 0);
  const [purgeAllConfirm, setPurgeAllConfirm] = React2.useState(false);
  const [trashSelected, setTrashSelected] = React2.useState(() => /* @__PURE__ */ new Set());
  const [trashBusy, setTrashBusy] = React2.useState(false);
  const listRef = React2.useRef(null);
  const located = React2.useRef(false);
  const isArchived = React2.useCallback(
    (row) => row.archived === true || archivedSet.has(row.id),
    [archivedSet]
  );
  const allRows = React2.useMemo(() => {
    const rows2 = [];
    for (const id of snapshot.ids ?? []) {
      if (hiddenIds?.has(id) === true) continue;
      const row = snapshot.byId[id];
      if (row !== void 0) rows2.push(row);
    }
    return sortRows(rows2, sortMode);
  }, [snapshot, sortMode, hiddenIds]);
  const workspaceKeyOf = React2.useCallback((row) => {
    const bySessions = workspaceItems.find((workspace) => workspace.sessionIds?.includes(row.id) === true);
    const hit = bySessions ?? (row.cwd === void 0 ? void 0 : workspaceItems.find((workspace) => workspace.path === row.cwd));
    return hit === void 0 ? "" : hit.workspaceId ?? hit.id ?? hit.path ?? "";
  }, [workspaceItems]);
  const query = search.trim().toLowerCase();
  const rows = React2.useMemo(() => {
    return allRows.filter((row) => {
      if (view === "hidden") return hiddenSet.has(row.id);
      if (hiddenSet.has(row.id)) return false;
      if (!filterAllows(filter, isArchived(row))) return false;
      if (!subagentAllows(settings.subagentFilter, isSubagentRow(row))) return false;
      if (settings.workspaceFilter !== "") {
        const key = workspaceKeyOf(row);
        if (settings.workspaceFilter === UNGROUPED_KEY) {
          if (key !== "") return false;
        } else if (key !== settings.workspaceFilter) return false;
      }
      if (query === "") return true;
      const title = (row.displayTitle ?? "").toLowerCase();
      const nameHit = title.includes(query);
      const idHit = row.id.toLowerCase().includes(query);
      if (settings.searchScope === "id") return idHit;
      if (settings.searchScope === "name") return nameHit;
      return nameHit || idHit;
    });
  }, [allRows, filter, isArchived, query, view, hiddenSet, settings.subagentFilter, settings.workspaceFilter, settings.searchScope, workspaceKeyOf]);
  React2.useEffect(() => {
    setVisibleCount(INITIAL_ROWS);
  }, [query, filter, sortMode, view]);
  const shown = rows.slice(0, visibleCount);
  const remaining = rows.length - shown.length;
  React2.useEffect(() => {
    report("panel-mounted", { sessionCount: rows.length, visible: shown.length });
  }, []);
  React2.useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  const scrollToCurrent = React2.useCallback(() => {
    try {
      const node = listRef.current?.querySelector('[data-active="true"]');
      if (node === null || node === void 0) return false;
      node.scrollIntoView({ block: "center" });
      return true;
    } catch {
      return false;
    }
  }, []);
  React2.useEffect(() => {
    if (view !== "list" || !settings.autoLocate || located.current) return;
    const timer = window.setTimeout(() => {
      located.current = true;
      scrollToCurrent();
    }, 30);
    return () => {
      window.clearTimeout(timer);
    };
  }, [view, settings.autoLocate, shown.length, scrollToCurrent]);
  const handleLocate = () => {
    if (current === void 0 || rows.findIndex((row) => row.id === current) < 0) {
      setNote(String(t("panel.locateMissing")));
      return;
    }
    const index = rows.findIndex((row) => row.id === current);
    setNote(void 0);
    if (index >= visibleCount) setVisibleCount(index + 1);
    window.setTimeout(() => {
      scrollToCurrent();
    }, 30);
  };
  const refreshTrash = React2.useCallback(() => {
    if (actions.listTrash === void 0) {
      setTrashItems([]);
      return;
    }
    setTrashError(void 0);
    void actions.listTrash().then((items) => {
      setTrashItems(items);
    }).catch((error) => {
      setTrashError(String(error?.message ?? error));
    });
  }, [actions]);
  React2.useEffect(() => {
    if (view === "trash") refreshTrash();
  }, [view, refreshTrash]);
  const trashCount = trashItems?.length ?? 0;
  const trashAllSelected = trashItems !== void 0 && trashItems.length > 0 && trashItems.every((item) => trashSelected.has(item.name));
  const runPurgeTrash = (names) => {
    if (actions.purgeTrash === void 0) return;
    setTrashBusy(true);
    void actions.purgeTrash(names).then((result) => {
      setTrashBusy(false);
      if (result.ok) {
        setPurgeAllConfirm(false);
        setTrashSelected(/* @__PURE__ */ new Set());
        refreshTrash();
      } else {
        setTrashError(result.message ?? String(t("panel.purgeFailed")));
      }
    }).catch((error) => {
      setTrashBusy(false);
      setTrashError(String(error?.message ?? error));
    });
  };
  const runRestoreTrash = (name2) => {
    if (actions.restoreTrash === void 0) return;
    setTrashBusy(true);
    void actions.restoreTrash(name2).then((result) => {
      setTrashBusy(false);
      if (result.ok) refreshTrash();
      else setTrashError(result.message ?? String(t("panel.restoreFailed")));
    }).catch((error) => {
      setTrashBusy(false);
      setTrashError(String(error?.message ?? error));
    });
  };
  const toggleTrashSelect = React2.useCallback((name2) => {
    setTrashSelected((previous) => {
      const next = new Set(previous);
      if (next.has(name2)) next.delete(name2);
      else next.add(name2);
      return next;
    });
  }, []);
  const selectedRows = React2.useMemo(
    () => rows.filter((row) => selected.has(row.id)),
    [rows, selected]
  );
  const selectedArchived = React2.useMemo(
    () => selectedRows.filter((row) => isArchived(row)),
    [selectedRows, isArchived]
  );
  const selectedActiveCount = selectedRows.length - selectedArchived.length;
  const toggleSelect = React2.useCallback((sessionId) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  }, []);
  const clearSelection = () => {
    setSelected(/* @__PURE__ */ new Set());
    setTrashSelected(/* @__PURE__ */ new Set());
    setBatchConfirm(false);
    setNote(void 0);
  };
  const runBatchCopy = (kind) => {
    void copyToClipboard(selectedRows, kind, actions.paths).then((ok) => {
      setNote(ok ? String(t("panel.copiedSelected", { n: selectedRows.length })) : String(t("panel.copyFailed")));
    });
  };
  const runBatchHide = (hide) => {
    if (hidden === void 0) return;
    hidden.setMany(selectedRows.map((row) => row.id), hide);
    setNote(String(t("panel.batchDone", { n: selectedRows.length })));
    clearSelection();
  };
  const runBatchArchive = (mode) => {
    const action = mode === "archive" ? actions.archive : actions.unarchive;
    if (action === void 0) return;
    const targets = mode === "archive" ? selectedRows.filter((row) => !isArchived(row)) : selectedArchived;
    if (targets.length === 0) return;
    setBatchBusy(true);
    void (async () => {
      let done = 0;
      let failed = 0;
      for (const row of targets) {
        try {
          const result = await action(row.id);
          if (result.ok) done += 1;
          else failed += 1;
        } catch {
          failed += 1;
        }
      }
      setNote(failed === 0 ? String(t("panel.batchDone", { n: done })) : `${String(t("panel.batchDone", { n: done }))}\uFF0C${String(t("panel.batchFailed", { n: failed }))}`);
      setBatchBusy(false);
      clearSelection();
    })();
  };
  const runBatchDelete = (purge) => {
    if (actions.remove === void 0 || selectedRows.length === 0) return;
    setBatchBusy(true);
    void (async () => {
      let done = 0;
      let failed = 0;
      for (const row of selectedRows) {
        try {
          const result = await actions.remove?.(row.id, purge);
          if (result?.ok === true) done += 1;
          else failed += 1;
        } catch {
          failed += 1;
        }
      }
      setNote(failed === 0 ? String(t("panel.batchDone", { n: done })) : `${String(t("panel.batchDone", { n: done }))}\uFF0C${String(t("panel.batchFailed", { n: failed }))}`);
      setBatchBusy(false);
      setBatchConfirm(false);
      clearSelection();
    })();
  };
  const handleBatchDeleteClick = () => {
    if (settings.deleteNoConfirm) runBatchDelete(settings.deleteMode === "purge");
    else setBatchConfirm(true);
  };
  const grouped = React2.useMemo(() => {
    if (!settings.grouped || view !== "list") return void 0;
    const buckets = /* @__PURE__ */ new Map();
    const idOf = (workspace) => workspace.workspaceId ?? workspace.id ?? workspace.path ?? "";
    const byPath = /* @__PURE__ */ new Map();
    for (const workspace of workspaceItems) {
      if (typeof workspace.path === "string") byPath.set(workspace.path, workspace);
    }
    for (const row of rows) {
      const bySessions = workspaceItems.find((workspace2) => workspace2.sessionIds?.includes(row.id) === true);
      const workspace = bySessions ?? (row.cwd === void 0 ? void 0 : byPath.get(row.cwd));
      const key = workspace === void 0 ? "" : idOf(workspace);
      const title = workspace === void 0 ? String(t("panel.ungrouped")) : workspace.title ?? workspace.path ?? String(t("panel.groupUnknown"));
      const bucket = buckets.get(key) ?? { title, ungrouped: workspace === void 0, rows: [] };
      bucket.rows.push(row);
      buckets.set(key, bucket);
    }
    return [...buckets.values()].sort((a, b) => a.ungrouped === b.ungrouped ? 0 : a.ungrouped ? 1 : -1);
  }, [settings.grouped, view, rows, workspaceItems, t]);
  const hiddenCount = React2.useMemo(
    () => allRows.filter((row) => hiddenSet.has(row.id)).length,
    [allRows, hiddenSet]
  );
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));
  const renderRow = (row) => /* @__PURE__ */ React2.createElement(
    SessionRow,
    {
      key: row.id,
      session: row,
      isCurrent: row.id === current,
      isArchived: isArchived(row),
      isHidden: hiddenSet.has(row.id),
      isSubagent: isSubagentRow(row),
      selected: selected.has(row.id),
      actions,
      hidden,
      settings,
      canDelete: actions.remove !== void 0,
      onToggleSelect: toggleSelect,
      onClose,
      t
    }
  );
  const batchDisabled = selectedRows.length === 0 || batchBusy;
  return (0, import_react_dom.createPortal)(
    /* @__PURE__ */ React2.createElement("div", { className: "sid-overlay", role: "presentation", "data-dsh-plugin": SESSION_ID_PLUGIN_ATTR }, /* @__PURE__ */ React2.createElement("div", { className: "sid-mask", "aria-hidden": "true", onPointerDown: onClose, onClick: onClose }), /* @__PURE__ */ React2.createElement(
      "div",
      {
        className: "sid-panel",
        "data-dsh-part": SESSION_ID_PART.panel,
        role: "dialog",
        "aria-modal": "true",
        "aria-label": String(t("panel.title")),
        style: { "--sid-panel-width": panelWidthCss(settings) }
      },
      /* @__PURE__ */ React2.createElement("div", { className: "sid-header" }, /* @__PURE__ */ React2.createElement("div", { className: "sid-heading" }, /* @__PURE__ */ React2.createElement("h2", { className: "sid-title" }, t("panel.title"), /* @__PURE__ */ React2.createElement("span", { className: "sid-count-inline" }, view === "trash" ? String(t("panel.trash.count", { n: trashCount })) : view === "hidden" ? String(t("panel.trash.count", { n: hiddenCount })) : String(t("panel.subtitle", { n: allRows.length })), view === "list" ? ` \xB7 ${String(t("panel.shown", { n: shown.length, total: rows.length }))}` : ""))), /* @__PURE__ */ React2.createElement("div", { className: "sid-head-actions" }, hidden !== void 0 ? /* @__PURE__ */ React2.createElement(
        "button",
        {
          type: "button",
          className: "sid-icon-btn",
          "data-on": view === "hidden" ? "true" : "false",
          "data-dsh-part": SESSION_ID_PART.hiddenArea,
          title: String(t("panel.unhideTitle")),
          onClick: () => {
            setView(view === "hidden" ? "list" : "hidden");
            setShowSettings(false);
            clearSelection();
          }
        },
        /* @__PURE__ */ React2.createElement(EyeOffIcon, { width: 13, height: 13 }),
        t("panel.hiddenArea"),
        hiddenCount > 0 ? `\uFF08${hiddenCount}\uFF09` : ""
      ) : null, actions.listTrash !== void 0 ? /* @__PURE__ */ React2.createElement(
        "button",
        {
          type: "button",
          className: "sid-icon-btn",
          "data-tone": "trash",
          "data-on": view === "trash" ? "true" : "false",
          "data-dsh-part": SESSION_ID_PART.trash,
          title: String(t("panel.trashTitle")),
          onClick: () => {
            if (view === "trash") setView("list");
            else {
              setView("trash");
              setShowSettings(false);
            }
            clearSelection();
          }
        },
        /* @__PURE__ */ React2.createElement(TrashIcon, { width: 13, height: 13 }),
        t("panel.trash"),
        trashCount > 0 ? `\uFF08${trashCount}\uFF09` : ""
      ) : null, /* @__PURE__ */ React2.createElement(
        "button",
        {
          type: "button",
          className: "sid-icon-btn",
          "data-on": showSettings ? "true" : "false",
          title: String(t("panel.settingsTitle")),
          onClick: () => {
            setShowSettings((value) => !value);
          }
        },
        t("panel.settings")
      ), /* @__PURE__ */ React2.createElement(
        "button",
        {
          type: "button",
          className: "sid-close",
          "data-dsh-part": SESSION_ID_PART.close,
          "aria-label": String(t("panel.close")),
          title: String(t("panel.close")),
          onPointerDown: onClose,
          onClick: onClose
        },
        /* @__PURE__ */ React2.createElement(CloseIcon, { width: 13, height: 13 }),
        /* @__PURE__ */ React2.createElement("span", { className: "sid-close-label" }, t("panel.close"))
      ))),
      showSettings ? /* @__PURE__ */ React2.createElement("div", { className: "sid-settings" }, /* @__PURE__ */ React2.createElement("div", { className: "sid-settings-grid" }, /* @__PURE__ */ React2.createElement("span", { className: "sid-settings-label" }, t("panel.setting.defaultFilter")), /* @__PURE__ */ React2.createElement("div", { className: "sid-settings-group" }, /* @__PURE__ */ React2.createElement(
        "select",
        {
          className: "sid-select",
          value: settings.defaultFilter,
          onChange: (event) => {
            onSettingsChange({ defaultFilter: event.target.value });
          }
        },
        /* @__PURE__ */ React2.createElement("option", { value: "all" }, t("panel.filter.all")),
        /* @__PURE__ */ React2.createElement("option", { value: "hideArchived" }, t("panel.filter.active")),
        /* @__PURE__ */ React2.createElement("option", { value: "onlyArchived" }, t("panel.filter.archived")),
        /* @__PURE__ */ React2.createElement("option", { value: "last" }, t("panel.filter.followLast"))
      ), /* @__PURE__ */ React2.createElement("label", { className: "sid-action", "data-tone": "locate", "data-on": settings.autoLocate ? "true" : "false", style: { cursor: "pointer" } }, /* @__PURE__ */ React2.createElement("input", { type: "checkbox", checked: settings.autoLocate, style: { margin: 0 }, onChange: (event) => {
        onSettingsChange({ autoLocate: event.target.checked });
      } }), t("panel.autoscroll")), /* @__PURE__ */ React2.createElement("label", { className: "sid-action", "data-tone": "neutral", "data-on": settings.grouped ? "true" : "false", style: { cursor: "pointer" } }, /* @__PURE__ */ React2.createElement("input", { type: "checkbox", checked: settings.grouped, style: { margin: 0 }, onChange: (event) => {
        onSettingsChange({ grouped: event.target.checked });
      } }), t("panel.groupByTitle")), /* @__PURE__ */ React2.createElement("label", { className: "sid-action", "data-tone": "neutral", "data-on": settings.closeOnOpen ? "true" : "false", style: { cursor: "pointer" } }, /* @__PURE__ */ React2.createElement("input", { type: "checkbox", checked: settings.closeOnOpen, style: { margin: 0 }, onChange: (event) => {
        onSettingsChange({ closeOnOpen: event.target.checked });
      } }), t("panel.setting.closeOnOpen"))), /* @__PURE__ */ React2.createElement("span", { className: "sid-settings-label" }, t("panel.setting.deleteMode")), /* @__PURE__ */ React2.createElement("div", { className: "sid-settings-group" }, /* @__PURE__ */ React2.createElement(
        "select",
        {
          className: "sid-select",
          value: settings.deleteMode,
          onChange: (event) => {
            onSettingsChange({ deleteMode: event.target.value });
          }
        },
        /* @__PURE__ */ React2.createElement("option", { value: "trash" }, t("panel.deleteMode.trash")),
        /* @__PURE__ */ React2.createElement("option", { value: "purge" }, t("panel.deleteMode.purge"))
      ), /* @__PURE__ */ React2.createElement("label", { className: "sid-action", "data-tone": "danger", "data-on": settings.deleteNoConfirm ? "true" : "false", style: { cursor: "pointer" } }, /* @__PURE__ */ React2.createElement("input", { type: "checkbox", checked: settings.deleteNoConfirm, style: { margin: 0 }, onChange: (event) => {
        onSettingsChange({ deleteNoConfirm: event.target.checked });
      } }), t("panel.setting.deleteNoConfirm")), /* @__PURE__ */ React2.createElement("label", { className: "sid-action", "data-tone": "danger", "data-on": settings.purgeNoConfirm ? "true" : "false", style: { cursor: "pointer" } }, /* @__PURE__ */ React2.createElement("input", { type: "checkbox", checked: settings.purgeNoConfirm, style: { margin: 0 }, onChange: (event) => {
        onSettingsChange({ purgeNoConfirm: event.target.checked });
      } }), t("panel.setting.purgeNoConfirm"))), /* @__PURE__ */ React2.createElement("span", { className: "sid-settings-label" }, t("panel.setting.panelWidth")), /* @__PURE__ */ React2.createElement("div", { className: "sid-settings-group sid-settings-stack" }, /* @__PURE__ */ React2.createElement("div", { className: "sid-settings-line" }, /* @__PURE__ */ React2.createElement(
        "button",
        {
          type: "button",
          className: "sid-action",
          "data-tone": "locate",
          "data-on": settings.autoWidth ? "true" : "false",
          title: String(t("panel.width.autoTitle")),
          onClick: () => {
            onSettingsChange({ autoWidth: true });
          }
        },
        t("panel.width.auto")
      ), /* @__PURE__ */ React2.createElement(
        "input",
        {
          type: "number",
          className: "sid-num",
          min: AUTO_WIDTH_RANGE.min,
          max: AUTO_WIDTH_RANGE.max,
          step: 1,
          value: settings.autoWidthPercent,
          title: String(t("panel.width.autoTitle")),
          onChange: (event) => {
            const next = Number(event.target.value);
            onSettingsChange({
              autoWidth: true,
              autoWidthPercent: Number.isFinite(next) ? next : DEFAULT_AUTO_WIDTH_PERCENT
            });
          }
        }
      ), /* @__PURE__ */ React2.createElement("span", { className: "sid-settings-hint" }, t("panel.width.autoHint")), [70, 80, 90].map((preset) => /* @__PURE__ */ React2.createElement(
        "button",
        {
          key: `auto-${preset}`,
          type: "button",
          className: "sid-chip",
          "data-on": settings.autoWidth && settings.autoWidthPercent === preset ? "true" : "false",
          onClick: () => {
            onSettingsChange({ autoWidth: true, autoWidthPercent: preset });
          }
        },
        preset
      ))), /* @__PURE__ */ React2.createElement("div", { className: "sid-settings-line" }, /* @__PURE__ */ React2.createElement(
        "button",
        {
          type: "button",
          className: "sid-action",
          "data-tone": "locate",
          "data-on": settings.autoWidth ? "false" : "true",
          title: String(t("panel.width.fixedTitle")),
          onClick: () => {
            onSettingsChange({ autoWidth: false });
          }
        },
        t("panel.width.fixed")
      ), /* @__PURE__ */ React2.createElement(
        "input",
        {
          type: "number",
          className: "sid-num",
          min: PANEL_WIDTH_RANGE.min,
          max: PANEL_WIDTH_RANGE.max,
          step: 1,
          value: settings.panelWidth,
          title: String(t("panel.width.fixedTitle")),
          onChange: (event) => {
            const next = Number(event.target.value);
            onSettingsChange({
              autoWidth: false,
              panelWidth: Number.isFinite(next) ? next : DEFAULT_PANEL_WIDTH
            });
          }
        }
      ), /* @__PURE__ */ React2.createElement("span", { className: "sid-settings-hint" }, t("panel.width.fixedHint")), [700, 860, 1080].map((preset) => /* @__PURE__ */ React2.createElement(
        "button",
        {
          key: `fixed-${preset}`,
          type: "button",
          className: "sid-chip",
          "data-on": !settings.autoWidth && settings.panelWidth === preset ? "true" : "false",
          onClick: () => {
            onSettingsChange({ autoWidth: false, panelWidth: preset });
          }
        },
        preset
      )))))) : null,
      view === "trash" ? /* @__PURE__ */ React2.createElement(React2.Fragment, null, trashError === void 0 ? null : /* @__PURE__ */ React2.createElement("div", { className: "sid-error" }, trashError), /* @__PURE__ */ React2.createElement("div", { className: "sid-batch", "data-active": trashSelected.size > 0 ? "true" : "false", "data-dsh-part": SESSION_ID_PART.batch }, /* @__PURE__ */ React2.createElement(
        "button",
        {
          type: "button",
          className: "sid-action",
          "data-tone": "neutral",
          disabled: trashCount === 0,
          onClick: () => {
            setTrashSelected(trashAllSelected ? /* @__PURE__ */ new Set() : new Set((trashItems ?? []).map((item) => item.name)));
          }
        },
        t("panel.selectAll")
      ), /* @__PURE__ */ React2.createElement(
        "button",
        {
          type: "button",
          className: "sid-action",
          "data-tone": "neutral",
          disabled: trashSelected.size === 0,
          onClick: () => {
            setTrashSelected(/* @__PURE__ */ new Set());
            setPurgeAllConfirm(false);
          }
        },
        t("panel.clearSelection")
      ), actions.purgeTrash === void 0 ? null : /* @__PURE__ */ React2.createElement(
        "button",
        {
          type: "button",
          className: "sid-action",
          "data-tone": "danger",
          disabled: trashSelected.size === 0 || trashBusy,
          onClick: () => {
            runPurgeTrash([...trashSelected]);
          }
        },
        t("panel.deletePurge")
      ), /* @__PURE__ */ React2.createElement("span", { className: "sid-batch-count" }, trashSelected.size > 0 ? String(t("panel.selected", { n: trashSelected.size })) : ""), purgeAllConfirm ? /* @__PURE__ */ React2.createElement("button", { type: "button", className: "sid-action", "data-tone": "danger", disabled: trashBusy, onClick: () => {
        runPurgeTrash("all");
      } }, t("panel.deletePurge")) : null, actions.purgeTrash === void 0 ? null : /* @__PURE__ */ React2.createElement(
        "button",
        {
          type: "button",
          className: "sid-action sid-batch-tail",
          "data-tone": "danger",
          title: String(t("panel.trash.purgeAllConfirm", { n: trashCount })),
          disabled: trashCount === 0 || trashBusy,
          onClick: () => {
            if (settings.purgeNoConfirm) runPurgeTrash("all");
            else setPurgeAllConfirm(true);
          }
        },
        /* @__PURE__ */ React2.createElement(TrashIcon, { width: 12, height: 12 }),
        `${String(t("panel.trash.purgeAll"))}\uFF08${trashCount}\uFF09`
      )), trashItems !== void 0 && trashItems.length === 0 ? /* @__PURE__ */ React2.createElement("div", { className: "sid-empty" }, t("panel.trash.empty")) : /* @__PURE__ */ React2.createElement("div", { className: "sid-list" }, (trashItems ?? []).map((item) => /* @__PURE__ */ React2.createElement(
        TrashRow,
        {
          key: item.name,
          item,
          title: item.sessionId === void 0 ? void 0 : snapshot.byId[item.sessionId]?.displayTitle,
          selected: trashSelected.has(item.name),
          busy: trashBusy,
          onToggleSelect: toggleTrashSelect,
          onRestore: actions.restoreTrash === void 0 ? void 0 : runRestoreTrash,
          onPurge: actions.purgeTrash === void 0 ? void 0 : (name2) => {
            runPurgeTrash([name2]);
          },
          t
        }
      )))) : /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement("div", { className: "sid-batch", "data-active": selectedRows.length > 0 ? "true" : "false", "data-dsh-part": SESSION_ID_PART.batch }, /* @__PURE__ */ React2.createElement("button", { type: "button", className: "sid-action", "data-tone": "copy", disabled: batchDisabled, title: String(t("panel.copyIdTitle")), onClick: () => {
        runBatchCopy("id");
      } }, t("panel.copyId")), /* @__PURE__ */ React2.createElement("button", { type: "button", className: "sid-action", "data-tone": "copy", disabled: batchDisabled, title: String(t("panel.copyNameTitle")), onClick: () => {
        runBatchCopy("name");
      } }, t("panel.copyName")), /* @__PURE__ */ React2.createElement("button", { type: "button", className: "sid-action", "data-tone": "copy", disabled: batchDisabled, title: String(t("panel.copyPathTitle")), onClick: () => {
        runBatchCopy("path");
      } }, t("panel.copyPath")), actions.archive !== void 0 ? /* @__PURE__ */ React2.createElement("button", { type: "button", className: "sid-action", "data-tone": "archive", disabled: batchDisabled || selectedActiveCount === 0, onClick: () => {
        runBatchArchive("archive");
      } }, t("panel.batchArchive")) : null, actions.unarchive !== void 0 ? /* @__PURE__ */ React2.createElement("button", { type: "button", className: "sid-action", "data-tone": "unarchive", disabled: batchDisabled || selectedArchived.length === 0, onClick: () => {
        runBatchArchive("unarchive");
      } }, t("panel.batchUnarchive")) : null, hidden !== void 0 ? /* @__PURE__ */ React2.createElement(
        "button",
        {
          type: "button",
          className: "sid-action",
          "data-tone": "neutral",
          disabled: batchDisabled,
          onClick: () => {
            runBatchHide(view !== "hidden");
          }
        },
        view === "hidden" ? t("panel.unhide") : t("panel.hide")
      ) : null, actions.remove !== void 0 ? batchConfirm ? /* @__PURE__ */ React2.createElement("span", { className: "sid-confirm" }, t("panel.deleteConfirm"), /* @__PURE__ */ React2.createElement("button", { type: "button", className: "sid-action", "data-tone": "danger", disabled: batchBusy, onClick: () => {
        runBatchDelete(false);
      } }, t("panel.deleteTrash")), /* @__PURE__ */ React2.createElement("button", { type: "button", className: "sid-action", "data-tone": "danger", disabled: batchBusy, onClick: () => {
        runBatchDelete(true);
      } }, t("panel.deletePurge")), /* @__PURE__ */ React2.createElement("button", { type: "button", className: "sid-action", "data-tone": "neutral", onClick: () => {
        setBatchConfirm(false);
      } }, t("panel.deleteNo"))) : /* @__PURE__ */ React2.createElement("button", { type: "button", className: "sid-action", "data-tone": "danger", disabled: batchDisabled, onClick: handleBatchDeleteClick }, t("panel.batchDelete")) : null, /* @__PURE__ */ React2.createElement(
        "button",
        {
          type: "button",
          className: "sid-action",
          "data-tone": "neutral",
          onClick: () => {
            setSelected(allSelected ? /* @__PURE__ */ new Set() : new Set(rows.map((row) => row.id)));
          }
        },
        t("panel.selectAll")
      ), /* @__PURE__ */ React2.createElement("button", { type: "button", className: "sid-action", "data-tone": "neutral", disabled: selectedRows.length === 0, onClick: clearSelection }, t("panel.clearSelection")), view === "hidden" && hidden !== void 0 ? /* @__PURE__ */ React2.createElement("button", { type: "button", className: "sid-action", "data-tone": "unarchive", disabled: hiddenCount === 0, onClick: () => {
        hidden.clear();
        setNote(void 0);
      } }, t("panel.unhideAll")) : null, /* @__PURE__ */ React2.createElement("span", { className: "sid-batch-count sid-batch-tail" }, note !== void 0 ? note : selectedRows.length > 0 ? String(t("panel.selected", { n: selectedRows.length })) : "")), view === "list" ? /* @__PURE__ */ React2.createElement("div", { className: "sid-toolbar", "data-dsh-part": SESSION_ID_PART.toolbar }, /* @__PURE__ */ React2.createElement(
        "input",
        {
          type: "search",
          className: "sid-search",
          "data-dsh-part": SESSION_ID_PART.search,
          placeholder: String(t("panel.search.placeholder")),
          "aria-label": String(t("panel.search.aria")),
          value: search,
          onChange: (event) => {
            setSearch(event.target.value);
          }
        }
      ), /* @__PURE__ */ React2.createElement(
        "select",
        {
          className: "sid-select sid-select-narrow",
          "data-dsh-part": SESSION_ID_PART.searchScope,
          title: String(t("panel.searchScope.label")),
          value: settings.searchScope,
          onChange: (event) => {
            onSettingsChange({ searchScope: event.target.value });
          }
        },
        /* @__PURE__ */ React2.createElement("option", { value: "all" }, t("panel.searchScope.all")),
        /* @__PURE__ */ React2.createElement("option", { value: "id" }, t("panel.searchScope.id")),
        /* @__PURE__ */ React2.createElement("option", { value: "name" }, t("panel.searchScope.name"))
      ), /* @__PURE__ */ React2.createElement(
        "select",
        {
          className: "sid-select",
          "data-dsh-part": SESSION_ID_PART.sort,
          title: String(t("panel.sort.label")),
          value: sortMode,
          onChange: (event) => {
            setSortMode(event.target.value);
          }
        },
        /* @__PURE__ */ React2.createElement("option", { value: "updatedDesc" }, t("panel.sort.updatedDesc")),
        /* @__PURE__ */ React2.createElement("option", { value: "updatedAsc" }, t("panel.sort.updatedAsc")),
        /* @__PURE__ */ React2.createElement("option", { value: "title" }, t("panel.sort.title"))
      ), /* @__PURE__ */ React2.createElement(
        "select",
        {
          className: "sid-select",
          "data-dsh-part": SESSION_ID_PART.filter,
          title: String(t("panel.filter.label")),
          value: filter,
          onChange: (event) => {
            const next = event.target.value;
            setFilter(next);
            onSettingsChange({ lastFilter: next });
          }
        },
        /* @__PURE__ */ React2.createElement("option", { value: "all" }, t("panel.filter.all")),
        /* @__PURE__ */ React2.createElement("option", { value: "hideArchived" }, t("panel.filter.active")),
        /* @__PURE__ */ React2.createElement("option", { value: "onlyArchived" }, t("panel.filter.archived"))
      ), /* @__PURE__ */ React2.createElement(
        "select",
        {
          className: "sid-select",
          "data-dsh-part": SESSION_ID_PART.subagent,
          title: String(t("panel.subagentFilter.label")),
          value: settings.subagentFilter,
          onChange: (event) => {
            onSettingsChange({ subagentFilter: event.target.value });
          }
        },
        /* @__PURE__ */ React2.createElement("option", { value: "all" }, t("panel.subagentFilter.all")),
        /* @__PURE__ */ React2.createElement("option", { value: "hide" }, t("panel.subagentFilter.hide")),
        /* @__PURE__ */ React2.createElement("option", { value: "only" }, t("panel.subagentFilter.only"))
      ), workspaces !== void 0 ? /* @__PURE__ */ React2.createElement(
        "select",
        {
          className: "sid-select",
          "data-dsh-part": SESSION_ID_PART.workspace,
          title: String(t("panel.workspaceFilter.label")),
          value: settings.workspaceFilter,
          onChange: (event) => {
            onSettingsChange({ workspaceFilter: event.target.value });
          }
        },
        /* @__PURE__ */ React2.createElement("option", { value: "" }, t("panel.workspaceFilter.all")),
        /* @__PURE__ */ React2.createElement("option", { value: UNGROUPED_KEY }, t("panel.ungrouped")),
        workspaceItems.map((workspace) => {
          const key = workspace.workspaceId ?? workspace.id ?? workspace.path ?? "";
          if (key === "") return null;
          return /* @__PURE__ */ React2.createElement("option", { key, value: key }, workspace.title ?? workspace.path ?? String(t("panel.groupUnknown")));
        })
      ) : null, /* @__PURE__ */ React2.createElement(
        "button",
        {
          type: "button",
          className: "sid-action",
          "data-tone": "locate",
          "data-dsh-part": SESSION_ID_PART.locate,
          title: String(t("panel.locate")),
          onClick: handleLocate
        },
        /* @__PURE__ */ React2.createElement(LocateIcon, { width: 12, height: 12 }),
        t("panel.locate")
      )) : null, rows.length === 0 ? /* @__PURE__ */ React2.createElement("div", { className: "sid-empty" }, view === "hidden" ? t("panel.hiddenEmpty") : query === "" ? t("panel.empty") : t("panel.noMatches")) : /* @__PURE__ */ React2.createElement("div", { className: "sid-list", "data-dsh-part": SESSION_ID_PART.list, ref: listRef }, grouped === void 0 ? shown.map((row) => renderRow(row)) : grouped.map((group) => /* @__PURE__ */ React2.createElement("div", { className: "sid-group", key: group.title }, /* @__PURE__ */ React2.createElement("div", { className: "sid-group-title", "data-ungrouped": group.ungrouped ? "true" : "false" }, group.title, /* @__PURE__ */ React2.createElement("span", { className: "sid-group-count" }, "\xB7 ", group.rows.length)), group.rows.map((row) => renderRow(row)))), grouped === void 0 && remaining > 0 && shown.length < MAX_ROWS ? /* @__PURE__ */ React2.createElement(
        "button",
        {
          type: "button",
          className: "sid-more",
          "data-dsh-part": SESSION_ID_PART.more,
          onClick: () => {
            setVisibleCount((count) => count + ROW_PAGE);
          }
        },
        String(t("panel.more", { n: remaining }))
      ) : null))
    )),
    document.body
  );
}

// src/client/locales.ts
var zh = {
  "entry.label": "\u4F1A\u8BDD ID",
  "panel.title": "\u4F1A\u8BDD ID",
  "panel.subtitle": "\u5171 {n} \u4E2A\u4F1A\u8BDD",
  "panel.empty": "\u6682\u65E0\u4F1A\u8BDD",
  "panel.noMatches": "\u6CA1\u6709\u5339\u914D\u7684\u4F1A\u8BDD",
  "panel.search.placeholder": "\u641C\u7D22\u6807\u9898\u6216 ID\u2026",
  "panel.searchScope.label": "\u641C\u7D22\u8303\u56F4",
  "panel.searchScope.all": "\u5168\u90E8",
  "panel.searchScope.id": "ID",
  "panel.searchScope.name": "\u540D\u79F0",
  "panel.search.aria": "\u641C\u7D22\u4F1A\u8BDD",
  "panel.close": "\u5173\u95ED",
  "panel.copy": "\u590D\u5236",
  "panel.copied": "\u5DF2\u590D\u5236",
  "panel.copyFailed": "\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5",
  "panel.current": "\u5F53\u524D",
  "panel.archived": "\u5F52\u6863",
  "panel.updatedAt": "{t}\u66F4\u65B0",
  "panel.time.now": "\u521A\u521A",
  "panel.time.minutes": "{n} \u5206\u949F\u524D",
  "panel.time.hours": "{n} \u5C0F\u65F6\u524D",
  "panel.time.days": "{n} \u5929\u524D",
  "panel.copyTitle": "\u590D\u5236\u4F1A\u8BDD ID",
  "panel.sort.label": "\u6392\u5E8F",
  "panel.sort.updatedDesc": "\u6700\u8FD1\u66F4\u65B0",
  "panel.sort.updatedAsc": "\u6700\u65E9\u66F4\u65B0",
  "panel.sort.title": "\u6309\u6807\u9898",
  "panel.filter.label": "\u7B5B\u9009",
  "panel.filter.all": "\u542B\u5F52\u6863",
  "panel.filter.active": "\u9690\u85CF\u5F52\u6863",
  "panel.filter.archived": "\u4EC5\u5F52\u6863",
  "panel.autoscroll": "\u5B9A\u4F4D\u5F53\u524D\u4F1A\u8BDD",
  "panel.locate": "\u5B9A\u4F4D\u5F53\u524D",
  "panel.locateMissing": "\u5F53\u524D\u4F1A\u8BDD\u4E0D\u5728\u5217\u8868\u91CC\uFF08\u88AB\u7B5B\u9009\u6216\u5DF2\u5220\u9664\uFF09",
  "panel.workspaceFilter.label": "\u6309\u5DE5\u4F5C\u533A\u7B5B\u9009",
  "panel.workspaceFilter.all": "\u5168\u90E8\u5DE5\u4F5C\u533A",
  "panel.selected": "\u5DF2\u9009 {n} \u9879",
  "panel.clearSelection": "\u6E05\u7A7A",
  "panel.copySelected": "\u590D\u5236 ID",
  "panel.copiedSelected": "\u5DF2\u590D\u5236 {n} \u9879",
  "panel.selectAll": "\u5168\u9009",
  "panel.batchArchive": "\u5F52\u6863",
  "panel.batchUnarchive": "\u53D6\u6D88\u5F52\u6863",
  "panel.batchDelete": "\u5220\u9664",
  "panel.batchDone": "\u5DF2\u5904\u7406 {n} \u9879",
  "panel.batchFailed": "\u6709 {n} \u9879\u5931\u8D25",
  "panel.jumpHint": "\u70B9\u51FB\u7A7A\u767D\u5904\u6253\u5F00\u8BE5\u4F1A\u8BDD",
  "panel.copyId": "ID",
  "panel.copyName": "\u540D\u79F0",
  "panel.copyPath": "\u8DEF\u5F84",
  "panel.copyBoth": "\u590D\u5236",
  "panel.copyIdTitle": "\u53EA\u590D\u5236\u4F1A\u8BDD ID",
  "panel.copyNameTitle": "\u53EA\u590D\u5236\u4F1A\u8BDD\u540D\u79F0",
  "panel.copyPathTitle": "\u590D\u5236\u4F1A\u8BDD\u76EE\u5F55\u7684\u7EDD\u5BF9\u8DEF\u5F84",
  "panel.copyBothTitle": "\u590D\u5236\u300C\u540D\u79F0 + \u7A7A\u683C + ID\u300D",
  "panel.subagent": "\u5B50\u4EE3\u7406",
  "panel.subagentFilter.label": "\u5B50\u4EE3\u7406",
  "panel.subagentFilter.all": "\u542B\u5B50\u4EE3\u7406",
  "panel.subagentFilter.hide": "\u9690\u85CF\u5B50\u4EE3\u7406",
  "panel.subagentFilter.only": "\u4EC5\u5B50\u4EE3\u7406",
  "panel.hide": "\u9690\u85CF",
  "panel.unhide": "\u53D6\u6D88\u9690\u85CF",
  "panel.hideTitle": "\u9690\u85CF\u8BE5\u4F1A\u8BDD\uFF08\u53EA\u662F\u4E0D\u663E\u793A\uFF0C\u4E0D\u5F71\u54CD\u5F52\u6863\u4E0E\u78C1\u76D8\uFF09",
  "panel.unhideTitle": "\u53D6\u6D88\u9690\u85CF",
  "panel.hiddenArea": "\u9690\u85CF\u533A",
  "panel.hiddenEmpty": "\u6CA1\u6709\u9690\u85CF\u7684\u4F1A\u8BDD",
  "panel.unhideAll": "\u5168\u90E8\u53D6\u6D88\u9690\u85CF",
  "panel.groupBy": "\u5206\u7EC4",
  "panel.groupByTitle": "\u6309\u5DE5\u4F5C\u533A\u5206\u7EC4\u67E5\u770B",
  "panel.groupFlat": "\u5E73\u94FA",
  "panel.groupFlatTitle": "\u53D6\u6D88\u5206\u7EC4\uFF0C\u5E73\u94FA\u663E\u793A",
  "panel.ungrouped": "\u672A\u5206\u7EC4",
  "panel.groupUnknown": "\uFF08\u672A\u77E5\u5DE5\u4F5C\u533A\uFF09",
  "panel.jump": "\u6253\u5F00",
  "panel.jumpTitle": "\u5207\u6362\u5230\u8BE5\u4F1A\u8BDD",
  "panel.jumpArchived": "\u5F52\u6863\u4F1A\u8BDD\u4E0D\u53EF\u6253\u5F00\uFF0C\u8BF7\u5148\u6062\u590D",
  "panel.jumpFailed": "\u5207\u6362\u5931\u8D25",
  "panel.delete": "\u5220\u9664",
  "panel.deleteTitle": "\u5220\u9664\u8BE5\u4F1A\u8BDD",
  "panel.deleteConfirm": "\u786E\u8BA4\u5220\u9664\uFF1F",
  "panel.deleteTrash": "\u79FB\u5165\u56DE\u6536\u7AD9",
  "panel.deletePurge": "\u5F7B\u5E95\u5220\u9664",
  "panel.deletePurgeHint": "\u5F7B\u5E95\u5220\u9664\uFF1A\u4E0D\u53EF\u6062\u590D",
  "panel.deleteNo": "\u53D6\u6D88",
  "panel.deleted": "\u5DF2\u5220\u9664",
  "panel.deleteFailed": "\u5220\u9664\u5931\u8D25",
  "panel.deleteHint": "\u4F1A\u8BDD\u76EE\u5F55\u79FB\u5165 sessions-trash\uFF08\u53EF\u6062\u590D\uFF09",
  "panel.deleteCurrent": "\u5F53\u524D\u4F1A\u8BDD\u4E0D\u53EF\u5220\u9664",
  "panel.more": "\u663E\u793A\u66F4\u591A\uFF08\u8FD8\u6709 {n} \u4E2A\uFF09",
  "panel.shown": "\u5DF2\u663E\u793A {n} / {total}",
  "panel.archive": "\u5F52\u6863",
  "panel.unarchive": "\u53D6\u6D88\u5F52\u6863",
  "panel.archiveTitle": "\u5F52\u6863\u8BE5\u4F1A\u8BDD\uFF08\u4ECE\u5E38\u7528\u5217\u8868\u6536\u8D77\uFF09",
  "panel.unarchiveTitle": "\u53D6\u6D88\u5F52\u6863\uFF08\u6062\u590D\u5230\u5E38\u7528\u5217\u8868\uFF09",
  "panel.archiveFailed": "\u5F52\u6863\u5931\u8D25",
  "panel.unarchiveFailed": "\u53D6\u6D88\u5F52\u6863\u5931\u8D25",
  "panel.settings": "\u8BBE\u7F6E",
  "panel.settingsTitle": "\u9762\u677F\u8BBE\u7F6E",
  "panel.setting.defaultFilter": "\u9ED8\u8BA4\u663E\u793A",
  "panel.filter.followLast": "\u8DDF\u968F\u4E0A\u6B21",
  "panel.setting.deleteMode": "\u5220\u9664\u65B9\u5F0F",
  "panel.deleteMode.trash": "\u79FB\u5165\u56DE\u6536\u7AD9",
  "panel.deleteMode.purge": "\u5F7B\u5E95\u5220\u9664",
  "panel.setting.deleteNoConfirm": "\u5220\u9664\u514D\u4E8C\u6B21\u786E\u8BA4",
  "panel.setting.purgeNoConfirm": "\u56DE\u6536\u7AD9\u5F7B\u5E95\u5220\u9664\u514D\u4E8C\u6B21\u786E\u8BA4",
  "panel.setting.closeOnOpen": "\u6253\u5F00\u4F1A\u8BDD\u540E\u5173\u95ED\u9762\u677F",
  "panel.setting.panelWidth": "\u9762\u677F\u5BBD\u5EA6",
  "panel.width.auto": "\u81EA\u9002\u5E94",
  "panel.width.fixed": "\u56FA\u5B9A\u5BBD",
  "panel.width.autoHint": "%\uFF08\u9ED8\u8BA4 80\uFF09",
  "panel.width.autoTitle": "\u70B9\u8FD9\u91CC\u5207\u5230\u81EA\u9002\u5E94\u6A21\u5F0F\uFF1A\u5BBD\u5EA6 = \u89C6\u53E3\u5BBD\u5EA6\u7684\u8FD9\u4E2A\u767E\u5206\u6BD4",
  "panel.width.fixedHint": "px\uFF08\u9ED8\u8BA4 860\uFF09",
  "panel.width.fixedTitle": "\u70B9\u8FD9\u91CC\u5207\u5230\u56FA\u5B9A\u5BBD\u6A21\u5F0F\uFF1A\u5355\u4F4D\u4E3A\u50CF\u7D20",
  "panel.trash": "\u56DE\u6536\u7AD9",
  "panel.trashTitle": "\u67E5\u770B\u56DE\u6536\u7AD9",
  "panel.back": "\u8FD4\u56DE\u5217\u8868",
  "panel.trash.empty": "\u56DE\u6536\u7AD9\u662F\u7A7A\u7684",
  "panel.trash.count": "\u56DE\u6536\u7AD9\u6709 {n} \u9879",
  "panel.trash.restore": "\u6062\u590D",
  "panel.trash.purge": "\u5F7B\u5E95\u5220\u9664",
  "panel.trash.purgeAll": "\u6E05\u7A7A\u56DE\u6536\u7AD9",
  "panel.trash.purgeAllConfirm": "\u5F7B\u5E95\u5220\u9664\u56DE\u6536\u7AD9\u5168\u90E8 {n} \u9879\uFF1F",
  "panel.restored": "\u5DF2\u6062\u590D",
  "panel.restoreFailed": "\u6062\u590D\u5931\u8D25",
  "panel.purged": "\u5DF2\u5F7B\u5E95\u5220\u9664",
  "panel.purgeFailed": "\u5F7B\u5E95\u5220\u9664\u5931\u8D25",
  "panel.trash.unknown": "\u672A\u77E5\u4F1A\u8BDD"
};
var en = {
  "entry.label": "Session ID",
  "panel.title": "Session IDs",
  "panel.subtitle": "{n} sessions",
  "panel.empty": "No sessions yet",
  "panel.noMatches": "No matching sessions",
  "panel.search.placeholder": "Search title or ID\u2026",
  "panel.searchScope.label": "Search in",
  "panel.searchScope.all": "All",
  "panel.searchScope.id": "ID",
  "panel.searchScope.name": "Name",
  "panel.search.aria": "Search sessions",
  "panel.close": "Close",
  "panel.copy": "Copy",
  "panel.copied": "Copied",
  "panel.copyFailed": "Copy failed, retry",
  "panel.current": "Current",
  "panel.archived": "Archived",
  "panel.updatedAt": "Updated {t}",
  "panel.time.now": "just now",
  "panel.time.minutes": "{n}m ago",
  "panel.time.hours": "{n}h ago",
  "panel.time.days": "{n}d ago",
  "panel.copyTitle": "Copy session ID",
  "panel.sort.label": "Sort",
  "panel.sort.updatedDesc": "Newest",
  "panel.sort.updatedAsc": "Oldest",
  "panel.sort.title": "By title",
  "panel.filter.label": "Filter",
  "panel.filter.all": "Include archived",
  "panel.filter.active": "Hide archived",
  "panel.filter.archived": "Archived only",
  "panel.autoscroll": "Locate current session",
  "panel.locate": "Locate",
  "panel.locateMissing": "The current session is not in the list (filtered out or deleted)",
  "panel.workspaceFilter.label": "Filter by workspace",
  "panel.workspaceFilter.all": "All workspaces",
  "panel.selected": "{n} selected",
  "panel.clearSelection": "Clear",
  "panel.copySelected": "Copy IDs",
  "panel.copiedSelected": "Copied {n} item(s)",
  "panel.selectAll": "Select all",
  "panel.batchArchive": "Archive",
  "panel.batchUnarchive": "Unarchive",
  "panel.batchDelete": "Delete",
  "panel.batchDone": "{n} done",
  "panel.batchFailed": "{n} failed",
  "panel.jumpHint": "Click the blank area to open this session",
  "panel.copyId": "ID",
  "panel.copyName": "Name",
  "panel.copyPath": "Path",
  "panel.copyBoth": "Copy",
  "panel.copyIdTitle": "Copy the session ID only",
  "panel.copyNameTitle": "Copy the session title only",
  "panel.copyPathTitle": "Copy the absolute session directory path",
  "panel.copyBothTitle": 'Copy "title + space + ID"',
  "panel.subagent": "Subagent",
  "panel.subagentFilter.label": "Subagents",
  "panel.subagentFilter.all": "Include",
  "panel.subagentFilter.hide": "Hide subagents",
  "panel.subagentFilter.only": "Subagents only",
  "panel.hide": "Hide",
  "panel.unhide": "Unhide",
  "panel.hideTitle": "Hide this session (display only \u2014 archive and disk untouched)",
  "panel.unhideTitle": "Unhide",
  "panel.hiddenArea": "Hidden",
  "panel.hiddenEmpty": "No hidden sessions",
  "panel.unhideAll": "Unhide all",
  "panel.groupBy": "Groups",
  "panel.groupByTitle": "Group by workspace",
  "panel.groupFlat": "Flat",
  "panel.groupFlatTitle": "No grouping \u2014 flat list",
  "panel.ungrouped": "Ungrouped",
  "panel.groupUnknown": "(unknown workspace)",
  "panel.jump": "Open",
  "panel.jumpTitle": "Switch to this session",
  "panel.jumpArchived": "Archived sessions cannot be opened \u2014 restore first",
  "panel.jumpFailed": "Switch failed",
  "panel.delete": "Delete",
  "panel.deleteTitle": "Delete this session",
  "panel.deleteConfirm": "Delete?",
  "panel.deleteTrash": "Move to trash",
  "panel.deletePurge": "Delete permanently",
  "panel.deletePurgeHint": "Permanently delete \u2014 not recoverable",
  "panel.deleteNo": "Cancel",
  "panel.deleted": "Deleted",
  "panel.deleteFailed": "Delete failed",
  "panel.deleteHint": "Moves the session folder to sessions-trash (recoverable)",
  "panel.deleteCurrent": "The current session cannot be deleted",
  "panel.more": "Show more\uFF08{n} left\uFF09",
  "panel.shown": "{n} / {total} shown",
  "panel.archive": "Archive",
  "panel.unarchive": "Unarchive",
  "panel.archiveTitle": "Archive this session (fold it away)",
  "panel.unarchiveTitle": "Unarchive (bring it back to the list)",
  "panel.archiveFailed": "Archive failed",
  "panel.unarchiveFailed": "Unarchive failed",
  "panel.settings": "Settings",
  "panel.settingsTitle": "Panel settings",
  "panel.setting.defaultFilter": "Default view",
  "panel.filter.followLast": "Follow last choice",
  "panel.setting.deleteMode": "Delete mode",
  "panel.deleteMode.trash": "Move to trash",
  "panel.deleteMode.purge": "Delete permanently",
  "panel.setting.deleteNoConfirm": "Delete without confirmation",
  "panel.setting.purgeNoConfirm": "Purge without confirmation (trash)",
  "panel.setting.closeOnOpen": "Close the panel after opening a session",
  "panel.setting.panelWidth": "Panel width",
  "panel.width.auto": "Auto",
  "panel.width.fixed": "Fixed",
  "panel.width.autoHint": "% (default 80)",
  "panel.width.autoTitle": "Click to switch to Auto: width = this percentage of the viewport",
  "panel.width.fixedHint": "px (default 860)",
  "panel.width.fixedTitle": "Click to switch to Fixed: width in pixels",
  "panel.trash": "Trash",
  "panel.trashTitle": "Open trash",
  "panel.back": "Back to list",
  "panel.trash.empty": "Trash is empty",
  "panel.trash.count": "{n} item(s) in trash",
  "panel.trash.restore": "Restore",
  "panel.trash.purge": "Delete permanently",
  "panel.trash.purgeAll": "Empty trash",
  "panel.trash.purgeAllConfirm": "Permanently delete all {n} item(s)?",
  "panel.restored": "Restored",
  "panel.restoreFailed": "Restore failed",
  "panel.purged": "Deleted permanently",
  "panel.purgeFailed": "Delete failed",
  "panel.trash.unknown": "Unknown session"
};
var SESSION_ID_NS = "session-id";

// src/client/index.tsx
var name = "dsh-session-id";
var inject = ["slots", "locale", "sessions"];
var ENTRY_ID = "session-id";
var VERSION = "1.8.0";
var BUILD = 25;
function styleRev() {
  try {
    return document.querySelector(`style[data-plugin="${SESSION_ID_PLUGIN_ATTR}"]`)?.getAttribute("data-rev") ?? "(none)";
  } catch {
    return "(err)";
  }
}
function batchPeek() {
  try {
    const batch = document.querySelector(`[data-dsh-part="${SESSION_ID_PART.batch}"]`);
    if (batch === null) return { missing: true };
    const box = batch.getBoundingClientRect();
    const buttons = Array.from(batch.querySelectorAll("button")).map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        text: (node.textContent ?? "").trim().slice(0, 16),
        w: Math.round(rect.width),
        right: Math.round(box.right - rect.right),
        disabled: node.disabled
      };
    });
    return {
      width: Math.round(box.width),
      count: buttons.length,
      buttons,
      tailText: buttons.length === 0 ? "" : buttons[buttons.length - 1].text
    };
  } catch (error) {
    return { error: String(error?.message ?? error) };
  }
}
function probeLook() {
  try {
    const panel = document.querySelector(`[data-dsh-part="${SESSION_ID_PART.panel}"]`);
    const badge = document.querySelector(".sid-badge-current");
    const rows = Array.from(document.querySelectorAll(".sid-list .sid-row"));
    const row = rows.find((node) => node.getBoundingClientRect().height > 40) ?? rows[0];
    const check = row?.querySelector(".sid-row-check") ?? null;
    const paintOf = (node) => node === null ? void 0 : {
      color: getComputedStyle(node).color,
      background: getComputedStyle(node).backgroundColor
    };
    return {
      dark: document.body.hasAttribute("data-ds-dark-theme"),
      panelMounted: panel !== null && panel !== void 0,
      badge: paintOf(badge),
      rows: rows.slice(0, 3).map((node) => ({
        h: Math.round(node.getBoundingClientRect().height),
        w: Math.round(node.getBoundingClientRect().width),
        kids: node.childElementCount
      })),
      check: row === void 0 || check === null ? void 0 : {
        checkHeight: Math.round(check.getBoundingClientRect().height),
        rowHeight: Math.round(row.getBoundingClientRect().height),
        alignSelf: getComputedStyle(check).alignSelf,
        display: getComputedStyle(check).display
      },
      tokens: panel === null || panel === void 0 ? void 0 : {
        blue: getComputedStyle(panel).getPropertyValue("--sid-blue").trim(),
        onBrand: getComputedStyle(panel).getPropertyValue("--sid-on-brand").trim()
      },
      archivedClickable: document.querySelectorAll('.sid-row[data-clickable="true"] .sid-badge-archived').length,
      batch: batchPeek()
    };
  } catch (error) {
    return { error: String(error?.message ?? error) };
  }
}
function probeTrash() {
  try {
    const items = Array.from(document.querySelectorAll(".sid-list .sid-row"));
    const first = items[0];
    return {
      items: items.length,
      first: first === void 0 ? void 0 : {
        h: Math.round(first.getBoundingClientRect().height),
        kids: first.childElementCount,
        hasCheck: first.querySelector(".sid-row-check") !== null,
        actions: Array.from(first.querySelectorAll(".sid-row-actions button")).map((node) => (node.textContent ?? "").trim()),
        text: (first.textContent ?? "").trim().slice(0, 80)
      },
      look: probeLook()
    };
  } catch (error) {
    return { error: String(error?.message ?? error) };
  }
}
function probeRowHit() {
  try {
    const rows = Array.from(document.querySelectorAll(`[data-dsh-part="${SESSION_ID_PART.row}"]`));
    if (rows.length === 0) return { rows: 0, note: "\u9762\u677F\u672A\u6253\u5F00\u6216\u6CA1\u6709\u6E32\u67D3\u51FA\u884C" };
    const row = rows.length > 1 ? rows[1] : rows[0];
    const rect = row.getBoundingClientRect();
    const samples = [];
    for (const fy of [0.25, 0.5, 0.75]) {
      for (const fx of [0.02, 0.5, 0.72, 0.85, 0.93]) {
        const node = document.elementFromPoint(rect.left + rect.width * fx, rect.top + rect.height * fy);
        samples.push({
          at: `${fx}/${fy}`,
          cls: typeof node?.className === "string" ? node.className : "",
          part: node?.getAttribute?.("data-dsh-part") ?? "",
          cursor: node === null ? "" : getComputedStyle(node).cursor
        });
      }
    }
    return { rows: rows.length, rowWidth: Math.round(rect.width), samples, toolbar: measureToolbar(), look: probeLook() };
  } catch (error) {
    return { error: String(error?.message ?? error) };
  }
}
function measureToolbar() {
  try {
    const toolbar = document.querySelector(`[data-dsh-part="${SESSION_ID_PART.toolbar}"]`);
    if (toolbar === null || toolbar === void 0) return { missing: true };
    const box = toolbar.getBoundingClientRect();
    const items = [];
    for (const node of Array.from(toolbar.children)) {
      const rect = node.getBoundingClientRect();
      items.push({
        tag: node.tagName.toLowerCase(),
        cls: typeof node.className === "string" ? node.className : "",
        w: Math.round(rect.width),
        text: (node.textContent ?? "").trim().slice(0, 12)
      });
    }
    const heights = new Set(items.map((item) => Math.round(item.w)));
    const batch = document.querySelector(`[data-dsh-part="${SESSION_ID_PART.batch}"]`);
    const batchButton = batch === null ? null : batch.querySelector(".sid-action");
    const anySelect = toolbar.querySelector("select");
    const firstAction = toolbar.querySelector(".sid-action");
    const fontOf = (node) => node === null ? "" : getComputedStyle(node).fontSize;
    const rowActions = document.querySelector(`[data-dsh-part="${SESSION_ID_PART.row}"] .sid-row-actions`);
    const rowButtons = rowActions === null ? [] : Array.from(rowActions.querySelectorAll(".sid-action")).map((node) => ({
      text: (node.textContent ?? "").trim(),
      w: Math.round(node.getBoundingClientRect().width)
    }));
    return {
      toolbarWidth: Math.round(box.width),
      toolbarHeight: Math.round(box.height),
      items,
      selectWidths: items.filter((item) => item.tag === "select").map((item) => item.w),
      itemCount: heights.size,
      rowButtons,
      heights: {
        toolbar: Math.round(box.height),
        toolbarSelect: anySelect === null ? 0 : Math.round(anySelect.getBoundingClientRect().height),
        toolbarAction: firstAction === null ? 0 : Math.round(firstAction.getBoundingClientRect().height),
        batch: batch === null ? 0 : Math.round(batch.getBoundingClientRect().height),
        batchAction: batchButton === null ? 0 : Math.round(batchButton.getBoundingClientRect().height)
      },
      fonts: {
        toolbarSelect: fontOf(anySelect),
        toolbarAction: fontOf(firstAction),
        batchAction: fontOf(batchButton)
      }
    };
  } catch (error) {
    return { error: String(error?.message ?? error) };
  }
}
var SETTINGS_KEY = "dsh-session-id.settings.v1";
var HIDDEN_KEY = "dsh-session-id.hidden.v1";
var deletedIds = /* @__PURE__ */ new Set();
function createHiddenStore() {
  const read = () => {
    try {
      const raw = window.localStorage.getItem(HIDDEN_KEY);
      if (raw === null || raw === "") return /* @__PURE__ */ new Set();
      const parsed = JSON.parse(raw);
      return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []);
    } catch {
      return /* @__PURE__ */ new Set();
    }
  };
  let cache = read();
  const listeners = /* @__PURE__ */ new Set();
  const commit = (next) => {
    cache = next;
    try {
      window.localStorage.setItem(HIDDEN_KEY, JSON.stringify([...next]));
    } catch {
    }
    for (const listener of listeners) listener();
  };
  return {
    getSnapshot: () => cache,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    toggle: (sessionId) => {
      const next = new Set(cache);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      commit(next);
    },
    setMany: (sessionIds, hidden) => {
      const next = new Set(cache);
      for (const id of sessionIds) {
        if (hidden) next.add(id);
        else next.delete(id);
      }
      commit(next);
    },
    clear: () => {
      commit(/* @__PURE__ */ new Set());
    }
  };
}
function loadSettings() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw === null || raw === "") return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
function saveSettings(settings) {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
  }
}
async function postJson(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const reply = await response.json().catch(() => void 0);
  return { status: response.status, reply };
}
var openPanelFromHost;
function SessionIdEntry({ wide, list, archived, workspaces, hidden, actions, t }) {
  const [open, setOpen] = React3.useState(false);
  const [openView, setOpenView] = React3.useState("list");
  const [openSeq, setOpenSeq] = React3.useState(0);
  const [settings, setSettings] = React3.useState(() => loadSettings());
  const patchSettings = React3.useCallback((patch) => {
    setSettings((previous) => {
      const next = { ...previous, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);
  React3.useEffect(() => {
    const handle = (view) => {
      setOpenView(view ?? "list");
      setOpenSeq((seq) => seq + 1);
      setOpen(true);
    };
    openPanelFromHost = handle;
    return () => {
      if (openPanelFromHost === handle) openPanelFromHost = void 0;
    };
  }, []);
  const handleOpen = () => {
    setOpenView("list");
    setOpen(true);
    report("panel-opened");
  };
  return /* @__PURE__ */ React3.createElement(React3.Fragment, null, /* @__PURE__ */ React3.createElement(
    "button",
    {
      type: "button",
      className: "sid-trigger",
      "data-dsh-plugin": SESSION_ID_PLUGIN_ATTR,
      "data-dsh-part": SESSION_ID_PART.entry,
      "data-wide": wide === true ? "wide" : "rail",
      "aria-label": String(t("entry.label")),
      title: String(t("entry.label")),
      onClick: handleOpen
    },
    /* @__PURE__ */ React3.createElement(SessionIdIcon, null),
    /* @__PURE__ */ React3.createElement("span", { className: "sid-trigger-label" }, t("entry.label"))
  ), open ? /* @__PURE__ */ React3.createElement(
    SessionIdPanel,
    {
      key: openSeq,
      list,
      archived,
      workspaces,
      hidden,
      actions,
      initialView: openView,
      settings,
      onSettingsChange: patchSettings,
      hiddenIds: deletedIds,
      t,
      onClose: () => {
        setOpen(false);
      }
    }
  ) : null);
}
function entryMounted() {
  try {
    return document.querySelector(`[data-dsh-plugin="${SESSION_ID_PLUGIN_ATTR}"][data-dsh-part="${SESSION_ID_PART.entry}"]`) !== null;
  } catch {
    return false;
  }
}
function archivedSourceOf(workspaces) {
  if (workspaces === void 0 || workspaces?.list?.getSnapshot === void 0) return void 0;
  let cache = /* @__PURE__ */ new Set();
  let key = "";
  return {
    getSnapshot: () => {
      let ids = [];
      try {
        const snapshot = workspaces.list.getSnapshot();
        ids = Array.isArray(snapshot?.archivedSessionIds) ? snapshot.archivedSessionIds : [];
      } catch {
        ids = [];
      }
      const nextKey = ids.join(",");
      if (nextKey !== key) {
        key = nextKey;
        cache = new Set(ids);
      }
      return cache;
    },
    subscribe: (listener) => workspaces.list.subscribe(listener)
  };
}
function workspacesSourceOf(workspaces) {
  if (workspaces === void 0 || workspaces?.list?.getSnapshot === void 0) return void 0;
  return {
    getSnapshot: () => workspaces.list.getSnapshot(),
    subscribe: (listener) => workspaces.list.subscribe(listener)
  };
}
function actionsOf(uiWorkspace, archived) {
  const actions = {};
  const forgetArchived = async (sessionId) => {
    try {
      if (archived?.getSnapshot().has(sessionId) === true) await uiWorkspace?.unarchiveSession?.(sessionId);
    } catch {
    }
  };
  if (typeof uiWorkspace?.openSession === "function") {
    actions.open = (sessionId) => {
      try {
        uiWorkspace.openSession(sessionId);
      } catch (error) {
        report("jump-failed", { sessionId, error: String(error).slice(0, 160) });
      }
    };
  }
  if (typeof uiWorkspace?.archiveSession === "function") {
    actions.archive = async (sessionId) => {
      try {
        await uiWorkspace.archiveSession(sessionId, { stopActivity: true });
        return { ok: true };
      } catch (error) {
        return { ok: false, message: String(error?.message ?? error) };
      }
    };
  }
  if (typeof uiWorkspace?.unarchiveSession === "function") {
    actions.unarchive = async (sessionId) => {
      try {
        await uiWorkspace.unarchiveSession(sessionId);
        return { ok: true };
      } catch (error) {
        return { ok: false, message: String(error?.message ?? error) };
      }
    };
  }
  actions.remove = async (sessionId, purge) => {
    try {
      const { status, reply } = await postJson("/api/session-id/delete", { sessionId, purge });
      const ok = status === 200 && reply?.ok === true;
      if (ok) {
        deletedIds.add(sessionId);
        if (purge) await forgetArchived(sessionId);
      }
      return { ok, message: ok ? reply?.mode : reply?.error ?? `HTTP ${status}` };
    } catch (error) {
      return { ok: false, message: String(error?.message ?? error) };
    }
  };
  actions.paths = async (sessionIds) => {
    const { status, reply } = await postJson("/api/session-id/paths", { sessionIds });
    if (status !== 200 || reply?.ok !== true) throw new Error(reply?.error ?? `HTTP ${status}`);
    return reply.paths ?? {};
  };
  actions.listTrash = async () => {
    const response = await fetch("/api/session-id/trash");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const reply = await response.json();
    return Array.isArray(reply?.items) ? reply.items : [];
  };
  actions.purgeTrash = async (names) => {
    try {
      const { status, reply } = await postJson("/api/session-id/trash/purge", names === "all" ? { all: true } : { names });
      const ok = status === 200 && reply?.ok === true;
      if (Array.isArray(reply?.removed)) {
        for (const name2 of reply.removed) {
          const match = /session-[0-9a-fA-F-]{8,64}/.exec(name2);
          if (match !== null) await forgetArchived(match[0]);
        }
      }
      return { ok, message: ok ? void 0 : reply?.error ?? `HTTP ${status}` };
    } catch (error) {
      return { ok: false, message: String(error?.message ?? error) };
    }
  };
  actions.restoreTrash = async (name2) => {
    try {
      const { status, reply } = await postJson("/api/session-id/trash/restore", { name: name2 });
      const ok = status === 200 && reply?.ok === true;
      return { ok, message: ok ? void 0 : reply?.error ?? `HTTP ${status}` };
    } catch (error) {
      return { ok: false, message: String(error?.message ?? error) };
    }
  };
  return actions;
}
function apply(ctx) {
  let localeRegistered = false;
  let slotRegistered = false;
  let slotDeclared = false;
  let disposed = false;
  ctx.effect(installStyles, `${name}: styles`);
  try {
    ctx.effect(
      () => ctx.locale.register(SESSION_ID_NS, { zh, en }),
      `${name}: dictionaries`
    );
    localeRegistered = true;
  } catch (error) {
    report("locale-failed", { error: String(error).slice(0, 200) });
  }
  try {
    ctx.slots.inject("sidebar.footer.action", () => {
      slotDeclared = true;
      let list;
      try {
        const sessions = ctx.get("sessions");
        list = {
          getSnapshot: () => sessions.list.getSnapshot(),
          subscribe: (listener) => sessions.list.subscribe(listener)
        };
      } catch (error) {
        report("sessions-failed", { error: String(error).slice(0, 200) });
        return void 0;
      }
      const archived = archivedSourceOf(ctx.get?.("workspaces"));
      const workspaces = workspacesSourceOf(ctx.get?.("workspaces"));
      const hidden = createHiddenStore();
      const uiWorkspace = ctx.get?.("uiWorkspace");
      const actions = actionsOf(uiWorkspace, archived);
      try {
        const dispose = ctx.slots.register({
          name: "sidebar.footer.action",
          id: ENTRY_ID,
          locale: SESSION_ID_NS,
          inject: () => ({ list, archived, workspaces, hidden, actions })
        }, SessionIdEntry);
        slotRegistered = true;
        report("slot-registered", {
          entryId: ENTRY_ID,
          hasArchived: archived !== void 0,
          hasJump: actions.open !== void 0,
          hasArchiveAction: actions.archive !== void 0
        });
        return dispose;
      } catch (error) {
        report("slot-failed", { error: String(error).slice(0, 200) });
        return void 0;
      }
    });
  } catch (error) {
    report("slot-inject-failed", { error: String(error).slice(0, 200) });
  }
  const selfCheck = async (phase) => {
    if (disposed) return;
    let sessionCount = -1;
    let archivedCount = -1;
    try {
      const snapshot = ctx.get("sessions")?.list?.getSnapshot();
      sessionCount = Array.isArray(snapshot?.ids) ? snapshot.ids.length : -1;
    } catch {
    }
    try {
      const snapshot = ctx.get("workspaces")?.list?.getSnapshot();
      archivedCount = Array.isArray(snapshot?.archivedSessionIds) ? snapshot.archivedSessionIds.length : -1;
    } catch {
    }
    let slotEntries = -1;
    try {
      slotEntries = (ctx.slots.entries("sidebar.footer.action") ?? []).length;
    } catch {
    }
    const reply = await report(phase, {
      plugin: `${name}@${VERSION}`,
      build: BUILD,
      localeRegistered,
      slotRegistered,
      slotDeclared,
      slotEntries,
      sessionCount,
      archivedCount,
      hasWorkspaces: ctx.get?.("workspaces") !== void 0,
      hasUiWorkspace: typeof ctx.get?.("uiWorkspace")?.openSession === "function",
      hasArchiveAction: typeof ctx.get?.("uiWorkspace")?.archiveSession === "function",
      deletedLocally: deletedIds.size,
      settings: loadSettings(),
      styleRev: styleRev(),
      entryMounted: entryMounted()
    });
    if (reply?.commands?.includes("probe-row-hit") === true) {
      if (openPanelFromHost !== void 0) {
        report("selftest-open-panel");
        openPanelFromHost("list");
      }
      window.setTimeout(() => {
        report("row-hit-probe", probeRowHit());
      }, 500);
    }
    if (reply?.commands?.includes("probe-trash") === true) {
      if (openPanelFromHost !== void 0) {
        report("selftest-open-trash");
        openPanelFromHost("trash");
      }
      window.setTimeout(() => {
        report("trash-probe", probeTrash());
      }, 700);
    }
    if (reply?.commands?.includes("open-panel") === true && openPanelFromHost !== void 0) {
      report("selftest-open-panel");
      openPanelFromHost("list");
    }
  };
  report("applied");
  ctx.effect(() => {
    const timers = [
      window.setTimeout(() => {
        void selfCheck("check-2s");
      }, 2e3),
      window.setTimeout(() => {
        void selfCheck("check-8s");
      }, 8e3),
      window.setTimeout(() => {
        void selfCheck("check-20s");
      }, 2e4),
      window.setInterval(() => {
        void selfCheck("tick");
      }, 3e4)
    ];
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
        window.clearInterval(timer);
      }
    };
  }, `${name}: self-check timers`);
  ctx.effect(() => () => {
    disposed = true;
  }, `${name}: dispose flag`);
}
return module.exports; } });
//# sourceMappingURL=client.js.map
