use std::sync::LazyLock;

use divan::counter::ItemsCount;
use serde::Deserialize;
use uaparser::{Parser as _, UserAgentParser};
use user_agent_parser::UserAgentParser as MagicUserAgentParser;
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

static USER_AGENT_PARSER: LazyLock<MagicUserAgentParser> = LazyLock::new(|| {
    let path = concat!(env!("CARGO_MANIFEST_DIR"), "/data/regexes.yaml");
    MagicUserAgentParser::from_path(path).unwrap_or_else(|err| {
        panic!("failed to load {path}: {err} (run `just bench` to fetch regexes.yaml)")
    })
});

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
                    divan::black_box(user_agent_classifier::parse(divan::black_box(ua.as_str())));
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

    #[divan::bench]
    fn user_agent_parser(bencher: divan::Bencher) {
        let corpus = &*CORPUS;
        let parser = &*USER_AGENT_PARSER;
        bencher
            .counter(ItemsCount::new(corpus.len()))
            .bench_local(|| {
                for ua in corpus {
                    let s = divan::black_box(ua.as_str());
                    divan::black_box((
                        parser.parse_product(s),
                        parser.parse_os(s),
                        parser.parse_device(s),
                    ));
                }
            });
    }
}
