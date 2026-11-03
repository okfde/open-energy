---
layout: default
title: Vergangene Termine
permalink: /termine/old/
description: "Vergangene Workshops und Veranstaltungen von Open Energy rund um selbstgebaute Solar- und Windstromanlagen."
---

{% include subpage-header.html title="Vergangene Termine" intro="Hier findest du alle Veranstaltungen, die bereits stattgefunden haben – von Workshops bis zu Onlinecalls." rss=true media="/assets/images/illustrations/illu-windrad-2.png" %}

<section class="section section--sand pattern-main events-list-section">
  {% assign today_str = site.time | date: "%Y-%m-%d" %}
  {% assign today_ts = today_str | date: "%s" %}
  {% assign sorted_events = site.events | sort: "date" | reverse %}
  <div class="events-grid">
    {% for event in sorted_events %}
      {% assign event_ts = event.date | date: "%s" %}
      {% assign diff_days = event_ts | minus: today_ts | divided_by: 86400 %}
      {% if diff_days < 0 %}
        {% include event-teaser.html event=event %}
      {% endif %}
    {% endfor %}
  </div>
  <div class="events-list-section__more">
    {% include button.html text="Aktuelle Veranstaltungen →" url="/termine/" style="secondary" %}
  </div>
</section>
