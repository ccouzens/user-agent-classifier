/**
 * Bounded platform classification as reported in the `User-Agent` string.
 */
export type ReportedPlatform =
	| "Android"
	| "CrOS"
	| "iPad"
	| "iPhone"
	| "Linux"
	| "Macintosh"
	| "Windows"
	| "Other";

export function reportedPlatformFromToken(
	token: string,
): ReportedPlatform | undefined {
	switch (token) {
		case "iPhone":
		case "iPad":
		case "Android":
		case "CrOS":
		case "Windows":
		case "Macintosh":
		case "Linux":
			return token;
		default:
			return undefined;
	}
}
