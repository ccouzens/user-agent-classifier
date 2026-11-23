# user-agent-classifier

Regex-free, single-pass `User-Agent` classifier for observability — extracts
rendering engine, platform, mobile, WebView, bot, and browser. The focus is on
`User-Agent` strings that a contemporary website may see in its traffic.

Available in both **Rust** and **TypeScript**, sharing a common design and test
suite:

- **Rust:**
  [crates/user-agent-classifier](crates/user-agent-classifier/README.md)
  (`no_std`, zero-allocation, `crates.io` / `docs.rs`)
- **TypeScript:**
  [typescript/user-agent-classifier](typescript/user-agent-classifier/README.md)
  (zero-dependency, ESM-only)

See [prometheus-labels.md](prometheus-labels.md) for using the classified fields
as Prometheus metric labels (bounded values, browser allowlisting, and engine
version bucketing).

See [parsed_user_agent_test_cases.json](parsed_user_agent_test_cases.json) for a
shared set of examples illustrating how various browser, WebView, and bot
`User-Agent` strings are parsed.

## Workspace layout

- `crates/user-agent-classifier`: Core Rust library crate.
- `crates/benchmarks`: Rust ecosystem benchmark suite (`divan`).
- `typescript/user-agent-classifier`: Core TypeScript library package.
- `parsed_user_agent_test_cases.json`: Shared JSON test suite used by both Rust
  and TypeScript.

## Development

```sh
just check
just test
just build-ts
just bench
just format
just format-check
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Links

- [Rust crate on crates.io](https://crates.io/crates/user-agent-classifier)
- [Rust docs on docs.rs](https://docs.rs/user-agent-classifier/latest/user_agent_classifier/)
- [GitHub](https://github.com/ccouzens/user-agent-classifier)
