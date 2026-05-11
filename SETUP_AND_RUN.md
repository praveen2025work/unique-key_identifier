# P&L Agent POC — Setup & Run

Step-by-step guide to get the POC running on your manager's machine and demo it end-to-end. Follow the steps in order. Each step shows the command, what to expect, and what to do if it fails.

---

## Prerequisites

| Requirement      | Why                                                 | Check                         |
|------------------|-----------------------------------------------------|-------------------------------|
| Python 3.10+     | FastMCP and the Agent SDK require it               | `python --version`            |
| pip              | Install Python packages                             | `pip --version`               |
| Claude Code CLI  | The orchestrator (option A)                         | `claude --version`            |
| API credentials  | Anthropic API key **or** Bedrock (AOF) credentials  | `echo $ANTHROPIC_API_KEY`     |

Corporate-machine note: if `python` resolves to Python 2, use `python3` and `pip3` everywhere below.

---

## Step 1 — Unzip the POC

```bash
unzip pnl-agents-poc.zip
cd pnl_poc
ls
```

**Expect:** `README.md`, `requirements.txt`, `.mcp.json`, and folders `mcps/`, `orchestrator/`, `data/`, `tests/`.

---

## Step 2 — Create a virtual environment

Skip if you're confident your system Python is clean. Recommended on Barclays managed machines to avoid conflicts with system packages.

```bash
python -m venv .venv
source .venv/bin/activate          # macOS / Linux
# .venv\Scripts\activate           # Windows PowerShell
```

**Expect:** prompt prefixed with `(.venv)`. Anything you `pip install` now stays in this folder.

---

## Step 3 — Install dependencies

```bash
pip install -r requirements.txt
```

**Expect:**

```
Successfully installed mcp-1.x.x claude-agent-sdk-0.2.x ...
```

**If you see** `Cannot uninstall PyJWT ... RECORD file not found`: you're hitting a system-package conflict outside the venv. Re-do Step 2 to use a venv, or run `pip install --ignore-installed PyJWT -r requirements.txt`.

---

## Step 4 — Install / verify Claude Code

```bash
claude --version
```

**If installed:** you'll see a version number like `claude-code 1.x.x`. Move on.

**If not installed:**

```bash
curl -fsSL https://claude.ai/install.sh | bash
# Restart shell or: source ~/.bashrc
claude --version
```

---

## Step 5 — Set credentials

**Option A — Anthropic API directly:**

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Verify:
```bash
echo $ANTHROPIC_API_KEY | head -c 12      # should print "sk-ant-xxxxx"
```

**Option B — Bedrock (matches AOF setup):**

```bash
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_REGION=us-east-1
export AWS_PROFILE=aof-dev               # or whatever profile your AOF account uses
aws sts get-caller-identity              # should return your AOF account
```

Persist these in `~/.bashrc` / `~/.zshrc` if you want them across sessions.

---

## Step 6 — Smoke-test the MCPs

Before running the orchestrator, confirm each MCP imports and its tools work directly. This isolates "is my Python setup good" from "is my Claude setup good."

```bash
cd mcps
python -c "
import sys; sys.path.insert(0, '.')
from monitoring_mcp import list_open_books
from fobo_mcp import run_recon
from exception_mcp import classify_break
from adjustment_mcp import draft_adjustment
from pnl_prep_mcp import assemble_pnl
from commentary_mcp import get_history

print('open books:', len(list_open_books()['open_books']))
print('recon diff:', run_recon('RATES-EUR-001')['diff'])
print('classify:',   classify_break('BRK-001')['classification'])
print('draft:',      draft_adjustment('RATES-EUR-001', 5000, 'test', 'PAD-RATES-002')['status'])
print('assemble:',   assemble_pnl('RATES-EUR-001')['final_pnl'])
print('history:',    len(get_history('RATES-EUR-001')['history']))
print('OK')
"
cd ..
```

**Expect:**

```
open books: 3
recon diff: 5000
classify: market_move
draft: DRAFT
assemble: 2100000
history: 2
OK
```

