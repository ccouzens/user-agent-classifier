import type { Browser } from "./browser.mts";
import type { Classification } from "./classification.mts";
import type { Engine, MinorVersion, PatchVersion } from "./engine.mts";
import {
	type ReportedPlatform,
	reportedPlatformFromToken,
} from "./reported_platform.mts";
import { Tokenizer } from "./tokenizer.mts";

/**
 * Parses a `User-Agent` header string in a single pass without regular
 * expressions, returning a {@link Classification}.
 *
 * Note that `browser.name` is unbounded; do not use it directly as a
 * high-cardinality metric label without an allowlist or cap.
 */
export function parse(ua: string): Classification {
	let reportedPlatform: ReportedPlatform = "Other";
	let isMobile = false;
	let isBot = false;
	let sawWv = false;

	let firefox: MinorVersion | undefined;
	let chrome: MinorVersion | undefined;
	let ladybird: PatchVersion | null | undefined;
	let servo: PatchVersion | null | undefined;
	let version: MinorVersion | undefined;
	let hasSafari = false;
	let hasAppleWebKit = false;
	let specificBrowser: Browser | undefined;
	let botBrowser: Browser | undefined;
	let sawFacebookexternalhit = false;
	let sawFacebot = false;
	let sawTwitterbot = false;

	const tokens = new Tokenizer(ua);
	for (let token = tokens.next(); token !== undefined; token = tokens.next()) {
		switch (token.kind) {
			case "round_brackets": {
				const segments = token.content.split(";").map((s) => s.trim());
				let firstSegment: string | undefined;
				let i = 0;
				while (i < segments.length) {
					const segment = segments[i];
					i += 1;
					if (segment === undefined) {
						break;
					}
					if (firstSegment === undefined) {
						firstSegment = segment;
					}
					if (segment === "Mobile") {
						isMobile = true;
					} else if (segment === "wv") {
						sawWv = true;
					} else if (segment === "compatible") {
						isBot = true;
						const next = segments[i];
						if (next !== undefined) {
							i += 1;
							const browser = parseCommentBrowser(next);
							if (browser !== undefined) {
								botBrowser = browser;
							}
						}
					} else if (
						segment.startsWith("+http://") ||
						segment.startsWith("+https://")
					) {
						isBot = true;
						if (
							botBrowser === undefined &&
							firstSegment !== undefined &&
							!firstSegment.startsWith("+http://") &&
							!firstSegment.startsWith("+https://") &&
							!firstSegment.startsWith("http://") &&
							!firstSegment.startsWith("https://")
						) {
							botBrowser = parseCommentBrowser(firstSegment);
						}
					} else if (segment.startsWith("via ")) {
						isBot = true;
						const via = segment.slice(4);
						const name = lastWhitespaceWord(via);
						if (name !== undefined) {
							botBrowser = { name, version: null };
						}
					} else {
						const atBrowser = parseCommentAtBrowser(segment);
						if (atBrowser !== undefined) {
							specificBrowser = atBrowser;
						} else {
							for (const word of splitWhitespace(segment)) {
								const platform = reportedPlatformFromToken(word);
								if (
									platform !== undefined &&
									(reportedPlatform === "Other" || reportedPlatform === "Linux")
								) {
									reportedPlatform = platform;
								}
							}
						}
					}
				}
				break;
			}
			case "name_sep_number": {
				const { name, number } = token;
				switch (name) {
					case "Mozilla":
					case "Gecko":
					case "FBNV":
					case "NW":
					case "NV":
						break;
					case "AppleWebKit":
						hasAppleWebKit = true;
						break;
					case "Mobile":
						isMobile = true;
						break;
					case "Version":
						version = parseVersion(number);
						break;
					case "Safari":
						hasSafari = true;
						break;
					case "Chrome":
						chrome = parseVersion(number);
						break;
					case "HeadlessChrome": {
						const parsed = parseVersion(number);
						isBot = true;
						chrome = parsed;
						specificBrowser = { name, version: parsed ?? null };
						break;
					}
					case "Firefox":
						firefox = parseVersion(number);
						break;
					case "Ladybird":
						ladybird = parseVersion3(number) ?? null;
						specificBrowser = {
							name,
							version: parseVersion(number) ?? null,
						};
						break;
					case "Servo":
						servo = parseVersion3(number) ?? null;
						specificBrowser = {
							name,
							version: parseVersion(number) ?? null,
						};
						break;
					default: {
						if (name === "facebookexternalhit") {
							sawFacebookexternalhit = true;
						} else if (name === "Twitterbot") {
							sawTwitterbot = true;
						}
						if (isBotName(name)) {
							isBot = true;
						}
						specificBrowser = {
							name,
							version: parseVersion(number) ?? null,
						};
						break;
					}
				}
				break;
			}
			case "square_brackets": {
				const { content } = token;
				let isFacebook = false;
				let fbVersion: MinorVersion | undefined;
				for (const entry of content.split(";")) {
					const pair = splitOnce(entry, "/");
					if (pair !== undefined) {
						const [key, val] = pair;
						if (key === "FBAN" || key === "FB_IAB") {
							isFacebook = true;
						} else if (key === "FBAV") {
							isFacebook = true;
							fbVersion = parseVersion(val);
						}
					}
				}
				if (isFacebook) {
					sawWv = true;
					specificBrowser = {
						name: "Facebook",
						version: fbVersion ?? null,
					};
				} else if (!content.includes(";")) {
					const pair = splitOnce(content, "/");
					if (pair !== undefined) {
						const [name, val] = pair;
						const ver = name.length > 0 ? parseVersion(val) : undefined;
						if (ver !== undefined) {
							if (isBotName(name)) {
								isBot = true;
							}
							specificBrowser = { name, version: ver };
						}
					}
				}
				break;
			}
			case "other": {
				const word = token.value;
				switch (word) {
					case "Mobile":
						isMobile = true;
						break;
					case "Mozilla":
					case "Gecko":
					case "AppleWebKit":
					case "Version":
					case "Safari":
					case "Chrome":
					case "Firefox":
					case "like":
						break;
					case "compatible": {
						isBot = true;
						const next = tokens.next();
						if (next?.kind === "name_sep_number") {
							botBrowser = {
								name: next.name,
								version: parseVersion(next.number) ?? null,
							};
						} else if (next?.kind === "other") {
							botBrowser = { name: next.value, version: null };
						}
						break;
					}
					default: {
						if (word === "Facebot") {
							sawFacebot = true;
						}
						if (
							specificBrowser === undefined &&
							isAsciiAlnumDashUnderscore(word)
						) {
							if (isBotName(word)) {
								isBot = true;
							}
							specificBrowser = { name: word, version: null };
						}
						break;
					}
				}
				break;
			}
		}
	}

	// Apple's iMessage / LinkPresentation sends a composite UA masquerading as
	// Facebook and Twitter crawlers so sites serve Open Graph metadata.
	let browser: Browser | null =
		sawFacebookexternalhit && sawFacebot && sawTwitterbot
			? { name: "LinkPresentation", version: null }
			: (botBrowser ?? null);

	browser ??= specificBrowser ?? null;
	if (browser === null && firefox !== undefined) {
		browser = { name: "Firefox", version: firefox };
	}
	if (browser === null && chrome !== undefined) {
		browser = { name: "Chrome", version: chrome };
	}
	if (browser === null && hasSafari && version !== undefined) {
		browser = { name: "Safari", version };
	}
	if (
		browser === null &&
		hasAppleWebKit &&
		(reportedPlatform === "iPhone" ||
			reportedPlatform === "iPad" ||
			reportedPlatform === "Macintosh")
	) {
		browser = { name: "WKWebView", version: null };
	}

	let engine: Engine;
	if (ladybird !== undefined) {
		engine = { name: "ladybird", version: ladybird };
	} else if (servo !== undefined) {
		engine = { name: "servo", version: servo };
	} else if (chrome !== undefined) {
		engine = { name: "blink", major: chrome[0] };
	} else if (firefox !== undefined) {
		engine = { name: "gecko", major: firefox[0] };
	} else if (hasAppleWebKit) {
		engine = { name: "webkit", version: version ?? null };
	} else {
		engine = { name: "other" };
	}

	const isWebview =
		!isBot &&
		((reportedPlatform === "Android" &&
			(sawWv ||
				(engine.name === "blink" &&
					version !== undefined &&
					version[0] === 4 &&
					version[1] === 0))) ||
			(engine.name === "webkit" &&
				(reportedPlatform === "iPhone" ||
					reportedPlatform === "iPad" ||
					reportedPlatform === "Macintosh") &&
				browser?.name !== "Safari"));

	return {
		is_mobile: isMobile,
		is_webview: isWebview,
		is_bot: isBot,
		reported_platform: reportedPlatform,
		engine,
		browser,
	};
}

