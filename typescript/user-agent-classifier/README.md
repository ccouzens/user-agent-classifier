# user-agent-classifier

Zero-dependency, regex-free TypeScript `User-Agent` classifier for observability
— extracts rendering engine, platform, mobile, WebView, bot, and browser. The
focus is on `User-Agent` strings that a contemporary website may see in its
traffic.

`parse(ua)` scans the string in a single pass without regular expressions and
returns a `Classification` object.

See
[prometheus-labels.md](https://github.com/ccouzens/user-agent-classifier/blob/main/prometheus-labels.md)
for using the classified fields as Prometheus metric labels (bounded values,
browser allowlisting, and engine version bucketing).

## Usage

```bash
npm install user-agent-classifier
```

```ts
import assert from "node:assert/strict";
import { parse } from "user-agent-classifier";

const ua =
	"Mozilla/5.0 (iPhone; CPU iPhone OS 27_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.2 Mobile/15E148 Safari/604.1";

assert.deepEqual(parse(ua), {
	is_mobile: true,
	is_webview: false,
	is_bot: false,
	reported_platform: "iPhone",
	engine: { name: "webkit", version: [27, 2] },
	browser: { name: "Safari", version: [27, 2, 0] },
});
```

## Design notes

- **ESM-only:** Emits standard ES modules (`.mjs` and `.d.mts`).
- **Zero runtime dependencies:** Works in Node.js, Deno, Bun, browsers, and edge
  runtimes.
- **Shared test suite:** Validated against the same
  [parsed_user_agent_test_cases.json](https://github.com/ccouzens/user-agent-classifier/blob/main/parsed_user_agent_test_cases.json)
  fixture as the Rust crate.

## Benchmarks

`typescript/benchmarks` compares `user-agent-classifier` against `bowser`,
`ua-parser-js`, and `device-detector-js` over the 73 `User-Agent` strings in
`parsed_user_agent_test_cases.json` using `mitata` (`just bench-ts`):

| Library                 | Mean Latency | p75 Latency |
| ----------------------- | ------------ | ----------- |
| `user-agent-classifier` | 146.26 µs    | 143.07 µs   |
| `bowser`                | 862.85 µs    | 864.73 µs   |
| `ua-parser-js`          | 4.02 ms      | 4.11 ms     |
| `device-detector-js`    | 75.72 ms     | 75.87 ms    |

## Links

[GitHub](https://github.com/ccouzens/user-agent-classifier)
