import Bowser from "bowser";
import UAParserV1 from "ua-parser-js";
import { parse } from "user-agent-classifier";
import {
	loadDeviceDetector,
	loadUaParserV2,
	type ParserFn,
} from "./cdn-parsers.mts";
import { getElement } from "./dom.mts";

const uaInput = getElement("ua-input", HTMLTextAreaElement);
const presetSelect = getElement("ua-preset", HTMLSelectElement);
const myUaOption = getElement("my-ua-option", HTMLOptionElement);
const resultsContainer = getElement("comparison-results", HTMLElement);

interface NavigatorUABrandVersion {
	readonly brand: string;
	readonly version: string;
}

interface NavigatorUAData {
	readonly brands: readonly NavigatorUABrandVersion[];
	readonly mobile: boolean;
	readonly platform: string;
	getHighEntropyValues(
		hints: readonly string[],
	): Promise<Record<string, unknown>>;
}

function getUserAgentData(): NavigatorUAData | undefined {
	if ("userAgentData" in navigator) {
		return (
			(navigator as Navigator & { userAgentData?: NavigatorUAData | null })
				.userAgentData ?? undefined
		);
	}
	return undefined;
}

let userAgentDataPanel: HTMLElement | null = null;

interface LibraryConfig {
	readonly id: string;
	readonly badge?: string;
	readonly license: string;
	readonly load: () => Promise<ParserFn<unknown>>;
}

interface LibraryEntry {
	readonly id: string;
	readonly badge?: string;
	readonly license: string;
	readonly slot: PromiseSettledResult<ParserFn<unknown>>;
}

const libraryConfigs: readonly LibraryConfig[] = [
	{
		id: "user-agent-classifier",
		badge: "This library",
		license: "MIT",
		load: () => Promise.resolve(parse),
	},
	{
		id: "ua-parser-js (v1)",
		license: "MIT",
		load: () => Promise.resolve(UAParserV1),
	},
	{
		id: "ua-parser-js (v2)",
		license: "AGPL-3.0",
		load: loadUaParserV2,
	},
	{
		id: "bowser",
		license: "MIT",
		load: () => Promise.resolve((ua) => Bowser.parse(ua)),
	},
	{
		id: "device-detector-js",
		license: "LGPL-3.0",
		load: loadDeviceDetector,
	},
];

let libraries: LibraryEntry[] = [];

function formatOutputJson(value: unknown): string {
	if (typeof value === "object" && value !== null && !Array.isArray(value)) {
		const { ua: _ua, ...rest } = value as Record<string, unknown>;
		return JSON.stringify(rest, null, 2);
	}
	return JSON.stringify(value, null, 2);
}

interface PanelBadge {
	readonly text: string;
	readonly className: "badge-true" | "badge-false";
}

interface PanelOptions {
	readonly title: string;
	readonly badges: readonly PanelBadge[];
	readonly error?: string;
	readonly json?: string;
}

function createPanel(options: PanelOptions): HTMLElement {
	const section = document.createElement("section");
	section.className = "panel";

	const header = document.createElement("div");
	header.className = "panel-header";

	const heading = document.createElement("h2");
	heading.append(options.title);
	for (const badgeInfo of options.badges) {
		const badge = document.createElement("span");
		badge.className = badgeInfo.className;
		badge.textContent = badgeInfo.text;
		heading.appendChild(badge);
	}
	header.append(heading);
	section.appendChild(header);

	if (options.error !== undefined) {
		const errEl = document.createElement("p");
		errEl.className = "muted-note";
		errEl.textContent = options.error;
		section.appendChild(errEl);
	}

	if (options.json !== undefined) {
		const pre = document.createElement("pre");
		pre.className = "json-output";
		pre.textContent = options.json;
		section.appendChild(pre);
	}

	return section;
}

async function loadUserAgentDataPanel(): Promise<HTMLElement | null> {
	const uaData = getUserAgentData();
	if (uaData === undefined) {
		return null;
	}

	let highEntropyData: Record<string, unknown> | null = null;
	let highEntropyError: string | null = null;
	try {
		highEntropyData = await uaData.getHighEntropyValues([
			"architecture",
			"bitness",
			"formFactors",
			"fullVersionList",
			"model",
			"platformVersion",
			"wow64",
		]);
	} catch (err) {
		highEntropyError =
			err instanceof Error ? err.message : "Failed to read high-entropy values";
	}

	const payload: Record<string, unknown> = {
		brands: uaData.brands,
		mobile: uaData.mobile,
		platform: uaData.platform,
		...(highEntropyData ?? {}),
	};

	return createPanel({
		title: "navigator.userAgentData",
		badges: [{ text: "Browser Client Hints", className: "badge-false" }],
		...(highEntropyError !== null
			? { error: `High-entropy values error: ${highEntropyError}` }
			: {}),
		json: JSON.stringify(payload, null, 2),
	});
}

function render(): void {
	const ua = uaInput.value;
	const hasMatchingPreset =
		ua !== "" &&
		Array.from(presetSelect.options).some((opt) => opt.value === ua);
	presetSelect.value = hasMatchingPreset ? ua : "";
	const panels: HTMLElement[] = [];

	if (ua === navigator.userAgent && userAgentDataPanel !== null) {
		panels.push(userAgentDataPanel);
	}

	for (const lib of libraries) {
		const badges: PanelBadge[] = [
			{ text: lib.license, className: "badge-false" },
			...(lib.badge !== undefined
				? [{ text: lib.badge, className: "badge-true" as const }]
				: []),
		];

		if (lib.slot.status === "rejected") {
			const message =
				lib.slot.reason instanceof Error
					? lib.slot.reason.message
					: "Unknown error";
			panels.push(
				createPanel({
					title: lib.id,
					badges,
					error: `Error loading from CDN: ${message}`,
				}),
			);
		} else {
			panels.push(
				createPanel({
					title: lib.id,
					badges,
					json: formatOutputJson(lib.slot.value(ua)),
				}),
			);
		}
	}

	resultsContainer.replaceChildren(...panels);
}

myUaOption.value = navigator.userAgent;
uaInput.value = navigator.userAgent;
void Promise.all([
	loadUserAgentDataPanel(),
	Promise.all(
		libraryConfigs.map(async (entry): Promise<LibraryEntry> => {
			let slot: PromiseSettledResult<ParserFn<unknown>>;
			try {
				slot = { status: "fulfilled", value: await entry.load() };
			} catch (reason) {
				slot = { status: "rejected", reason };
			}
			return {
				id: entry.id,
				...(entry.badge !== undefined ? { badge: entry.badge } : {}),
				license: entry.license,
				slot,
			};
		}),
	),
]).then(([uaDataPanel, loadedLibraries]) => {
	userAgentDataPanel = uaDataPanel;
	libraries = loadedLibraries;
	render();
	uaInput.addEventListener("input", render);
	presetSelect.addEventListener("change", () => {
		if (presetSelect.value !== "") {
			uaInput.value = presetSelect.value;
			render();
		}
	});
});
