---
layout: default
title: Termine
permalink: /termine/
description: "Workshops und Veranstaltungen von Open Energy: Hier lernst du die ersten Schritte zur eigenen Solar- oder Windstromanlage."
---

{% include subpage-header.html title="Termine" intro="Auf unseren Veranstaltungen helfen wir dir bei den ersten Schritten – vom ersten Lötkolben bis zur eigenen Solaranlage. Hier findest du alle kommenden Termine." rss=true media="/assets/images/illustrations/illu-windrad-2.png" %}

<section class="section section--sand pattern-main events-list-section">
  {% assign upcoming_events = site.events | sort: "date" %}
  <div class="events-grid">
    {% for event in upcoming_events %}
      {% include event-teaser.html event=event first=forloop.first %}
    {% endfor %}
  </div>
</section>
