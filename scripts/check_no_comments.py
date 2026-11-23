import io
import json
import os
import re
import subprocess
import sys
import tokenize

ALLOWLIST_PARTS = {
    "node_modules",
    ".git",
    "dist",
    "build",
    ".venv",
    "venv",
    "htmlcov",
    ".pytest_cache",
    ".ruff_cache",
}

def is_allowlisted_file(file_path):
    parts = os.path.normpath(file_path).split(os.sep)
    for part in parts:
        if part in ALLOWLIST_PARTS:
            return True
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            first_chunk = f.read(512)
            if "@generated" in first_chunk or "AUTO-GENERATED" in first_chunk:
                return True
    except Exception:
        pass
    return False

def check_python_file(file_path):
    violations = []
    try:
        with open(file_path, "rb") as f:
            content = f.read()
    except Exception as e:
        return [f"{file_path}: cannot read file: {e}"]

    try:
        tokens = tokenize.tokenize(io.BytesIO(content).readline)
        for tok in tokens:
            if tok.type == tokenize.COMMENT:
                if tok.start[0] == 1 and tok.string.startswith("#!"):
                    continue
                violations.append(
                    f"{file_path}:{tok.start[0]}:{tok.start[1] + 1}: Python comment found: {tok.string.strip()}"
                )
    except tokenize.TokenError as e:
        violations.append(f"{file_path}: tokenize error: {e}")
    except Exception as e:
        violations.append(f"{file_path}: unexpected error: {e}")

    return violations

def check_ts_files(file_paths):
    if not file_paths:
        return []
    node_script = """
const ts = require('typescript');
const fs = require('fs');

const files = JSON.parse(process.argv[1]);
const violations = [];

for (const file of files) {
  try {
    const text = fs.readFileSync(file, 'utf8');
    const scanner = ts.createScanner(ts.ScriptTarget.Latest, false);
    scanner.setText(text);
    let token = scanner.scan();
    while (token !== ts.SyntaxKind.EndOfFileToken) {
      if (
        token === ts.SyntaxKind.SingleLineCommentTrivia ||
        token === ts.SyntaxKind.MultiLineCommentTrivia
      ) {
        const pos = scanner.getTokenPos();
        const lineAndChar = ts.getLineAndCharacterOfPosition({
          text,
          lineMap: undefined,
          getPositionOfLineAndCharacter: undefined
        }, pos);
        const commentText = scanner.getTokenText();
        if (lineAndChar.line === 0 && commentText.startsWith('#!')) {
          token = scanner.scan();
          continue;
        }
        violations.append = violations.push(
          `${file}:${lineAndChar.line + 1}:${lineAndChar.character + 1}: TypeScript comment found: ${commentText.trim()}`
        );
      }
      token = scanner.scan();
    }
  } catch (err) {
    violations.push(`${file}: scan error: ${err.message}`);
  }
}

console.log(JSON.stringify(violations));
"""
    try:
        res = subprocess.run(
            ["node", "-e", node_script, json.dumps(file_paths)],
            capture_output=True,
            text=True,
            check=True,
        )
        return json.loads(res.stdout)
    except Exception as e:
        return [f"Error running typescript scanner: {e}"]

def check_css_file(file_path):
    violations = []
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
    except Exception as e:
        return [f"{file_path}: cannot read file: {e}"]

    regex = re.compile(r"/\*[\s\S]*?\*/")
    for match in regex.finditer(content):
        start = match.start()
        line = content.count("\n", 0, start) + 1
        col = start - content.rfind("\n", 0, start)
        snippet = match.group(0).replace("\n", " ")[:40]
        violations.append(
            f"{file_path}:{line}:{col}: CSS comment found: {snippet}"
        )

    return violations

def collect_files(target_paths):
    py_files = []
    ts_files = []
    css_files = []

    def handle_file(p):
        if is_allowlisted_file(p):
            return
        ext = os.path.splitext(p)[1].lower()
        if ext == ".py":
            py_files.append(p)
        elif ext in {".ts", ".tsx", ".js", ".jsx"}:
            ts_files.append(p)
        elif ext == ".css":
            css_files.append(p)

    if target_paths:
        for tp in target_paths:
            if os.path.isfile(tp):
                handle_file(tp)
            elif os.path.isdir(tp):
                for root, _, files in os.walk(tp):
                    for file in files:
                        handle_file(os.path.join(root, file))
    else:
        for root, dirs, files in os.walk("."):
            dirs[:] = [d for d in dirs if d not in ALLOWLIST_PARTS]
            for file in files:
                handle_file(os.path.join(root, file))

    return py_files, ts_files, css_files

def main():
    target_paths = sys.argv[1:]
    py_files, ts_files, css_files = collect_files(target_paths)

    all_violations = []

    for pf in py_files:
        all_violations.extend(check_python_file(pf))

    if ts_files:
        chunk_size = 50
        for i in range(0, len(ts_files), chunk_size):
            chunk = ts_files[i : i + chunk_size]
            all_violations.extend(check_ts_files(chunk))

    for cf in css_files:
        all_violations.extend(check_css_file(cf))

    if all_violations:
        print(f"Comment check failed with {len(all_violations)} violation(s):")
        for v in all_violations:
            print(f"  {v}")
        sys.exit(1)

    print("No comments found in scanned files.")
    sys.exit(0)

if __name__ == "__main__":
    main()
