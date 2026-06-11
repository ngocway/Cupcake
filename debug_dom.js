const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1536, height: 864 });
  await page.goto('http://localhost:3000/student/assignments/bai-hoc-moi-24/run/quiz?submissionId=cmq8wkenm0003vtls17wl9jjw');
  
  // Wait for KidTeenQuizRunner to render and hydrate
  await new Promise(r => setTimeout(r, 5000));
  
  const results = await page.evaluate(() => {
    const data = [];
    let el = document.querySelector('button')?.closest('.font-body.flex.flex-col.bg-\\[\\#8cd2f6\\]'); // KidTeenQuizRunner root
    if (!el) {
       // fallback
       el = document.querySelector('main');
    }
    
    let current = el;
    while (current && current.tagName !== 'HTML') {
      const rect = current.getBoundingClientRect();
      const computed = window.getComputedStyle(current);
      data.push({
        tag: current.tagName,
        className: current.className,
        width: rect.width,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        margin: computed.margin,
        padding: computed.padding,
        maxWidth: computed.maxWidth
      });
      current = current.parentElement;
    }
    return data;
  });
  
  console.log(JSON.stringify(results, null, 2));
  
  await browser.close();
})();
