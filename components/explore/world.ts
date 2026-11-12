export const WORLD = { width: 2300, height: 1650 };
export const XEO_QUYT_RIVER = { outer: {left:100,top:620,right:560,bottom:1050}, island: {left:150,top:690,right:480,bottom:990}, eastDock:{x:592,y:815}, westDock:{x:440,y:815}, eastBoatX:552, westBoatX:488 };
export function isRiver(x:number,y:number){
  const {outer,island}=XEO_QUYT_RIVER;
  return x>=outer.left&&x<=outer.right&&y>=outer.top&&y<=outer.bottom&&!(x>=island.left&&x<=island.right&&y>=island.top&&y<=island.bottom);
}
export const HOMES = [
  {x:965,y:155,style:0},{x:1280,y:155,style:1},{x:1510,y:505,style:2},
  {x:955,y:575,style:1},{x:1280,y:590,style:0},{x:1530,y:695,style:1},
  {x:620,y:1170,style:2},{x:1330,y:1490,style:0},{x:1900,y:1320,style:2},
] as const;
export function isHouse(x:number,y:number){return HOMES.some(home=>Math.abs(x-home.x)<48&&y>home.y-50&&y<home.y+24);}

export type Stop = {
  id: string;
  name: string;
  short: string;
  category: string;
  x: number;
  y: number;
  kind: "temple" | "market" | "forest" | "lotus" | "mango" | "memorial";
  color: string;
  summary: string;
  story: string;
  prompt: string;
  image: string;
  href: string;
  photoGroup: string;
};

