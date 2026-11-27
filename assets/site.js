// Preciosa landing: the hero's camera screen playing a shoot by itself, and the
// "try it" mini shoot. Texts come from the page (#site-text), so one script serves
// every language.
(function () {
  // The language menu closes on a tap anywhere else
  var langMenu = document.querySelector('.lang-menu');
  if (langMenu) {
    document.addEventListener('click', function (ev) {
      if (langMenu.open && !langMenu.contains(ev.target)) langMenu.open = false;
    });
  }

  var dataEl = document.getElementById('site-text');
  if (!dataEl) return;
  var text = JSON.parse(dataEl.textContent);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var steps = text.steps;
  var POSE_STEP = 2; // the confident pose once the model is asked for it

  // Preload the pose shown after the pose hint
  new Image().src = '/assets/model-after.webp';

  // The frame before each hint, in the app's order: the phone tilted down (the model
  // seen at a slant), too close, the awkward pose, the phone too high
  function frameFor(step) {
    var tilted = step < 1, close = step < 2, high = step < 4;
    return (tilted ? 'perspective(600px) rotateX(14deg) ' : '') +
      'scale(' + (close ? 1.2 : 1) + ') translateY(' + (high ? (close ? '-4%' : '-14%') : '0') + ')';
  }

  // One camera screen (the hero's or the game's): shows the frame as it is before
  // hint number `step` (steps.length: all done, the frame matches)
  function screen(root) {
    var person = root.querySelector('.person');
    var frame = root.querySelector('.frame');
    var capsule = root.querySelector('.capsule i');
    var model = root.querySelector('[data-model]');
    var flash = root.querySelector('.flash');
    return {
      hint: root.querySelector('[data-hint]'),
      show: function (step) {
        person.style.transform = frameFor(step);
        capsule.style.transform = 'rotate(' + (step < 1 ? 9 : 0) + 'deg)'; // levels once the phone is tilted
        frame.classList.toggle('is-ok', step >= steps.length);
        var posed = step > POSE_STEP;
        model.src = posed ? '/assets/model-after.webp' : '/assets/model-before.webp';
        model.width = posed ? 138 : 81;
      },
      flash: function () {
        flash.classList.remove('is-on');
        void flash.offsetWidth;
        flash.classList.add('is-on');
      },
    };
  }

  var QUOTES = { en: ['“', '”'], ru: ['«', '»'], es: ['«', '»'], de: ['„', '“'], pt: ['“', '”'] };
  function quoted(say) {
    var q = QUOTES[text.quotes] || QUOTES.en;
    return q[0] + say + q[1];
  }

  // Hero: the camera screen goes through the hints by itself, the voice line and the
  // level below it in step; with reduced motion it stays on the matched frame
  var heroRoot = document.getElementById('hero-phone');
  var voice = document.querySelector('[data-voice]');
  var levelDot = document.querySelector('[data-level-dot]');
  var levelVal = document.querySelector('[data-level-val]');
  var loop = text.heroLoop || [];
  var HERO_STEP_MS = 1700; // how long each hint stays on the hero screen
  if (heroRoot && loop.length && !reduce) {
    var hero = screen(heroRoot);
    var i = -1;
    var tick = function () {
      i = (i + 1) % loop.length;
      var item = loop[i];
      hero.show(Math.min(i, steps.length));
      hero.hint.textContent = item.say;
      if (item.say === text.capturing) hero.flash();
      if (voice) {
        voice.style.opacity = 0;
        setTimeout(function () {
          voice.textContent = quoted(item.say);
          voice.style.opacity = 1;
        }, 250);
      }
      if (levelDot) levelDot.style.transform = 'translateX(' + item.tilt * 4 + 'px)';
      if (levelVal) levelVal.textContent = item.tilt.toFixed(1) + '°';
    };
    tick();
    var timer = setInterval(tick, HERO_STEP_MS);
    // Paused when the tab is hidden, so it does not run on in the background
    document.addEventListener('visibilitychange', function () {
      clearInterval(timer);
      if (!document.hidden) timer = setInterval(tick, HERO_STEP_MS);
    });
  }

  // Phone: the Google Play button pinned to the bottom of the screen once the first
  // screen's button is scrolled away, until the closing button comes into view (on a
  // wide screen CSS keeps it hidden)
  var sticky = document.querySelector('[data-sticky-get]');
  var heroGet = document.querySelector('.hero .btn--light');
  var ctaGet = document.querySelector('.cta .btn--light');
  if (sticky && heroGet && ctaGet) {
    var stickyOn = false, queued = false;
    var updateSticky = function () {
      queued = false;
      var on = heroGet.getBoundingClientRect().bottom < 0 &&
        ctaGet.getBoundingClientRect().top > window.innerHeight - 90;
      if (on === stickyOn) return;
      stickyOn = on;
      sticky.classList.toggle('is-shown', on);
      sticky.setAttribute('aria-hidden', on ? 'false' : 'true');
      sticky.tabIndex = on ? 0 : -1;
    };
    window.addEventListener('scroll', function () {
      if (!queued) { queued = true; requestAnimationFrame(updateSticky); }
    }, { passive: true });
    window.addEventListener('resize', updateSticky);
    updateSticky();
  }

  // Try it: the hints to follow, then the shot
  var root = document.getElementById('try-phone');
  if (!root) return;
  var game = screen(root);
  var counter = root.querySelector('[data-counter]');
  var shot = root.querySelector('.shot');
  var wrong = document.querySelector('[data-wrong]');
  var step = 0;
  var buttons = document.querySelectorAll('[data-answer]');

  function render() {
    var done = step >= steps.length;
    game.show(step);
    game.hint.textContent = done ? text.capturing : steps[step].say;
    game.hint.parentNode.hidden = done;
    counter.textContent = (done ? steps.length : step + 1) + ' / ' + steps.length;
    // Light up the button the current hint asks for
    buttons.forEach(function (btn) {
      btn.classList.toggle('is-next', !done && btn.getAttribute('data-answer') === steps[step].answer);
    });
    shot.hidden = !done;
    if (done) {
      game.flash();
      shot.querySelector('button').focus();
    }
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (step >= steps.length) return;
      if (btn.getAttribute('data-answer') === steps[step].answer) {
        step += 1;
        wrong.textContent = '';
        render();
      } else {
        wrong.textContent = text.wrong;
      }
    });
  });

  shot.querySelector('button').addEventListener('click', function () {
    step = 0;
    wrong.textContent = '';
    render();
  });

  render();
})();
