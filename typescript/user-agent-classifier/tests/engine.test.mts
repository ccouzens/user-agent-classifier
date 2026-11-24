/// <reference types="node" />

import assert from "node:assert/strict";
import test from "node:test";

import { engineVersion } from "../src/index.mts";

test("engineVersion helper", () => {
	assert.deepEqual(engineVersion({ name: "blink", major: 156 }), [156, 0, 0]);
	assert.deepEqual(engineVersion({ name: "gecko", major: 160 }), [160, 0, 0]);
	assert.deepEqual(
		engineVersion({ name: "webkit", version: [27, 2] }),
		[27, 2, 0],
	);
	assert.deepEqual(
		engineVersion({ name: "ladybird", version: [2026, 47, 7] }),
		[2026, 47, 7],
	);
	assert.deepEqual(
		engineVersion({ name: "servo", version: [0, 8, 0] }),
		[0, 8, 0],
	);
	assert.equal(engineVersion({ name: "other" }), null);
});
