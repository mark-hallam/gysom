#!/usr/bin/env python3
"""opalc — reference compiler for OPAL (see SPEC.md). Stdlib only.

    opalc check  program.opal
    opalc build  program.opal [-o out/] [--serial]
"""
from __future__ import annotations

import fnmatch
import json
import re
import sys
from pathlib import Path

DEFAULT_BUDGET = {"files": 12, "words": 1500, "context": 600}
FIELD_RE = re.compile(r"^([a-z][a-z0-9_.]*):(.*)$")
SECTION_RE = re.compile(r"^## (decide|context|finally|task)\s*([a-z][a-z0-9_-]*)?\s*$")
HEADER_RE = re.compile(r"^# opal ([a-z][a-z0-9_-]*)\s*$")
INTERP_RE = re.compile(r"\{\{decide\.([a-z][a-z0-9_-]*)\}\}")
UNSCOPED_ADD_RE = re.compile(r"git\s+add\s+(\.|-A|--all)(\s|$)")
ASK_RE = re.compile(r"\bASK\b|\bask the user\b|\bconfirm with\b", re.I)
REQUIRED_TASK_FIELDS = ("owns", "do", "verify", "done")


class Program:
    def __init__(self):
        self.name = ""
        self.budget = dict(DEFAULT_BUDGET)
        self.decide: dict[str, str] = {}
        self.context = ""
        self.tasks: dict[str, dict] = {}
        self.finally_verify: list[str] = []


# ----------------------------------------------------------------- parsing

def _strip_fence(lines: list[str]) -> list[str]:
    out = [l for l in lines if not l.strip().startswith("```")]
    while out and not out[0].strip():
        out.pop(0)
    while out and not out[-1].strip():
        out.pop()
    return out


def _fields(lines: list[str]) -> dict[str, str]:
    """Parse `key: value` / block-value fields from a section body."""
    fields: dict[str, list[str]] = {}
    cur = None
    for line in lines:
        m = FIELD_RE.match(line)
        if m:
            cur = m.group(1)
            fields[cur] = [m.group(2).strip()] if m.group(2).strip() else []
        elif cur is not None:
            fields[cur].append(line)
    return {k: "\n".join(_strip_fence(v)).strip() for k, v in fields.items()}


def _strip_comment(value: str) -> str:
    return value.split(" #", 1)[0].strip() if " #" in value else value.strip()


def _csv(value: str) -> list[str]:
    return [x.strip() for x in value.replace("\n", ",").split(",") if x.strip()]


def parse(text: str) -> tuple[Program, list[str]]:
    prog, errors = Program(), []
    lines = text.splitlines()
    body = [l for l in lines]
    first = next((i for i, l in enumerate(body) if l.strip()), None)
    if first is None or not HEADER_RE.match(body[first]):
        return prog, ["E_HEADER: first line must be `# opal <name>`"]
    prog.name = HEADER_RE.match(body[first]).group(1)

    sections: list[tuple[str, str | None, list[str]]] = [("header", None, [])]
    for line in body[first + 1:]:
        m = SECTION_RE.match(line)
        if m:
            sections.append((m.group(1), m.group(2), []))
        else:
            sections[-1][2].append(line)

    for kind, ident, slines in sections:
        if kind == "header":
            for k, v in _fields(slines).items():
                if k.startswith("budget."):
                    key = k.split(".", 1)[1]
                    try:
                        prog.budget[key] = int(_strip_comment(v))
                    except ValueError:
                        errors.append(f"E_BUDGET: `{k}` must be an integer")
        elif kind == "decide":
            for k, v in _fields(slines).items():
                prog.decide[k] = _strip_comment(v)
        elif kind == "context":
            prog.context = "\n".join(_strip_fence(slines)).strip()
        elif kind == "finally":
            prog.finally_verify = [l for l in _fields(slines).get("verify", "").splitlines() if l.strip()]
        elif kind == "task":
            if not ident:
                errors.append("E_TASK_ID: `## task` requires an id")
                continue
            if ident in prog.tasks:
                errors.append(f"E_DUP_TASK: task `{ident}` declared twice")
                continue
            f = _fields(slines)
            t = {
                "id": ident,
                "needs": _csv(_strip_comment(f.get("needs", ""))),
                "owns": _csv(_strip_comment(f.get("owns", ""))),
                "do": f.get("do", ""),
                "verify": [l for l in f.get("verify", "").splitlines() if l.strip()],
                "done": _csv(_strip_comment(f.get("done", ""))),
                "commit": _strip_comment(f.get("commit", "")),
                "session": None,
            }
            if f.get("session"):
                try:
                    t["session"] = int(_strip_comment(f["session"]))
                except ValueError:
                    errors.append(f"E_SESSION: task `{ident}` session must be an integer")
            prog.tasks[ident] = t
    return prog, errors


