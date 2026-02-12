# Autocannon Benchmarks

**Runtime**: bun
**Date**: February 12, 2026 05:24:19 PM +07:00
**CPU**: M4
**RAM**: 16384.00 MB
**Connections**: 64
**Duration**: 30 seconds
**Pipelining**: 10

## Results

| Framework | Total Requests | RPS (req/sec) | Failed Requests | P50 Latency (ms) | P75 Latency (ms) | P90 Latency (ms) | P99 Latency (ms) | Avg Latency (ms) | Min Latency (ms) | Max Latency (ms) |
| --------- | -------------- | ------------- | --------------- | ---------------- | ---------------- | ---------------- | ---------------- | ---------------- | ---------------- | ---------------- |
| Ignisia   | 1725149.00     | 57466.66      | 0.00            | 10 ms            | 11 ms            | 11 ms            | 18 ms            | 10.56 ms         | 5 ms             | 66 ms            |
| Hono      | 1774362.00     | 59125.69      | 0.00            | 41 ms            | 44 ms            | 47 ms            | 59 ms            | 42.74 ms         | 33 ms            | 97 ms            |
| Bun       | 1631924.00     | 54379.34      | 0.00            | 45 ms            | 48 ms            | 51 ms            | 62 ms            | 46.51 ms         | 32 ms            | 99 ms            |
| Elysia    | 1676767.00     | 55873.61      | 0.00            | 133 ms           | 145 ms           | 153 ms           | 170 ms           | 136.49 ms        | 65 ms            | 259 ms           |
