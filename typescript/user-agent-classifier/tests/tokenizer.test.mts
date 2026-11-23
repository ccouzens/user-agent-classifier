/// <reference types="node" />

import assert from "node:assert/strict";
import test from "node:test";

import { Tokenizer, type UaToken } from "../src/tokenizer.mts";

function tokenizeAll(input: string): UaToken[] {
	const tokens: UaToken[] = [];
	const tokenizer = new Tokenizer(input);
	for (
		let token = tokenizer.next();
		token !== undefined;
		token = tokenizer.next()
	) {
		tokens.push(token);
	}
	return tokens;
}

test("tokenize chrome mobile", () => {
	const ua =
		"Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Mobile Safari/537.36";
	assert.deepEqual(tokenizeAll(ua), [
		{ kind: "name_sep_number", name: "Mozilla", number: "5.0" },
		{ kind: "round_brackets", content: "Linux; Android 10; K" },
		{ kind: "name_sep_number", name: "AppleWebKit", number: "537.36" },
		{ kind: "round_brackets", content: "KHTML, like Gecko" },
		{ kind: "name_sep_number", name: "Chrome", number: "157.0.0.0" },
		{ kind: "other", value: "Mobile" },
		{ kind: "name_sep_number", name: "Safari", number: "537.36" },
	]);
});

test("tokenize facebook with spaces in brackets", () => {
	const ua =
		"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22A3354 [FBAN/Messenger for iOS;FBAV/514.0.0.47.102;FBCR/Life Wireless;]";
	assert.deepEqual(tokenizeAll(ua), [
		{ kind: "name_sep_number", name: "Mozilla", number: "5.0" },
		{
			kind: "round_brackets",
			content: "iPhone; CPU iPhone OS 18_0 like Mac OS X",
		},
		{ kind: "name_sep_number", name: "AppleWebKit", number: "605.1.15" },
		{ kind: "round_brackets", content: "KHTML, like Gecko" },
		{ kind: "name_sep_number", name: "Mobile", number: "22A3354" },
		{
			kind: "square_brackets",
			content: "FBAN/Messenger for iOS;FBAV/514.0.0.47.102;FBCR/Life Wireless;",
		},
	]);
});

test("tokenize instagram space number", () => {
	const ua =
		"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 360.0.0.0 (iPhone16,1; iOS 18_0)";
	assert.deepEqual(tokenizeAll(ua), [
		{ kind: "name_sep_number", name: "Mozilla", number: "5.0" },
		{
			kind: "round_brackets",
			content: "iPhone; CPU iPhone OS 18_0 like Mac OS X",
		},
		{ kind: "name_sep_number", name: "AppleWebKit", number: "605.1.15" },
		{ kind: "round_brackets", content: "KHTML, like Gecko" },
		{ kind: "name_sep_number", name: "Mobile", number: "15E148" },
		{ kind: "name_sep_number", name: "Instagram", number: "360.0.0.0" },
		{ kind: "round_brackets", content: "iPhone16,1; iOS 18_0" },
	]);
});

test("tokenize nested round brackets", () => {
	const ua =
		"Mozilla/5.0 (Linux; Android 11; moto g(7) power Build/QPO30.52-29; wv) AppleWebKit/537.36";
	assert.deepEqual(tokenizeAll(ua), [
		{ kind: "name_sep_number", name: "Mozilla", number: "5.0" },
		{
			kind: "round_brackets",
			content: "Linux; Android 11; moto g(7) power Build/QPO30.52-29; wv",
		},
		{ kind: "name_sep_number", name: "AppleWebKit", number: "537.36" },
	]);
});

test("tokenize multi slash", () => {
	const ua =
		"Chrome/135.0.7049.79 XiaoMi/MiuiBrowser/14.67.2-gn +https://example.com/123";
	assert.deepEqual(tokenizeAll(ua), [
		{ kind: "name_sep_number", name: "Chrome", number: "135.0.7049.79" },
		{
			kind: "name_sep_number",
			name: "XiaoMi/MiuiBrowser",
			number: "14.67.2-gn",
		},
		{ kind: "other", value: "+https://example.com/123" },
	]);
});

test("tokenize bracketed name slash number", () => {
	const ua =
		"Mobile/15E148 [LinkedInApp]/9.32.5794 [SuperhumanProxy]/1.0 (comment)";
	assert.deepEqual(tokenizeAll(ua), [
		{ kind: "name_sep_number", name: "Mobile", number: "15E148" },
		{ kind: "name_sep_number", name: "LinkedInApp", number: "9.32.5794" },
		{ kind: "name_sep_number", name: "SuperhumanProxy", number: "1.0" },
		{ kind: "round_brackets", content: "comment" },
	]);
});

test("tokenize semicolon separated tokens", () => {
	const ua =
		"Safari/604.1 [FBAN/FBIOS;FBAV/588.1.0.66.71];FBNV/1; compatible; OAI-SearchBot/1.4;";
	assert.deepEqual(tokenizeAll(ua), [
		{ kind: "name_sep_number", name: "Safari", number: "604.1" },
		{ kind: "square_brackets", content: "FBAN/FBIOS;FBAV/588.1.0.66.71" },
		{ kind: "name_sep_number", name: "FBNV", number: "1" },
		{ kind: "other", value: "compatible" },
		{ kind: "name_sep_number", name: "OAI-SearchBot", number: "1.4" },
	]);
});