# -------------------------------------------------------------- validation

def _interpolate(prog: Program, text: str, where: str, errors: list[str]) -> str:
    def sub(m):
        key = m.group(1)
        if key not in prog.decide:
            errors.append(f"E_UNKNOWN_DECIDE: {where} references decide.{key}")
            return m.group(0)
        return prog.decide[key]
    return INTERP_RE.sub(sub, text)


def _depends(prog: Program, a: str, b: str) -> bool:
    """True if task a transitively needs task b."""
    seen, stack = set(), list(prog.tasks[a]["needs"])
    while stack:
        n = stack.pop()
        if n == b:
            return True
        if n in seen or n not in prog.tasks:
            continue
        seen.add(n)
        stack.extend(prog.tasks[n]["needs"])
    return False


def _globs_overlap(g1: str, g2: str, files1: list[str], files2: list[str]) -> bool:
    if g1 == g2:
        return True
    return any(fnmatch.fnmatch(f, g1) for f in files2) or any(fnmatch.fnmatch(f, g2) for f in files1)


def layers(prog: Program) -> list[list[str]]:
    """Kahn's algorithm into parallel layers. Raises ValueError on cycle."""
    indeg = {t: len([n for n in prog.tasks[t]["needs"] if n in prog.tasks]) for t in prog.tasks}
    out: list[list[str]] = []
    ready = sorted(t for t, d in indeg.items() if d == 0)
    placed = 0
    while ready:
        out.append(ready)
        placed += len(ready)
        nxt = []
        for t in prog.tasks:
            if indeg[t] > 0 and any(n in ready for n in prog.tasks[t]["needs"]):
                indeg[t] -= sum(1 for n in prog.tasks[t]["needs"] if n in ready)
                if indeg[t] == 0:
                    nxt.append(t)
        ready = sorted(nxt)
    if placed != len(prog.tasks):
        raise ValueError("cycle")
    return out


def validate(prog: Program) -> list[str]:
    errors: list[str] = []
    b = prog.budget

    for k, v in prog.decide.items():
        if v in ("", "?"):
            errors.append(f"E_UNBOUND: decide.{k} has no value")

    if len(prog.context.split()) > b["context"]:
        errors.append(f"E_BUDGET_CONTEXT: context is {len(prog.context.split())} words (budget {b['context']})")
    prog.context = _interpolate(prog, prog.context, "context", errors)

    for tid, t in prog.tasks.items():
        for fld in REQUIRED_TASK_FIELDS:
            if not t[fld]:
                errors.append(f"E_NO_{fld.upper()}: task `{tid}` has no `{fld}`")
        for n in t["needs"]:
            if n not in prog.tasks:
                errors.append(f"E_UNKNOWN_NEED: task `{tid}` needs unknown task `{n}`")
        t["do"] = _interpolate(prog, t["do"], f"task {tid}", errors)
        t["verify"] = [_interpolate(prog, v, f"task {tid}", errors) for v in t["verify"]]
        t["commit"] = _interpolate(prog, t["commit"], f"task {tid}", errors)
        words = len(t["do"].split())
        if words > b["words"]:
            errors.append(f"E_BUDGET_WORDS: task `{tid}` do is {words} words (budget {b['words']})")
        if len(t["done"]) > b["files"]:
            errors.append(f"E_BUDGET_FILES: task `{tid}` has {len(t['done'])} done files (budget {b['files']})")
        for f in t["done"]:
            if not any(fnmatch.fnmatch(f, g) for g in t["owns"]):
                errors.append(f"E_DONE_OUTSIDE_OWNS: task `{tid}` done file `{f}` matches no owns glob")
        blob = "\n".join([t["do"], *t["verify"], t["commit"]])
        if UNSCOPED_ADD_RE.search(blob):
            errors.append(f"E_UNSCOPED_ADD: task `{tid}` uses `git add .`/`-A`; stage the done files")
        if ASK_RE.search(t["do"]):
            errors.append(f"E_ASK_AT_RUNTIME: task `{tid}` asks the human; move it to `## decide`")

    ids = list(prog.tasks)
    for i, a in enumerate(ids):
        for c in ids[i + 1:]:
            if _depends(prog, a, c) or _depends(prog, c, a):
                continue
            ta, tc = prog.tasks[a], prog.tasks[c]
            for g1 in ta["owns"]:
                for g2 in tc["owns"]:
                    if _globs_overlap(g1, g2, ta["done"], tc["done"]):
                        errors.append(f"E_COLLISION: tasks `{a}` and `{c}` both own `{g1}`/`{g2}` and neither needs the other")
                        break
                else:
                    continue
                break

    if not any(e.startswith("E_UNKNOWN_NEED") for e in errors):
        try:
            layers(prog)
        except ValueError:
            errors.append("E_CYCLE: task dependency graph has a cycle")
    return errors


