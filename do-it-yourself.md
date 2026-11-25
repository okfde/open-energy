---
layout: default
title: "Do it yourself"
permalink: /do-it-yourself/
description: "Wie kann ich selbst Strom erzeugen? Balkonsolar, Dachsolar und Kleinwind im Überblick. Mit Anleitungen, wie du deine eigene Anlage baust und Geld sparst."
---

{% include subpage-header.html title="Bau dir deine eigene Anlage" intro="Wie kannst du selbst Strom erzeugen? Beantworte zwei kurze Fragen und finde heraus, welche Variante zu dir passt. Zu jeder Variante findest du Kosten, die rechtlichen Rahmenbedingungen und Anleitungen, mit denen du selbst zum Ziel kommst, bis hin zu Open-Source-Technik, die du reparieren und nachbauen kannst." media="/assets/images/illustrations/illu-solarzelle.png" %}

<section class="section diy-finder" aria-labelledby="diy-finder-heading">
  <h2 id="diy-finder-heading" class="visually-hidden">Finde deine Variante</h2>
  {% include diy-filter.html %}

  <div class="diy-cards" id="varianten">
    {% for topic in site.data.diy_topics %}
      {% include diy-topic-card.html topic=topic %}
    {% endfor %}
  </div>
</section>

<section class="section section--sand diy-grid-section" aria-labelledby="werkstatt-heading">
  <div class="diy-section-intro">
    <h2 id="werkstatt-heading">Open Source Werkstatt</h2>
    <p class="body-text">Du möchtest, dass deine Anlage wirklich dir gehört? Dann nutze Komponenten, deren Entwickler und Entwicklerinnen alle Baupläne offenlegen, damit du oder eine Werkstatt deines Vertrauens sie reparieren und sogar nachbauen können. Wir nennen das Open Source Energietechnik.</p>
  </div>
  <div class="diy-grid">
    {% assign werkstatt = site.data.diy_resources | where: "werkstatt", true %}
    {% for item in werkstatt %}
      {% include diy-teaser.html item=item %}
    {% endfor %}
  </div>
</section>

<script src="{{ '/assets/js/diy-filter.js' | relative_url }}" defer></script>
