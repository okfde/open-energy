/* Sortier- und Filterlogik fuer die Gemeindetabelle.
 *
 * Zwei Modi:
 *  - Brandenburg (Standard): die serverseitig gerenderten 413 Zeilen aus
 *    site.data.gemeinden_tabelle, wie bisher.
 *  - Deutschland: wird von solarpotenzial-map.js aktiviert, sobald der
 *    "Deutschlandweit"-Kartenfilter angeklickt wird (window.SolarpotenzialTable.showDe).
 *    Zeigt standardmäßig die Top 10 nach Balkonkraftwerken je 100 Haushalte;
 *    die Suche filtert dagegen über alle ~11.000 Gemeinden. Ein Wechsel zurück
 *    auf einen Brandenburg-Filter stellt die ursprüngliche Liste wieder her
 *    (window.SolarpotenzialTable.restoreBrandenburg).
 */
(function () {
  "use strict";

  var BB_TOP_N = 10;
  var DE_TOP_N = 10;
  var DE_SEARCH_MAX_RESULTS = 200;
  // Balkonkraftwerke je 100 Haushalte ist als Verhältniszahl bei sehr
  // kleinen Gemeinden extrem volatil: ein Weiler mit wenigen Haushalten und
  // einer einzigen Anlage kommt rechnerisch auf eine sehr hohe Quote. Beide
  // Zahlen sind für sich genommen richtig, aber ein Top 10 aus solchen
  // Ausreißern wäre nicht aussagekräftig. Für die Standardansicht werden
  // daher nur Gemeinden ab dieser Haushaltszahl berücksichtigt (~1.000
  // Einwohner bei durchschnittlicher Haushaltsgröße); die Suche ist davon
  // unabhängig und findet weiterhin jede Gemeinde.
  var DE_TOP_MIN_HAUSHALTE = 500;

  var DE_COLUMNS = [
    { field: "gemeinde_name", label: "Gemeinde", type: "text" },
    { field: "gemeinde_typ", label: "Typ", type: "text" },
    { field: "balkon_pro_100_haushalte", label: "Balkonkraftwerke je 100 Haushalte", type: "num", decimals: 2 },
    { field: "haushalte", label: "Haushalte", type: "num", decimals: 0 },
    { field: "balkon_anzahl", label: "Balkonkraftwerke (Anzahl)", type: "num", decimals: 0 },
    { field: "balkon_kwp", label: "Balkonkraftwerke (kWp)", type: "num", decimals: 1 }
  ];

  // AGS-Länderkennziffer (erste zwei Ziffern des 8-stelligen Gemeindeschlüssels)
  // -> Bundesland. Für die Länder-Aggregation der Deutschland-Tabelle.
  var LAND_NAMES = {
    "01": "Schleswig-Holstein",
    "02": "Hamburg",
    "03": "Niedersachsen",
    "04": "Bremen",
    "05": "Nordrhein-Westfalen",
    "06": "Hessen",
    "07": "Rheinland-Pfalz",
    "08": "Baden-Württemberg",
    "09": "Bayern",
    "10": "Saarland",
    "11": "Berlin",
    "12": "Brandenburg",
    "13": "Mecklenburg-Vorpommern",
    "14": "Sachsen",
    "15": "Sachsen-Anhalt",
    "16": "Thüringen"
  };

  var LAND_COLUMNS = [
    { field: "land_name", label: "Bundesland", type: "text" },
    { field: "balkon_pro_100_haushalte", label: "Balkonkraftwerke je 100 Haushalte", type: "num", decimals: 2 },
    { field: "haushalte", label: "Haushalte", type: "num", decimals: 0 },
    { field: "balkon_anzahl", label: "Balkonkraftwerke (Anzahl)", type: "num", decimals: 0 },
    { field: "balkon_kwp", label: "Balkonkraftwerke (kWp)", type: "num", decimals: 1 }
  ];

  function computeLandRows(rows) {
    var byLand = {};
    rows.forEach(function (p) {
      var code = (p.ags || "").substring(0, 2);
      var name = LAND_NAMES[code];
      if (!name) return; // unbekannte/fehlende Kennziffer robust ignorieren
      if (!byLand[code]) byLand[code] = { land_name: name, haushalte: 0, balkon_anzahl: 0, balkon_kwp: 0 };
      byLand[code].haushalte += p.haushalte || 0;
      byLand[code].balkon_anzahl += p.balkon_anzahl || 0;
      byLand[code].balkon_kwp += p.balkon_kwp || 0;
    });
    return Object.keys(byLand).map(function (code) {
      var l = byLand[code];
      l.balkon_pro_100_haushalte = l.haushalte > 0 ? (l.balkon_anzahl / l.haushalte) * 100 : 0;
      return l;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var table = document.getElementById("gemeinden-table");
    if (!table) return;
    var thead = table.querySelector("thead tr");
    var tbody = table.querySelector("tbody");
    var countEl = document.getElementById("table-count");
    var searchEl = document.getElementById("table-search");
    var headingEl = document.getElementById("gemeinden-heading");
    var introEl = document.getElementById("gemeinden-intro");
    var bbNotesEl = document.getElementById("gemeinden-notes-bb");
    var deNotesEl = document.getElementById("gemeinden-notes-de");
    var landerSectionEl = document.getElementById("laender-section");
    var landThead = document.querySelector("#laender-table thead tr");
    var landTbody = document.querySelector("#laender-table tbody");

    var bbSearchPlaceholder = searchEl.placeholder;
    var bbHeading = headingEl ? headingEl.textContent : "";
    var bbIntro = introEl ? introEl.innerHTML : "";
    var bbTheadHtml = null; // captured once, after initial formatting/sort below
    var bbTbodyHtml = null;

    var mode = "bb";
    var deRows = null; // deduplizierte Properties-Arrays aller Gemeinden (von map.js geliefert)
    var deSort = { field: "balkon_pro_100_haushalte", dir: "desc" };
    var landRows = null; // aus deRows aggregiert, siehe computeLandRows()
    var landSort = { field: "balkon_pro_100_haushalte", dir: "desc" };

    function fmtDe(v, digits) {
      if (v === null || v === undefined || isNaN(v)) return "–";
      return Number(v).toLocaleString("de-DE", { minimumFractionDigits: digits || 0, maximumFractionDigits: digits || 0 });
    }

    // ---------------------------------------------------------------
    // Brandenburg-Modus (Standard) – arbeitet auf den serverseitig
    // gerenderten Zeilen. In eine Funktion gefasst, damit sie nach einem
    // Restore (innerHTML-Ersetzung -> neue DOM-Knoten) erneut aufgerufen
    // werden kann.
    // ---------------------------------------------------------------
    function initBrandenburg() {
      var rows = Array.prototype.slice.call(tbody.querySelectorAll("tr"));
      var headers = table.querySelectorAll("th");

      // Immer aus dem unveränderten data-sort-Rohwert formatieren, nie aus
      // dem sichtbaren Zelltext: nach einem Restore (Brandenburg-Modus nach
      // einem Ausflug in den Deutschland-Modus) enthält das gespeicherte
      // Markup bereits deutsch formatierten Text (z. B. "5.181.779"). Ein
      // erneutes parseFloat() darauf bricht am ersten Punkt ab und würde
      // "5.181.779" zu "5" verstümmeln.
      rows.forEach(function (row) {
        Array.prototype.forEach.call(row.children, function (td) {
          if (td.hasAttribute("data-sort")) {
            var raw = parseFloat(td.getAttribute("data-sort"));
            if (!isNaN(raw)) {
              var digits = parseInt(headers[td.cellIndex].getAttribute("data-decimals"), 10) || 0;
              td.textContent = raw.toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits });
            }
          }
        });
      });

      // Ohne Suche: nur die Top 10 der jeweils aktuell sortierten Spalte
      // (rows ist zu diesem Zeitpunkt bereits in Sortierreihenfolge, siehe
      // sortBy() unten). Mit Suche: alle Treffer aus allen 413 Gemeinden,
      // unabhängig von diesem Top 10.
      function applyVisibility() {
        var q = searchEl.value.trim().toLowerCase();
        var isSearch = q.length > 0;
        var visible = 0;
        rows.forEach(function (row, i) {
          var show = isSearch ? row.textContent.toLowerCase().indexOf(q) !== -1 : i < BB_TOP_N;
          row.style.display = show ? "" : "none";
          if (show) visible++;
        });
        if (isSearch) {
          countEl.textContent = visible + " von " + rows.length + " Gemeinden gefunden";
        } else {
          countEl.textContent = "Top " + BB_TOP_N + " von " + rows.length + " Gemeinden";
        }
      }

      searchEl.oninput = applyVisibility;

      var currentSort = { index: 0, dir: "desc" };
      headers.forEach(function (h, i) {
        if (h.classList.contains("sorted-asc")) currentSort = { index: i, dir: "asc" };
        if (h.classList.contains("sorted-desc")) currentSort = { index: i, dir: "desc" };
      });

      function sortBy(index, type, dir) {
        var mult = dir === "asc" ? 1 : -1;
        rows.sort(function (a, b) {
          var ca = a.children[index], cb = b.children[index];
          if (type === "num") {
            var va = parseFloat(ca.getAttribute("data-sort"));
            var vb = parseFloat(cb.getAttribute("data-sort"));
            va = isNaN(va) ? -Infinity : va;
            vb = isNaN(vb) ? -Infinity : vb;
            return (va - vb) * mult;
          }
          return ca.textContent.localeCompare(cb.textContent, "de") * mult;
        });
        rows.forEach(function (r) { tbody.appendChild(r); });
      }

      headers.forEach(function (th, index) {
        th.onclick = function () {
          var dir = currentSort.index === index && currentSort.dir === "desc" ? "asc" : "desc";
          currentSort = { index: index, dir: dir };
          headers.forEach(function (h) { h.classList.remove("sorted-asc", "sorted-desc"); });
          th.classList.add(dir === "asc" ? "sorted-asc" : "sorted-desc");
          sortBy(index, th.getAttribute("data-type"), dir);
          applyVisibility();
        };
      });

      sortBy(currentSort.index, "num", currentSort.dir);
      applyVisibility();
    }

    function restoreBrandenburgMode() {
      if (mode === "bb") return;
      mode = "bb";
      thead.innerHTML = bbTheadHtml;
      tbody.innerHTML = bbTbodyHtml;
      searchEl.value = "";
      searchEl.placeholder = bbSearchPlaceholder;
      if (headingEl) headingEl.textContent = bbHeading;
      if (introEl) introEl.innerHTML = bbIntro;
      if (bbNotesEl) bbNotesEl.hidden = false;
      if (deNotesEl) deNotesEl.hidden = true;
      if (landerSectionEl) landerSectionEl.hidden = true;
      initBrandenburg();
    }

    // ---------------------------------------------------------------
    // Deutschland-Modus – rendert Kopf/Zeilen aus JS-Daten statt aus
    // serverseitig gerendertem Markup, da ~11.000 Gemeinden nicht beim
    // Seitenaufruf ins DOM gehören.
    // ---------------------------------------------------------------
    function renderDeHead() {
      thead.innerHTML = DE_COLUMNS.map(function (c) {
        var cls = c.field === deSort.field ? (deSort.dir === "asc" ? " class=\"sorted-asc\"" : " class=\"sorted-desc\"") : "";
        return "<th data-type=\"" + c.type + "\" data-field=\"" + c.field + "\"" + cls + ">" + c.label + "</th>";
      }).join("");
      Array.prototype.forEach.call(thead.querySelectorAll("th"), function (th) {
        th.onclick = function () {
          var field = th.getAttribute("data-field");
          deSort.dir = deSort.field === field && deSort.dir === "desc" ? "asc" : "desc";
          deSort.field = field;
          renderDeHead();
          renderDeBody(searchEl.value.trim());
        };
      });
    }

    function deRowHtml(p) {
      return "<tr>" + DE_COLUMNS.map(function (c) {
        var v = p[c.field];
        if (c.type === "num") {
          return "<td data-sort=\"" + (v == null ? "" : v) + "\">" + fmtDe(v, c.decimals) + "</td>";
        }
        return "<td>" + (v == null ? "" : v) + "</td>";
      }).join("") + "</tr>";
    }

    function sortDeRows(list) {
      var field = deSort.field, dir = deSort.dir, mult = dir === "asc" ? 1 : -1;
      var col = DE_COLUMNS.filter(function (c) { return c.field === field; })[0];
      list.sort(function (a, b) {
        var va = a[field], vb = b[field];
        if (col && col.type === "text") {
          return (va || "").localeCompare(vb || "", "de") * mult;
        }
        va = va == null ? -Infinity : va;
        vb = vb == null ? -Infinity : vb;
        return (va - vb) * mult;
      });
      return list;
    }

    function renderDeBody(query) {
      if (!deRows) return;
      var isSearch = query && query.length > 0;
      var list;
      if (isSearch) {
        var q = query.toLowerCase();
        list = deRows.filter(function (p) {
          return (p.gemeinde_name && p.gemeinde_name.toLowerCase().indexOf(q) !== -1) ||
                 (p.gemeinde_typ && p.gemeinde_typ.toLowerCase().indexOf(q) !== -1);
        });
      } else {
        list = deRows.filter(function (p) { return p.haushalte >= DE_TOP_MIN_HAUSHALTE; });
      }
      sortDeRows(list);

      var total = list.length;
      var shown = isSearch ? list.slice(0, DE_SEARCH_MAX_RESULTS) : list.slice(0, DE_TOP_N);
      tbody.innerHTML = shown.map(deRowHtml).join("");

      if (!isSearch) {
        countEl.textContent = "Top " + DE_TOP_N + " von " + total + " Gemeinden ab " +
          DE_TOP_MIN_HAUSHALTE.toLocaleString("de-DE") + " Haushalten (bundesweit " + deRows.length + " Gemeinden)";
      } else if (total > DE_SEARCH_MAX_RESULTS) {
        countEl.textContent = "Zeige die ersten " + DE_SEARCH_MAX_RESULTS + " von " + total + " Treffern – Suche weiter eingrenzen";
      } else {
        countEl.textContent = total + " von " + deRows.length + " Gemeinden gefunden";
      }
    }

    // ---------------------------------------------------------------
    // Länder-Tabelle (nur im Deutschland-Modus sichtbar) – 16 Zeilen, immer
    // vollständig angezeigt, nur sortierbar (kein Top N, keine Suche nötig).
    // ---------------------------------------------------------------
    function landRowHtml(l) {
      return "<tr>" + LAND_COLUMNS.map(function (c) {
        var v = l[c.field];
        if (c.type === "num") {
          return "<td data-sort=\"" + (v == null ? "" : v) + "\">" + fmtDe(v, c.decimals) + "</td>";
        }
        return "<td>" + (v == null ? "" : v) + "</td>";
      }).join("") + "</tr>";
    }

    function renderLandHead() {
      if (!landThead) return;
      landThead.innerHTML = LAND_COLUMNS.map(function (c) {
        var cls = c.field === landSort.field ? (landSort.dir === "asc" ? " class=\"sorted-asc\"" : " class=\"sorted-desc\"") : "";
        return "<th data-type=\"" + c.type + "\" data-field=\"" + c.field + "\"" + cls + ">" + c.label + "</th>";
      }).join("");
      Array.prototype.forEach.call(landThead.querySelectorAll("th"), function (th) {
        th.onclick = function () {
          var field = th.getAttribute("data-field");
          landSort.dir = landSort.field === field && landSort.dir === "desc" ? "asc" : "desc";
          landSort.field = field;
          renderLandHead();
          renderLandBody();
        };
      });
    }

    function renderLandBody() {
      if (!landTbody || !landRows) return;
      var field = landSort.field, dir = landSort.dir, mult = dir === "asc" ? 1 : -1;
      var col = LAND_COLUMNS.filter(function (c) { return c.field === field; })[0];
      var list = landRows.slice();
      list.sort(function (a, b) {
        var va = a[field], vb = b[field];
        if (col && col.type === "text") {
          return (va || "").localeCompare(vb || "", "de") * mult;
        }
        va = va == null ? -Infinity : va;
        vb = vb == null ? -Infinity : vb;
        return (va - vb) * mult;
      });
      landTbody.innerHTML = list.map(landRowHtml).join("");
    }

    function activateDeMode(rows) {
      mode = "de";
      // Pro AGS kann die Rohliste doppelte Einträge enthalten (mehrteilige
      // Geometrien, z. B. Exklaven) – für Top 10 und Suche wird jede
      // Gemeinde genau einmal gebraucht.
      var seen = {};
      deRows = rows.filter(function (p) {
        if (seen[p.ags]) return false;
        seen[p.ags] = true;
        return true;
      });
      deSort = { field: "balkon_pro_100_haushalte", dir: "desc" };
      searchEl.value = "";
      searchEl.placeholder = "Gemeinde deutschlandweit suchen…";
      if (headingEl) headingEl.textContent = "Balkonkraftwerke: Top 10 bundesweit";
      if (introEl) {
        introEl.innerHTML = "Die zehn Gemeinden ab " + DE_TOP_MIN_HAUSHALTE.toLocaleString("de-DE") +
          " Haushalten mit der höchsten Balkonkraftwerke-Dichte je 100 Haushalte, " +
          "bundesweit (kleinere Orte ausgeklammert, da einzelne Anlagen dort die Quote " +
          "stark verzerren). Über die Suche lässt sich jede der rund 11.000 deutschen " +
          "Gemeinden finden, unabhängig von dieser Grenze.";
      }
      if (bbNotesEl) bbNotesEl.hidden = true;
      if (deNotesEl) deNotesEl.hidden = false;

      renderDeHead();
      renderDeBody("");
      searchEl.oninput = function () { renderDeBody(searchEl.value.trim()); };

      landRows = computeLandRows(deRows);
      landSort = { field: "balkon_pro_100_haushalte", dir: "desc" };
      renderLandHead();
      renderLandBody();
      if (landerSectionEl) landerSectionEl.hidden = false;
    }

    // ---------------------------------------------------------------
    initBrandenburg();
    bbTheadHtml = thead.innerHTML;
    bbTbodyHtml = tbody.innerHTML;

    window.SolarpotenzialTable = {
      showDe: activateDeMode,
      restoreBrandenburg: restoreBrandenburgMode
    };
  });
})();
