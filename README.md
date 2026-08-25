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
- React islands — `@xyflow/react` for the Architecture graph
- GitHub Pages, built and deployed via GitHub Actions

**Topics I study and write about:**
- Java, Spring Boot, JPA, Kafka, and more

---

## Architecture

Instead of a plain category list, the home page shows an interactive graph (Architecture → Technology → Concept) that connects the technologies I study, the blog posts explaining them, and the real implementation code in my [TIL repository](https://github.com/Hyun7en/MY_PJT). Full design rationale and data model: [docs/architecture-blog-plan.md](docs/architecture-blog-plan.md).

---

## How to Use

- `npm install && npm run dev` — local dev server
- Blog posts live in `src/content/posts/` (Markdown/MDX)
- Architecture/Technology/Concept nodes live in `src/content/nodes/` (YAML)
- `npm run build` — static build to `dist/`, auto-deployed via GitHub Actions on push to `main`

---

## Contributing

This is a personal study blog, so contributions are not expected.  
However, feel free to fork or explore the code for learning purposes.
