# Caching Strategies — High-Level Design Concepts

## Overview

Caching is a technique to store copies of data in a faster storage layer (cache) so that future requests for that data can be served with lower latency and reduced load on the primary data store (e.g., database). In system design interviews and production systems, choosing the right caching strategy is critical for consistency, performance, and complexity.

---

## 1. Cache-Aside (Lazy Loading)

### Concept

- The **application** is responsible for reading from and writing to both the cache and the database.
- **Read path**: Check cache first → on **miss**, load from DB, then **populate cache** and return.
- **Write path**: Update **database only**; optionally **invalidate** or update the cache entry so the next read loads fresh data.

### When to Use

- Read-heavy workloads.
- Data that can tolerate eventual consistency or where invalidation on write is acceptable.
- You want to avoid loading rarely used data into the cache (reactive, on-demand loading).

### Trade-offs

| Pros | Cons |
|------|------|
| Only caches data that is actually read | Cache miss penalty on first access |
| Cache and DB can be independent | Risk of stale data if invalidation is wrong |
| Simple mental model | Application logic is more complex (dual read/write) |

---

## 2. Read-Through

### Concept

- The application **only talks to the cache**. The cache layer (or a loader beside it) is responsible for loading from the database on a miss.
- **Read path**: Request goes to cache → on miss, cache (or cache library) **loads from DB**, stores in cache, and returns.
- **Write path**: Typically database is updated and cache is invalidated or updated via a separate mechanism.

### When to Use

- When you want application code to treat “cache” as the single source for reads.
- Good fit with a cache that supports a **loader** or **database adapter** (e.g., some client libraries or proxies).

### Trade-offs

| Pros | Cons |
|------|------|
| Simpler application code (read from one place) | Cache layer must support loading from DB |
| Centralized miss logic | Same staleness/invalidation concerns as cache-aside |

---

## 3. Write-Through

### Concept

- Every write goes **to the cache and to the database**; the write is not considered complete until both succeed.
- **Read path**: Read from cache (cache is always updated on write).
- **Write path**: Write to **cache + DB** in the same logical operation (often cache then DB, or in parallel).

### When to Use

- When you need **strong consistency** between cache and database.
- When you write and then frequently re-read the same data.

### Trade-offs

| Pros | Cons |
|------|------|
| Cache and DB stay in sync | Higher write latency (two writes) |
| No stale reads for written keys | Write amplification |

---

## 4. Write-Behind (Write-Back)

### Concept

- Write goes **to the cache only**; the application gets an immediate success. Writes to the database happen **asynchronously** in the background (batched or delayed).
- **Read path**: Read from cache (recent writes are in cache).
- **Write path**: Update cache only; queue or background job flushes to DB.

### When to Use

- Write-heavy workloads where you can tolerate **eventual consistency** and some risk of data loss if cache fails before flush.
- When write latency must be minimized.

### Trade-offs

| Pros | Cons |
|------|------|
| Very low write latency | Risk of data loss on cache failure |
| Can batch/merge DB writes | Complex failure and replay logic |
| Good for write bursts | Eventual consistency only |

---

## 5. Write-Around

### Concept

- Writes go **only to the database**, not to the cache. Cache is updated only on a subsequent **read** (e.g., cache-aside or read-through on that read).
- **Read path**: Same as cache-aside or read-through (miss → load from DB → fill cache).
- **Write path**: Write to DB only; optionally invalidate cache for that key.

### When to Use

- When most writes are **not** followed by immediate reads (e.g., logs, one-off writes). Avoids filling the cache with data that is rarely read.

### Trade-offs

| Pros | Cons |
|------|------|
| Cache is not polluted by write-only data | First read after write is a miss (higher latency) |
| Simpler write path than write-through | Stale cache if invalidation is not done |

---

## 6. Cache Eviction Policies

When the cache is full, a policy decides **which entry to remove**.

| Policy | Description | Use Case |
|--------|-------------|----------|
| **LRU** (Least Recently Used) | Evict the entry not used for the longest time | General-purpose; good for temporal locality |
| **LFU** (Least Frequently Used) | Evict the entry with the fewest accesses | Stable hot set; can be unfair to newly popular items |
| **FIFO** | Evict the oldest inserted entry | Simple; no access tracking |
| **TTL** (Time To Live) | Entries expire after a fixed time | Data that becomes stale after a known period |
| **Random** | Evict a random entry | Simple; avoids worst-case patterns |

Often **TTL is combined** with LRU/LFU (evict by TTL first, then by LRU/LFU when full).

---

## 7. Cache Invalidation

Invalidation decides **when cached data is no longer valid**.

- **Invalidate on write**: On DB update/delete, remove or mark the cache entry invalid (used in cache-aside, write-around).
- **Time-based (TTL)**: Entries expire after a duration; no explicit invalidation.
- **Event-based**: Invalidate when you receive an event (e.g., message queue) that indicates data changed.
- **Version/tag-based**: Store a version with the key; invalidate all keys with a given version/tag when data changes.

“Invalidation is one of the hard problems” — design invalidation carefully to balance freshness and complexity.

---

## 8. Strategy Selection (Quick Reference)

| Scenario | Prefer |
|----------|--------|
| Read-heavy, can tolerate stale reads | **Cache-Aside** or **Read-Through** |
| Strong consistency on writes | **Write-Through** |
| Write-heavy, minimize write latency, accept risk | **Write-Behind** |
| Writes rarely read soon after | **Write-Around** |
| General-purpose eviction | **LRU** + **TTL** |

---

## 9. Distributed Caching (Brief)

- **Single-node cache**: One cache instance (e.g., in-process, single Redis). Simple but no redundancy.
- **Distributed cache**: Multiple nodes (e.g., Redis Cluster, Memcached). Consider **partitioning** (e.g., by key hash), **replication** (read replicas), and **failure** (e.g., cache stampede on miss, thundering herd).

---

## 10. Interview Tips

1. **Clarify**: Read vs write heavy? Consistency requirements? Acceptable staleness?
2. **Draw**: Show flow for read and write paths (app → cache → DB).
3. **Mention trade-offs**: Latency vs consistency vs complexity vs risk of data loss.
4. **Eviction and invalidation**: Always mention eviction policy and how you invalidate on writes.
5. **Failure modes**: What if cache is down? What if write-behind never flushes?

---

## Related Python Examples

Each topic has a corresponding Python file in this directory that demonstrates the strategy with in-memory structures:

- `01_cache_aside.py` — Cache-Aside (Lazy Loading)
- `02_read_through.py` — Read-Through
- `03_write_through.py` — Write-Through
- `04_write_behind.py` — Write-Behind
- `05_write_around.py` — Write-Around
- `06_eviction_policies.py` — LRU, LFU, TTL eviction
- `07_cache_invalidation.py` — Invalidation patterns

Run any file with: `python 01_cache_aside.py` (or the relevant file).