# ---------------------------------------------------------------- planning

def plan(prog: Program, serial: bool = False) -> dict:
    lyrs = layers(prog)
    sessions: dict[int, list[str]] = {}
    for t in prog.tasks.values():
        if t["session"] is not None:
            sessions.setdefault(t["session"], []).append(t["id"])
    next_id = max(sessions, default=0) + 1
    for layer in lyrs:
        cur, count = [], 0
        for tid in layer:
            if prog.tasks[tid]["session"] is not None:
                continue
            n = len(prog.tasks[tid]["done"])
            if cur and count + n > prog.budget["files"]:
                sessions[next_id] = cur
                next_id += 1
                cur, count = [], 0
            cur.append(tid)
            count += n
        if cur:
            sessions[next_id] = cur
            next_id += 1
    ordered = [sessions[k] for k in sorted(sessions)]
    serial_order = [t for layer in lyrs for t in layer]
    return {
        "program": prog.name,
        "budget": prog.budget,
        "layers": lyrs,
        "sessions": [{"id": i + 1, "tasks": ts, "files": [f for t in ts for f in prog.tasks[t]["done"]]} for i, ts in enumerate(ordered)],
        "serial_order": serial_order,
        "parallel": not serial and any(len(l) > 1 for l in lyrs),
        "manifest": [f for t in prog.tasks.values() for f in t["done"]],
    }


# ---------------------------------------------------------------- emission

CONTRACT = """## Agent Contract (binding)
1. Never ask. Every decision is in the Decisions table. If something cannot be decided from this package and the workspace, STOP, write the handoff with status "blocked" and the exact question in blockers, and end.
2. Verify is truth. A task is DONE only when every verify command exits 0 and every done file exists. Report actual output on failure.
3. Stay inside owns. Do not create or modify any path outside the task's owns globs.
4. Scoped commits. Stage exactly the done files. Never `git add .`.
5. Checkpoint. At every CHECKPOINT marker, WRITE the handoff with status "in_progress". If you resume with no memory, READ the handoff first.
6. No scope creep. Do not refactor, rename, improve, or add anything not listed.
7. Fail loudly. On the first verify failure you cannot fix inside owns, stop and hand off.
8. Hand off. Your last action is WRITE handoff-{n}.json. A session with no handoff did not happen.
"""


def _handoff_template(prog: Program, n: int, tasks: list[str]) -> str:
    return json.dumps({
        "program": prog.name, "session": n, "status": "done | in_progress | blocked | failed",
        "tasks_done": tasks, "files_created": [], "files_modified": [],
        "verify": [{"cmd": "<command>", "exit": 0}], "blockers": [], "notes": "",
    }, indent=2)


