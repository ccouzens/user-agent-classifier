# user-agent-classifier

Zero-allocation, regex-free Rust `User-Agent` classifier for observability —
extracts rendering engine, platform, mobile, WebView, bot, and browser. The
focus is on `User-Agent` strings that a contemporary website may see in its
traffic.

`ParsedUserAgent::parse(ua)` scans the string in a single pass without heap
allocations or regular expressions and borrows `browser.name` directly from the
input slice.

See
[prometheus-labels.md](https://github.com/ccouzens/user-agent-classifier/blob/main/prometheus-labels.md)
for using the classified fields as Prometheus metric labels (bounded values,
browser allowlisting, and engine version bucketing).

API documentation is available on
[docs.rs](https://docs.rs/user-agent-classifier).

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

See
[parsed_user_agent_test_cases.json](https://github.com/ccouzens/user-agent-classifier/blob/main/parsed_user_agent_test_cases.json)
for a set of examples illustrating how various browser, WebView, and bot
`User-Agent` strings are parsed. In the JSON output, `is_mobile`, `is_webview`,
and `is_bot` are omitted when `false`, and engine version fields are only
present on engine variants that carry them (`major` on `blink` and `gecko`,
`version` on `webkit`, and none on `other`).

### Cargo features

- `serde` (enabled by default): Implements `serde::Serialize` for
  `ParsedUserAgent`, `ReportedPlatform`, `Engine`, and `Browser`, and
  `serde::Serialize` / `serde::Deserialize` for `UserAgent`. Disable with
  `default-features = false` for zero runtime dependencies.

## Workspace layout

- `crates/user-agent-classifier`: Core Rust library crate.
- `crates/benchmarks`: Ecosystem benchmark suite (`divan`).
- `parsed_user_agent_test_cases.json`: Shared JSON test suite.

## Benchmarks

`crates/benchmarks` compares `user-agent-classifier` against `woothee`,
`user-agent-parser`, and `uaparser` over the 73 `User-Agent` strings in
`parsed_user_agent_test_cases.json` and representative single cases:

| Benchmark              | `user-agent-classifier` | `woothee`                       | `user-agent-parser`             | `uaparser`                         |
| ---------------------- | ----------------------- | ------------------------------- | ------------------------------- | ---------------------------------- |
| Full corpus (73 UAs)   | 25.26 µs (0 allocs)     | 75.06 µs (339 allocs, 10.26 KB) | 8.208 ms (206 allocs, 12.62 KB) | 25.05 ms (13,539 allocs, 915.5 KB) |
| Desktop Chrome         | 239.6 ns (0 allocs)     | 632.3 ns (4 allocs, 128 B)      | 108.9 µs (2 allocs, 176 B)      | 258.2 µs (282 allocs, 20.22 KB)    |
| Mobile Safari          | 388.1 ns (0 allocs)     | 981.6 ns (6 allocs, 164 B)      | 153.6 µs (3 allocs, 192 B)      | 341.1 µs (361 allocs, 24.62 KB)    |
| Android WebView        | 428.6 ns (0 allocs)     | 771.5 ns (5 allocs, 160 B)      | 113.3 µs (4 allocs, 240 B)      | 409.5 µs (191 allocs, 13.19 KB)    |
| Bot (`HeadlessChrome`) | 248.6 ns (0 allocs)     | 639.3 ns (4 allocs, 128 B)      | 109.5 µs (2 allocs, 160 B)      | 364.5 µs (260 allocs, 18.44 KB)    |

Median latency and heap allocations reported by `divan` (`just bench`).

## Development

```sh
just check
just test
just bench
just format
just format-check
```

## Contributing

See
[CONTRIBUTING.md](https://github.com/ccouzens/user-agent-classifier/blob/main/CONTRIBUTING.md).
