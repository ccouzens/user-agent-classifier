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

[working-directory('typescript/user-agent-classifier')]
build-ts:
    tsc

[working-directory('site')]
dev-site: build-ts
    pnpm exec vite

[working-directory('site')]
build-site: build-ts
    pnpm exec vite build

[working-directory('site')]
preview-site: build-site
    pnpm exec vite preview

[parallel]
tunnel-dev: dev-site _cloudflared-dev

[parallel]
tunnel-preview: preview-site _cloudflared-preview

_cloudflared-dev:
    cloudflared tunnel --url http://localhost:5173

_cloudflared-preview:
    cloudflared tunnel --url http://localhost:4173

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
check-ts: check-ts-src check-ts-tests check-ts-benchmarks check-ts-site check-ts-site-worker

[working-directory('typescript/user-agent-classifier')]
check-ts-src:
    tsc --noEmit

[working-directory('typescript/user-agent-classifier')]
check-ts-tests:
    tsc -p tsconfig.test.json

[working-directory('typescript/benchmarks')]
check-ts-benchmarks: build-ts
    tsc --noEmit

[working-directory('site')]
check-ts-site: build-ts
    tsc --noEmit

[working-directory('site')]
check-ts-site-worker: build-ts
    tsc -p tsconfig.worker.json --noEmit
