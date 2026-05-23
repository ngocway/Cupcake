# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: quiz.spec.ts >> Quiz Flow >>  UC2: Đã check -> hiện nút LÀM LẠI, ẩn KIỂM TRA TẤT CẢ
- Location: e2e\quiz.spec.ts:45:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 20000ms exceeded.
Call log:
  - waiting for locator('input[type="radio"]') to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - region "Notifications alt+T"
  - main [ref=e4]:
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]:
          - button "Quay lại" [ref=e11]:
            - img [ref=e12]
            - text: Quay lại
          - generic [ref=e14]:
            - heading "Mastering English Tenses" [level=2] [ref=e15]
            - generic [ref=e16]:
              - button "1" [ref=e17]: "1"
              - button "2" [ref=e19]: "2"
              - button "3" [ref=e21]
        - generic [ref=e22]:
          - generic [ref=e24]:
            - generic [ref=e25]: Question 1 • Select one answer
            - heading "Which sentence is in the Present Perfect tense?" [level=3] [ref=e26]
          - generic [ref=e27]:
            - generic [ref=e28]:
              - generic [ref=e29]: Question 2 • True / False
              - heading "\"I am going to the store\" is a Future tense sentence." [level=3] [ref=e30]
            - generic [ref=e32]:
              - button "Correct" [ref=e33]:
                - img [ref=e35]
                - generic [ref=e37]: Correct
              - button "Incorrect" [ref=e38]:
                - img [ref=e40]
                - generic [ref=e43]: Incorrect
          - generic [ref=e44]:
            - generic [ref=e46]: Question 3 • Match the pairs
            - generic [ref=e48]:
              - generic [ref=e49]:
                - img
                - generic [ref=e50]:
                  - generic [ref=e51]: Question Column
                  - generic [ref=e54]: A
                  - generic [ref=e58]: B
                  - generic [ref=e62]: C
                - generic [ref=e65]: Answer Column
              - generic [ref=e72]:
                - img [ref=e74]
                - paragraph [ref=e76]: "Tip: Click a dot and drag to connect. You can re-drag existing lines to change your answer!"
          - generic [ref=e78]:
            - button "CHECK ALL" [ref=e79]:
              - text: CHECK ALL
              - img [ref=e80]
            - generic [ref=e83]:
              - button "SUBMIT" [disabled] [ref=e84]:
                - text: SUBMIT
                - img [ref=e85]
              - generic [ref=e88]: Coming Soon
      - generic [ref=e89]:
        - generic [ref=e91]:
          - button "Add to bookmarks" [ref=e92]:
            - img [ref=e93]
          - button "REVIEW" [ref=e95]:
            - img [ref=e96]
            - generic [ref=e98]: REVIEW
        - generic [ref=e99]:
          - generic [ref=e100]:
            - generic [ref=e101]:
              - img [ref=e102]
              - text: Study Material
            - iframe [ref=e106]:
              - generic [active] [ref=f3e1]:
                - generic "YouTube Video Player" [ref=f3e3]
                - generic [ref=f3e5]:
                  - generic:
                    - generic:
                      - button "Play video" [ref=f3e10] [cursor=pointer]:
                        - generic [ref=f3e13]:
                          - img
                      - button "Hide player controls" [ref=f3e14] [cursor=pointer]
                      - generic [ref=f3e21]:
                        - generic [ref=f3e22]:
                          - link "Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)" [ref=f3e23] [cursor=pointer]:
                            - /url: https://www.youtube.com/watch?v=dQw4w9WgXcQ
                          - link "Rick Astley" [ref=f3e24] [cursor=pointer]:
                            - /url: /channel/UCuAXFkgsw1L7xaCfnd5JJOw
                            - generic [ref=f3e25]: Rick Astley
                        - generic [ref=f3e26]:
                          - button "thumbnail-image" [ref=f3e27] [cursor=pointer]:
                            - img "thumbnail-image" [ref=f3e28]
                          - generic [ref=f3e30]:
                            - generic: Rick Astley
                            - generic: 4.5M subscribers
          - generic [ref=e107]:
            - generic [ref=e108]:
              - img [ref=e109]
              - text: Instructions
            - generic [ref=e113]: Watch the video first, then complete all 5 questions below.
          - generic [ref=e114]:
            - heading "Related Content" [level=4] [ref=e115]
            - generic [ref=e116]:
              - link "Advanced Present Perfect" [ref=e117] [cursor=pointer]:
                - /url: /student/assignments/advanced-present-perfect/run?direct=true
                - heading "Advanced Present Perfect" [level=5] [ref=e121]
              - 'link "Grammar Deep Dive: English Tenses" [ref=e122] [cursor=pointer]':
                - /url: /student/assignments/grammar-deep-dive-english-tenses/run?direct=true
                - img [ref=e125]
                - 'heading "Grammar Deep Dive: English Tenses" [level=5] [ref=e129]'
  - button "Open Next.js Dev Tools" [ref=e135] [cursor=pointer]:
    - img [ref=e136]
  - alert [ref=e139]
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | // ⚠️  Sử dụng slug assignment THẬT có sẵn trong DB
  4   | const TEST_ASSIGNMENT_SLUG = "mastering-english-tenses";
  5   | 
  6   | // Helper để đăng nhập học sinh
  7   | async function loginStudent(page: any) {
  8   |   await page.goto("http://localhost:3000/student/login");
  9   |   await page.fill('input[id="email"]', 'student@example.com');
  10  |   await page.fill('input[id="password"]', 'password123');
  11  |   await page.click('button[type="submit"]');
  12  |   // Chờ cho đến khi chuyển hướng thành công đến trang học sinh
  13  |   await page.waitForURL(/\/student\/assignments/, { timeout: 45_000 });
  14  | }
  15  | 
  16  | // Lấy submissionId từ URL quiz sau khi truy cập direct=true
  17  | async function startQuizAndGetUrl(page: any, slug: string): Promise<string> {
  18  |   const url = new URL(`http://localhost:3000/student/assignments/${slug}/run`);
  19  |   url.searchParams.set("direct", "true");
  20  |   await page.goto(url.toString());
  21  |   // Chờ redirect tới quiz page
  22  |   await page.waitForURL(/\/run\/quiz\?submissionId=/, { timeout: 45_000 });
  23  |   return page.url();
  24  | }
  25  | 
  26  | test.describe("Quiz Flow", () => {
  27  |   test.beforeEach(async ({ page }) => {
  28  |     // Chờ dev server sẵn sàng và đăng nhập tài khoản học sinh
  29  |     await loginStudent(page);
  30  |   });
  31  | 
  32  |   test(" UC1: Chưa check -> hiện nút KIỂM TRA TẤT CẢ", async ({ page }) => {
  33  |     await startQuizAndGetUrl(page, TEST_ASSIGNMENT_SLUG);
  34  | 
  35  |     // Chờ nút "Kiểm tra tất cả" xuất hiện (locale EN hoặc VI)
  36  |     const checkBtn = page.getByRole("button", { name: /KIỂM TRA TẤT CẢ|CHECK ALL/i });
  37  |     await checkBtn.waitFor({ state: "visible", timeout: 20_000 });
  38  |     await expect(checkBtn).toBeVisible();
  39  | 
  40  |     // Nút "Làm lại" phải KHÔNG hiển thị
  41  |     const resetBtn = page.getByRole("button", { name: /LÀM LẠI|RETRY/i });
  42  |     await expect(resetBtn).not.toBeVisible();
  43  |   });
  44  | 
  45  |   test(" UC2: Đã check -> hiện nút LÀM LẠI, ẩn KIỂM TRA TẤT CẢ", async ({ page }) => {
  46  |     await startQuizAndGetUrl(page, TEST_ASSIGNMENT_SLUG);
  47  | 
  48  |     // Trả lời tất cả câu hỏi (radio button đầu tiên của mỗi câu)
  49  |     // Chờ questions render
> 50  |     await page.waitForSelector('input[type="radio"]', { timeout: 20_000 });
      |                ^ TimeoutError: page.waitForSelector: Timeout 20000ms exceeded.
  51  |     const radios = page.locator('input[type="radio"]');
  52  |     const count = await radios.count();
  53  |     for (let i = 0; i < count; i++) {
  54  |       await radios.nth(i).check({ force: true });
  55  |     }
  56  | 
  57  |     // Click KIỂM TRA TẤT CẢ
  58  |     const checkBtn = page.getByRole("button", { name: /KIỂM TRA TẤT CẢ|CHECK ALL/i });
  59  |     await checkBtn.click();
  60  | 
  61  |     // Chờ animation reveal đáp án xong
  62  |     await page.waitForTimeout(3000);
  63  | 
  64  |     // Nút LÀM LẠI phải hiển thị
  65  |     const resetBtn = page.getByRole("button", { name: /LÀM LẠI|RETRY/i });
  66  |     await expect(resetBtn).toBeVisible();
  67  | 
  68  |     // Nút KIỂM TRA TẤT CẢ phải ẩn
  69  |     await expect(checkBtn).not.toBeVisible();
  70  |   });
  71  | 
  72  |   test(" UC3: Bấm LÀM LẠI -> reset về UC1", async ({ page }) => {
  73  |     await startQuizAndGetUrl(page, TEST_ASSIGNMENT_SLUG);
  74  | 
  75  |     // Trả lời tất cả
  76  |     await page.waitForSelector('input[type="radio"]', { timeout: 20_000 });
  77  |     const radios = page.locator('input[type="radio"]');
  78  |     const count = await radios.count();
  79  |     for (let i = 0; i < count; i++) {
  80  |       await radios.nth(i).check({ force: true });
  81  |     }
  82  | 
  83  |     // Check all
  84  |     const checkBtn = page.getByRole("button", { name: /KIỂM TRA TẤT CẢ|CHECK ALL/i });
  85  |     await checkBtn.click();
  86  |     await page.waitForTimeout(3000);
  87  | 
  88  |     // Bấm LÀM LẠI
  89  |     const resetBtn = page.getByRole("button", { name: /LÀM LẠI|RETRY/i });
  90  |     await resetBtn.click();
  91  |     await page.waitForTimeout(500);
  92  | 
  93  |     // Quay lại UC1: KIỂM TRA TẤT CẢ hiện lại
  94  |     await expect(checkBtn).toBeVisible();
  95  | 
  96  |     // Tất cả radio đã chọn phải bị reset
  97  |     const checkedRadios = page.locator('input[type="radio"]:checked');
  98  |     await expect(checkedRadios).toHaveCount(0);
  99  |   });
  100 | });
  101 | 
  102 | test.describe("Lesson Detail Page", () => {
  103 |   test.beforeEach(async ({ page }) => {
  104 |     // Đăng nhập học sinh trước khi truy cập các bài học
  105 |     await loginStudent(page);
  106 |   });
  107 | 
  108 |   test("Không hiện thanh scroll xấu khi mới vào trang", async ({ page }) => {
  109 |     await page.goto("http://localhost:3000/student/lessons", {
  110 |       waitUntil: "domcontentloaded",
  111 |       timeout: 45_000,
  112 |     });
  113 | 
  114 |     // Chờ trang lessons load xong (card bài học xuất hiện)
  115 |     await page.waitForSelector('a[href*="/student/lessons/"]', { timeout: 20_000 });
  116 | 
  117 |     // Click vào bài học đầu tiên
  118 |     const firstLesson = page.locator('a[href*="/student/lessons/"]').first();
  119 |     await firstLesson.click();
  120 | 
  121 |     // Chờ trang detail load xong
  122 |     await page.waitForLoadState("networkidle", { timeout: 20_000 });
  123 | 
  124 |     // Kiểm tra scrollbar body không bị overflow
  125 |     const overflow = await page.evaluate(() => {
  126 |       const body = document.body;
  127 |       const html = document.documentElement;
  128 |       return {
  129 |         bodyOverflow: window.getComputedStyle(body).overflow,
  130 |         htmlOverflow: window.getComputedStyle(html).overflow,
  131 |         bodyHasScrollbar: body.scrollHeight > window.innerHeight,
  132 |       };
  133 |     });
  134 | 
  135 |     // Body overflow phải là hidden hoặc clip, không phải auto/scroll
  136 |     expect(overflow.bodyOverflow).not.toBe("auto");
  137 |     expect(overflow.bodyOverflow).not.toBe("scroll");
  138 |   });
  139 | });
  140 | 
```