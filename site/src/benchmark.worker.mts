import Bowser from "bowser";
import UAParserV1 from "ua-parser-js";
import { parse } from "user-agent-classifier";
import { loadDeviceDetector, loadUaParserV2 } from "./cdn-parsers.mts";

export type LibraryId =
	| "user-agent-classifier"
	| "ua-parser-js (v1)"
	| "ua-parser-js (v2)"
	| "bowser"
	| "device-detector-js";

export interface LibraryResult {
	readonly id: LibraryId;
	readonly batchesPerSec: number;
	readonly uasPerSec: number;
	readonly meanBatchMs: number;
	readonly iterations: number;
}

export type WorkerRequest = {
	readonly type: "run";
	readonly corpus: readonly string[];
};

export type WorkerMessage =
	| { readonly type: "library-start"; readonly id: LibraryId }
	| { readonly type: "library-done"; readonly result: LibraryResult }
	| {
			readonly type: "library-error";
			readonly id: LibraryId;
			readonly message: string;
	  }
	| { readonly type: "done" }
	| { readonly type: "error"; readonly message: string };

const TARGET_DURATION_MS = 500;
const MIN_BATCHES = 5;

type BatchFn = (corpus: readonly string[]) => number;

interface Runner {
	readonly id: LibraryId;
	readonly createBatchRunner: () => Promise<BatchFn>;
}

function makeBatchFn(fn: (ua: string) => unknown): BatchFn {
	return (corpus) => {
		let acc = 0;
		for (const ua of corpus) {
			if (fn(ua) !== null) {
				acc++;
			}
		}
		return acc;
	};
}

const RUNNERS: readonly Runner[] = [
	{
		id: "user-agent-classifier",
		createBatchRunner: async () => makeBatchFn(parse),
	},
	{
		id: "ua-parser-js (v1)",
		createBatchRunner: async () => makeBatchFn(UAParserV1),
	},
	{
		id: "ua-parser-js (v2)",
		createBatchRunner: async () => makeBatchFn(await loadUaParserV2()),
	},
	{
		id: "bowser",
		createBatchRunner: async () => makeBatchFn((ua) => Bowser.parse(ua)),
	},
	{
		id: "device-detector-js",
		createBatchRunner: async () => makeBatchFn(await loadDeviceDetector()),
	},
];

function benchmarkLibrary(
	id: LibraryId,
	runBatch: BatchFn,
	corpus: readonly string[],
): LibraryResult {
	// Warmup to let JIT optimize before timing
	const warmupStart = performance.now();
	let warmupIters = 0;
	let sink = 0;
	while (warmupIters < 3 || performance.now() - warmupStart < 50) {
		sink += runBatch(corpus);
		warmupIters++;
		if (warmupIters >= 200) {
			break;
		}
	}

	const start = performance.now();
	let iterations = 0;
	let elapsedMs = 0;

	while (iterations < MIN_BATCHES || elapsedMs < TARGET_DURATION_MS) {
		sink += runBatch(corpus);
		iterations++;
		elapsedMs = performance.now() - start;
	}

	(self as unknown as { __benchSink?: number }).__benchSink = sink;

	const meanBatchMs = elapsedMs / iterations;
	const batchesPerSec = (iterations * 1000) / elapsedMs;
	const uasPerSec = batchesPerSec * corpus.length;

	return {
		id,
		batchesPerSec,
		uasPerSec,
		meanBatchMs,
		iterations,
	};
}

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
	if (event.data.type !== "run") {
		return;
	}

	const { corpus } = event.data;
	if (corpus.length === 0) {
		self.postMessage({
			type: "error",
			message: "Corpus is empty. Enter at least one User-Agent string.",
		} satisfies WorkerMessage);
		return;
	}

	for (const runner of RUNNERS) {
		self.postMessage({
			type: "library-start",
			id: runner.id,
		} satisfies WorkerMessage);

		try {
			const runBatch = await runner.createBatchRunner();
			const result = benchmarkLibrary(runner.id, runBatch, corpus);
			self.postMessage({
				type: "library-done",
				result,
			} satisfies WorkerMessage);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to run benchmark";
			self.postMessage({
				type: "library-error",
				id: runner.id,
				message,
			} satisfies WorkerMessage);
		}
	}

	self.postMessage({ type: "done" } satisfies WorkerMessage);
});