**If you see** `ModuleNotFoundError: No module named 'mcp'`: Step 3 didn't complete. Re-run it inside your venv.

**Reset the mock data after this test** (the smoke test mutated it):

```bash
python -c "
import json
with open('data/mock_data.json') as f: d = json.load(f)
d['_ephemeral'] = {'_comment': 'reset', 'drafts': [], 'exceptions': [], 'snapshots': []}
with open('data/mock_data.json', 'w') as f: json.dump(d, f, indent=2)
print('reset')
"
rm -f data/audit_log.jsonl
```

---

## Step 7 — Run interactive (Claude Code)

This is the **fastest demo path** and the one to show your manager. Claude Code auto-discovers `.mcp.json` and loads all six agents.

From the project root (the folder containing `.mcp.json`):

```bash
claude
```

**Expect:** Claude Code starts. It shows the six MCP servers loaded (sometimes you need to wait a few seconds).

Once at the prompt, paste:

```
Read orchestrator/system_prompt.md and follow it exactly.
Run the daily P&L workflow for book RATES-EUR-001.
Stop at each toll gate and produce the structured summary at the end.
```

**Expect:** Claude Code:
1. Reads the system prompt
2. Calls `mcp__monitoring__check_book_status` to confirm the book is `open_in_cfc`
3. Calls `mcp__fobo__run_recon` and finds the $5,000 break
4. Calls `mcp__exception__classify_break` → `market_move`
5. Skips drafting an adjustment (because market_move = no adjustment needed)
6. Calls `mcp__pnl_prep__assemble_pnl` → final P&L $2,095,000
7. Calls `mcp__commentary__get_history` + `get_pnl_context`
8. Drafts commentary in the desk-head's voice from prior style
9. Prints the structured summary block

**If Claude Code tries `mcp__adjustment__post_journal`:** it will prompt you for approval. Decline. This is the toll gate working as designed.

To exit: `/exit` or Ctrl-D.

---

## Step 8 — Run programmatic (Agent SDK)

For CI, automation, or replicable demos. Reset state first if you ran Step 7:

```bash
rm -f data/audit_log.jsonl
python -c "
import json
with open('data/mock_data.json') as f: d = json.load(f)
d['_ephemeral'] = {'_comment': 'reset', 'drafts': [], 'exceptions': [], 'snapshots': []}
with open('data/mock_data.json', 'w') as f: json.dump(d, f, indent=2)
"
```

Then:

```bash
python orchestrator/run.py RATES-EUR-001
```

**Expect:** a stream of agent reasoning, tool calls, and a final structured summary. Same logic as Step 7 but non-interactive — the script auto-confirms toll gates with a simulation flag so the full workflow runs through.

**Try other books:**

```bash
python orchestrator/run.py FX-G10-004        # happy path, no breaks
python orchestrator/run.py FX-EM-003         # pending_cfc — orchestrator should stop at gate 1
python orchestrator/run.py RATES-USD-002     # has BRK-002
```

---

## Step 9 — Inspect the audit log

This is **the artifact MRM and Internal Audit would review**. Every tool call, with timestamp, agent name, action, payload.

```bash
cat data/audit_log.jsonl | head -5
```

Pretty-print:

```bash
cat data/audit_log.jsonl | python -c "
import json, sys
for line in sys.stdin:
    r = json.loads(line)
    print(f\"{r['ts'][11:19]}  {r['agent']:<10} {r['action']:<20} {r['payload']}\")
"
```

**Expect:** sequential, timestamped entries showing exactly which agent did what, in what order. Same input twice ⇒ identical sequence of tool calls (numbers reproducible). This is the determinism story for MRM.

Count entries:

```bash
wc -l data/audit_log.jsonl
```

A single complete RATES-EUR-001 happy-path run produces 8–12 entries depending on the agent's decisions.

---

## Step 10 — Reset between runs

After each demo, reset to clean state:

```bash
rm -f data/audit_log.jsonl
python -c "
import json
with open('data/mock_data.json') as f: d = json.load(f)
d['_ephemeral'] = {'_comment': 'reset', 'drafts': [], 'exceptions': [], 'snapshots': []}
with open('data/mock_data.json', 'w') as f: json.dump(d, f, indent=2)
print('clean')
"
```

