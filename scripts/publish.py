"""Publish this repository's static build to gh-pages without rewriting history."""

from pathlib import Path
import re
import shutil
import subprocess
import sys
from tempfile import TemporaryDirectory


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "frontend" / "dist"
BRANCH = "gh-pages"


class PublishError(RuntimeError):
    pass


def git(*args: str, cwd: Path = ROOT, allowed: tuple[int, ...] = (0,)) -> subprocess.CompletedProcess[str]:
    # Capture remote errors: never echo a remote URL or authentication material.
    result = subprocess.run(
        ["git", *args], cwd=cwd, capture_output=True, text=True, check=False
    )
    if result.returncode not in allowed:
        raise PublishError(f"Git {args[0]} failed. Check repository access and Git configuration.")
    return result


def checked_origin() -> str:
    origin = git("remote", "get-url", "origin").stdout.strip()
    repository = r"MVChem/mvchem\.github\.io(?:\.git)?/?"
    if re.fullmatch(r"git@github\.com:" + repository, origin, flags=re.IGNORECASE):
        return "git@github.com:MVChem/mvchem.github.io.git"
    if re.fullmatch(r"ssh://git@github\.com/" + repository, origin, flags=re.IGNORECASE):
        return "ssh://git@github.com/MVChem/mvchem.github.io.git"
    if re.fullmatch(r"https://github\.com/" + repository, origin, flags=re.IGNORECASE):
        return "https://github.com/MVChem/mvchem.github.io.git"
    raise PublishError("Origin must point to MVChem/mvchem.github.io on GitHub, without embedded credentials.")


def validate_build() -> None:
    for required in ("index.html", ".nojekyll", "api/site.json"):
        if not (DIST / required).is_file():
            raise PublishError(f"Build is missing {required}. Build the frontend and run export_static.py first.")
    for item in DIST.rglob("*"):
        if item.is_symlink() or ".git" in item.relative_to(DIST).parts:
            raise PublishError("Build must not contain symbolic links or Git metadata.")


def publish() -> None:
    validate_build()
    origin = checked_origin()
    identity = {}
    for key in ("user.name", "user.email"):
        value = git("config", "--get", key, allowed=(0, 1)).stdout.strip()
        if not value:
            raise PublishError(f"Configure git {key} in the source repository before publishing.")
        identity[key] = value

    branch_exists = git(
        "ls-remote", "--exit-code", "--heads", origin, f"refs/heads/{BRANCH}", allowed=(0, 2)
    ).returncode == 0

    with TemporaryDirectory(prefix="mvchem-pages-") as temporary:
        checkout = Path(temporary) / "publish"
        if branch_exists:
            git("clone", "--single-branch", "--branch", BRANCH, "--", origin, str(checkout))
        else:
            checkout.mkdir()
            git("init", cwd=checkout)
            git("checkout", "--orphan", BRANCH, cwd=checkout)
            git("remote", "add", "origin", origin, cwd=checkout)

        for key, value in identity.items():
            git("config", "--local", key, value, cwd=checkout)

        for item in checkout.iterdir():
            if item.name == ".git":
                continue
            if item.is_dir() and not item.is_symlink():
                shutil.rmtree(item)
            else:
                item.unlink()
        for item in DIST.iterdir():
            destination = checkout / item.name
            if item.is_dir():
                shutil.copytree(item, destination)
            else:
                shutil.copy2(item, destination)

        git("add", "--all", cwd=checkout)
        if not git("status", "--porcelain", cwd=checkout).stdout.strip():
            print("Static build is unchanged; nothing to publish.")
            return
        git("commit", "-m", "Deploy MVChem portfolio", cwd=checkout)
        git("push", "origin", f"HEAD:refs/heads/{BRANCH}", cwd=checkout)
        print("Published frontend/dist to MVChem/mvchem.github.io gh-pages.")


if __name__ == "__main__":
    try:
        publish()
    except (PublishError, OSError) as error:
        # OSError can include a path; avoid printing arbitrary environment details.
        message = str(error) if isinstance(error, PublishError) else "A local filesystem or Git command failed."
        print(f"Publish stopped: {message}", file=sys.stderr)
        sys.exit(1)
