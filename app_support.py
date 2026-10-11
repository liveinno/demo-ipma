"""Fixed public asset bundle and server-side access checks."""

from __future__ import annotations

import base64
import hashlib
import hmac
import re
import secrets
import threading
import time
from collections import deque
from pathlib import Path

ASSET_NAMES = (
    "three.min.js",
    "elements-data.js",
    "viz.js",
    "projects-data.js",
    "projects-galaxy.js",
)
ITERATIONS = 600_000
SCRIPT_TAG = re.compile(r'<script src="([^"]+)"></script>')
CSP = (
    "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; "
    "img-src data:; connect-src 'none'; font-src 'none'; object-src 'none'; "
    "base-uri 'none'; form-action 'none'"
)
EMBED_STYLE = """<style>
  #tutor .card{max-height:calc(100dvh - 40px);overflow-y:auto}
  #legend,#panel,#scenebar,#projbar{bottom:66px}
  @media(max-width:1600px){
    header{display:grid;grid-template-columns:minmax(0,1fr);gap:6px}
    .brandcol{max-width:none;min-width:0}
    .hbtns{min-width:0;max-width:100%;overflow-x:auto;padding-bottom:4px}
    .hbtns>*{flex-shrink:0}
    #swrap{position:relative;top:auto;left:auto;right:auto;width:100%;max-width:none}
    #srchin{width:100%}
    #sres{top:112px;max-height:55vh}
    #struct{top:174px;left:8px;bottom:8px;width:calc(100% - 16px)}
    #panel{top:174px;max-height:calc(100dvh - 240px)}
    #recallbar{top:174px}
    #tutor{padding:12px}
    #tutor .card{padding:20px;max-height:calc(100dvh - 24px)}
  }
  @media(max-width:760px){#panel{top:auto;max-height:56dvh}}
</style>"""


def build_public_document() -> str:
    """Load exactly six files beside this module; never accept a visitor path."""
    asset_dir = Path(__file__).resolve().parent / "assets"
    document = (asset_dir / "index.html").read_text(encoding="utf-8")
    if tuple(SCRIPT_TAG.findall(document)) != ASSET_NAMES:
        raise ValueError("Unexpected public script list")
    scripts = {
        name: (asset_dir / name).read_text(encoding="utf-8") for name in ASSET_NAMES
    }

    def inline(match: re.Match[str]) -> str:
        script = re.sub(r"</script", r"<\/script", scripts[match[1]], flags=re.I)
        return "<script>\n" + script + "\n</script>"

    document = SCRIPT_TAG.sub(inline, document)
    policy = '<meta http-equiv="Content-Security-Policy" content="' + CSP + '">'
    document = document.replace("<head>", "<head>\n" + policy, 1)
    return document.replace("</head>", EMBED_STYLE + "\n</head>", 1)


def document_url(document: str) -> str:
    """A data URL keeps the scene in an opaque browser origin."""
    return "data:text/html;base64," + base64.b64encode(document.encode()).decode()


def make_password_hash(password: str) -> str:
    if not 1 <= len(password) <= 128:
        raise ValueError("Password must contain 1 to 128 characters")
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, ITERATIONS)
    return f"pbkdf2_sha256${ITERATIONS}${salt.hex()}${digest.hex()}"


def validate_password_hash(encoded: str) -> tuple[bytes, bytes]:
    algorithm, rounds, salt_hex, digest_hex = encoded.split("$")
    if algorithm != "pbkdf2_sha256" or rounds != str(ITERATIONS):
        raise ValueError("Unsupported password hash")
    if len(salt_hex) != 32 or len(digest_hex) != 64:
        raise ValueError("Invalid password hash length")
    return bytes.fromhex(salt_hex), bytes.fromhex(digest_hex)


def verify_access(username: str, password: str, expected_user: str, encoded: str) -> bool:
    if not 1 <= len(username) <= 64 or not 1 <= len(password) <= 128:
        return False
    salt, expected_digest = validate_password_hash(encoded)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, ITERATIONS)
    user_ok = hmac.compare_digest(username.encode(), expected_user.encode())
    password_ok = hmac.compare_digest(digest, expected_digest)
    return user_ok and password_ok


class AttemptLimiter:
    """Bounded, process-wide limits; new tabs do not reset the global budget."""

    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.failures: dict[str, deque[float]] = {}
        self.requests: deque[float] = deque()

    def reserve(self, client: str) -> int:
        now = time.monotonic()
        with self.lock:
            self.failures = {
                key: deque(t for t in times if now - t < 300)
                for key, times in self.failures.items()
                if times and now - times[-1] < 300
            }
            while self.requests and now - self.requests[0] >= 60:
                self.requests.popleft()
            failed = self.failures.get(client, deque())
            if len(failed) >= 5:
                return max(1, int(300 - (now - failed[0])) + 1)
            if len(self.requests) >= 60:
                return max(1, int(60 - (now - self.requests[0])) + 1)
            if client not in self.failures and len(self.failures) >= 2048:
                return 60
            self.requests.append(now)
            return 0

    def failure(self, client: str) -> None:
        with self.lock:
            times = self.failures.setdefault(client, deque(maxlen=5))
            times.append(time.monotonic())

    def success(self, client: str) -> None:
        with self.lock:
            self.failures.pop(client, None)
