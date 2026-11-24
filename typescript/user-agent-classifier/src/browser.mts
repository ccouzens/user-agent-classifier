import type { MinorVersion } from "./engine.mts";

/**
 * Browser name and version parsed from a `User-Agent` string.
 */
export interface Browser {
	readonly name: string;
	readonly version: MinorVersion | null;
}
