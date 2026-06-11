const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1536, height: 864 });
  await page.goto('http://localhost:3000/student/assignments/bai-hoc-moi-24/run/quiz?submissionId=cmq8xbe1d0005vtlsusr8lg84');
  await new Promise(r => setTimeout(r, 6000));
  const ancestors = await page.evaluate(() => {
    let el = document.querySelector('.bg-white.border-red-500');
    const res = [];
    while (el && el !== document.body) {
      const style = window.getComputedStyle(el);
      res.push({
        tag: el.tagName,
        className: el.className,
        w: style.width,
        maxW: style.maxWidth,
        flex: style.flex
      });
      el = el.parentElement;
    }
    return res;
  });
  console.log(JSON.stringify(ancestors, null, 2));
  await browser.close();
})();
