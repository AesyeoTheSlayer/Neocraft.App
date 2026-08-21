(function () {
  'use strict';

  var auth = window.NeoCraftAuth;
  var configPanel = document.querySelector('[data-account-config]');
  var authPanel = document.querySelector('[data-account-auth]');
  var dashboard = document.querySelector('[data-account-dashboard]');
  var signInForm = document.querySelector('[data-account-signin]');
  var signUpForm = document.querySelector('[data-account-signup]');
  var resetForm = document.querySelector('[data-account-reset]');
  var requestedMode = new URLSearchParams(location.search).get('mode') === 'signup' ? 'signup' : 'signin';
  var nextPage = auth.safeNext(new URLSearchParams(location.search).get('next'), 'account.html');

  function message(element, text, type) {
    if (!element) return;
    element.textContent = text || '';
    element.dataset.type = type || '';
  }

  function setBusy(form, busy) {
    var button = form && form.querySelector('button[type="submit"]');
    if (!button) return;
    button.disabled = busy;
    if (!button.dataset.label) button.dataset.label = button.textContent;
    button.textContent = busy ? 'Please wait…' : button.dataset.label;
  }

  function showForm(name) {
    signInForm.hidden = name !== 'signin';
    signUpForm.hidden = name !== 'signup';
    resetForm.hidden = name !== 'reset';
  }

  function issueStatusLabel(value) {
    return String(value || 'new').replace(/_/g, ' ').replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }

  async function showIssues() {
    var container = document.querySelector('[data-account-issues]');
    if (!container) return;
    try {
      var result = await auth.getClient().from('issues').select('issue_number,title,status,created_at').order('created_at', { ascending: false }).limit(6);
      if (result.error) throw result.error;
      container.innerHTML = '';
      if (!result.data.length) {
        var empty = document.createElement('p');
        empty.textContent = 'You have not submitted any issue reports yet.';
        container.appendChild(empty);
        return;
      }
      result.data.forEach(function (issue) {
        var row = document.createElement('div');
        row.className = 'account-issue-row';
        var reference = document.createElement('span');
        reference.textContent = 'NC-' + String(issue.issue_number).padStart(5, '0');
        var title = document.createElement('strong');
        title.textContent = issue.title;
        var state = document.createElement('small');
        state.textContent = issueStatusLabel(issue.status);
        state.dataset.status = issue.status;
        row.append(reference, title, state);
        container.appendChild(row);
      });
    } catch (error) {
      container.innerHTML = '<p>Your issue history will appear here after the updated database setup is connected.</p>';
    }
  }

  async function showDashboard(session) {
    authPanel.hidden = true;
    dashboard.hidden = false;
    var user = session.user;
    document.querySelector('[data-account-email]').textContent = user.email || '';

    try {
      var profile = await auth.profile(user.id);
      var displayName = profile && profile.display_name ? profile.display_name : (user.user_metadata.display_name || 'Your account');
      document.querySelector('[data-account-name]').textContent = displayName;
      await showIssues();

      if (nextPage !== 'account.html') {
        var nextLink = document.querySelector('[data-account-actions] a');
        if (nextLink) nextLink.href = nextPage;
      }
    } catch (error) {
      document.querySelector('[data-account-name]').textContent = user.user_metadata.display_name || 'Your account';
      await showIssues();
    }
  }

  async function initialize() {
    if (!auth || !auth.isConfigured()) {
      configPanel.hidden = false;
      authPanel.hidden = false;
      showForm(requestedMode);
      return;
    }

    authPanel.hidden = false;
    showForm(requestedMode);
    try {
      var currentSession = await auth.session();
      if (currentSession) await showDashboard(currentSession);
    } catch (error) {
      message(document.querySelector('[data-signin-message]'), error.message, 'error');
    }
  }

  document.querySelector('[data-account-show-reset]').addEventListener('click', function () { showForm('reset'); });
  document.querySelector('[data-account-back-signin]').addEventListener('click', function () { showForm('signin'); });

  signInForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    var output = document.querySelector('[data-signin-message]');
    if (!auth.isConfigured()) { message(output, 'Connect the account service before testing sign-in.', 'error'); return; }
    message(output, '');
    setBusy(signInForm, true);
    try {
      var data = new FormData(signInForm);
      var result = await auth.getClient().auth.signInWithPassword({
        email: String(data.get('email')).trim(),
        password: String(data.get('password'))
      });
      if (result.error) throw result.error;
      if (nextPage !== 'account.html') {
        location.href = nextPage;
        return;
      }
      await showDashboard(result.data.session);
    } catch (error) {
      message(output, error.message || 'Sign-in failed.', 'error');
    } finally {
      setBusy(signInForm, false);
    }
  });

  signUpForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    var output = document.querySelector('[data-signup-message]');
    if (!auth.isConfigured()) { message(output, 'Connect the account service before testing registration.', 'error'); return; }
    message(output, '');
    setBusy(signUpForm, true);
    try {
      var data = new FormData(signUpForm);
      if (String(data.get('password')) !== String(data.get('password_confirm'))) {
        throw new Error('The passwords do not match.');
      }
      var result = await auth.getClient().auth.signUp({
        email: String(data.get('email')).trim(),
        password: String(data.get('password')),
        options: {
          data: { display_name: String(data.get('display_name')).trim() },
          emailRedirectTo: auth.siteUrl('auth-callback.html')
        }
      });
      if (result.error) throw result.error;
      signUpForm.reset();
      message(output, 'Account created. Check your email and use the confirmation link to finish setup.', 'success');
    } catch (error) {
      message(output, error.message || 'Account creation failed.', 'error');
    } finally {
      setBusy(signUpForm, false);
    }
  });

  resetForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    var output = document.querySelector('[data-reset-message]');
    if (!auth.isConfigured()) { message(output, 'Connect the account service before testing password reset.', 'error'); return; }
    message(output, '');
    setBusy(resetForm, true);
    try {
      var data = new FormData(resetForm);
      var result = await auth.getClient().auth.resetPasswordForEmail(String(data.get('email')).trim(), {
        redirectTo: auth.siteUrl('auth-callback.html?mode=recovery')
      });
      if (result.error) throw result.error;
      message(output, 'If an account exists for that address, a reset link has been sent.', 'success');
    } catch (error) {
      message(output, error.message || 'The reset request failed.', 'error');
    } finally {
      setBusy(resetForm, false);
    }
  });

  document.querySelector('[data-account-signout]').addEventListener('click', async function () {
    await auth.getClient().auth.signOut();
    dashboard.hidden = true;
    authPanel.hidden = false;
    signInForm.reset();
    showForm('signin');
  });

  initialize();
})();
