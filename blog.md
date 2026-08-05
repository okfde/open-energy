---
layout: default
title: Blog
permalink: /blog/
---

{% assign featured_post = site.blog | where: "featured", true | first %}
{% unless featured_post %}
  {% assign featured_post = site.blog | sort: "date" | reverse | first %}
{% endunless %}
{% assign list_posts = site.blog | where_exp: "post", "post.url != featured_post.url" | sort: "date" | reverse %}
{% assign used_categories = site.blog | map: "category" | uniq | sort %}
{% assign categories_str = used_categories | join: "," %}

{% include subpage-header.html title="Blog" intro="Was können wir von Menschen lernen, die bereits ihre eigene Solar- oder Windstromanlage aufgebaut haben? Hier findet ihr Antworten und Neuigkeiten zu unseren Veranstaltungen." categories=categories_str rss=true media="/assets/images/illustrations/illu-balkonkraftwerk.png" %}

{% if featured_post %}
<section class="section section--sand" data-category-item="{{ featured_post.category }}">
  <a href="{{ featured_post.url | relative_url }}" class="blog-featured">
    <div class="blog-featured__image" aria-hidden="true">
      {% if featured_post.image %}<img src="{{ featured_post.image | relative_url }}" alt="" loading="lazy">{% endif %}
    </div>
    <div class="blog-featured__body">
      <div class="blog-featured__meta">
        {% include label.html text=featured_post.category color="sunshine" %}
        <span class="ui-upper-small blog-featured__date">{{ featured_post.date | date: "%d / %B / %Y" }}</span>
      </div>
      <h2>{{ featured_post.title }}</h2>
      <p class="body-text--small">{{ featured_post.excerpt }}</p>
      <span class="blog-featured__link">Beitrag lesen <span aria-hidden="true">→</span></span>
    </div>
  </a>
</section>
{% endif %}

<section class="section section--dark">
  {% for post in list_posts %}
    {% include blog-teaser-row.html post=post %}
  {% endfor %}
</section>

{% include events-section.html %}
