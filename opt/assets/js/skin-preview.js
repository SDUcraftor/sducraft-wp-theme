/* On-demand 3D skin preview using the theme's bundled Three.js. */
(function ($) {
    'use strict';
    const moduleURL = new URL('../../../js/vendor/three-r160/three.module.min.js', document.currentScript.src).href;
    $(function () {
        const root = document.querySelector('.sducraft-settings');
        if (!root) return;
        const dialog = document.createElement('dialog');
        dialog.className = 'sducraft-skin-dialog';
        dialog.setAttribute('aria-labelledby', 'sducraft-skin-dialog-title');
        dialog.innerHTML = '<header><h2 id="sducraft-skin-dialog-title">皮肤 3D 预览</h2><button type="button" class="button" data-close aria-label="关闭预览">关闭</button></header><div class="sducraft-skin-stage"></div><p data-status role="status"></p><footer><button type="button" class="button" data-reset>重置视角</button><span>拖动旋转 · 滚轮缩放 · 方向键旋转</span></footer>';
        document.body.append(dialog);
        const stage = dialog.querySelector('.sducraft-skin-stage');
        const status = dialog.querySelector('[data-status]');
        let generation = 0, dispose = () => {}, reset = () => {}, opener;
        function close() {
            generation++; dispose(); dispose = () => {}; reset = () => {};
            stage.replaceChildren(); opener?.focus();
        }
        dialog.addEventListener('close', close);
        dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
        dialog.querySelector('[data-reset]').addEventListener('click', () => reset());
        dialog.addEventListener('click', event => { if (event.target === dialog) {
            const r = dialog.getBoundingClientRect();
            if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
        }});
        async function open(button) {
            const field = button.closest('.sducraft-skin-field');
            const url = field.querySelector('input').value.trim();
            const slim = field.nextElementSibling?.querySelector('select')?.value === 'slim';
            opener = button;
            const current = ++generation;
            dispose(); stage.replaceChildren();
            status.textContent = url ? '正在加载皮肤…' : '未设置皮肤，人物将隐藏。';
            dialog.querySelector('h2').textContent = '皮肤 3D 预览 · ' + (slim ? 'Alex模型' : 'Steve模型');
            dialog.showModal();
            if (!url) return;
            try {
                const THREE = await import(moduleURL);
                if (current !== generation) return;
                const texture = await new THREE.TextureLoader().loadAsync(url);
                if (current !== generation) { texture.dispose(); return; }
                if (texture.image.width !== 64 || texture.image.height !== 64) {
                    texture.dispose(); throw new Error('需要标准 64×64 皮肤图片。');
                }
                let renderer;
                try { renderer = new THREE.WebGLRenderer({alpha: true, antialias: true}); }
                catch (error) { texture.dispose(); throw new Error('浏览器无法创建 3D 预览，请检查硬件加速。'); }
                const geometries = [], events = new AbortController();
                let observer;
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.magFilter = texture.minFilter = THREE.NearestFilter;
                const material = new THREE.MeshLambertMaterial({map: texture, alphaTest: .5, side: THREE.DoubleSide});
                dispose = () => { events.abort(); observer?.disconnect(); geometries.forEach(g => g.dispose()); material.dispose(); texture.dispose(); renderer.dispose(); renderer.forceContextLoss(); };
                const scene = new THREE.Scene(), person = new THREE.Group();
                scene.add(person);
                scene.add(new THREE.HemisphereLight(0xffffff, 0x8796ac, 2));
                const light = new THREE.DirectionalLight(0xffffff, 2); light.position.set(-30, 50, 50); scene.add(light);
                const camera = new THREE.PerspectiveCamera(35, 1, .1, 300);
                renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                const canvas = renderer.domElement;
                canvas.tabIndex = 0; canvas.setAttribute('role', 'img');
                canvas.setAttribute('aria-label', '皮肤三维预览，可拖动或使用方向键旋转');
                stage.append(canvas);
                function part(w, h, d, u, v, x, y, inflate = 0) {
                    const geo = new THREE.BoxGeometry(w + inflate, h + inflate, d + inflate);
                    geometries.push(geo);
                    const rects = [[u+d+w,v+d,d,h],[u,v+d,d,h],[u+d,v,w,d],[u+d+w,v,w,d],[u+d,v+d,w,h],[u+2*d+w,v+d,w,h]];
                    const uv = geo.attributes.uv;
                    rects.forEach(([a,b,c,e], face) => [[a,b],[a+c,b],[a,b+e],[a+c,b+e]].forEach(([px,py], i) => uv.setXY(face*4+i, px/64, 1-py/64)));
                    const mesh = new THREE.Mesh(geo, material); mesh.position.set(x, y, 0); person.add(mesh);
                }
                part(8,8,8,0,0,0,12); part(8,8,8,32,0,0,12,.7);
                part(8,12,4,16,16,0,2); part(8,12,4,16,32,0,2,.5);
                const arm = slim ? 3 : 4;
                for (const side of [-1, 1]) {
                    const right = side === -1;
                    part(arm,12,4,right?40:32,right?16:48,side*(4+arm/2),2);
                    part(arm,12,4,right?40:48,right?32:48,side*(4+arm/2),2,.5);
                    part(4,12,4,right?0:16,right?16:48,side*2,-10);
                    part(4,12,4,0,right?32:48,side*2,-10,.5);
                }
                let distance = 65, pointer = null;
                const draw = () => { camera.position.set(0, 1, distance); camera.lookAt(0,0,0); renderer.render(scene,camera); };
                reset = () => { person.rotation.set(.08, -.4, 0); distance = 65; draw(); };
                const listen = (name, callback, extra = {}) => canvas.addEventListener(name, callback, {...extra, signal: events.signal});
                listen('pointerdown', event => { if (event.button !== 0) return; pointer = {id:event.pointerId,x:event.clientX,y:event.clientY}; canvas.setPointerCapture(event.pointerId); canvas.focus(); });
                listen('pointermove', event => {
                    if (!pointer || pointer.id !== event.pointerId) return;
                    person.rotation.y += (event.clientX-pointer.x)*.012;
                    person.rotation.x = Math.max(-1.2,Math.min(1.2,person.rotation.x+(event.clientY-pointer.y)*.012));
                    pointer.x=event.clientX; pointer.y=event.clientY; draw();
                });
                for (const name of ['pointerup','pointercancel','lostpointercapture']) listen(name, () => { pointer=null; });
                listen('wheel', event => { event.preventDefault(); distance=Math.max(40,Math.min(100,distance+event.deltaY*.04)); draw(); }, {passive:false});
                listen('keydown', event => {
                    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
                    event.preventDefault();
                    if (event.key === 'ArrowLeft') person.rotation.y -= .15;
                    if (event.key === 'ArrowRight') person.rotation.y += .15;
                    if (event.key === 'ArrowUp') person.rotation.x = Math.max(-1.2,person.rotation.x-.15);
                    if (event.key === 'ArrowDown') person.rotation.x = Math.min(1.2,person.rotation.x+.15);
                    draw();
                });
                observer = new ResizeObserver(() => {
                    const width = stage.clientWidth, height = stage.clientHeight;
                    if (!width || !height) return;
                    renderer.setSize(width,height); camera.aspect=width/height; camera.updateProjectionMatrix(); draw();
                });
                observer.observe(stage); reset();
                status.textContent = '包含皮肤外层；预览使用当前未保存的图片和模型。';
            } catch (error) {
                if (current !== generation) return;
                dispose(); dispose = () => {}; reset = () => {}; stage.replaceChildren();
                status.textContent = error.message?.startsWith('需要') || error.message?.startsWith('浏览器') ? error.message : '加载失败，请检查皮肤地址和跨域访问权限。';
            }
        }
        function scan() {
            root.querySelectorAll('.sducraft-skin-field').forEach(field => {
                if (field.querySelector('.sducraft-skin-preview-button')) return;
                const button = document.createElement('button');
                button.type = 'button'; button.className = 'button sducraft-skin-preview-button'; button.textContent = '3D 预览';
                const upload = field.querySelector('.csf--upload');
                if (upload) upload.after(button); else field.querySelector('.csf-fieldset').append(button);
            });
        }
        $(root).on('click', '.sducraft-skin-preview-button', function (event) { event.preventDefault(); open(this); });
        new MutationObserver(scan).observe(root, {childList: true, subtree: true});
        window.addEventListener('pagehide', () => { generation++; dispose(); });
        scan();
    });
})(jQuery);
