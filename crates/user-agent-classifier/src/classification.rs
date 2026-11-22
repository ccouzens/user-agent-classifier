#[cfg(feature = "serde")]
use serde::Serialize;

use super::{Browser, Engine, ReportedPlatform};

/**
Structured classification parsed from a `User-Agent` string.
*/
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[cfg_attr(feature = "serde", derive(Serialize))]
pub struct Classification<'a> {
    #[cfg_attr(feature = "serde", serde(skip_serializing_if = "core::ops::Not::not"))]
    pub is_mobile: bool,
    #[cfg_attr(feature = "serde", serde(skip_serializing_if = "core::ops::Not::not"))]
    pub is_webview: bool,
    #[cfg_attr(feature = "serde", serde(skip_serializing_if = "core::ops::Not::not"))]
    pub is_bot: bool,
    pub reported_platform: ReportedPlatform,
    pub engine: Engine,
    pub browser: Option<Browser<'a>>,
}
