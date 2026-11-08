"""Tests for the OPAL reference compiler. Run: python3 -m unittest opal/test_opalc.py"""
import json
import tempfile
import unittest
from pathlib import Path

import opalc

HERE = Path(__file__).parent

MIN = """# opal t
## decide
lang: python  # which language
## context
ctx {{decide.lang}}
## task a
owns: a.py
do:
1. WRITE a.py in {{decide.lang}}.
verify:
python3 a.py
done: a.py
"""


def errs(text):
    prog, e = opalc.parse(text)
    return e or opalc.validate(prog)


class Parse(unittest.TestCase):
    def test_minimal_program_compiles(self):
        prog, e = opalc.parse(MIN)
        self.assertEqual(e, [])
        self.assertEqual(opalc.validate(prog), [])
        self.assertEqual(prog.context, "ctx python")
        self.assertIn("in python", prog.tasks["a"]["do"])

    def test_header_required(self):
        self.assertTrue(errs("## decide\nx: 1\n")[0].startswith("E_HEADER"))

    def test_fences_and_comments_stripped(self):
        text = MIN.replace("verify:\npython3 a.py", "verify:\n```sh\npython3 a.py\n```")
        prog, _ = opalc.parse(text)
        self.assertEqual(prog.tasks["a"]["verify"], ["python3 a.py"])
        self.assertEqual(prog.decide["lang"], "python")

    def test_budget_header(self):
        prog, _ = opalc.parse(MIN.replace("# opal t\n", "# opal t\nbudget.files: 3\n"))
        self.assertEqual(prog.budget["files"], 3)


class Validate(unittest.TestCase):
    def test_unbound_decision(self):
        self.assertIn("E_UNBOUND: decide.lang has no value", errs(MIN.replace("lang: python", "lang: ?")))

    def test_unknown_decide_ref(self):
        self.assertTrue(any(e.startswith("E_UNKNOWN_DECIDE") for e in errs(MIN.replace("{{decide.lang}}.", "{{decide.nope}}."))))

    def test_missing_verify(self):
        self.assertIn("E_NO_VERIFY: task `a` has no `verify`", errs(MIN.replace("verify:\npython3 a.py\n", "")))

    def test_done_outside_owns(self):
        self.assertTrue(any(e.startswith("E_DONE_OUTSIDE_OWNS") for e in errs(MIN.replace("done: a.py", "done: b.py"))))

    def test_unscoped_add(self):
        self.assertTrue(any(e.startswith("E_UNSCOPED_ADD") for e in errs(MIN.replace("verify:\n", "verify:\ngit add .\n"))))

    def test_ask_at_runtime(self):
        self.assertTrue(any(e.startswith("E_ASK_AT_RUNTIME") for e in errs(MIN.replace("1. WRITE", "1. Ask the user then WRITE"))))

    def test_budget_files(self):
        text = MIN.replace("# opal t\n", "# opal t\nbudget.files: 1\n").replace("owns: a.py", "owns: *.py").replace("done: a.py", "done: a.py, b.py")
        self.assertTrue(any(e.startswith("E_BUDGET_FILES") for e in errs(text)))

    def test_lockfile_warning(self):
        prog, _ = opalc.parse(MIN.replace("1. WRITE a.py", "1. RUN npm install then WRITE a.py"))
        self.assertEqual(opalc.validate(prog), [])
        self.assertTrue(any(w.startswith("W_LOCKFILE") for w in prog.warnings))
        prog, _ = opalc.parse(MIN.replace("1. WRITE a.py", "1. RUN npm install then WRITE a.py").replace("owns: a.py", "owns: a.py, package-lock.json"))
        opalc.validate(prog)
        self.assertEqual(prog.warnings, [])

    def test_cycle(self):
        text = MIN + "needs: b\n## task b\nneeds: a\nowns: b.py\ndo:\n1. WRITE b.py\nverify:\ntrue\ndone: b.py\n"
        self.assertIn("E_CYCLE: task dependency graph has a cycle", errs(text))

    def test_unknown_need(self):
        self.assertTrue(any(e.startswith("E_UNKNOWN_NEED") for e in errs(MIN + "needs: ghost\n")))

    def test_collision_without_dependency(self):
        text = MIN + "## task b\nowns: a.py\ndo:\n1. WRITE a.py\nverify:\ntrue\ndone: a.py\n"
        self.assertTrue(any(e.startswith("E_COLLISION") for e in errs(text)))

    def test_overlap_allowed_with_dependency(self):
        text = MIN + "## task b\nneeds: a\nowns: a.py\ndo:\n1. WRITE a.py\nverify:\ntrue\ndone: a.py\n"
        self.assertEqual(errs(text), [])

    def test_glob_collision(self):
        text = MIN.replace("owns: a.py", "owns: src/**").replace("done: a.py", "done: src/a.py") + \
            "## task b\nowns: src/b/*.py\ndo:\n1. WRITE src/b/x.py\nverify:\ntrue\ndone: src/b/x.py\n"
        self.assertTrue(any(e.startswith("E_COLLISION") for e in errs(text)))


class PlanAndEmit(unittest.TestCase):
    def load_example(self):
        prog, e = opalc.compile_file(HERE / "examples" / "todo-api.opal")
        self.assertEqual(e, [])
        return prog

    def test_example_layers(self):
        prog = self.load_example()
        self.assertEqual(opalc.layers(prog), [["foundation"], ["readme", "schema"], ["todos-routes"], ["tests"]])

    def test_sessions_respect_budget_and_order(self):
        prog = self.load_example()
        p = opalc.plan(prog)
        for s in p["sessions"]:
            self.assertLessEqual(len(s["files"]), prog.budget["files"])
        flat = [t for s in p["sessions"] for t in s["tasks"]]
        self.assertEqual(sorted(flat), sorted(prog.tasks))
        self.assertTrue(p["parallel"])
        self.assertEqual(opalc.plan(prog, serial=True)["parallel"], False)

    def test_pinned_session(self):
        prog, _ = opalc.parse(MIN + "session: 3\n")
        opalc.validate(prog)
        self.assertEqual(opalc.plan(prog)["sessions"][0]["tasks"], ["a"])

    def test_emitted_package_is_self_contained(self):
        prog = self.load_example()
        with tempfile.TemporaryDirectory() as d:
            files = opalc.build(prog, Path(d))
            plan = json.loads((Path(d) / "plan.json").read_text())
            self.assertEqual(len(files), 1 + len(plan["sessions"]))
            first = (Path(d) / "session-1.md").read_text()
            last = (Path(d) / f"session-{len(plan['sessions'])}.md").read_text()
            for needle in ("Agent Contract", "Never ask", "## Decisions", "- framework: hono",
                           "## Task `foundation`", "CHECKPOINT", "git add package.json",
                           "## Handoff — WRITE .opal/handoff-1.json", '"decisions_made"', "9. Orchestrate"):
                self.assertIn(needle, first)
            self.assertNotIn("{{decide.", first)
            self.assertIn("## Prior state", last)
            self.assertIn("## Finally", last)
            self.assertIn("test -e src/routes/todos.ts", last)

    def test_cli(self):
        with tempfile.TemporaryDirectory() as d:
            src = Path(d) / "p.opal"
            src.write_text(MIN)
            self.assertEqual(opalc.main(["check", str(src)]), 0)
            self.assertEqual(opalc.main(["build", str(src), "-o", d]), 0)
            self.assertTrue((Path(d) / "session-1.md").exists())
            src.write_text(MIN.replace("lang: python", "lang: ?"))
            self.assertEqual(opalc.main(["check", str(src)]), 1)


if __name__ == "__main__":
    unittest.main()
