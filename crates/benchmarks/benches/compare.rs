use std::sync::LazyLock;

use divan::counter::ItemsCount;
use serde::Deserialize;
use uaparser::{Parser as _, UserAgentParser};
use user_agent_classifier::ParsedUserAgent;
use woothee::parser::Parser as WootheeParser;

#[global_allocator]
static ALLOC: divan::AllocProfiler = divan::AllocProfiler::system();

#[derive(Deserialize)]
struct TestCase {
    user_agent: String,
}

static CORPUS: LazyLock<Vec<String>> = LazyLock::new(|| {
    let raw = include_str!("../../../parsed_user_agent_test_cases.json");
    let cases: Vec<TestCase> =
        serde_json::from_str(raw).expect("valid parsed_user_agent_test_cases.json");
    cases.into_iter().map(|c| c.user_agent).collect()
});

static WOOTHEE: LazyLock<WootheeParser> = LazyLock::new(WootheeParser::new);

static UAPARSER: LazyLock<UserAgentParser> = LazyLock::new(|| {
    let path = concat!(env!("CARGO_MANIFEST_DIR"), "/data/regexes.yaml");
    UserAgentParser::from_yaml(path).unwrap_or_else(|err| {
        panic!("failed to load {path}: {err} (run `just bench` to fetch regexes.yaml)")
    })
});

const DESKTOP_CHROME: &str = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36";
const MOBILE_SAFARI: &str = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const ANDROID_WEBVIEW: &str = "Mozilla/5.0 (Linux; Android 11; moto g(7) power Build/QPO30.52-29; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36";
const BOT_HEADLESS: &str = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/158.0.0.0 Safari/537.36";

fn main() {
    divan::main();
}

mod parse_corpus {
    use super::*;

    #[divan::bench]
    fn user_agent_classifier(bencher: divan::Bencher) {
        let corpus = &*CORPUS;
        bencher
            .counter(ItemsCount::new(corpus.len()))
            .bench_local(|| {
                for ua in corpus {
                    divan::black_box(ParsedUserAgent::parse(divan::black_box(ua.as_str())));
                }
            });
    }

    #[divan::bench]
    fn woothee(bencher: divan::Bencher) {
        let corpus = &*CORPUS;
        let parser = &*WOOTHEE;
        bencher
            .counter(ItemsCount::new(corpus.len()))
            .bench_local(|| {
                for ua in corpus {
                    divan::black_box(parser.parse(divan::black_box(ua.as_str())));
                }
            });
    }

    #[divan::bench]
    fn uaparser(bencher: divan::Bencher) {
        let corpus = &*CORPUS;
        let parser = &*UAPARSER;
        bencher
            .counter(ItemsCount::new(corpus.len()))
            .bench_local(|| {
                for ua in corpus {
                    divan::black_box(parser.parse(divan::black_box(ua.as_str())));
                }
            });
    }
}

macro_rules! bench_single {
    ($mod_name:ident, $ua:expr) => {
        mod $mod_name {
            use super::*;

            #[divan::bench]
            fn user_agent_classifier() {
                divan::black_box(ParsedUserAgent::parse(divan::black_box($ua)));
            }

            #[divan::bench]
            fn woothee() {
                divan::black_box(WOOTHEE.parse(divan::black_box($ua)));
            }

            #[divan::bench]
            fn uaparser() {
                divan::black_box(UAPARSER.parse(divan::black_box($ua)));
            }
        }
    };
}

bench_single!(desktop_chrome, DESKTOP_CHROME);
bench_single!(mobile_safari, MOBILE_SAFARI);
bench_single!(android_webview, ANDROID_WEBVIEW);
bench_single!(bot_headless, BOT_HEADLESS);
