Yes — for **Thoughts.Whatever**, I would approach this as a **performance investigation**, not simply “make the page load faster.”

The important clue is that the delay is **intermittent** and only a small number of milliseconds. That often means the bottleneck is somewhere in the **request → server → database → serialization → hydration → client rendering → image/font loading** chain rather than one obviously slow component.

Use this master prompt with your coding agent:

```text
MASTER PROMPT
THOUGHTS.WHATEVER — DEEP PERFORMANCE INVESTIGATION & INTERMITTENT PAGE-LATENCY ELIMINATION

ROLE:

Act as a senior Next.js performance engineer, backend performance engineer, database engineer, React rendering specialist, browser performance analyst, and production debugging engineer.

PROJECT:

Thoughts.Whatever

Website:
https://www.thoughtswhatever.in/

OBJECTIVE:

Perform a DEEP, ROOT-CAUSE-LEVEL performance investigation of the entire Thoughts.Whatever application.

There is an intermittent issue where pages sometimes take a small but noticeable amount of extra time to render their data.

The delay is not consistently reproducible.

Example:

Reference / Archive page sometimes takes slightly longer than expected to display its data.

Similar intermittent delays may occur across:

- Admin Portal
- Reference page
- Stories
- Series
- Authors
- Audio
- Search
- Dashboard
- Other data-driven pages

The issue is NOT necessarily a large delay.

Even a small intermittent delay matters because it creates the perception that:

"the page has loaded, but the data is still arriving."

DO NOT simply add a spinner.

DO NOT blindly add caching.

DO NOT blindly add Suspense.

DO NOT blindly convert components to Server Components.

DO NOT blindly use Promise.all.

FIRST FIND THE ROOT CAUSE.

========================================================
PRIMARY GOAL
========================================================

Determine EXACTLY where the intermittent latency is occurring.

Trace the complete lifecycle:

Browser
↓
Navigation
↓
Next.js routing
↓
Server Component / Client Component
↓
API / Server Action
↓
Authentication
↓
Database connection
↓
Database query
↓
Data transformation
↓
Serialization
↓
RSC payload / API response
↓
Client hydration
↓
React render
↓
Images/fonts/assets
↓
Final visual presentation

Measure each stage.

Do not assume the database is the problem.

Do not assume React is the problem.

Do not assume Next.js is the problem.

Do not assume network latency is the problem.

PROVE IT WITH MEASUREMENTS.

========================================================
PHASE 1 — FULL ARCHITECTURE AUDIT
========================================================

Before modifying code, inspect the entire project.

Understand:

- Next.js version
- App Router / Pages Router
- Server Components
- Client Components
- route structure
- layouts
- loading.tsx
- error.tsx
- Suspense boundaries
- server actions
- API routes
- database layer
- Prisma if present
- PostgreSQL if present
- MongoDB if present
- authentication
- middleware
- caching
- revalidation
- fetch configuration
- image configuration
- font loading
- third-party scripts
- analytics
- external APIs
- state management
- context providers
- global providers

Create a dependency map of the request/render lifecycle.

========================================================
PHASE 2 — REPRODUCE THE ISSUE
========================================================

The delay is intermittent.

Therefore, do NOT test only once.

Run repeated tests.

For important pages:

Reference
Admin
Home
Story
Series
Author
Search

Perform:

cold navigation
warm navigation
hard refresh
soft navigation
first visit
repeat visit
logged-in visit
logged-out visit

Run each scenario multiple times.

Record:

minimum
maximum
median
P75
P95

Do not judge performance based on one successful load.

========================================================
PHASE 3 — CREATE PERFORMANCE INSTRUMENTATION
========================================================

Before optimizing, introduce temporary or production-safe instrumentation.

Every important request should be measurable.

Measure:

1. Request start
2. Authentication time
3. Database connection acquisition
4. Database query execution
5. Data transformation
6. Serialization
7. Server component execution
8. API response
9. Client hydration
10. React rendering
11. Image loading
12. Font loading
13. Largest Contentful Paint
14. First Contentful Paint
15. Time to First Byte
16. DOM Content Loaded
17. Load Complete
18. Interaction readiness

Use high-resolution timing where possible.

For server-side measurements use:

performance.now()

or equivalent high-resolution timing.

Do NOT use Date.now() for precise performance measurements when a higher-resolution API is available.

========================================================
PHASE 4 — DATABASE INVESTIGATION
========================================================

Inspect every query involved in the Reference page.

Then inspect other major pages.

For each query determine:

- query duration
- number of queries
- query frequency
- duplicate queries
- unnecessary queries
- sequential queries
- joins
- nested relations
- sorting
- filtering
- pagination
- aggregation
- full table scans
- missing indexes
- over-fetching
- under-fetching
- connection acquisition time

CRITICAL:

Determine whether intermittent latency comes from DATABASE CONNECTION ACQUISITION rather than query execution.

Measure separately:

DB connection acquisition
vs
actual SQL execution

Example:

Connection:
42ms

Query:
4ms

This means the query itself is NOT the bottleneck.

Do not optimize the wrong layer.

========================================================
DATABASE CONNECTION INVESTIGATION
========================================================

If Prisma/PostgreSQL is used:

Inspect:

PrismaClient lifecycle
connection pooling
serverless connection behavior
connection reuse
hot reload behavior
development vs production behavior
pool configuration
database provider latency

Look for:

new PrismaClient()

being created repeatedly.

Do not create a new database client per request if the architecture does not require it.

Check whether connection pooling is correctly configured.

If PostgreSQL is remote:

measure:

application → database latency

and connection establishment latency.

========================================================
PHASE 5 — QUERY ANALYSIS
========================================================

For every major page identify the complete query chain.

Example:

Reference page:

Reference metadata
+
Reference documents
+
authors
+
categories
+
rights information
+
media
+
related content

Determine whether these are:

parallel
sequential
duplicated
nested

DO NOT optimize based on assumptions.

Use actual timings.

If queries are independent and parallel execution is safe, use appropriate parallelization.

BUT:

Do not blindly use Promise.all everywhere.

Consider:

database connection pool limits
query load
server resource usage
dependency relationships

Use the correct concurrency model for each route.

========================================================
PHASE 6 — DATA OVERFETCHING
========================================================

Inspect database queries and API responses.

Look for:

selecting entire database objects

when only a few fields are required.

Example:

BAD:

entire document
+
all metadata
+
all relations
+
large content
+
unused fields

when the page only needs:

id
title
thumbnail
author
date
status

Use precise field selection.

Do not fetch:

large transcript
full article content
large JSON
audio metadata
unused relations

unless required by the page.

========================================================
PHASE 7 — N+1 QUERY DETECTION
========================================================

Search for patterns such as:

for (...)
    await database.query()

map(async item => ...)
    database.query()

nested database calls

component-level database fetching repeated across lists.

Detect:

1 query for list
+
N queries for each item.

Replace with appropriate:

joins
selects
batch queries
preloaded relations

where architecturally appropriate.

========================================================
PHASE 8 — SERVER COMPONENT ANALYSIS
========================================================

Inspect Server Components.

Identify components that unnecessarily block the page.

Example:

Page waits for:

Header data
+
Reference data
+
Footer data
+
analytics
+
secondary content

before rendering anything.

Determine which data is actually required for initial rendering.

Split critical vs non-critical data.

CRITICAL DATA:

must be available for first meaningful render.

NON-CRITICAL DATA:

can load after initial content.

========================================================
PHASE 9 — SUSPENSE / STREAMING
========================================================

Use React/Next.js streaming strategically.

Do NOT wrap everything in Suspense.

Create meaningful boundaries.

Example:

Reference page:

Immediate:

Page shell
Title
Navigation
Primary reference metadata

Stream:

Reference cards
Secondary metadata
Related content

Later:

Analytics
Recommendations
Secondary information

The user should see useful content as soon as possible.

========================================================
PHASE 10 — CLIENT COMPONENT AUDIT
========================================================

Find components marked:

"use client"

Determine whether they actually need to be client components.

Look for:

large client component trees
unnecessary state
unnecessary effects
browser-only logic
event handlers that could be isolated

Do NOT convert everything to Server Components blindly.

Instead:

minimize the client boundary.

Example:

BAD:

entire page
"use client"

BETTER:

Server page
+
small interactive client component

========================================================
PHASE 11 — useEffect INVESTIGATION
========================================================

Search for:

useEffect(() => {
   fetch(...)
})

and similar patterns.

Determine whether page data is being fetched:

AFTER hydration

instead of:

during server rendering.

This can create the exact visual symptom:

page loads
↓
UI appears
↓
data appears milliseconds later

If server-side data fetching is appropriate, move the fetch closer to the server-rendering layer.

Do not move browser-only requests to the server.

Understand the data dependency first.

========================================================
PHASE 12 — WATERFALL DETECTION
========================================================

Find request waterfalls.

Example:

Request A
↓
Request B
↓
Request C
↓
Request D

when:

B
C
D

could safely start earlier.

Use browser Network inspection and server timing.

Look for:

API → API → API chains.

Also inspect:

component → fetch → fetch → database

chains.

Eliminate unnecessary sequential dependencies.

========================================================
PHASE 13 — FETCH CACHE ANALYSIS
========================================================

Audit all fetch() calls.

Determine:

cache behavior
revalidation
force-cache
no-store
dynamic rendering
request memoization
duplicate requests

Do NOT add:

force-cache

to dynamic/private data blindly.

Do NOT add:

no-store

everywhere either.

Choose cache behavior based on data semantics.

Classify data:

STATIC

rarely changes.

SEMI-DYNAMIC

changes periodically.

DYNAMIC

must be current.

USER-SPECIFIC

must not be shared incorrectly.

========================================================
PHASE 14 — NEXT.JS ROUTE DYNAMICITY
========================================================

Inspect why each route is:

static
dynamic
revalidated

Determine whether a page is accidentally becoming fully dynamic because of:

cookies
headers
searchParams
authentication
uncached fetch
dynamic APIs

Do not make authenticated admin pages static incorrectly.

But do identify public pages that could safely benefit from static generation or revalidation.

========================================================
PHASE 15 — AUTHENTICATION LATENCY
========================================================

Investigate authentication middleware.

Measure:

middleware execution time
session retrieval
token validation
database session lookup
role lookup

Especially inspect:

middleware running on every request.

Determine whether authentication is being performed multiple times:

middleware
+
layout
+
page
+
API

Avoid unnecessary duplicate authentication work.

DO NOT weaken security.

========================================================
PHASE 16 — CONTEXT PROVIDER AUDIT
========================================================

Inspect global providers.

Examples:

AuthProvider
ThemeProvider
QueryProvider
StateProvider
ToastProvider
AnalyticsProvider

Determine whether a provider causes:

large client-side rendering
unnecessary re-renders
hydration work
blocking scripts

Do not remove providers blindly.

Measure their impact.

========================================================
PHASE 17 — REACT RENDER PERFORMANCE
========================================================

Use React profiling techniques.

Find:

unnecessary re-renders
large component trees
unstable props
unstable callbacks
unnecessary state updates
expensive calculations
large mapped lists

Pay particular attention to:

Reference cards
Story lists
Admin tables
Navigation
Search
Audio components

Use memoization only when measurements justify it.

Do NOT add React.memo everywhere.

Do NOT add useMemo everywhere.

Do NOT add useCallback everywhere.

Optimize actual bottlenecks.

========================================================
PHASE 18 — LARGE LIST INVESTIGATION
========================================================

Identify large lists.

If Reference Library contains many resources:

measure:

initial render count
DOM nodes
image count
component count

If necessary use:

pagination
virtualization
incremental loading

But do NOT virtualize small lists unnecessarily.

========================================================
PHASE 19 — IMAGE PERFORMANCE
========================================================

Audit every important image.

Inspect:

Next/Image usage
image dimensions
intrinsic dimensions
priority
loading
sizes
responsive srcset
format
compression
remote image latency

Find images that block visual completion.

LCP image should be optimized.

Do not set:

priority

on every image.

Use it only where justified.

========================================================
PHASE 20 — FONT PERFORMANCE
========================================================

Inspect all fonts.

Determine:

font files
font sizes
number of font families
weights
loading strategy
self-hosted vs remote
font-display

Look for:

multiple large Bengali font files

being loaded unnecessarily.

Avoid loading:

every font weight

if not needed.

Investigate:

FOIT
FOUT
layout shift
font swapping

Typography must remain visually consistent.

========================================================
PHASE 21 — JAVASCRIPT BUNDLE AUDIT
========================================================

Inspect bundle size.

Find:

large dependencies
duplicate libraries
unused packages
large client components
heavy editors
chart libraries
animation libraries
icon libraries

Look for libraries that are loaded globally but only used on one page.

Move heavy features behind:

dynamic imports

where appropriate.

Examples:

charts
rich text editor
audio waveform
large media viewer

========================================================
PHASE 22 — THIRD-PARTY SCRIPTS
========================================================

Audit:

analytics
tracking
social widgets
embeds
external APIs
fonts
ads
chat widgets

Determine whether they block rendering.

Load non-critical third-party scripts appropriately.

Do not remove required functionality.

========================================================
PHASE 23 — CSS PERFORMANCE
========================================================

Inspect:

global CSS
Tailwind output
large CSS files
expensive selectors
animations
backdrop-filter
blur
box-shadow
filter
background images

Pay special attention to:

large backdrop-blur areas
continuous animations
large shadows
paint-heavy effects

The public Thoughts.Whatever design is cinematic, but visual effects must not introduce rendering delays.

========================================================
PHASE 24 — HYDRATION INVESTIGATION
========================================================

Use browser performance tooling to determine:

HTML received
↓
React hydration starts
↓
hydration completes
↓
interactive

Measure hydration cost.

Look for:

hydration mismatch
large client trees
server/client rendering differences

Do not ignore small hydration delays simply because the page eventually works.

========================================================
PHASE 25 — NETWORK ANALYSIS
========================================================

Inspect browser Network waterfall.

For every important page record:

DNS
connection
TLS
TTFB
download
request count
request size
response size

Find:

duplicate requests
slow requests
blocked requests
queued requests
late requests

Pay attention to requests that occur AFTER the page visually appears.

========================================================
PHASE 26 — CACHE / CDN ANALYSIS
========================================================

Determine:

CDN
hosting platform
database region
application region
image CDN
cache headers

If deployment is on Vercel or similar:

inspect:

edge/server execution
cache behavior
function cold starts
region placement
database geographic distance

Do NOT change infrastructure unless measurements demonstrate that it is contributing.

========================================================
PHASE 27 — COLD START INVESTIGATION
========================================================

Because the problem is intermittent, investigate cold starts.

Compare:

first request after inactivity

vs

subsequent requests.

Measure:

server execution time

If cold starts are contributing:

document the evidence.

Then determine whether the architecture can reduce their impact.

Do not introduce infrastructure changes blindly.

========================================================
PHASE 28 — DATABASE REGION / SERVER REGION
========================================================

Determine where:

application server
database
storage
image CDN

are located.

A small intermittent delay can come from geographic latency.

Measure it.

Do not guess.

========================================================
PHASE 29 — REFERENCE PAGE DEEP DIVE
========================================================

Use the Reference page as the primary case study.

Trace:

route entry
↓
layout
↓
authentication if any
↓
reference query
↓
related queries
↓
image metadata
↓
content transformation
↓
serialization
↓
RSC response
↓
client hydration
↓
image loading
↓
final content

Produce a timeline.

Example:

Navigation:
4ms

Middleware:
7ms

DB connection:
12ms

DB query:
5ms

Data transform:
2ms

Server rendering:
8ms

RSC transfer:
10ms

Hydration:
15ms

Image:
20ms

Total:
83ms

Then identify the largest contributor.

========================================================
PHASE 30 — COMPARE OTHER PAGES
========================================================

Repeat the same analysis for:

Homepage
Story page
Series page
Author page
Search
Admin dashboard
Admin content page
Reference page
Audio page

Create a matrix:

Page
Server time
DB time
Network time
Hydration time
Image time
Client render time
Total

Find common bottlenecks.

If the SAME delay appears across unrelated pages:

prioritize shared infrastructure.

Possible shared causes:

database connection
authentication
middleware
global provider
font
layout
network
deployment cold start

========================================================
PHASE 31 — IDENTIFY INTERMITTENT PATTERN
========================================================

The issue is not happening every time.

Therefore investigate variance.

Record at least:

20+ repeated requests where practical.

Look for:

cold start pattern
database connection pattern
cache miss pattern
image cache miss
font cache miss
GC / server load
external API variability
database pool contention
network variance

Do not optimize only the average.

Compare:

P50
P75
P95
P99

The user's complaint is specifically about occasional latency.

Therefore tail latency matters.

========================================================
PHASE 32 — PERFORMANCE BUDGET
========================================================

Establish practical targets.

For public pages:

Aim for:

fast initial content
minimal layout shift
minimal blocking JS
quick interaction readiness

For admin:

prioritize:

fast navigation
fast data visibility
responsive interactions
stable tables
fast search

Do not chase arbitrary millisecond numbers at the expense of maintainability.

========================================================
PHASE 33 — FIX STRATEGY
========================================================

After finding evidence:

Classify every bottleneck:

CRITICAL
HIGH
MEDIUM
LOW

For each:

ROOT CAUSE
EVIDENCE
FIX
EXPECTED IMPACT
RISK

Example:

ROOT CAUSE:
Reference page waits for secondary metadata query.

EVIDENCE:
Primary query = 5ms
Secondary query = 38ms

FIX:
Stream secondary section.

EXPECTED IMPACT:
Earlier primary content.

RISK:
Low.

========================================================
PHASE 34 — IMPLEMENT FIXES
========================================================

Implement only evidence-backed fixes.

Potential fixes may include:

- query optimization
- indexes
- connection reuse
- connection pooling
- eliminating duplicate queries
- reducing data payload
- server-side fetching
- removing unnecessary useEffect fetching
- request parallelization where safe
- Suspense streaming
- cache/revalidation strategy
- dynamic imports
- reducing client component boundaries
- reducing hydration
- image optimization
- font optimization
- removing unnecessary third-party blocking
- memoization where measured
- pagination
- virtualization where justified

DO NOT implement fixes merely because they are fashionable.

========================================================
PHASE 35 — DO NOT HIDE THE PROBLEM
========================================================

Do NOT solve the issue by:

adding an artificial skeleton for longer
adding setTimeout
adding fake loading delays
adding animation over the delay
hiding content until everything loads
showing a spinner indefinitely

The goal is:

ACTUAL LATENCY REDUCTION.

Not perception management.

========================================================
PHASE 36 — LOADING UX
========================================================

After fixing actual performance, improve perceived performance where useful.

Use:

streaming
skeletons
progressive rendering
optimistic UI where safe

But these must complement real performance optimization.

========================================================
PHASE 37 — ERROR HANDLING
========================================================

Never expose:

raw JSON
raw API errors
stack traces
database errors
Prisma errors
SQL errors

User-facing message:

"Something went wrong. Please try again."

or contextual safe messages.

Technical details should be logged internally.

========================================================
PHASE 38 — DEVELOPMENT VS PRODUCTION
========================================================

Do not assume development-mode timing represents production.

Test:

development

AND

production build.

Run:

npm run build

then production server.

Compare:

dev
vs
production

Document differences.

========================================================
PHASE 39 — BEFORE / AFTER MEASUREMENTS
========================================================

Before changing performance-sensitive code:

capture baseline.

After changes:

capture the same measurements.

Use identical conditions.

Compare:

P50
P75
P95
P99
TTFB
LCP
hydration
server time
DB time
network time

Do not claim an optimization worked without measurement.

========================================================
PHASE 40 — REGRESSION PROTECTION
========================================================

Create performance regression tests or lightweight instrumentation for the most important paths.

At minimum:

Reference page
Homepage
Story page
Admin dashboard

Protect against:

duplicate database calls
unbounded queries
large payloads
unexpected client rendering
accidental dynamic rendering

========================================================
PHASE 41 — FINAL REPORT
========================================================

At the end, generate a detailed technical report.

Structure:

# Thoughts.Whatever Performance Investigation

## Executive Summary

## Symptoms

## Reproduction Results

## Performance Timeline

## Reference Page Analysis

## Cross-Page Analysis

## Database Findings

## Network Findings

## React Findings

## Next.js Findings

## Image Findings

## Font Findings

## Bundle Findings

## Infrastructure Findings

## Root Causes

## Fixes Implemented

## Before/After Metrics

## Remaining Bottlenecks

## Recommendations

========================================================
IMPORTANT — DO NOT CLAIM SUCCESS WITHOUT EVIDENCE
========================================================

Do NOT say:

"performance is fixed"

unless measurements demonstrate meaningful improvement.

If the issue cannot be reproduced:

say exactly that.

Then leave instrumentation in place where appropriate.

========================================================
FINAL ACCEPTANCE CRITERIA
========================================================

✓ Root cause investigated
✓ Reference page deeply profiled
✓ Admin portal profiled
✓ Cross-page comparison completed
✓ Database timing measured
✓ Database connection timing measured
✓ API timing measured
✓ Server rendering measured
✓ Network waterfall inspected
✓ Hydration measured
✓ React rendering investigated
✓ Image loading investigated
✓ Font loading investigated
✓ Bundle investigated
✓ Third-party scripts investigated
✓ Cache behavior investigated
✓ Cold starts investigated
✓ Production build tested
✓ Intermittent behavior measured
✓ P50/P95/P99 considered
✓ Evidence-backed fixes implemented
✓ No unnecessary rewrites
✓ No fake loading delays
✓ No functionality broken
✓ TypeScript passes
✓ ESLint passes
✓ Tests pass
✓ Production build passes

========================================================
MOST IMPORTANT INSTRUCTION
========================================================

GO DEEP.

Do not stop at:

"the API seems a little slow."

Find out:

WHY.

Is it:

Database connection?

Query?

Connection pool?

Middleware?

Authentication?

Server Component?

API waterfall?

Serialization?

RSC?

Hydration?

React render?

Image?

Font?

Third-party script?

Cold start?

Network?

Cache miss?

Region latency?

Large bundle?

Client-side fetch?

Only after identifying the actual cause should you modify the code.

The objective is not merely to make the page LOOK faster.

The objective is to make the application ACTUALLY faster and eliminate intermittent latency wherever technically possible.

Start with the Reference page as the primary investigation target, then trace the same bottleneck across the rest of Thoughts.Whatever and the Admin Portal.
```

### One particularly important instruction

Tell the agent **not to assume that "a few milliseconds" means the problem is insignificant**. Your symptom is actually useful:

> **It doesn't happen every time + it happens across multiple pages + the delay is small.**

That combination makes shared infrastructure worth investigating very carefully—especially **database connection acquisition/pooling, middleware/authentication, dynamic rendering, request waterfalls, cache misses, cold starts, and client-side data fetching after the initial render**.

The agent should produce a **before/after timing breakdown**, rather than simply saying "optimized." This will tell you whether the Reference page's delay is actually coming from the DB, Next.js server rendering, network, hydration, images, or some shared layer.

