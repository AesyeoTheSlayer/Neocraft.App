(function () {
  'use strict';

  var acknowledgementKey = 'neocraft-test-warning-ack-v1';
  var openButtons = document.querySelectorAll('[data-test-disclaimer-open]');
  var requiresAcknowledgement = document.body.hasAttribute('data-require-test-ack');
  var acknowledged = false;
  try { acknowledged = sessionStorage.getItem(acknowledgementKey) === 'yes'; } catch (error) {}
  if (!openButtons.length && !requiresAcknowledgement) return;

  var dialog = document.createElement('dialog');
  dialog.className = 'test-warning-dialog';
  dialog.setAttribute('aria-labelledby', 'test-warning-title');
  dialog.innerHTML =
    '<form class="test-warning-dialog__panel" data-test-warning-form>' +
      '<span class="test-warning-dialog__flag">Unfinished test software</span>' +
      '<h2 id="test-warning-title">Stop and read this before playing.</h2>' +
      '<p class="test-warning-dialog__lead">ZephyrCraft is currently an early test build—not a finished release.</p>' +
      '<ul>' +
        '<li>Crashes, broken behavior, graphical problems, and major bugs are expected.</li>' +
        '<li>Test worlds may become corrupted, incompatible, or disappear.</li>' +
        '<li>Performance, controls, sound, and browser support are still being tested.</li>' +
        '<li>You should actively look for problems and report anything unusual.</li>' +
      '</ul>' +
      '<label class="test-warning-dialog__check"><input type="checkbox" required><span>I understand this is unfinished test software and I should use disposable worlds.</span></label>' +
      '<div class="test-warning-dialog__actions"><button class="btn btn--ghost" type="button" data-test-warning-cancel>Go back</button><button class="btn btn--primary" type="submit">I understand — continue</button></div>' +
    '</form>';
  document.body.appendChild(dialog);

  var destination = 'client.html';
  function openWarning(url) {
    destination = url || 'client.html';
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  openButtons.forEach(function (button) {
    button.addEventListener('click', function () { openWarning(button.dataset.clientHref); });
  });

  dialog.querySelector('[data-test-warning-cancel]').addEventListener('click', function () {
    dialog.close();
    if (requiresAcknowledgement) {
      if (history.length > 1) history.back();
      else location.href = 'testing.html';
    }
  });

  dialog.querySelector('[data-test-warning-form]').addEventListener('submit', function (event) {
    event.preventDefault();
    try { sessionStorage.setItem(acknowledgementKey, 'yes'); } catch (error) {}
    dialog.close();
    if (!requiresAcknowledgement || location.pathname.split('/').pop() !== 'client.html') location.href = destination;
  });

  if (requiresAcknowledgement && !acknowledged) openWarning('client.html');
})();
