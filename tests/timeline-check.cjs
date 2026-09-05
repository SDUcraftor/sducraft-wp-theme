// Run with PLAYWRIGHT_MODULE pointing at an installed Playwright package.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.TIMELINE_URL || 'http://127.0.0.1:8099/local-real-timeline.php';
const output = path.join(process.env.TEMP || '/tmp', 'sducraft-journey-check');
fs.mkdirSync(output,{recursive:true});
const compact = value => value.replace(/\s/g,'');
(async()=>{
 const browser = await chromium.launch({channel:'msedge',headless:true});
 try {
  for(const [width,height] of [[1440,1000],[390,844],[844,390],[320,568]]) {
   const page=await browser.newPage({viewport:{width,height}}),errors=[],failed=[];
   page.on('pageerror',error=>errors.push(error.message));
   page.on('response',response=>{if(response.status()>=400&&!response.url().includes('favicon'))failed.push(response.url());});
   await page.goto(url);
   await page.waitForSelector('[data-world-ready="true"]');
   assert.equal(await page.locator('.mc-milestone-block').count(),38);
   const dates=await page.locator('.mc-milestone-block').evaluateAll(a=>a.map(e=>e.dataset.date));
   assert.equal(dates[0],'2026-08-11');assert.equal(dates.at(-1),'2021-02-06');
   assert.deepEqual(dates,[...dates].sort().reverse());
   assert.equal(await page.locator('.mc-read-entry,[data-y]').count(),0);
   assert.equal(await page.locator('.mc-memory-display img').count(),15);
   assert.deepEqual(await page.locator('.mc-year-nav a').evaluateAll(a=>a.map(e=>e.dataset.year)),['2026','2025','2024','2023','2022','2021']);
   await page.screenshot({path:path.join(output,`hero-${width}.png`)});
   const orientations=[];
   for(const index of [1,2,3,16,24,37]) {
    await page.locator(`#mc-stop-${index}`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
    orientations.push(Number(await page.locator('#mc-timeline-app').getAttribute('data-cart-yaw')));
   }
   assert(Math.max(...orientations)-Math.min(...orientations)>.015,'Cart never changes orientation');
   assert.equal(await page.locator('.mc-year-nav [aria-current]').getAttribute('data-year'),'2021');
   await page.screenshot({path:path.join(output,`origin-${width}.png`)});
   await page.locator('#mc-stop-1 .mc-chest-btn').focus();
   await page.waitForTimeout(500);
   const focusDelta=await page.evaluate(()=>{
    const app=document.querySelector('#mc-timeline-app'),stop=document.querySelector('#mc-stop-1 .mc-stop-anchor');
    return Math.abs(Number(app.dataset.cartY)-(stop.getBoundingClientRect().top-app.getBoundingClientRect().top));
   });
   assert(focusDelta<3,'Cart does not stop at keyboard focus');
   await page.locator('#mc-stop-1').scrollIntoViewIfNeeded();
   await page.waitForTimeout(300);
   // Read the rendered alpha bounds throughout the complete lid animation.
   const frames=await page.locator('#mc-stop-1 .mc-chest-btn').evaluate(async button=>{
    function bounds(){const c=button.querySelector('canvas'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let left=c.width,right=0,top=c.height,bottom=0,count=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>20){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}return {left,right,top,bottom,count,amount:Number(button.dataset.openAmount),open:document.querySelector('dialog').open};}
    const samples=[bounds()];button.click();
    for(let i=0;i<10;i++){await new Promise(r=>setTimeout(r,80));samples.push(bounds());}return samples;
   });
   assert(frames.every(f=>f.count>300 && f.left>2 && f.right<130 && f.top>2 && f.bottom<158),'Chest clipped or empty: '+JSON.stringify(frames));
   assert(frames.some(f=>f.amount>.1&&f.amount<.99&&!f.open),'Book hides the opening animation');
   assert(frames.at(-1).amount===1&&frames.at(-1).open,'Chest never fully opened');
   assert(frames.at(-1).top<frames[0].top-5,'Lid did not rise');
   await page.screenshot({path:path.join(output,`book-${width}.png`)});
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('dialog').isVisible(),false);
   await page.locator('#mc-stop-0 .mc-entry-title').click();
   await page.locator('dialog').waitFor({state:'visible'});
   const expected=await page.locator('#mc-detail-0').evaluate(t=>t.content.querySelector('.mc-entry-text').textContent);
   let actual='',imageSeen=false;
   for(let i=0;i<8;i++) {
    if(await page.locator('.mc-book-content figure').count()) {
     imageSeen=true;await page.locator('.mc-book-content img').evaluate(img=>img.decode());
     assert(await page.locator('.mc-book-content img').evaluate(img=>img.naturalWidth>100));
     await page.waitForTimeout(200);await page.screenshot({path:path.join(output,`archive-photo-${width}.png`)});
    } else actual+=await page.locator('.mc-book-content').textContent();
    if(await page.locator('.mc-book-next').isDisabled())break;
    await page.locator('.mc-book-next').click();
   }
   assert.equal(compact(actual),compact(expected),'Pagination lost or duplicated history');
   assert(imageSeen,'Archive photo inaccessible');
   assert(await page.locator('.mc-entry-prev').isDisabled());
   await page.locator('.mc-entry-next').click();
   assert((await page.locator('#mc-dialog-title').textContent()).includes('小游戏'));
   const bookDate=await page.locator('.mc-book-date').textContent();
   assert.equal(await page.locator('.mc-hud-date').textContent(),bookDate,'Book did not update reading progress');
   const bounds=await page.evaluate(()=>{const d=document.querySelector('dialog'),r=d.getBoundingClientRect(),x=document.querySelector('.mc-dialog-close').getBoundingClientRect(),n=document.querySelector('.mc-book-navigation').getBoundingClientRect();return {top:r.top,bottom:r.bottom,scroll:d.scrollHeight-d.clientHeight,closeTop:x.top,closeRight:x.right,navBottom:n.bottom};});
   assert(bounds.top>=0&&bounds.bottom<=height&&bounds.closeTop>=bounds.top&&bounds.closeRight<=width&&bounds.navBottom<=height&&bounds.scroll<=1,'Book controls clipped: '+JSON.stringify(bounds));
   await page.locator('.mc-dialog-close').click();
   await page.waitForTimeout(200);
   assert.equal(await page.locator('.mc-milestone-block.is-active').getAttribute('data-date'),bookDate,'Close returned to wrong station');
   await page.locator('#mc-stop-16').scrollIntoViewIfNeeded();
   await page.waitForTimeout(250);
   assert.equal(await page.locator('.mc-year-nav [aria-current]').getAttribute('data-year'),'2024','Jump left stale reading focus');
   await page.screenshot({path:path.join(output,`station-${width}.png`)});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');
   await page.locator('.mc-year-nav a[data-year="2022"]').click();
   await page.waitForFunction(()=>document.querySelector('.mc-year-nav [aria-current]')?.dataset.year==='2022' && document.getElementById('mc-year-2022').getBoundingClientRect().top<60);
   for(const image of await page.locator('.mc-memory-display img').all()) {
    await image.evaluate(async img=>{img.loading='eager';await img.decode();});
    assert(await image.evaluate(img=>img.naturalWidth>100));
   }
   if(width===1440) {
    await page.setViewportSize({width:560,height:750});await page.waitForTimeout(300);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.setViewportSize({width,height});await page.waitForTimeout(300);
   }
   // Reinitialization must not duplicate contexts, thumbnails or listeners.
   await page.evaluate(()=>document.dispatchEvent(new Event('pjax:complete')));
   await page.waitForSelector('[data-world-ready="true"]');
   assert.equal(await page.locator('.mc-chest-btn canvas').count(),await page.locator('.mc-chest-btn').count());
   assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
   console.log(`${width}x${height}: descending 38 entries, 15 photos, cart/focus, chest bounds, book/close sync, controls, resize and PJAX passed`);
   await page.close();
  }
  {
   const page=await browser.newPage({viewport:{width:1280,height:900}});
   await page.route('**/*.glb',async route=>{await new Promise(r=>setTimeout(r,900));await route.continue();});
   await page.goto(url,{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('.mc-world-canvas').evaluate(c=>getComputedStyle(c).opacity),'0','Partial scene exposed before assets');
   await page.evaluate(()=>window.scrollTo({top:1800,behavior:'instant'}));
   await page.waitForSelector('[data-world-ready="true"]');
   const first=await page.locator('#mc-timeline-app').getAttribute('data-cart-y');
   await page.waitForTimeout(150);
   const second=await page.locator('#mc-timeline-app').getAttribute('data-cart-y');
   assert(Math.abs(Number(first)-Number(second))<1,'Minecart flies in after first frame');
   console.log('Slow cold load + scrolling during load: complete first frame, cart stays on route');await page.close();
  }
  for(const mode of ['reduce','missing-model','no-webgl']) {
   const page=await browser.newPage({reducedMotion:mode==='reduce'?'reduce':'no-preference'});
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   if(mode==='missing-model')await page.route('**/end_chest.glb',route=>route.abort());
   if(mode==='no-webgl')await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:get.call(this,type,...args);};});
   await page.goto(url);await page.waitForSelector('[data-world-ready]');
   await page.locator('.mc-chest-btn').first().click();await page.locator('dialog').waitFor({state:'visible'});
   await page.keyboard.press('Escape');assert.deepEqual(errors,[]);
   console.log(mode+': reading and closing passed');await page.close();
  }
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
