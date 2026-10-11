"""Login-gated Streamlit host for the public ICB universe."""

import logging
import secrets

import streamlit as st

from app_support import (
    AttemptLimiter,
    build_public_document,
    document_url,
    validate_password_hash,
    verify_access,
)

st.set_page_config(page_title="Учебная вселенная", page_icon="🪐", layout="wide")


@st.cache_resource
def limiter() -> AttemptLimiter:
    return AttemptLimiter()


@st.cache_data(show_spinner=False)
def public_scene_url() -> str:
    return document_url(build_public_document())


def access_settings() -> tuple[str, str]:
    # No fallback account: a deployment without secrets remains closed.
    access = st.secrets["access"]
    username, password_hash = str(access["username"]), str(access["password_hash"])
    if not 1 <= len(username) <= 64:
        raise ValueError("Invalid account name")
    validate_password_hash(password_hash)
    return username, password_hash


def check_login(expected_user: str, password_hash: str) -> bool:
    if st.session_state.get("access_granted", False):
        return True
    st.html("""<style>
      .stMainBlockContainer{max-width:560px;padding-top:9vh}
      h1{font-size:2.4rem!important}
    </style>""")
    st.title("Вход в учебную вселенную")
    st.caption("Исследуй компетентности, связи и учебные проекты в 3D.")
    with st.form("login", clear_on_submit=True):
        username = st.text_input("Логин", max_chars=64, autocomplete="username")
        password = st.text_input(
            "Пароль", type="password", max_chars=128, autocomplete="current-password"
        )
        submitted = st.form_submit_button("Войти", type="primary", width="stretch")
    if submitted:
        # IP is only a best-effort grouping hint; the global budget ignores it.
        client = st.context.ip_address
        if not client:
            client = st.session_state.setdefault("login_client", secrets.token_hex(16))
        wait = limiter().reserve(client)
        if wait:
            st.error(f"Слишком много попыток. Повтори вход через {wait} сек.")
        elif verify_access(username, password, expected_user, password_hash):
            limiter().success(client)
            st.session_state["access_granted"] = True
            st.rerun()
        else:
            limiter().failure(client)
            st.error("Неверный логин или пароль.")
    return False


def main() -> None:
    try:
        username, password_hash = access_settings()
    except (KeyError, ValueError, FileNotFoundError):
        st.error("Доступ пока не настроен. Владелец приложения должен заполнить Secrets.")
        st.stop()
    if not check_login(username, password_hash):
        st.stop()

    st.html("""<style>
      [data-testid="stHeader"]{display:none}
      .stMainBlockContainer{max-width:100%;padding:0}
      .stMain{overflow:hidden}
      iframe{display:block;width:100%;height:100dvh!important;border:0;border-radius:0}
      .st-key-session_exit{position:fixed;left:12px;bottom:12px;width:86px;z-index:100}
      .st-key-session_exit button{min-height:40px;font-size:13px;padding:6px 14px}
    </style>""")
    try:
        # Only this fixed public bundle is sent, and only after server-side login.
        st.iframe(public_scene_url(), height=860, alt="Интерактивная 3D-вселенная компетентностей")
    except (OSError, ValueError):
        logging.getLogger(__name__).exception("Public scene could not be loaded")
        st.error("Не удалось открыть учебную сцену. Сообщи владельцу приложения.")
    with st.container(key="session_exit"):
        if st.button("Выйти", width="stretch"):
            st.session_state["access_granted"] = False
            st.rerun()


if __name__ == "__main__":
    main()
