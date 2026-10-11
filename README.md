# Hyun Dev Blog

Welcome to my personal development study blog!  
Here, I document my journey learning various technologies, programming concepts, and project experiments.

---

## About

This blog is focused on learning and sharing development knowledge:  
- Notes from personal projects and coding experiments  
- Recording learning progress and technical tips  
- A tech flow (roadmap) that follows prerequisites between technologies and links blog posts to the actual code behind them

Visit the blog: [Hyun Dev Blog](https://hyun7en.github.io)

For English version → [English](README.md)  
한국어 버전 → [한국어](README_KO.md)

---

## Tech Stack

**Site implementation:**

| Area | Choice |
|---|---|
| Framework | Astro 7 (static output) + MDX |
| Content | Content Collections — posts in `src/content/posts/`, techs in `src/content/tech/`, tracks in `src/content/tracks/` |
| Widgets | Astro components with a small inline `<script>` when interactive — no UI framework |
| Styling | Plain CSS (`src/styles/global.css` + component-scoped styles) |
| Code highlighting | Shiki (dracula), at build time |
| Fonts | Pretendard + JetBrains Mono, self-hosted |
| Comments | giscus (GitHub Discussions) |
| SEO | Generated sitemap, RSS (`@astrojs/rss`), canonical links, Open Graph tags, robots.txt |
| Hosting / CI | GitHub Pages; GitHub Actions runs type check, build and an internal link check on PRs and before deploying `main` |

**Topics I study and write about:**
- Java, Spring Boot, JPA, Kafka, and more

---

## Tech Flow

Every technology lists the ones you should know first (`requires`). From that alone the site derives:

- **Roadmap** (`/tech/`) — each domain laid out stage by stage, filterable to technologies that already have posts
- **Tech hubs** (`/tech/<id>/`) — prerequisites ← tech → what comes next, the full learning path, its posts and TIL code
- **Read next** at the end of each post — posts on the technologies that build on this one
- **Learning tracks** (`/tracks/<id>/`) — a curated spine with side branches and pick-one steps, roadmap.sh style

Design notes: [docs/architecture-blog-plan.md](docs/architecture-blog-plan.md) (section 24). Why each technology was chosen: [docs/adr/](docs/adr/README.md).

---

## How to Use

Posts are Markdown or MDX in `src/content/posts/`, with the post's details in the frontmatter at the top:

```md
---
title: "Spring Boot + JPA 시작하기"
date: 2026-02-16
description: One-line summary for cards, search results and link previews.
tech: [spring-boot, jpa]   # tech ids from src/content/tech/*.yaml
kind: study                # study (default, counted in progress) | news (listed under /news/, not counted)
draft: false               # true keeps it off the site
---
```

- Technologies: `src/content/tech/<domain>.yaml`, one file per domain, one entry per technology (`requires`, `related`, `til`)
- Learning tracks: `src/content/tracks/<id>.yaml`; each step is a `tech` or a pick-one `pick`, with side topics in `with`; prerequisites the track takes as known go in `assumes`. Every tech's `requires` must appear earlier in the track or in `assumes`, or the build fails
- Widgets (MDX): `BenchmarkChart`, `CodeCompare`, `Quiz`, `Stepper`, `NPlusOneCalculator` in `src/components/widgets/`; see each file's `Props`
- Unknown tech ids and circular `requires` fail the build.

```bash
npm install                           # Node.js 22.12+
npm run dev                           # local dev server (http://localhost:4321)
npm run check                         # type check
npm run build && npm run check:links  # static build, then check for broken internal links
```

Merging into `main` deploys automatically via GitHub Actions.

---

## Contributing

This is a personal study blog, so contributions are not expected.  
However, feel free to fork or explore the code for learning purposes.
