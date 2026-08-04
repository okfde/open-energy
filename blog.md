---
layout: default
title: Blog
permalink: /blog/
---

{% include subpage-header.html title="Blog" intro="Was können wir von Menschen lernen, die bereits ihre eigene Solar- oder Windstromanlage aufgebaut haben? Hier findet ihr Antworten und Neuigkeiten zu unseren Veranstaltungen." categories="Interview,Open Hardware,Anleitung,Interna,Prototype Fund,Politik" rss=true %}

<section class="blog-list-section">
  {% assign posts = site.blog | sort: "date" | reverse %}
  {% for post in posts %}
    {% include blog-teaser-row.html post=post %}
  {% endfor %}
</section>
