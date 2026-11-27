// The Pro waitlist form: does what the app's WaitlistService.submitEmail does, a POST of
// {"email": ...} as plain text to the same URL (data-endpoint), which adds the address
// to the table. A plain-text POST is a "simple" request, so the browser sends it
// straight away (no preflight), as Google Apps Script web apps need. As in the app, the
// request reaching the server counts as done. Until the URL is set (it still says
// YOUR_FORM_ENDPOINT), the button opens an email to us instead.
(function () {
  var form = document.querySelector('[data-waitlist]');
  if (!form) return;
  var input = form.querySelector('input[type=email]');
  var button = form.querySelector('button');
  var note = document.querySelector('[data-waitlist-note]');
  var endpoint = form.getAttribute('data-endpoint') || '';
  var t = JSON.parse(form.getAttribute('data-text'));
  var KEY = 'preciosa_pro_waitlist';

  function done() {
    button.textContent = t.done;
    button.classList.add('is-done');
    button.disabled = true;
    input.disabled = true;
    note.textContent = t.thanks;
    note.classList.remove('is-error');
  }

  try { if (localStorage.getItem(KEY)) done(); } catch (e) { /* storage off */ }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var email = input.value.trim();
    // The app's check: not empty and has an @ (plus the browser's email check)
    if (!email || email.indexOf('@') < 1 || !input.checkValidity()) {
      note.textContent = t.invalid;
      note.classList.add('is-error');
      input.focus();
      return;
    }

    if (!/^https:\/\//.test(endpoint)) {
      window.location.href = 'mailto:preciosai.app@gmail.com?subject=' +
        encodeURIComponent(t.subject) + '&body=' + encodeURIComponent(email);
      return;
    }

    button.disabled = true;
    button.textContent = t.sending;
    fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ email: email }),
    }).then(function () {
      try { localStorage.setItem(KEY, '1'); } catch (e) { /* storage off */ }
      done();
    }).catch(function () {
      button.disabled = false;
      button.textContent = t.notify;
      note.textContent = t.failed;
      note.classList.add('is-error');
    });
  });
})();
