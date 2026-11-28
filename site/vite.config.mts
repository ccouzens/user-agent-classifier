import { defineConfig, type Plugin } from "vite";
import testCases from "../parsed_user_agent_test_cases.json" with {
	type: "json",
};

const CDN_EXTERNAL = [/^https:\/\/cdn\.jsdelivr\.net\//];
const VIRTUAL_CORPUS_ID = "virtual:sorted-user-agents";
const RESOLVED_VIRTUAL_CORPUS_ID = `\0${VIRTUAL_CORPUS_ID}`;

function sortedUserAgentsPlugin(): Plugin {
	const sorted = testCases
		.map((entry) => entry.user_agent)
		.toSorted((a, b) => a.localeCompare(b));
	return {
		name: "sorted-user-agents",
		resolveId(id) {
			if (id === VIRTUAL_CORPUS_ID) {
				return RESOLVED_VIRTUAL_CORPUS_ID;
			}
		},
		load(id) {
			if (id === RESOLVED_VIRTUAL_CORPUS_ID) {
				return `export const DEFAULT_CORPUS_TEXT = ${JSON.stringify(sorted.join("\n"))};`;
			}
		},
	};
}

export default defineConfig({
	base: "/user-agent-classifier/",
	plugins: [sortedUserAgentsPlugin()],
	input: {
		main: "index.html",
		tsClassifier: "typescript/classifier/index.html",
		tsBenchmarks: "typescript/benchmarks/index.html",
	},
	build: {
		modulePreload: {
			polyfill: false,
		},
		rolldownOptions: {
			external: CDN_EXTERNAL,
		},
	},
	server: {
		allowedHosts: ["localhost", ".trycloudflare.com"],
	},
	preview: {
		allowedHosts: ["localhost", ".trycloudflare.com"],
	},
	worker: {
		format: "es",
		rolldownOptions: {
			external: CDN_EXTERNAL,
		},
	},
});
