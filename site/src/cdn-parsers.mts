export interface UaParserResult {
	readonly browser?: { readonly name?: string; readonly version?: string };
	readonly engine?: { readonly name?: string; readonly version?: string };
	readonly os?: { readonly name?: string; readonly version?: string };
	readonly device?: {
		readonly type?: string;
		readonly vendor?: string;
		readonly model?: string;
	};
}

export interface DeviceDetectorResult {
	readonly os?: {
		readonly name?: string;
		readonly version?: string;
		readonly platform?: string;
	} | null;
	readonly client?: {
		readonly type?: string;
		readonly name?: string;
		readonly version?: string;
		readonly engine?: string;
		readonly engineVersion?: string;
	} | null;
	readonly device?: {
		readonly type?: string;
		readonly brand?: string;
		readonly model?: string;
	} | null;
	readonly bot?: {
		readonly name?: string;
		readonly category?: string;
	} | null;
}

export type ParserFn<T> = (ua: string) => T;

export async function loadUaParserV2(): Promise<ParserFn<UaParserResult>> {
	const { UAParser } = await import(
		"https://cdn.jsdelivr.net/npm/ua-parser-js@2.0.10/src/main/ua-parser.mjs"
	);
	return (ua) => UAParser(ua);
}

export async function loadDeviceDetector(): Promise<
	ParserFn<DeviceDetectorResult>
> {
	const { default: DeviceDetector } = await import(
		"https://cdn.jsdelivr.net/npm/device-detector-js@3.0.3/+esm"
	);
	const detector = new DeviceDetector();
	return (ua) => detector.parse(ua);
}
