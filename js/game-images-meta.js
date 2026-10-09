/**
 * ============================================================================
 * 《黑金魔法術─永續食物循環系統》- 全域 20 張美術素材清單與生圖 Prompt 元資料
 * ============================================================================
 * 提供前端純客戶端（免 Python 伺服器）自訂換膚、生圖 Prompt 模板產生與預設路徑對應
 */

window.GAME_IMAGES_META = [
  // --- 四大守護勇者 (4張立繪 + 4張頭像) ---
  {
    filename: "hero_sprite.png",
    category: "heroes",
    categoryName: "四大守護勇者",
    name: "莫莫 Momo（黑金魔法師）立繪",
    desc: "戰鬥舞台主角全身戰鬥立繪（精通微生物分解魔法）",
    spec: "PNG (透明背景) ｜ 建議 800×1000",
    defaultPath: "assets/images/hero_sprite.png",
    promptEn: "Full-body anime character sprite, cute young eco-wizard boy named Momo, Akira Toriyama style, pointy dark-brown wizard hat with emerald trim and golden star, friendly cheerful smile, forest green magic cape with autumn leaf pattern, holding a wooden magic staff topped with a glowing green fermentation crystal orb, floating sparkles, clean isolated transparent background, 2D RPG game asset --ar 3:4",
    promptZh: "鳥山明風格可愛黑金魔法師少年莫莫，戴深褐與翡翠色尖長巫師帽，身穿落葉綠色斗篷，手持頂端鑲嵌發光綠晶球的木法杖，周圍飄散微生魔法光點，透明背景。"
  },
  {
    filename: "avatar_purple.png",
    category: "heroes",
    categoryName: "四大守護勇者",
    name: "莫莫 Momo（黑金魔法師）頭像",
    desc: "主畫面、對話框與對抗狀態頭像",
    spec: "PNG (透明背景) ｜ 建議 400×400",
    defaultPath: "assets/images/avatar_purple.png",
    promptEn: "Square profile avatar icon, close-up face portrait of young wizard boy Momo, Akira Toriyama style, warm smiling expression, bright dark eyes, brown wizard hat, green cape collar, glowing magical sparkles, clean line art, transparent background, RPG dialogue face icon --ar 1:1",
    promptZh: "黑金魔法師少年莫莫頭像特寫，溫暖開朗微笑，戴尖頂巫師帽，身著綠色斗篷，透明背景。"
  },
  {
    filename: "hero_sprite_round.png",
    category: "heroes",
    categoryName: "四大守護勇者",
    name: "寇寇 Koko（堆肥小勇士）立繪",
    desc: "戰鬥舞台寇寇全身防禦戰鬥姿態立繪（翻堆通氣與重裝園藝）",
    spec: "PNG (透明背景) ｜ 建議 800×1000",
    defaultPath: "assets/images/hero_sprite_round.png",
    promptEn: "Full-body anime character sprite, courageous garden warrior boy named Koko, Akira Toriyama style, cobalt blue gardening armor overalls, warrior helmet with cute green sprout crest, holding a golden garden trowel shovel in one hand and a sturdy aeration wooden shield in the other, brave hearty grin, earthy aura, clean isolated transparent background, 2D RPG game asset --ar 3:4",
    promptZh: "鳥山明風格勇敢園藝堆肥小勇士寇寇，戴萌芽頭盔，身穿鈷藍色工作輕甲，手持金色園藝鏟與堅固通氣木盾，豪爽自信微笑，透明背景。"
  },
  {
    filename: "avatar_round.png",
    category: "heroes",
    categoryName: "四大守護勇者",
    name: "寇寇 Koko（堆肥小勇士）頭像",
    desc: "寇寇主畫面選角與對話框頭像",
    spec: "PNG (透明背景) ｜ 建議 400×400",
    defaultPath: "assets/images/avatar_round.png",
    promptEn: "Square profile avatar icon, close-up portrait of cheerful garden warrior boy Koko, Akira Toriyama style, warrior helmet with tiny green sprout on top, beaming enthusiastic smile, bright blue collar, transparent background, RPG dialogue icon --ar 1:1",
    promptZh: "堆肥小勇士寇寇頭像特寫，戴綠芽頭盔，朝氣蓬勃的燦爛笑容，透明背景。"
  },
  {
    filename: "hero_sprite_syl.png",
    category: "heroes",
    categoryName: "四大守護勇者",
    name: "露露 Lulu（分類精靈）立繪",
    desc: "戰鬥舞台露露精靈疾速突刺立繪（源頭分類與挑出異物）",
    spec: "PNG (透明背景) ｜ 建議 800×1000",
    defaultPath: "assets/images/hero_sprite_syl.png",
    promptEn: "Full-body anime character sprite, adorable nature fairy girl named Lulu, Akira Toriyama style, twin yellow hair buns, glowing translucent fairy wings, bright amber and emerald dress, holding dual twin-leaf daggers and a filtering sieve shield, sparkling clean aura, dynamic floating battle pose, clean transparent background, 2D game asset --ar 3:4",
    promptZh: "鳥山明風格靈巧可愛分類精靈露露，包包頭髮型，晶瑩精靈翅膀，身穿亮黃綠色精靈裙，手持雙葉敏捷短刃與瀝乾濾網盾牌，透明背景。"
  },
  {
    filename: "avatar_syl.png",
    category: "heroes",
    categoryName: "四大守護勇者",
    name: "露露 Lulu（分類精靈）頭像",
    desc: "露露主畫面選角與對話框頭像",
    spec: "PNG (透明背景) ｜ 建議 400×400",
    defaultPath: "assets/images/avatar_syl.png",
    promptEn: "Square profile avatar icon, close-up face portrait of cute fairy girl Lulu, Akira Toriyama style, bright turquoise eyes, mischievous sweet smile, twin amber hair buns, golden glow, transparent background, 2D RPG icon --ar 1:1",
    promptZh: "分類精靈露露頭像特寫，琥珀色包包頭，明亮清澈的藍綠眼眸與俏皮笑容，透明背景。"
  },
  {
    filename: "hero_sprite_mul.png",
    category: "heroes",
    categoryName: "四大守護勇者",
    name: "嘟嘟 Dudu（熟食巡守俠）立繪",
    desc: "戰鬥舞台嘟嘟大胃俠突進立繪（熟廚餘循環巡守）",
    spec: "PNG (透明背景) ｜ 建議 800×1000",
    defaultPath: "assets/images/hero_sprite_mul.png",
    promptEn: "Full-body anime character sprite, cheerful anthropomorphic piggy chef hero named Dudu, Akira Toriyama style like Oolong, wearing red adventurer chef bandanna and apron, holding a giant wooden serving ladle and wearing a bubbling stew pot shield, hearty wide grin, vibrant warm colors, clean isolated transparent background, 2D RPG game sprite --ar 3:4",
    promptZh: "鳥山明烏龍風格可愛小豬大胃廚師英雄嘟嘟，頭戴紅頭巾圍著圍裙，手持巨型木勺，充滿食慾與活力，透明背景。"
  },
  {
    filename: "avatar_mul.png",
    category: "heroes",
    categoryName: "四大守護勇者",
    name: "嘟嘟 Dudu（熟食巡守俠）頭像",
    desc: "嘟嘟主畫面選角與對話框頭像",
    spec: "PNG (透明背景) ｜ 建議 400×400",
    defaultPath: "assets/images/avatar_mul.png",
    promptEn: "Square profile avatar icon, close-up portrait of jolly piggy chef hero Dudu, Akira Toriyama style, cute pink piggy snout, joyful laughing eyes, red chef bandanna, transparent background, 2D RPG portrait --ar 1:1",
    promptZh: "熟食巡守小豬嘟嘟頭像特寫，粉紅小豬鼻，大笑的歡樂表情，戴紅廚師頭巾，透明背景。"
  },

  // --- 五大關卡試煉魔王 (5張立繪) ---
  {
    filename: "slime_sprite.png",
    category: "bosses",
    categoryName: "五大關卡試煉魔王",
    name: "第 1 關關主「浪費剩食怪」立繪",
    desc: "第一章學院惜食大廳守護魔王戰鬥立繪",
    spec: "PNG (透明背景) ｜ 建議 800×900",
    defaultPath: "assets/images/slime_sprite.png",
    promptEn: "Comical food waste slime boss monster, Akira Toriyama Dragon Quest monster style, wobbly giant yellow-brown gelatinous soup blob, wearing a food bowl on head, mouth full of half-eaten noodles and spilled gravy, arms made of floating soup ladles, goofy greedy face, splash particles around, clean isolated transparent background, 2D RPG boss sprite --ar 1:1",
    promptZh: "鳥山明風格滑稽剩食史萊姆巨魔，由油湯飯菜凝聚的黏稠果凍怪獸，頭頂打翻的湯碗，嘴邊掛著麵條與湯汁，滑稽貪吃，透明背景。"
  },
  {
    filename: "mirage_sprite.png",
    category: "bosses",
    categoryName: "五大關卡試煉魔王",
    name: "第 2 關關主「混雜垃圾魔」立繪",
    desc: "第二章中央分類迴廊守護魔王戰鬥立繪",
    spec: "PNG (透明背景) ｜ 建議 800×900",
    defaultPath: "assets/images/mirage_sprite.png",
    promptEn: "Trash confusion beast boss monster, Akira Toriyama scrap monster style, chaotic creature made of crumpled plastic bags, discarded disposable chopsticks, tangled rubber bands, and soda cans, glowing angry red optical eyes, thrashing clawed limbs of wire and plastic, battle stance, clean isolated transparent background, 2D RPG boss sprite --ar 1:1",
    promptZh: "鳥山明風格混雜垃圾怪獸，由塑膠袋、免洗筷、橡皮筋與飲料罐纏繞而成的雜物狂魔，憤怒紅色眼睛，張牙舞爪，透明背景。"
  },
  {
    filename: "demon_sprite.png",
    category: "bosses",
    categoryName: "五大關卡試煉魔王",
    name: "第 3 關關主「惡臭果蠅王」立繪",
    desc: "第三章黑金發酵溫室守護魔王戰鬥立繪",
    spec: "PNG (透明背景) ｜ 建議 800×900",
    defaultPath: "assets/images/demon_sprite.png",
    promptEn: "Giant pest fruit fly king boss monster, Akira Toriyama insect monster style, plump winged fly with purple-black fuzzy body, huge ruby-red multifaceted compound eyes, wearing a rotten fruit peel crown, buzzing transparent wings creating stinky green wavy odor waves, comical menacing posture, clean transparent background, 2D RPG boss sprite --ar 1:1",
    promptZh: "鳥山明怪獸風格果蠅魔王，毛茸茸紫黑巨型蒼蠅，戴著爛果皮王冠，巨大紅複眼，震動翅膀釋放綠色臭味波紋，透明背景。"
  },
  {
    filename: "frost_sprite.png",
    category: "bosses",
    categoryName: "五大關卡試煉魔王",
    name: "第 4 關關主「板結枯土巨魔」立繪",
    desc: "第四章陽光有機菜園守護魔王戰鬥立繪",
    spec: "PNG (透明背景) ｜ 建議 800×900",
    defaultPath: "assets/images/frost_sprite.png",
    promptEn: "Dry compacted clay golem boss monster, Akira Toriyama stone monster style, massive bulky earth golem with parched cracked dry grey-brown mudstone body, withered plant roots trapped and suffocating across its stone chest, glowing amber eyes, raising heavy rocky fist, dust falling, clean isolated transparent background, 2D RPG boss sprite --ar 1:1",
    promptZh: "鳥山明岩石魔像風格板結枯土巨魔，身軀由乾裂灰褐硬泥塊構成，胸前纏繞枯竭樹根，眼冒琥珀紅光，揮動沉重石拳，透明背景。"
  },
  {
    filename: "boss_sprite.png",
    category: "bosses",
    categoryName: "五大關卡試煉魔王",
    name: "第 5 關終極關主「失衡異變巨神」立繪",
    desc: "第五章永續生命神殿終極守護魔王立繪",
    spec: "PNG (透明背景) ｜ 建議 900×1000",
    defaultPath: "assets/images/boss_sprite.png",
    promptEn: "Colossal final boss deity of ecological imbalance, Akira Toriyama grand villain design, imposing biomechanical titan, left half made of withered dead sacred tree trunks and burning furnace smokestacks with dark ash smoke, right half glowing with toxic purple smog core and rusted industrial scrap gears, towering majestic posture, clean isolated transparent background, 2D RPG final boss sprite --ar 1:1",
    promptZh: "鳥山明風格終極環境失衡邪神，半身枯死神木與燃燒黑煙囪，半身紫霧金屬異變齒輪，浩瀚威嚴壓迫感，透明背景。"
  },

  // --- 五大關卡戰鬥背景 (5張場景) ---
  {
    filename: "forest_bg.jpg",
    category: "backgrounds",
    categoryName: "五大關卡戰鬥背景",
    name: "第 1 關背景：學院惜食大廳",
    desc: "第一章惜食大廳餐桌試煉戰鬥背景場景",
    spec: "JPG (16:9 寬螢幕) ｜ 建議 1920×1080",
    defaultPath: "assets/images/forest_bg.jpg",
    promptEn: "Scenic JRPG battle stage background, grand wooden dining banquet hall of magic academy, warm golden lanterns hanging from vaulted wooden beams, long dining tables with healthy colorful food, students tableware banners on stone walls, Akira Toriyama anime interior style, warm lighting, 16:9 landscape wallpaper --ar 16:9",
    promptZh: "魔法生態學院宏偉木造惜食大廳，暖黃吊燈照耀拱形木樑，餐桌排列整齊，充滿溫馨活力的宴會廳，16:9 鳥山明室內風格。"
  },
  {
    filename: "desert_bg.jpg",
    category: "backgrounds",
    categoryName: "五大關卡戰鬥背景",
    name: "第 2 關背景：中央分類迴廊",
    desc: "第二章生熟廚餘與回收分類站戰鬥背景場景",
    spec: "JPG (16:9 寬螢幕) ｜ 建議 1920×1080",
    defaultPath: "assets/images/desert_bg.jpg",
    promptEn: "Scenic JRPG battle stage background, modern eco-friendly waste sorting corridor station, colorful sorting bins for raw food waste, cooked pig feed, and recyclables, bright skylight roof filtering sunshine, educational green leaf murals on walls, Akira Toriyama adventure background, 16:9 --ar 16:9",
    promptZh: "現代綠色環保中央分類迴廊，彩色分類桶（生廚餘、熟廚餘、資源回收），天窗灑落陽光，牆面繪有綠葉壁畫，16:9。"
  },
  {
    filename: "river_bg.jpg",
    category: "backgrounds",
    categoryName: "五大關卡戰鬥背景",
    name: "第 3 關背景：黑金發酵溫室",
    desc: "第三章黑金堆肥箱與通氣發酵工藝背景場景",
    spec: "JPG (16:9 寬螢幕) ｜ 建議 1920×1080",
    defaultPath: "assets/images/river_bg.jpg",
    promptEn: "Scenic JRPG battle stage background, sunny wooden composting greenhouse, wooden fermentation boxes filled with rich dark organic compost, golden sunlight beams shining through glass roof, gentle steam rising from active compost pile, tools hanging neatly, Akira Toriyama landscape, 16:9 --ar 16:9",
    promptZh: "陽光充沛的木質堆肥溫室，木箱盛滿黑褐有機腐植土，陽光透過玻璃天窗灑下，堆肥升起溫暖蒸氣，16:9。"
  },
  {
    filename: "highway_bg.jpg",
    category: "backgrounds",
    categoryName: "五大關卡戰鬥背景",
    name: "第 4 關背景：陽光有機菜園",
    desc: "第四章校園菜園黑金土壤回饋大地場景",
    spec: "JPG (16:9 寬螢幕) ｜ 建議 1920×1080",
    defaultPath: "assets/images/highway_bg.jpg",
    promptEn: "Scenic JRPG battle stage background, vibrant school organic vegetable garden under brilliant blue sky, raised wooden garden beds filled with dark fertile compost soil, flourishing green lettuce and sunflowers, gentle distant green hills, Akira Toriyama anime farm style, 16:9 --ar 16:9",
    promptZh: "陽光明媚的校園有機菜園，藍天下排列整齊的黑沃土壤花壇，生機盎然的蔬菜與向日葵，遠山蒼翠，16:9。"
  },
  {
    filename: "sacred_bg.jpg",
    category: "backgrounds",
    categoryName: "五大關卡戰鬥背景",
    name: "第 5 關背景：永續生命神殿",
    desc: "第五章永續食物循環生命之樹聖境背景場景",
    spec: "JPG (16:9 寬螢幕) ｜ 建議 1920×1080",
    defaultPath: "assets/images/sacred_bg.jpg",
    promptEn: "Scenic JRPG battle stage background, mystical sacred World Tree of ecological circulation, colossal ancient tree rooted in glowing rich black soil, crown touching starry auroras, floating golden pollen and green energy rings forming eternal cycle symbol, dreamlike peaceful paradise, Akira Toriyama magical forest style, 16:9 --ar 16:9",
    promptZh: "永續生態循環世界之樹神殿，根植於發光黑沃土的參天巨木，星光晨曦與金色光環環繞，象徵永恆食物循環之環，16:9。"
  },

  // --- 遊戲全域場景 (2張底圖) ---
  {
    filename: "title_bg.jpg",
    category: "system",
    categoryName: "遊戲全域場景",
    name: "冒險啟程主畫面背景",
    desc: "遊戲主登入、學生簽到與選角畫面全螢幕背景",
    spec: "JPG (16:9 寬螢幕) ｜ 建議 1920×1080",
    defaultPath: "assets/images/title_bg.jpg",
    promptEn: "Anime JRPG title screen background art, panoramic view of magical eco-academy campus surrounded by rolling emerald hills and lush vegetable gardens, floating leaves and golden sparkles drifting across dawn sky, Akira Toriyama anime opening cinematic style, hopeful adventure atmosphere, 16:9 --ar 16:9",
    promptZh: "遊戲主畫面背景，鳥瞰溪洲魔法生態學院美麗校園與金色田園，晨光初照，飛舞的綠葉與金色光芒，冒險啟程序幕，16:9。"
  },
  {
    filename: "world_map.jpg",
    category: "system",
    categoryName: "遊戲全域場景",
    name: "永續食物循環世界地圖",
    desc: "世界大地圖探索與關卡導航地圖底圖",
    spec: "JPG (16:9 寬螢幕) ｜ 建議 1920×1080",
    defaultPath: "assets/images/world_map.jpg",
    promptEn: "Fantasy illustrated RPG overworld map of magical eco-campus, antique parchment textured map showing banquet hall, sorting station, greenhouse, organic farm, and sacred tree connected by glowing golden circular trail, Dragon Quest overworld map aesthetic, charming details, 16:9 --ar 16:9",
    promptZh: "復古羊皮紙奇幻世界大地圖，標繪惜食大廳、分類站、發酵溫室、有機菜園與神殿之金色環形循環航線，勇者鬥惡龍大地圖風格，16:9。"
  }
];
