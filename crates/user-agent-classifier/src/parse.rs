use super::{
    Browser, Classification, Engine, ReportedPlatform,
    tokenizer::{Tokenizer, UaToken},
};

pub fn parse(ua: &str) -> Classification<'_> {
    let mut reported_platform = ReportedPlatform::Other;
    let mut is_mobile = false;
    let mut is_bot = false;
    let mut saw_wv = false;

    let mut firefox = None;
    let mut chrome = None;
    let mut version = None;
    let mut has_safari = false;
    let mut has_apple_webkit = false;
    let mut specific_browser = None;
    let mut bot_browser = None;
    let mut saw_facebookexternalhit = false;
    let mut saw_facebot = false;
    let mut saw_twitterbot = false;

    let mut tokens = Tokenizer::new(ua);
    while let Some(token) = tokens.next() {
        match token {
            UaToken::RoundBrackets(comment) => {
                let mut segments = comment.split(';').map(str::trim);
                let mut first_segment = None;
                while let Some(segment) = segments.next() {
                    if first_segment.is_none() {
                        first_segment = Some(segment);
                    }
                    match segment {
                        "Mobile" => is_mobile = true,
                        "wv" => saw_wv = true,
                        "compatible" => {
                            is_bot = true;
                            if let Some(next) = segments.next()
                                && let Some(browser) = parse_comment_browser(next)
                            {
                                bot_browser = Some(browser);
                            }
                        }
                        _ if segment.starts_with("+http://")
                            || segment.starts_with("+https://") =>
                        {
                            is_bot = true;
                            if bot_browser.is_none()
                                && let Some(first) = first_segment
                                && !first.starts_with("+http://")
                                && !first.starts_with("+https://")
                                && !first.starts_with("http://")
                                && !first.starts_with("https://")
                            {
                                bot_browser = parse_comment_browser(first);
                            }
                        }
                        _ if let Some(via) = segment.strip_prefix("via ") => {
                            is_bot = true;
                            if let Some(name) = via.split_whitespace().last() {
                                bot_browser = Some(Browser {
                                    name,
                                    version: None,
                                });
                            }
                        }
                        _ if let Some(browser) = parse_comment_at_browser(segment) => {
                            specific_browser = Some(browser);
                        }
                        _ => {
                            for word in segment.split_whitespace() {
                                if let Some(platform) = ReportedPlatform::from_token(word)
                                    && matches!(
                                        reported_platform,
                                        ReportedPlatform::Other | ReportedPlatform::Linux
                                    )
                                {
                                    reported_platform = platform;
                                }
                            }
                        }
                    }
                }
            }
            UaToken::NameSepNumber { name, number } => match name {
                "Mozilla" | "Gecko" | "FBNV" | "NW" | "NV" => {}
                "AppleWebKit" => has_apple_webkit = true,
                "Mobile" => is_mobile = true,
                "Version" => version = parse_version(number),
                "Safari" => has_safari = true,
                "Chrome" => chrome = parse_version(number),
                "HeadlessChrome" => {
                    let parsed = parse_version(number);
                    is_bot = true;
                    chrome = parsed;
                    specific_browser = Some(Browser {
                        name,
                        version: parsed,
                    });
                }
                "Firefox" => firefox = parse_version(number),
                _ => {
                    if name == "facebookexternalhit" {
                        saw_facebookexternalhit = true;
                    } else if name == "Twitterbot" {
                        saw_twitterbot = true;
                    }
                    if is_bot_name(name) {
                        is_bot = true;
                    }
                    specific_browser = Some(Browser {
                        name,
                        version: parse_version(number),
                    });
                }
            },
            UaToken::SquareBrackets(content) => {
                let mut is_facebook = false;
                let mut fb_version = None;
                for entry in content.split(';') {
                    if let Some((key, val)) = entry.split_once('/') {
                        match key {
                            "FBAN" | "FB_IAB" => is_facebook = true,
                            "FBAV" => {
                                is_facebook = true;
                                fb_version = parse_version(val);
                            }
                            _ => {}
                        }
                    }
                }
                if is_facebook {
                    saw_wv = true;
                    specific_browser = Some(Browser {
                        name: "Facebook",
                        version: fb_version,
                    });
                } else if !content.contains(';')
                    && let Some((name, val)) = content.split_once('/')
                    && !name.is_empty()
                    && let Some(ver) = parse_version(val)
                {
                    if is_bot_name(name) {
                        is_bot = true;
                    }
                    specific_browser = Some(Browser {
                        name,
                        version: Some(ver),
                    });
                }
            }
            UaToken::Other("Mobile") => is_mobile = true,
            UaToken::Other(
                "Mozilla" | "Gecko" | "AppleWebKit" | "Version" | "Safari" | "Chrome" | "Firefox"
                | "like",
            ) => {}
            UaToken::Other("compatible") => {
                is_bot = true;
                match tokens.next() {
                    Some(UaToken::NameSepNumber { name, number }) => {
                        bot_browser = Some(Browser {
                            name,
                            version: parse_version(number),
                        });
                    }
                    Some(UaToken::Other(name)) => {
                        bot_browser = Some(Browser {
                            name,
                            version: None,
                        });
                    }
                    _ => {}
                }
            }
            UaToken::Other(word) => {
                if word == "Facebot" {
                    saw_facebot = true;
                }
                if specific_browser.is_none()
                    && word
                        .bytes()
                        .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'-' | b'_'))
                {
                    if is_bot_name(word) {
                        is_bot = true;
                    }
                    specific_browser = Some(Browser {
                        name: word,
                        version: None,
                    });
                }
            }
        }
    }

    // Apple's iMessage / LinkPresentation sends a composite UA masquerading as
    // Facebook and Twitter crawlers so sites serve Open Graph metadata.
    let browser = if saw_facebookexternalhit && saw_facebot && saw_twitterbot {
        Some(Browser {
            name: "LinkPresentation",
            version: None,
        })
    } else {
        bot_browser
    }
    .or(specific_browser)
    .or_else(|| {
        firefox.map(|v| Browser {
            name: "Firefox",
            version: Some(v),
        })
    })
    .or_else(|| {
        chrome.map(|v| Browser {
            name: "Chrome",
            version: Some(v),
        })
    })
    .or_else(|| {
        (has_safari && version.is_some()).then_some(Browser {
            name: "Safari",
            version,
        })
    })
    .or_else(|| {
        (has_apple_webkit
            && matches!(
                reported_platform,
                ReportedPlatform::IPhone | ReportedPlatform::IPad | ReportedPlatform::Macintosh
            ))
        .then_some(Browser {
            name: "WKWebView",
            version: None,
        })
    });

    let engine = if let Some((major, _)) = chrome {
        Engine::Blink { major }
    } else if let Some((major, _)) = firefox {
        Engine::Gecko { major }
    } else if has_apple_webkit {
        Engine::WebKit { version }
    } else {
        Engine::Other
    };

    let is_webview = !is_bot
        && ((reported_platform == ReportedPlatform::Android
            && (saw_wv || (matches!(engine, Engine::Blink { .. }) && version == Some((4, 0)))))
            || (matches!(engine, Engine::WebKit { .. })
                && matches!(
                    reported_platform,
                    ReportedPlatform::IPhone | ReportedPlatform::IPad | ReportedPlatform::Macintosh
                )
                && !browser.is_some_and(|b| b.name == "Safari")));

    Classification {
        is_mobile,
        is_webview,
        is_bot,
        reported_platform,
        engine,
        browser,
    }
}

