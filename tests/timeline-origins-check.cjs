const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/rider.json',route=>route.fulfill({json:{default:{skin:'none'},branches:{restoration:{skin:'skins/steve.png'},vanilla:{skin:'skins/alex.png',model:'slim'}}}}));
  await page.goto(process.env.TIMELINE_URL||'http://127.0.0.1:8099/local-real-timeline.php');await page.waitForSelector('[data-world-ready="true"]');
  const origins=await page.locator('.mc-milestone-block').evaluateAll(nodes=>nodes.filter(n=>n.dataset.origin).map(n=>n.dataset.origin));
  assert.deepEqual(origins,['merge','restoration','vanilla','restoration']);
  await page.locator('.mc-start-origin').click();await page.waitForTimeout(1500);
  assert(await page.evaluate(()=>scrollY>document.documentElement.scrollHeight-innerHeight-100));
  const focus=async selector=>{await page.locator(selector+' .mc-entry-title').focus();await page.waitForTimeout(700);};
  await focus('[data-origin="vanilla"]');
  assert.equal(await page.locator('#mc-timeline-app').getAttribute('data-route-mode'),'origins');
  assert.equal(await page.locator('#mc-timeline-app').getAttribute('data-rider-skin'),'skins/steve.png');
  const parkedAtOrigin=Number(await page.locator('#mc-timeline-app').getAttribute('data-branch-cart-y'));
  await focus('[data-origin="restoration"]:last-of-type');
  assert.equal(Number(await page.locator('#mc-timeline-app').getAttribute('data-branch-cart-y')),parkedAtOrigin,'Branch cart travels before its founding');
  await focus('#mc-stop-33');
  assert.equal(await page.locator('#mc-timeline-app').getAttribute('data-route-mode'),'shared');
  assert.equal(await page.locator('#mc-timeline-app').getAttribute('data-merge-separation'),'0.000');
  assert.equal(await page.locator('#mc-timeline-app').getAttribute('data-rider-skin'),'none');
  const parkedAtMerge=Number(await page.locator('#mc-timeline-app').getAttribute('data-branch-cart-y'));
  await focus('#mc-stop-30');
  assert.equal(Number(await page.locator('#mc-timeline-app').getAttribute('data-branch-cart-y')),parkedAtMerge,'Siding cart follows the shared mainline');
  assert.deepEqual(errors,[]);console.log(width+': origin entry, event membership, independent skins, founding/merge stops and reverse reading passed');await page.close();
 }
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
