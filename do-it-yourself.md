---
layout: default
title: Do it yourself
permalink: /do-it-yourself/
---

{% include subpage-header.html title="Do it yourself" intro="Hier entsteht eine Übersicht zu wichtigen Komponenten, die ihr für eure Solar- oder Windstromanlage benötigt. Sie sind besonders, da die Entwickler euch alle Informationen zur Verfügung stellen, mit denen ihr selbst oder Dienstleister die Geräte reparieren und sogar nachbauen können. Wir nennen das Open Source Energietechnik." media="/assets/images/illustrations/illu-diy-header.png" %}

<section class="section section--sand diy-grid-section">
  <div class="diy-grid">
    {% for item in site.data.diy_items %}
      {% include diy-teaser.html item=item %}
    {% endfor %}
  </div>
</section>
