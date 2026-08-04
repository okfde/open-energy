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
    {% include button.html text="Mehr erfahren →" url="/about/" style="primary" %}
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
        <div class="blog-teaser__image" aria-hidden="true"></div>
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
          <div class="blog-teaser__image blog-teaser__image--small" aria-hidden="true"></div>
        </a>
      {% endfor %}
    </div>
  </div>
  {% include button.html text="Alle Blogposts" url="/blog/" style="secondary" invert=true %}
</section>

<section class="section section--sand events-section">
  {% assign upcoming_events = site.events | sort: "date" | limit: 3 %}
  <h2>Veranstaltungen</h2>
  <div class="events-grid">
    {% for event in upcoming_events %}
      <a href="{{ event.url | relative_url }}" class="event-teaser">
        <div class="event-teaser__body">
          <div class="event-teaser__heading">
            <h3>{{ event.title }}</h3>
            <p class="body-text--small">{{ event.excerpt }}</p>
          </div>
          <div class="event-teaser__meta">
            <p class="event-teaser__meta-row">
              <img src="{{ '/assets/images/icons/icon-clock.svg' | relative_url }}" alt="">
              <span class="ui-upper-small">{{ event.date | date: "%d/%m/%Y" }}, {{ event.time }}</span>
            </p>
            <p class="event-teaser__meta-row">
              <img src="{{ '/assets/images/icons/icon-location.svg' | relative_url }}" alt="">
              <span class="ui-small">{{ event.location }}</span>
            </p>
          </div>
        </div>
        <div class="event-teaser__cta">
          <span class="ui-large">Event-Details →</span>
        </div>
      </a>
    {% endfor %}
  </div>
  {% include button.html text="Alle Veranstaltungen →" url="/termine/" style="secondary" %}
</section>
