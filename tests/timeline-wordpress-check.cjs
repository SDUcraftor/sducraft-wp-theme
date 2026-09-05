const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({ignoreHTTPSErrors:true,viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 // Test local fixes inside the real WordPress page without changing the server.
 await page.route('**/wp-content/themes/SDUCraft/**',route=>{
  const file=new URL(route.request().url()).pathname.split('/SDUCraft/')[1];
  if(['css/timeline.css','js/timeline.js','js/timeline-world.js'].includes(file))return route.fulfill({body:fs.readFileSync(path.join(__dirname,'..',file)),contentType:file.endsWith('.css')?'text/css':'application/javascript'});
  return route.continue();
 });
 await page.goto('https://www.sducraft.top:8443/our_story/');await page.waitForSelector('[data-world-ready=true]');
 assert.equal(await page.locator('.mc-world-canvas').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
 assert.equal(await page.locator('#colophon').evaluate(e=>getComputedStyle(e).display),'none');
 await page.locator('#mc-stop-0 .mc-entry-title').click();await page.locator('.mc-book-next').click();await page.waitForTimeout(300);
 const book=await page.locator('dialog').boundingBox();assert(Math.abs(book.x+book.width/2-720)<2);assert(Math.abs(book.y+book.height/2-500)<2);
 const image=await page.locator('.mc-book-content img').boundingBox();assert(image.width>800&&image.height>400,JSON.stringify(image));
 assert.equal(await page.locator('.mc-entry-next').evaluate(e=>getComputedStyle(e).boxShadow),'none');
 await page.screenshot({path:path.join(process.env.TEMP,'timeline-wordpress-book.png')});
 await page.locator('.mc-dialog-close').click();
 await page.evaluate(()=>history.replaceState({...history.state,timelineTest:'keep'},''));
 await page.locator('.mc-year-nav [data-year="2024"]').click();await page.waitForTimeout(1500);
 assert.equal(await page.evaluate(()=>history.state.timelineTest),'keep');
 const previousY=await page.evaluate(()=>scrollY);
 console.log('WordPress: centered photo book, large image, no glow, no canvas transition, footer hidden, history state preserved. Return Y:',previousY);
 await page.locator('.site-header a[href="https://www.sducraft.top:8443/"]').first().evaluate(e=>e.click());await page.waitForTimeout(1500);
 await page.goBack();await page.waitForTimeout(2500);await page.waitForSelector('[data-world-ready=true]');
 const restoredY=await page.evaluate(()=>scrollY);console.log('Back restoration:',restoredY,'delta',restoredY-previousY);
 assert(Math.abs(restoredY-previousY)<100,'Reading position was not restored');
 assert.equal(await page.locator('.mc-world-canvas').count(),1);
 console.log('Page return and single scene passed. Page errors:',errors);
 const sampling=page.evaluate(()=>new Promise(resolve=>{let maxError=0;const start=performance.now();function sample(){const app=document.querySelector('#mc-timeline-app'),c=app.querySelector('.mc-world-canvas');maxError=Math.max(maxError,Math.abs(c.getBoundingClientRect().top-app.getBoundingClientRect().top-parseFloat(c.style.top)));if(performance.now()-start<1000)requestAnimationFrame(sample);else resolve(maxError);}sample();}));
 await page.mouse.wheel(0,1100);assert(await sampling<1,'Canvas CSS coordinates lag during smooth scrolling');
 for(const [width,height] of [[390,844],[844,390]]) {
  await page.setViewportSize({width,height});await page.waitForTimeout(400);
  await page.locator('#mc-stop-0 .mc-entry-title').click();await page.locator('.mc-book-next').click();await page.waitForTimeout(200);
  const bounds=await page.locator('dialog').boundingBox();assert(Math.abs(bounds.x+bounds.width/2-width/2)<2);assert(Math.abs(bounds.y+bounds.height/2-height/2)<2);
  await page.locator('.mc-dialog-close').click();
 }
 assert.deepEqual(errors,[]);console.log('Real smooth scrolling, mobile and landscape book centering passed.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