function parseCommentBrowser(segment: string): Browser | undefined {
	const token = firstWhitespaceWord(segment);
	if (token === undefined) {
		return undefined;
	}
	const pair = splitOnce(token, "/");
	if (pair === undefined) {
		return { name: token, version: null };
	}
	return { name: pair[0], version: parseVersion(pair[1]) ?? null };
}

function parseCommentAtBrowser(segment: string): Browser | undefined {
	const spacePair = splitOnce(segment, " ");
	if (spacePair === undefined) {
		return undefined;
	}
	const [name, rest] = spacePair;
	const atPair = splitOnce(rest, "@");
	if (atPair === undefined) {
		return undefined;
	}
	const [tag, versionStr] = atPair;
	if (name.length === 0 || tag.length === 0 || hasWhitespace(versionStr)) {
		return undefined;
	}
	const version = parseVersion(versionStr);
	if (version === undefined) {
		return undefined;
	}
	return { name, version };
}

const BOT_SUFFIXES = [
	"bot",
	"Bot",
	"spider",
	"Spider",
	"crawler",
	"Crawler",
	"proxy",
	"Proxy",
] as const;

function isBotName(name: string): boolean {
	if (name === "Chrome-Lighthouse" || name.startsWith("meta-")) {
		return true;
	}
	for (const suffix of BOT_SUFFIXES) {
		if (name.endsWith(suffix)) {
			return true;
		}
	}
	return false;
}

