import { test, expect } from "@playwright/test";

// ⚠️  Sử dụng slug assignment THẬT có sẵn trong DB
const TEST_ASSIGNMENT_SLUG = "mastering-english-tenses";

// Helper để đăng nhập học sinh
async function loginStudent(page: any) {
  await page.goto("http://localhost:3000/student/login");
  await page.fill('input[id="email"]', 'student@example.com');
  await page.fill('input[id="password"]', 'password123');
  await page.click('button[type="submit"]');
  // Chờ cho đến khi chuyển hướng thành công đến trang học sinh
  await page.waitForURL(/\/student\/assignments/, { timeout: 45_000 });
}

// Lấy submissionId từ URL quiz sau khi truy cập direct=true
async function startQuizAndGetUrl(page: any, slug: string): Promise<string> {
  const url = new URL(`http://localhost:3000/student/assignments/${slug}/run`);
  url.searchParams.set("direct", "true");
  await page.goto(url.toString());
  // Chờ redirect tới quiz page
  await page.waitForURL(/\/run\/quiz\?submissionId=/, { timeout: 45_000 });
  return page.url();
}

test.describe("Quiz Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Chờ dev server sẵn sàng và đăng nhập tài khoản học sinh
    await loginStudent(page);
  });

  test(" UC1: Chưa check -> hiện nút KIỂM TRA TẤT CẢ", async ({ page }) => {
    await startQuizAndGetUrl(page, TEST_ASSIGNMENT_SLUG);

    // Chờ nút "Kiểm tra tất cả" xuất hiện (locale EN hoặc VI)
    const checkBtn = page.getByRole("button", { name: /KIỂM TRA TẤT CẢ|CHECK ALL/i });
    await checkBtn.waitFor({ state: "visible", timeout: 20_000 });
    await expect(checkBtn).toBeVisible();

    // Nút "Làm lại" phải KHÔNG hiển thị
    const resetBtn = page.getByRole("button", { name: /LÀM LẠI|RETRY/i });
    await expect(resetBtn).not.toBeVisible();
  });

  test(" UC2: Đã check -> hiện nút LÀM LẠI, ẩn KIỂM TRA TẤT CẢ", async ({ page }) => {
    await startQuizAndGetUrl(page, TEST_ASSIGNMENT_SLUG);

    // Trả lời tất cả câu hỏi (radio button đầu tiên của mỗi câu)
    // Chờ questions render
    await page.waitForSelector('input[type="radio"]', { timeout: 20_000 });
    const radios = page.locator('input[type="radio"]');
    const count = await radios.count();
    for (let i = 0; i < count; i++) {
      await radios.nth(i).check({ force: true });
    }

    // Click KIỂM TRA TẤT CẢ
    const checkBtn = page.getByRole("button", { name: /KIỂM TRA TẤT CẢ|CHECK ALL/i });
    await checkBtn.click();

    // Chờ animation reveal đáp án xong
    await page.waitForTimeout(3000);

    // Nút LÀM LẠI phải hiển thị
    const resetBtn = page.getByRole("button", { name: /LÀM LẠI|RETRY/i });
    await expect(resetBtn).toBeVisible();

    // Nút KIỂM TRA TẤT CẢ phải ẩn
    await expect(checkBtn).not.toBeVisible();
  });

  test(" UC3: Bấm LÀM LẠI -> reset về UC1", async ({ page }) => {
    await startQuizAndGetUrl(page, TEST_ASSIGNMENT_SLUG);

    // Trả lời tất cả
    await page.waitForSelector('input[type="radio"]', { timeout: 20_000 });
    const radios = page.locator('input[type="radio"]');
    const count = await radios.count();
    for (let i = 0; i < count; i++) {
      await radios.nth(i).check({ force: true });
    }

    // Check all
    const checkBtn = page.getByRole("button", { name: /KIỂM TRA TẤT CẢ|CHECK ALL/i });
    await checkBtn.click();
    await page.waitForTimeout(3000);

    // Bấm LÀM LẠI
    const resetBtn = page.getByRole("button", { name: /LÀM LẠI|RETRY/i });
    await resetBtn.click();
    await page.waitForTimeout(500);

    // Quay lại UC1: KIỂM TRA TẤT CẢ hiện lại
    await expect(checkBtn).toBeVisible();

    // Tất cả radio đã chọn phải bị reset
    const checkedRadios = page.locator('input[type="radio"]:checked');
    await expect(checkedRadios).toHaveCount(0);
  });
});

test.describe("Lesson Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    // Đăng nhập học sinh trước khi truy cập các bài học
    await loginStudent(page);
  });

  test("Không hiện thanh scroll xấu khi mới vào trang", async ({ page }) => {
    await page.goto("http://localhost:3000/student/lessons", {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });

    // Chờ trang lessons load xong (card bài học xuất hiện)
    await page.waitForSelector('a[href*="/student/lessons/"]', { timeout: 20_000 });

    // Click vào bài học đầu tiên
    const firstLesson = page.locator('a[href*="/student/lessons/"]').first();
    await firstLesson.click();

    // Chờ trang detail load xong
    await page.waitForLoadState("networkidle", { timeout: 20_000 });

    // Kiểm tra scrollbar body không bị overflow
    const overflow = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      return {
        bodyOverflow: window.getComputedStyle(body).overflow,
        htmlOverflow: window.getComputedStyle(html).overflow,
        bodyHasScrollbar: body.scrollHeight > window.innerHeight,
      };
    });

    // Body overflow phải là hidden hoặc clip, không phải auto/scroll
    expect(overflow.bodyOverflow).not.toBe("auto");
    expect(overflow.bodyOverflow).not.toBe("scroll");
  });
});
