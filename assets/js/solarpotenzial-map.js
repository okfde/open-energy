/* Solarpotenzial Brandenburg – Choroplethenkarte
 * Datenquelle: assets/data/gemeinden.geojson (siehe scripts/build_data.py)
 */
(function () {
  "use strict";

  var SEQ_RAMP = [
    "#f4f8fe", "#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5",
    "#256abf", "#184f95", "#0d366b"
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
    kwh: {
      label: "Potenzial in kWh/Jahr",
      field: "dach_menge_eigen_mwh",
      unit: "kWh",
      transform: function (v) { return v * 1000; }, // gespeichert in MWh -> kWh
      fmt: function (v) { return fmtCompact(v) + " kWh/a"; },
      legendFmt: function (v) { return fmtCompact(v) + " kWh"; },
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

  var state = {
    metric: "ausschoepfung",
    geojson: null,
    map: null,
    layer: null,
    legendEl: null,
    mapBaseHeight: null
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

  function computeDomainMax(features, metricKey) {
    var m = METRICS[metricKey];
    var values = [];
    features.forEach(function (f) {
      var v = metricValue(f.properties, metricKey);
      if (v !== null && !isNaN(v)) values.push(v);
    });
    values.sort(function (a, b) { return a - b; });
    if (!values.length) return 1;
    var trueMax = values[values.length - 1];
    if (m.capPercentile) {
      var idx = Math.min(values.length - 1, Math.floor(values.length * m.capPercentile));
      var capped = values[idx];
      return { domainMax: capped || trueMax || 1, trueMax: trueMax };
    }
    return { domainMax: trueMax || 1, trueMax: trueMax };
  }

  function styleFor(feature) {
    var v = metricValue(feature.properties, state.metric);
    var domainMax = state.domainMax;
    return {
      fillColor: colorFor(v, domainMax),
      fillOpacity: 0.88,
      color: "#ffffff",
      weight: 0.6,
      opacity: 1
    };
  }

  // Dach-Potenzial wird nur aus den Eignungsklassen "gut" und "mittel"
  // gebildet; "schlecht" wird hier separat ausgewiesen, aber bewusst nicht
  // in die Summen (Fläche, eigene/amtliche Leistung, Ausschöpfung) eingerechnet.
  var EIGNUNGSKLASSEN = [
    { key: "gut", label: "Gut" },
    { key: "mittel", label: "Mittel" },
    { key: "schlecht", label: "Schlecht" }
  ];

  function classBreakdownHtml(props) {
    var html = '<table class="popup-classes"><tr>' +
      "<td><strong>Eignung</strong></td>" +
      '<td class="num"><strong>Fläche</strong></td>' +
      '<td class="num"><strong>eigene kWp</strong></td>' +
      '<td class="num"><strong>amtlich kWp</strong></td></tr>';
    EIGNUNGSKLASSEN.forEach(function (k) {
      var excluded = k.key === "schlecht";
      html += "<tr" + (excluded ? ' class="is-excluded"' : "") + ">" +
        "<td>" + k.label + (excluded ? " *" : "") + "</td>" +
        '<td class="num">' + fmtNum(props["dach_flaeche_" + k.key + "_qm"], 0) + " m²</td>" +
        '<td class="num">' + fmtNum(props["dach_leistung_eigen_" + k.key + "_kwp"], 0) + "</td>" +
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
      ["Potenzial (eigene Berechnung, 500-Wp-Panel)", fmtNum(props.dach_leistung_eigen_kwp, 0) + " kWp"],
      ["Potenzieller Jahresertrag (eigene Berechnung)", fmtCompact(props.dach_menge_eigen_mwh * 1000) + " kWh/a"],
      ["Amtliches Potenzial (Vergleich, gut + mittel)", fmtNum(props.dach_leistung_amtlich_kwp, 0) + " kWp / " + fmtCompact(props.dach_menge_amtlich_mwh * 1000) + " kWh/a"],
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

  function initControls() {
    var buttons = document.querySelectorAll("[data-metric]");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        state.metric = btn.getAttribute("data-metric");
        updateStyles();
      });
    });
  }

  function init() {
    var mapEl = document.getElementById("map");
    if (!mapEl) return;
    var dataUrl = mapEl.getAttribute("data-src");

    state.map = L.map("map", { scrollWheelZoom: false, minZoom: 7 }).setView([52.4, 13.1], 8);
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

      try {
        state.map.fitBounds(state.layer.getBounds(), { padding: [10, 10] });
      } catch (e) { /* no-op */ }

      renderLegend();
      initControls();
    }).catch(function (err) {
      mapEl.innerHTML = '<p style="padding:20px;color:var(--text-secondary);">Kartendaten konnten nicht geladen werden (' + escapeHtml(err.message) + ").</p>";
      console.error(err);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
