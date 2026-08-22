(function () {
  'use strict';

  var root = document.querySelector('[data-forum-page]');
  if (!root) return;

  var auth = window.NeoCraftAuth;
  var page = root.dataset.forumPage;
  var params = new URLSearchParams(location.search);
  var previewCategories = [
    { id: 'preview-announcements', slug: 'announcements', title: 'Announcements', description: 'Official ZephyrCraft development, testing, and service announcements.', accent: 'gold', locked: true, sort_order: 1 },
    { id: 'preview-general', slug: 'general', title: 'General discussion', description: 'Talk about ZephyrCraft, historical versions, browser gameplay, and the project.', accent: 'green', locked: false, sort_order: 2 },
    { id: 'preview-testing', slug: 'alpha-testing', title: 'Alpha testing', description: 'Share testing results, compare behavior, and discuss the current Alpha build.', accent: 'aqua', locked: false, sort_order: 3 },
    { id: 'preview-support', slug: 'support', title: 'Help and support', description: 'Ask for help with setup, local resources, browsers, worlds, and accounts.', accent: 'amethyst', locked: false, sort_order: 4 }
  ];
  var previewThreads = [
    { id: 'welcome', category_slug: 'announcements', category_title: 'Announcements', title: 'Welcome to the ZephyrCraft community forums', author_name: 'Preston', body: 'This is the community space for ZephyrCraft development, testing, help, and discussion. Please keep conversations useful, never share Minecraft game files or sensitive information, and use the issue tracker when you have a reproducible bug.\n\nThe forum interface is being prepared alongside the account system. Live posting will open when the community database is connected.', is_pinned: true, is_locked: false, created_at: '2026-08-19T14:00:00-05:00', updated_at: '2026-08-19T14:00:00-05:00', reply_count: 2 },
    { id: 'alpha-playable', category_slug: 'alpha-testing', category_title: 'Alpha testing', title: 'Alpha 1.1.2_01 testing: what to focus on', author_name: 'Preston', body: 'The current testing phase is focused on longer sessions, different world seeds, browser compatibility, save reliability, and performance on lower-powered hardware.\n\nIf something breaks consistently, please submit a full issue report with your browser, operating system, steps to reproduce, expected result, and actual result.', is_pinned: true, is_locked: false, created_at: '2026-08-19T14:20:00-05:00', updated_at: '2026-08-19T15:10:00-05:00', reply_count: 1 },
    { id: 'resource-loading', category_slug: 'support', category_title: 'Help and support', title: 'Before asking for help with resource loading', author_name: 'ZephyrCraft Team', body: 'Make sure the selected client JAR is the exact supported version and has not been modified by a launcher or mod. The browser reads the file locally; it is not uploaded to ZephyrCraft.\n\nWhen asking for help, include the browser name and the exact error shown on the client page. Do not upload or share the JAR itself.', is_pinned: false, is_locked: false, created_at: '2026-08-19T15:00:00-05:00', updated_at: '2026-08-19T15:00:00-05:00', reply_count: 0 },
    { id: 'browser-performance', category_slug: 'general', category_title: 'General discussion', title: 'What hardware are you planning to test on?', author_name: 'Community preview', body: 'One goal of testing is to understand how ZephyrCraft behaves across older laptops, Chromebooks, integrated graphics, and modern desktop systems. What hardware and browser would you be using?', is_pinned: false, is_locked: false, created_at: '2026-08-19T15:35:00-05:00', updated_at: '2026-08-19T15:35:00-05:00', reply_count: 0 }
  ];
  var previewReplies = {
    welcome: [
      { id: 'welcome-reply-1', author_name: 'ZephyrCraft Team', body: 'Development updates will continue to be posted on the main updates page. The forums are for longer conversations and community support.', created_at: '2026-08-19T14:10:00-05:00' },
      { id: 'welcome-reply-2', author_name: 'Community preview', body: 'Live replies will appear here after the account database is connected.', created_at: '2026-08-19T14:12:00-05:00' }
    ],
    'alpha-playable': [
      { id: 'alpha-reply-1', author_name: 'ZephyrCraft Team', body: 'World creation, saving, reloading, and longer sessions are especially useful areas to test.', created_at: '2026-08-19T15:10:00-05:00' }
    ],
    'resource-loading': [],
    'browser-performance': []
  };

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function configured() {
    return Boolean(auth && auth.isConfigured && auth.isConfigured());
  }

  async function session() {
    if (!configured()) return null;
    try { return await auth.session(); } catch (error) { return null; }
  }

  function dateLabel(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }).format(date);
  }

  function initials(name) {
    return String(name || 'NC').split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0); }).join('').toUpperCase();
  }

  function threadReplies(thread) {
    if (typeof thread.reply_count === 'number') return thread.reply_count;
    if (Array.isArray(thread.forum_posts) && thread.forum_posts[0]) return Number(thread.forum_posts[0].count || 0);
    return 0;
  }

  function normalizeThread(thread) {
    var category = thread.forum_categories || {};
    return Object.assign({}, thread, {
      category_slug: thread.category_slug || category.slug || 'general',
      category_title: thread.category_title || category.title || 'Discussion',
      reply_count: threadReplies(thread)
    });
  }

  function renderCategory(container, category, counts) {
    var link = element('a', 'forum-category-row');
    link.href = 'forum-category.html?category=' + encodeURIComponent(category.slug);
    link.dataset.accent = category.accent || 'green';
    var icon = element('span', 'forum-category-row__icon', String(category.sort_order || '•').padStart(2, '0'));
    icon.setAttribute('aria-hidden', 'true');
    var copy = element('div', 'forum-category-row__copy');
    copy.append(element('h3', '', category.title), element('p', '', category.description));
    var stats = element('div', 'forum-category-row__stats');
    var count = counts && counts[category.id] ? counts[category.id] : 0;
    stats.append(element('strong', '', String(count)), element('span', '', count === 1 ? 'discussion' : 'discussions'));
    var arrow = element('span', 'forum-category-row__arrow', '›');
    arrow.setAttribute('aria-hidden', 'true');
    link.append(icon, copy, stats, arrow);
    container.append(link);
  }

  function renderThread(container, rawThread) {
    var thread = normalizeThread(rawThread);
    var link = element('a', 'forum-thread-row');
    link.href = 'forum-thread.html?id=' + encodeURIComponent(thread.id);
    var marker = element('span', 'forum-thread-row__marker');
    marker.dataset.pinned = String(Boolean(thread.is_pinned));
    marker.textContent = thread.is_pinned ? '!' : initials(thread.author_name);
    var copy = element('div', 'forum-thread-row__copy');
    var title = element('h3', '', thread.title);
    var meta = element('p', 'forum-thread-row__meta');
    meta.append(element('span', '', thread.category_title), document.createTextNode(' · by ' + (thread.author_name || 'Member') + ' · ' + dateLabel(thread.updated_at || thread.created_at)));
    copy.append(title, meta);
    var stats = element('div', 'forum-thread-row__stats');
    stats.append(element('strong', '', String(thread.reply_count || 0)), element('span', '', Number(thread.reply_count) === 1 ? 'reply' : 'replies'));
    link.append(marker, copy, stats);
    container.append(link);
  }

  function renderPost(container, post, original) {
    var article = element('article', original ? 'forum-post forum-post--original' : 'forum-post');
    var author = element('aside', 'forum-post__author');
    author.append(element('span', 'forum-avatar', initials(post.author_name)), element('strong', '', post.author_name || 'Member'), element('small', '', original ? 'Topic author' : 'Member'));
    var content = element('div', 'forum-post__content');
    var head = element('div', 'forum-post__meta');
    head.append(element('time', '', dateLabel(post.created_at)), element('span', '', original ? 'Original post' : 'Reply'));
    var body = element('div', 'forum-post__body');
    String(post.body || '').split(/\n{2,}/).forEach(function (paragraph) { body.append(element('p', '', paragraph)); });
    content.append(head, body);
    article.append(author, content);
    container.append(article);
  }

  async function loadCategories() {
    if (!configured()) return previewCategories;
    var result = await auth.getClient().from('forum_categories').select('*').order('sort_order');
    if (result.error) throw result.error;
    return result.data || [];
  }

  async function loadLatest(limit) {
    if (!configured()) return previewThreads.slice(0, limit || 8);
    var result = await auth.getClient().from('forum_threads').select('id,title,category_id,author_name,is_pinned,is_locked,created_at,updated_at,forum_categories(slug,title),forum_posts(count)').order('is_pinned', { ascending: false }).order('updated_at', { ascending: false }).limit(limit || 8);
    if (result.error) throw result.error;
    return (result.data || []).map(normalizeThread);
  }

  async function updateAccountCard() {
    var card = document.querySelector('[data-forum-account-card]');
    if (!card || !configured()) return;
    var activeSession = await session();
    if (!activeSession) return;
    var name = activeSession.user.user_metadata.display_name || activeSession.user.email || 'Member';
    card.innerHTML = '';
    card.append(element('span', 'eyebrow eyebrow--diamond', 'Signed in'), element('h2', '', 'Welcome, ' + name + '.'), element('p', '', 'You can start discussions and reply when the community database is available.'));
    var accountLink = element('a', 'btn btn--ghost btn--block', 'View account');
    accountLink.href = 'account.html';
    card.append(accountLink);
  }

  async function initIndex() {
    var categoriesContainer = document.querySelector('[data-forum-categories]');
    var latestContainer = document.querySelector('[data-forum-latest]');
    try {
      var categories = await loadCategories();
      var threads = await loadLatest(8);
      var counts = {};
      var countRows = threads;
      if (configured()) {
        var countResult = await auth.getClient().from('forum_threads').select('category_id');
        if (!countResult.error) countRows = countResult.data || threads;
      }
      countRows.forEach(function (thread) {
        var category = categories.find(function (item) { return item.id === thread.category_id || item.slug === thread.category_slug; });
        if (category) counts[category.id] = (counts[category.id] || 0) + 1;
      });
      categoriesContainer.innerHTML = '';
      categories.forEach(function (category) { renderCategory(categoriesContainer, category, counts); });
      latestContainer.innerHTML = '';
      threads.forEach(function (thread) { renderThread(latestContainer, thread); });
      if (!threads.length) latestContainer.append(element('p', 'forum-empty', 'No discussions yet. Start the first one.'));
      document.querySelector('[data-forum-category-count]').textContent = categories.length + (categories.length === 1 ? ' category' : ' categories');
      if (configured()) document.querySelector('[data-forum-service-note]').hidden = true;
      await updateAccountCard();
    } catch (error) {
      categoriesContainer.textContent = 'The forum categories could not be loaded.';
      latestContainer.textContent = error.message || 'The latest discussions could not be loaded.';
    }
  }

  async function initCategory() {
    var slug = params.get('category') || 'general';
    var categories = await loadCategories();
    var category = categories.find(function (item) { return item.slug === slug; }) || categories[0];
    if (!category) { location.href = 'forums.html'; return; }
    document.querySelector('[data-category-title]').textContent = category.title;
    document.querySelector('[data-category-description]').textContent = category.description;
    document.querySelector('[data-category-breadcrumb]').textContent = category.title;
    document.querySelector('[data-category-label]').textContent = category.locked ? 'Official category' : 'Community category';
    document.querySelector('[data-category-new-link]').href = 'forum-new.html?category=' + encodeURIComponent(category.slug);
    if (category.locked) document.querySelector('[data-category-new-link]').hidden = true;
    document.title = category.title + ' — ZephyrCraft forums';

    var allThreads;
    if (!configured()) {
      allThreads = previewThreads.filter(function (thread) { return thread.category_slug === category.slug; });
    } else {
      var result = await auth.getClient().from('forum_threads').select('id,title,category_id,author_name,is_pinned,is_locked,created_at,updated_at,forum_categories(slug,title),forum_posts(count)').eq('category_id', category.id).order('is_pinned', { ascending: false }).order('updated_at', { ascending: false });
      if (result.error) throw result.error;
      allThreads = (result.data || []).map(normalizeThread);
    }
    var container = document.querySelector('[data-category-threads]');
    var empty = document.querySelector('[data-forum-empty]');
    var search = document.querySelector('[data-forum-search]');
    var sort = document.querySelector('[data-forum-sort]');

    function draw() {
      var query = search.value.trim().toLowerCase();
      var threads = allThreads.filter(function (thread) { return !query || thread.title.toLowerCase().indexOf(query) !== -1 || String(thread.author_name).toLowerCase().indexOf(query) !== -1; });
      threads.sort(function (a, b) {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        if (sort.value === 'replies') return Number(b.reply_count || 0) - Number(a.reply_count || 0);
        if (sort.value === 'newest') return new Date(b.created_at) - new Date(a.created_at);
        return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
      });
      container.innerHTML = '';
      threads.forEach(function (thread) { renderThread(container, thread); });
      empty.hidden = threads.length !== 0;
    }
    search.addEventListener('input', draw);
    sort.addEventListener('change', draw);
    draw();
  }

  async function initThread() {
    var id = params.get('id') || 'welcome';
    var thread;
    var replies;
    if (!configured()) {
      thread = previewThreads.find(function (item) { return item.id === id; }) || previewThreads[0];
      replies = previewReplies[thread.id] || [];
    } else {
      var threadResult = await auth.getClient().from('forum_threads').select('id,title,body,category_id,author_id,author_name,is_pinned,is_locked,created_at,updated_at,forum_categories(slug,title)').eq('id', id).maybeSingle();
      if (threadResult.error) throw threadResult.error;
      if (!threadResult.data) { location.href = 'forums.html'; return; }
      thread = normalizeThread(threadResult.data);
      var replyResult = await auth.getClient().from('forum_posts').select('id,thread_id,author_id,author_name,body,created_at,updated_at').eq('thread_id', id).order('created_at');
      if (replyResult.error) throw replyResult.error;
      replies = replyResult.data || [];
    }
    if (!thread) { location.href = 'forums.html'; return; }
    document.title = thread.title + ' — ZephyrCraft forums';
    var categoryLink = document.querySelector('[data-thread-category-link]');
    categoryLink.textContent = thread.category_title;
    categoryLink.href = 'forum-category.html?category=' + encodeURIComponent(thread.category_slug);
    var topic = document.querySelector('[data-forum-topic]');
    var heading = element('header', 'forum-topic__head');
    var flags = element('div', 'forum-topic__flags');
    if (thread.is_pinned) flags.append(element('span', 'forum-tag forum-tag--pinned', 'Pinned'));
    if (thread.is_locked) flags.append(element('span', 'forum-tag', 'Locked'));
    heading.append(flags, element('h1', '', thread.title));
    topic.append(heading);
    renderPost(topic, thread, true);
    var repliesContainer = document.querySelector('[data-forum-replies]');
    replies.forEach(function (reply) { renderPost(repliesContainer, reply, false); });
    document.querySelector('[data-reply-count]').textContent = replies.length;

    var form = document.querySelector('[data-forum-reply-form]');
    var status = document.querySelector('[data-forum-reply-status]');
    if (thread.is_locked) { form.querySelector('textarea').disabled = true; form.querySelector('button').disabled = true; status.textContent = 'This discussion is locked.'; }
    else if (!configured()) status.textContent = 'Reply posting will activate when the forum database is connected.';
    else if (await session()) status.textContent = 'Your reply will be posted publicly.';
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!configured()) { status.textContent = 'The forum database is not connected yet.'; return; }
      var activeSession = await session();
      if (!activeSession) { location.href = 'account.html?mode=signin&next=' + encodeURIComponent('forum-thread.html?id=' + thread.id); return; }
      var body = form.elements.body.value.trim();
      if (!body) return;
      var button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      status.textContent = 'Posting reply…';
      var result = await auth.getClient().from('forum_posts').insert({ thread_id: thread.id, body: body }).select('id,author_name,body,created_at').single();
      if (result.error) { status.textContent = result.error.message; button.disabled = false; return; }
      renderPost(repliesContainer, result.data, false);
      form.reset();
      document.querySelector('[data-reply-count]').textContent = repliesContainer.children.length;
      status.textContent = 'Reply posted.';
      button.disabled = false;
    });
  }

  async function initNew() {
    var form = document.querySelector('[data-forum-new-form]');
    var select = document.querySelector('[data-forum-category-select]');
    var status = document.querySelector('[data-forum-new-status]');
    var draftState = document.querySelector('[data-forum-draft-state]');
    var storageKey = 'neocraft-forum-draft-v1';
    var categories = await loadCategories();
    categories.filter(function (category) { return !category.locked; }).forEach(function (category) {
      var option = element('option', '', category.title);
      option.value = category.slug;
      option.dataset.id = category.id;
      select.append(option);
    });
    var requestedCategory = params.get('category');
    if (requestedCategory) select.value = requestedCategory;
    try {
      var draft = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (draft) { select.value = requestedCategory || draft.category || ''; form.elements.title.value = draft.title || ''; form.elements.body.value = draft.body || ''; draftState.textContent = 'Saved draft restored'; }
    } catch (error) {}
    var timer;
    function saveDraft() {
      localStorage.setItem(storageKey, JSON.stringify({ category: select.value, title: form.elements.title.value, body: form.elements.body.value }));
      draftState.textContent = 'Draft saved locally';
    }
    form.addEventListener('input', function () { clearTimeout(timer); draftState.textContent = 'Saving draft…'; timer = setTimeout(saveDraft, 250); });
    document.querySelector('[data-forum-clear-draft]').addEventListener('click', function () { form.reset(); localStorage.removeItem(storageKey); draftState.textContent = 'Draft cleared'; });
    if (!configured()) status.textContent = 'Publishing will activate when the forum database is connected.';
    else if (await session()) status.textContent = 'This discussion will be public.';
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (!configured()) { saveDraft(); status.textContent = 'The forum database is not connected yet. Your draft is saved in this browser.'; return; }
      var activeSession = await session();
      if (!activeSession) { saveDraft(); location.href = 'account.html?mode=signin&next=forum-new.html'; return; }
      var category = categories.find(function (item) { return item.slug === select.value; });
      if (!category) return;
      var button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      status.textContent = 'Publishing discussion…';
      var result = await auth.getClient().from('forum_threads').insert({ category_id: category.id, title: form.elements.title.value.trim(), body: form.elements.body.value.trim() }).select('id').single();
      if (result.error) { status.textContent = result.error.message; button.disabled = false; return; }
      localStorage.removeItem(storageKey);
      location.href = 'forum-thread.html?id=' + encodeURIComponent(result.data.id);
    });
  }

  Promise.resolve().then(function () {
    if (page === 'index') return initIndex();
    if (page === 'category') return initCategory();
    if (page === 'thread') return initThread();
    if (page === 'new') return initNew();
  }).catch(function (error) {
    var target = document.querySelector('[data-forum-new-status], [data-forum-reply-status], [data-forum-latest], [data-category-threads]');
    if (target) target.textContent = error.message || 'The forum could not be loaded.';
  });
})();
