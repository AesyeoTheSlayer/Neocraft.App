(function () {
  'use strict';
  var path = location.pathname;
  var page = location.pathname.split('/').pop();
  var insideClientBuild = path.indexOf('/client-build/') !== -1 || path.slice(-13) === '/client-build';
  if (!insideClientBuild && (page === '' || page === 'index.html')) return;
  location.replace(insideClientBuild ? '../index.html' : 'index.html');
})();
