/* Solarpotenzial Brandenburg – Choroplethenkarte
 * Datenquelle: assets/data/gemeinden.geojson (siehe scripts/build_data.py)
 */
(function () {
  "use strict";

  // Sequential ramp in the site's own sunshine-yellow family (ColorBrewer
  // YlOrBr) instead of a generic blue scale — pale near-white for low
  // values, deepening through the brand yellow into amber/brown for the
  // highest ones, so the palette stays legible at the dark end too.
  var SEQ_RAMP = [
    "#ffffe5", "#fff7bc", "#fee391", "#fec44f",
    "#fe9929", "#ec7014", "#cc4c02", "#8c2d04"
  ];
  var NO_DATA_COLOR = "#e1e0d9";

  var METRICS = {
    ausschoepfung: {
      label: "Ausschöpfung Dach",
      field: "ausschoepfung_dach_prozent",
      unit: "%",
      fmt: function (v) { return fmtNum(v, 1) + " %"; },
      legendFmt: function (v) { return fmtNum(v, 0) + "%"; },
      capPercentile: 0.98
    },
    flaeche: {
      label: "Dachpotenzial-Fläche",
      field: "dach_flaeche_qm",
      unit: "m²",
      fmt: function (v) { return fmtNum(v, 0) + " m²"; },
      legendFmt: function (v) { return fmtCompact(v) + " m²"; },
      capPercentile: 0.95
    },
    bestand: {
      label: "Bestand Dachanlagen",
      field: "bestand_dach_kwp_gesamt",
      unit: "kWp",
      fmt: function (v) { return fmtNum(v, 0) + " kWp"; },
      legendFmt: function (v) { return fmtCompact(v) + " kWp"; },
      capPercentile: 0.95
    },
    frei_flaeche: {
      label: "Freiflächen-Potenzial (amtlich)",
      field: "frei_flaeche_qm",
      unit: "m²",
      fmt: function (v) { return fmtNum(v, 0) + " m²"; },
      legendFmt: function (v) { return fmtCompact(v) + " m²"; },
      capPercentile: 0.95
    },
    frei_bestand: {
      label: "Bestand Freiflächenanlagen",
      field: "bestand_csv_frei_kwp",
      unit: "kWp",
      fmt: function (v) { return fmtNum(v, 0) + " kWp"; },
      legendFmt: function (v) { return fmtCompact(v) + " kWp"; },
      capPercentile: 0.95
    },
    balkon_bestand: {
      label: "Bestand Balkonkraftwerke",
      field: "bestand_csv_balkon_kwp",
      unit: "kWp",
      fmt: function (v) { return fmtNum(v, 1) + " kWp"; },
      legendFmt: function (v) { return fmtCompact(v) + " kWp"; },
      capPercentile: 0.95
    }
  };

  // Einziger bundesweiter Filter: eigener, schlanker Datensatz
  // (assets/data/gemeinden_de_balkon.geojson, siehe scripts/build_data_de.py)
  // mit nur Balkonkraftwerke-Kennzahlen je Gemeinde in ganz Deutschland,
  // normalisiert auf 100 Haushalte (nicht Einwohner): ein Balkonkraftwerk
  // wird je Wohnung/Haushalt installiert, nicht je Kopf – die Haushaltszahl
  // (Zensus 2022) ist daher der methodisch passendere Nenner. Läuft bewusst
  // nicht über das normale METRICS/state.geojson (Brandenburg) – wird per
  // Lazy-Load als eigener Layer ein-/ausgeblendet, alle anderen Filter
  // bleiben unangetastet.
  var DE_METRIC_KEY = "balkon_de_pro100hh";
  var DE_METRIC = {
    label: "Balkonkraftwerke je 100 Haushalte",
    field: "balkon_pro_100_haushalte",
    fmt: function (v) { return fmtNum(v, 2) + " je 100 Haushalte"; },
    legendFmt: function (v) { return fmtNum(v, 1); },
    capPercentile: 0.95
  };

  var state = {
    metric: "ausschoepfung",
    geojson: null,
    map: null,
    layer: null,
    legendEl: null,
    mapBaseHeight: null,
    deLayer: null,
    deGeojson: null,
    activeMode: "bb"
  };

  // Below this width the map container's CSS height (see #map in
  // _solarpotenzial.scss) is too short for a fully expanded popup – its
  // content would get clipped by the map's overflow:hidden. On these
  // viewports we grow #map to fit the open popup instead of letting Leaflet
  // clip or scroll it.
  var MOBILE_QUERY = "(max-width: 640px)";

  function isMobileViewport() {
    return typeof window.matchMedia === "function" && window.matchMedia(MOBILE_QUERY).matches;
  }

  function remToPx(rem) {
    var rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return rem * rootFontSize;
  }

  function fmtNum(v, digits) {
    if (v === null || v === undefined || isNaN(v)) return "–";
    return Number(v).toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }
  function fmtCompact(v) {
    if (v === null || v === undefined || isNaN(v)) return "–";
    var abs = Math.abs(v);
    if (abs >= 1e9) return fmtNum(v / 1e9, 1) + " Mrd.";
    if (abs >= 1e6) return fmtNum(v / 1e6, 1) + " Mio.";
    if (abs >= 1e3) return fmtNum(v / 1e3, 0) + " Tsd.";
    return fmtNum(v, 0);
  }

  function metricValue(props, metricKey) {
    var m = METRICS[metricKey];
    var raw = props[m.field];
    if (raw === null || raw === undefined) return null;
    return m.transform ? m.transform(raw) : raw;
  }

  function colorFor(value, domainMax) {
    if (value === null || value === undefined || isNaN(value)) return NO_DATA_COLOR;
    var t = domainMax > 0 ? Math.max(0, Math.min(1, value / domainMax)) : 0;
    var idx = t * (SEQ_RAMP.length - 1);
    var lo = Math.floor(idx), hi = Math.ceil(idx);
    if (lo === hi) return SEQ_RAMP[lo];
    var frac = idx - lo;
    return mixHex(SEQ_RAMP[lo], SEQ_RAMP[hi], frac);
  }

  function mixHex(a, b, t) {
    var ca = hexToRgb(a), cb = hexToRgb(b);
    var r = Math.round(ca.r + (cb.r - ca.r) * t);
    var g = Math.round(ca.g + (cb.g - ca.g) * t);
    var bl = Math.round(ca.b + (cb.b - ca.b) * t);
    return "rgb(" + r + "," + g + "," + bl + ")";
  }
  function hexToRgb(hex) {
    hex = hex.replace("#", "");
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }

  function computeDomainMaxGeneric(features, valueFn, capPercentile) {
    var values = [];
    features.forEach(function (f) {
      var v = valueFn(f);
      if (v !== null && v !== undefined && !isNaN(v)) values.push(v);
    });
    values.sort(function (a, b) { return a - b; });
    if (!values.length) return { domainMax: 1, trueMax: 1 };
    var trueMax = values[values.length - 1];
    if (capPercentile) {
      var idx = Math.min(values.length - 1, Math.floor(values.length * capPercentile));
      var capped = values[idx];
      return { domainMax: capped || trueMax || 1, trueMax: trueMax };
    }
    return { domainMax: trueMax || 1, trueMax: trueMax };
  }

  function computeDomainMax(features, metricKey) {
    var m = METRICS[metricKey];
    return computeDomainMaxGeneric(features, function (f) {
      return metricValue(f.properties, metricKey);
    }, m.capPercentile);
  }

  function styleFor(feature) {
    var v = metricValue(feature.properties, state.metric);
    var domainMax = state.domainMax;
    return {
      fillColor: colorFor(v, domainMax),
      fillOpacity: 0.55,
      color: "#ffffff",
      weight: 0.6,
      opacity: 1
    };
  }

  // Dach-Potenzial wird nur aus den Eignungsklassen "gut" und "mittel"
  // gebildet; "schlecht" wird hier separat ausgewiesen, aber bewusst nicht
  // in die Summen (Fläche, amtliche Leistung, Ausschöpfung) eingerechnet.
  var EIGNUNGSKLASSEN = [
    { key: "gut", label: "Gut" },
    { key: "mittel", label: "Mittel" },
    { key: "schlecht", label: "Schlecht" }
  ];

  function classBreakdownHtml(props) {
    var html = '<table class="popup-classes"><tr>' +
      "<td><strong>Eignung</strong></td>" +
      '<td class="num"><strong>Fläche</strong></td>' +
      '<td class="num"><strong>amtlich kWp</strong></td></tr>';
    EIGNUNGSKLASSEN.forEach(function (k) {
      var excluded = k.key === "schlecht";
      html += "<tr" + (excluded ? ' class="is-excluded"' : "") + ">" +
        "<td>" + k.label + (excluded ? " *" : "") + "</td>" +
        '<td class="num">' + fmtNum(props["dach_flaeche_" + k.key + "_qm"], 0) + " m²</td>" +
        '<td class="num">' + fmtNum(props["dach_leistung_amtlich_" + k.key + "_kwp"], 0) + "</td>" +
        "</tr>";
    });
    html += "</table>";
    return html;
  }

  function popupHtml(props) {
    var name = props.gemeinde_name || "Unbekannt";
    var typ = props.gemeinde_typ || "";
    var rows = [
      ["Dach-Potenzialfläche (gut + mittel)", fmtNum(props.dach_flaeche_qm, 0) + " m²"],
      ["Amtliches Potenzial (gut + mittel)", fmtNum(props.dach_leistung_amtlich_kwp, 0) + " kWp / " + fmtCompact(props.dach_menge_amtlich_mwh * 1000) + " kWh/a"],
      ["Bestand Dachanlagen (MaStR)", fmtNum(props.bestand_csv_dach_anzahl, 0) + " Anlagen, " + fmtNum(props.bestand_dach_kwp_gesamt, 0) + " kWp"],
      ["Ausschöpfung Dachpotenzial", fmtNum(props.ausschoepfung_dach_prozent, 1) + " %"],
      ["Freiflächen-Potenzial (amtlich, EEG-Kulisse)", fmtNum(props.frei_flaeche_qm, 0) + " m²"],
      ["Freiflächenanlagen (Bestand)", fmtNum(props.bestand_csv_frei_anzahl, 0) + " Anlagen, " + fmtNum(props.bestand_csv_frei_kwp, 0) + " kWp"],
      ["Balkonkraftwerke (Bestand, separat)", fmtNum(props.bestand_csv_balkon_anzahl, 0) + " Anlagen, " + fmtNum(props.bestand_csv_balkon_kwp, 1) + " kWp"]
    ];
    var html = '<div class="popup"><h4>' + escapeHtml(name) + '</h4>' +
      '<div style="color:var(--text-muted);font-size:.72rem;margin-bottom:6px;">' + escapeHtml(typ) + " · AGS " + escapeHtml(props.gemeinde_schluessel) + "</div>" +
      classBreakdownHtml(props) +
      '<div class="popup-note">* Flächen mit schlechter Eignung fließen nicht in die Dachpotenzial-Summen ein.</div>' +
      "<table>";
    rows.forEach(function (r) {
      html += "<tr><td>" + r[0] + "</td><td class=\"num\">" + r[1] + "</td></tr>";
    });
    html += "</table><div class=\"popup-foot\">Fläche &amp; amtliches Potenzial: Energieportal Brandenburg (WFBB). Bestand: Marktstammdatenregister.</div></div>";
    return html;
  }

  function styleForDe(feature) {
    var v = feature.properties[DE_METRIC.field];
    return {
      fillColor: colorFor(v, state.deDomainMax),
      fillOpacity: 0.55,
      color: "#ffffff",
      weight: 0.3,
      opacity: 1
    };
  }

  // Bewusst ein eigenes, schlankes Popup statt popupHtml(): der bundesweite
  // Datensatz enthält nur Balkonkraftwerke-Kennzahlen – für Gemeinden
  // außerhalb Brandenburgs fehlen Dachpotenzial/Bestand-Dach/Freifläche
  // etc. schlicht, sie werden hier also nie referenziert statt als "keine
  // Daten" angezeigt zu werden.
  function popupHtmlDe(props) {
    var name = props.gemeinde_name || "Unbekannt";
    var typ = props.gemeinde_typ || "";
    var rows = [
      ["Haushalte", fmtNum(props.haushalte, 0)],
      ["Einwohner", fmtNum(props.einwohner, 0)],
      ["Balkonkraftwerke (Bestand)", fmtNum(props.balkon_anzahl, 0) + " Anlagen, " + fmtNum(props.balkon_kwp, 1) + " kWp"],
      ["Je 100 Haushalte", fmtNum(props.balkon_pro_100_haushalte, 2)]
    ];
    var html = '<div class="popup"><h4>' + escapeHtml(name) + '</h4>' +
      '<div style="color:var(--text-muted);font-size:.72rem;margin-bottom:6px;">' + escapeHtml(typ) + " · AGS " + escapeHtml(props.ags) + "</div><table>";
    rows.forEach(function (r) {
      html += "<tr><td>" + r[0] + "</td><td class=\"num\">" + r[1] + "</td></tr>";
    });
    html += "</table><div class=\"popup-foot\">Bestand: Marktstammdatenregister. Haushalte: Zensus 2022. Einwohnerzahl/Gemeindegrenzen: BKG (VG250-EW).</div></div>";
    return html;
  }

  function renderLegendDe() {
    var stops = SEQ_RAMP;
    var gradientCss = "linear-gradient(90deg, " + stops.join(",") + ")";
    var maxLabel = DE_METRIC.legendFmt(state.deDomainMax);
    var capNote = state.deDomainTrueMax > state.deDomainMax ? " +" : "";
    state.legendEl.innerHTML =
      '<div class="legend-title">' + DE_METRIC.label + "</div>" +
      '<div class="ramp" style="background:' + gradientCss + '"></div>' +
      '<div class="scale-labels"><span>0</span><span>' + maxLabel + capNote + "</span></div>" +
      '<div style="margin-top:6px;"><span class="no-data-swatch"></span>keine Daten' +
      (capNote ? ' &nbsp;·&nbsp; höchste Werte werden ab dem 95.-Perzentil in der dunkelsten Stufe zusammengefasst' : '') +
      "</div>";
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderLegend() {
    var m = METRICS[state.metric];
    var stops = SEQ_RAMP;
    var gradientCss = "linear-gradient(90deg, " + stops.join(",") + ")";
    var maxLabel = m.legendFmt(state.domainMax);
    var capNote = state.domainTrueMax > state.domainMax ? " +" : "";
    state.legendEl.innerHTML =
      '<div class="legend-title">' + m.label + "</div>" +
      '<div class="ramp" style="background:' + gradientCss + '"></div>' +
      '<div class="scale-labels"><span>0</span><span>' + maxLabel + capNote + "</span></div>" +
      '<div style="margin-top:6px;"><span class="no-data-swatch"></span>keine Daten' +
      (capNote ? ' &nbsp;·&nbsp; höchste Werte werden ab dem 95./98.-Perzentil in der dunkelsten Stufe zusammengefasst' : '') +
      "</div>";
  }

  function updateStyles() {
    var d = computeDomainMax(state.geojson.features, state.metric);
    state.domainMax = d.domainMax;
    state.domainTrueMax = d.trueMax;
    if (state.layer) {
      state.layer.eachLayer(function (l) {
        l.setStyle(styleFor(l.feature));
      });
    }
    renderLegend();
  }

  // Grows the map container to fit the open popup on mobile, so the full
  // "Detailansicht" (Eignungsklassen-Tabelle + Kennzahlen) is visible
  // instead of being cut off at the container edge.
  function growMapForPopup(mapEl, popupEl) {
    if (state.mapBaseHeight === null) {
      state.mapBaseHeight = remToPx(28); // matches #map's mobile CSS height
    }
    var popupHeight = popupEl.getBoundingClientRect().height;
    var buffer = 64; // room for popup tip, marker offset and a little margin
    var target = Math.max(state.mapBaseHeight, Math.ceil(popupHeight + buffer));
    mapEl.style.height = target + "px";
    state.map.invalidateSize({ pan: false });
  }

  function resetMapHeight(mapEl) {
    mapEl.style.height = "";
    state.map.invalidateSize({ pan: false });
  }

  function initPopupResize(mapEl) {
    state.map.on("popupopen", function (e) {
      if (!isMobileViewport()) return;
      var popupEl = e.popup.getElement ? e.popup.getElement() : e.popup._container;
      if (!popupEl) return;
      growMapForPopup(mapEl, popupEl);
      // Re-run Leaflet's own positioning once the container has its new,
      // larger size so the popup isn't left offset from its anchor.
      window.requestAnimationFrame(function () {
        e.popup.update();
      });
    });
    state.map.on("popupclose", function () {
      if (!isMobileViewport()) return;
      resetMapHeight(mapEl);
    });
  }

  function fitToBounds(bounds) {
    if (!bounds || !bounds.isValid()) return;
    state.map.fitBounds(bounds, { padding: [10, 10] });
  }

  // Wechselt auf den bundesweiten Balkonkraftwerke-Layer (eigene Datei,
  // eigene Popups) – lädt sie beim ersten Aufruf nach (~13 MB, daher nicht
  // beim Seitenaufruf, sondern nur falls dieser eine Filter angeklickt wird).
  //
  // Der Fetch + Aufbau von 11.000 Leaflet-Features braucht spürbar Zeit;
  // klickt die Nutzerin währenddessen zurück auf einen Brandenburg-Filter,
  // darf das verspätete Ergebnis die Karte nicht wieder auf Deutschland
  // zurückreißen. state.activeMode hält daher fest, welcher Modus zuletzt
  // angefordert wurde – der then()-Handler wendet sein Ergebnis nur an,
  // wenn "de" währenddessen aktiv geblieben ist (die Daten werden trotzdem
  // gecacht, damit ein erneuter Klick nicht erneut laden muss).
  // Die Gemeindeliste unter der Karte hat ein eigenes, kleines Modul
  // (solarpotenzial-table.js); window.SolarpotenzialTable ist ihr einziger
  // Berührungspunkt mit der Karte, damit beide Skripte unabhängig bleiben.
  function updateDeTable(geojson) {
    if (!window.SolarpotenzialTable) return;
    window.SolarpotenzialTable.showDe(geojson.features.map(function (f) { return f.properties; }));
  }

  function switchToDeLayer(mapEl) {
    state.activeMode = "de";
    if (state.layer) state.map.removeLayer(state.layer);

    if (state.deLayer) {
      state.deLayer.addTo(state.map);
      fitToBounds(state.deLayer.getBounds());
      renderLegendDe();
      updateDeTable(state.deGeojson);
      return;
    }

    var deUrl = mapEl.getAttribute("data-src-de");
    state.legendEl.innerHTML = '<div class="legend-title">Lade bundesweite Daten …</div>';

    fetch(deUrl).then(function (r) { return r.json(); }).then(function (geojson) {
      state.deGeojson = geojson;
      var d = computeDomainMaxGeneric(geojson.features, function (f) {
        return f.properties[DE_METRIC.field];
      }, DE_METRIC.capPercentile);
      state.deDomainMax = d.domainMax;
      state.deDomainTrueMax = d.trueMax;

      state.deLayer = L.geoJSON(geojson, {
        style: styleForDe,
        onEachFeature: function (feature, layer) {
          layer.bindPopup(popupHtmlDe(feature.properties), { maxWidth: 300 });
          layer.on("mouseover", function () { layer.setStyle({ weight: 1.2, color: "#0b0b0b" }); });
          layer.on("mouseout", function () { layer.setStyle(styleForDe(feature)); });
        }
      });

      if (state.activeMode !== "de") return; // Nutzerin hat inzwischen zurückgewechselt

      state.deLayer.addTo(state.map);
      fitToBounds(state.deLayer.getBounds());
      renderLegendDe();
      updateDeTable(geojson);
    }).catch(function (err) {
      if (state.activeMode === "de") {
        state.legendEl.innerHTML = '<div class="legend-title">Bundesweite Daten konnten nicht geladen werden.</div>';
      }
      console.error(err);
    });
  }

  // Wechselt zurück auf den normalen Brandenburg-Layer/eine der bisherigen
  // Kennzahlen.
  function switchToBrandenburgLayer(metricKey) {
    state.activeMode = "bb";
    if (state.deLayer) state.map.removeLayer(state.deLayer);
    if (window.SolarpotenzialTable) window.SolarpotenzialTable.restoreBrandenburg();
    state.metric = metricKey;
    if (state.layer) {
      state.layer.addTo(state.map);
      fitToBounds(state.layer.getBounds());
    }
    updateStyles();
  }

  function initControls(mapEl) {
    var buttons = document.querySelectorAll("[data-metric]");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        var metricKey = btn.getAttribute("data-metric");
        if (metricKey === DE_METRIC_KEY) {
          switchToDeLayer(mapEl);
        } else {
          switchToBrandenburgLayer(metricKey);
        }
      });
    });
  }

  function init() {
    var mapEl = document.getElementById("map");
    if (!mapEl) return;
    var dataUrl = mapEl.getAttribute("data-src");

    // minZoom 5 statt 7: der bundesweite Balkonkraftwerke-Filter muss ganz
    // Deutschland einpassen können, nicht nur Brandenburg.
    state.map = L.map("map", { scrollWheelZoom: false, minZoom: 5 }).setView([52.4, 13.1], 8);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
    }).addTo(state.map);

    state.legendEl = document.getElementById("map-legend");
    initPopupResize(mapEl);

    fetch(dataUrl).then(function (r) { return r.json(); }).then(function (geojson) {
      state.geojson = geojson;
      var d0 = computeDomainMax(geojson.features, state.metric);
      state.domainMax = d0.domainMax;
      state.domainTrueMax = d0.trueMax;

      state.layer = L.geoJSON(geojson, {
        style: styleFor,
        onEachFeature: function (feature, layer) {
          layer.bindPopup(popupHtml(feature.properties), { maxWidth: 300 });
          layer.on("mouseover", function () { layer.setStyle({ weight: 2, color: "#0b0b0b" }); });
          layer.on("mouseout", function () { layer.setStyle(styleFor(feature)); });
        }
      }).addTo(state.map);

      fitToBounds(state.layer.getBounds());

      renderLegend();
      initControls(mapEl);
    }).catch(function (err) {
      mapEl.innerHTML = '<p style="padding:20px;color:var(--text-secondary);">Kartendaten konnten nicht geladen werden (' + escapeHtml(err.message) + ").</p>";
      console.error(err);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
