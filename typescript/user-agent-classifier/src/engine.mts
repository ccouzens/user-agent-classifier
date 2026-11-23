/**
 * Parsed major and minor version pair.
 */
export type Version = readonly [major: number, minor: number];

/**
 * Rendering engine and engine version parsed from a `User-Agent` string.
 */
export type Engine =
	| { readonly name: "blink"; readonly major: number }
	| { readonly name: "gecko"; readonly major: number }
	| { readonly name: "webkit"; readonly version: Version | null }
	| { readonly name: "other" };

/**
 * Returns the `[major, minor]` version for an {@link Engine}, or `null` when unavailable.
 */
export function engineVersion(engine: Engine): Version | null {
	switch (engine.name) {
		case "blink":
		case "gecko":
			return [engine.major, 0];
		case "webkit":
			return engine.version;
		case "other":
			return null;
	}
}
