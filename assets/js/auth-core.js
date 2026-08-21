(function () {
  'use strict';

  var config = window.NEOCRAFT_CONFIG || {};
  var client = null;

  function isConfigured() {
    return Boolean(
      config.supabaseUrl &&
      config.supabasePublishableKey &&
      !/YOUR_|example/i.test(config.supabaseUrl + config.supabasePublishableKey)
    );
  }

  function getClient() {
    if (!isConfigured()) return null;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('The account service could not load. Check your connection and try again.');
    }
    if (!client) {
      client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    }
    return client;
  }

  function siteUrl(path) {
    return new URL(path || '', window.location.href).href;
  }

  function safeNext(value, fallback) {
    if (!value || !/^[a-z0-9_-]+\.html(?:[?#].*)?$/i.test(value)) return fallback || 'account.html';
    return value;
  }

  async function session() {
    var supabaseClient = getClient();
    if (!supabaseClient) return null;
    var result = await supabaseClient.auth.getSession();
    if (result.error) throw result.error;
    return result.data.session;
  }

  async function profile(userId) {
    var supabaseClient = getClient();
    if (!supabaseClient || !userId) return null;
    var result = await supabaseClient
      .from('profiles')
      .select('id,email,display_name,created_at')
      .eq('id', userId)
      .maybeSingle();
    if (result.error) throw result.error;
    return result.data;
  }

  window.NeoCraftAuth = Object.freeze({
    config: config,
    isConfigured: isConfigured,
    getClient: getClient,
    siteUrl: siteUrl,
    safeNext: safeNext,
    session: session,
    profile: profile
  });
})();
