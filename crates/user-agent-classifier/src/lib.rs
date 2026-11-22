#![no_std]

#[cfg(test)]
extern crate std;

mod browser;
mod engine;
mod reported_platform;
mod tokenizer;
mod user_agent_classifier;

pub use browser::Browser;
pub use engine::Engine;
pub use reported_platform::ReportedPlatform;
pub use user_agent_classifier::UserAgentClassifier;
