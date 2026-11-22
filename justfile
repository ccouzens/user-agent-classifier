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

test:
    cargo test --workspace

check:
    cargo clippy --workspace --all-targets
    cargo check -p user-agent-classifier --no-default-features
    cargo fmt --check
