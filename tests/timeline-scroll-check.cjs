const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
    const browser = await chromium.launch({channel:'msedge',headless:true});
    try {
        const page = await browser.newPage({viewport:{width:1440,height:1000}});
        await page.addInitScript(() => {
            const raf = window.requestAnimationFrame;
            window.requestAnimationFrame = callback => raf(time => {if (!window.freezeWorld) callback(time);});
        });
        await page.goto(process.env.TIMELINE_URL || 'http://127.0.0.1:8099/local-real-timeline.php');
        await page.waitForSelector('[data-world-ready="true"]');
        await page.evaluate(() => window.scrollTo({top:4000,behavior:'instant'}));
        await page.waitForTimeout(300);
        await page.evaluate(() => {window.freezeWorld = true;});
        await page.waitForTimeout(100);
        const sample = () => page.evaluate(() => ['.mc-world-canvas','#mc-stop-8'].map(selector => document.querySelector(selector).getBoundingClientRect().top));
        const before = await sample();
        await page.evaluate(() => window.scrollBy({top:120,behavior:'instant'}));
        await page.waitForTimeout(150);
        const after = await sample();
        assert(Math.abs((after[0]-before[0])-(after[1]-before[1])) < .1, 'Scene slips relative to cards while rendering is paused');
        assert(Math.abs(after[0]-before[0]+120) < .1, 'Canvas does not follow native scroll');
        console.log('Paused renderer: scene and cards scroll together by exactly 120px.');
    } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode=1;});
