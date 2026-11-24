// Formular-Filter auf /do-it-yourself/ (Markup: _includes/diy-filter.html).
// Kein Framework: Buttons setzen aria-pressed, beim Abschicken werden die
// Karten über ihre data-match-on/-off-Attribute ein- oder ausgeblendet.
// Die Auswahl steht im URL-Hash, damit „Zurück“ von einer Unterseite
// wieder die gefilterte Ansicht zeigt.
(function () {
  var form = document.querySelector('[data-diy-filter]');
  var dataEl = document.getElementById('diy-filter-data');
  if (!form || !dataEl) return;

  var data = JSON.parse(dataEl.textContent);
  var cards = [].slice.call(document.querySelectorAll('[data-diy-card]'));
  var result = document.querySelector('[data-diy-result]');
  var resultText = document.querySelector('[data-diy-result-text]');
  var submit = form.querySelector('[type="submit"]');
  var reset = form.querySelector('[type="reset"]');
  var state = { place: null, sub: [], grid: null };

  function buttons(group) {
    return [].slice.call(form.querySelectorAll('[data-group="' + group + '"]'));
  }

  function subStep() {
    return state.place && form.querySelector('[data-sub-for="' + state.place + '"]');
  }

  function render() {
    ['place', 'sub', 'grid'].forEach(function (group) {
      buttons(group).forEach(function (b) {
        var v = b.getAttribute('data-value');
        var on = group === 'sub' ? state.sub.indexOf(v) !== -1 : state[group] === v;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    });
    [].forEach.call(form.querySelectorAll('[data-sub-for]'), function (step) {
      step.hidden = step.getAttribute('data-sub-for') !== state.place;
    });
    submit.disabled = !(state.place && state.grid && (!subStep() || state.sub.length));
  }

  form.addEventListener('click', function (e) {
    var b = e.target.closest('[data-group]');
    if (!b) return;
    var group = b.getAttribute('data-group');
    var v = b.getAttribute('data-value');

    if (group === 'place') {
      if (state.place !== v) state.sub = [];
      state.place = v;
    } else if (group === 'grid') {
      state.grid = v;
    } else {
      var i = state.sub.indexOf(v);
      if (i !== -1) {
        state.sub.splice(i, 1);
      } else if (b.hasAttribute('data-exclusive')) {
        state.sub = [v];
      } else {
        state.sub = state.sub.filter(function (s) {
          return !form.querySelector('[data-value="' + s + '"][data-exclusive]');
        });
        state.sub.push(v);
      }
    }
    render();
  });

  function apply() {
    var places = state.sub.length ? state.sub : [state.place];
    var shown = [];

    cards.forEach(function (card) {
      var matches = (card.getAttribute('data-match-' + state.grid) || '').split(' ');
      var hit = places.some(function (p) { return matches.indexOf(p) !== -1; });
      card.classList.toggle('is-category-hidden', !hit);
      if (hit) shown.push(card.getAttribute('data-diy-card'));
    });

    // Passt keine Karte, erklärt ein Hinweis, warum – statt einer Ersatzkarte.
    var sentences;
    if (shown.length) {
      var names = shown.map(function (s) { return data.titles[s]; });
      sentences = places.map(function (p) { return data.place[p]; }).concat(
        data.grid[state.grid],
        (names.length > 1 ? 'Für dich kommen infrage: ' : 'Für dich kommt infrage: ') + names.join(', ') + '.'
      );
    } else {
      sentences = [data.empty];
    }
    resultText.innerHTML = '';
    sentences.forEach(function (text) {
      var p = document.createElement('p');
      p.textContent = text;
      resultText.appendChild(p);
    });
    result.hidden = false;
    reset.hidden = false;

    history.replaceState(null, '', '#auswahl=' + [state.place, state.sub.join('+'), state.grid].join('/'));
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    apply();
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  form.addEventListener('reset', function (e) {
    e.preventDefault();
    state = { place: null, sub: [], grid: null };
    cards.forEach(function (card) { card.classList.remove('is-category-hidden'); });
    result.hidden = true;
    reset.hidden = true;
    history.replaceState(null, '', location.pathname);
    render();
  });

  // Auswahl aus dem URL-Hash wiederherstellen (z. B. nach „Zurück“).
  var m = location.hash.match(/^#auswahl=([\w-]+)\/([\w+-]*)\/(on|off)$/);
  if (m && form.querySelector('[data-group="place"][data-value="' + m[1] + '"]')) {
    state.place = m[1];
    state.sub = m[2] ? m[2].split('+').filter(function (s) { return s in data.place; }) : [];
    state.grid = m[3];
    render();
    if (!submit.disabled) apply();
  }

  form.hidden = false;
  render();
})();
