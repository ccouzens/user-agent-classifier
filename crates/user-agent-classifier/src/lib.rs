/*!
Zero-allocation, regex-free, `no_std` Rust `User-Agent` classifier for
observability — extracts rendering engine, platform, mobile, WebView, bot, and
browser.

[`parse`] scans the `User-Agent` string in a single pass without heap
allocations or regular expressions and returns a [`Classification`] with
`browser.name` borrowed directly from the input slice.

# Usage

```
use user_agent_classifier::{Engine, ReportedPlatform, parse};

let ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 27_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.2 Mobile/15E148 Safari/604.1";
let parsed = parse(ua);

assert!(parsed.is_mobile);
assert!(!parsed.is_webview);
assert!(!parsed.is_bot);
assert_eq!(parsed.reported_platform, ReportedPlatform::IPhone);
assert_eq!(parsed.engine, Engine::WebKit { version: Some((27, 2)) });
assert_eq!(parsed.browser.map(|b| (b.name, b.version)), Some(("Safari", Some((27, 2)))));
```

# Cargo features

- `serde` (enabled by default): Implements `serde::Serialize` for
  [`Classification`], [`ReportedPlatform`], [`Engine`], and [`Browser`]. Disable
  with `default-features = false` for zero runtime dependencies.
*/

#![no_std]

#[cfg(test)]
extern crate std;

mod browser;
mod classification;
mod engine;
mod parse;
mod reported_platform;
mod tokenizer;

pub use browser::Browser;
pub use classification::Classification;
pub use engine::Engine;
pub use parse::parse;
pub use reported_platform::ReportedPlatform;
