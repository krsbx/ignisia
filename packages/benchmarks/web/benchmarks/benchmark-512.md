# Autocannon Benchmarks

**Runtime**: bun
**Date**: February 12, 2026 05:28:43 PM +07:00
**CPU**: M4
**RAM**: 16384.00 MB
**Connections**: 512
**Duration**: 30 seconds
**Pipelining**: 10

## Results

| Framework | Total Requests | RPS (req/sec) | Failed Requests | P50 Latency (ms) | P75 Latency (ms) | P90 Latency (ms) | P99 Latency (ms) | Avg Latency (ms) | Min Latency (ms) | Max Latency (ms) |
| --------- | -------------- | ------------- | --------------- | ---------------- | ---------------- | ---------------- | ---------------- | ---------------- | ---------------- | ---------------- |
| Ignisia   | 1592899.00     | 53078.94      | 0.00            | 98 ms            | 100 ms           | 105 ms           | 145 ms           | 95.79 ms         | 27 ms            | 259 ms           |
| Hono      | 1517696.00     | 50573.01      | 0.00            | 107 ms           | 200 ms           | 212 ms           | 241 ms           | 140.24 ms        | 13 ms            | 363 ms           |
| Bun       | 1545040.00     | 51467.02      | 0.00            | 100 ms           | 102 ms           | 108 ms           | 133 ms           | 98.79 ms         | 26 ms            | 271 ms           |
| Elysia    | 1610667.00     | 53653.13      | 0.00            | 195 ms           | 200 ms           | 203 ms           | 218 ms           | 189.53 ms        | 62 ms            | 331 ms           |
