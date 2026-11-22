#[cfg(feature = "serde")]
use serde::Serialize;

/**
Rendering engine and engine version parsed from a `User-Agent` string.
*/
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[cfg_attr(
    feature = "serde",
    derive(Serialize),
    serde(tag = "name", rename_all = "snake_case")
)]
pub enum Engine {
    Blink {
        major: u16,
    },
    Gecko {
        major: u16,
    },
    #[cfg_attr(feature = "serde", serde(rename = "webkit"))]
    WebKit {
        version: Option<(u16, u16)>,
    },
    Other,
}

impl Engine {
    pub const fn as_str(&self) -> &'static str {
        match self {
            Self::Blink { .. } => "blink",
            Self::Gecko { .. } => "gecko",
            Self::WebKit { .. } => "webkit",
            Self::Other => "other",
        }
    }

    pub const fn version(&self) -> Option<(u16, u16)> {
        match self {
            Self::Blink { major } | Self::Gecko { major } => Some((*major, 0)),
            Self::WebKit { version } => *version,
            Self::Other => None,
        }
    }
}
