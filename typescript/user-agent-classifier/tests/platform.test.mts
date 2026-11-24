/// <reference types="node" />

import assert from "node:assert/strict";
import test from "node:test";

import { reportedPlatformFromToken } from "../src/reported_platform.mts";

test("reportedPlatformFromToken", () => {
	assert.equal(reportedPlatformFromToken("Android"), "Android");
	assert.equal(reportedPlatformFromToken("CrOS"), "CrOS");
	assert.equal(reportedPlatformFromToken("Linux"), "Linux");
	assert.equal(reportedPlatformFromToken("iPhone"), "iPhone");
	assert.equal(reportedPlatformFromToken("iPad"), "iPad");
	assert.equal(reportedPlatformFromToken("Macintosh"), "Macintosh");
	assert.equal(reportedPlatformFromToken("Windows"), "Windows");
	assert.equal(reportedPlatformFromToken("Fuchsia"), undefined);
});
