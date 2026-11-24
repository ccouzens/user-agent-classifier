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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn engine_helpers() {
        assert_eq!(Engine::Blink { major: 156 }.as_str(), "blink");
        assert_eq!(Engine::Blink { major: 156 }.version(), Some((156, 0, 0)));
        assert_eq!(Engine::Gecko { major: 160 }.as_str(), "gecko");
        assert_eq!(Engine::Gecko { major: 160 }.version(), Some((160, 0, 0)));
        assert_eq!(
            Engine::WebKit {
                version: Some((27, 2))
            }
            .as_str(),
            "webkit"
        );
        assert_eq!(
            Engine::WebKit {
                version: Some((27, 2))
            }
            .version(),
            Some((27, 2, 0))
        );
        assert_eq!(
            Engine::Ladybird {
                version: Some((2026, 47, 7))
            }
            .as_str(),
            "ladybird"
        );
        assert_eq!(
            Engine::Ladybird {
                version: Some((2026, 47, 7))
            }
            .version(),
            Some((2026, 47, 7))
        );
        assert_eq!(
            Engine::Servo {
                version: Some((0, 8, 0))
            }
            .as_str(),
            "servo"
        );
        assert_eq!(
            Engine::Servo {
                version: Some((0, 8, 0))
            }
            .version(),
            Some((0, 8, 0))
        );
        assert_eq!(Engine::Other.as_str(), "other");
        assert_eq!(Engine::Other.version(), None);
    }
}
