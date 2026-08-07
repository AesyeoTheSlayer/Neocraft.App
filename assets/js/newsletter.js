(function () {
  'use strict';

  var form = document.querySelector('[data-newsletter-form]');
  if (!form) return;

  var endpoint = form.getAttribute('data-newsletter-endpoint');
  if (!endpoint) return;

  var email = form.querySelector('input[type="email"]');
  var button = form.querySelector('button[type="submit"]');
  var status = form.querySelector('[data-newsletter-status]');
  var frame = document.querySelector('.newsletter-response-frame');
  var submitted = false;
  var completed = false;

  form.action = endpoint;
  email.disabled = false;
  button.disabled = false;
  status.textContent = 'A confirmation email will be sent after you sign up.';

  function showComplete() {
    if (!submitted || completed) return;
    completed = true;
    email.value = '';
    form.classList.add('is-submitted');
    status.textContent = 'Check your inbox. You will be sent an email to confirm your subscription.';
    status.focus();
  }

  form.addEventListener('submit', function () {
    if (!form.checkValidity()) return;
    submitted = true;
    completed = false;
    button.disabled = true;
    button.textContent = 'Signing up...';
    status.textContent = 'Submitting your email securely...';
    setTimeout(showComplete, 2500);
  });

  if (frame) frame.addEventListener('load', showComplete);
})();
