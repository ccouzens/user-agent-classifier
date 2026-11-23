/// <reference types="node" />

import assert from "node:assert/strict";
import test from "node:test";

import cases from "../../../parsed_user_agent_test_cases.json" with {
	type: "json",
};
import { type Classification, engineVersion, parse } from "../src/index.mts";

interface TestCase {
	user_agent: string;
	is_mobile?: boolean;
	is_webview?: boolean;
	is_bot?: boolean;
	reported_platform: string;
	engine: { name: string; major?: number; version?: number[] | null };
	browser: { name: string; version: number[] | null } | null;
}

test("parsed_user_agent_test_cases.json", () => {
	assert.ok(cases.length > 0);

	for (const c of cases as readonly TestCase[]) {
		const actual = parse(c.user_agent);
		const expected = {
			is_mobile: c.is_mobile ?? false,
			is_webview: c.is_webview ?? false,
			is_bot: c.is_bot ?? false,
			reported_platform: c.reported_platform,
			engine: c.engine,
			browser: c.browser,
		} as Classification;
		assert.deepEqual(actual, expected, `Failed for UA: ${c.user_agent}`);
	}
});

test("engineVersion helper", () => {
	assert.deepEqual(engineVersion({ name: "blink", major: 156 }), [156, 0]);
	assert.deepEqual(engineVersion({ name: "gecko", major: 160 }), [160, 0]);
	assert.deepEqual(
		engineVersion({ name: "webkit", version: [27, 2] }),
		[27, 2],
	);
	assert.equal(engineVersion({ name: "other" }), null);
});