export const STOPS: Stop[] = [
  { id: "sinh-sac", name: "Khu di tích Nguyễn Sinh Sắc", short: "Khu di tích", category: "Di sản", x: 780, y: 300, kind: "memorial", color: "#d98663", summary: "Không gian tưởng niệm giữa khuôn viên xanh và những hình tượng sen.", story: "Nơi yên nghỉ của cụ Phó bảng Nguyễn Sinh Sắc. Hãy ghé khu mộ, xem trưng bày và tìm hiểu dấu ấn của cụ tại Cao Lãnh.", prompt: "Một cánh sen mở lối đến câu chuyện lịch sử.", image: "/photos/nguyen-sinh-sac-c29aea76-thumb.webp", href: "/map", photoGroup: "nguyen-sinh-sac" },
  { id: "do-cong-tuong", name: "Miếu thờ ông bà Đỗ Công Tường", short: "Miếu ông bà Chủ chợ", category: "Di sản", x: 1150, y: 335, kind: "temple", color: "#e4a45f", summary: "Câu chuyện về ông bà Chủ chợ và những ngày đầu hình thành Cao Lãnh.", story: "Ông bà Đỗ Công Tường gắn với ký ức hình thành chợ Cao Lãnh. Ngôi miếu lưu giữ lòng biết ơn dành cho người có công với vùng đất.", prompt: "Tiếng chuông đưa bạn về thuở chợ xưa.", image: "/photos/do-cong-tuong-28b27b87-thumb.webp", href: "/map", photoGroup: "do-cong-tuong" },
  { id: "gao-giong", name: "Khu du lịch sinh thái Gáo Giồng", short: "Rừng Gáo Giồng", category: "Thiên nhiên", x: 370, y: 260, kind: "forest", color: "#7caa76", summary: "Rừng tràm, kênh rạch và tiếng chim nước giữa Đồng Tháp Mười.", story: "Lên xuồng ba lá, len qua lối nước và ngắm chim trong rừng tràm. Gáo Giồng là một lát cắt xanh mát của vùng đất ngập nước.", prompt: "Một chiếc xuồng đang chờ dưới bóng tràm.", image: "/photos/gao-giong-93773162-thumb.webp", href: "/map", photoGroup: "gao-giong" },
  { id: "xeo-quyt", name: "Khu di tích Xẻo Quýt", short: "Rừng Xẻo Quýt", category: "Thiên nhiên · lịch sử", x: 350, y: 790, kind: "forest", color: "#6f9d85", summary: "Lối mòn rừng tràm dẫn đến những dấu tích căn cứ xưa.", story: "Xẻo Quýt từng là căn cứ của Tỉnh ủy Kiến Phong giai đoạn 1960–1975. Đường mòn và lạch nước nhỏ dẫn qua các hầm, lán được bảo tồn, phục dựng.", prompt: "Đi chậm một chút, khu rừng có chuyện để kể.", image: "/photos/xeo-quyt-89f22a8d-thumb.webp", href: "/map", photoGroup: "xeo-quyt" },
  { id: "cho-que", name: "Chợ quê cù lao Tân Thuận Đông", short: "Chợ quê cù lao", category: "Văn hóa", x: 1080, y: 805, kind: "market", color: "#e2a75c", summary: "Bánh dân gian, trái cây theo mùa và nhịp chợ ven sông Tiền.", story: "Chợ quê trên cù lao giới thiệu nông sản, món ăn truyền thống và sinh hoạt địa phương. Hãy thử một món bánh, nghe một khúc đờn ca tài tử nếu có chương trình.", prompt: "Mùi bánh mới kéo bạn tới gian hàng mái lá.", image: "/photos/cho-que-278c4110-thumb.webp", href: "/map", photoGroup: "cho-que" },
  { id: "vuon-xoai", name: "Vườn xoài Cao Lãnh", short: "Vườn xoài", category: "Nhà vườn", x: 745, y: 860, kind: "mango", color: "#d8aa4b", summary: "Gặp người làm vườn và tìm hiểu trái xoài Cát Chu theo mùa.", story: "Cao Lãnh nổi tiếng với những vườn xoài. Dạo dưới tán cây, nghe chuyện chăm trái và thưởng thức hương vị địa phương khi đúng mùa.", prompt: "Trái xoài chín vàng là phần thưởng cuối đường.", image: "/photos/vuon-xoai-f5d7675e-thumb.webp", href: "/map", photoGroup: "vuon-xoai" },
  { id: "my-phuoc-thanh", name: "Khu du lịch sinh thái Mỹ Phước Thành", short: "Đồng sen Mỹ Phước", category: "Sinh thái", x: 1740, y: 330, kind: "lotus", color: "#83ab8e", summary: "Một khoảng đồng sen và cảnh quê để dạo chơi, ngắm cảnh.", story: "Mỹ Phước Thành mang đến không gian đồng sen và cảnh quan đồng quê gần Cao Lãnh. Đi chậm qua lối ven nước và quan sát những sắc màu của miền Tây.", prompt: "Mặt nước lấp lánh dưới những cánh sen.", image: "/photos/my-phuoc-thanh-82eca7aa-thumb.webp", href: "/map", photoGroup: "my-phuoc-thanh" },
  { id: "tap-ket", name: "Di tích Địa điểm tập kết ra Bắc năm 1954", short: "Bến tập kết 1954", category: "Di sản", x: 1810, y: 1000, kind: "memorial", color: "#bc8a70", summary: "Không gian tưởng niệm bên sông Tiền.", story: "Di tích gợi lại sự kiện tập kết ra Bắc năm 1954 tại Cao Lãnh. Bến sông, tượng đài và khuôn viên cùng kể một câu chuyện lịch sử.", prompt: "Dừng bên sông để nhớ một chuyến đi xa.", image: "/photos/tap-ket-bd294019-thumb.webp", href: "/map", photoGroup: "tap-ket" },
];

