import type { Browser } from "./browser.mts";
import type { Engine } from "./engine.mts";
import type { ReportedPlatform } from "./reported_platform.mts";

/**
 * Structured classification parsed from a `User-Agent` string.
 */
export interface Classification {
	/**
	 * `true` when a `Mobile` token is present in the `User-Agent` (for example
	 * `Mobile/15E148`, `Mobile Safari`, or `Mobile` in a parenthesized comment).
	 *
	 * Platform tokens alone (such as `Android` on tablets or `iPad`) do not set
	 * `is_mobile`.
	 */
	readonly is_mobile: boolean;
	/**
	 * `true` when `!is_bot` and the `User-Agent` indicates an embedded WebView or
	 * in-app browser.
	 */
	readonly is_webview: boolean;
	/**
	 * `true` when the `User-Agent` matches automated crawler, link-previewer,
	 * headless browser, or proxy indicators.
	 */
	readonly is_bot: boolean;
	readonly reported_platform: ReportedPlatform;
	readonly engine: Engine;
	readonly browser: Browser | null;
}
