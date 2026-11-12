"""Create a Chrome Web Store ZIP containing only the shipped extension."""
import hashlib
import json
from pathlib import Path
import struct
import zipfile

root = Path(__file__).resolve().parents[1]
extension = root / "extension"
manifest = json.loads((extension / "manifest.json").read_text())
assert manifest["manifest_version"] == 3
assert set(manifest["permissions"]) == {"activeTab", "scripting", "storage"}
assert not manifest.get("host_permissions"), "Do not ship the test-only host grant"
for size in (16, 32, 48, 128):
    icon = extension / manifest["icons"][str(size)]
    data = icon.read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    assert struct.unpack(">II", data[16:24]) == (size, size)
files = sorted(p for p in extension.rglob("*") if p.is_file() and not p.name.startswith("."))
assert all(p.suffix in {".js", ".json", ".html", ".png"} for p in files)
destination = root / "dist"
destination.mkdir(exist_ok=True)
archive = destination / f"annot-{manifest['version']}.zip"
with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as output:
    for path in files:
        info = zipfile.ZipInfo(path.relative_to(extension).as_posix(), (2026, 11, 12, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        output.writestr(info, path.read_bytes())
report = {
    "archive": archive.name,
    "version": manifest["version"],
    "sha256": hashlib.sha256(archive.read_bytes()).hexdigest(),
    "files": [p.relative_to(extension).as_posix() for p in files],
    "reproduce": "npm run package",
    "result": "PASS: manifest, icon dimensions, and package contents validated; this is packaging validation, not browser E2E coverage",
}
(destination / "package-report.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