export const INTERIOR = { width: 960, height: 690, entry: { x: 480, y: 540 }, exit: { x: 480, y: 649 } };
export type PhotoSpot = { x: number; y: number; label: string; note: string; photoIndex: number };
export const PHOTO_SPOTS: Record<string, PhotoSpot[]> = {
  "sinh-sac": [
    {x:235,y:250,label:"Khuôn viên xanh",note:"Dạo qua không gian tưởng niệm và những lối đi rợp bóng cây.",photoIndex:0},
    {x:480,y:190,label:"Tượng tưởng niệm",note:"Một điểm dừng để tìm hiểu câu chuyện về cụ Nguyễn Sinh Sắc.",photoIndex:2},
    {x:730,y:250,label:"Dấu ấn di tích",note:"Ngắm thêm một góc của khu di tích qua ảnh chụp tại điểm đến.",photoIndex:4},
  ],
  "do-cong-tuong": [
    {x:235,y:250,label:"Mái miếu xưa",note:"Kiến trúc miếu thờ gợi nhắc ký ức về ông bà Chủ chợ.",photoIndex:0},
    {x:480,y:190,label:"Không gian thờ tự",note:"Ghé lại nơi người dân tưởng nhớ ông bà Đỗ Công Tường.",photoIndex:4},
    {x:730,y:250,label:"Góc sân miếu",note:"Quan sát thêm những chi tiết ở di tích qua ảnh thật.",photoIndex:2},
  ],
  "gao-giong": [
    {x:235,y:250,label:"Lối rừng tràm",note:"Bóng cây và lối nước tạo nên nhịp điệu rất riêng của Gáo Giồng.",photoIndex:0},
    {x:480,y:190,label:"Miền sông nước",note:"Hình ảnh ghi lại cảnh quan đất ngập nước trong khu sinh thái.",photoIndex:2},
    {x:730,y:250,label:"Góc ngắm thiên nhiên",note:"Dừng lại, nhìn thêm một khung cảnh xanh của vùng rừng.",photoIndex:4},
  ],
  "xeo-quyt": [
    {x:235,y:250,label:"Cổng vào rừng",note:"Bước qua cổng, lối mòn dẫn bạn vào câu chuyện căn cứ xưa.",photoIndex:1},
    {x:480,y:190,label:"Đường mòn lịch sử",note:"Dọc các lối đi là cảnh quan rừng tràm và những dấu tích được gìn giữ.",photoIndex:0},
    {x:730,y:250,label:"Lạch nước nhỏ",note:"Một góc Xẻo Quýt qua ảnh chụp tại khu di tích.",photoIndex:3},
  ],
  "cho-que": [
    {x:235,y:250,label:"Mái lá ven sông",note:"Gặp nhịp chợ quê giữa những gian hàng mộc mạc.",photoIndex:1},
    {x:480,y:190,label:"Sắc màu chợ",note:"Những chi tiết đời thường làm nên không khí chợ Tân Thuận Đông.",photoIndex:2},
    {x:730,y:250,label:"Gian hàng quê",note:"Ảnh chụp tại chợ đưa bạn đến gần hơn với không gian nơi đây.",photoIndex:0},
  ],
  "vuon-xoai": [
    {x:235,y:250,label:"Mùa thu hoạch",note:"Những giỏ xoài và nhịp làm việc trong vườn.",photoIndex:0},
    {x:480,y:190,label:"Gặp người làm vườn",note:"Lắng nghe câu chuyện chăm sóc trái xoài Cao Lãnh.",photoIndex:1},
    {x:730,y:250,label:"Dưới tán xoài",note:"Nhìn vườn xoài qua góc máy gần gũi với người trồng.",photoIndex:7},
  ],
  "my-phuoc-thanh": [
    {x:235,y:250,label:"Lối qua đồng sen",note:"Dạo qua cảnh quan đồng quê ở Mỹ Phước Thành.",photoIndex:0},
    {x:480,y:190,label:"Sắc sen miền Tây",note:"Nhìn gần hơn mặt nước và những mảng xanh.",photoIndex:1},
    {x:730,y:250,label:"Góc nghỉ chân",note:"Một góc tham quan qua ảnh chụp tại điểm đến.",photoIndex:3},
  ],
  "tap-ket": [
    {x:235,y:250,label:"Bến sông lịch sử",note:"Không gian ven sông gắn với câu chuyện năm 1954.",photoIndex:0},
    {x:480,y:190,label:"Tượng đài",note:"Quan sát hình tượng tưởng niệm tại di tích.",photoIndex:2},
    {x:730,y:250,label:"Khuôn viên di tích",note:"Nhìn thêm một góc của khu di tích qua ảnh thật.",photoIndex:4},
  ],
};

