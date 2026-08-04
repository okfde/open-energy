---
layout: default
title: Termine
permalink: /termine/
---

{% include subpage-header.html title="Termine" intro="Auf unseren Veranstaltungen helfen wir dir bei den ersten Schritten – vom ersten Lötkolben bis zur eigenen Solaranlage. Hier findest du alle kommenden Termine." rss=true %}

<section class="section events-list-section">
  {% assign upcoming_events = site.events | sort: "date" %}
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
</section>
