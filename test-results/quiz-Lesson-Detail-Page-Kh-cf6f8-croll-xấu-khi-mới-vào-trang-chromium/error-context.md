# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: quiz.spec.ts >> Lesson Detail Page >> Không hiện thanh scroll xấu khi mới vào trang
- Location: e2e\quiz.spec.ts:108:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('a[href*="/student/lessons/"]') to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - banner [ref=e5]:
      - navigation [ref=e7]:
        - generic [ref=e8]:
          - link "auto_stories Scholar Script The Fluid Academy" [ref=e9] [cursor=pointer]:
            - /url: /
            - generic [ref=e11]: auto_stories
            - generic [ref=e12]:
              - generic [ref=e13]: Scholar Script
              - generic [ref=e14]: The Fluid Academy
          - generic [ref=e15]:
            - link "Home" [ref=e16] [cursor=pointer]:
              - /url: /
            - link "Library" [ref=e17] [cursor=pointer]:
              - /url: "#"
            - link "Community" [ref=e18] [cursor=pointer]:
              - /url: "#"
        - generic [ref=e19]:
          - button "language EN expand_more" [ref=e21]:
            - generic [ref=e22]: language
            - generic [ref=e23]: EN
            - generic [ref=e24]: expand_more
          - button "User avatar Alex Student expand_more" [ref=e26]:
            - img "User avatar" [ref=e28]
            - generic [ref=e29]: Alex Student
            - generic [ref=e30]: expand_more
    - complementary [ref=e31]:
      - navigation [ref=e32]:
        - generic [ref=e33]:
          - link "Dashboard" [ref=e35] [cursor=pointer]:
            - /url: /student/dashboard
            - img [ref=e36]
            - generic [ref=e42]: Dashboard
          - paragraph [ref=e43]: Explore Knowledge
          - generic [ref=e44]:
            - link "Lessons" [ref=e45] [cursor=pointer]:
              - /url: /student/lessons?source=public
              - img [ref=e46]
              - generic [ref=e50]: Lessons
            - link "Assignments" [ref=e51] [cursor=pointer]:
              - /url: /student/assignments?source=public
              - img [ref=e52]
              - generic [ref=e56]: Assignments
        - generic [ref=e57]:
          - paragraph [ref=e58]: Class Content
          - generic [ref=e59]:
            - link "Lessons Soon" [ref=e60]:
              - /url: "#"
              - img [ref=e61]
              - generic [ref=e63]:
                - generic [ref=e64]: Lessons
                - generic [ref=e65]: Soon
            - link "Assignments Soon" [ref=e66]:
              - /url: "#"
              - img [ref=e67]
              - generic [ref=e70]:
                - generic [ref=e71]: Assignments
                - generic [ref=e72]: Soon
        - generic [ref=e73]:
          - link "Bookmarks" [ref=e74] [cursor=pointer]:
            - /url: /student/bookmarks
            - img [ref=e75]
            - generic [ref=e78]: Bookmarks
          - link "Classes Soon" [ref=e79]:
            - /url: "#"
            - img [ref=e80]
            - generic [ref=e85]:
              - generic [ref=e86]: Classes
              - generic [ref=e87]: Soon
          - link "My Reviews" [ref=e88] [cursor=pointer]:
            - /url: /student/my-reviews
            - img [ref=e89]
            - generic [ref=e92]: My Reviews
          - link "Growth Soon" [ref=e93]:
            - /url: "#"
            - img [ref=e94]
            - generic [ref=e97]:
              - generic [ref=e98]: Growth
              - generic [ref=e99]: Soon
      - button "Join Live Class" [ref=e101]
    - main [ref=e102]:
      - generic [ref=e104]:
        - generic [ref=e106]:
          - generic [ref=e107]:
            - button "In Progress (17)" [ref=e108]
            - button "Completed (0)" [ref=e109]
          - generic [ref=e111]:
            - img [ref=e112]
            - textbox [ref=e115]
        - generic [ref=e117]:
          - generic:
            - generic [ref=e118]:
              - generic [ref=e119] [cursor=pointer]:
                - generic [ref=e120]:
                  - img [ref=e122]
                  - button "Public" [ref=e127]
                - generic [ref=e128]:
                  - generic [ref=e129]:
                    - generic [ref=e130]:
                      - heading "English Tenses Mastery - Level 1" [level=4] [ref=e131]
                      - button [ref=e132]:
                        - img [ref=e133]
                    - paragraph [ref=e135]: In this lesson, we will cover the fundamental concepts of English tenses, focusing on how to distinguish between simple, continuous, and perfect forms. Perfect for intermediate learners looking to refine their speaking and writing accuracy.
                  - generic [ref=e136]:
                    - generic [ref=e137]:
                      - img [ref=e139]
                      - generic [ref=e142]:
                        - paragraph [ref=e143]: Dr. Elizabeth Smith
                        - generic [ref=e144]:
                          - img [ref=e145]
                          - generic [ref=e148]: 1242 views
                    - generic [ref=e149]:
                      - text: Details
                      - img [ref=e150]
              - generic [ref=e152] [cursor=pointer]:
                - generic [ref=e153]:
                  - img [ref=e155]
                  - button "Public" [ref=e160]
                - generic [ref=e161]:
                  - generic [ref=e162]:
                    - generic [ref=e163]:
                      - 'heading "Advanced Grammar: Perfect Tenses" [level=4] [ref=e164]'
                      - button [ref=e165]:
                        - img [ref=e166]
                    - paragraph [ref=e168]: Master the nuances of perfect tenses in this advanced module.
                  - generic [ref=e169]:
                    - generic [ref=e170]:
                      - img [ref=e172]
                      - generic [ref=e175]:
                        - paragraph [ref=e176]: Dr. Elizabeth Smith
                        - generic [ref=e177]:
                          - img [ref=e178]
                          - generic [ref=e181]: 450 views
                    - generic [ref=e182]:
                      - text: Details
                      - img [ref=e183]
              - generic [ref=e185] [cursor=pointer]:
                - generic [ref=e186]:
                  - img [ref=e188]
                  - button "Public" [ref=e193]
                - generic [ref=e194]:
                  - generic [ref=e195]:
                    - generic [ref=e196]:
                      - heading "The Fascinating History of Artificial Intelligence" [level=4] [ref=e197]
                      - button [ref=e198]:
                        - img [ref=e199]
                    - paragraph [ref=e201]: Discover how artificial intelligence developed and changed the world.
                  - generic [ref=e202]:
                    - generic [ref=e203]:
                      - img [ref=e205]
                      - generic [ref=e208]:
                        - paragraph [ref=e209]: Admin Demo
                        - generic [ref=e210]:
                          - img [ref=e211]
                          - generic [ref=e214]: 1 views
                    - generic [ref=e215]:
                      - text: Details
                      - img [ref=e216]
            - generic [ref=e218]:
              - generic [ref=e219] [cursor=pointer]:
                - generic [ref=e220]:
                  - img [ref=e222]
                  - button "Public" [ref=e227]
                - generic [ref=e228]:
                  - generic [ref=e229]:
                    - generic [ref=e230]:
                      - heading "Protecting Our Environment" [level=4] [ref=e231]
                      - button [ref=e232]:
                        - img [ref=e233]
                    - paragraph [ref=e235]: Learn how we can make a difference by protecting the environment and discover new words related to environmental conservation.
                  - generic [ref=e236]:
                    - generic [ref=e237]:
                      - img [ref=e239]
                      - generic [ref=e242]:
                        - paragraph [ref=e243]: Admin Demo
                        - generic [ref=e244]:
                          - img [ref=e245]
                          - generic [ref=e248]: 0 views
                    - generic [ref=e249]:
                      - text: Details
                      - img [ref=e250]
              - generic [ref=e252] [cursor=pointer]:
                - generic [ref=e253]:
                  - img [ref=e255]
                  - button "Public" [ref=e260]
                - generic [ref=e261]:
                  - generic [ref=e262]:
                    - generic [ref=e263]:
                      - heading "Exploring the World of Animals" [level=4] [ref=e264]
                      - button [ref=e265]:
                        - img [ref=e266]
                    - paragraph [ref=e268]: Dive into the fascinating world of animals and explore the diversity and characteristics of different species.
                  - generic [ref=e269]:
                    - generic [ref=e270]:
                      - img [ref=e272]
                      - generic [ref=e275]:
                        - paragraph [ref=e276]: Teacher Demo
                        - generic [ref=e277]:
                          - img [ref=e278]
                          - generic [ref=e281]: 0 views
                    - generic [ref=e282]:
                      - text: Details
                      - img [ref=e283]
              - generic [ref=e285] [cursor=pointer]:
                - generic [ref=e286]:
                  - img [ref=e288]
                  - button "Public" [ref=e293]
                - generic [ref=e294]:
                  - generic [ref=e295]:
                    - generic [ref=e296]:
                      - heading "Discovering Fruits Around the World" [level=4] [ref=e297]
                      - button [ref=e298]:
                        - img [ref=e299]
                    - paragraph [ref=e301]: An engaging exploration of various fruits and their unique characteristics for elementary students.
                  - generic [ref=e302]:
                    - generic [ref=e303]:
                      - img [ref=e305]
                      - generic [ref=e308]:
                        - paragraph [ref=e309]: Admin Demo
                        - generic [ref=e310]:
                          - img [ref=e311]
                          - generic [ref=e314]: 0 views
                    - generic [ref=e315]:
                      - text: Details
                      - img [ref=e316]
            - generic [ref=e318]:
              - generic [ref=e319] [cursor=pointer]:
                - generic [ref=e320]:
                  - img [ref=e322]
                  - button "Public" [ref=e327]
                - generic [ref=e328]:
                  - generic [ref=e329]:
                    - generic [ref=e330]:
                      - heading "Lily’s Morning Trip to School and Her Dream Job" [level=4] [ref=e331]
                      - button [ref=e332]:
                        - img [ref=e333]
                    - paragraph [ref=e335]: A reading lesson about a girl’s morning journey to school and her dream of working as a nature photographer in the future.
                  - generic [ref=e336]:
                    - generic [ref=e337]:
                      - img [ref=e339]
                      - generic [ref=e342]:
                        - paragraph [ref=e343]: Admin Demo
                        - generic [ref=e344]:
                          - img [ref=e345]
                          - generic [ref=e348]: 0 views
                    - generic [ref=e349]:
                      - text: Details
                      - img [ref=e350]
              - generic [ref=e352] [cursor=pointer]:
                - generic [ref=e353]:
                  - img [ref=e355]
                  - button "Public" [ref=e360]
                - generic [ref=e361]:
                  - generic [ref=e362]:
                    - generic [ref=e363]:
                      - heading "Lesson World of Animals (Bản sao)" [level=4] [ref=e364]
                      - button [ref=e365]:
                        - img [ref=e366]
                    - paragraph [ref=e368]: Dive into the fascinating world of animals and explore the diversity and characteristics of different species.
                  - generic [ref=e369]:
                    - generic [ref=e370]:
                      - img [ref=e372]
                      - generic [ref=e375]:
                        - paragraph [ref=e376]: Teacher Demo
                        - generic [ref=e377]:
                          - img [ref=e378]
                          - generic [ref=e381]: 0 views
                    - generic [ref=e382]:
                      - text: Details
                      - img [ref=e383]
              - generic [ref=e385] [cursor=pointer]:
                - generic [ref=e386]:
                  - img [ref=e388]
                  - button "Public" [ref=e393]
                - generic [ref=e394]:
                  - generic [ref=e395]:
                    - generic [ref=e396]:
                      - heading "Understanding AI in Education" [level=4] [ref=e397]
                      - button [ref=e398]:
                        - img [ref=e399]
                    - paragraph [ref=e401]: Explore how Artificial Intelligence is reshaping education by improving personalized learning and handling administrative tasks while navigating ethical challenges.
                  - generic [ref=e402]:
                    - generic [ref=e403]:
                      - img [ref=e405]
                      - generic [ref=e408]:
                        - paragraph [ref=e409]: Teacher Demo
                        - generic [ref=e410]:
                          - img [ref=e411]
                          - generic [ref=e414]: 0 views
                    - generic [ref=e415]:
                      - text: Details
                      - img [ref=e416]
            - generic [ref=e418]:
              - generic [ref=e419] [cursor=pointer]:
                - generic [ref=e420]:
                  - img [ref=e422]
                  - button "Public" [ref=e427]
                - generic [ref=e428]:
                  - generic [ref=e429]:
                    - generic [ref=e430]:
                      - heading "Loving Nature in Daily Life" [level=4] [ref=e431]
                      - button [ref=e432]:
                        - img [ref=e433]
                    - paragraph [ref=e435]: A lesson about loving nature and developing good environmental habits.
                  - generic [ref=e436]:
                    - generic [ref=e437]:
                      - img [ref=e439]
                      - generic [ref=e442]:
                        - paragraph [ref=e443]: Admin Demo
                        - generic [ref=e444]:
                          - img [ref=e445]
                          - generic [ref=e448]: 0 views
                    - generic [ref=e449]:
                      - text: Details
                      - img [ref=e450]
              - generic [ref=e452] [cursor=pointer]:
                - generic [ref=e453]:
                  - img [ref=e455]
                  - button "Public" [ref=e460]
                - generic [ref=e461]:
                  - generic [ref=e462]:
                    - generic [ref=e463]:
                      - heading "Emma’s Healthy Cooking Day" [level=4] [ref=e464]
                      - button [ref=e465]:
                        - img [ref=e466]
                    - paragraph [ref=e468]: A lesson about a girl learning to prepare healthy food with her family.
                  - generic [ref=e469]:
                    - generic [ref=e470]:
                      - img [ref=e472]
                      - generic [ref=e475]:
                        - paragraph [ref=e476]: Admin Demo
                        - generic [ref=e477]:
                          - img [ref=e478]
                          - generic [ref=e481]: 0 views
                    - generic [ref=e482]:
                      - text: Details
                      - img [ref=e483]
              - generic [ref=e485] [cursor=pointer]:
                - generic [ref=e486]:
                  - img [ref=e488]
                  - button "Public" [ref=e493]
                - generic [ref=e494]:
                  - generic [ref=e495]:
                    - generic [ref=e496]:
                      - heading "Emma’s Healthy Cooking Day" [level=4] [ref=e497]
                      - button [ref=e498]:
                        - img [ref=e499]
                    - paragraph [ref=e501]: A lesson about a girl learning to prepare healthy food with her family.
                  - generic [ref=e502]:
                    - generic [ref=e503]:
                      - img [ref=e505]
                      - generic [ref=e508]:
                        - paragraph [ref=e509]: Admin Demo
                        - generic [ref=e510]:
                          - img [ref=e511]
                          - generic [ref=e514]: 0 views
                    - generic [ref=e515]:
                      - text: Details
                      - img [ref=e516]
            - generic [ref=e518]:
              - generic [ref=e519] [cursor=pointer]:
                - generic [ref=e520]:
                  - img [ref=e522]
                  - button "Public" [ref=e527]
                - generic [ref=e528]:
                  - generic [ref=e529]:
                    - generic [ref=e530]:
                      - heading "Emma's Healthy Cooking Day" [level=4] [ref=e531]
                      - button [ref=e532]:
                        - img [ref=e533]
                    - paragraph [ref=e535]: A lesson about a girl learning to prepare healthy food with her family.
                  - generic [ref=e536]:
                    - generic [ref=e537]:
                      - img [ref=e539]
                      - generic [ref=e542]:
                        - paragraph [ref=e543]: Teacher Demo
                        - generic [ref=e544]:
                          - img [ref=e545]
                          - generic [ref=e548]: 0 views
                    - generic [ref=e549]:
                      - text: Details
                      - img [ref=e550]
              - generic [ref=e552] [cursor=pointer]:
                - generic [ref=e553]:
                  - img [ref=e555]
                  - button "Public" [ref=e560]
                - generic [ref=e561]:
                  - generic [ref=e562]:
                    - generic [ref=e563]:
                      - heading "Emma's Healthy Cooking Day" [level=4] [ref=e564]
                      - button [ref=e565]:
                        - img [ref=e566]
                    - paragraph [ref=e568]: A lesson about a girl learning to prepare healthy food with her family.
                  - generic [ref=e569]:
                    - generic [ref=e570]:
                      - img [ref=e572]
                      - generic [ref=e575]:
                        - paragraph [ref=e576]: Teacher Demo
                        - generic [ref=e577]:
                          - img [ref=e578]
                          - generic [ref=e581]: 0 views
                    - generic [ref=e582]:
                      - text: Details
                      - img [ref=e583]
              - generic [ref=e585] [cursor=pointer]:
                - generic [ref=e586]:
                  - img [ref=e588]
                  - button "Public" [ref=e593]
                - generic [ref=e594]:
                  - generic [ref=e595]:
                    - generic [ref=e596]:
                      - heading "The Secret Library Under the City" [level=4] [ref=e597]
                      - button [ref=e598]:
                        - img [ref=e599]
                    - paragraph [ref=e601]: An adventure story about discovering a hidden library filled with knowledge and history.
                  - generic [ref=e602]:
                    - generic [ref=e603]:
                      - img [ref=e605]
                      - generic [ref=e608]:
                        - paragraph [ref=e609]: Teacher Demo
                        - generic [ref=e610]:
                          - img [ref=e611]
                          - generic [ref=e614]: 0 views
                    - generic [ref=e615]:
                      - text: Details
                      - img [ref=e616]
  - button "Open Next.js Dev Tools" [ref=e623] [cursor=pointer]:
    - img [ref=e624]
  - alert [ref=e627]
```

# Test source

```ts
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
  50  |     await page.waitForSelector('input[type="radio"]', { timeout: 20_000 });
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
> 115 |     await page.waitForSelector('a[href*="/student/lessons/"]', { timeout: 20_000 });
      |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
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