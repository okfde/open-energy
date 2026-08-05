---
layout: default
title: Start
---

<section class="hero">
  <div class="hero__text">
    <h1>Wir machen unsere Energie selbst.</h1>
    <div class="hero__body">
      <p class="body-text">Gemeinsam bauen wir kleine Windräder und Solaranlagen für den Alltag – zugänglich, gemeinschaftlich und offen für alle. Dabei setzen wir auf Technik, die vollständig euch gehört. Auf dieser Seite findest du alle Informationen, mit denen du das selbst schaffst. Auf unseren Veranstaltungen helfen wir dir bei den ersten Schritten.</p>
      <p class="body-text">Folg uns auf <a href="#" class="link-underline">Instagram</a> und <a href="#" class="link-underline">Facebook</a>, um auf dem aktuellen Stand zu sein.</p>
    </div>
    {% include button.html text="Mehr erfahren →" url="/open-energy/about/" style="primary" %}
  </div>
  <div class="hero__media pattern-main" aria-hidden="true">
    <div class="hero-slideshow" data-hero-slideshow>
      <div class="hero-slideshow__track" data-hero-slideshow-track>
        {% assign hero_photos = site.static_files | where_exp: "f", "f.path contains '/assets/images/photos/hero/'" | sort: "name" %}
        {% for photo in hero_photos %}
          <div class="hero-slideshow__slide">
            <img src="{{ photo.path | relative_url }}" alt="" loading="lazy">
          </div>
        {% endfor %}
      </div>
    </div>
  </div>
</section>

<section class="section section--dark blog-section">
  {% assign featured_post = site.blog | where: "featured", true | first %}
  {% assign list_posts = site.blog | where_exp: "post", "post.featured != true" | sort: "date" | reverse | limit: 3 %}
  <h2>Neu im Blog</h2>
  <div class="blog-grid">
    {% if featured_post %}
      <a href="{{ featured_post.url | relative_url }}" class="blog-teaser blog-teaser--featured">
        <div class="blog-teaser__image" aria-hidden="true">
          {% if featured_post.image %}<img src="{{ featured_post.image | relative_url }}" alt="" loading="lazy">{% endif %}
        </div>
        <div class="blog-teaser__body">
          <div class="blog-teaser__heading">
            {% include label.html text=featured_post.category color="sunshine" %}
            <h3>{{ featured_post.title }}</h3>
          </div>
          <p class="body-text--small">{{ featured_post.excerpt }}</p>
          <p class="ui-upper-small blog-teaser__date">{{ featured_post.date | date: "%d / %B / %Y" }}</p>
        </div>
      </a>
    {% endif %}
    <div class="blog-list">
      {% for post in list_posts %}
        <a href="{{ post.url | relative_url }}" class="blog-teaser blog-teaser--list">
          <div class="blog-teaser__body">
            <div class="blog-teaser__heading">
              {% include label.html text=post.category color="sunshine" %}
              <h4>{{ post.title }}</h4>
            </div>
            <p class="ui-upper-small blog-teaser__date">{{ post.date | date: "%d / %B / %Y" }}</p>
          </div>
          <div class="blog-teaser__image blog-teaser__image--small" aria-hidden="true">
            {% if post.image %}<img src="{{ post.image | relative_url }}" alt="" loading="lazy">{% endif %}
          </div>
        </a>
      {% endfor %}
    </div>
  </div>
  {% include button.html text="Alle Blogposts" url="/open-energy/blog/" style="secondary" invert=true %}
</section>

{% include events-section.html %}