export type Worker = { x: number; y: number; name: string; role: string; lines: string[]; sprite: "farmer" | "vendor" | "rower" | "guide" | "gardener" | "caretaker" };
export const WORKERS: Record<string, Worker[]> = {
  "sinh-sac": [
    {x:310,y:455,name:"Cô làm vườn",role:"Chăm hồ sen",sprite:"gardener",lines:["Sáng nào cô cũng chăm những khóm sen quanh lối đi.","Đi chậm một chút để cảm nhận không gian tưởng niệm nhé."]},
    {x:700,y:470,name:"Chú hướng dẫn",role:"Kể chuyện di tích",sprite:"guide",lines:["Đây là nơi yên nghỉ của cụ Phó bảng Nguyễn Sinh Sắc.","Bạn có thể xem thêm ảnh thật ở ba khung trưng bày phía trên."]},
  ],
  "do-cong-tuong": [
    {x:300,y:450,name:"Bác trông miếu",role:"Quét sân",sprite:"caretaker",lines:["Ông bà Đỗ Công Tường được người dân nhớ đến như ông bà Chủ chợ.","Sân miếu hôm nay rất yên bình, cháu ngắm kiến trúc một vòng nhé."]},
    {x:710,y:450,name:"Cô hướng dẫn",role:"Giới thiệu câu chuyện",sprite:"guide",lines:["Ngôi miếu giữ lại ký ức về buổi đầu hình thành chợ Cao Lãnh.","Ba bức ảnh phía trước sẽ cho cháu thấy không gian thật."]},
  ],
  "gao-giong": [
    {x:310,y:460,name:"Chú lái xuồng",role:"Chuẩn bị xuồng",sprite:"rower",lines:["Kênh rạch len qua rừng tràm, đi xuồng mới thấy hết vẻ đẹp nơi này.","Nhớ nhìn mặt nước, cá đang bơi quanh cầu gỗ đấy."]},
    {x:730,y:450,name:"Cô bảo tồn",role:"Quan sát chim",sprite:"guide",lines:["Gáo Giồng là nơi chim nước cư trú giữa rừng tràm.","Mình giữ yên lặng một chút để nghe tiếng chim nhé."]},
  ],
  "xeo-quyt": [
    {x:300,y:450,name:"Chú chèo xuồng",role:"Đưa khách qua lạch",sprite:"rower",lines:["Lạch nước nhỏ đưa mình len sâu vào khu rừng.","Xẻo Quýt từng là căn cứ của Tỉnh ủy Kiến Phong trong giai đoạn 1960–1975."]},
    {x:730,y:450,name:"Cô thuyết minh",role:"Kể chuyện lịch sử",sprite:"guide",lines:["Các đường mòn dẫn đến những dấu tích được bảo tồn, phục dựng.","Hãy ghé các khung ảnh để thấy khu rừng ngoài đời."]},
  ],
  "cho-que": [
    {x:300,y:455,name:"Dì bán bánh",role:"Gói bánh dân gian",sprite:"vendor",lines:["Chợ quê có bánh dân gian, nông sản và những cuộc gặp ven sông.","Lại bàn bên kia thử phụ dì gói bánh nhé!"]},
    {x:710,y:455,name:"Chú nhà vườn",role:"Xếp trái cây",sprite:"farmer",lines:["Trái cây đến từ vườn theo mùa, mỗi hôm chợ lại có hương vị khác.","Cháu ghé xem ảnh thật của gian hàng mái lá nhé."]},
  ],
  "vuon-xoai": [
    {x:300,y:455,name:"Chú làm vườn",role:"Chăm cây xoài",sprite:"farmer",lines:["Xoài Cát Chu cần được chăm theo từng mùa vụ.","Đến gần giỏ và thử hái vài trái chín nhé!"]},
    {x:710,y:455,name:"Cô thu hoạch",role:"Xếp xoài vào giỏ",sprite:"gardener",lines:["Những giỏ xoài vừa hái sẽ được lựa và sắp thật cẩn thận.","Còn nhiều câu chuyện nhà vườn trong các bức ảnh phía trước."]},
  ],
  "my-phuoc-thanh": [
    {x:300,y:450,name:"Cô trông sen",role:"Chăm đồng sen",sprite:"gardener",lines:["Sen ở đây thay màu theo ánh nắng trong ngày.","Cháu thử ghé bờ nước ngắm những bông đang nở nhé."]},
    {x:710,y:450,name:"Chú hướng dẫn",role:"Dẫn lối tham quan",sprite:"guide",lines:["Đi theo lối nhỏ sẽ thấy nhiều góc nhìn của đồng sen.","Ba khung ảnh phía trước là cảnh thật ở Mỹ Phước Thành."]},
  ],
  "tap-ket": [
    {x:300,y:450,name:"Bác kể chuyện",role:"Kể lịch sử",sprite:"guide",lines:["Bến sông này gợi nhớ cuộc tập kết ra Bắc năm 1954.","Mình dừng một chút trước tượng đài để tưởng niệm nhé."]},
    {x:710,y:450,name:"Cô chăm vườn",role:"Chăm khuôn viên",sprite:"gardener",lines:["Hoa được chăm quanh khuôn viên tưởng niệm.","Các bức ảnh sẽ cho cháu thấy không gian ngoài đời."]},
  ],
};

