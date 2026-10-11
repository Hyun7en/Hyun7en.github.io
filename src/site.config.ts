export const site = {
  title: 'Hyun Dev Blog',
  description: '기술의 흐름을 따라 공부한 것을 기록하는 개발 블로그',
  url: 'https://hyun7en.github.io',
};

export const author = {
  name: 'Hyun',
  bio: 'Backend Developer — Java, Spring, DevOps',
  github: 'Hyun7en',
};

export const nav = [
  { title: 'Home', url: '/' },
  { title: 'Roadmap', url: '/tech/' },
  { title: 'Posts', url: '/posts/' },
  { title: 'About', url: '/about/' },
];

/**
 * giscus (GitHub Discussions) comments. Get the ids from https://giscus.app
 * after enabling Discussions on the repo; until `categoryId` is set, posts
 * keep using utterances so comments never disappear (ADR 0011).
 */
export const giscus = {
  repo: 'Hyun7en/Hyun7en.github.io',
  repoId: 'R_kgDORK34SQ',
  category: 'Comments',
  categoryId: '',
};
