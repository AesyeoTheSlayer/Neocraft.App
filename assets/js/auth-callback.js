(function () {
  'use strict';

  var auth = window.NeoCraftAuth;
  var title = document.querySelector('[data-callback-title]');
  var copy = document.querySelector('[data-callback-copy]');
  var actions = document.querySelector('[data-callback-actions]');
  var passwordForm = document.querySelector('[data-password-update]');
  var output = document.querySelector('[data-callback-message]');
  var recovery = new URLSearchParams(location.search).get('mode') === 'recovery';

  function authErrorFromUrl() {
    var query = new URLSearchParams(location.search);
    var hash = new URLSearchParams(location.hash.replace(/^#/, ''));
    return hash.get('error_description') || query.get('error_description') || hash.get('error') || query.get('error');
  }

  function delay(milliseconds) {
    return new Promise(function (resolve) { window.setTimeout(resolve, milliseconds); });
  }

  async function waitForSession() {
    for (var attempt = 0; attempt < 12; attempt += 1) {
      var currentSession = await auth.session();
      if (currentSession) return currentSession;
      await delay(125);
    }
    return null;
  }

  function fail(message) {
    title.textContent = 'The account link could not be completed.';
    copy.textContent = message || 'The link may have expired. Request a new one from the account page.';
    actions.hidden = false;
  }

  async function initialize() {
    if (!auth || !auth.isConfigured()) {
      fail('The NeoCraft account service is not connected yet.');
      return;
    }

    var urlError = authErrorFromUrl();
    if (urlError) {
      fail(urlError);
      return;
    }

    try {
      var currentSession = await waitForSession();
      if (!currentSession) {
        fail('The link is invalid or has expired. Request a new email from the account page.');
        return;
      }
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
      if (recovery) {
        title.textContent = 'Choose a new password.';
        copy.textContent = 'Use at least 8 characters and do not reuse your Microsoft password.';
        passwordForm.hidden = false;
      } else {
        title.textContent = 'Email confirmed.';
        copy.textContent = 'Your NeoCraft account is ready. Testing access may still require manual approval.';
        actions.hidden = false;
      }
    } catch (error) {
      fail(error.message);
    }
  }

  passwordForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    var button = passwordForm.querySelector('button');
    button.disabled = true;
    output.textContent = '';
    try {
      var data = new FormData(passwordForm);
      if (String(data.get('password')) !== String(data.get('password_confirm'))) {
        throw new Error('The passwords do not match.');
      }
      var result = await auth.getClient().auth.updateUser({ password: String(data.get('password')) });
      if (result.error) throw result.error;
      passwordForm.hidden = true;
      title.textContent = 'Password updated.';
      copy.textContent = 'You can now continue to your NeoCraft account.';
      actions.hidden = false;
    } catch (error) {
      output.textContent = error.message || 'The password could not be updated.';
      output.dataset.type = 'error';
    } finally {
      button.disabled = false;
    }
  });

  initialize();
})();
