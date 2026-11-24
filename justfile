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
test: test-default test-no-default-features test-ts

test-default:
    cargo test --workspace

test-no-default-features:
    cargo test -p user-agent-classifier --no-default-features

test-ts:
    node --test typescript/user-agent-classifier/tests/*.test.mts

build-ts:
    cd typescript/user-agent-classifier && tsc

[parallel]
check: format-check test check-biome check-toml check-clippy check-ts

bench:
    mkdir -p crates/benchmarks/data
    test -f crates/benchmarks/data/regexes.yaml || curl -fsSL https://raw.githubusercontent.com/ua-parser/uap-core/master/regexes.yaml -o crates/benchmarks/data/regexes.yaml
    cargo bench -p benchmarks

bench-ts: build-ts
    node typescript/benchmarks/compare.mts

check-biome:
    biome check

check-toml:
    tombi lint .

check-clippy:
    cargo clippy --workspace --all-targets -- -D warnings

[parallel]
check-ts: check-ts-src check-ts-tests check-ts-benchmarks

check-ts-src:
    cd typescript/user-agent-classifier && tsc --noEmit

check-ts-tests:
    cd typescript/user-agent-classifier && tsc -p tsconfig.test.json

check-ts-benchmarks:
    cd typescript/benchmarks && tsc --noEmit
