(() => {
    'use strict';

    const footer = document.querySelector('#mc-footer');
    if (!footer || footer.dataset.initialized === 'true') return;

    const sakurairoFooter = document.querySelector('#colophon.site-footer');
    if (sakurairoFooter) {
        sakurairoFooter.before(footer);
    }

    const sakurairoWrapper = document.querySelector('.site.wrapper');

    function normalizedPath(url) {
        const path = new URL(url, window.location.origin).pathname.replace(/\/+$/, '');
        return path || '/';
    }

    function syncHomepageState() {
        const isHomepage = normalizedPath(window.location.href) === normalizedPath(footer.dataset.homeUrl || '/');
        document.body.classList.toggle('sducraft-mc-footer-enabled', isHomepage);
        footer.hidden = !isHomepage;

        if (isHomepage && sakurairoWrapper) {
            sakurairoWrapper.style.removeProperty('padding-bottom');
        }
    }

    syncHomepageState();
    document.addEventListener('pjax:complete', syncHomepageState);

    footer.dataset.initialized = 'true';

    const surface = footer.querySelector('#mc-surface');
    const surfaceBlocks = footer.querySelector('#mc-surface-blocks');
    const tnt = footer.querySelector('#mc-tnt');
    const explosion = footer.querySelector('#mc-explosion');
    const underground = footer.querySelector('#mc-underground');
    const world = footer.querySelector('#mc-world');
    const status = footer.querySelector('#mc-status');
    const toolCursor = footer.querySelector('#mc-tool-cursor');
    const toolCursorImage = toolCursor.querySelector('img');
    const assetsBase = footer.dataset.assetsBase || '';

    function assetUrl(relativePath) {
        return `${assetsBase}${relativePath}`;
    }

    const config = {
        visibleRatio: 0.5,
        revealDelayMs: Number(footer.dataset.revealDelay) || 4000,
        ignitionAttempts: Number(footer.dataset.ignitionAttempts) || 5,
        inputCooldownMs: 180,
        fuseDurationMs: 2830,
        scrollThreshold: Number(footer.dataset.scrollThreshold) || 600,
        masterVolume: 0.68,
    };

    function readEasterEggs() {
        try {
            const entries = JSON.parse(footer.dataset.easterEggs || '[]');
            if (!Array.isArray(entries)) return [];

            return entries.filter((entry) => (
                entry
                && typeof entry === 'object'
                && typeof entry.id === 'string'
                && Number.isFinite(Number(entry.x))
                && Number.isFinite(Number(entry.depth))
            )).map((entry) => ({
                ...entry,
                x: Math.min(1, Math.max(0, Number(entry.x))),
                depth: Math.trunc(Number(entry.depth)),
            }));
        } catch (_) {
            return [];
        }
    }

    const easterEggs = readEasterEggs();
    const eggsByBlock = new WeakMap();

    function getEasterEggDialog(id) {
        return Array.from(footer.querySelectorAll('[data-easter-egg-dialog]'))
            .find((dialog) => dialog.dataset.easterEggDialog === id);
    }

    function closeEasterEggDialog(dialog) {
        if (typeof dialog.close === 'function') {
            dialog.close();
        } else {
            dialog.removeAttribute('open');
        }
    }

    function openEasterEggDialog(egg) {
        const dialog = getEasterEggDialog(egg.id);
        if (!dialog) return false;

        footer.querySelectorAll('.mc-easter-egg-dialog[open]').forEach((openDialog) => {
            if (openDialog !== dialog) closeEasterEggDialog(openDialog);
        });
        hideToolCursor();
        if (typeof dialog.showModal === 'function') {
            if (!dialog.open) dialog.showModal();
        } else {
            dialog.setAttribute('open', '');
        }
        dialog.querySelector('[data-mc-dialog-close]')?.focus();
        return true;
    }

    footer.addEventListener('click', (event) => {
        const closeButton = event.target.closest('[data-mc-dialog-close]');
        if (closeButton) closeEasterEggDialog(closeButton.closest('dialog'));
    });

    footer.querySelectorAll('.mc-easter-egg-dialog').forEach((dialog) => {
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog) closeEasterEggDialog(dialog);
        });
    });

    footer.addEventListener('sducraft:block-mined', (event) => {
        event.detail.easterEggs.some(openEasterEggDialog);
    });

    const assets = {
        ignite: assetUrl('audio/Fire_ignite.ogg.mp3'),
        fuse: assetUrl('audio/Fuse.ogg'),
        explosion: assetUrl('audio/Explosion1.ogg'),
        landing: assetUrl('audio/Grass_dig2.ogg'),
        breakGrass: assetUrl('audio/Grass_dig4.ogg'),
        breakDirt: assetUrl('audio/Gravel_dig3.ogg'),
        breakStone: assetUrl('audio/Stone_dig1.ogg'),
        breakWood: assetUrl('audio/Wood_dig4.ogg'),
        flint: assetUrl('tools/flint_and_steel.png'),
        pickaxe: assetUrl('tools/iron_pickaxe.png'),
        textures: {
            grass: assetUrl('blocks/grass_block_side.png'),
            dirt: assetUrl('blocks/dirt.png'),
            stone: assetUrl('blocks/stone.png'),
            bedrock: assetUrl('blocks/bedrock.png'),
            log: assetUrl('blocks/oak_log.png'),
            leaves: assetUrl('blocks/oak_leave.png'),
            sapling: assetUrl('blocks/oak_sapling.png'),
        },
    };

    const audio = {
        ignite: new Audio(assets.ignite),
        fuse: new Audio(assets.fuse),
        explosion: new Audio(assets.explosion),
        landing: new Audio(assets.landing),
        breakGrass: new Audio(assets.breakGrass),
        breakDirt: new Audio(assets.breakDirt),
        breakStone: new Audio(assets.breakStone),
        breakWood: new Audio(assets.breakWood),
    };
    Object.values(audio).forEach((item) => {
        item.preload = 'auto';
        item.volume = config.masterVolume;
    });
    audio.landing.volume = Math.min(1, config.masterVolume + 0.14);

    let state = 'idle';
    let revealTimer = 0;
    let landingTimer = 0;
    let attempts = 0;
    let lastInputAt = 0;
    let fuseStartedAt = 0;
    let fuseAnimationFrame = 0;
    let unlockProgress = 0;
    let touchStartY = null;
    let mining = null;
    let worldBuilt = false;
    let resizeTimer = 0;
    let audioPrimed = false;
    let audioPriming = false;

    function setState(nextState) {
        state = nextState;
        footer.dataset.state = nextState;
    }

    function announce(message) {
        status.textContent = '';
        window.setTimeout(() => {
            status.textContent = message;
        }, 20);
    }

    function playSound(sound) {
        try {
            sound.currentTime = 0;
            const playback = sound.play();
            if (playback) playback.catch(() => {});
        } catch (_) {
            // Audio failure must not block the interaction.
        }
    }

    function primeAudio() {
        if (audioPrimed || audioPriming) return;
        audioPriming = true;
        const attemptsToPrime = Object.values(audio).map((item) => {
            const wasMuted = item.muted;
            item.muted = true;
            try {
                const playback = item.play();
                if (!playback) return Promise.resolve();
                return playback.then(() => {
                    item.pause();
                    item.currentTime = 0;
                    item.muted = wasMuted;
                });
            } catch (_) {
                item.muted = wasMuted;
                return Promise.reject();
            }
        });

        Promise.all(attemptsToPrime).then(() => {
            audioPrimed = true;
            audioPriming = false;
            Object.values(audio).forEach((item) => {
                item.muted = false;
            });
            removeAudioPrimingListeners();
        }).catch(() => {
            audioPriming = false;
            Object.values(audio).forEach((item) => {
                item.pause();
                item.currentTime = 0;
                item.muted = false;
            });
        });
    }

    function removeAudioPrimingListeners() {
        document.removeEventListener('pointerdown', primeAudio, true);
        document.removeEventListener('touchstart', primeAudio, true);
        document.removeEventListener('keydown', primeAudio, true);
        document.removeEventListener('wheel', primeAudio, true);
    }

    document.addEventListener('pointerdown', primeAudio, true);
    document.addEventListener('touchstart', primeAudio, { capture: true, passive: true });
    document.addEventListener('keydown', primeAudio, true);
    document.addEventListener('wheel', primeAudio, { capture: true, passive: true });

    function buildSurface() {
        const blockSize = Number.parseFloat(getComputedStyle(footer).getPropertyValue('--surface-block')) || 48;
        const cols = Math.ceil(surface.clientWidth / blockSize);
        const rows = Math.ceil(surface.clientHeight / blockSize);
        surfaceBlocks.style.setProperty('--surface-cols', cols);
        surfaceBlocks.style.setProperty('--surface-rows', rows);
        surfaceBlocks.replaceChildren();

        const fragment = document.createDocumentFragment();
        for (let row = 0; row < rows; row += 1) {
            for (let col = 0; col < cols; col += 1) {
                const block = document.createElement('span');
                block.className = 'mc-surface-block';
                block.dataset.row = String(row);
                block.dataset.col = String(col);
                fragment.append(block);
            }
        }
        surfaceBlocks.append(fragment);
    }

    function startRevealTimer() {
        if (state !== 'idle') return;
        setState('waiting');
        revealTimer = window.setTimeout(revealTnt, config.revealDelayMs);
    }

    function cancelRevealTimer() {
        if (state !== 'waiting') return;
        window.clearTimeout(revealTimer);
        revealTimer = 0;
        setState('idle');
    }

    function revealTnt() {
        if (state !== 'waiting') return;
        tnt.hidden = false;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setState('tnt-falling');
                landingTimer = window.setTimeout(landTnt, 1050);
            });
        });
        announce('一个 TNT 正从上方落下');
    }

    function landTnt() {
        if (state !== 'tnt-falling') return;
        window.clearTimeout(landingTimer);
        landingTimer = 0;
        setState('tnt-ready');
        playSound(audio.landing);
        tnt.classList.add('is-landed');
        window.setTimeout(() => tnt.classList.remove('is-landed'), 180);
        if (navigator.vibrate) navigator.vibrate(24);
        announce('TNT 落在了黑色混凝土上');
    }

    tnt.addEventListener('transitionend', (event) => {
        if (event.propertyName === 'transform') landTnt();
    });

    const observer = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (document.hidden) return;
        if (entry.isIntersecting && entry.intersectionRatio >= config.visibleRatio) {
            startRevealTimer();
        } else {
            cancelRevealTimer();
        }
    }, { threshold: [0, config.visibleRatio, 1] });
    observer.observe(footer);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelRevealTimer();
            stopMining();
        }
    });

    function strikeTnt(event) {
        if (state !== 'tnt-ready') return;
        const now = performance.now();
        if (now - lastInputAt < config.inputCooldownMs) return;
        lastInputAt = now;
        attempts += 1;

        playSound(audio.ignite);
        animateToolUse('flint');
        tnt.classList.remove('is-struck');
        void tnt.offsetWidth;
        tnt.classList.add('is-struck');

        if (navigator.vibrate) navigator.vibrate(18);
        if (attempts >= config.ignitionAttempts) {
            lightFuse();
        } else {
            announce('点火失败，还需要继续尝试');
        }

        if (event) event.preventDefault();
    }

    tnt.addEventListener('pointerup', strikeTnt);
    tnt.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') strikeTnt(event);
    });
    tnt.addEventListener('animationend', () => tnt.classList.remove('is-struck'));

    function lightFuse() {
        if (state !== 'tnt-ready') return;
        hideToolCursor();
        setState('fuse-lit');
        tnt.disabled = true;
        tnt.setAttribute('aria-label', 'TNT 引信已点燃');
        announce('TNT 引信已点燃');
        playSound(audio.fuse);
        fuseStartedAt = performance.now();

        let lastFlashBucket = -1;
        const animateFuse = (now) => {
            if (state !== 'fuse-lit') return;
            const elapsed = now - fuseStartedAt;
            const progress = Math.min(elapsed / config.fuseDurationMs, 1);
            const interval = 310 - (progress * 230);
            const bucket = Math.floor(elapsed / interval);
            if (bucket !== lastFlashBucket) {
                lastFlashBucket = bucket;
                tnt.classList.toggle('is-flashing');
                tnt.style.scale = String(1 + (progress * 0.08));
            }

            if (progress < 1) {
                fuseAnimationFrame = requestAnimationFrame(animateFuse);
            } else {
                explode();
            }
        };
        fuseAnimationFrame = requestAnimationFrame(animateFuse);
    }

    function createParticles() {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const count = reduceMotion ? 9 : 28;
        const fragment = document.createDocumentFragment();

        for (let index = 0; index < count; index += 1) {
            const particle = document.createElement('span');
            const smoke = index % 3 === 0;
            const frameCount = smoke ? 12 : 16;
            const frame = index % frameCount;
            const angle = (index / count) * Math.PI * 2 + ((index % 4) * 0.17);
            const distance = smoke ? 95 + ((index * 19) % 115) : 55 + ((index * 23) % 105);
            const x = Math.cos(angle) * distance;
            const y = (Math.sin(angle) * distance) - (smoke ? 32 : 0);

            particle.className = 'mc-particle';
            particle.style.setProperty('--particle-size', `${smoke ? 40 + (index % 4) * 9 : 52 + (index % 5) * 8}px`);
            particle.style.setProperty('--particle-x', `${x}px`);
            particle.style.setProperty('--particle-y', `${y}px`);
            particle.style.setProperty('--particle-delay', `${(index % 6) * 18}ms`);
            particle.style.setProperty('--particle-duration', `${smoke ? 720 + (index % 5) * 55 : 460 + (index % 4) * 45}ms`);
            particle.style.setProperty('--particle-frame', `url("${assetUrl(`particles/${smoke ? 'big_smoke' : 'explosion'}_${frame}.png`)}")`);
            fragment.append(particle);
        }

        const flash = document.createElement('span');
        flash.className = 'mc-explosion-flash';
        fragment.append(flash);
        explosion.append(fragment);
    }

    function explode() {
        if (state !== 'fuse-lit') return;
        cancelAnimationFrame(fuseAnimationFrame);
        setState('exploding');
        tnt.classList.remove('is-flashing');
        tnt.style.scale = '';
        tnt.style.opacity = '0';
        audio.fuse.pause();
        playSound(audio.explosion);
        createParticles();
        footer.classList.add('is-shaking');
        if (navigator.vibrate) navigator.vibrate([45, 30, 75]);
        announce('TNT 爆炸了');

        window.setTimeout(destroySurface, 130);
        window.setTimeout(() => {
            footer.classList.remove('is-shaking');
            setState('crater-ready');
            explosion.replaceChildren();
            announce('混凝土下方出现了一个缺口');
        }, 1100);
    }

    function destroySurface() {
        const blocks = [...surfaceBlocks.children];
        if (!blocks.length) return;
        const cols = Number(surfaceBlocks.style.getPropertyValue('--surface-cols'));
        const radiusByRow = [2.2, 3.1, 4.4, 3.4];
        const center = (cols - 1) / 2;

        blocks.forEach((block) => {
            const row = Number(block.dataset.row);
            const col = Number(block.dataset.col);
            const radius = radiusByRow[Math.min(row, radiusByRow.length - 1)] || 3;
            const jaggedOffset = ((col + row * 3) % 4 === 0) ? 0.7 : 0;
            if (Math.abs(col - center) <= radius - jaggedOffset) {
                block.classList.add('is-destroyed');
                if ((col + row) % 2 === 0) createDebris(block);
            }
        });
    }

    function createDebris(block) {
        const surfaceRect = surface.getBoundingClientRect();
        const blockRect = block.getBoundingClientRect();
        const debris = document.createElement('span');
        const direction = blockRect.left + (blockRect.width / 2) < surfaceRect.left + (surfaceRect.width / 2) ? -1 : 1;
        debris.className = 'mc-surface-debris';
        debris.style.left = `${blockRect.left - surfaceRect.left + (blockRect.width / 2)}px`;
        debris.style.top = `${blockRect.top - surfaceRect.top + (blockRect.height / 2)}px`;
        debris.style.setProperty('--debris-x', `${direction * (50 + (Number(block.dataset.row) * 18))}px`);
        debris.style.setProperty('--debris-y', `${-55 - ((Number(block.dataset.col) % 4) * 16)}px`);
        debris.style.setProperty('--debris-rotation', `${direction * 180}deg`);
        surface.append(debris);
        debris.addEventListener('animationend', () => debris.remove(), { once: true });
    }

    function atPageBottom() {
        return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 3;
    }

    function addUnlockProgress(amount) {
        if (state !== 'crater-ready' || amount <= 0 || !atPageBottom()) return false;
        unlockProgress = Math.min(unlockProgress + amount, config.scrollThreshold);
        footer.style.setProperty('--unlock-progress', String(unlockProgress / config.scrollThreshold));
        if (unlockProgress >= config.scrollThreshold) openUnderground();
        return true;
    }

    window.addEventListener('wheel', (event) => {
        if (event.deltaY > 0 && addUnlockProgress(event.deltaY)) event.preventDefault();
    }, { passive: false });

    window.addEventListener('touchstart', (event) => {
        touchStartY = event.touches[0]?.clientY ?? null;
    }, { passive: true });

    window.addEventListener('touchmove', (event) => {
        if (touchStartY === null) return;
        const currentY = event.touches[0]?.clientY ?? touchStartY;
        const amount = Math.max(0, touchStartY - currentY);
        touchStartY = currentY;
        if (addUnlockProgress(amount * 1.6)) event.preventDefault();
    }, { passive: false });

    window.addEventListener('touchend', () => {
        touchStartY = null;
    }, { passive: true });

    window.addEventListener('keydown', (event) => {
        if (!['ArrowDown', 'PageDown', ' ', 'End'].includes(event.key)) return;
        const amount = event.key === 'ArrowDown' ? 44 : 180;
        if (addUnlockProgress(amount)) event.preventDefault();
    });

    function openUnderground() {
        if (state !== 'crater-ready') return;
        buildWorld();
        underground.setAttribute('aria-hidden', 'false');
        setState('underground-open');
        announce('地下方块世界已经打开');
    }

    function worldType(row, col, cols) {
        if (row < 6) {
            const treeCol = Math.floor(cols * 0.72);
            const distanceFromTrunk = Math.abs(col - treeCol);

            if (col === treeCol && row >= 2) return 'log';
            if (row === 0 && distanceFromTrunk <= 1) return 'leaves';
            if ((row === 1 || row === 2) && distanceFromTrunk <= 2) return 'leaves';
            if (row === 3 && distanceFromTrunk <= 1) return 'leaves';
            if (row === 5 && col === Math.floor(cols * 0.25)) return 'sapling';
            return 'sky';
        }
        if (row === 6) return 'grass';
        if (row <= 9) return 'dirt';
        if (row <= 17) return 'stone';
        return 'bedrock';
    }

    function setBlockCoordinates(block, row, col, cols, surfaceRow) {
        block.dataset.column = String(col);
        block.dataset.xRatio = (cols > 1 ? col / (cols - 1) : 0).toFixed(4);
        block.dataset.row = String(row);
        block.dataset.depth = String(row - surfaceRow);
    }

    function isMineableBlock(block) {
        return block?.matches('.mc-world-block:not(.is-air):not(.is-sky):not(.is-bedrock)');
    }

    function bindEasterEggs(cols, rows, surfaceRow) {
        const resolved = [];

        easterEggs.forEach((egg) => {
            const row = surfaceRow + egg.depth;
            if (row < 0 || row >= rows) return;

            const preferredCol = Math.round(egg.x * (cols - 1));
            let target = null;
            for (let offset = 0; offset < cols && !target; offset += 1) {
                const candidates = offset === 0
                    ? [preferredCol]
                    : [preferredCol - offset, preferredCol + offset];
                const targetCol = candidates.find((col) => {
                    if (col < 0 || col >= cols) return false;
                    return isMineableBlock(world.children[(row * cols) + col]);
                });
                if (targetCol !== undefined) target = world.children[(row * cols) + targetCol];
            }
            if (!target) return;

            const current = eggsByBlock.get(target) || [];
            current.push(egg);
            eggsByBlock.set(target, current);
            target.dataset.easterEgg = current.map((item) => item.id).join(' ');
            resolved.push({
                id: egg.id,
                requestedX: egg.x,
                column: Number(target.dataset.column),
                columnRatio: Number(target.dataset.xRatio),
                depth: Number(target.dataset.depth),
                type: target.dataset.type,
            });
        });

        footer.dispatchEvent(new CustomEvent('sducraft:world-built', {
            bubbles: true,
            detail: { columns: cols, rows, surfaceRow, easterEggs: resolved },
        }));
    }

    function buildWorld() {
        if (worldBuilt) return;
        worldBuilt = true;
        const viewportWidth = Math.max(document.documentElement.clientWidth, 320);
        const targetSize = viewportWidth <= 640 ? 40 : 48;
        const cols = Math.max(8, Math.ceil(viewportWidth / targetSize));
        const blockSize = viewportWidth / cols;
        const rows = 19;
        const surfaceRow = 6;
        world.style.setProperty('--world-cols', cols);
        world.style.setProperty('--world-block-size', `${blockSize}px`);
        world.dataset.columns = String(cols);
        world.dataset.rows = String(rows);
        world.dataset.surfaceRow = String(surfaceRow);
        underground.style.setProperty('--world-height', `${rows * blockSize}px`);

        const fragment = document.createDocumentFragment();
        for (let row = 0; row < rows; row += 1) {
            for (let col = 0; col < cols; col += 1) {
                const type = worldType(row, col, cols);
                if (type === 'sky') {
                    const sky = document.createElement('span');
                    sky.className = 'mc-world-block is-sky';
                    sky.dataset.type = type;
                    setBlockCoordinates(sky, row, col, cols, surfaceRow);
                    sky.setAttribute('aria-hidden', 'true');
                    fragment.append(sky);
                    continue;
                }
                if (type === 'bedrock') {
                    const bedrock = document.createElement('span');
                    bedrock.className = 'mc-world-block is-bedrock';
                    bedrock.dataset.type = type;
                    setBlockCoordinates(bedrock, row, col, cols, surfaceRow);
                    bedrock.style.setProperty('--block-texture', `url("${assets.textures.bedrock}")`);
                    bedrock.setAttribute('aria-label', '基岩，不可挖掘');
                    fragment.append(bedrock);
                    continue;
                }
                const block = document.createElement('button');
                block.type = 'button';
                block.className = 'mc-world-block';
                block.dataset.type = type;
                setBlockCoordinates(block, row, col, cols, surfaceRow);
                block.dataset.hardness = String({ grass: 850, dirt: 750, stone: 1450, log: 1100, leaves: 500, sapling: 420 }[type]);
                block.style.setProperty('--block-texture', `url("${assets.textures[type]}")`);
                block.setAttribute('aria-label', `挖掘${{ grass: '草方块', dirt: '泥土', stone: '石头', log: '橡木', leaves: '橡树树叶', sapling: '树苗' }[type]}`);
                block.tabIndex = -1;
                fragment.append(block);
            }
        }
        world.append(fragment);
        bindEasterEggs(cols, rows, surfaceRow);
    }

    function startMining(event) {
        const block = event.target.closest('.mc-world-block:not(.is-air):not(.is-sky):not(.is-bedrock)');
        if (!block || state !== 'underground-open') return;
        event.preventDefault();
        stopMining();
        block.setPointerCapture?.(event.pointerId);
        mining = {
            block,
            pointerId: event.pointerId,
            startedAt: performance.now(),
            hardness: Number(block.dataset.hardness),
            stage: -1,
            frame: 0,
        };
        block.classList.add('is-mining');
        toolCursor.classList.add('is-mining');
        mining.frame = requestAnimationFrame(updateMining);
    }

    function updateMining(now) {
        if (!mining) return;
        const progress = Math.min((now - mining.startedAt) / mining.hardness, 1);
        const stage = Math.min(9, Math.floor(progress * 10));
        mining.block.style.setProperty('--mining-progress', progress.toFixed(3));
        if (stage !== mining.stage) {
            mining.stage = stage;
            mining.block.style.setProperty('--destroy-texture', `url("${assetUrl(`particles/destroy_stage_${stage}.png`)}")`);
        }
        if (progress >= 1) {
            breakBlock(mining.block);
            stopMining();
            return;
        }
        mining.frame = requestAnimationFrame(updateMining);
    }

    function stopMining(event) {
        if (!mining) return;
        if (event?.pointerId !== undefined && event.pointerId !== mining.pointerId) return;
        cancelAnimationFrame(mining.frame);
        mining.block.classList.remove('is-mining');
        mining.block.style.setProperty('--mining-progress', '0');
        mining.block.style.setProperty('--destroy-texture', 'none');
        toolCursor.classList.remove('is-mining');
        mining = null;
    }

    function breakBlock(block) {
        const rect = block.getBoundingClientRect();
        const worldRect = world.getBoundingClientRect();
        const type = block.dataset.type;
        const detail = {
            type,
            column: Number(block.dataset.column),
            columnRatio: Number(block.dataset.xRatio),
            row: Number(block.dataset.row),
            depth: Number(block.dataset.depth),
            world: {
                columns: Number(world.dataset.columns),
                rows: Number(world.dataset.rows),
                surfaceRow: Number(world.dataset.surfaceRow),
            },
            easterEggs: (eggsByBlock.get(block) || []).map((egg) => ({ ...egg })),
        };
        const beforeBreak = new CustomEvent('sducraft:block-before-break', {
            bubbles: true,
            cancelable: true,
            detail,
        });
        if (!block.dispatchEvent(beforeBreak)) return false;

        const breakSound = {
            grass: audio.breakGrass,
            leaves: audio.breakGrass,
            sapling: audio.breakGrass,
            dirt: audio.breakDirt,
            stone: audio.breakStone,
            log: audio.breakWood,
        }[type];
        if (breakSound) playSound(breakSound);
        block.classList.add('is-air');
        block.disabled = true;
        block.removeAttribute('aria-label');
        block.style.setProperty('--mining-progress', '0');
        block.style.setProperty('--destroy-texture', 'none');

        const drop = document.createElement('span');
        drop.className = 'mc-block-drop';
        drop.style.left = `${rect.left - worldRect.left + (rect.width / 2) - 10}px`;
        drop.style.top = `${rect.top - worldRect.top + (rect.height / 2) - 10}px`;
        drop.style.setProperty('--drop-texture', `url("${assets.textures[type]}")`);
        world.append(drop);
        drop.addEventListener('animationend', () => drop.remove(), { once: true });
        if (navigator.vibrate) navigator.vibrate(24);
        announce('方块已挖开');
        block.dispatchEvent(new CustomEvent('sducraft:block-mined', {
            bubbles: true,
            detail,
        }));
        return true;
    }

    world.addEventListener('pointerdown', startMining);
    world.addEventListener('pointerup', stopMining);
    world.addEventListener('pointercancel', stopMining);
    world.addEventListener('pointerleave', stopMining);
    world.addEventListener('contextmenu', (event) => event.preventDefault());

    function showToolCursor(type) {
        if (!window.matchMedia('(pointer: fine)').matches) return;
        toolCursorImage.src = type === 'flint' ? assets.flint : assets.pickaxe;
        toolCursor.classList.toggle('is-flint', type === 'flint');
        toolCursor.classList.toggle('is-pickaxe', type === 'pickaxe');
        footer.classList.add('has-tool-cursor');
    }

    function animateToolUse(type) {
        if (!window.matchMedia('(pointer: fine)').matches || type !== 'flint') return;
        toolCursor.classList.remove('is-using-flint');
        void toolCursor.offsetWidth;
        toolCursor.classList.add('is-using-flint');
    }

    function hideToolCursor() {
        footer.classList.remove('has-tool-cursor');
        toolCursor.classList.remove('is-flint', 'is-pickaxe', 'is-using-flint', 'is-mining');
    }

    toolCursor.addEventListener('animationend', (event) => {
        if (event.animationName === 'flint-use') toolCursor.classList.remove('is-using-flint');
    });

    tnt.addEventListener('pointerenter', () => {
        if (state === 'tnt-ready') showToolCursor('flint');
    });
    tnt.addEventListener('pointerleave', hideToolCursor);
    world.addEventListener('pointerenter', () => showToolCursor('pickaxe'));
    world.addEventListener('pointerleave', hideToolCursor);
    footer.addEventListener('pointermove', (event) => {
        toolCursor.style.left = `${event.clientX}px`;
        toolCursor.style.top = `${event.clientY}px`;
    });

    window.addEventListener('resize', () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
            if (['idle', 'waiting', 'tnt-ready', 'fuse-lit'].includes(state)) buildSurface();
        }, 120);
    });

    buildSurface();
})();
