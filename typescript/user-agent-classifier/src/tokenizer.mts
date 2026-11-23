/**
 * A single token produced from a `User-Agent` string.
 */
export type UaToken =
	| {
			readonly kind: "name_sep_number";
			readonly name: string;
			readonly number: string;
	  }
	| { readonly kind: "round_brackets"; readonly content: string }
	| { readonly kind: "square_brackets"; readonly content: string }
	| { readonly kind: "other"; readonly value: string };

export class Tokenizer {
	#rest: string;

	constructor(input: string) {
		this.#rest = input;
	}

	next(): UaToken | undefined {
		this.#rest = trimStartWhitespaceOrSemicolon(this.#rest);
		if (this.#rest.length === 0) {
			return undefined;
		}

		if (this.#rest.startsWith("(")) {
			const [content, remaining] = splitRoundBrackets(this.#rest.slice(1));
			this.#rest = remaining;
			return { kind: "round_brackets", content };
		}

		if (this.#rest.startsWith("[")) {
			const afterOpen = this.#rest.slice(1);
			const [content, remaining] = splitOnce(afterOpen, "]") ?? [afterOpen, ""];
			if (remaining.startsWith("/")) {
				const [number, nextRest] = splitWord(remaining.slice(1));
				if (
					content.length > 0 &&
					!content.includes(";") &&
					!content.includes("/") &&
					!content.includes(" ") &&
					startsWithAsciiDigit(number)
				) {
					this.#rest = nextRest;
					return { kind: "name_sep_number", name: content, number };
				}
			}
			this.#rest = remaining;
			return { kind: "square_brackets", content };
		}

		const [word, rest] = splitWord(this.#rest);

		const slashed = rsplitOnce(word, "/");
		if (slashed !== undefined) {
			const [name, number] = slashed;
			if (
				name.length > 0 &&
				!name.includes("://") &&
				startsWithAsciiDigit(number)
			) {
				this.#rest = rest;
				return { kind: "name_sep_number", name, number };
			}
		} else {
			const afterWs = trimStartWhitespace(rest);
			if (!afterWs.startsWith("(") && !afterWs.startsWith("[")) {
				const [number, nextRest] = splitWord(afterWs);
				if (startsWithAsciiDigit(number) && !number.includes("/")) {
					this.#rest = nextRest;
					return { kind: "name_sep_number", name: word, number };
				}
			}
		}

		this.#rest = rest;
		return { kind: "other", value: word };
	}
}

function splitRoundBrackets(afterOpen: string): [string, string] {
	let depth = 1;
	for (let i = 0; i < afterOpen.length; i++) {
		const code = afterOpen.charCodeAt(i);
		if (code === 0x28 /* ( */) {
			depth += 1;
		} else if (code === 0x29 /* ) */) {
			depth -= 1;
			if (depth === 0) {
				return [afterOpen.slice(0, i), afterOpen.slice(i + 1)];
			}
		}
	}
	return [afterOpen, ""];
}

function splitWord(s: string): [string, string] {
	for (let i = 0; i < s.length; i++) {
		const code = s.charCodeAt(i);
		if (
			code === 0x20 /* ' ' */ ||
			code === 0x09 /* '\t' */ ||
			code === 0x3b /* ';' */ ||
			code === 0x28 /* '(' */ ||
			code === 0x5b /* '[' */
		) {
			return [s.slice(0, i), s.slice(i)];
		}
	}
	return [s, ""];
}

function isWhitespaceCode(code: number): boolean {
	return (
		code === 0x20 /* ' ' */ ||
		code === 0x09 /* '\t' */ ||
		code === 0x0a /* '\n' */ ||
		code === 0x0d /* '\r' */ ||
		code === 0x0b /* '\v' */ ||
		code === 0x0c /* '\f' */
	);
}

function trimStartWhitespace(s: string): string {
	let i = 0;
	while (i < s.length && isWhitespaceCode(s.charCodeAt(i))) {
		i += 1;
	}
	return i === 0 ? s : s.slice(i);
}

function trimStartWhitespaceOrSemicolon(s: string): string {
	let i = 0;
	while (i < s.length) {
		const code = s.charCodeAt(i);
		if (code === 0x3b /* ';' */ || isWhitespaceCode(code)) {
			i += 1;
		} else {
			break;
		}
	}
	return i === 0 ? s : s.slice(i);
}

function startsWithAsciiDigit(s: string): boolean {
	if (s.length === 0) {
		return false;
	}
	const code = s.charCodeAt(0);
	return code >= 0x30 /* '0' */ && code <= 0x39 /* '9' */;
}

function splitOnce(s: string, sep: string): [string, string] | undefined {
	const idx = s.indexOf(sep);
	if (idx === -1) {
		return undefined;
	}
	return [s.slice(0, idx), s.slice(idx + sep.length)];
}

function rsplitOnce(s: string, sep: string): [string, string] | undefined {
	const idx = s.lastIndexOf(sep);
	if (idx === -1) {
		return undefined;
	}
	return [s.slice(0, idx), s.slice(idx + sep.length)];
}
