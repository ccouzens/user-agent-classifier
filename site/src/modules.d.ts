declare module "https://cdn.jsdelivr.net/npm/ua-parser-js@2.0.10/src/main/ua-parser.mjs" {
	import type { ParserFn, UaParserResult } from "./cdn-parsers.mts";

	export const UAParser: ParserFn<UaParserResult>;
}

declare module "https://cdn.jsdelivr.net/npm/device-detector-js@3.0.3/+esm" {
	import type { DeviceDetectorResult, ParserFn } from "./cdn-parsers.mts";

	const DeviceDetector: new () => {
		readonly parse: ParserFn<DeviceDetectorResult>;
	};
	export default DeviceDetector;
}

declare module "virtual:sorted-user-agents" {
	export const DEFAULT_CORPUS_TEXT: string;
}