def emit_session(prog: Program, p: dict, s: dict, serial: bool) -> str:
    n, total = s["id"], len(p["sessions"])
    layer_of = {t: i + 1 for i, l in enumerate(p["layers"]) for t in l}
    out = [f"# OPAL session {n} of {total} — {prog.name}", "", CONTRACT.replace("{n}", str(n))]
    preds = sorted({d for t in s["tasks"] for d in prog.tasks[t]["needs"]})
    out += ["## Header",
            f"- program: {prog.name}", f"- session: {n} of {total}",
            f"- layer: {', '.join(str(layer_of[t]) for t in s['tasks'])}",
            f"- tasks: {', '.join(s['tasks'])}",
            f"- requires done: {', '.join(preds) or 'none'}",
            f"- file budget: {len(s['files'])} / {prog.budget['files']}",
            f"- execution: {'tasks in this session are independent; SPAWN them concurrently if the runtime allows' if len(s['tasks']) > 1 and not serial else 'run tasks in listed order'}",
            ""]
    out += ["## Decisions (final — do not revisit)"] + [f"- {k}: {v}" for k, v in prog.decide.items()] + [""]
    out += ["## Context", prog.context, ""]
    if n > 1:
        out += ["## Prior state", f"READ handoff-{n-1}.json before starting. Its tasks_done must include: {', '.join(preds) or 'none'}. If not, STOP with status blocked.", ""]
    for tid in s["tasks"]:
        t = prog.tasks[tid]
        out += [f"## Task `{tid}`", f"- owns: {', '.join(t['owns'])}", f"- needs: {', '.join(t['needs']) or 'none'}", "", "### Do"]
        for i, line in enumerate([l for l in t["do"].splitlines() if l.strip()], 1):
            out.append(line)
            if i % 3 == 0:
                out.append(f"CHECKPOINT — WRITE handoff-{n}.json (status in_progress)")
        out += ["", "### Verify (all must exit 0)", "```sh", *t["verify"], "```", "",
                "### Done files", *[f"- {f}" for f in t["done"]], ""]
        if t["commit"]:
            out += ["### Commit", "```sh", f"git add {' '.join(t['done'])}", f"git commit -m {json.dumps(t['commit'])}", "```", ""]
    out += ["## Session verify", "```sh", *[f"test -e {f}" for f in s["files"]], "```", ""]
    if n == total and prog.finally_verify:
        out += ["## Finally (whole-program audit)", "```sh", *prog.finally_verify, *[f"test -e {f}" for f in p["manifest"]], "```", ""]
    out += [f"## Handoff — WRITE handoff-{n}.json", "```json", _handoff_template(prog, n, s["tasks"]), "```"]
    return "\n".join(out) + "\n"


def build(prog: Program, outdir: Path, serial: bool = False) -> list[Path]:
    p = plan(prog, serial)
    outdir.mkdir(parents=True, exist_ok=True)
    written = [outdir / "plan.json"]
    written[0].write_text(json.dumps(p, indent=2) + "\n")
    for s in p["sessions"]:
        f = outdir / f"session-{s['id']}.md"
        f.write_text(emit_session(prog, p, s, serial))
        written.append(f)
    return written


# --------------------------------------------------------------------- cli

def compile_file(path: Path) -> tuple[Program, list[str]]:
    prog, errors = parse(path.read_text())
    if errors:
        return prog, errors
    return prog, validate(prog)


def main(argv: list[str]) -> int:
    if len(argv) < 2 or argv[0] not in ("check", "build"):
        print(__doc__.strip())
        return 2
    cmd, src = argv[0], Path(argv[1])
    outdir = Path(argv[argv.index("-o") + 1]) if "-o" in argv else Path("out")
    serial = "--serial" in argv
    prog, errors = compile_file(src)
    for e in errors:
        print(e, file=sys.stderr)
    if errors:
        print(f"{len(errors)} error(s)", file=sys.stderr)
        return 1
    if cmd == "check":
        p = plan(prog, serial)
        print(f"ok: {prog.name} — {len(prog.tasks)} tasks, {len(p['layers'])} layers, {len(p['sessions'])} sessions, {len(p['manifest'])} files")
        return 0
    for f in build(prog, outdir, serial):
        print(f)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
