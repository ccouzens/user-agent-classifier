/**
A single zero-allocation token produced from a `User-Agent` string.
*/
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) enum UaToken<'a> {
    NameSepNumber { name: &'a str, number: &'a str },
    RoundBrackets(&'a str),
    SquareBrackets(&'a str),
    Other(&'a str),
}

pub(super) struct Tokenizer<'a> {
    rest: &'a str,
}

impl<'a> Tokenizer<'a> {
    pub(super) const fn new(input: &'a str) -> Self {
        Self { rest: input }
    }
}

impl<'a> Iterator for Tokenizer<'a> {
    type Item = UaToken<'a>;

    fn next(&mut self) -> Option<Self::Item> {
        self.rest = self
            .rest
            .trim_start_matches(|c: char| c.is_whitespace() || c == ';');
        if self.rest.is_empty() {
            return None;
        }

        if let Some(after_open) = self.rest.strip_prefix('(') {
            let (content, remaining) = split_round_brackets(after_open);
            self.rest = remaining;
            return Some(UaToken::RoundBrackets(content));
        }

        if let Some(after_open) = self.rest.strip_prefix('[') {
            let (content, remaining) = after_open.split_once(']').unwrap_or((after_open, ""));
            if let Some(after_slash) = remaining.strip_prefix('/') {
                let (number, next_rest) = split_word(after_slash);
                if !content.is_empty()
                    && !content.contains([';', '/', ' '])
                    && number.as_bytes().first().is_some_and(u8::is_ascii_digit)
                {
                    self.rest = next_rest;
                    return Some(UaToken::NameSepNumber {
                        name: content,
                        number,
                    });
                }
            }
            self.rest = remaining;
            return Some(UaToken::SquareBrackets(content));
        }

        let (word, rest) = split_word(self.rest);

        if let Some((name, number)) = word.rsplit_once('/') {
            if !name.is_empty()
                && !name.contains("://")
                && number.as_bytes().first().is_some_and(u8::is_ascii_digit)
            {
                self.rest = rest;
                return Some(UaToken::NameSepNumber { name, number });
            }
        } else {
            let after_ws = rest.trim_start();
            if !after_ws.starts_with(['(', '[']) {
                let (number, next_rest) = split_word(after_ws);
                if number.as_bytes().first().is_some_and(u8::is_ascii_digit)
                    && !number.contains('/')
                {
                    self.rest = next_rest;
                    return Some(UaToken::NameSepNumber { name: word, number });
                }
            }
        }

        self.rest = rest;
        Some(UaToken::Other(word))
    }
}

fn split_round_brackets(after_open: &str) -> (&str, &str) {
    let mut depth = 1usize;
    for (idx, b) in after_open.bytes().enumerate() {
        match b {
            b'(' => depth += 1,
            b')' => {
                depth -= 1;
                if depth == 0 {
                    return (&after_open[..idx], &after_open[idx + 1..]);
                }
            }
            _ => {}
        }
    }
    (after_open, "")
}

fn split_word(s: &str) -> (&str, &str) {
    let end = s.find([' ', '\t', ';', '(', '[']).unwrap_or(s.len());
    s.split_at(end)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tokenize_chrome_mobile() {
        let ua = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Mobile Safari/537.36";
        let tokens: Vec<_> = Tokenizer::new(ua).collect();
        assert_eq!(
            tokens,
            vec![
                UaToken::NameSepNumber {
                    name: "Mozilla",
                    number: "5.0",
                },
                UaToken::RoundBrackets("Linux; Android 10; K"),
                UaToken::NameSepNumber {
                    name: "AppleWebKit",
                    number: "537.36",
                },
                UaToken::RoundBrackets("KHTML, like Gecko"),
                UaToken::NameSepNumber {
                    name: "Chrome",
                    number: "157.0.0.0",
                },
                UaToken::Other("Mobile"),
                UaToken::NameSepNumber {
                    name: "Safari",
                    number: "537.36",
                },
            ]
        );
    }

    #[test]
    fn test_tokenize_facebook_with_spaces_in_brackets() {
        let ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22A3354 [FBAN/Messenger for iOS;FBAV/514.0.0.47.102;FBCR/Life Wireless;]";
        let tokens: Vec<_> = Tokenizer::new(ua).collect();
        assert_eq!(
            tokens,
            vec![
                UaToken::NameSepNumber {
                    name: "Mozilla",
                    number: "5.0",
                },
                UaToken::RoundBrackets("iPhone; CPU iPhone OS 18_0 like Mac OS X"),
                UaToken::NameSepNumber {
                    name: "AppleWebKit",
                    number: "605.1.15",
                },
                UaToken::RoundBrackets("KHTML, like Gecko"),
                UaToken::NameSepNumber {
                    name: "Mobile",
                    number: "22A3354",
                },
                UaToken::SquareBrackets(
                    "FBAN/Messenger for iOS;FBAV/514.0.0.47.102;FBCR/Life Wireless;"
                ),
            ]
        );
    }

    #[test]
    fn test_tokenize_instagram_space_number() {
        let ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 360.0.0.0 (iPhone16,1; iOS 18_0)";
        let tokens: Vec<_> = Tokenizer::new(ua).collect();
        assert_eq!(
            tokens,
            vec![
                UaToken::NameSepNumber {
                    name: "Mozilla",
                    number: "5.0",
                },
                UaToken::RoundBrackets("iPhone; CPU iPhone OS 18_0 like Mac OS X"),
                UaToken::NameSepNumber {
                    name: "AppleWebKit",
                    number: "605.1.15",
                },
                UaToken::RoundBrackets("KHTML, like Gecko"),
                UaToken::NameSepNumber {
                    name: "Mobile",
                    number: "15E148",
                },
                UaToken::NameSepNumber {
                    name: "Instagram",
                    number: "360.0.0.0",
                },
                UaToken::RoundBrackets("iPhone16,1; iOS 18_0"),
            ]
        );
    }

    #[test]
    fn test_tokenize_nested_round_brackets() {
        let ua = "Mozilla/5.0 (Linux; Android 11; moto g(7) power Build/QPO30.52-29; wv) AppleWebKit/537.36";
        let tokens: Vec<_> = Tokenizer::new(ua).collect();
        assert_eq!(
            tokens,
            vec![
                UaToken::NameSepNumber {
                    name: "Mozilla",
                    number: "5.0",
                },
                UaToken::RoundBrackets("Linux; Android 11; moto g(7) power Build/QPO30.52-29; wv"),
                UaToken::NameSepNumber {
                    name: "AppleWebKit",
                    number: "537.36",
                },
            ]
        );
    }

    #[test]
    fn test_tokenize_multi_slash() {
        let ua = "Chrome/135.0.7049.79 XiaoMi/MiuiBrowser/14.67.2-gn +https://example.com/123";
        let tokens: Vec<_> = Tokenizer::new(ua).collect();
        assert_eq!(
            tokens,
            vec![
                UaToken::NameSepNumber {
                    name: "Chrome",
                    number: "135.0.7049.79",
                },
                UaToken::NameSepNumber {
                    name: "XiaoMi/MiuiBrowser",
                    number: "14.67.2-gn",
                },
                UaToken::Other("+https://example.com/123"),
            ]
        );
    }

    #[test]
    fn test_tokenize_bracketed_name_slash_number() {
        let ua = "Mobile/15E148 [LinkedInApp]/9.32.5794 [SuperhumanProxy]/1.0 (comment)";
        let tokens: Vec<_> = Tokenizer::new(ua).collect();
        assert_eq!(
            tokens,
            vec![
                UaToken::NameSepNumber {
                    name: "Mobile",
                    number: "15E148",
                },
                UaToken::NameSepNumber {
                    name: "LinkedInApp",
                    number: "9.32.5794",
                },
                UaToken::NameSepNumber {
                    name: "SuperhumanProxy",
                    number: "1.0",
                },
                UaToken::RoundBrackets("comment"),
            ]
        );
    }

    #[test]
    fn test_tokenize_semicolon_separated_tokens() {
        let ua =
            "Safari/604.1 [FBAN/FBIOS;FBAV/588.1.0.66.71];FBNV/1; compatible; OAI-SearchBot/1.4;";
        let tokens: Vec<_> = Tokenizer::new(ua).collect();
        assert_eq!(
            tokens,
            vec![
                UaToken::NameSepNumber {
                    name: "Safari",
                    number: "604.1",
                },
                UaToken::SquareBrackets("FBAN/FBIOS;FBAV/588.1.0.66.71"),
                UaToken::NameSepNumber {
                    name: "FBNV",
                    number: "1",
                },
                UaToken::Other("compatible"),
                UaToken::NameSepNumber {
                    name: "OAI-SearchBot",
                    number: "1.4",
                },
            ]
        );
    }
}
