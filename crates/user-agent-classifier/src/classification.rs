#[cfg(feature = "serde")]
use serde::Serialize;

use super::{Browser, Engine, ReportedPlatform};

/**
Structured classification parsed from a `User-Agent` string.
*/
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[cfg_attr(feature = "serde", derive(Serialize))]
pub struct Classification<'a> {
    /**
    `true` when a `Mobile` token is present in the `User-Agent` (for example
    `Mobile/15E148`, `Mobile Safari`, or `Mobile` in a parenthesized comment).

    Platform tokens alone (such as `Android` on tablets or `iPad`) do not set
    `is_mobile`.
    */
    #[cfg_attr(feature = "serde", serde(skip_serializing_if = "core::ops::Not::not"))]
    pub is_mobile: bool,
    /**
    `true` when `!is_bot` and the `User-Agent` indicates an embedded WebView or
    in-app browser:
    */
    #[cfg_attr(feature = "serde", serde(skip_serializing_if = "core::ops::Not::not"))]
    pub is_webview: bool,
    /**
    `true` when the `User-Agent` matches automated crawler, link-previewer,
    headless browser, or proxy indicators:

    - `compatible`, `+http://`/`+https://` URLs, or `via …` in parenthesized
      comments
    - `HeadlessChrome`
    - Product or token names equal to `"Chrome-Lighthouse"`, starting with
      `"meta-"`, or ending with `bot`/`Bot`, `spider`/`Spider`,
      `crawler`/`Crawler`, or `proxy`/`Proxy`
    */
    #[cfg_attr(feature = "serde", serde(skip_serializing_if = "core::ops::Not::not"))]
    pub is_bot: bool,
    pub reported_platform: ReportedPlatform,
    pub engine: Engine,
    pub browser: Option<Browser<'a>>,
}
