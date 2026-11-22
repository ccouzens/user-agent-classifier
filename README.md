# user-agent-classifier

Zero-allocation, regex-free Rust `User-Agent` classifier for observability —
extracts rendering engine, platform, mobile, WebView, bot, and browser.

`ParsedUserAgent::parse(ua)` scans the string in a single pass without heap
allocations or regular expressions and borrows `browser.name` directly from the
input slice.

See [prometheus-labels.md](prometheus-labels.md) for using the classified fields
as Prometheus metric labels (bounded values, browser allowlisting, and engine
version bucketing).

## Usage

```rust
use user_agent_classifier::{Engine, ParsedUserAgent, ReportedPlatform};

let ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 27_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.2 Mobile/15E148 Safari/604.1";
let parsed = ParsedUserAgent::parse(ua);

assert!(parsed.is_mobile);
assert!(!parsed.is_webview);
assert!(!parsed.is_bot);
assert_eq!(parsed.reported_platform, ReportedPlatform::IPhone);
assert_eq!(parsed.engine, Engine::WebKit { version: Some((27, 2)) });
assert_eq!(parsed.browser.map(|b| (b.name, b.version)), Some(("Safari", Some((27, 2)))));
```

### Cargo features

- `serde` (enabled by default): Implements `serde::Serialize` for
  `ParsedUserAgent`, `ReportedPlatform`, `Engine`, and `Browser`, and
  `serde::Serialize` / `serde::Deserialize` for `UserAgent`. Disable with
  `default-features = false` for zero runtime dependencies.

## Workspace layout

- `crates/user-agent-classifier`: Core Rust library crate.
- `parsed_user_agent_test_cases.json`: Shared JSON test suite.

## Development

```sh
cargo test --workspace
cargo clippy --workspace --all-targets
cargo fmt --check
```
