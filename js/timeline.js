(function () {
    'use strict';
    window.sducraftTimelineDispose?.();
    const lifecycle = new AbortController();
    const scriptURL = document.currentScript.src;
    let cleanup;
    function init() {
        cleanup?.();
        const app = document.getElementById('mc-timeline-app');
        if (!app) return;
        delete app.dataset.worldReady;
        app.classList.add('is-loading');
        const events = new AbortController();
        const signal = events.signal;
        const reduce = matchMedia('(prefers-reduced-motion: reduce)');
        const stops = [...app.querySelectorAll('.mc-milestone-block')];
        const dialog = app.querySelector('dialog');
        const content = dialog.querySelector('.mc-book-content');
        let chromeTimer=0;
        let lastScroll = NaN;
        let world, disposed = false, frame = 0, lastRender = 0, opening = false;
        let positions = [], targetY = 0, cartY = 0, active = -1, focused = null;
        let entry = 0, pageIndex = 0, pages = [], returnFocus, focusLockUntil = 0, textBookHeight = 400;
        const listen = (element, name, fn, options = {}) => element.addEventListener(name, fn, {...options, signal});

        function layout() {
            const rect = app.getBoundingClientRect();
            positions = stops.map(stop => {
                const a = stop.querySelector('.mc-stop-anchor').getBoundingClientRect();
                const c = stop.querySelector('.mc-gui-card').getBoundingClientRect();
                const y = c.top - rect.top + c.height / 2;
                stop.querySelector('.mc-stop-anchor').style.top = `${c.top - stop.getBoundingClientRect().top + c.height / 2}px`;
                const photo = stop.querySelector('.mc-memory-display')?.getBoundingClientRect();
                return {x:a.left - rect.left, y, year:stop.dataset.year, origin:stop.dataset.origin,
                    card:{x:c.left - rect.left, y:c.top - rect.top, width:c.width, height:c.height},
                    photo:photo ? {x:photo.left-rect.left,y:photo.top-rect.top,width:photo.width,height:photo.height} : null};
            });
            world?.layout(positions, app.offsetHeight);
            updateFocus();
            if (dialog.open) buildPages();
            requestFrame();
        }
        function updateFocus() {
            const readingY = focused === null ? innerHeight * .48 - app.getBoundingClientRect().top : positions[focused]?.y;
            if (!positions.length) return;
            targetY = Math.max(120, Math.min(positions.at(-1).y + 180, readingY));
            let nearest = 0;
            positions.forEach((p, i) => {if(Math.abs(p.y - targetY) < Math.abs(positions[nearest].y - targetY)) nearest = i;});
            if (focused === null && stops[nearest].dataset.origin !== 'merge' && Math.abs(positions[nearest].y - targetY) < 55) targetY = positions[nearest].y;
            if (nearest !== active) {
                active = nearest;
                stops.forEach((stop, i) => stop.classList.toggle('is-active', i === active));
                const stop = stops[active];
                app.querySelector('.mc-hud-date').textContent = stop.dataset.date;
                app.querySelector('.mc-hud-count').textContent = `${String(active + 1).padStart(2, '0')} / ${stops.length}`;
                app.querySelectorAll('.mc-year-nav a').forEach(link => {
                    const current = link.dataset.year === stop.dataset.year;
                    if (current) {link.setAttribute('aria-current', 'step'); app.querySelector('.mc-hud-year').textContent = stop.dataset.year + ' 年';}
                    else link.removeAttribute('aria-current');
                });
            }
            app.querySelector('.mc-progress i').style.width = `${Math.min(100, Math.max(0, (targetY - positions[0].y) / (positions.at(-1).y - positions[0].y || 1) * 100))}%`;
        }
        function requestFrame() { if (!frame && !disposed && !document.hidden) frame = requestAnimationFrame(tick); }
        function tick(now) {
            frame = 0;
            if (disposed || document.hidden) return;
            const moving = Math.abs(targetY - cartY) > .2;
            cartY = reduce.matches || !world || Math.abs(targetY - cartY) > innerHeight ? targetY : moving ? cartY + (targetY - cartY) * .2 : targetY;
            const rect = app.getBoundingClientRect();
            const visible = rect.bottom > 0 && rect.top < innerHeight;
            app.classList.toggle('is-reading', rect.top < -app.querySelector('.mc-story-header').offsetHeight * .7);
            app.querySelector('.mc-world-canvas').style.visibility = visible ? 'visible' : 'hidden';
            app.querySelector('.mc-journey-hud').style.visibility = visible ? 'visible' : 'hidden';
            app.querySelector('.mc-year-nav').style.visibility = visible ? 'visible' : 'hidden';
            if (world && app.dataset.worldReady === 'true' && visible && (now - lastRender > world.frameInterval || reduce.matches)) {
                world.render(cartY, -rect.top, now, reduce.matches, active);
                lastRender = now; lastScroll = rect.top;
            }
            if (visible && world && !dialog.open && (!reduce.matches && (moving || world.continuous))) requestFrame();
        }

        // Split text with DOM Ranges so inline links and formatting survive pagination.
        function textPages(root, limit) {
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            const nodes = []; let node, length = 0;
            while ((node = walker.nextNode())) { nodes.push({node, start:length}); length += node.length; }
            if (!length) return [root.cloneNode(true)];
            const text = root.textContent, result = [];
            function boundary(offset) {
                const part = nodes.findLast(part => part.start <= offset) || nodes[0];
                return [part.node, Math.min(part.node.length, offset - part.start)];
            }
            for (let start = 0; start < length;) {
                let end = Math.min(length, start + limit);
                if (end < length) {
                    const punctuation = text.slice(start + Math.floor(limit * .65), end).search(/[。！；！？][^。！；！？]*$/);
                    if (punctuation >= 0) end = start + Math.floor(limit * .65) + punctuation + 1;
                }
                const range = document.createRange();
                range.setStart(...boundary(start)); range.setEnd(...boundary(end));
                const section = document.createElement('div'); section.append(range.cloneContents()); result.push(section);
                start = end;
            }
            return result;
        }
        function buildPages() {
            dialog.classList.remove('is-photo-page');
            const template = app.querySelector(`#mc-detail-${entry}`);
            if (!template) return;
            const fragment = template.content;
            dialog.querySelector('#mc-dialog-title').textContent = fragment.querySelector('h2').textContent;
            dialog.querySelector('.mc-book-date').textContent = fragment.querySelector('time').textContent;
            const text = fragment.querySelector('.mc-entry-text');
            textBookHeight = Math.min(520, Math.max(340, 190 + Math.ceil(text.textContent.length / 24) * 26));
            dialog.style.setProperty('--book-height', `${textBookHeight}px`);
            const style = getComputedStyle(content);
            const limit = Math.max(40, Math.floor(content.clientWidth / parseFloat(style.fontSize)) * Math.max(2, Math.floor(content.clientHeight / parseFloat(style.lineHeight)) - 1));
            pages = textPages(text, limit);
            fragment.querySelectorAll('figure').forEach(figure => pages.push(figure.cloneNode(true)));
            pageIndex = Math.min(pageIndex, pages.length - 1);
            paintPage();
        }
        function paintPage() {
            content.replaceChildren(pages[pageIndex].cloneNode(true)); content.scrollTop = 0;
            const photo = content.querySelector('figure img');
            dialog.classList.toggle('is-photo-page', Boolean(photo));
            const ratio = photo ? Number(photo.getAttribute('width')) / Number(photo.getAttribute('height')) : 0;
            dialog.style.setProperty('--book-height', `${ratio ? Math.min(innerHeight - 88, Math.max(380, 190 + content.clientWidth / ratio)) : textBookHeight}px`);
            dialog.querySelector('.mc-book-page-number').textContent = `第 ${pageIndex + 1} / ${pages.length} 页`;
            dialog.querySelector('.mc-book-prev').disabled = pageIndex === 0;
            dialog.querySelector('.mc-book-next').disabled = pageIndex === pages.length - 1;
            dialog.querySelector('.mc-entry-prev').disabled = entry === 0;
            dialog.querySelector('.mc-entry-next').disabled = entry === stops.length - 1;
            if (!reduce.matches) content.animate([{opacity:.25, transform:'translateX(5px)'},{opacity:1, transform:'none'}], {duration:180});
        }
        function turnPage(delta) { const next = pageIndex + delta; if(next >= 0 && next < pages.length) {pageIndex = next; paintPage();} }
        function turnEntry(delta) {
            const next = entry + delta;
            if(next >= 0 && next < stops.length) {
                entry = next; pageIndex = 0; buildPages();
                focused = entry; updateFocus(); cartY = targetY;
                world?.render(cartY, -app.getBoundingClientRect().top, performance.now(), reduce.matches, active);
            }
        }
        async function openEntry(button) {
            if (opening || dialog.open) return;
            opening = true; returnFocus = button;
            button.setAttribute('aria-busy', 'true');
            entry = Number(button.dataset.detail.replace('mc-detail-', '')); pageIndex = 0;
            try {
                if (button.classList.contains('mc-chest-btn') && world && !reduce.matches) await world.openChest(button);
                if (disposed || !button.isConnected) return;
                dialog.showModal(); buildPages();
                if (button.dataset.photo) {pageIndex = pages.findIndex(page => page.matches('figure')); if(pageIndex < 0) pageIndex = 0; paintPage();}
            } finally {button.removeAttribute('aria-busy'); opening = false;}
        }
        listen(app, 'click', event => {
            const button = event.target.closest('button[data-detail]');
            if (button) openEntry(button);
            const link = event.target.closest('a[href^="#mc-"]');
            if(link) {
                const target = app.querySelector(link.getAttribute('href')) || app;
                event.preventDefault(); focused = null;
                target.scrollIntoView({behavior:reduce.matches ? 'instant' : 'smooth',block:'start'});
                history.replaceState(history.state, '', link.getAttribute('href'));
            }
        });
        listen(dialog.querySelector('.mc-dialog-close'), 'click', () => dialog.close());
        listen(dialog, 'click', event => {if(event.target === dialog) dialog.close();});
        listen(dialog, 'close', () => {
            world?.resetChests();
            const target = stops[entry];
            focusLockUntil = performance.now() + 350;
            target.scrollIntoView({behavior:'instant', block:'center'});
            const sameEntry = returnFocus?.closest('.mc-milestone-block') === target;
            (sameEntry ? returnFocus : target.querySelector('.mc-entry-title')).focus({preventScroll:true});
            focused = entry; updateFocus(); cartY = targetY;
            requestFrame();
        });
        listen(dialog.querySelector('.mc-book-prev'), 'click', () => turnPage(-1));
        listen(dialog.querySelector('.mc-book-next'), 'click', () => turnPage(1));
        listen(dialog.querySelector('.mc-entry-prev'), 'click', () => turnEntry(-1));
        listen(dialog.querySelector('.mc-entry-next'), 'click', () => turnEntry(1));
        listen(dialog, 'keydown', event => {
            if(event.key === 'ArrowRight') {event.preventDefault(); turnPage(1);}
            if(event.key === 'ArrowLeft') {event.preventDefault(); turnPage(-1);}
        });
        listen(window, 'scroll', () => {
            if(innerWidth<=600 && !dialog.open) {
                app.classList.add('is-scrolling');clearTimeout(chromeTimer);
                chromeTimer=setTimeout(()=>app.classList.remove('is-scrolling'),650);
            }
            if(!dialog.open && focused !== null) {
                const box = stops[focused].getBoundingClientRect();
                if(performance.now() > focusLockUntil || box.bottom < 0 || box.top > innerHeight) focused = null;
            }
            updateFocus(); requestFrame();
        }, {passive:true});
        // Focus can itself scroll the page. Only user scrolling should release a station.
        for (const event of ['wheel','touchmove']) listen(window, event, () => {focused = null;}, {passive:true});
        listen(window, 'pointerdown', event => {if(!event.target.closest('button[data-detail]')) focused = null;}, {passive:true});
        listen(window, 'keydown', event => {if(!dialog.open && ['PageDown','PageUp','Home','End','ArrowDown','ArrowUp',' '].includes(event.key)) focused = null;});
        listen(app, 'focusin', event => {const stop = event.target.closest('.mc-milestone-block'); if(stop && !dialog.open) {focusLockUntil = performance.now() + 350; const bounds = event.target.getBoundingClientRect(); if(bounds.top < 0 || bounds.bottom > innerHeight) event.target.scrollIntoView({behavior:'instant',block:'center'}); focused = stops.indexOf(stop); updateFocus(); requestFrame();}});
        listen(app, 'focusout', event => {if(!dialog.open && !event.relatedTarget?.closest('.mc-milestone-block')) {focused = null; updateFocus(); requestFrame();}});
        listen(document, 'visibilitychange', requestFrame);
        listen(reduce, 'change', () => {updateFocus(); requestFrame();});
        const resize = new ResizeObserver(layout); resize.observe(app);
        listen(window, 'resize', layout, {passive:true});
        layout(); cartY = targetY;
        const worldURL = new URL('timeline-world.js', scriptURL);
        worldURL.search = new URL(scriptURL).search;
        import(worldURL.href).then(module => module.createWorld(app)).then(async result => {
            await document.fonts.ready;
            await Promise.all([...app.querySelectorAll('.mc-memory-display img')].filter(img => {
                const box = img.getBoundingClientRect(); return box.bottom > 0 && box.top < innerHeight;
            }).map(img => {img.loading = 'eager'; return img.decode().catch(() => {});}));
            if (disposed) {result.dispose(); return;}
            world = result; app.classList.remove('mc-no-webgl'); layout(); cartY = targetY;
            // Commit a fully rendered first frame before exposing the scene.
            world.render(cartY, -app.getBoundingClientRect().top, performance.now(), reduce.matches, active);
            app.dataset.worldReady = 'true'; app.classList.remove('is-loading'); requestFrame();
        }).catch(error => {if(!disposed) {app.classList.remove('is-loading'); app.classList.add('mc-no-webgl'); app.dataset.worldReady = 'fallback'; console.warn('Timeline: using static rail fallback.', error);}});
        cleanup = () => {disposed = true; clearTimeout(chromeTimer);events.abort(); resize.disconnect(); cancelAnimationFrame(frame); world?.dispose(); if(dialog.open) dialog.close();};
    }
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true,signal:lifecycle.signal}); else init();
    document.addEventListener('pjax:complete', init, {signal:lifecycle.signal});
    window.sducraftTimelineDispose = () => {cleanup?.();lifecycle.abort();};
})();
