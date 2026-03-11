"""
Duplicate Column Checker & Cleaner — Avro + CSV + Excel
=========================================================
STEP 1: Scans all files and reports duplicate columns.
STEP 2: Auto-removes any "default" known duplicates, then prompts for the rest.

Usage:
    # Scan only
    python duplicate_column_checker.py --path /your/folder

    # Scan + prompt interactively for each file with duplicates
    python duplicate_column_checker.py --path /your/folder --fix

    # Auto-remove known columns (no prompt for these), prompt for anything else
    python duplicate_column_checker.py --path /your/folder --fix --defaults "name, created_at"

    # Auto-remove known columns only, skip prompt entirely for remaining
    python duplicate_column_checker.py --path /your/folder --fix --defaults "name, created_at" --no-prompt

    # Custom output + recursive subfolder scan
    python duplicate_column_checker.py --path /your/folder --fix --output /cleaned --recursive

Options:
    --path        Required. Folder to scan.
    --fix         Enable removal mode (interactive or auto).
    --defaults    Comma-separated list of column names to ALWAYS auto-remove if found as duplicates.
                  Example: --defaults "name, dept, created_at"
    --no-prompt   Skip interactive prompt entirely. Only auto-remove --defaults columns.
    --output      Output folder (default: <path>/cleaned_output).
    --recursive   Scan subfolders recursively.

Dependencies:
    pip install pandas openpyxl fastavro
"""

import os
import copy
import argparse
import pandas as pd
from pathlib import Path
from collections import defaultdict

try:
    import fastavro
    AVRO_SUPPORTED = True
except ImportError:
    AVRO_SUPPORTED = False

SUPPORTED_EXTENSIONS = {".avro", ".csv", ".xlsx", ".xls", ".tsv"}


# ─── File Reading ─────────────────────────────────────────────────────────────

def get_files(path: str, recursive: bool = False) -> list:
    base = Path(path)
    if not base.exists():
        raise FileNotFoundError(f"Path does not exist: {path}")
    pattern = "**/*" if recursive else "*"
    return sorted([
        f for f in base.glob(pattern)
        if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS
    ])


def read_avro(filepath: Path):
    with open(filepath, "rb") as f:
        reader  = fastavro.reader(f)
        schema  = reader.writer_schema
        records = list(reader)
    return schema, records


def read_csv_raw(filepath: Path, sep=",") -> tuple:
    """Read CSV preserving duplicate column names (pandas normally renames them)."""
    raw    = pd.read_csv(filepath, dtype=str, header=None, sep=sep)
    header = raw.iloc[0].tolist()
    data   = raw.iloc[1:].reset_index(drop=True)
    data.columns = range(len(header))
    return header, data


def read_excel_raw(filepath: Path) -> tuple:
    """Read Excel preserving duplicate column names."""
    raw    = pd.read_excel(filepath, dtype=str, header=None)
    header = raw.iloc[0].tolist()
    data   = raw.iloc[1:].reset_index(drop=True)
    data.columns = range(len(header))
    return header, data


# ─── Duplicate Detection ──────────────────────────────────────────────────────

def find_duplicate_columns(all_columns: list) -> dict:
    """Returns {col_name: [positions]} for columns appearing more than once."""
    col_positions = defaultdict(list)
    for idx, col in enumerate(all_columns):
        col_positions[col].append(idx)
    return {col: pos for col, pos in col_positions.items() if len(pos) > 1}


def find_duplicate_fields_avro(schema: dict) -> dict:
    """Recursively finds duplicate field names in Avro schema."""
    duplicates = {}

    def check_fields(fields, path=""):
        col_positions = defaultdict(list)
        for idx, field in enumerate(fields):
            col_positions[field.get("name", "")].append(idx)
        for name, positions in col_positions.items():
            if len(positions) > 1:
                key = f"{path}.{name}" if path else name
                duplicates[key] = positions
        for field in fields:
            ftype = field.get("type", {})
            if isinstance(ftype, dict) and ftype.get("type") == "record":
                check_fields(ftype.get("fields", []), path=field["name"])
            elif isinstance(ftype, list):
                for t in ftype:
                    if isinstance(t, dict) and t.get("type") == "record":
                        check_fields(t.get("fields", []), path=field["name"])

    if isinstance(schema, dict) and "fields" in schema:
        check_fields(schema["fields"])
    return duplicates


# ─── Column Removal ───────────────────────────────────────────────────────────

