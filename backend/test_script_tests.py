import os
import stat
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]


def make_executable(path: Path, content: str):
    path.write_text(content)
    mode = path.stat().st_mode
    path.chmod(mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)


def test_backend_script_default_excludes_integration(tmp_path, monkeypatch, capsys):
    fakebin = tmp_path / "fakebin"
    fakebin.mkdir()

    # fake pytest
    pytest_sh = fakebin / "pytest"
    make_executable(pytest_sh, "#!/bin/bash\necho PYTEST $@\nexit 0\n")

    # fake pip
    pip_sh = fakebin / "pip"
    make_executable(pip_sh, "#!/bin/bash\necho PIP $@\nexit 0\n")

    # Create a minimal venv activate script that adds our fakebin to PATH
    venv_activate = REPO_ROOT / "backend" / "venv" / "bin"
    venv_activate.mkdir(parents=True, exist_ok=True)
    activate_sh = venv_activate / "activate"
    make_executable(activate_sh, f"#!/bin/bash\nexport PATH=\"{fakebin}:$PATH\"\n# noop deactivate\ndeactivate() {{ :; }}\n")

    env = os.environ.copy()
    # Ensure our fakebin is first in PATH
    env["PATH"] = str(fakebin) + ":" + env.get("PATH", "")

    res = subprocess.run(["/bin/bash", "./test-backend.sh"], cwd=REPO_ROOT, env=env, capture_output=True, text=True)
    assert res.returncode == 0, res.stdout + res.stderr
    # pytest should be invoked and include -v and not integration
    assert "PYTEST" in res.stdout
    assert "-v" in res.stdout
    assert "not integration" in res.stdout


def test_backend_script_forwards_args_and_respects_m(tmp_path):
    fakebin = tmp_path / "fakebin2"
    fakebin.mkdir()

    pytest_sh = fakebin / "pytest"
    make_executable(pytest_sh, "#!/bin/bash\necho PYTEST $@\nexit 0\n")

    venv_activate = REPO_ROOT / "backend" / "venv" / "bin"
    venv_activate.mkdir(parents=True, exist_ok=True)
    activate_sh = venv_activate / "activate"
    make_executable(activate_sh, f"#!/bin/bash\nexport PATH=\"{fakebin}:$PATH\"\n# noop deactivate\ndeactivate() {{ :; }}\n")

    env = os.environ.copy()
    env["PATH"] = str(fakebin) + ":" + env.get("PATH", "")

    # user-specified test path
    arg = "tests/test_app.py::test_example"
    res = subprocess.run(["/bin/bash", "./test-backend.sh", arg], cwd=REPO_ROOT, env=env, capture_output=True, text=True)
    assert res.returncode == 0
    assert arg in res.stdout
    # user provided -m should avoid default exclusion
    res2 = subprocess.run(["/bin/bash", "./test-backend.sh", "-m", "integration"], cwd=REPO_ROOT, env=env, capture_output=True, text=True)
    assert res2.returncode == 0
    assert "-m integration" in res2.stdout or "-m" in res2.stdout
    assert "not integration" not in res2.stdout


def test_frontend_script_forwards_args_and_appends_watch(tmp_path):
    fakebin = tmp_path / "fakebin3"
    fakebin.mkdir()

    npm_sh = fakebin / "npm"
    make_executable(npm_sh, "#!/bin/bash\necho NPM $@\nexit 0\n")

    # ensure app/node_modules exists so the script won't try to run npm install
    (REPO_ROOT / "app" / "node_modules").mkdir(parents=True, exist_ok=True)

    env = os.environ.copy()
    env["PATH"] = str(fakebin) + ":" + env.get("PATH", "")

    # default run
    res = subprocess.run(["/bin/bash", "./test-frontend.sh"], cwd=REPO_ROOT, env=env, capture_output=True, text=True)
    assert res.returncode == 0
    assert "NPM test" in res.stdout

    # with args: should forward and append --watchAll=false
    pattern = "MyTestPattern"
    res2 = subprocess.run(["/bin/bash", "./test-frontend.sh", pattern], cwd=REPO_ROOT, env=env, capture_output=True, text=True)
    assert res2.returncode == 0
    assert pattern in res2.stdout
    assert "--watchAll=false" in res2.stdout


def test_backend_script_help_outputs_usage(tmp_path):
    fakebin = tmp_path / "fakebin4"
    fakebin.mkdir()

    pytest_sh = fakebin / "pytest"
    make_executable(pytest_sh, "#!/bin/bash\necho PYTEST $@\nexit 0\n")

    venv_activate = REPO_ROOT / "backend" / "venv" / "bin"
    venv_activate.mkdir(parents=True, exist_ok=True)
    activate_sh = venv_activate / "activate"
    make_executable(activate_sh, f"#!/bin/bash\nexport PATH=\"{fakebin}:$PATH\"\n# noop deactivate\ndeactivate() {{ :; }}\n")

    env = os.environ.copy()
    env["PATH"] = str(fakebin) + ":" + env.get("PATH", "")

    res = subprocess.run(["/bin/bash", "./test-backend.sh", "-h"], cwd=REPO_ROOT, env=env, capture_output=True, text=True)
    assert res.returncode == 0
    assert "Usage:" in res.stdout
    assert "Run a single test" in res.stdout or "test_auth.py" in res.stdout


def test_frontend_script_help_outputs_usage(tmp_path):
    fakebin = tmp_path / "fakebin5"
    fakebin.mkdir()

    npm_sh = fakebin / "npm"
    make_executable(npm_sh, "#!/bin/bash\necho NPM $@\nexit 0\n")

    # ensure app/node_modules exists so the script won't try to run npm install
    (REPO_ROOT / "app" / "node_modules").mkdir(parents=True, exist_ok=True)

    env = os.environ.copy()
    env["PATH"] = str(fakebin) + ":" + env.get("PATH", "")

    res = subprocess.run(["/bin/bash", "./test-frontend.sh", "-h"], cwd=REPO_ROOT, env=env, capture_output=True, text=True)
    assert res.returncode == 0
    assert "Usage:" in res.stdout
    assert "testPathPattern" in res.stdout
