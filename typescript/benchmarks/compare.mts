/// <reference types="node" />

import Bowser from "bowser";
import DeviceDetector from "device-detector-js";
import { bench, do_not_optimize, run } from "mitata";
import { UAParser } from "ua-parser-js";
import UAParserV1 from "ua-parser-js-v1";
import { parse } from "user-agent-classifier";
import cases from "../../parsed_user_agent_test_cases.json" with {
	type: "json",
};

const corpus: readonly string[] = cases.map((c) => c.user_agent);

const deviceDetector = new DeviceDetector();

bench(`user-agent-classifier (${corpus.length} UAs)`, () => {
	for (const ua of corpus) {
		do_not_optimize(parse(ua));
	}
});

bench(`ua-parser-js (v1) (${corpus.length} UAs)`, () => {
	for (const ua of corpus) {
		do_not_optimize(UAParserV1(ua));
	}
});

bench(`ua-parser-js (v2) (${corpus.length} UAs)`, () => {
	for (const ua of corpus) {
		do_not_optimize(UAParser(ua));
	}
});

bench(`bowser (${corpus.length} UAs)`, () => {
	for (const ua of corpus) {
		do_not_optimize(Bowser.parse(ua));
	}
});

bench(`device-detector-js (${corpus.length} UAs)`, () => {
	for (const ua of corpus) {
		do_not_optimize(deviceDetector.parse(ua));
	}
});

await run();
