# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: quiz.spec.ts >> Lesson Detail Page >> Không hiện thanh scroll xấu khi mới vào trang
- Location: e2e\quiz.spec.ts:93:7

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/student/lessons", waiting until "domcontentloaded"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - region "Notifications alt+T"
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | // ⚠️  THAY THẾ bằng slug assignment THẬT có trong DB của bạn
  4   | const TEST_ASSIGNMENT_SLUG = "test-assignment";
  5   | 
  6   | // Lấy submissionId từ URL quiz sau redirect direct=true
  7   | async function startQuizAndGetUrl(page: any, slug: string): Promise<string> {
  8   |   const url = new URL(`http://localhost:3000/student/assignments/${slug}/run`);
  9   |   url.searchParams.set("direct", "true");
  10  |   await page.goto(url.toString());
  11  |   // Chờ redirect tới quiz page
  12  |   await page.waitForURL(/\/run\/quiz\?submissionId=/, { timeout: 15_000 });
  13  |   return page.url();
  14  | }
  15  | 
  16  | test.describe("Quiz Flow", () => {
  17  |   test.beforeEach(async ({ page }) => {
  18  |     // Chờ dev server sẵn sàng trước khi chạy test
  19  |     await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 30_000 });
  20  |   });
  21  | 
  22  |   test(" UC1: Chưa check -> hiện nút KIỂM TRA TẤT CẢ", async ({ page }) => {
  23  |     await startQuizAndGetUrl(page, TEST_ASSIGNMENT_SLUG);
  24  | 
  25  |     // Chờ nút "Kiểm tra tất cả" xuất hiện (locale EN hoặc VI)
  26  |     const checkBtn = page.getByRole("button", { name: /KIỂM TRA TẤT CẢ|CHECK ALL/i });
  27  |     await checkBtn.waitFor({ state: "visible", timeout: 10_000 });
  28  |     await expect(checkBtn).toBeVisible();
  29  | 
  30  |     // Nút "Làm lại" phải KHÔNG hiển thị
  31  |     const resetBtn = page.getByRole("button", { name: /LÀM LẠI|RETRY/i });
  32  |     await expect(resetBtn).not.toBeVisible();
  33  |   });
  34  | 
  35  |   test(" UC2: Đã check -> hiện nút LÀM LẠI, ẩn KIỂM TRA TẤT CẢ", async ({ page }) => {
  36  |     const quizUrl = await startQuizAndGetUrl(page, TEST_ASSIGNMENT_SLUG);
  37  | 
  38  |     // Trả lời tất cả câu hỏi (radio button đầu tiên của mỗi câu)
  39  |     // Chờ questions render
  40  |     await page.waitForSelector('input[type="radio"]', { timeout: 10_000 });
  41  |     const radios = page.locator('input[type="radio"]');
  42  |     const count = await radios.count();
  43  |     for (let i = 0; i < count; i++) {
  44  |       await radios.nth(i).check({ force: true });
  45  |     }
  46  | 
  47  |     // Click KIỂM TRA TẤT CẢ
  48  |     const checkBtn = page.getByRole("button", { name: /KIỂM TRA TẤT CẢ|CHECK ALL/i });
  49  |     await checkBtn.click();
  50  | 
  51  |     // Chờ animation reveal đáp án xong
  52  |     await page.waitForTimeout(3000);
  53  | 
  54  |     // Nút LÀM LẠI phải hiển thị
  55  |     const resetBtn = page.getByRole("button", { name: /LÀM LẠI|RETRY/i });
  56  |     await expect(resetBtn).toBeVisible();
  57  | 
  58  |     // Nút KIỂM TRA TẤT CẢ phải ẩn
  59  |     await expect(checkBtn).not.toBeVisible();
  60  |   });
  61  | 
  62  |   test(" UC3: Bấm LÀM LẠI -> reset về UC1", async ({ page }) => {
  63  |     await startQuizAndGetUrl(page, TEST_ASSIGNMENT_SLUG);
  64  | 
  65  |     // Trả lời tất cả
  66  |     await page.waitForSelector('input[type="radio"]', { timeout: 10_000 });
  67  |     const radios = page.locator('input[type="radio"]');
  68  |     const count = await radios.count();
  69  |     for (let i = 0; i < count; i++) {
  70  |       await radios.nth(i).check({ force: true });
  71  |     }
  72  | 
  73  |     // Check all
  74  |     const checkBtn = page.getByRole("button", { name: /KIỂM TRA TẤT CẢ|CHECK ALL/i });
  75  |     await checkBtn.click();
  76  |     await page.waitForTimeout(3000);
  77  | 
  78  |     // Bấm LÀM LẠI
  79  |     const resetBtn = page.getByRole("button", { name: /LÀM LẠI|RETRY/i });
  80  |     await resetBtn.click();
  81  |     await page.waitForTimeout(500);
  82  | 
  83  |     // Quay lại UC1: KIỂM TRA TẤT CẢ hiện lại
  84  |     await expect(checkBtn).toBeVisible();
  85  | 
  86  |     // Tất cả radio đã chọn phải bị reset
  87  |     const checkedRadios = page.locator('input[type="radio"]:checked');
  88  |     await expect(checkedRadios).toHaveCount(0);
  89  |   });
  90  | });
  91  | 
  92  | test.describe("Lesson Detail Page", () => {
  93  |   test("Không hiện thanh scroll xấu khi mới vào trang", async ({ page }) => {
> 94  |     await page.goto("http://localhost:3000/student/lessons", {
      |                ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  95  |       waitUntil: "domcontentloaded",
  96  |       timeout: 30_000,
  97  |     });
  98  | 
  99  |     // Chờ trang lessons load xong (card bài học xuất hiện)
  100 |     await page.waitForSelector('a[href*="/student/lessons/"]', { timeout: 15_000 });
  101 | 
  102 |     // Click vào bài học đầu tiên
  103 |     const firstLesson = page.locator('a[href*="/student/lessons/"]').first();
  104 |     await firstLesson.click();
  105 | 
  106 |     // Chờ trang detail load xong
  107 |     await page.waitForLoadState("networkidle", { timeout: 15_000 });
  108 | 
  109 |     // Kiểm tra scrollbar body không bị overflow
  110 |     const overflow = await page.evaluate(() => {
  111 |       const body = document.body;
  112 |       const html = document.documentElement;
  113 |       return {
  114 |         bodyOverflow: window.getComputedStyle(body).overflow,
  115 |         htmlOverflow: window.getComputedStyle(html).overflow,
  116 |         bodyHasScrollbar: body.scrollHeight > window.innerHeight,
  117 |       };
  118 |     });
  119 | 
  120 |     // Body overflow phải là hidden hoặc clip, không phải auto/scroll
  121 |     expect(overflow.bodyOverflow).not.toBe("auto");
  122 |     expect(overflow.bodyOverflow).not.toBe("scroll");
  123 |   });
  124 | });
  125 | 
```