def remove_columns_flat(header: list, data: pd.DataFrame, cols_to_remove: list):
    """Remove ALL occurrences of specified columns. Returns (new_header, new_data)."""
    remove_set   = set(cols_to_remove)
    keep_indices = [i for i, col in enumerate(header) if col not in remove_set]
    new_header   = [header[i] for i in keep_indices]
    new_data     = data[keep_indices].copy()
    new_data.columns = range(len(new_header))
    return new_header, new_data


def remove_fields_avro(schema: dict, records: list, cols_to_remove: list):
    """Remove specified fields from Avro schema and all records."""
    cleaned_schema = copy.deepcopy(schema)
    remove_set     = set(cols_to_remove)

    def filter_fields(fields):
        kept = [f for f in fields if f.get("name") not in remove_set]
        for field in kept:
            ftype = field.get("type", {})
            if isinstance(ftype, dict) and ftype.get("type") == "record":
                field["type"]["fields"] = filter_fields(ftype["fields"])
            elif isinstance(ftype, list):
                for t in ftype:
                    if isinstance(t, dict) and t.get("type") == "record":
                        t["fields"] = filter_fields(t["fields"])
        return kept

    if "fields" in cleaned_schema:
        cleaned_schema["fields"] = filter_fields(cleaned_schema["fields"])

    valid_keys      = {f["name"] for f in cleaned_schema.get("fields", [])}
    cleaned_records = [{k: v for k, v in rec.items() if k in valid_keys} for rec in records]
    return cleaned_schema, cleaned_records


# ─── File Saving ─────────────────────────────────────────────────────────────

