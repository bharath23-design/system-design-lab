# Spatial Database: PostgreSQL + PostGIS

## What is a Spatial Database?

A **spatial database** stores and queries data with a geographic or geometric component. It combines relational database features with spatial data types and functions.

```
PostgreSQL          +          PostGIS
    │                              │
    ├── Tables                     ├── Latitude & Longitude
    ├── SQL                        ├── Points
    ├── Indexes                    ├── Lines
    └── Transactions               ├── Polygons
                                   ├── Distance calculations
                                   ├── Route queries
                                   └── Spatial indexing
                    =
             Spatial Database
```

---

## PostgreSQL

### Tables

Standard relational tables hold your data. With PostGIS enabled, columns can use spatial types like `GEOMETRY` or `GEOGRAPHY`.

```sql
CREATE TABLE locations (
    id        SERIAL PRIMARY KEY,
    name      TEXT,
    geom      GEOMETRY(Point, 4326)  -- PostGIS spatial column
);
```

### SQL

Standard SQL with PostGIS spatial functions mixed in.

```sql
-- Insert a point (longitude, latitude)
INSERT INTO locations (name, geom)
VALUES ('Eiffel Tower', ST_SetSRID(ST_MakePoint(2.2945, 48.8584), 4326));

-- Select with a spatial filter
SELECT name
FROM locations
WHERE ST_DWithin(geom::geography, ST_MakePoint(2.2945, 48.8584)::geography, 1000);
```

### Indexes

B-tree indexes work on standard columns. For spatial columns use a **GiST index**.

```sql
-- Standard B-tree (for id, name, etc.)
CREATE INDEX idx_locations_name ON locations(name);

-- GiST index for spatial queries
CREATE INDEX idx_locations_geom ON locations USING GIST(geom);
```

### Transactions

Full ACID transactions — spatial writes are transactional just like any other data.

```sql
BEGIN;
  INSERT INTO locations (name, geom) VALUES ('Point A', ST_MakePoint(1.0, 1.0));
  INSERT INTO locations (name, geom) VALUES ('Point B', ST_MakePoint(2.0, 2.0));
COMMIT;
```

---

## PostGIS

PostGIS is a PostgreSQL extension that adds spatial types, functions, and indexing.

```sql
CREATE EXTENSION postgis;
```

### Latitude & Longitude

- **Longitude** = X axis (−180 to +180)
- **Latitude** = Y axis (−90 to +90)
- **SRID 4326** = WGS84, the standard GPS coordinate system

```sql
-- ST_MakePoint(longitude, latitude)
SELECT ST_MakePoint(-73.9857, 40.7484);  -- Times Square, NYC
```

### Points

A single location in space.

```sql
-- Create a point geometry
SELECT ST_GeomFromText('POINT(-73.9857 40.7484)', 4326);

-- Or using ST_MakePoint
SELECT ST_SetSRID(ST_MakePoint(-73.9857, 40.7484), 4326);
```

### Lines

A sequence of points — roads, paths, rivers.

```sql
SELECT ST_GeomFromText(
    'LINESTRING(0 0, 1 1, 2 0)',
    4326
);

-- Length of a line (in meters when using geography)
SELECT ST_Length(
    ST_GeomFromText('LINESTRING(-73.98 40.74, -74.00 40.72)', 4326)::geography
);
```

### Polygons

A closed shape — city boundaries, zones, building footprints.

```sql
SELECT ST_GeomFromText(
    'POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))',
    4326
);

-- Area of a polygon (in square meters)
SELECT ST_Area(
    ST_GeomFromText('POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))', 4326)::geography
);
```

### Distance Calculations

```sql
-- Distance between two points in meters (geography = curved earth)
SELECT ST_Distance(
    ST_MakePoint(-73.9857, 40.7484)::geography,   -- Times Square
    ST_MakePoint(-87.6298, 41.8781)::geography    -- Chicago
);

-- Find all locations within 5km of a point
SELECT name
FROM locations
WHERE ST_DWithin(
    geom::geography,
    ST_MakePoint(-73.9857, 40.7484)::geography,
    5000  -- meters
);
```

| Function | Purpose |
|---|---|
| `ST_Distance` | Exact distance between two geometries |
| `ST_DWithin` | Filter: within a given distance (uses index) |
| `ST_ClosestPoint` | Nearest point on a geometry to another |

### Route Queries

PostGIS alone gives spatial primitives; routing requires **pgRouting** (a separate extension) or application-level logic.

```sql
-- With pgRouting: find shortest path between two nodes
SELECT * FROM pgr_dijkstra(
    'SELECT id, source, target, cost FROM roads',
    source_node := 1,
    target_node := 50,
    directed := false
);

-- Without pgRouting: order nearby points by distance (simple proximity)
SELECT name, ST_Distance(geom::geography, ST_MakePoint(-73.98, 40.74)::geography) AS dist
FROM locations
ORDER BY geom::geography <-> ST_MakePoint(-73.98, 40.74)::geography
LIMIT 10;
```

### Spatial Indexing

GiST (Generalized Search Tree) indexes accelerate spatial queries by indexing bounding boxes.

```sql
-- Create GiST index
CREATE INDEX idx_geom ON locations USING GIST(geom);

-- BRIN index: good for large tables with spatially ordered data
CREATE INDEX idx_geom_brin ON locations USING BRIN(geom);
```

**How it works:**
1. Each geometry's bounding box is indexed.
2. A spatial query first filters by bounding box (fast, index-assisted).
3. Then applies the exact geometric check on the remaining candidates.

```
Query: "find all points within 1km of (x, y)"
  │
  ├─ 1. GiST index filters bounding boxes → ~10 candidates
  └─ 2. ST_DWithin checks exact distance → 3 results returned
```

---

## geometry vs geography

| | `GEOMETRY` | `GEOGRAPHY` |
|---|---|---|
| Coordinate system | Flat (Cartesian) | Curved earth (WGS84) |
| Distance units | Degrees | Meters |
| Accuracy | Fine for small areas | Accurate globally |
| Performance | Faster | Slightly slower |

**Rule of thumb:** use `GEOGRAPHY` when accuracy matters over long distances; use `GEOMETRY` for local/regional data or when performance is critical.

---

## Quick Reference

```sql
-- Enable PostGIS
CREATE EXTENSION postgis;

-- Create table with spatial column
CREATE TABLE places (
    id    SERIAL PRIMARY KEY,
    name  TEXT,
    geom  GEOMETRY(Point, 4326)
);

-- Insert
INSERT INTO places (name, geom)
VALUES ('Home', ST_SetSRID(ST_MakePoint(lng, lat), 4326));

-- Spatial index
CREATE INDEX ON places USING GIST(geom);

-- Nearest neighbours (KNN)
SELECT name
FROM places
ORDER BY geom <-> ST_MakePoint(lng, lat)::geometry
LIMIT 5;

-- Within radius
SELECT name
FROM places
WHERE ST_DWithin(geom::geography, ST_MakePoint(lng, lat)::geography, radius_m);
```
