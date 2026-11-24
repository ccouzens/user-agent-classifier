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
    Ladybird {
        version: Option<(u16, u16, u16)>,
    },
    Servo {
        version: Option<(u16, u16, u16)>,
    },
    Other,
}

impl Engine {
    pub const fn as_str(&self) -> &'static str {
        match self {
            Self::Blink { .. } => "blink",
            Self::Gecko { .. } => "gecko",
            Self::WebKit { .. } => "webkit",
            Self::Ladybird { .. } => "ladybird",
            Self::Servo { .. } => "servo",
            Self::Other => "other",
        }
    }

    pub const fn version(&self) -> Option<(u16, u16, u16)> {
        match self {
            Self::Blink { major } | Self::Gecko { major } => Some((*major, 0, 0)),
            Self::WebKit { version } => match *version {
                Some((major, minor)) => Some((major, minor, 0)),
                None => None,
            },
            Self::Ladybird { version } | Self::Servo { version } => *version,
            Self::Other => None,
        }
    }
}
