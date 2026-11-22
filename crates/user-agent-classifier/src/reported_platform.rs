#[cfg(feature = "serde")]
use serde::Serialize;

/**
Bounded platform classification as reported in the `User-Agent` string.

Browser Implementations & Documentation:
- Chromium (Blink):
  - <https://chromium.googlesource.com/chromium/src/+/989bfb21678bad41c86612a54df922726246ecd7/components/embedder_support/user_agent_utils.cc>
  - <https://developer.chrome.com/docs/android/identify-googlebooks>
- Gecko (Firefox):
  - <https://github.com/mozilla-firefox/firefox/blob/5866b3015de8fc803012d8ab800d8c38df1ea5e8/netwerk/protocol/http/nsHttpHandler.cpp>
- Samsung Internet:
  - <https://developer.samsung.com/browser/user-agent-string-format.html>
- WebKit (Safari / WebKitGTK):
  - <https://github.com/WebKit/WebKit/blob/2ea5b33be7f0ffde238363fa949ca0eb33aa3565/Source/WebCore/platform/mac/UserAgentMac.mm>
  - <https://github.com/WebKit/WebKit/blob/2ea5b33be7f0ffde238363fa949ca0eb33aa3565/Source/WebCore/platform/ios/UserAgentIOS.mm>
  - <https://github.com/WebKit/WebKit/blob/2ea5b33be7f0ffde238363fa949ca0eb33aa3565/Source/WebCore/platform/glib/UserAgentGLib.cpp>
*/
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[cfg_attr(feature = "serde", derive(Serialize))]
pub enum ReportedPlatform {
    /**
    Android (`Android`).

    - Chromium (`GetUnifiedPlatform()`): returns `"Linux; Android 10; K"` on
      Android phones/tablets.
    - Firefox (`InitUserAgentComponents()`): sets `mPlatform` to `"Android"`
      followed by the Android major version (floored to `"10"` if `< 10`),
      with `mCompatDevice` set to `"Mobile"` or `"TV"`.
    - WebKitGTK (`UserAgentGLib.cpp`): mobile Linux builds emit
      `"Linux; like Android 4.4"`.

    - <https://chromium.googlesource.com/chromium/src/+/989bfb21678bad41c86612a54df922726246ecd7/components/embedder_support/user_agent_utils.cc>
    - <https://github.com/mozilla-firefox/firefox/blob/5866b3015de8fc803012d8ab800d8c38df1ea5e8/netwerk/protocol/http/nsHttpHandler.cpp>
    - <https://github.com/WebKit/WebKit/blob/2ea5b33be7f0ffde238363fa949ca0eb33aa3565/Source/WebCore/platform/glib/UserAgentGLib.cpp>
    */
    Android,
    /**
    ChromeOS or GoogleBook OS (`CrOS`).

    - Chromium (`GetUnifiedPlatform()`): returns
      `"X11; CrOS x86_64 14541.0.0"` on ChromeOS, and also on Android desktop /
      Android XR (Googlebooks) when `kAndroidDesktopUASpoofAsChromeOS` is
      enabled.

    - <https://chromium.googlesource.com/chromium/src/+/989bfb21678bad41c86612a54df922726246ecd7/components/embedder_support/user_agent_utils.cc>
    - <https://developer.chrome.com/docs/android/identify-googlebooks>
    */
    CrOS,
    /**
    iPad in mobile mode (`iPad`).

    - WebKit (`UserAgentIOS.mm`): emits `"iPad"` via
      `deviceNameForUserAgent()` with `"CPU OS <ver> like Mac OS X"` when not in
      `UserAgentType::Desktop` mode.
    - Chromium (`GetUnifiedPlatform()`): returns
      `"iPad; CPU iPad OS 14_0 like Mac OS X"` on tablets.

    - <https://github.com/WebKit/WebKit/blob/2ea5b33be7f0ffde238363fa949ca0eb33aa3565/Source/WebCore/platform/ios/UserAgentIOS.mm>
    - <https://chromium.googlesource.com/chromium/src/+/989bfb21678bad41c86612a54df922726246ecd7/components/embedder_support/user_agent_utils.cc>
    */
    #[cfg_attr(feature = "serde", serde(rename = "iPad"))]
    IPad,
    /**
    iPhone or iPod touch (`iPhone`).

    - WebKit (`UserAgentIOS.mm`): emits `"iPhone"` (or `"iPod touch"`) via
      `deviceNameForUserAgent()` with `"CPU iPhone OS <ver> like Mac OS X"`.
    - Chromium (`GetUnifiedPlatform()`): returns
      `"iPhone; CPU iPhone OS 14_0 like Mac OS X"` on phones.
    - Firefox (`InitUserAgentComponents()`): sets `mPlatform` to `"iPhone"` and
      `mCompatDevice` to `"CPU iPhone OS 18_0 like Mac OS X"`.

    - <https://github.com/WebKit/WebKit/blob/2ea5b33be7f0ffde238363fa949ca0eb33aa3565/Source/WebCore/platform/ios/UserAgentIOS.mm>
    - <https://chromium.googlesource.com/chromium/src/+/989bfb21678bad41c86612a54df922726246ecd7/components/embedder_support/user_agent_utils.cc>
    - <https://github.com/mozilla-firefox/firefox/blob/5866b3015de8fc803012d8ab800d8c38df1ea5e8/netwerk/protocol/http/nsHttpHandler.cpp>
    */
    #[cfg_attr(feature = "serde", serde(rename = "iPhone"))]
    IPhone,
    /**
    Linux, or Android in "Desktop site" / DeX mode (`Linux`).

    - Chromium (`GetUnifiedPlatform()`): returns `"X11; Linux x86_64"` on
      Linux, and on Android desktop/XR when `kAndroidDesktopUASpoofAsChromeOS`
      is disabled.
    - Firefox (`InitUserAgentComponents()`): sets `mPlatform` to `"X11"` (or
      `"X11; Ubuntu"` under Ubuntu Snap) with `"Linux x86_64"`.
    - Samsung Internet: uses `"X11; Linux x86_64"` in Desktop mode / Samsung
      DeX (`Mozilla/5.0 (X11; Linux x86_64) ... SamsungBrowser/...`).
    - WebKitGTK (`UserAgentGLib.cpp`): emits `"X11; Linux x86_64"` on desktop
      Linux.

    - <https://chromium.googlesource.com/chromium/src/+/989bfb21678bad41c86612a54df922726246ecd7/components/embedder_support/user_agent_utils.cc>
    - <https://github.com/mozilla-firefox/firefox/blob/5866b3015de8fc803012d8ab800d8c38df1ea5e8/netwerk/protocol/http/nsHttpHandler.cpp>
    - <https://developer.samsung.com/browser/user-agent-string-format.html>
    - <https://github.com/WebKit/WebKit/blob/2ea5b33be7f0ffde238363fa949ca0eb33aa3565/Source/WebCore/platform/glib/UserAgentGLib.cpp>
    */
    Linux,
    /**
    macOS or iPadOS in desktop mode (`Macintosh`).

    - WebKit (`UserAgentMac.mm` & `UserAgentIOS.mm`): returns
      `"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ..."` on macOS and on
      iPadOS when `type == UserAgentType::Desktop` (the default on iPadOS).
    - Chromium (`GetUnifiedPlatform()`): returns
      `"Macintosh; Intel Mac OS X 10_15_7"`.
    - Firefox (`InitUserAgentComponents()`): sets `mPlatform` to `"Macintosh"`
      with `"Intel Mac OS X 10.15"`.

    - <https://github.com/WebKit/WebKit/blob/2ea5b33be7f0ffde238363fa949ca0eb33aa3565/Source/WebCore/platform/mac/UserAgentMac.mm>
    - <https://github.com/WebKit/WebKit/blob/2ea5b33be7f0ffde238363fa949ca0eb33aa3565/Source/WebCore/platform/ios/UserAgentIOS.mm>
    - <https://chromium.googlesource.com/chromium/src/+/989bfb21678bad41c86612a54df922726246ecd7/components/embedder_support/user_agent_utils.cc>
    - <https://github.com/mozilla-firefox/firefox/blob/5866b3015de8fc803012d8ab800d8c38df1ea5e8/netwerk/protocol/http/nsHttpHandler.cpp>
    */
    Macintosh,
    /**
    Windows, including Windows tablets and 2-in-1s (`Windows`).

    - Chromium (`GetUnifiedPlatform()`): returns
      `"Windows NT 10.0; Win64; x64"`.
    - Firefox (`InitUserAgentComponents()`): hardcodes `OSCPU_WINDOWS` to
      `"Windows NT 10.0"` (`"Windows NT 10.0; Win64; x64"` on x64 and ARM64
      Windows 11+).

    - <https://chromium.googlesource.com/chromium/src/+/989bfb21678bad41c86612a54df922726246ecd7/components/embedder_support/user_agent_utils.cc>
    - <https://github.com/mozilla-firefox/firefox/blob/5866b3015de8fc803012d8ab800d8c38df1ea5e8/netwerk/protocol/http/nsHttpHandler.cpp>
    */
    Windows,
    /**
    Any other or unrecognized platform (e.g. Chromium's `"Fuchsia"`, non-browser
    clients such as `curl`, or omitted platform comments).
    */
    Other,
}

impl ReportedPlatform {
    pub const fn as_str(&self) -> &'static str {
        match self {
            Self::Android => "Android",
            Self::CrOS => "CrOS",
            Self::IPad => "iPad",
            Self::IPhone => "iPhone",
            Self::Linux => "Linux",
            Self::Macintosh => "Macintosh",
            Self::Windows => "Windows",
            Self::Other => "Other",
        }
    }

    pub(super) fn from_token(token: &str) -> Option<Self> {
        match token {
            "iPhone" => Some(Self::IPhone),
            "iPad" => Some(Self::IPad),
            "Android" => Some(Self::Android),
            "CrOS" => Some(Self::CrOS),
            "Windows" => Some(Self::Windows),
            "Macintosh" => Some(Self::Macintosh),
            "Linux" => Some(Self::Linux),
            _ => None,
        }
    }
}
