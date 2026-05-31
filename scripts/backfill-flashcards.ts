import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Multilingual Flashcards Seeding (15 cards per topic) ---');

  // Clear previous flashcard data to prevent duplication
  await prisma.globalFlashcard.deleteMany({});
  await prisma.flashcardTopic.deleteMany({});
  await prisma.flashcardCategory.deleteMany({});
  console.log('✓ Cleaned up old Flashcard data.');

  // 1. CREATE AGE CATEGORIES
  const categoriesData = [
    { name: 'Kids (2-5 Years)', slug: 'kids-2-5' },
    { name: 'Kids (6-12 Years)', slug: 'kid-6-12' },
    { name: 'Teenagers', slug: 'teen' },
    { name: 'Advanced Readers', slug: 'readers' }
  ];

  const categoriesMap: Record<string, any> = {};

  for (const cat of categoriesData) {
    const category = await prisma.flashcardCategory.create({
      data: cat
    });
    categoriesMap[cat.slug] = category;
    console.log(`✓ Created category: ${category.name}`);
  }

  // ==========================================
  // A. CATEGORY: KIDS (2-5 YEARS) - ANIMALS & FRUITS
  // ==========================================
  
  // Topic 1: Animals - 15 Cards
  const topicAnimals = await prisma.flashcardTopic.create({
    data: {
      categoryId: categoriesMap['kids-2-5'].id,
      name: 'Animals',
      slug: 'animals'
    }
  });
  console.log(`  ✓ Created topic: ${topicAnimals.name}`);

  const kidsAnimalsCards = [
    { word: 'Dog', phonetic: '/dɒɡ/', definition: 'A popular friendly pet.', definitionVi: 'Con chó', definitionTh: 'สุนัข', definitionId: 'Anjing', exampleSentence: 'The friendly dog wags its tail.', imageUrl: 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&q=80&w=600' },
    { word: 'Cat', phonetic: '/kæt/', definition: 'A small furry animal kept as a pet.', definitionVi: 'Con mèo', definitionTh: 'แมว', definitionId: 'Kucing', exampleSentence: 'The cute cat says meow.', imageUrl: 'https://images.unsplash.com/photo-1574158622643-69d34d72650a?auto=format&fit=crop&q=80&w=600' },
    { word: 'Bird', phonetic: '/bɜːd/', definition: 'An animal that has wings and feathers and can fly.', definitionVi: 'Con chim', definitionTh: 'นก', definitionId: 'Burung', exampleSentence: 'The little bird flies high in the sky.', imageUrl: 'https://images.unsplash.com/photo-1551085254-e96b210db58a?auto=format&fit=crop&q=80&w=600' },
    { word: 'Fish', phonetic: '/fɪʃ/', definition: 'An animal that lives and swims in water.', definitionVi: 'Con cá', definitionTh: 'ปลา', definitionId: 'Ikan', exampleSentence: 'The gold fish swims in the water.', imageUrl: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a02?auto=format&fit=crop&q=80&w=600' },
    { word: 'Lion', phonetic: '/ˈlaɪən/', definition: 'A large wild cat known as the king of the jungle.', definitionVi: 'Sư tử', definitionTh: 'สิงโต', definitionId: 'Singa', exampleSentence: 'The strong lion roars loudly.', imageUrl: 'https://images.unsplash.com/photo-1614035030394-b6e5b01e0737?auto=format&fit=crop&q=80&w=600' },
    { word: 'Monkey', phonetic: '/ˈmʌŋki/', definition: 'A playful animal with a long tail.', definitionVi: 'Con khỉ', definitionTh: 'ลิง', definitionId: 'Monyet', exampleSentence: 'The happy monkey eats a banana.', imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600' },
    { word: 'Elephant', phonetic: '/ˈelɪfənt/', definition: 'A very large gray animal with a long trunk.', definitionVi: 'Con voi', definitionTh: 'ช้าง', definitionId: 'Gajah', exampleSentence: 'The big elephant has a long nose.', imageUrl: 'https://images.unsplash.com/photo-1603570388466-eb4fe5017f3b?auto=format&fit=crop&q=80&w=600' },
    { word: 'Bear', phonetic: '/beə(r)/', definition: 'A large heavy wild animal with thick fur.', definitionVi: 'Con gấu', definitionTh: 'หมี', definitionId: 'Beruang', exampleSentence: 'The brown bear likes sweet honey.', imageUrl: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?auto=format&fit=crop&q=80&w=600' },
    { word: 'Rabbit', phonetic: '/ˈræbɪt/', definition: 'A small animal with long ears that hops.', definitionVi: 'Con thỏ', definitionTh: 'กระต่าย', definitionId: 'Kelinci', exampleSentence: 'The white rabbit hops fast in the grass.', imageUrl: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=600' },
    { word: 'Duck', phonetic: '/dʌk/', definition: 'A bird that swims and says quack.', definitionVi: 'Con vịt', definitionTh: 'เป็ด', definitionId: 'Bebek', exampleSentence: 'The yellow duck swims in the pond.', imageUrl: 'https://images.unsplash.com/photo-1555848962-6e79363ec18f?auto=format&fit=crop&q=80&w=600' },
    { word: 'Pig', phonetic: '/pɪɡ/', definition: 'A pink farm animal that rolls in the mud.', definitionVi: 'Con heo (lợn)', definitionTh: 'หมู', definitionId: 'Babi', exampleSentence: 'The pink pig rolls in the mud.', imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&q=80&w=600' },
    { word: 'Sheep', phonetic: '/ʃiːp/', definition: 'A farm animal kept for its soft wool.', definitionVi: 'Con cừu', definitionTh: 'แกะ', definitionId: 'Domba', exampleSentence: 'The sheep has warm white wool.', imageUrl: 'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?auto=format&fit=crop&q=80&w=600' },
    { word: 'Cow', phonetic: '/kaʊ/', definition: 'A farm animal that gives milk.', definitionVi: 'Con bò', definitionTh: 'วัว', definitionId: 'Sapi', exampleSentence: 'The cow gives fresh milk.', imageUrl: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=600' },
    { word: 'Frog', phonetic: '/frɒɡ/', definition: 'A small green leaping animal that lives near water.', definitionVi: 'Con ếch', definitionTh: 'กบ', definitionId: 'Katak', exampleSentence: 'The green frog jumps high.', imageUrl: 'https://images.unsplash.com/photo-1579380656108-f98e4df8ea62?auto=format&fit=crop&q=80&w=600' },
    { word: 'Tiger', phonetic: '/ˈtaɪɡə(r)/', definition: 'A large wild cat with orange and black stripes.', definitionVi: 'Con hổ', definitionTh: 'เสือ', definitionId: 'Harimau', exampleSentence: 'The tiger has beautiful black stripes.', imageUrl: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&q=80&w=600' }
  ];

  for (let i = 0; i < kidsAnimalsCards.length; i++) {
    await prisma.globalFlashcard.create({
      data: {
        topicId: topicAnimals.id,
        word: kidsAnimalsCards[i].word,
        phonetic: kidsAnimalsCards[i].phonetic,
        definition: kidsAnimalsCards[i].definition,
        definitionVi: kidsAnimalsCards[i].definitionVi,
        definitionTh: kidsAnimalsCards[i].definitionTh,
        definitionId: kidsAnimalsCards[i].definitionId,
        exampleSentence: kidsAnimalsCards[i].exampleSentence,
        imageUrl: kidsAnimalsCards[i].imageUrl,
        orderIndex: i
      }
    });
  }

  // Topic 2: Fruits - 15 Cards
  const topicFruits = await prisma.flashcardTopic.create({
    data: {
      categoryId: categoriesMap['kids-2-5'].id,
      name: 'Fruits',
      slug: 'fruits'
    }
  });
  console.log(`  ✓ Created topic: ${topicFruits.name}`);

  const kidsFruitsCards = [
    { word: 'Apple', phonetic: '/ˈæpl/', definition: 'A round sweet red or green fruit.', definitionVi: 'Quả táo', definitionTh: 'แอปเปิ้ล', definitionId: 'Apel', exampleSentence: 'The red apple is sweet and crunchy.', imageUrl: 'https://images.unsplash.com/photo-1610397613090-a9c61bfcd98a?auto=format&fit=crop&q=80&w=600' },
    { word: 'Banana', phonetic: '/bəˈnɑːnə/', definition: 'A long yellow sweet fruit.', definitionVi: 'Quả chuối', definitionTh: 'กล้วย', definitionId: 'Pisang', exampleSentence: 'The yellow banana is very delicious.', imageUrl: 'https://images.unsplash.com/photo-1566393028639-d108a42c46a7?auto=format&fit=crop&q=80&w=600' },
    { word: 'Orange', phonetic: '/ˈɒrɪndʒ/', definition: 'A round sweet citrus fruit.', definitionVi: 'Quả cam', definitionTh: 'ส้ม', definitionId: 'Jeruk', exampleSentence: 'This orange is juicy and sweet.', imageUrl: 'https://images.unsplash.com/photo-1618826411640-d6df44dd3f7a?auto=format&fit=crop&q=80&w=600' },
    { word: 'Mango', phonetic: '/ˈmæŋɡəʊ/', definition: 'A sweet yellow tropical fruit.', definitionVi: 'Quả xoài', definitionTh: 'มะม่วง', definitionId: 'Mangga', exampleSentence: 'I like to eat sweet ripe mangoes.', imageUrl: 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=600' },
    { word: 'Strawberry', phonetic: '/ˈstrɔːbəri/', definition: 'A small soft red fruit.', definitionVi: 'Quả dâu tây', definitionTh: 'สตรอเบอร์รี่', definitionId: 'Stroberi', exampleSentence: 'The tiny strawberry is bright red.', imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600' },
    { word: 'Grape', phonetic: '/ɡreɪp/', definition: 'A small round purple or green fruit.', definitionVi: 'Quả nho', definitionTh: 'องุ่น', definitionId: 'Anggur', exampleSentence: 'These purple grapes are sweet.', imageUrl: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&q=80&w=600' },
    { word: 'Watermelon', phonetic: '/ˈwɔːtəmelən/', definition: 'A large green fruit with sweet red juice.', definitionVi: 'Quả dưa hấu', definitionTh: 'แตงโม', definitionId: 'Semangka', exampleSentence: 'Watermelon is cool and sweet in summer.', imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=600' },
    { word: 'Pineapple', phonetic: '/ˈpaɪnæpl/', definition: 'A large yellow tropical fruit with a spiky skin.', definitionVi: 'Quả dứa (thơm)', definitionTh: 'สับปะรด', definitionId: 'Nanas', exampleSentence: 'The pineapple has a golden crown.', imageUrl: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&q=80&w=600' },
    { word: 'Peach', phonetic: '/piːtʃ/', definition: 'A soft round sweet fruit with fuzzy skin.', definitionVi: 'Quả đào', definitionTh: 'ลูกพีช', definitionId: 'Persik', exampleSentence: 'The soft peach smells so good.', imageUrl: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&q=80&w=600' },
    { word: 'Cherry', phonetic: '/ˈtʃeri/', definition: 'A small round bright red fruit.', definitionVi: 'Quả anh đào', definitionTh: 'เชอร์รี่', definitionId: 'Ceri', exampleSentence: 'The cherry is small, red and sweet.', imageUrl: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&q=80&w=600' },
    { word: 'Pear', phonetic: '/peə(r)/', definition: 'A sweet juicy fruit that is narrow at the top.', definitionVi: 'Quả lê', definitionTh: 'ลูกแพร์', definitionId: 'Pir', exampleSentence: 'The green pear is sweet and juicy.', imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d0167d4?auto=format&fit=crop&q=80&w=600' },
    { word: 'Papaya', phonetic: '/pəˈpaɪə/', definition: 'A sweet tropical fruit with orange flesh.', definitionVi: 'Quả đu đủ', definitionTh: 'มะละกอ', definitionId: 'Pepaya', exampleSentence: 'The ripe papaya has orange flesh.', imageUrl: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&q=80&w=600' },
    { word: 'Coconut', phonetic: '/ˈkəʊkənʌt/', definition: 'A large nut with sweet juice and white flesh.', definitionVi: 'Quả dừa', definitionTh: 'มะพร้าว', definitionId: 'Kelapa', exampleSentence: 'Coconut water is sweet and fresh.', imageUrl: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&q=80&w=600' },
    { word: 'Avocado', phonetic: '/ˌævəˈkɑːdəʊ/', definition: 'A creamy green fruit with a large seed.', definitionVi: 'Quả bơ', definitionTh: 'อะโวคาโด', definitionId: 'Alpukat', exampleSentence: 'Avocado is green, smooth and healthy.', imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&q=80&w=600' },
    { word: 'Lemon', phonetic: '/ˈlemən/', definition: 'A yellow sour citrus fruit.', definitionVi: 'Quả chanh vàng', definitionTh: 'เลมอน', definitionId: 'Lemon', exampleSentence: 'The yellow lemon is very sour.', imageUrl: 'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&q=80&w=600' }
  ];

  for (let i = 0; i < kidsFruitsCards.length; i++) {
    await prisma.globalFlashcard.create({
      data: {
        topicId: topicFruits.id,
        word: kidsFruitsCards[i].word,
        phonetic: kidsFruitsCards[i].phonetic,
        definition: kidsFruitsCards[i].definition,
        definitionVi: kidsFruitsCards[i].definitionVi,
        definitionTh: kidsFruitsCards[i].definitionTh,
        definitionId: kidsFruitsCards[i].definitionId,
        exampleSentence: kidsFruitsCards[i].exampleSentence,
        imageUrl: kidsFruitsCards[i].imageUrl,
        orderIndex: i
      }
    });
  }

  // ==========================================
  // B. CATEGORY: KIDS (6-12 YEARS) - SCHOOL & NATURE
  // ==========================================
  
  // Topic 1: School - 15 Cards
  const topicSchool = await prisma.flashcardTopic.create({
    data: {
      categoryId: categoriesMap['kid-6-12'].id,
      name: 'School',
      slug: 'school'
    }
  });
  console.log(`  ✓ Created topic: ${topicSchool.name}`);

  const kidSchoolCards = [
    { word: 'Book', phonetic: '/bʊk/', definition: 'A set of printed pages for reading.', definitionVi: 'Sách', definitionTh: 'หนังสือ', definitionId: 'Buku', exampleSentence: 'I read an interesting book every night.', imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600' },
    { word: 'Pencil', phonetic: '/ˈpensl/', definition: 'A tool used for writing or drawing.', definitionVi: 'Bút chì', definitionTh: 'ดินสอ', definitionId: 'Pensil', exampleSentence: 'I write my name with a sharp pencil.', imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=600' },
    { word: 'Ruler', phonetic: '/ˈruːlər/', definition: 'A tool used to measure or draw straight lines.', definitionVi: 'Thước kẻ', definitionTh: 'ไม้บรรทัด', definitionId: 'Penggaris', exampleSentence: 'Use a ruler to draw a straight line.', imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=600' },
    { word: 'Eraser', phonetic: '/ɪˈreɪsər/', definition: 'A tool used to rub out pencil writing.', definitionVi: 'Cục tẩy', definitionTh: 'ยางลบ', definitionId: 'Penghapus', exampleSentence: 'This pink eraser rubs out pencil marks easily.', imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=600' },
    { word: 'Desk', phonetic: '/desk/', definition: 'A table used for working or studying.', definitionVi: 'Bàn học', definitionTh: 'โต๊ะเรียน', definitionId: 'Meja tulis', exampleSentence: 'I keep my notebooks tidy on my desk.', imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=600' },
    { word: 'Chair', phonetic: '/tʃeər/', definition: 'A seat with a back for sitting.', definitionVi: 'Cái ghế', definitionTh: 'เก้าอี้', definitionId: 'Kursi', exampleSentence: 'Please sit down on the comfortable chair.', imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&q=80&w=600' },
    { word: 'Teacher', phonetic: '/ˈtiːtʃər/', definition: 'A person whose job is to help students learn.', definitionVi: 'Giáo viên', definitionTh: 'ครู', definitionId: 'Guru', exampleSentence: 'Our English teacher is very kind and helpful.', imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=600' },
    { word: 'Student', phonetic: '/ˈstjuːdnt/', definition: 'A person who is studying at school.', definitionVi: 'Học sinh', definitionTh: 'นักเรียน', definitionId: 'Siswa', exampleSentence: 'The student listens carefully in class.', imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=600' },
    { word: 'Backpack', phonetic: '/ˈbækpæk/', definition: 'A bag carried on the back for school supplies.', definitionVi: 'Ba lô', definitionTh: 'กระเป๋าเป้', definitionId: 'Ransel', exampleSentence: 'I pack my school books into my backpack.', imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600' },
    { word: 'Blackboard', phonetic: '/ˈblækbɔːd/', definition: 'A dark board for writing on with chalk.', definitionVi: 'Bảng đen', definitionTh: 'กระดานดำ', definitionId: 'Papan tulis', exampleSentence: 'The teacher writes new words on the blackboard.', imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=600' },
    { word: 'Computer', phonetic: '/kəmˈpjuːtər/', definition: 'An electronic machine used to learn and play.', definitionVi: 'Máy tính', definitionTh: 'คอมพิวเตอร์', definitionId: 'Komputer', exampleSentence: 'We learn how to type on the computer.', imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=600' },
    { word: 'Classroom', phonetic: '/ˈklɑːsruːm/', definition: 'A room in a school where lessons take place.', definitionVi: 'Lớp học', definitionTh: 'ห้องเรียน', definitionId: 'Ruang kelas', exampleSentence: 'Our classroom is bright and decorated with pictures.', imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=600' },
    { word: 'Scissors', phonetic: '/ˈsɪzəz/', definition: 'A cutting tool with two blades.', definitionVi: 'Cái kéo', definitionTh: 'กรรไกร', definitionId: 'Gunting', exampleSentence: 'Use safety scissors to cut the colored paper.', imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=600' },
    { word: 'Notebook', phonetic: '/ˈnəʊtbʊk/', definition: 'A book with empty pages for writing notes.', definitionVi: 'Vở viết', definitionTh: 'สมุดบันทึก', definitionId: 'Buku catatan', exampleSentence: 'I write my English lessons in a new notebook.', imageUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=600' },
    { word: 'Map', phonetic: '/mæp/', definition: 'A drawing of a country or the world.', definitionVi: 'Bản đồ', definitionTh: 'แผนที่', definitionId: 'Peta', exampleSentence: 'We look at the world map to find different countries.', imageUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=600' }
  ];

  for (let i = 0; i < kidSchoolCards.length; i++) {
    await prisma.globalFlashcard.create({
      data: {
        topicId: topicSchool.id,
        word: kidSchoolCards[i].word,
        phonetic: kidSchoolCards[i].phonetic,
        definition: kidSchoolCards[i].definition,
        definitionVi: kidSchoolCards[i].definitionVi,
        definitionTh: kidSchoolCards[i].definitionTh,
        definitionId: kidSchoolCards[i].definitionId,
        exampleSentence: kidSchoolCards[i].exampleSentence,
        imageUrl: kidSchoolCards[i].imageUrl,
        orderIndex: i
      }
    });
  }

  // Topic 2: Nature - 15 Cards
  const topicNature = await prisma.flashcardTopic.create({
    data: {
      categoryId: categoriesMap['kid-6-12'].id,
      name: 'Nature',
      slug: 'nature'
    }
  });
  console.log(`  ✓ Created topic: ${topicNature.name}`);

  const kidNatureCards = [
    { word: 'Tree', phonetic: '/triː/', definition: 'A tall plant with a wooden trunk and branches.', definitionVi: 'Cây cối', definitionTh: 'ต้นไม้', definitionId: 'Pohon', exampleSentence: 'The little birds build their nest in the green tree.', imageUrl: 'https://images.unsplash.com/photo-1618826411640-d6df44dd3f7a?auto=format&fit=crop&q=80&w=600' },
    { word: 'Flower', phonetic: '/ˈflaʊər/', definition: 'The colorful part of a plant that smells sweet.', definitionVi: 'Bông hoa', definitionTh: 'ดอกไม้', definitionId: 'Bunga', exampleSentence: 'She picked a beautiful red flower from the garden.', imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600' },
    { word: 'Sun', phonetic: '/sʌn/', definition: 'The bright star that lights up the sky during the day.', definitionVi: 'Mặt trời', definitionTh: 'พระอาทิตย์', definitionId: 'Matahari', exampleSentence: 'The warm sun shines brightly in the morning.', imageUrl: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=600' },
    { word: 'Moon', phonetic: '/muːn/', definition: 'The large round light in the night sky.', definitionVi: 'Mặt trăng', definitionTh: 'พระจันทร์', definitionId: 'Bulan', exampleSentence: 'The round moon glows softly in the dark sky.', imageUrl: 'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?auto=format&fit=crop&q=80&w=600' },
    { word: 'Cloud', phonetic: '/klaʊd/', definition: 'A white or gray shape made of water in the sky.', definitionVi: 'Đám mây', definitionTh: 'ก้อนเมฆ', definitionId: 'Awan', exampleSentence: 'There is a fluffy white cloud in the blue sky.', imageUrl: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&q=80&w=600' },
    { word: 'Rain', phonetic: '/reɪn/', definition: 'Water that falls in drops from the sky.', definitionVi: 'Cơn mưa', definitionTh: 'ฝน', definitionId: 'Hujan', exampleSentence: 'We need a colorful umbrella when it starts to rain.', imageUrl: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&q=80&w=600' },
    { word: 'River', phonetic: '/ˈrɪvər/', definition: 'A natural flow of fresh water that runs to the sea.', definitionVi: 'Dòng sông', definitionTh: 'แม่น้ำ', definitionId: 'Sungai', exampleSentence: 'The cool water flows gently in the long river.', imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=600' },
    { word: 'Mountain', phonetic: '/ˈmaʊntən/', definition: 'A very high hill of rock and earth.', definitionVi: 'Ngọn núi', definitionTh: 'ภูเขา', definitionId: 'Gunung', exampleSentence: 'The snowy mountain is extremely high and beautiful.', imageUrl: 'https://images.unsplash.com/photo-1618826411640-d6df44dd3f7a?auto=format&fit=crop&q=80&w=600' },
    { word: 'Rainbow', phonetic: '/ˈreiŋbəu/', definition: 'A colorful arch that appears in the sky after rain.', definitionVi: 'Cầu vồng', definitionTh: 'รุ้งกินน้ำ', definitionId: 'Pelangi', exampleSentence: 'A beautiful seven-colored rainbow appeared in the sky.', imageUrl: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&q=80&w=600' },
    { word: 'Star', phonetic: '/stɑːr/', definition: 'A small bright light in the sky at night.', definitionVi: 'Ngôi sao', definitionTh: 'ดาว', definitionId: 'Bintang', exampleSentence: 'I love looking at the sparkling stars at night.', imageUrl: 'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?auto=format&fit=crop&q=80&w=600' },
    { word: 'Sea', phonetic: '/siː/', definition: 'A large body of salty water.', definitionVi: 'Biển cả', definitionTh: 'ทะเล', definitionId: 'Laut', exampleSentence: 'We love playing with the waves at the blue sea.', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600' },
    { word: 'Wind', phonetic: '/wɪnd/', definition: 'A natural movement of air.', definitionVi: 'Gió', definitionTh: 'ลม', definitionId: 'Angin', exampleSentence: 'The strong wind blew the colorful kite high up.', imageUrl: 'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?auto=format&fit=crop&q=80&w=600' },
    { word: 'Forest', phonetic: '/ˈfɒrɪst/', definition: 'A large area of land covered with many trees.', definitionVi: 'Khu rừng', definitionTh: 'ป่าไม้', definitionId: 'Hutan', exampleSentence: 'Many wild animals live in the deep green forest.', imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=600' },
    { word: 'Leaf', phonetic: '/liːf/', definition: 'A flat green part of a plant or tree.', definitionVi: 'Chiếc lá', definitionTh: 'ใบไม้', definitionId: 'Daun', exampleSentence: 'A dry yellow leaf fell slowly from the tree branch.', imageUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=600' },
    { word: 'Stone', phonetic: '/stəʊn/', definition: 'A small hard piece of rock.', definitionVi: 'Hòn đá', definitionTh: 'ก้อนหิน', definitionId: 'Batu', exampleSentence: 'He threw a smooth small stone into the pond.', imageUrl: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&q=80&w=600' }
  ];

  for (let i = 0; i < kidNatureCards.length; i++) {
    await prisma.globalFlashcard.create({
      data: {
        topicId: topicNature.id,
        word: kidNatureCards[i].word,
        phonetic: kidNatureCards[i].phonetic,
        definition: kidNatureCards[i].definition,
        definitionVi: kidNatureCards[i].definitionVi,
        definitionTh: kidNatureCards[i].definitionTh,
        definitionId: kidNatureCards[i].definitionId,
        exampleSentence: kidNatureCards[i].exampleSentence,
        imageUrl: kidNatureCards[i].imageUrl,
        orderIndex: i
      }
    });
  }

  // ==========================================
  // C. CATEGORY: TEENAGERS - SPACE & HOBBIES
  // ==========================================
  
  // Topic 1: Space Exploration - 15 Cards
  const topicSpace = await prisma.flashcardTopic.create({
    data: {
      categoryId: categoriesMap['teen'].id,
      name: 'Space Exploration',
      slug: 'space'
    }
  });
  console.log(`  ✓ Created topic: ${topicSpace.name}`);

  const teenSpaceCards = [
    {
      word: 'Astronaut',
      phonetic: '/ˈæstrənɔːt/',
      definition: 'A person trained to travel in a spacecraft.',
      definitionVi: 'Phi hành gia',
      definitionTh: 'นักบินอวกาศ',
      definitionId: 'Astronot',
      exampleSentence: 'Neil Armstrong was the first astronaut to walk on the moon.',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Rocket',
      phonetic: '/ˈrɒkɪt/',
      definition: 'A powerful vehicle used to launch spacecraft.',
      definitionVi: 'Tên lửa',
      definitionTh: 'จรวด',
      definitionId: 'Roket',
      exampleSentence: 'The powerful rocket launched the satellite into orbit.',
      imageUrl: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Galaxy',
      phonetic: '/ˈɡæləksi/',
      definition: 'A massive system of billions of stars, gas, and dust.',
      definitionVi: 'Thiên hà',
      definitionTh: 'กาแล็กซี',
      definitionId: 'Galaksi',
      exampleSentence: 'Our solar system is located in the Milky Way galaxy.',
      imageUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Telescope',
      phonetic: '/ˈtelɪskəʊp/',
      definition: 'A tool used to view distant objects in space.',
      definitionVi: 'Kính viễn vọng',
      definitionTh: 'กล้องโทรทรรศน์',
      definitionId: 'Teleskop',
      exampleSentence: 'Astronomers used the space telescope to discover new planets.',
      imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Meteor',
      phonetic: '/ˈmiːtiə(r)/',
      definition: 'A piece of rock from space that burns in Earth atmosphere.',
      definitionVi: 'Sao băng (thiên thạch)',
      definitionTh: 'ดาวตก',
      definitionId: 'Meteor',
      exampleSentence: 'We made a wish when we saw a bright meteor in the night sky.',
      imageUrl: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Gravity',
      phonetic: '/ˈɡrævəti/',
      definition: 'The natural force that pulls objects toward each other.',
      definitionVi: 'Trọng lực (lực hút)',
      definitionTh: 'แรงโน้มถ่วง',
      definitionId: 'Gravitasi',
      exampleSentence: 'In outer space, astronauts experience zero gravity.',
      imageUrl: 'https://images.unsplash.com/photo-1454789548928-9efd52dc4031?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Planet',
      phonetic: '/ˈplænɪt/',
      definition: 'A large round body moving in orbit around a star.',
      definitionVi: 'Hành tinh',
      definitionTh: 'ดาวเคราะห์',
      definitionId: 'Planet',
      exampleSentence: 'Jupiter is the largest planet in our solar system.',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Spaceship',
      phonetic: '/ˈspeɪs.ʃɪp/',
      definition: 'A vehicle designed for travel or flight in outer space.',
      definitionVi: 'Tàu vũ trụ',
      definitionTh: 'ยานอวกาศ',
      definitionId: 'Kapal luar angkasa',
      exampleSentence: 'The futuristic spaceship entered hyper-drive and disappeared.',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Comet',
      phonetic: '/ˈkɒm.ɪt/',
      definition: 'A ball of ice, rock, and cosmic dust with a glowing tail.',
      definitionVi: 'Sao chổi',
      definitionTh: 'ดาวหาง',
      definitionId: 'Komet',
      exampleSentence: 'Halley’s Comet is visible from Earth only once every 75 years.',
      imageUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Satellite',
      phonetic: '/ˈsæt.əl.aɪt/',
      definition: 'A device sent into space to orbit around a planet.',
      definitionVi: 'Vệ tinh nhân tạo',
      definitionTh: 'ดาวเทียม',
      definitionId: 'Satelit',
      exampleSentence: 'Weather satellites provide clear radar data to forecast storms.',
      imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Orbit',
      phonetic: '/ˈɔː.bɪt/',
      definition: 'The curved path of an object revolving around a planet.',
      definitionVi: 'Quỹ đạo chuyển động',
      definitionTh: 'วงโคจร',
      definitionId: 'Orbit',
      exampleSentence: 'The space station is in a stable low Earth orbit.',
      imageUrl: 'https://images.unsplash.com/photo-1454789548928-9efd52dc4031?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Eclipse',
      phonetic: '/ɪˈklɪps/',
      definition: 'An occasion when the sun or moon is blocked from view.',
      definitionVi: 'Nhật thực / Nguyệt thực',
      definitionTh: 'สุริยุปราคา / จันทรุปราคา',
      definitionId: 'Gerhana',
      exampleSentence: 'We wore protective glasses to watch the spectacular solar eclipse.',
      imageUrl: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Alien',
      phonetic: '/ˈeɪ.li.ən/',
      definition: 'A creature belonging to another world or planet.',
      definitionVi: 'Sinh vật ngoài hành tinh',
      definitionTh: 'มนุษย์ต่างดาว',
      definitionId: 'Makhluk asing',
      exampleSentence: 'Science fiction films often portray intelligent alien civilizations.',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Asteroid',
      phonetic: '/ˈæs.tər.ɔɪd/',
      definition: 'A small rocky body orbiting the sun in outer space.',
      definitionVi: 'Tiểu hành tinh',
      definitionTh: 'ดาวเคราะห์น้อย',
      definitionId: 'Asteroid',
      exampleSentence: 'The giant asteroid crater on Earth is millions of years old.',
      imageUrl: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Universe',
      phonetic: '/ˈjuː.nɪ.vɜːs/',
      definition: 'All of space and time and everything in them.',
      definitionVi: 'Vũ trụ bao la',
      definitionTh: 'จักรวาล',
      definitionId: 'Alam semesta',
      exampleSentence: 'The observable universe holds billions of beautiful galaxies.',
      imageUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=600'
    }
  ];

  for (let i = 0; i < teenSpaceCards.length; i++) {
    await prisma.globalFlashcard.create({
      data: {
        topicId: topicSpace.id,
        word: teenSpaceCards[i].word,
        phonetic: teenSpaceCards[i].phonetic,
        definition: teenSpaceCards[i].definition,
        definitionVi: teenSpaceCards[i].definitionVi,
        definitionTh: teenSpaceCards[i].definitionTh,
        definitionId: teenSpaceCards[i].definitionId,
        exampleSentence: teenSpaceCards[i].exampleSentence,
        imageUrl: teenSpaceCards[i].imageUrl,
        orderIndex: i
      }
    });
  }

  // Topic 2: Hobbies & Sports - 15 Cards
  const topicHobbies = await prisma.flashcardTopic.create({
    data: {
      categoryId: categoriesMap['teen'].id,
      name: 'Hobbies & Sports',
      slug: 'hobbies'
    }
  });
  console.log(`  ✓ Created topic: ${topicHobbies.name}`);

  const teenHobbiesCards = [
    {
      word: 'Photography',
      phonetic: '/fəˈtɒɡrəfi/',
      definition: 'The art, hobby or job of taking and processing photographs.',
      definitionVi: 'Nhiếp ảnh (chụp ảnh)',
      definitionTh: 'การถ่ายภาพ',
      definitionId: 'Fotografi',
      exampleSentence: 'She loves landscape photography and travels often.',
      imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Guitar',
      phonetic: '/ɡɪˈtɑː(r)/',
      definition: 'A popular stringed musical instrument with six strings.',
      definitionVi: 'Đàn Ghi-ta',
      definitionTh: 'กีตาร์',
      definitionId: 'Gitar',
      exampleSentence: 'He practices playing the acoustic guitar every evening.',
      imageUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Athletics',
      phonetic: '/æθˈletɪks/',
      definition: 'Sports such as running, jumping, and throwing.',
      definitionVi: 'Điền kinh (thể thao)',
      definitionTh: 'กรีฑา',
      definitionId: 'Atletik',
      exampleSentence: 'Running and high jumping are popular events in athletics.',
      imageUrl: 'https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Camping',
      phonetic: '/ˈkæmpɪŋ/',
      definition: 'The activity of sleeping outside in a tent for recreation.',
      definitionVi: 'Cắm trại dã ngoại',
      definitionTh: 'การตั้งแคมป์',
      definitionId: 'Berkemah',
      exampleSentence: 'We pitched our tents and enjoyed camping near the river.',
      imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Climbing',
      phonetic: '/ˈklaɪmɪŋ/',
      definition: 'The sport of scaling mountains or indoor climbing walls.',
      definitionVi: 'Leo núi',
      definitionTh: 'การปีนหน้าผา',
      definitionId: 'Panjat tebing',
      exampleSentence: 'Rock climbing requires high strength and mental focus.',
      imageUrl: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Baking',
      phonetic: '/ˈbeɪkɪŋ/',
      definition: 'The process of cooking food in an oven using dry heat.',
      definitionVi: 'Làm bánh ngọt',
      definitionTh: 'การอบขนม',
      definitionId: 'Membuat kue',
      exampleSentence: 'My sister’s favorite weekend hobby is baking delicious cakes.',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Painting',
      phonetic: '/ˈpeɪ.tɪŋ/',
      definition: 'The action or skill of using paint to create art.',
      definitionVi: 'Mỹ thuật vẽ tranh',
      definitionTh: 'การวาดภาพระบายสี',
      definitionId: 'Melukis',
      exampleSentence: 'She expresses her inner thoughts through watercolor painting.',
      imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Reading',
      phonetic: '/ˈriː.dɪŋ/',
      definition: 'The action or skill of reading books or literature.',
      definitionVi: 'Đọc sách truyện',
      definitionTh: 'การอ่าน',
      definitionId: 'Membaca',
      exampleSentence: 'Reading books is a perfect way to expand your vocabulary.',
      imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Cycling',
      phonetic: '/ˈsaɪ.klɪŋ/',
      definition: 'The activity or sport of riding a bicycle.',
      definitionVi: 'Đạp xe đạp',
      definitionTh: 'การปั่นจักรยาน',
      definitionId: 'Bersepeda',
      exampleSentence: 'We went cycling around the beautiful lake yesterday morning.',
      imageUrl: 'https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Gardening',
      phonetic: '/ˈɡɑː.dən.ɪŋ/',
      definition: 'The activity of growing and caring for plants in a garden.',
      definitionVi: 'Làm vườn trồng cây',
      definitionTh: 'การทำสวน',
      definitionId: 'Berkebun',
      exampleSentence: 'Gardening connects you with mother nature and relaxes your mind.',
      imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Chess',
      phonetic: '/tʃes/',
      definition: 'A strategic board game played by two players.',
      definitionVi: 'Cờ vua trí tuệ',
      definitionTh: 'หมากรุก',
      definitionId: 'Catur',
      exampleSentence: 'He beat the local grandmaster in an intense chess match.',
      imageUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Fishing',
      phonetic: '/ˈfɪʃ.ɪŋ/',
      definition: 'The activity of catching fish for recreation or food.',
      definitionVi: 'Câu cá thư giãn',
      definitionTh: 'การตกปลา',
      definitionId: 'Memancing',
      exampleSentence: 'My grandfather enjoys silent weekend fishing at the lake.',
      imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Swimming',
      phonetic: '/ˈswɪm.ɪŋ/',
      definition: 'The sport or activity of propelling oneself through water.',
      definitionVi: 'Bơi lội',
      definitionTh: 'การว่ายน้ำ',
      definitionId: 'Berenang',
      exampleSentence: 'Swimming is a complete body workout that improves stamina.',
      imageUrl: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Dancing',
      phonetic: '/ˈdɑːn.sɪŋ/',
      definition: 'The activity of moving your body to the rhythm of music.',
      definitionVi: 'Nhảy múa khiêu vũ',
      definitionTh: 'การเต้นรำ',
      definitionId: 'Menari',
      exampleSentence: 'Dancing brings extreme happiness and releases stress.',
      imageUrl: 'https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Jogging',
      phonetic: '/ˈdʒɒɡ.ɪŋ/',
      definition: 'The activity of running at a steady, gentle pace for exercise.',
      definitionVi: 'Chạy bộ thể dục',
      definitionTh: 'การวิ่งเหยาะๆ',
      definitionId: 'Joging',
      exampleSentence: 'Jogging every morning keeps your heart active and healthy.',
      imageUrl: 'https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&q=80&w=600'
    }
  ];

  for (let i = 0; i < teenHobbiesCards.length; i++) {
    await prisma.globalFlashcard.create({
      data: {
        topicId: topicHobbies.id,
        word: teenHobbiesCards[i].word,
        phonetic: teenHobbiesCards[i].phonetic,
        definition: teenHobbiesCards[i].definition,
        definitionVi: teenHobbiesCards[i].definitionVi,
        definitionTh: teenHobbiesCards[i].definitionTh,
        definitionId: teenHobbiesCards[i].definitionId,
        exampleSentence: teenHobbiesCards[i].exampleSentence,
        imageUrl: teenHobbiesCards[i].imageUrl,
        orderIndex: i
      }
    });
  }

  // ==========================================
  // D. CATEGORY: ADVANCED READERS - BUSINESS & ART
  // ==========================================
  
  // Topic 1: Business & Technology - 15 Cards
  const topicTech = await prisma.flashcardTopic.create({
    data: {
      categoryId: categoriesMap['readers'].id,
      name: 'Business & Technology',
      slug: 'tech'
    }
  });
  console.log(`  ✓ Created topic: ${topicTech.name}`);

  const readersTechCards = [
    {
      word: 'Innovation',
      phonetic: '/ˌɪn.əˈveɪ.ʃən/',
      definition: 'A new method, idea, or product that creates values.',
      definitionVi: 'Sự đổi mới, sáng tạo đột phá',
      definitionTh: 'นวัตกรรม',
      definitionId: 'Inovasi',
      exampleSentence: 'Innovation is key to a tech company’s survival in a competitive market.',
      imageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Entrepreneur',
      phonetic: '/ˌɒn.trə.prəˈnɜː(r)/',
      definition: 'A person who sets up a business, taking on financial risks.',
      definitionVi: 'Nhà khởi nghiệp, chủ doanh nghiệp',
      definitionTh: 'ผู้ประกอบการ',
      definitionId: 'Pengusaha',
      exampleSentence: 'The successful entrepreneur shared her story of building a global startup.',
      imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Intelligence',
      phonetic: '/ɪnˈtel.ɪ.dʒəns/',
      definition: 'The ability to acquire and apply knowledge and skills.',
      definitionVi: 'Trí tuệ nhân tạo, sự thông minh',
      definitionTh: 'ปัญญา / ความฉลาด',
      definitionId: 'Kecerdasan',
      exampleSentence: 'Artificial Intelligence is revolutionizing how we analyze complex tech charts.',
      imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Collaboration',
      phonetic: '/kəˌlæb.əˈreɪ.ʃən/',
      definition: 'The action of working with someone to produce or create something.',
      definitionVi: 'Sự cộng tác, làm việc nhóm',
      definitionTh: 'การร่วมมือกัน',
      definitionId: 'Kolaborasi',
      exampleSentence: 'Global project collaboration requires modern sync communication tools.',
      imageUrl: 'https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Security',
      phonetic: '/sɪˈkjʊə.rə.ti/',
      definition: 'The state of being free from danger, threats, or unauthorized access.',
      definitionVi: 'An ninh bảo mật dữ liệu',
      definitionTh: 'ความปลอดภัย',
      definitionId: 'Keamanan',
      exampleSentence: 'Organizations invest heavily in advanced security parameters.',
      imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Infrastructure',
      phonetic: '/ˈɪn.frəˌstrʌk.tʃə(r)/',
      definition: 'The basic physical and organizational structures needed for an operation.',
      definitionVi: 'Cơ sở hạ tầng kỹ thuật',
      definitionTh: 'โครงสร้างพื้นฐาน',
      definitionId: 'Infrastruktur',
      exampleSentence: 'Cloud infrastructure enables seamless vertical scaling.',
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Strategy',
      phonetic: '/ˈstræt.ə.dʒi/',
      definition: 'A plan of action designed to achieve a long-term or overall aim.',
      definitionVi: 'Kế hoạch hành động chiến lược',
      definitionTh: 'กลยุทธ์',
      definitionId: 'Strategi',
      exampleSentence: 'A sound corporate strategy helps mitigate operational risks.',
      imageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Leadership',
      phonetic: '/ˈliː.də.ʃɪp/',
      definition: 'The action of leading a group of people or an organization.',
      definitionVi: 'Năng lực lãnh đạo dẫn dắt',
      definitionTh: 'ความเป็นผู้นำ',
      definitionId: 'Kepemimpinan',
      exampleSentence: 'True leadership involves empowering team members to unleash their potential.',
      imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Investment',
      phonetic: '/ɪnˈvest.mənt/',
      definition: 'The action of investing money or effort for profit or material result.',
      definitionVi: 'Khoản tiền tài chính đầu tư',
      definitionTh: 'การลงทุน',
      definitionId: 'Investasi',
      exampleSentence: 'Venture capital investment has reached record levels in the fintech sector.',
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Marketing',
      phonetic: '/ˈmɑː.kɪ.tɪŋ/',
      definition: 'The action or business of promoting and selling products or services.',
      definitionVi: 'Hoạt động tiếp thị quảng cáo',
      definitionTh: 'การตลาด',
      definitionId: 'Pemasaran',
      exampleSentence: 'Digital marketing strategies rely heavily on data analytics.',
      imageUrl: 'https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Algorithm',
      phonetic: '/ˈæl.ɡə.rɪ.ðəm/',
      definition: 'A process or set of rules to be followed in calculations by computers.',
      definitionVi: 'Thuật toán máy tính',
      definitionTh: 'อัลกอริทึม',
      definitionId: 'Algoritma',
      exampleSentence: 'Search engines use complex sorting algorithms to deliver query results.',
      imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Blockchain',
      phonetic: '/ˈblɒk.tʃeɪn/',
      definition: 'A decentralized digital ledger that guarantees secure transactions.',
      definitionVi: 'Công nghệ chuỗi khối phi tập trung',
      definitionTh: 'บล็อกเชน',
      definitionId: 'Rantai blok',
      exampleSentence: 'Blockchain technology guarantees secure, transparent transactional ledgers.',
      imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'E-commerce',
      phonetic: '/ˈiːˌkɒm.ɜːs/',
      definition: 'Commercial transactions conducted electronically on the Internet.',
      definitionVi: 'Thương mại điện tử mua bán online',
      definitionTh: 'อีคอมเมิร์ซ / การค้าออนไลน์',
      definitionId: 'Perdagangan elektronik',
      exampleSentence: 'Mobile commerce makes up the majority of overall e-commerce sales.',
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Globalization',
      phonetic: '/ˌɡləʊ.bəl.aɪˈzeɪ.ʃən/',
      definition: 'The process by which businesses develop international influence.',
      definitionVi: 'Toàn cầu hóa kinh tế',
      definitionTh: 'โลกาภิวัตน์',
      definitionId: 'Globalisasi',
      exampleSentence: 'Globalization allows companies to access international talent pools easily.',
      imageUrl: 'https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Automation',
      phonetic: '/ˌɔː.təˈmeɪ.ʃən/',
      definition: 'The use of automatic equipment in a manufacturing or other process.',
      definitionVi: 'Tự động hóa bằng máy móc',
      definitionTh: 'ระบบอัตโนมัติ',
      definitionId: 'Otomasi',
      exampleSentence: 'Workforce automation improves efficiency and reduces manual input errors.',
      imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600'
    }
  ];

  for (let i = 0; i < readersTechCards.length; i++) {
    await prisma.globalFlashcard.create({
      data: {
        topicId: topicTech.id,
        word: readersTechCards[i].word,
        phonetic: readersTechCards[i].phonetic,
        definition: readersTechCards[i].definition,
        definitionVi: readersTechCards[i].definitionVi,
        definitionTh: readersTechCards[i].definitionTh,
        definitionId: readersTechCards[i].definitionId,
        exampleSentence: readersTechCards[i].exampleSentence,
        imageUrl: readersTechCards[i].imageUrl,
        orderIndex: i
      }
    });
  }

  // Topic 2: Literature & Art - 15 Cards
  const topicArt = await prisma.flashcardTopic.create({
    data: {
      categoryId: categoriesMap['readers'].id,
      name: 'Literature & Art',
      slug: 'art'
    }
  });
  console.log(`  ✓ Created topic: ${topicArt.name}`);

  const readersArtCards = [
    {
      word: 'Masterpiece',
      phonetic: '/ˈmɑː.stə.piːs/',
      definition: 'A work of outstanding artistry, skill, or workmanship.',
      definitionVi: 'Kiệt tác xuất sắc xuất chúng',
      definitionTh: 'ผลงานชิ้นเอก',
      definitionId: 'Mahakarya',
      exampleSentence: 'Leonardo da Vinci’s Mona Lisa is recognized as a world-famous masterpiece.',
      imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Novelist',
      phonetic: '/ˈnɒv.əl.ɪst/',
      definition: 'A writer of novels.',
      definitionVi: 'Tiểu thuyết gia viết truyện',
      definitionTh: 'นักเขียนนวนิยาย',
      definitionId: 'Novelis',
      exampleSentence: 'The novelist spent five years researching his epic historical fiction.',
      imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Symphony',
      phonetic: '/ˈsɪm.fə.ni/',
      definition: 'An elaborate musical composition for a full orchestra.',
      definitionVi: 'Hòa tấu nhạc giao hưởng',
      definitionTh: 'ซิมโฟนี',
      definitionId: 'Simfoni',
      exampleSentence: 'The classical orchestra performed Beethoven’s famous Ninth Symphony beautifully.',
      imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Metaphor',
      phonetic: '/ˈmet.ə.fɔː(r)/',
      definition: 'A figure of speech in which a word or phrase is applied to an object.',
      definitionVi: 'Phép ẩn dụ nghệ thuật',
      definitionTh: 'คำอุปมา',
      definitionId: 'Metafora',
      exampleSentence: 'The poet used the metaphor of a blooming rose to describe the joy of youth.',
      imageUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Exhibition',
      phonetic: '/ˌek.sɪˈbɪʃ.ən/',
      definition: 'A public display of works of art or items of interest.',
      definitionVi: 'Triển lãm tranh ảnh nghệ thuật',
      definitionTh: 'นิทรรศการ',
      definitionId: 'Pameran',
      exampleSentence: 'We visited a contemporary art exhibition at the national gallery yesterday.',
      imageUrl: 'https://images.unsplash.com/photo-1531058020387-3be344559767?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Sculpture',
      phonetic: '/ˈskʌlp.tʃə(r)/',
      definition: 'The art of making two- or three-dimensional representative forms.',
      definitionVi: 'Nghệ thuật điêu khắc tạc tượng',
      definitionTh: 'ประติกรรม',
      definitionId: 'Seni patung',
      exampleSentence: 'Michelangelo’s David is one of the most famous marble sculptures in Florence.',
      imageUrl: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Canvas',
      phonetic: '/ˈkæn.vəs/',
      definition: 'A strong, coarse unbleached cloth used as a surface for oil painting.',
      definitionVi: 'Khung vải vẽ tranh sơn dầu',
      definitionTh: 'ผืนผ้าใบ',
      definitionId: 'Kanvas',
      exampleSentence: 'The painter applied smooth strokes of oil paint to the blank canvas.',
      imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Harmony',
      phonetic: '/ˈhɑː.mə.ni/',
      definition: 'The combination of simultaneously sounded musical notes to produce chords.',
      definitionVi: 'Sự hòa hợp, hòa âm âm nhạc',
      definitionTh: 'ความสามัคคี / ความประสานเสียง',
      definitionId: 'Harmoni',
      exampleSentence: 'A master composer weaves notes together to achieve absolute acoustic harmony.',
      imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Abstract',
      phonetic: '/ˈæb.strækt/',
      definition: 'Art that does not attempt to represent external reality.',
      definitionVi: 'Hội họa trừu tượng phi hiện thực',
      definitionTh: 'ศิลปะนามธรรม',
      definitionId: 'Abstrak',
      exampleSentence: 'Abstract art challenges viewers to interpret emotions through simple colors.',
      imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Poetry',
      phonetic: '/ˈpəʊ.ɪ.tri/',
      definition: 'Literary work in which special intensity is given to the expression of feelings.',
      definitionVi: 'Thơ ca văn chương lãng mạn',
      definitionTh: 'บทกวี',
      definitionId: 'Puisi',
      exampleSentence: 'Writing poetry helps translate delicate feelings into beautifully structured verses.',
      imageUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Architecture',
      phonetic: '/ˈɑː.kɪ.tek.tʃə(r)/',
      definition: 'The art or practice of designing and constructing buildings.',
      definitionVi: 'Kiến trúc công trình xây dựng',
      definitionTh: 'สถาปัตยกรรม',
      definitionId: 'Arsitektur',
      exampleSentence: 'Gothic architecture is characterized by pointed arches and ribbed vaults.',
      imageUrl: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Portrait',
      phonetic: '/ˈpɔː.trət/',
      definition: 'A painting, drawing, photograph, or engraving of a person.',
      definitionVi: 'Tranh chân dung lột tả thần thái',
      definitionTh: 'ภาพภาพเหมือน',
      definitionId: 'Potret',
      exampleSentence: 'The royalty commissioned a master painter to execute his official royal portrait.',
      imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Biography',
      phonetic: '/baɪˈɒɡ.rə.fi/',
      definition: 'An account of someone’s life written by someone else.',
      definitionVi: 'Sách tiểu sử cuộc đời danh nhân',
      definitionTh: 'ชีวประวัติ',
      definitionId: 'Biografi',
      exampleSentence: 'Reading a great biography offers deep insights into a historical figure’s life.',
      imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Philosophy',
      phonetic: '/fɪˈlɒs.ə.fi/',
      definition: 'The study of the fundamental nature of knowledge, reality, and existence.',
      definitionVi: 'Triết học nhân sinh quan vũ trụ',
      definitionTh: 'ปรัชญา',
      definitionId: 'Filsafat',
      exampleSentence: 'Greek philosophy has profoundly shaped the foundations of Western intellectual history.',
      imageUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600'
    },
    {
      word: 'Perspective',
      phonetic: '/pəˈspek.tɪv/',
      definition: 'The art of drawing solid objects on a two-dimensional surface so as to give the right impression.',
      definitionVi: 'Luật phối cảnh hội họa',
      definitionTh: 'มุมมอง / ทัศนมิติ',
      definitionId: 'Perspektif',
      exampleSentence: 'Renaissance painters pioneered the mathematical use of linear perspective.',
      imageUrl: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&q=80&w=600'
    }
  ];

  for (let i = 0; i < readersArtCards.length; i++) {
    await prisma.globalFlashcard.create({
      data: {
        topicId: topicArt.id,
        word: readersArtCards[i].word,
        phonetic: readersArtCards[i].phonetic,
        definition: readersArtCards[i].definition,
        definitionVi: readersArtCards[i].definitionVi,
        definitionTh: readersArtCards[i].definitionTh,
        definitionId: readersArtCards[i].definitionId,
        exampleSentence: readersArtCards[i].exampleSentence,
        imageUrl: readersArtCards[i].imageUrl,
        orderIndex: i
      }
    });
  }

  console.log('--- Multilingual Flashcards Seeding Completed Successfully! ---');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
