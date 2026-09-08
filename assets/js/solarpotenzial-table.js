/* Sortier- und Filterlogik fuer die Gemeindetabelle (keine Abhaengigkeiten) */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var table = document.getElementById("gemeinden-table");
    if (!table) return;
    var tbody = table.querySelector("tbody");
    var rows = Array.prototype.slice.call(tbody.querySelectorAll("tr"));
    var headers = table.querySelectorAll("th");
    var countEl = document.getElementById("table-count");
    var searchEl = document.getElementById("table-search");

    // Zahlen deutsch formatieren (Anzeige), Rohwert bleibt in data-sort erhalten
    rows.forEach(function (row) {
      Array.prototype.forEach.call(row.children, function (td) {
        if (td.hasAttribute("data-sort")) {
          var raw = parseFloat(td.getAttribute("data-sort"));
          if (!isNaN(raw)) {
            var text = td.textContent.trim();
            var num = parseFloat(text.replace(",", "."));
            if (!isNaN(num)) {
              var digits = /\./.test(text) === false && Math.abs(num) < 1000 && td.cellIndex === headers.length - 1 ? 1 : 0;
              td.textContent = num.toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits });
            }
          }
        }
      });
    });

    function updateCount() {
      var visible = rows.filter(function (r) { return r.style.display !== "none"; }).length;
      countEl.textContent = visible + " von " + rows.length + " Gemeinden";
    }

    function applyFilter() {
      var q = searchEl.value.trim().toLowerCase();
      rows.forEach(function (row) {
        var text = row.textContent.toLowerCase();
        row.style.display = q === "" || text.indexOf(q) !== -1 ? "" : "none";
      });
      updateCount();
    }

    searchEl.addEventListener("input", applyFilter);

    var currentSort = { index: headers.length - 1, dir: "desc" };

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
      th.addEventListener("click", function () {
        var dir = currentSort.index === index && currentSort.dir === "desc" ? "asc" : "desc";
        currentSort = { index: index, dir: dir };
        headers.forEach(function (h) { h.classList.remove("sorted-asc", "sorted-desc"); });
        th.classList.add(dir === "asc" ? "sorted-asc" : "sorted-desc");
        sortBy(index, th.getAttribute("data-type"), dir);
      });
    });

    // initiale Sortierung: Ausschoepfung absteigend
    sortBy(currentSort.index, "num", currentSort.dir);
    updateCount();
  });
})();
