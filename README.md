# CPU Scheduling Simulator

A single-page, no-dependency web app that simulates classic CPU scheduling algorithms on one CPU and shows the result as a Gantt chart with per-process and average metrics.

**Cloudflare Pages Live Demo:** [LINK TO CLIENT SIDE DEMO](simple-cpu-scheduler.kaan-kalaycioglu03.workers.dev)
**Github Pages Live Demo:** [LINK TO CLIENT SIDE DEMO](https://kaan-kalaycioglu.github.io/simple-cpu-scheduler/index.html)

## Features

- Four algorithms:
  - **FCFS**: First-Come, First-Served
  - **SJF**: Shortest Job First (non-preemptive)
  - **SRTF**: Shortest Remaining Time First (preemptive)
  - **RR**: Round Robin with a configurable time quantum
- Editable process table (add/remove rows, set ID, arrival time, CPU burst)
- Five built-in example workloads (A to E), including idle time, simultaneous arrivals, tie-breaking, and SRTF preemption
- Gantt chart with idle periods shown explicitly, plus a text timeline
- Results table: first start, completion, turnaround, waiting and response time per process, and averages
- Strict input validation: invalid input is rejected with a clear error list and nothing is simulated
- Built-in **property checks** that run after every simulation
- Works offline, supports light and dark mode

## Running it

No build step and no install. Either:

1. Open `index.html` directly in any modern browser, or
2. Visit the live demo link above.

## How to use

1. Load an example or edit the process table.
2. Choose an algorithm. If you pick Round Robin, set the quantum.
3. Click **Run simulation**.

## Model and assumptions

- One CPU, one CPU burst per process, no I/O.
- Context switches cost zero time.
- Times are nonnegative integers; bursts and the quantum are positive integers.
- An interval `[2,5)` means 3 units of CPU time.

### Metrics

| Metric | Formula |
|---|---|
| Turnaround time | completion - arrival |
| Waiting time | turnaround - burst |
| Response time | first start - arrival |

### Tie-breaking rules

- **FCFS / SJF / SRTF:** ties on the main key (arrival, burst, or remaining time) are broken by earlier arrival, then by row order in the input table.
- **SRTF:** the running process is preempted only if a newly ready process has a *strictly* shorter remaining time.
- **Round Robin:** processes that arrive exactly at a quantum boundary join the queue *before* the preempted process is re-queued. RR slices are never merged, so quantum boundaries stay visible in the chart.
- If no process is ready, the CPU idles until the next arrival.

## Correctness and testing

The scheduling engine sits between `//ENGINE-START` and `//ENGINE-END` markers inside `index.html`. `test.js` extracts that code and tests it three ways:

1. **Hand-calculated cases:** 22 workload/algorithm configurations whose expected timelines and averages were worked out by hand.
2. **Randomised property tests:** 3000 random workloads, each run through all four algorithms, checked against the properties below. It also asserts that SRTF's average turnaround never exceeds that of SJF or FCFS.
3. **Validation tests:** empty table, duplicate or empty IDs, negative, fractional, blank or non-numeric values, and bad quanta.

Run the tests (requires [Node.js](https://nodejs.org)):

```bash
node test.js index.html
```

Expected output ends with `ALL PASSED`.

### Property checks (also shown in the UI)

- Every process receives exactly its CPU burst
- No process runs before it arrives
- No overlap on the single CPU, and the timeline is contiguous from time 0
- Waiting and response times are nonnegative
- The CPU is never idle while a process is ready

## Project structure

```text
.
├── index.html   # the whole app: UI, styles, and scheduling engine
├── test.js      # Node test suite
└── README.md
```
