(function () {
  'use strict';

  function initializeAnnouncementPage(root) {
    if (!root || root.dataset.announcementInitialized === 'true') {
      return;
    }

    if (window.iroAnnouncementPageController) {
      window.iroAnnouncementPageController.abort();
      document.documentElement.classList.remove('announcement-drawer-lock');
    }

    var eventController = new AbortController();
    var signal = eventController.signal;
    var fetchController = null;
    var headingObserver = null;
    var touchStartX = 0;
    var touchStartTime = 0;

    window.iroAnnouncementPageController = eventController;
    root.dataset.announcementInitialized = 'true';

    var endpoint = root.dataset.endpoint || '';
    var pageId = root.dataset.pageId || '';
    var main = root.querySelector('.announcement-main');
    var article = root.querySelector('[data-announcement-article]');
    var title = root.querySelector('[data-announcement-title]');
    var date = root.querySelector('[data-announcement-date]');
    var content = root.querySelector('[data-announcement-content]');
    var toc = root.querySelector('[data-announcement-toc]');
    var loading = root.querySelector('[data-announcement-loading]');
    var error = root.querySelector('[data-announcement-error]');
    var drawerOpen = root.querySelector('[data-announcement-drawer-open]');
    var drawerBackdrop = root.querySelector('.announcement-drawer-backdrop');

    function setLoading(isLoading) {
      if (!main || !loading) {
        return;
      }

      loading.hidden = !isLoading;
      main.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    }

    function showError(message) {
      if (!error) {
        return;
      }

      error.textContent = message || '公告加载失败，请稍后重试。';
      error.hidden = false;
    }

    function clearError() {
      if (error) {
        error.hidden = true;
        error.textContent = '';
      }
    }

    function setDrawer(isOpen) {
      root.classList.toggle('is-drawer-open', isOpen);
      if (drawerOpen) {
        drawerOpen.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }
      if (drawerBackdrop) {
        drawerBackdrop.hidden = !isOpen;
      }
      document.documentElement.classList.toggle('announcement-drawer-lock', isOpen);
    }

    function updateSelection(id) {
      root.querySelectorAll('[data-announcement-id]').forEach(function (item) {
        var selected = item.dataset.announcementId === String(id);
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-current', selected ? 'true' : 'false');
      });
      root.dataset.selectedId = String(id);
    }

    function updateUrl(id, mode, headingId) {
      if (!window.history || !window.URL) {
        return;
      }

      var url = new URL(window.location.href);
      url.searchParams.set('announcement', id);
      if (headingId) {
        url.searchParams.set('heading', headingId);
      } else {
        url.searchParams.delete('heading');
      }

      var state = { announcement: Number(id), heading: headingId || '' };
      if (mode === 'replace') {
        window.history.replaceState(state, '', url.toString());
      } else if (mode === 'push') {
        window.history.pushState(state, '', url.toString());
      }
    }

    function markCurrentHeading(heading) {
      if (!toc) {
        return;
      }

      toc.querySelectorAll('.announcement-toc-link').forEach(function (link) {
        link.classList.toggle('is-current', Boolean(heading) && link.dataset.target === heading.id);
      });
    }

    function observeHeadings(headings) {
      if (headingObserver) {
        headingObserver.disconnect();
      }

      if (!('IntersectionObserver' in window) || !headings.length) {
        return;
      }

      headingObserver = new IntersectionObserver(function (entries) {
        var visible = entries
          .filter(function (entry) { return entry.isIntersecting; })
          .sort(function (left, right) { return left.boundingClientRect.top - right.boundingClientRect.top; });

        if (visible.length) {
          markCurrentHeading(visible[0].target);
        }
      }, {
        rootMargin: '-15% 0px -70% 0px',
        threshold: [0, 1]
      });

      headings.forEach(function (heading) {
        headingObserver.observe(heading);
      });
    }

    function generateTableOfContents(targetHeadingId) {
      if (!toc || !article) {
        return;
      }

      toc.innerHTML = '';
      var headings = Array.prototype.slice.call(article.querySelectorAll('.announcement-article-header h1, .announcement-entry-content h1, .announcement-entry-content h2, .announcement-entry-content h3, .announcement-entry-content h4'));
      var usedIds = Object.create(null);

      headings.forEach(function (heading, index) {
        var baseId = 'announcement-heading-' + root.dataset.selectedId + '-' + index;
        var headingId = heading.id || baseId;
        while (usedIds[headingId]) {
          headingId += '-2';
        }
        usedIds[headingId] = true;
        heading.id = headingId;

        var link = document.createElement('a');
        link.className = 'announcement-toc-link';
        link.href = '#' + encodeURIComponent(headingId);
        link.dataset.target = headingId;
        link.dataset.level = heading.tagName.substring(1);
        link.textContent = heading.textContent.trim();
        link.addEventListener('click', function (event) {
          event.preventDefault();
          heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
          markCurrentHeading(heading);
          updateUrl(root.dataset.selectedId, 'replace', headingId);
        }, { signal: signal });
        toc.appendChild(link);
      });

      observeHeadings(headings);

      if (targetHeadingId) {
        window.requestAnimationFrame(function () {
          var target = document.getElementById(targetHeadingId);
          if (target && article.contains(target)) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            markCurrentHeading(target);
          }
        });
      }
    }

    function renderAnnouncement(data) {
      if (!article || !title || !date || !content) {
        return;
      }

      title.textContent = data.title || '';
      title.removeAttribute('id');
      date.textContent = data.date || '';
      date.setAttribute('datetime', data.datetime || '');
      content.innerHTML = data.content || '';
      article.hidden = false;
    }

    function loadAnnouncement(id, options) {
      options = options || {};
      var item = root.querySelector('[data-announcement-id="' + String(id) + '"]');
      if (!item || !endpoint || !pageId) {
        return Promise.resolve();
      }

      if (String(id) === root.dataset.selectedId && !options.force) {
        setDrawer(false);
        if (options.heading) {
          generateTableOfContents(options.heading);
        }
        return Promise.resolve();
      }

      if (fetchController) {
        fetchController.abort();
      }
      fetchController = new AbortController();
      var requestController = fetchController;

      setLoading(true);
      clearError();

      return fetch(endpoint + encodeURIComponent(id) + '?page_id=' + encodeURIComponent(pageId), {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        signal: requestController.signal
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('HTTP ' + response.status);
          }
          return response.json();
        })
        .then(function (data) {
          updateSelection(id);
          renderAnnouncement(data);
          generateTableOfContents(options.heading || '');
          setDrawer(false);

          if (options.historyMode) {
            updateUrl(id, options.historyMode, options.heading || '');
          }

          if (options.scroll !== false && article) {
            article.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }

          root.dispatchEvent(new CustomEvent('announcement:change', { detail: data }));
        })
        .catch(function (requestError) {
          if (requestError.name !== 'AbortError') {
            showError('公告加载失败，请稍后重试。');
          }
        })
        .finally(function () {
          if (fetchController === requestController) {
            setLoading(false);
          }
        });
    }

    root.addEventListener('click', function (event) {
      var item = event.target.closest('[data-announcement-id]');
      if (item && root.contains(item)) {
        loadAnnouncement(item.dataset.announcementId, { historyMode: 'push' });
        return;
      }

      if (event.target.closest('[data-announcement-drawer-open]')) {
        setDrawer(true);
      } else if (event.target.closest('[data-announcement-drawer-close]')) {
        setDrawer(false);
      }
    }, { signal: signal });

    root.addEventListener('touchstart', function (event) {
      if (!event.touches.length) {
        return;
      }
      touchStartX = event.touches[0].clientX;
      touchStartTime = Date.now();
    }, { passive: true, signal: signal });

    root.addEventListener('touchend', function (event) {
      if (!event.changedTouches.length || Date.now() - touchStartTime > 500) {
        return;
      }
      var distance = event.changedTouches[0].clientX - touchStartX;
      if (distance > 90 && touchStartX < 60) {
        setDrawer(true);
      } else if (distance < -90) {
        setDrawer(false);
      }
    }, { passive: true, signal: signal });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        setDrawer(false);
      }
    }, { signal: signal });

    window.addEventListener('popstate', function () {
      var url = new URL(window.location.href);
      var id = url.searchParams.get('announcement');
      var heading = url.searchParams.get('heading') || '';
      if (!id) {
        var firstItem = root.querySelector('[data-announcement-id]');
        id = firstItem ? firstItem.dataset.announcementId : '';
      }
      if (id) {
        loadAnnouncement(id, { heading: heading, scroll: false });
      }
    }, { signal: signal });

    var initialUrl = new URL(window.location.href);
    generateTableOfContents(initialUrl.searchParams.get('heading') || '');
  }

  function initializeAllAnnouncementPages() {
    var root = document.querySelector('[data-announcement-app]');
    if (root) {
      initializeAnnouncementPage(root);
    } else if (window.iroAnnouncementPageController) {
      window.iroAnnouncementPageController.abort();
      window.iroAnnouncementPageController = null;
      document.documentElement.classList.remove('announcement-drawer-lock');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAllAnnouncementPages, { once: true });
  } else {
    initializeAllAnnouncementPages();
  }

  if (!window.iroAnnouncementPjaxListener) {
    document.addEventListener('pjax:complete', initializeAllAnnouncementPages);
    window.iroAnnouncementPjaxListener = true;
  }
})();
