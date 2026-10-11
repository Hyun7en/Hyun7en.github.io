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
- Astro (Content Collections + MDX)
- Widgets inside posts are Astro components (plus a small `<script>` when they need interaction) — no UI framework
- GitHub Pages, built and deployed via GitHub Actions

**Topics I study and write about:**
- Java, Spring Boot, JPA, Kafka, and more

---

## Tech Flow

Every technology lists the ones you should know first (`requires`). From that alone the site derives:

- **Roadmap** (`/tech/`) — each domain laid out stage by stage, filterable to technologies that already have posts
- **Tech hubs** (`/tech/<id>/`) — prerequisites ← tech → what comes next, the full learning path, its posts and TIL code
- **Read next** at the end of each post — posts on the technologies that build on this one
- **Recommended paths** on the home page — chosen automatically from where posts have piled up

Design notes: [docs/architecture-blog-plan.md](docs/architecture-blog-plan.md) (section 24).

---

## How to Use

- `npm install && npm run dev` — local dev server
- Blog posts live in `src/content/posts/` (Markdown/MDX); link a post to technologies with `tech: [spring-boot, jpa]` in its frontmatter
- Technologies live in `src/content/tech/<domain>.yaml` — one file per domain, one entry per technology (`requires`, `related`, `til`)
- Unknown tech ids and circular `requires` fail the build
- Post widgets (MDX) live in `src/components/widgets/`: `BenchmarkChart`, `CodeCompare`, `Quiz`, `Stepper`, `NPlusOneCalculator` — see each file's `Props`
- `npm run build` — static build to `dist/`, auto-deployed via GitHub Actions on push to `main`

---

## Contributing

This is a personal study blog, so contributions are not expected.  
However, feel free to fork or explore the code for learning purposes.
