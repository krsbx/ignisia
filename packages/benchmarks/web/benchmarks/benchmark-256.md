# Autocannon Benchmarks

**Runtime**: bun
**Date**: February 12, 2026 05:26:31 PM +07:00
**CPU**: M4
**RAM**: 16384.00 MB
**Connections**: 256
**Duration**: 30 seconds
**Pipelining**: 10

## Results

| Framework | Total Requests | RPS (req/sec) | Failed Requests | P50 Latency (ms) | P75 Latency (ms) | P90 Latency (ms) | P99 Latency (ms) | Avg Latency (ms) | Min Latency (ms) | Max Latency (ms) |
| --------- | -------------- | ------------- | --------------- | ---------------- | ---------------- | ---------------- | ---------------- | ---------------- | ---------------- | ---------------- |
| Ignisia   | 1571059.00     | 52351.18      | 0.00            | 94 ms            | 99 ms            | 108 ms           | 124 ms           | 97.12 ms         | 25 ms            | 238 ms           |
| Hono      | 1522859.00     | 50745.05      | 0.00            | 98 ms            | 104 ms           | 111 ms           | 133 ms           | 100.11 ms        | 29 ms            | 234 ms           |
| Bun       | 1368740.00     | 45457.99      | 0.00            | 100 ms           | 113 ms           | 122 ms           | 244 ms           | 97.38 ms         | 8 ms             | 1094 ms          |
| Elysia    | 1325485.00     | 44168.11      | 0.00            | 235 ms           | 240 ms           | 253 ms           | 290 ms           | 230.2 ms         | 69 ms            | 387 ms           |
