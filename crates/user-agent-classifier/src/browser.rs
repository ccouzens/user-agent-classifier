#[cfg(feature = "serde")]
use serde::Serialize;

/**
Browser name and version parsed from a `User-Agent` string.
*/
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[cfg_attr(feature = "serde", derive(Serialize))]
pub struct Browser<'a> {
    pub name: &'a str,
    pub version: Option<(u16, u16)>,
}
