(function () {
  'use strict';

  var form = document.querySelector('[data-issue-form]');
  if (!form) return;

  var auth = window.NeoCraftAuth;
  var storageKey = 'neocraft-issue-report-draft-v1';
  var status = document.querySelector('[data-report-status]');
  var saveState = document.querySelector('[data-report-save-state]');
  var submitButton = document.querySelector('[data-report-submit]');
  var success = document.querySelector('[data-report-success]');
  var saveTimer;

  function configured() {
    return Boolean(auth && auth.isConfigured && auth.isConfigured());
  }

  function setStatus(text, type) {
    status.textContent = text || '';
    status.className = 'application-form-status' + (type ? ' is-' + type : '');
  }

  function serialize() {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name || field.name.charAt(0) === '_' || field.type === 'hidden') return;
      if (field.type === 'checkbox') data[field.name] = field.checked;
      else data[field.name] = field.value;
    });
    return data;
  }

  function saveDraft() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(serialize()));
      saveState.textContent = 'Draft saved locally';
    } catch (error) {
      saveState.textContent = 'Could not save draft';
    }
  }

  function restoreDraft() {
    try {
      var draft = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!draft) return;
      Array.prototype.forEach.call(form.elements, function (field) {
        if (!field.name || !(field.name in draft)) return;
        if (field.type === 'checkbox') field.checked = Boolean(draft[field.name]);
        else if (field.type !== 'hidden') field.value = draft[field.name] || '';
      });
      saveState.textContent = 'Saved draft restored';
    } catch (error) {}
  }

  function clearDraft(resetForm) {
    localStorage.removeItem(storageKey);
    if (resetForm) form.reset();
    saveState.textContent = 'Draft cleared';
    setStatus('');
  }

  async function currentSession() {
    if (!configured()) return null;
    try { return await auth.session(); } catch (error) { return null; }
  }

  async function prefillAccountEmail() {
    var activeSession = await currentSession();
    if (activeSession && !form.elements.email.value) form.elements.email.value = activeSession.user.email || '';
  }

  form.addEventListener('input', function () {
    clearTimeout(saveTimer);
    saveState.textContent = 'Saving draft…';
    saveTimer = setTimeout(saveDraft, 250);
  });
  form.addEventListener('change', saveDraft);
  document.querySelector('[data-report-clear]').addEventListener('click', function () { clearDraft(true); });

  document.querySelector('[data-report-detect]').addEventListener('click', async function () {
    var detectStatus = document.querySelector('[data-report-detect-status]');
    var browser = navigator.userAgent;
    var os = navigator.platform || '';
    var device = /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile or tablet' : 'Desktop or laptop';
    if (navigator.userAgentData) {
      var brands = navigator.userAgentData.brands || [];
      browser = brands.map(function (brand) { return brand.brand + ' ' + brand.version; }).join(', ') || browser;
      os = navigator.userAgentData.platform || os;
      device = navigator.userAgentData.mobile ? 'Mobile or tablet' : 'Desktop or laptop';
      if (navigator.userAgentData.getHighEntropyValues) {
        try {
          var details = await navigator.userAgentData.getHighEntropyValues(['platformVersion', 'model']);
          if (details.platformVersion) os += ' ' + details.platformVersion;
          if (details.model) device += ' — ' + details.model;
        } catch (error) {}
      }
    }
    form.elements.browser.value = browser;
    form.elements.operating_system.value = os;
    form.elements.device.value = device;
    detectStatus.textContent = 'Browser details added. You can edit them.';
    saveDraft();
  });

  async function submitToSupabase(data) {
    var payload = {
      type: String(data.get('type')),
      severity: String(data.get('severity')),
      title: String(data.get('title')).trim(),
      build: String(data.get('build') || '').trim() || null,
      browser: String(data.get('browser') || '').trim() || null,
      operating_system: String(data.get('operating_system') || '').trim() || null,
      device: String(data.get('device') || '').trim() || null,
      summary: String(data.get('summary')).trim(),
      steps: String(data.get('steps') || '').trim() || null,
      expected: String(data.get('expected') || '').trim() || null,
      actual: String(data.get('actual') || '').trim() || null,
      evidence_url: String(data.get('evidence_url') || '').trim() || null,
      contact_permission: data.get('contact_permission') === 'Yes'
    };
    var result = await auth.getClient().from('issues').insert(payload).select('issue_number').single();
    if (result.error) throw result.error;
    return 'NC-' + String(result.data.issue_number).padStart(5, '0');
  }

  async function submitToFormspree(endpoint) {
    var response = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('The report service rejected the submission.');
    return 'Email submission';
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus('A few required report fields are still missing.', 'error');
      return;
    }
    var endpoint = form.dataset.formspreeEndpoint.trim();
    var activeSession = await currentSession();
    if (!activeSession && !endpoint) {
      saveDraft();
      setStatus('Submission is not connected yet. Your complete report is saved safely in this browser.', 'pending');
      return;
    }
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting report…';
    setStatus('');
    try {
      var reference = activeSession && configured() ? await submitToSupabase(new FormData(form)) : await submitToFormspree(endpoint);
      clearDraft(false);
      form.hidden = true;
      success.hidden = false;
      document.querySelector('[data-report-reference]').textContent = reference;
      success.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      saveDraft();
      setStatus((error.message || 'The report could not be sent.') + ' Your draft is still saved in this browser.', 'error');
      submitButton.disabled = false;
      submitButton.textContent = 'Submit report';
    }
  });

  restoreDraft();
  prefillAccountEmail();
})();