function parseVersion(raw: string): MinorVersion | undefined {
	const version =
		raw.startsWith("v") || raw.startsWith("V") ? raw.slice(1) : raw;
	const parts = version.split(".");
	const first = parts[0];
	if (first === undefined) {
		return undefined;
	}
	const major = parseLeadingU16(first);
	if (major === undefined) {
		return undefined;
	}
	const second = parts[1];
	const minor = second !== undefined ? (parseLeadingU16(second) ?? 0) : 0;
	return [major, minor];
}

function parseVersion3(raw: string): PatchVersion | undefined {
	const version =
		raw.startsWith("v") || raw.startsWith("V") ? raw.slice(1) : raw;
	const parts = version.split(".");
	const first = parts[0];
	if (first === undefined) {
		return undefined;
	}
	const major = parseLeadingU16(first);
	if (major === undefined) {
		return undefined;
	}
	const second = parts[1];
	const minor = second !== undefined ? (parseLeadingU16(second) ?? 0) : 0;
	const third = parts[2];
	const patch = third !== undefined ? (parseLeadingU16(third) ?? 0) : 0;
	return [major, minor, patch];
}

function parseLeadingU16(s: string): number | undefined {
	let digitsEnd = 0;
	while (digitsEnd < s.length) {
		const code = s.charCodeAt(digitsEnd);
		if (code >= 0x30 /* '0' */ && code <= 0x39 /* '9' */) {
			digitsEnd += 1;
		} else {
			break;
		}
	}
	if (digitsEnd === 0) {
		return undefined;
	}
	const value = Number(s.slice(0, digitsEnd));
	if (!Number.isInteger(value) || value < 0 || value > 65535) {
		return undefined;
	}
	return value;
}

function splitOnce(s: string, sep: string): [string, string] | undefined {
	const idx = s.indexOf(sep);
	if (idx === -1) {
		return undefined;
	}
	return [s.slice(0, idx), s.slice(idx + sep.length)];
}

function isWhitespaceCode(code: number): boolean {
	return (
		code === 0x20 ||
		code === 0x09 ||
		code === 0x0a ||
		code === 0x0d ||
		code === 0x0b ||
		code === 0x0c
	);
}

function hasWhitespace(s: string): boolean {
	for (let i = 0; i < s.length; i++) {
		if (isWhitespaceCode(s.charCodeAt(i))) {
			return true;
		}
	}
	return false;
}

function splitWhitespace(s: string): string[] {
	const words: string[] = [];
	let start = -1;
	for (let i = 0; i < s.length; i++) {
		if (isWhitespaceCode(s.charCodeAt(i))) {
			if (start !== -1) {
				words.push(s.slice(start, i));
				start = -1;
			}
		} else if (start === -1) {
			start = i;
		}
	}
	if (start !== -1) {
		words.push(s.slice(start));
	}
	return words;
}

function firstWhitespaceWord(s: string): string | undefined {
	let start = -1;
	for (let i = 0; i < s.length; i++) {
		if (isWhitespaceCode(s.charCodeAt(i))) {
			if (start !== -1) {
				return s.slice(start, i);
			}
		} else if (start === -1) {
			start = i;
		}
	}
	return start === -1 ? undefined : s.slice(start);
}

function lastWhitespaceWord(s: string): string | undefined {
	let end = -1;
	for (let i = s.length - 1; i >= 0; i--) {
		if (isWhitespaceCode(s.charCodeAt(i))) {
			if (end !== -1) {
				return s.slice(i + 1, end);
			}
		} else if (end === -1) {
			end = i + 1;
		}
	}
	return end === -1 ? undefined : s.slice(0, end);
}

function isAsciiAlnumDashUnderscore(s: string): boolean {
	for (let i = 0; i < s.length; i++) {
		const code = s.charCodeAt(i);
		const isAlnum =
			(code >= 0x30 && code <= 0x39) ||
			(code >= 0x41 && code <= 0x5a) ||
			(code >= 0x61 && code <= 0x7a);
		if (!isAlnum && code !== 0x2d /* '-' */ && code !== 0x5f /* '_' */) {
			return false;
		}
	}
	return true;
}
