[parallel]
format: format-biome format-just format-toml format-rust

format-biome:
    biome check --write

format-just:
    just --fmt

format-toml:
    tombi format .

format-rust:
    cargo fmt --all

[parallel]
format-check: format-check-biome format-check-just format-check-toml format-check-rust

format-check-biome:
    biome format

format-check-just:
    just --fmt --check

format-check-toml:
    tombi format --check .

format-check-rust:
    cargo fmt --all --check

[parallel]
test: test-default test-no-default-features

test-default:
    cargo test --workspace

test-no-default-features:
    cargo test -p user-agent-classifier --no-default-features

[parallel]
check: format-check test check-biome check-toml check-clippy

check-biome:
    biome check

check-toml:
    tombi lint .

check-clippy:
    cargo clippy --workspace --all-targets -- -D warnings
