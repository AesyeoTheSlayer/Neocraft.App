(function () {
  'use strict';

  var frame = document.querySelector('[data-client-frame]');
  var setup = document.querySelector('[data-client-setup]');
  var stage = document.querySelector('[data-client-stage]');
  var chooseJarButton = document.querySelector('[data-client-choose-jar]');
  var audioButton = document.querySelector('[data-client-audio]');
  var reloadButton = document.querySelector('[data-client-reload]');
  var status = document.querySelector('[data-client-status]');
  var runtimeObserver;
  var runtimeDocument;
  var launchStarted = false;
  var connectAttempts = 0;

  if (!frame) return;


  function setStatus(message, state) {
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state || '';
  }

  function runtimeElement(selector) {
    return runtimeDocument ? runtimeDocument.querySelector(selector) : null;
  }

  function showSetup() {
    launchStarted = false;
    if (setup) setup.hidden = false;
    if (stage) {
      stage.hidden = true;
      stage.classList.remove('is-starting');
    }
    if (chooseJarButton) chooseJarButton.disabled = false;
    if (audioButton) audioButton.hidden = true;
    setStatus('Waiting for a compatible local JAR.');
  }

  function startClient() {
    if (launchStarted) return;
    var continueButton = runtimeElement('#bootstrap-continue');
    if (!continueButton) return;

    launchStarted = true;
    setStatus('Verified. Starting ZephyrCraft…', 'ready');
    if (chooseJarButton) chooseJarButton.disabled = true;
    if (setup) setup.hidden = true;
    if (stage) {
      stage.hidden = false;
      stage.classList.add('is-starting');
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (frame.contentWindow) frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('resize'));
        continueButton.click();
        frame.focus();
        window.setTimeout(function () {
          if (stage) stage.classList.remove('is-starting');
          syncRuntime();
        }, 450);
      });
    });
  }

  function syncRuntime() {
    if (!runtimeDocument) return;
    var body = runtimeDocument.body;
    var bootStatus = runtimeElement('#boot-status');
    var jarInput = runtimeElement('#alpha-client-jar');
    var audioInput = runtimeElement('#alpha-audio-resources');

    if (!launchStarted && bootStatus && bootStatus.textContent.trim()) {
      setStatus(bootStatus.textContent.trim(), body.classList.contains('game-ready') ? 'ready' : '');
    }

    if (chooseJarButton) chooseJarButton.disabled = !jarInput || launchStarted;
    if (audioButton) audioButton.hidden = !audioInput || audioInput.classList.contains('loaded');

    if (body.classList.contains('game-ready')) startClient();
  }

  function connectRuntime() {
    connectAttempts += 1;
    try {
      runtimeDocument = frame.contentDocument;
    } catch (error) {
      runtimeDocument = null;
    }

    if (!runtimeDocument || !runtimeDocument.body || !runtimeElement('#alpha-client-jar')) {
      if (connectAttempts < 80) {
        window.setTimeout(connectRuntime, 125);
      } else {
        setStatus('The client did not finish loading. Restart setup and try again.', 'error');
      }
      return;
    }

    if (runtimeObserver) runtimeObserver.disconnect();
    runtimeObserver = new MutationObserver(syncRuntime);
    runtimeObserver.observe(runtimeDocument.body, { attributes: true, childList: true, subtree: true, characterData: true });

    var jarInput = runtimeElement('#alpha-client-jar');
    jarInput.addEventListener('change', function () {
      setStatus(jarInput.files && jarInput.files.length ? 'Checking the selected JAR…' : 'No file selected.');
      window.setTimeout(syncRuntime, 0);
    });
    syncRuntime();
  }

  if (chooseJarButton) {
    chooseJarButton.addEventListener('click', function () {
      var jarInput = runtimeElement('#alpha-client-jar');
      if (!jarInput) {
        setStatus('The client is still loading. Try again in a moment.');
        return;
      }
      jarInput.click();
    });
  }

  if (audioButton) {
    audioButton.addEventListener('click', function () {
      var audioInput = runtimeElement('#alpha-audio-resources');
      if (audioInput) audioInput.click();
    });
  }

  if (reloadButton) {
    reloadButton.addEventListener('click', function () { location.reload(); });
  }

  frame.addEventListener('load', function () {
    connectAttempts = 0;
    connectRuntime();
  });

  showSetup();
  frame.src = 'client-build/index.html';
})();