---

## Demo sequence for the meeting

This is what to walk through, in order, to make the key points land:

1. **Open the architecture slide in the deck.** Six agent tiles.
2. **Open the project folder.** Six files in `mcps/`. One-to-one. *"Each tile is a separate Python process; each is independently testable and MRM-validatable."*
3. **Show `.mcp.json`.** *"That's all Claude Code needs. The orchestrator discovers tools automatically."*
4. **Show `orchestrator/system_prompt.md`.** *"The intelligence — toll-gate rules, stop conditions — lives here. One file, auditable."*
5. **Run Step 7 interactive.** Walk through what each tool call is doing.
6. **Try to draft an over-threshold adjustment.** Manually type: *"Draft an adjustment for RATES-EUR-001 of $50,000 citing PAD-RATES-002."* The agent will call `draft_adjustment` and the tool will reject. *"Policy enforcement at the tool layer, not in the prompt."*
7. **Show `data/audit_log.jsonl`.** *"This is what MRM gets."*
8. **Edit `mock_data.json`** — change `BRK-002` `age_hours` to `1.5`. Re-run for RATES-USD-002. This time it classifies as `book_error` and drafts an adjustment but **stops at the toll gate**. *"Agent proposes, human posts."*

---

## Troubleshooting

**`command not found: claude`** — Claude Code not installed or not on PATH. Re-run Step 4. After install, restart your shell.

**`Cannot uninstall PyJWT ... RECORD file not found`** — system package conflict. Use a venv (Step 2) and re-run Step 3.

**`ANTHROPIC_API_KEY not set`** — env var didn't persist. Re-export it (Step 5) in the same shell you're running from. Or add to `~/.bashrc`.

**`No module named 'mcp'`** — pip install didn't run in the active venv. `which python` and `which pip` should both point inside `.venv/`. If not, re-activate the venv.

**`MCP server "monitoring" failed to start`** — usually a Python path issue or syntax error. From the project root, run `python mcps/monitoring_mcp.py` directly. If it errors, fix the error. If it hangs (waiting for stdin), that's correct — it's an MCP server. Press Ctrl-C and continue.

**Claude Code prompts for permission on every tool call** — `permission_mode` defaults to interactive. The `allowed_tools` list in `orchestrator/run.py` pre-approves reads and drafts. To pre-approve in Claude Code interactive too, type `/permissions` and add `mcp__monitoring__*`, `mcp__fobo__*`, etc. Never pre-approve `mcp__adjustment__post_journal`.

**Audit log empty** — the agents only write when their tools are invoked. If you're not seeing entries, the orchestrator isn't actually calling the MCPs. Check Claude Code output for tool-call lines.

**`post_journal` worked without OTP** — you shouldn't see this. OTP check is in `mcps/adjustment_mcp.py`. If it succeeded with wrong OTP, you've edited the file. Re-extract from the zip.

**Bedrock auth fails** — `aws sts get-caller-identity` first. If that fails, your AWS_PROFILE is wrong or expired. Refresh via the AOF runbook.

---

## What to read next

- `tests/scenarios.md` — six scenarios to exercise the flow, mapped to MRM concerns
- `orchestrator/system_prompt.md` — the orchestrator's behaviour rules (toll gates, hard rules)
- `mcps/_shared.py` — the audit logger; this is where the WORM integration would plug in
- `mcps/adjustment_mcp.py` — the post_journal pattern; this is the four-eyes contract

---

## What this POC is **not**

- Not connected to real MOTIF / BOFC / P&L Engine — all mock data
- Not fanned out across the 200 name PNLs — single-book runs only
- Not persisted beyond JSON files — production needs Oracle / WORM audit store
- Not authenticated — `approver_id` is unchecked, OTP is hard-coded `123456`
- Not MRM-validated — the audit log is the *substrate* MRM would build on, not the validation pack

These are the next investments, in roughly the order the build-sequence slide of the deck shows.
