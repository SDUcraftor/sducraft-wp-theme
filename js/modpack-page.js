document.addEventListener('DOMContentLoaded', function () {
    const button = document.querySelector('.modpack-load-more__button');
    const list = document.getElementById('sducraft-modpack-list');
    const status = document.querySelector('.modpack-load-more__status');

    if (!button || !list || typeof sducraftModpackPage === 'undefined') {
        return;
    }

    button.addEventListener('click', async function () {
        if (button.disabled) {
            return;
        }

        const label = button.querySelector('span');
        const icon = button.querySelector('i');
        const originalLabel = label.textContent;
        button.disabled = true;
        button.classList.add('is-loading');
        icon.className = 'fa-solid fa-spinner';
        label.textContent = sducraftModpackPage.loading;

        const body = new URLSearchParams({
            action: 'sducraft_load_modpacks',
            nonce: sducraftModpackPage.nonce,
            page_id: button.dataset.pageId,
            offset: button.dataset.offset
        });

        try {
            const response = await fetch(sducraftModpackPage.ajaxUrl, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
                body: body.toString()
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error('Unable to load modpacks');
            }

            list.insertAdjacentHTML('beforeend', result.data.html);
            button.dataset.offset = result.data.next_offset;
            status.textContent = '已加载更多整合包';

            if (!result.data.has_more) {
                button.parentElement.remove();
                return;
            }
        } catch (error) {
            status.textContent = sducraftModpackPage.error;
            label.textContent = sducraftModpackPage.error;
            await new Promise(function (resolve) {
                window.setTimeout(resolve, 1800);
            });
            label.textContent = originalLabel;
        } finally {
            if (document.body.contains(button)) {
                button.disabled = false;
                button.classList.remove('is-loading');
                icon.className = 'fa-solid fa-angle-down';
                if (label.textContent === sducraftModpackPage.loading) {
                    label.textContent = originalLabel;
                }
            }
        }
    });
});
