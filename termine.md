---
layout: default
title: Termine
permalink: /termine/
description: "Workshops und Veranstaltungen von Open Energy: Hier lernst du die ersten Schritte zur eigenen Solar- oder Windstromanlage."
---

{% include subpage-header.html title="Termine" intro="Auf unseren Veranstaltungen helfen wir dir bei den ersten Schritten – vom ersten Lötkolben bis zur eigenen Solaranlage. Hier findest du alle kommenden Termine." rss=true media="/assets/images/illustrations/illu-windrad-2.png" %}

<section class="section section--sand pattern-main events-list-section">
  {% assign today_str = site.time | date: "%Y-%m-%d" %}
  {% assign today_ts = today_str | date: "%s" %}
  {% assign sorted_events = site.events | sort: "date" %}
  <div class="events-grid">
    {% assign is_first = true %}
    {% for event in sorted_events %}
      {% assign event_ts = event.date | date: "%s" %}
      {% assign diff_days = event_ts | minus: today_ts | divided_by: 86400 %}
      {% if diff_days >= 0 %}
        {% include event-teaser.html event=event first=is_first %}
        {% assign is_first = false %}
      {% endif %}
    {% endfor %}
  </div>
</section>
