mod browser;
mod engine;
mod parsed_user_agent;
mod reported_platform;
mod tokenizer;

pub use browser::Browser;
pub use engine::Engine;
pub use parsed_user_agent::ParsedUserAgent;
pub use reported_platform::ReportedPlatform;

#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};

/**
A raw `User-Agent` header value preserved verbatim for JSON serialization and
logging, with lazy parsing into structured fields.

- <https://www.rfc-editor.org/rfc/rfc9110#section-10.1.5>
*/
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize), serde(transparent))]
pub struct UserAgent(String);

impl UserAgent {
    /**
    Returns the raw, unmodified `User-Agent` string.
    */
    pub fn as_str(&self) -> &str {
        &self.0
    }

    /**
    Parses the `User-Agent` string into structured fields (`reported_platform`,
    `engine`, `is_mobile`, `is_webview`, `is_bot`, and `browser`).

    Note that `browser.name` is borrowed verbatim from the raw `User-Agent`
    string and is unbounded; do not use it directly as a high-cardinality
    metric label without an allowlist or cap.
    */
    pub fn parse(&self) -> ParsedUserAgent<'_> {
        ParsedUserAgent::parse(&self.0)
    }
}

impl AsRef<str> for UserAgent {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

impl From<String> for UserAgent {
    fn from(value: String) -> Self {
        Self(value)
    }
}

impl From<&str> for UserAgent {
    fn from(value: &str) -> Self {
        Self(value.to_owned())
    }
}

#[cfg(all(test, feature = "serde"))]
mod tests {
    use super::*;

    #[test]
    fn test_serde_round_trip() {
        let raw = r#""Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36""#;
        let ua: UserAgent = serde_json::from_str(raw).unwrap();
        assert_eq!(
            ua.as_str(),
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36"
        );
        assert_eq!(serde_json::to_string(&ua).unwrap(), raw);
    }
}
