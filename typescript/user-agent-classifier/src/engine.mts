/**
 * Parsed major and minor version pair.
 */
export type MinorVersion = readonly [major: number, minor: number];

/**
 * Parsed major, minor, and patch version triple.
 */
export type PatchVersion = readonly [
	major: number,
	minor: number,
	patch: number,
];

/**
 * Rendering engine and engine version parsed from a `User-Agent` string.
 */
export type Engine =
	| { readonly name: "blink"; readonly major: number }
	| { readonly name: "gecko"; readonly major: number }
	| { readonly name: "webkit"; readonly version: MinorVersion | null }
	| { readonly name: "ladybird"; readonly version: PatchVersion | null }
	| { readonly name: "servo"; readonly version: PatchVersion | null }
	| { readonly name: "other" };

/**
 * Returns the `[major, minor, patch]` version for an {@link Engine}, or `null` when unavailable.
 */
export function engineVersion(engine: Engine): PatchVersion | null {
	switch (engine.name) {
		case "blink":
		case "gecko":
			return [engine.major, 0, 0];
		case "webkit":
			return engine.version === null
				? null
				: [engine.version[0], engine.version[1], 0];
		case "ladybird":
		case "servo":
			return engine.version;
		case "other":
			return null;
	}
}
