---
layout: default
title: Home
---

<h2>Posts</h2>

<ul>
  {% raw %}{% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      <small>{{ post.date | date: "%Y-%m-%d" }}</small>
    </li>
  {% endfor %}{% endraw %}
</ul>
