# Hyun Dev Blog

Welcome to my personal development study blog!  
Here, I document my journey learning various technologies, programming concepts, and project experiments.

---

## About

This blog is focused on learning and sharing development knowledge:  
- Notes from personal projects and coding experiments  
- Recording learning progress and technical tips  
- An interactive Architecture graph connecting technologies, concepts, blog posts, and the actual code behind them

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
| SEO | Generated sitemap, RSS (`@astrojs/rss`), canonical links, robots.txt |
| Hosting / CI | GitHub Pages; GitHub Actions runs `astro check` + build on PRs and deploys `main` |

Dependencies: `astro`, `@astrojs/mdx`, `@astrojs/rss`, `pretendard`, `@fontsource-variable/jetbrains-mono`; dev: `@astrojs/check`, `typescript`.

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

- `npm install && npm run dev` — local dev server
- Blog posts live in `src/content/posts/` (Markdown/MDX); link a post to technologies with `tech: [spring-boot, jpa]` in its frontmatter
- Technologies live in `src/content/tech/<domain>.yaml` — one file per domain, one entry per technology (`requires`, `related`, `til`)
- Learning tracks live in `src/content/tracks/<id>.yaml` — each step is a `tech` or a pick-one `pick`, with side topics in `with`
- Unknown tech ids and circular `requires` fail the build
- Post widgets (MDX) live in `src/components/widgets/`: `BenchmarkChart`, `CodeCompare`, `Quiz`, `Stepper`, `NPlusOneCalculator` — see each file's `Props`
- `npm run build` — static build to `dist/`, auto-deployed via GitHub Actions on push to `main`

---

## Contributing

This is a personal study blog, so contributions are not expected.  
However, feel free to fork or explore the code for learning purposes.
