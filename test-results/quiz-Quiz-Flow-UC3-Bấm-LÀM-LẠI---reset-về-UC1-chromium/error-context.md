# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: quiz.spec.ts >> Quiz Flow >>  UC3: Bấm LÀM LẠI -> reset về UC1
- Location: e2e\quiz.spec.ts:62:7

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/", waiting until "domcontentloaded"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - region "Notifications alt+T"
  - generic [ref=e2]:
    - navigation [ref=e3]:
      - generic [ref=e4]:
        - link "auto_stories Scholar Script The Fluid Academy" [ref=e5] [cursor=pointer]:
          - /url: /
          - generic [ref=e7]: auto_stories
          - generic [ref=e8]:
            - generic [ref=e9]: Scholar Script
            - generic [ref=e10]: The Fluid Academy
        - generic [ref=e11]:
          - link "Home" [ref=e12] [cursor=pointer]:
            - /url: /
          - link "Library" [ref=e13] [cursor=pointer]:
            - /url: "#"
          - link "Community" [ref=e14] [cursor=pointer]:
            - /url: "#"
      - generic [ref=e15]:
        - generic [ref=e16]:
          - generic [ref=e17]: search
          - textbox "Search lessons, assignments..." [ref=e18]
        - generic [ref=e19]:
          - button "language EN expand_more" [ref=e21]:
            - generic [ref=e22]: language
            - generic [ref=e23]: EN
            - generic [ref=e24]: expand_more
          - button "Get Started" [ref=e25]
    - generic [ref=e26]:
      - complementary [ref=e27]:
        - generic [ref=e28]:
          - generic [ref=e29]:
            - heading "Categories" [level=2] [ref=e30]
            - generic [ref=e31]:
              - generic [ref=e33] [cursor=pointer]:
                - button [ref=e34]:
                  - img [ref=e35]
                - link "English" [ref=e37]:
                  - /url: /?categoryId=cmokxyfib0003vt9cw2pe1a9a
              - generic [ref=e39] [cursor=pointer]:
                - button [ref=e40]:
                  - img [ref=e41]
                - link "Math" [ref=e43]:
                  - /url: /?categoryId=cmokxzxj30005vt9c41kmtqu7
              - generic [ref=e45] [cursor=pointer]:
                - button [ref=e46]:
                  - img [ref=e47]
                - link "Global" [ref=e49]:
                  - /url: /?categoryId=cmokzcrre000tvt9cugcm1jea
          - generic [ref=e50]:
            - heading "Popular Tags" [level=2] [ref=e51]
            - generic [ref=e52]:
              - link "IELTS" [ref=e53] [cursor=pointer]:
                - /url: /?tags=IELTS
              - link "TOEIC" [ref=e54] [cursor=pointer]:
                - /url: /?tags=TOEIC
              - link "Tiếng Anh" [ref=e55] [cursor=pointer]:
                - /url: /?tags=Ti%E1%BA%BFng+Anh
              - link "Từ vựng" [ref=e56] [cursor=pointer]:
                - /url: /?tags=T%E1%BB%AB+v%E1%BB%B1ng
              - link "advanced" [ref=e57] [cursor=pointer]:
                - /url: /?tags=advanced
              - link "grammar" [ref=e58] [cursor=pointer]:
                - /url: /?tags=grammar
              - link "intermediate" [ref=e59] [cursor=pointer]:
                - /url: /?tags=intermediate
              - link "tenses" [ref=e60] [cursor=pointer]:
                - /url: /?tags=tenses
      - main [ref=e61]:
        - generic [ref=e62]:
          - generic [ref=e64]:
            - button "English" [ref=e65]:
              - generic [ref=e66]: English
              - img [ref=e68]
            - button "Math" [ref=e71]:
              - generic [ref=e72]: Math
              - img [ref=e74]
            - button "Global" [ref=e77]:
              - generic [ref=e78]: Global
              - img [ref=e80]
          - generic [ref=e83]:
            - generic [ref=e84]:
              - button "ASSIGNMENTS" [ref=e85]
              - button "LESSONS" [ref=e86]
            - generic [ref=e87]:
              - button "Newest" [ref=e88]
              - button "Popular" [ref=e89]
          - generic [ref=e92]:
            - generic [ref=e93]:
              - generic [ref=e94]:
                - img "Understanding Climate Change and Renewable Energy" [ref=e95]
                - generic [ref=e97]:
                  - generic [ref=e98]: menu_book
                  - text: Reading
              - generic [ref=e100]:
                - generic [ref=e101]:
                  - img "Teacher" [ref=e103]
                  - generic [ref=e104]: Teacher Demo
                - link "Understanding Climate Change and Renewable Energy" [ref=e105] [cursor=pointer]:
                  - /url: /public/assignments/understanding-climate-change-and-renewable-energy?direct=true
                  - heading "Understanding Climate Change and Renewable Energy" [level=3] [ref=e106]
                - generic [ref=e107]:
                  - generic [ref=e108]:
                    - generic [ref=e109]:
                      - generic [ref=e110]: visibility
                      - generic [ref=e111]: "0"
                    - generic [ref=e112]:
                      - generic [ref=e113]: favorite
                      - generic [ref=e114]: "693"
                  - generic [ref=e115]:
                    - generic [ref=e116]: star
                    - generic [ref=e117]: "4.5"
            - generic [ref=e118]:
              - generic [ref=e119]:
                - img "BT My morning routine" [ref=e120]
                - generic [ref=e122]:
                  - generic [ref=e123]: menu_book
                  - text: Reading
              - generic [ref=e125]:
                - generic [ref=e126]:
                  - img "Teacher" [ref=e128]
                  - generic [ref=e129]: Admin Demo
                - link "BT My morning routine" [ref=e130] [cursor=pointer]:
                  - /url: /public/assignments/bt-my-morning-routine?direct=true
                  - heading "BT My morning routine" [level=3] [ref=e131]
                - generic [ref=e132]:
                  - generic [ref=e133]:
                    - generic [ref=e134]:
                      - generic [ref=e135]: visibility
                      - generic [ref=e136]: "28"
                    - generic [ref=e137]:
                      - generic [ref=e138]: favorite
                      - generic [ref=e139]: "693"
                  - generic [ref=e140]:
                    - generic [ref=e141]: star
                    - generic [ref=e142]: "4.5"
            - generic [ref=e143]:
              - generic [ref=e144]:
                - img "BT Test nối từ" [ref=e145]
                - generic [ref=e147]:
                  - generic [ref=e148]: assignment
                  - text: Assignments
              - generic [ref=e150]:
                - generic [ref=e151]:
                  - img "Teacher" [ref=e153]
                  - generic [ref=e154]: Admin Demo
                - link "BT Test nối từ" [ref=e155] [cursor=pointer]:
                  - /url: /public/assignments/bt-test-noi-tu?direct=true
                  - heading "BT Test nối từ" [level=3] [ref=e156]
                - generic [ref=e157]:
                  - generic [ref=e158]:
                    - generic [ref=e159]:
                      - generic [ref=e160]: visibility
                      - generic [ref=e161]: "6"
                    - generic [ref=e162]:
                      - generic [ref=e163]: favorite
                      - generic [ref=e164]: "693"
                  - generic [ref=e165]:
                    - generic [ref=e166]: star
                    - generic [ref=e167]: "4.5"
            - generic [ref=e168]:
              - generic [ref=e169]:
                - img "BT rewrwe" [ref=e170]
                - generic [ref=e172]:
                  - generic [ref=e173]: assignment
                  - text: Assignments
              - generic [ref=e175]:
                - generic [ref=e176]:
                  - img "Teacher" [ref=e178]
                  - generic [ref=e179]: Admin Demo
                - link "BT rewrwe" [ref=e180] [cursor=pointer]:
                  - /url: /public/assignments/bt-rewrwe?direct=true
                  - heading "BT rewrwe" [level=3] [ref=e181]
                - generic [ref=e182]:
                  - generic [ref=e183]:
                    - generic [ref=e184]:
                      - generic [ref=e185]: visibility
                      - generic [ref=e186]: "1"
                    - generic [ref=e187]:
                      - generic [ref=e188]: favorite
                      - generic [ref=e189]: "693"
                  - generic [ref=e190]:
                    - generic [ref=e191]: star
                    - generic [ref=e192]: "4.5"
            - generic [ref=e193]:
              - generic [ref=e194]:
                - img "BT The Camping Adventure" [ref=e195]
                - generic [ref=e197]:
                  - generic [ref=e198]: menu_book
                  - text: Reading
              - generic [ref=e200]:
                - generic [ref=e201]:
                  - img "Teacher" [ref=e203]
                  - generic [ref=e204]: Admin Demo
                - link "BT The Camping Adventure" [ref=e205] [cursor=pointer]:
                  - /url: /public/assignments/bt-the-camping-adventure?direct=true
                  - heading "BT The Camping Adventure" [level=3] [ref=e206]
                - generic [ref=e207]:
                  - generic [ref=e208]:
                    - generic [ref=e209]:
                      - generic [ref=e210]: visibility
                      - generic [ref=e211]: "2"
                    - generic [ref=e212]:
                      - generic [ref=e213]: favorite
                      - generic [ref=e214]: "693"
                  - generic [ref=e215]:
                    - generic [ref=e216]: star
                    - generic [ref=e217]: "4.5"
            - generic [ref=e218]:
              - generic [ref=e219]:
                - img "BT Understanding Simple Sentences in English" [ref=e220]
                - generic [ref=e222]:
                  - generic [ref=e223]: menu_book
                  - text: Reading
              - generic [ref=e225]:
                - generic [ref=e226]:
                  - img "Teacher" [ref=e228]
                  - generic [ref=e229]: Admin Demo
                - link "BT Understanding Simple Sentences in English" [ref=e230] [cursor=pointer]:
                  - /url: /public/assignments/bt-understanding-simple-sentences-in-english?direct=true
                  - heading "BT Understanding Simple Sentences in English" [level=3] [ref=e231]
                - generic [ref=e232]:
                  - generic [ref=e233]:
                    - generic [ref=e234]:
                      - generic [ref=e235]: visibility
                      - generic [ref=e236]: "0"
                    - generic [ref=e237]:
                      - generic [ref=e238]: favorite
                      - generic [ref=e239]: "693"
                  - generic [ref=e240]:
                    - generic [ref=e241]: star
                    - generic [ref=e242]: "4.5"
            - generic [ref=e243]:
              - generic [ref=e244]:
                - img "Bài tập mới" [ref=e245]
                - generic [ref=e247]:
                  - generic [ref=e248]: assignment
                  - text: Assignments
              - generic [ref=e250]:
                - generic [ref=e251]:
                  - img "Teacher" [ref=e253]
                  - generic [ref=e254]: Teacher Demo
                - link "Bài tập mới" [ref=e255] [cursor=pointer]:
                  - /url: /public/assignments/bai-tap-moi-2?direct=true
                  - heading "Bài tập mới" [level=3] [ref=e256]
                - generic [ref=e257]:
                  - generic [ref=e258]:
                    - generic [ref=e259]:
                      - generic [ref=e260]: visibility
                      - generic [ref=e261]: "0"
                    - generic [ref=e262]:
                      - generic [ref=e263]: favorite
                      - generic [ref=e264]: "693"
                  - generic [ref=e265]:
                    - generic [ref=e266]: star
                    - generic [ref=e267]: "4.5"
            - generic [ref=e268]:
              - generic [ref=e269]:
                - img "Bài tập mới" [ref=e270]
                - generic [ref=e272]:
                  - generic [ref=e273]: assignment
                  - text: Assignments
              - generic [ref=e275]:
                - generic [ref=e276]:
                  - img "Teacher" [ref=e278]
                  - generic [ref=e279]: Teacher Demo
                - link "Bài tập mới" [ref=e280] [cursor=pointer]:
                  - /url: /public/assignments/bai-tap-moi-3?direct=true
                  - heading "Bài tập mới" [level=3] [ref=e281]
                - generic [ref=e282]:
                  - generic [ref=e283]:
                    - generic [ref=e284]:
                      - generic [ref=e285]: visibility
                      - generic [ref=e286]: "0"
                    - generic [ref=e287]:
                      - generic [ref=e288]: favorite
                      - generic [ref=e289]: "693"
                  - generic [ref=e290]:
                    - generic [ref=e291]: star
                    - generic [ref=e292]: "4.5"
            - generic [ref=e293]:
              - generic [ref=e294]:
                - img "BT Toán lớp 5 - Tuần 12" [ref=e295]
                - generic [ref=e297]:
                  - generic [ref=e298]: assignment
                  - text: Assignments
              - generic [ref=e300]:
                - generic [ref=e301]:
                  - img "Teacher" [ref=e303]
                  - generic [ref=e304]: Admin Demo
                - link "BT Toán lớp 5 - Tuần 12" [ref=e305] [cursor=pointer]:
                  - /url: /public/assignments/bt-toan-lop-5-tuan-12?direct=true
                  - heading "BT Toán lớp 5 - Tuần 12" [level=3] [ref=e306]
                - generic [ref=e307]:
                  - generic [ref=e308]:
                    - generic [ref=e309]:
                      - generic [ref=e310]: visibility
                      - generic [ref=e311]: "0"
                    - generic [ref=e312]:
                      - generic [ref=e313]: favorite
                      - generic [ref=e314]: "693"
                  - generic [ref=e315]:
                    - generic [ref=e316]: star
                    - generic [ref=e317]: "4.5"
            - generic [ref=e318]:
              - generic [ref=e319]:
                - img "BT Toán lớp 5 - Tuần 12" [ref=e320]
                - generic [ref=e322]:
                  - generic [ref=e323]: assignment
                  - text: Assignments
              - generic [ref=e325]:
                - generic [ref=e326]:
                  - img "Teacher" [ref=e328]
                  - generic [ref=e329]: Admin Demo
                - link "BT Toán lớp 5 - Tuần 12" [ref=e330] [cursor=pointer]:
                  - /url: /public/assignments/bt-toan-lop-5-tuan-12-1?direct=true
                  - heading "BT Toán lớp 5 - Tuần 12" [level=3] [ref=e331]
                - generic [ref=e332]:
                  - generic [ref=e333]:
                    - generic [ref=e334]:
                      - generic [ref=e335]: visibility
                      - generic [ref=e336]: "0"
                    - generic [ref=e337]:
                      - generic [ref=e338]: favorite
                      - generic [ref=e339]: "693"
                  - generic [ref=e340]:
                    - generic [ref=e341]: star
                    - generic [ref=e342]: "4.5"
            - generic [ref=e343]:
              - generic [ref=e344]:
                - 'img "BT Reading Exercise: Modern Ethics" [ref=e345]'
                - generic [ref=e347]:
                  - generic [ref=e348]: menu_book
                  - text: Reading
              - generic [ref=e350]:
                - generic [ref=e351]:
                  - img "Teacher" [ref=e353]
                  - generic [ref=e354]: Admin Demo
                - 'link "BT Reading Exercise: Modern Ethics" [ref=e355] [cursor=pointer]':
                  - /url: /public/assignments/bt-reading-exercise-modern-ethics?direct=true
                  - 'heading "BT Reading Exercise: Modern Ethics" [level=3] [ref=e356]'
                - generic [ref=e357]:
                  - generic [ref=e358]:
                    - generic [ref=e359]:
                      - generic [ref=e360]: visibility
                      - generic [ref=e361]: "0"
                    - generic [ref=e362]:
                      - generic [ref=e363]: favorite
                      - generic [ref=e364]: "693"
                  - generic [ref=e365]:
                    - generic [ref=e366]: star
                    - generic [ref=e367]: "4.5"
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
> 19  |     await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 30_000 });
      |                ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
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
  94  |     await page.goto("http://localhost:3000/student/lessons", {
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
```