fn parse_comment_browser(segment: &str) -> Option<Browser<'_>> {
    let token = segment.split_whitespace().next()?;
    let (name, version) = token
        .split_once('/')
        .map_or((token, None), |(n, v)| (n, parse_version(v)));
    Some(Browser { name, version })
}

fn parse_comment_at_browser(segment: &str) -> Option<Browser<'_>> {
    let (name, rest) = segment.split_once(' ')?;
    let (tag, version_str) = rest.split_once('@')?;
    if name.is_empty() || tag.is_empty() || version_str.contains(char::is_whitespace) {
        return None;
    }
    let version = parse_version(version_str)?;
    Some(Browser {
        name,
        version: Some(version),
    })
}

fn is_bot_name(name: &str) -> bool {
    name == "Chrome-Lighthouse"
        || name.starts_with("meta-")
        || [
            "bot", "Bot", "spider", "Spider", "crawler", "Crawler", "proxy", "Proxy",
        ]
        .iter()
        .any(|suffix| name.ends_with(suffix))
}

fn parse_version(version: &str) -> Option<(u16, u16)> {
    let version = version.strip_prefix(['v', 'V']).unwrap_or(version);
    let mut parts = version.split('.');
    let major = parse_leading_u16(parts.next()?)?;
    let minor = parts.next().and_then(parse_leading_u16).unwrap_or(0);
    Some((major, minor))
}

fn parse_leading_u16(s: &str) -> Option<u16> {
    let digits_end = s
        .bytes()
        .position(|b| !b.is_ascii_digit())
        .unwrap_or(s.len());
    s[..digits_end].parse::<u16>().ok()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[cfg(feature = "serde")]
    use std::{string::String, vec::Vec};

    #[cfg(feature = "serde")]
    #[derive(serde::Deserialize)]
    struct TestCase {
        user_agent: String,
        #[serde(flatten)]
        expected: serde_json::Value,
    }

    #[cfg(feature = "serde")]
    #[test]
    fn test_parse_user_agent_cases() {
        let cases: Vec<TestCase> =
            serde_json::from_str(include_str!("../../../parsed_user_agent_test_cases.json"))
                .unwrap();
        assert!(!cases.is_empty());

        for case in cases {
            let actual = serde_json::to_value(parse(&case.user_agent)).unwrap();
            assert_json_diff::assert_json_eq!(actual, case.expected);
        }
    }

    #[test]
    fn engine_and_platform_helpers() {
        assert_eq!(Engine::Blink { major: 156 }.as_str(), "blink");
        assert_eq!(Engine::Blink { major: 156 }.version(), Some((156, 0)));
        assert_eq!(Engine::Gecko { major: 160 }.as_str(), "gecko");
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
            Some((27, 2))
        );
        assert_eq!(Engine::Other.as_str(), "other");
        assert_eq!(Engine::Other.version(), None);
        assert_eq!(ReportedPlatform::Android.as_str(), "Android");
        assert_eq!(ReportedPlatform::CrOS.as_str(), "CrOS");
        assert_eq!(ReportedPlatform::Linux.as_str(), "Linux");
        assert_eq!(ReportedPlatform::IPhone.as_str(), "iPhone");
        assert_eq!(ReportedPlatform::IPad.as_str(), "iPad");
        assert_eq!(ReportedPlatform::Macintosh.as_str(), "Macintosh");
        assert_eq!(ReportedPlatform::Windows.as_str(), "Windows");
        assert_eq!(ReportedPlatform::Other.as_str(), "Other");
    }
}
