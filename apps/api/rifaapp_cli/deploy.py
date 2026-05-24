from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path
from shutil import which


def _run(cmd: list[str], cwd: Path, env: dict) -> None:
    print("+", " ".join(cmd))
    subprocess.run(cmd, cwd=str(cwd), env=env, check=True)


def _ensure_terragrunt() -> str:
    terragrunt_bin = os.getenv("TERRAGRUNT_BIN", "terragrunt")
    resolved = which(terragrunt_bin)
    if resolved:
        return resolved
    raise RuntimeError("Terragrunt not found. Install it and ensure it is in PATH.")


def _resolve_paths(infra_dir: str | None) -> tuple[Path, Path]:
    repo_root = Path(__file__).resolve().parent.parent
    if infra_dir:
        infra_path = Path(infra_dir).expanduser().resolve()
        live_candidate = infra_path / "terraform" / "live" / "terragrunt.hcl"
        if live_candidate.exists():
            infra_path = live_candidate.parent
        else:
            env_candidate = infra_path / "envs" / "dev" / "terragrunt.hcl"
            if env_candidate.exists():
                infra_path = env_candidate.parent
    else:
        infra_path = (repo_root / ".." / ".." / "infra" / "hcl" / "live").resolve()
        if not infra_path.exists():
            infra_path = (repo_root / ".." / ".." / "infra" / "hcl" / "envs" / "dev").resolve()
    return repo_root, infra_path


def _load_env_file(env: dict, path: Path) -> None:
    if not path.exists():
        return
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        env.setdefault(key, value)


def main() -> int:
    parser = argparse.ArgumentParser(description="Deploy RifaApp Lambda + infra using Terraform")
    parser.add_argument("--infra-dir", default=os.getenv("INFRA_DIR"))
    parser.add_argument("--skip-build", action="store_true")
    parser.add_argument("--plan-only", action="store_true")
    parser.add_argument("--lambda-only", action="store_true")
    args = parser.parse_args()

    repo_root, infra_path = _resolve_paths(args.infra_dir)
    if not infra_path.exists():
        raise RuntimeError(f"Infra repo not found: {infra_path}")

    env = os.environ.copy()
    env.setdefault("TF_IN_AUTOMATION", "true")
    env.setdefault("TF_INPUT", "false")
    env.setdefault("TG_NON_INTERACTIVE", "true")
    env.setdefault("SSL_CERT_FILE", "/etc/ssl/cert.pem")
    env.setdefault("REQUESTS_CA_BUNDLE", "/etc/ssl/cert.pem")

    uv_bin_candidates = [
        Path.home() / ".local" / "bin" / "uv",
        Path.home() / ".cargo" / "bin" / "uv",
    ]
    for uv_bin in uv_bin_candidates:
        if uv_bin.exists():
            env.setdefault("UV_BIN", str(uv_bin))
            break

    _load_env_file(env, repo_root / ".env")

    if not args.skip_build:
        _run(["bash", str(repo_root / "scripts" / "build_lambda.sh")], cwd=repo_root, env=env)

    lambda_dist = repo_root / "lambda_dist"
    lambda_read_dir = lambda_dist / "read"
    lambda_write_dir = lambda_dist / "write"
    lambda_layer_read_dir = lambda_dist / "layer-read"
    lambda_layer_write_dir = lambda_dist / "layer-write"
    if not lambda_read_dir.exists() or not lambda_write_dir.exists():
        raise RuntimeError("lambda_dist/read or lambda_dist/write not found. Run scripts/build_lambda.sh first.")
    if not lambda_layer_read_dir.exists() or not lambda_layer_write_dir.exists():
        raise RuntimeError("lambda_dist/layer-read or lambda_dist/layer-write not found. Run scripts/build_lambda.sh first.")

    env["TF_VAR_lambda_read_source_dir"] = str(lambda_read_dir)
    env["TF_VAR_lambda_write_source_dir"] = str(lambda_write_dir)
    env["TF_VAR_lambda_layer_read_source_dir"] = str(lambda_layer_read_dir)
    env["TF_VAR_lambda_layer_write_source_dir"] = str(lambda_layer_write_dir)

    terragrunt_bin = _ensure_terragrunt()
    _run([terragrunt_bin, "init"], cwd=infra_path, env=env)

    if args.plan_only:
        if (infra_path / "shared").exists() or (infra_path / "lambdas").exists():
            _run([terragrunt_bin, "run", "--all", "--non-interactive", "--", "plan"], cwd=infra_path, env=env)
        else:
            _run([terragrunt_bin, "plan"], cwd=infra_path, env=env)
        return 0

    if (infra_path / "shared").exists() or (infra_path / "lambdas").exists():
        apply_cmd = [terragrunt_bin, "run", "--all", "--non-interactive", "--", "apply"]
        if args.lambda_only:
            apply_cmd.extend(
                [
                    "--terragrunt-include-dir",
                    "lambdas/rifa-app-read",
                    "--terragrunt-include-dir",
                    "lambdas/rifa-app-write",
                ]
            )
        _run(apply_cmd, cwd=infra_path, env=env)
    else:
        apply_cmd = [terragrunt_bin, "apply", "-auto-approve"]
        if args.lambda_only:
            apply_cmd.extend(["-target=aws_lambda_function.read", "-target=aws_lambda_function.write"])
        _run(apply_cmd, cwd=infra_path, env=env)
    return 0


if __name__ == "__main__":
    sys.exit(main())