def save_flat(header: list, data: pd.DataFrame, original_path: Path, output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    out_path   = output_dir / original_path.name
    ext        = original_path.suffix.lower()
    out_df     = data.copy()
    out_df.columns = header
    if ext == ".csv":
        out_df.to_csv(out_path, index=False)
    elif ext == ".tsv":
        out_df.to_csv(out_path, sep="\t", index=False)
    elif ext in {".xlsx", ".xls"}:
        out_df.to_excel(out_path, index=False)
    return out_path


def save_avro(schema, records, original_path: Path, output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    out_path = output_dir / original_path.name
    with open(out_path, "wb") as f:
        fastavro.writer(f, schema, records)
    return out_path


# ─── Interactive Prompt ───────────────────────────────────────────────────────

def prompt_user_for_removal(filename: str, all_columns: list, duplicates: dict,
                             already_removing: list) -> list:
    """
    Show columns for a file, highlight duplicates, and ask which remaining ones to remove.
    already_removing = columns being auto-removed via --defaults (shown but not re-asked).
    Returns additional list of column names to remove.
    """
    dup_names        = set(duplicates.keys())
    auto_set         = set(already_removing)
    remaining_dups   = dup_names - auto_set

    print(f"\n  ┌{'─'*58}")
    print(f"  │  📄 {filename}")
    print(f"  ├{'─'*58}")
    print(f"  │  All columns ({len(all_columns)} total):")
    print(f"  │")
    for i, col in enumerate(all_columns):
        if col in auto_set and col in dup_names:
            tag = "   ← 🤖 AUTO-REMOVE (--defaults)"
        elif col in dup_names:
            tag = "   ← ⚠️  DUPLICATE"
        else:
            tag = ""
        print(f"  │    [{i:>2}]  {col}{tag}")
    print(f"  │")

    if auto_set & dup_names:
        print(f"  │  🤖 Auto-removing  : {', '.join(sorted(auto_set & dup_names))}")
    if remaining_dups:
        print(f"  │  ⚠️  Still needs review : {', '.join(sorted(remaining_dups))}")
    else:
        print(f"  │  ✅ All duplicates covered by --defaults. No input needed.")
        print(f"  └{'─'*58}\n")
        return []

    print(f"  │")
    print(f"  │  Enter additional column(s) to REMOVE (comma-separated),")
    print(f"  │  or press ENTER to skip remaining duplicates.")
    print(f"  │  Example: {', '.join(list(remaining_dups)[:3])}")
    print(f"  └{'─'*58}")

    while True:
        raw = input("  Additional columns to remove → ").strip()

        if not raw:
            print("  ⏭️  No additional columns selected.\n")
            return []

        requested = [c.strip() for c in raw.split(",") if c.strip()]
        invalid   = [c for c in requested if c not in all_columns]

        if invalid:
            print(f"\n  ❌ Not found: {invalid}")
            print(f"     Use exact column names from the list above.\n")
            continue

        print(f"\n  Selected for removal : {requested}")
        confirm = input("  Confirm? (y/n) → ").strip().lower()
        if confirm == "y":
            print()
            return requested
        else:
            print("  Re-enter your selection.\n")


# ─── Main ─────────────────────────────────────────────────────────────────────

def scan_and_fix(path: str, fix: bool = False, defaults: list = None,
                 no_prompt: bool = False, output: str = None, recursive: bool = False):

    if not AVRO_SUPPORTED:
        print("\n❌ fastavro not installed. Run: pip install fastavro\n")
        return

    default_cols = set(defaults or [])

    files = get_files(path, recursive)
    if not files:
        print(f"\n⚠️  No supported files found in: {path}")
        print(f"   Supported: {', '.join(SUPPORTED_EXTENSIONS)}")
        return

    output_dir = Path(output) if output else Path(path) / "cleaned_output"

    print(f"\n{'='*62}")
    print(f"  Duplicate Column Checker  |  Avro + CSV + Excel")
    print(f"{'='*62}")
    print(f"  Path          : {path}")
    print(f"  Files         : {len(files)} found")
    print(f"  Mode          : {'FIX' if fix else 'SCAN ONLY'}")
    if default_cols:
        print(f"  Auto-remove   : {', '.join(sorted(default_cols))}")
    if no_prompt and fix:
        print(f"  Prompt        : Disabled (--no-prompt)")
    print(f"  Output        : {output_dir}")
    print(f"{'='*62}")

    # ── PHASE 1: Scan ─────────────────────────────────────────────────────────
    print(f"\n  📋 PHASE 1: Scanning all files...\n")

    scan_results = []

    for filepath in files:
        ext = filepath.suffix.lower()
        try:
            if ext == ".avro":
                schema, records = read_avro(filepath)
                all_columns     = [f["name"] for f in schema.get("fields", [])] if isinstance(schema, dict) else []
                duplicates      = find_duplicate_fields_avro(schema)
                scan_results.append({
                    "filepath": filepath, "ext": ext, "kind": "avro",
                    "all_columns": all_columns, "duplicates": duplicates,
                    "schema": schema, "records": records
                })
            elif ext == ".tsv":
                header, data = read_csv_raw(filepath, sep="\t")
                scan_results.append({
                    "filepath": filepath, "ext": ext, "kind": "flat",
                    "all_columns": header, "duplicates": find_duplicate_columns(header),
                    "header": header, "data": data
                })
            elif ext == ".csv":
                header, data = read_csv_raw(filepath)
                scan_results.append({
                    "filepath": filepath, "ext": ext, "kind": "flat",
                    "all_columns": header, "duplicates": find_duplicate_columns(header),
                    "header": header, "data": data
                })
            else:
                header, data = read_excel_raw(filepath)
                scan_results.append({
                    "filepath": filepath, "ext": ext, "kind": "flat",
                    "all_columns": header, "duplicates": find_duplicate_columns(header),
                    "header": header, "data": data
                })

            r      = scan_results[-1]
            label  = ext.upper().lstrip(".")
            n_dups = len(r["duplicates"])
            status = f"⚠️  {n_dups} duplicate(s)" if n_dups else "✅ Clean"
            print(f"  {status:<30}  {filepath.name}  [{label}]  ({len(r['all_columns'])} cols)")

        except Exception as e:
            print(f"  ❌ ERROR  {filepath.name}: {e}")
            scan_results.append({"filepath": filepath, "kind": "error", "error": str(e)})

    files_with_dups = [r for r in scan_results if r.get("duplicates")]
    clean_files     = [r for r in scan_results if r.get("kind") != "error" and not r.get("duplicates")]
    error_files     = [r for r in scan_results if r.get("kind") == "error"]

    print(f"\n  {'─'*60}")
    print(f"  Scan done  →  {len(files_with_dups)} with duplicates  "
          f"|  {len(clean_files)} clean  |  {len(error_files)} errors")
    print(f"  {'─'*60}")

    if not files_with_dups:
        print("\n  🎉 All files are clean — nothing to remove!\n")
        return

    if not fix:
        print("\n  ℹ️  Run with --fix to remove duplicate columns.\n")
        print(f"  Tip: use --defaults \"{', '.join(list(r['duplicates'].keys()) for r in files_with_dups[:1])[0]}\"")
        print(f"       to auto-remove known columns without prompts.\n")
        return

    # ── PHASE 2: Remove ───────────────────────────────────────────────────────
    print(f"\n  🔧 PHASE 2: Removing duplicate columns...\n")

    fixed_count = 0

    for result in files_with_dups:
        filepath    = result["filepath"]
        all_columns = result["all_columns"]
        duplicates  = result["duplicates"]
        dup_names   = set(duplicates.keys())

        # Columns to auto-remove: intersection of --defaults and actual duplicates in THIS file
        auto_remove = sorted(default_cols & dup_names)

        # Columns still needing a decision
        remaining_dups = dup_names - default_cols

        print(f"  📄 {filepath.name}")

        if auto_remove:
            print(f"     🤖 Auto-removing  : {auto_remove}")
        if remaining_dups:
            print(f"     ⚠️  Still duplicate : {sorted(remaining_dups)}")

        # Interactive prompt for anything not covered by --defaults
        extra_remove = []
        if remaining_dups and not no_prompt:
            extra_remove = prompt_user_for_removal(
                filepath.name, all_columns, duplicates, already_removing=auto_remove
            )
        elif remaining_dups and no_prompt:
            print(f"     ⏭️  Skipping prompt (--no-prompt). Remaining duplicates left as-is.")

        cols_to_remove = list(set(auto_remove + extra_remove))

        if not cols_to_remove:
            print(f"     ⏭️  Nothing to remove — skipped.\n")
            continue

        try:
            before = len(all_columns)
            if result["kind"] == "avro":
                c_schema, c_records = remove_fields_avro(result["schema"], result["records"], cols_to_remove)
                out_path = save_avro(c_schema, c_records, filepath, output_dir)
                after    = len(c_schema.get("fields", []))
            else:
                new_header, new_data = remove_columns_flat(result["header"], result["data"], cols_to_remove)
                out_path = save_flat(new_header, new_data, filepath, output_dir)
                after    = len(new_header)

            print(f"     ✅ Saved  : {out_path}")
            print(f"        Cols  : {before} → {after}   Removed: {cols_to_remove}\n")
            fixed_count += 1

        except Exception as e:
            print(f"     ❌ Failed to save {filepath.name}: {e}\n")

    # ── Summary ───────────────────────────────────────────────────────────────
    print(f"{'='*62}")
    print(f"  DONE")
    print(f"{'='*62}")
    print(f"  Scanned          : {len(scan_results)}")
    print(f"  Had duplicates   : {len(files_with_dups)}")
    print(f"  Cleaned & saved  : {fixed_count}")
    if fixed_count:
        print(f"  Output folder    : {output_dir}")
    print(f"{'='*62}\n")


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Scan files for duplicate columns. Auto-remove known ones, prompt for the rest.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scan only (no changes)
  python duplicate_column_checker.py --path /data/files

  # Interactive mode — prompt for each file
  python duplicate_column_checker.py --path /data/files --fix

  # Auto-remove 'name' and 'dept', prompt for anything else
  python duplicate_column_checker.py --path /data/files --fix --defaults "name, dept"

  # Auto-remove known columns only, no prompts at all
  python duplicate_column_checker.py --path /data/files --fix --defaults "name, dept" --no-prompt

  # Custom output folder
  python duplicate_column_checker.py --path /data/files --fix --defaults "name" --output /data/cleaned
        """
    )
    parser.add_argument("--path",      required=True,
                        help="Folder path to scan")
    parser.add_argument("--fix",       action="store_true",
                        help="Enable removal mode")
    parser.add_argument("--defaults",
                        help='Comma-separated column names to always auto-remove. E.g. "name, dept, created_at"')
    parser.add_argument("--no-prompt", action="store_true",
                        help="Skip interactive prompts — only remove --defaults columns")
    parser.add_argument("--output",
                        help="Output folder (default: <path>/cleaned_output)")
    parser.add_argument("--recursive", action="store_true",
                        help="Scan subfolders recursively")

    args = parser.parse_args()

    # Parse --defaults into a clean list
    default_cols = []
    if args.defaults:
        default_cols = [c.strip() for c in args.defaults.split(",") if c.strip()]

    scan_and_fix(
        path=args.path,
        fix=args.fix,
        defaults=default_cols,
        no_prompt=args.no_prompt,
        output=args.output,
        recursive=args.recursive
    )
