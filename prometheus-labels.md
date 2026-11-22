# Using `user-agent-classifier` with Prometheus Labels

Prometheus requires metric labels to have **low, bounded cardinality**. Every
unique combination of key-value label pairs creates a new time series, so
putting raw `User-Agent` strings—or any unbounded field extracted from them—into
a Prometheus label can quickly exhaust memory or expose your metrics server to
cardinality attacks.

`user-agent-classifier` separates **bounded** classifications (safe to use
directly as Prometheus labels) from **unbounded** fields (`browser.name`,
`engine` version, and `browser` version) that must be clamped or bucketed first.

---

## Bounded Fields (Safe as Direct Labels)

### Engine (`engine`)

`Engine::as_str()` (ignoring its version fields) has **4** possible values:

| Variant                 | `as_str()` / Label Value | Description                                                                                                                    |
| :---------------------- | :----------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| `Engine::Blink { .. }`  | `"blink"`                | Chromium / Blink rendering engine (`Chrome`, `Edg`, `SamsungBrowser`, `OPR`, Android WebView, etc.)                            |
| `Engine::Gecko { .. }`  | `"gecko"`                | Mozilla Gecko rendering engine (`Firefox` on desktop and Android)                                                              |
| `Engine::WebKit { .. }` | `"webkit"`               | Apple WebKit rendering engine (`Safari`, `WKWebView`, and all iOS/iPadOS browsers including `CriOS`, `FxiOS`, `EdgiOS`, `GSA`) |
| `Engine::Other`         | `"other"`                | Non-browser clients, bots without a rendering engine token, or unrecognised engines                                            |

### Reported Platform (`reported_platform`)

`ReportedPlatform::as_str()` has **8** possible values:

| Variant                       | `as_str()` / Label Value |
| :---------------------------- | :----------------------- |
| `ReportedPlatform::Android`   | `"Android"`              |
| `ReportedPlatform::CrOS`      | `"CrOS"`                 |
| `ReportedPlatform::IPad`      | `"iPad"`                 |
| `ReportedPlatform::IPhone`    | `"iPhone"`               |
| `ReportedPlatform::Linux`     | `"Linux"`                |
| `ReportedPlatform::Macintosh` | `"Macintosh"`            |
| `ReportedPlatform::Windows`   | `"Windows"`              |
| `ReportedPlatform::Other`     | `"Other"`                |

### Boolean Flags (`is_bot`, `is_webview`, `is_mobile`)

Each boolean classification has **2** possible values (`"true"` or `"false"`):

| Field        | Values              | Description                                                                                                                                            |
| :----------- | :------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `is_bot`     | `"true"`, `"false"` | Automated crawlers, link expanders, monitoring agents, and image/mail proxies (`bingbot`, `Twitterbot`, `Chrome-Lighthouse`, `GoogleImageProxy`, etc.) |
| `is_webview` | `"true"`, `"false"` | Embedded in-app browsers and WebViews (Android `wv` / `Version/4.0`, iOS/macOS `WKWebView`, Facebook, Instagram, Snapchat, GMA SDK, etc.)              |
| `is_mobile`  | `"true"`, `"false"` | Mobile device indicator (`Mobile` token, `Android`, `iPhone`, `iPad`, etc.)                                                                            |

---

## Clamping Browser Names (`browser.name`)

`browser.name` is borrowed directly from the `User-Agent` string and is
**unbounded**. Any client can send an arbitrary product token
(`MyCustomApp/1.0`), so `browser.name` must **never** be passed directly to a
Prometheus label.

Instead, clamp `browser.name` against a fixed allowlist tailored to the
browsers, in-app WebViews, and bots that matter to your website, mapping
everything else to `"Other"` (or `"None"` when `browser` is `None`).

### Suggested Starting List of 20 Browsers

The following 20 browser tokens cover the dominant browsers, mobile WebViews,
and crawlers seen in real-world web traffic and serve as a good starting point:

| Browser Token      | Description                                                           |
| :----------------- | :-------------------------------------------------------------------- |
| `bingbot`          | Microsoft Bing web crawler                                            |
| `Chrome`           | Google Chrome (Desktop & Android) and Chromium-based Android WebViews |
| `CriOS`            | Google Chrome on iOS / iPadOS                                         |
| `Ddg`              | DuckDuckGo browser                                                    |
| `Ecosia`           | Ecosia browser                                                        |
| `Edg`              | Microsoft Edge (Desktop)                                              |
| `EdgA`             | Microsoft Edge on Android                                             |
| `EdgiOS`           | Microsoft Edge on iOS / iPadOS                                        |
| `Facebook`         | Facebook in-app browser (`[FBAN/...]`)                                |
| `Firefox`          | Mozilla Firefox (Desktop & Android)                                   |
| `FxiOS`            | Mozilla Firefox on iOS / iPadOS                                       |
| `GSA`              | Google Search App on iOS / iPadOS                                     |
| `Instagram`        | Instagram in-app browser                                              |
| `LinkPresentation` | Apple iMessage / LinkPresentation link previewer                      |
| `OPR`              | Opera browser (Desktop & Android)                                     |
| `Safari`           | Apple Safari (macOS, iOS, iPadOS)                                     |
| `SamsungBrowser`   | Samsung Internet browser                                              |
| `Silk`             | Amazon Silk browser (Fire tablets / devices)                          |
| `Snapchat`         | Snapchat in-app browser                                               |
| `WKWebView`        | Generic iOS / macOS `WKWebView` without a specific app token          |

---

## Converting Engine Versions to Date Ranges or Feature Support

Do **not** expose `engine` or `browser` version numbers (`(major, minor)`)
directly as Prometheus labels. Version numbers increase continuously over time
and arbitrary version numbers can be spoofed by clients, creating high
cardinality.

Instead, translate the parsed `Engine` and its `(major, minor)` version into
**bounded labels** that answer a specific question for your site—for example:

- **Release date ranges or thresholds** (such as `is_released_2026_or_later`)
- **Feature support** for specific web platform capabilities your site relies on
  (such as `supports_details_content`)

### Example 1: Release Date Threshold (`is_released_2026_or_later`)

Map each rendering engine's version to the first version released in 2026 or
later:

```rust
use user_agent_classifier::Engine;

pub fn is_released_2026_or_later(engine: Engine) -> bool {
	match engine {
		Engine::Blink { major } => major >= 144,
		Engine::Gecko { major } => major >= 147,
		Engine::WebKit {
			version: Some((major, minor)),
		} => (major, minor) >= (26, 3),
		_ => false,
	}
}
```

### Example 2: Feature Support (`supports_details_content`)

If your frontend uses a specific CSS or HTML feature—such as the
[`::details-content` pseudo-element](https://caniuse.com/wf-details-content)
(supported in Blink/Chrome 131+, Gecko/Firefox 143+, and WebKit/Safari
18.4+)—derive a boolean label directly from the engine version:

```rust
use user_agent_classifier::Engine;

pub fn supports_details_content(engine: Engine) -> bool {
	match engine {
		Engine::Blink { major } => major >= 131,
		Engine::Gecko { major } => major >= 143,
		Engine::WebKit {
			version: Some((major, minor)),
		} => (major, minor) >= (18, 4),
		_ => false,
	}
}
```