export type Activity = { x:number;y:number; name:string; action:string; done:string; icon:"incense"|"flowers"|"fish"|"boat"|"cake"|"mango"|"lotus"; goal?:number };
export const ACTIVITIES: Partial<Record<string, Activity>> = {
  "sinh-sac": {x:480,y:355,name:"Thắp nhang cho cụ",action:"Thắp một nén nhang",done:"Bạn đã thắp nhang tưởng niệm cụ Nguyễn Sinh Sắc.",icon:"incense",goal:1},
  "do-cong-tuong": {x:480,y:420,name:"Xếp hoa sân miếu",action:"Xếp thêm một chậu hoa",done:"Sân miếu đã thêm sắc hoa!",icon:"flowers"},
  "gao-giong": {x:480,y:420,name:"Cho cá ăn",action:"Rải một ít thức ăn",done:"Đàn cá đã bơi lại gần!",icon:"fish"},
  "xeo-quyt": {x:480,y:420,name:"Chèo xuồng qua lạch",action:"Chèo thêm một nhịp",done:"Xuồng đã qua lạch nước!",icon:"boat"},
  "cho-que": {x:480,y:420,name:"Gói bánh quê",action:"Gói thêm một chiếc bánh",done:"Mẻ bánh đã sẵn sàng!",icon:"cake"},
  "vuon-xoai": {x:480,y:420,name:"Hái xoài chín",action:"Mở cây xoài để hái",done:"Giỏ xoài đã đầy rồi!",icon:"mango"},
  "my-phuoc-thanh": {x:480,y:420,name:"Ngắm sen nở",action:"Khám phá thêm một bông sen",done:"Bạn đã ngắm đủ ba sắc sen!",icon:"lotus"},
  "tap-ket": {x:480,y:355,name:"Dâng hoa tưởng niệm",action:"Đặt thêm một nhành hoa",done:"Bó hoa tưởng niệm đã hoàn thành.",icon:"flowers"},
};

export type QuizQuestion = { question:string; options:[string,string,string,string]; answer:number; detail:string };
export type Quiz = { x:number;y:number; title:string; source:string; questions:[QuizQuestion,QuizQuestion,QuizQuestion] };
export const QUIZZES: Record<string, Quiz> = {
  "sinh-sac": {
    x:480,y:465,title:"Tìm hiểu cụ Nguyễn Sinh Sắc",
    source:"https://dulich.dongthap.gov.vn/vi/ditichnguyensinhsac/historyplace",
    questions:[
      {question:"Cụ Nguyễn Sinh Sắc là thân sinh của ai?",options:["Chủ tịch Hồ Chí Minh","Phan Bội Châu","Trương Định","Nguyễn Trung Trực"],answer:0,detail:"Cụ Nguyễn Sinh Sắc là thân sinh của Chủ tịch Hồ Chí Minh."},
      {question:"Cụ sống những năm cuối đời ở đâu tại Cao Lãnh?",options:["Tân Thuận Đông","Hòa An","Mỹ Long","Mỹ Hiệp"],answer:1,detail:"Cụ gắn bó với làng Hòa An trong những năm cuối đời."},
      {question:"Vòm mộ cụ được tạo hình gợi nhớ loài hoa nào?",options:["Hoa cúc","Hoa mai","Hoa sen","Hoa điên điển"],answer:2,detail:"Vòm mộ là một cánh sen cách điệu."},
    ],
  },
  "tap-ket": {
    x:480,y:465,title:"Tìm hiểu bến tập kết",
    source:"https://dongthap.gov.vn/web/svhttdldt/tin-tuc/chi-tiet?id=3956270",
    questions:[
      {question:"Sự kiện tập kết ra Bắc tại Cao Lãnh diễn ra năm nào?",options:["1945","1954","1960","1975"],answer:1,detail:"Di tích ghi dấu sự kiện tập kết ra Bắc năm 1954."},
      {question:"Cao Lãnh là khu vực tập kết chuyển quân trong bao lâu?",options:["30 ngày","60 ngày","100 ngày","Một năm"],answer:2,detail:"Đợt tập kết chuyển quân tại Cao Lãnh kéo dài 100 ngày."},
      {question:"Các chuyến tàu tại bến Cao Lãnh đưa đoàn người đi về hướng nào?",options:["Ra miền Bắc","Sang Campuchia","Về miền Tây","Ra biển Đông"],answer:0,detail:"Cán bộ, chiến sĩ và học sinh lên tàu tập kết ra miền Bắc."},
    ],
  },
};
