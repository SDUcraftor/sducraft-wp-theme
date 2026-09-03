function sducraftRevealCategoryPostCards(cards) {
    if (!('IntersectionObserver' in window)) {
        cards.forEach(function (card) {
            card.classList.add('post-list-show');
        });
        return;
    }

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) {
                return;
            }
            entry.target.classList.add('post-list-show');
            observer.unobserve(entry.target);
        });
    }, {threshold: 0.42});

    cards.forEach(function (card) {
        observer.observe(card);
    });
}

document.addEventListener('click', async function (event) {
    const button = event.target.closest('.sducraft-category-posts__button');
    if (!button || button.disabled || typeof sducraftCategoryPosts === 'undefined') {
        return;
    }

    const root = button.closest('.sducraft-category-posts');
    const list = root.querySelector('.sducraft-category-posts__list');
    const status = root.querySelector('.sducraft-category-posts__status');
    const label = button.querySelector('span');
    const icon = button.querySelector('i');
    const originalLabel = label.textContent;
    button.disabled = true;
    button.classList.add('is-loading');
    icon.className = 'fa-solid fa-spinner';
    label.textContent = sducraftCategoryPosts.loading;
    const body = new URLSearchParams({
        action: 'sducraft_load_category_posts',
        nonce: sducraftCategoryPosts.nonce,
        category_ids: button.dataset.categoryIds,
        number: button.dataset.number,
        offset: button.dataset.offset
    });

    try {
        const response = await fetch(sducraftCategoryPosts.ajaxUrl, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
            body: body.toString()
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error('Unable to load category posts');
        }

        const template = document.createElement('template');
        template.innerHTML = result.data.html;
        template.content.querySelectorAll('img.lazyload[data-src]').forEach(function (image) {
            image.src = image.dataset.src;
            if (image.dataset.srcset) {
                image.srcset = image.dataset.srcset;
            }
            image.loading = 'lazy';
            image.classList.remove('lazyload');
            image.removeAttribute('data-src');
            image.removeAttribute('data-srcset');
        });
        const cards = Array.from(template.content.querySelectorAll('.post-list-thumb, .shuoshuo-item'));
        list.appendChild(template.content);
        sducraftRevealCategoryPostCards(cards);
        button.dataset.offset = result.data.next_offset;
        status.textContent = '已加载更多文章';
        if (!result.data.has_more) {
            button.parentElement.remove();
            return;
        }
    } catch (error) {
        status.textContent = sducraftCategoryPosts.error;
        label.textContent = sducraftCategoryPosts.error;
        await new Promise(function (resolve) {
            window.setTimeout(resolve, 1800);
        });
    } finally {
        if (document.body.contains(button)) {
            button.disabled = false;
            button.classList.remove('is-loading');
            icon.className = 'fa-solid fa-angle-down';
            label.textContent = originalLabel;
        }
    }
});
