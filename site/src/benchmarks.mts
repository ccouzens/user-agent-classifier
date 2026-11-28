import { DEFAULT_CORPUS_TEXT } from "virtual:sorted-user-agents";
import type {
	LibraryId,
	LibraryResult,
	WorkerMessage,
	WorkerRequest,
} from "./benchmark.worker.mts";
import { getElement } from "./dom.mts";

const LIBRARIES: readonly LibraryId[] = [
	"user-agent-classifier",
	"ua-parser-js (v1)",
	"ua-parser-js (v2)",
	"bowser",
	"device-detector-js",
];

const corpusInput = getElement("corpus-input", HTMLTextAreaElement);
const corpusCount = getElement("corpus-count", HTMLElement);
const corpusPreset = getElement("corpus-preset", HTMLSelectElement);
const btnRun = getElement("btn-run", HTMLButtonElement);
const resultsBody = getElement("results-body", HTMLElement);

type LibraryState =
	| { readonly status: "idle" }
	| { readonly status: "running" }
	| { readonly status: "done"; readonly result: LibraryResult }
	| { readonly status: "error"; readonly message: string };

const states = new Map<LibraryId, LibraryState>();
for (const id of LIBRARIES) {
	states.set(id, { status: "idle" });
}

let activeWorker: Worker | null = null;

function parseCorpusLines(): string[] {
	return corpusInput.value
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
}

function updateCorpusCount(): void {
	const count = parseCorpusLines().length;
	corpusCount.textContent = String(count);
	btnRun.disabled = count === 0 || activeWorker !== null;
	if (corpusInput.value === DEFAULT_CORPUS_TEXT) {
		corpusPreset.value = "default";
	} else if (corpusInput.value === navigator.userAgent) {
		corpusPreset.value = "my-ua";
	} else {
		corpusPreset.value = "";
	}
}

function formatNumber(value: number): string {
	return Math.round(value).toLocaleString();
}

function formatMs(ms: number): string {
	if (ms < 0.01) {
		return `${(ms * 1000).toFixed(2)} µs`;
	}
	if (ms < 1) {
		return `${ms.toFixed(3)} ms`;
	}
	return `${ms.toFixed(2)} ms`;
}

function renderTable(): void {
	let maxBatchesPerSec = 0;
	const baselineState = states.get("user-agent-classifier");
	const baselineBatchesPerSec =
		baselineState?.status === "done"
			? baselineState.result.batchesPerSec
			: null;

	for (const state of states.values()) {
		if (state.status === "done") {
			maxBatchesPerSec = Math.max(maxBatchesPerSec, state.result.batchesPerSec);
		}
	}

	const rows: HTMLTableRowElement[] = [];

	for (const id of LIBRARIES) {
		const state = states.get(id) ?? { status: "idle" };
		const tr = document.createElement("tr");

		const nameTd = document.createElement("td");
		nameTd.textContent = id;

		const statusTd = document.createElement("td");
		const uasTd = document.createElement("td");
		const meanTd = document.createElement("td");
		const relTd = document.createElement("td");
		const barTd = document.createElement("td");

		if (state.status === "done") {
			const { result } = state;
			statusTd.textContent = "Done";
			uasTd.textContent = formatNumber(result.uasPerSec);
			meanTd.textContent = formatMs(result.meanBatchMs);

			if (baselineBatchesPerSec !== null && baselineBatchesPerSec > 0) {
				if (id === "user-agent-classifier") {
					relTd.textContent = "1.0x";
				} else {
					const ratio = baselineBatchesPerSec / result.batchesPerSec;
					relTd.textContent =
						ratio >= 1
							? `${ratio.toFixed(1)}x slower`
							: `${(1 / ratio).toFixed(1)}x faster`;
				}
			} else {
				relTd.textContent = "—";
			}

			const track = document.createElement("div");
			track.className = "bar-track";
			const fill = document.createElement("div");
			fill.className = "bar-fill";
			const pct =
				maxBatchesPerSec > 0
					? (result.batchesPerSec / maxBatchesPerSec) * 100
					: 0;
			fill.style.width = `${Math.max(pct, 1).toFixed(1)}%`;
			track.appendChild(fill);
			barTd.appendChild(track);
		} else {
			uasTd.textContent = "—";
			meanTd.textContent = "—";
			relTd.textContent = "—";
			if (state.status === "idle") {
				statusTd.textContent = "Pending";
			} else if (state.status === "running") {
				statusTd.textContent = "Running…";
			} else {
				statusTd.textContent = `Error: ${state.message}`;
			}
		}

		tr.append(nameTd, statusTd, uasTd, meanTd, relTd, barTd);
		rows.push(tr);
	}

	resultsBody.replaceChildren(...rows);
}

function setRunning(running: boolean): void {
	btnRun.disabled = running || parseCorpusLines().length === 0;
	corpusPreset.disabled = running;
	corpusInput.disabled = running;
}

function runBenchmarks(): void {
	const corpus = parseCorpusLines();
	if (corpus.length === 0) {
		return;
	}

	if (activeWorker !== null) {
		activeWorker.terminate();
	}

	for (const id of LIBRARIES) {
		states.set(id, { status: "idle" });
	}
	renderTable();
	setRunning(true);

	const worker = new Worker(
		new URL("./benchmark.worker.mts", import.meta.url),
		{
			type: "module",
		},
	);
	activeWorker = worker;

	worker.addEventListener("message", (event: MessageEvent<WorkerMessage>) => {
		const msg = event.data;
		if (msg.type === "library-start") {
			states.set(msg.id, { status: "running" });
			renderTable();
		} else if (msg.type === "library-done") {
			states.set(msg.result.id, { status: "done", result: msg.result });
			renderTable();
		} else if (msg.type === "library-error") {
			states.set(msg.id, { status: "error", message: msg.message });
			renderTable();
		} else if (msg.type === "done") {
			worker.terminate();
			activeWorker = null;
			setRunning(false);
		} else if (msg.type === "error") {
			worker.terminate();
			activeWorker = null;
			setRunning(false);
		}
	});

	worker.addEventListener("error", () => {
		worker.terminate();
		activeWorker = null;
		setRunning(false);
	});

	worker.postMessage({ type: "run", corpus } satisfies WorkerRequest);
}

corpusInput.value = DEFAULT_CORPUS_TEXT;
updateCorpusCount();
renderTable();

corpusInput.addEventListener("input", updateCorpusCount);

corpusPreset.addEventListener("change", () => {
	if (corpusPreset.value === "default") {
		corpusInput.value = DEFAULT_CORPUS_TEXT;
		updateCorpusCount();
	} else if (corpusPreset.value === "my-ua") {
		corpusInput.value = navigator.userAgent;
		updateCorpusCount();
	}
});

btnRun.addEventListener("click", runBenchmarks);
