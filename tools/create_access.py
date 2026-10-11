"""Print a Streamlit Secrets block without storing the plain password."""

import argparse
import getpass
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app_support import make_password_hash

parser = argparse.ArgumentParser(description="Создать настройки доступа для Streamlit Secrets")
parser.add_argument("--username", default="demolive")
args = parser.parse_args()
if not 1 <= len(args.username) <= 64:
    parser.error("Логин должен содержать от 1 до 64 символов")
password = getpass.getpass("Пароль: ")
if password != getpass.getpass("Повтори пароль: "):
    parser.error("Пароли не совпадают")
print("[access]")
print("username = " + json.dumps(args.username))
print("password_hash = " + json.dumps(make_password_hash(password)))
