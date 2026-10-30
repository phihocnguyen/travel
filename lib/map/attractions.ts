export type AttractionCategory =
  | "Sinh thái"
  | "Di tích"
  | "Văn hoá"
  | "Biển đảo";

export type Attraction = {
  id: number;
  name: string;
  category: AttractionCategory;
  area: string;
  lon: number;
  lat: number;
  summary: string;
  description: string;
  highlights: string[];
  bestTime: string;
};

export const ATTRACTIONS: Attraction[] = [
  {
    id: 0,
    name: "Vườn quốc gia Tràm Chim",
    category: "Sinh thái",
    area: "Tam Nông",
    lon: 105.50011,
    lat: 10.72989,
    summary:
      "Vùng đất ngập nước rộng lớn, nơi rừng tràm, đồng cỏ năn và sếu đầu đỏ cùng tồn tại.",
    description:
      "Tràm Chim là một trong những khu bảo tồn đất ngập nước quan trọng nhất Đồng bằng sông Cửu Long. Mùa khô, mặt nước rút dần để lộ những cánh đồng năn, thu hút hàng trăm loài chim nước. Đây cũng là nơi hiếm hoi du khách có thể quan sát sếu đầu đỏ trong tự nhiên.",
    highlights: ["Sếu đầu đỏ", "Đầm sen", "Chòi quan sát chim"],
    bestTime: "Tháng 12 – tháng 4, mùa khô khi chim về nhiều",
  },
  {
    id: 1,
    name: "Rừng tràm Gáo Giồng",
    category: "Sinh thái",
    area: "Cao Lãnh",
    lon: 105.61012,
    lat: 10.58323,
    summary:
      "Cánh rừng tràm xanh mướt với hệ kênh rạch len lỏi, điểm đến quen thuộc của miền Tây.",
    description:
      "Gáo Giồng là khu du lịch sinh thái được ví như lá phổi xanh của Đồng Tháp. Du khách đi xuồng ba lá xuyên rừng tràm, nghe chim gọi bầy và thưởng thức cá lóc đồng nướng rơm. Những chòi nghỉ ven kênh là nơi lý tưởng để ngắm hoàng hôn.",
    highlights: ["Xuồng ba lá", "Chim nước", "Ẩm thực đồng quê"],
    bestTime: "Mùa nước nổi, tháng 8 – tháng 11",
  },
  {
    id: 2,
    name: "Khu di tích Gò Tháp",
    category: "Di tích",
    area: "Tháp Mười",
    lon: 105.82746,
    lat: 10.60654,
    summary:
      "Cụm di tích khảo cổ – tâm linh giữa vùng Đồng Tháp Mười, gắn với nền văn hoá Óc Eo.",
    description:
      "Gò Tháp là một quần thể di tích gồm tháp cổ, đền miếu và các di chỉ khảo cổ có niên đại hàng nghìn năm. Mỗi độ tháng 3 âm lịch, lễ hội Gò Tháp thu hút đông đảo người dân về dâng hương. Xung quanh là đồng sen và vùng đất phèn đặc trưng của Tháp Mười.",
    highlights: ["Tháp cổ", "Lễ hội Gò Tháp", "Đồng sen"],
    bestTime: "Tháng 3 âm lịch, mùa lễ hội",
  },
  {
    id: 3,
    name: "Lăng cụ Phó bảng Nguyễn Sinh Sắc",
    category: "Di tích",
    area: "Cao Lãnh",
    lon: 105.63166,
    lat: 10.4472,
    summary:
      "Khu di tích tưởng niệm thân sinh Chủ tịch Hồ Chí Minh, giữa một khuôn viên rợp bóng cây.",
    description:
      "Khu di tích gồm phần mộ cụ Nguyễn Sinh Sắc, nhà trưng bày và không gian tưởng niệm được quy hoạch trang nghiêm. Đây là điểm đến văn hoá – lịch sử quan trọng của Đồng Tháp, thường được kết hợp tham quan cùng chùa và Bảo tàng Đồng Tháp gần đó.",
    highlights: ["Phần mộ cụ Phó bảng", "Nhà trưng bày", "Không gian tưởng niệm"],
    bestTime: "Quanh năm, trang phục lịch sự",
  },
  {
    id: 4,
    name: "Nhà cổ Huỳnh Thuỷ Lê",
    category: "Văn hoá",
    area: "Sa Đéc",
    lon: 105.7683,
    lat: 10.29392,
    summary:
      "Ngôi nhà cổ hơn trăm tuổi pha trộn kiến trúc Pháp – Hoa, gắn với câu chuyện tình Marguerite Duras.",
    description:
      "Toạ lạc bên bờ sông Sa Đéc, ngôi nhà được xây dựng đầu thế kỷ 20 với vật liệu gỗ quý và hoa văn chạm khắc tinh xảo. Nơi đây từng là bối cảnh cho tiểu thuyết 'Người tình' của Marguerite Duras. Gần nhà cổ là chùa Kiến An Cung, một di tích kiến trúc tiêu biểu của Sa Đéc.",
    highlights: ["Kiến trúc Pháp – Hoa", "Chuyện tình Duras", "Chùa Kiến An Cung"],
    bestTime: "Quanh năm, buổi sáng ít khách",
  },
  {
    id: 5,
    name: "Làng hoa Sa Đéc",
    category: "Văn hoá",
    area: "Sa Đéc",
    lon: 105.74972,
    lat: 10.31538,
    summary:
      "Vựa hoa lớn nhất miền Tây, rực rỡ nhất vào những tuần trước Tết Nguyên đán.",
    description:
      "Làng hoa Tân Quy Đông nằm ven sông Tiền, nơi hàng trăm hộ trồng hoa cung cấp cho khắp Nam Bộ. Du khách có thể đi bộ hoặc xe đạp men theo các luống hoa, ghé vườn kiểng và cầu Hòa Khánh. Mùa hoa Tết là lúc làng rộn ràng và rực rỡ nhất.",
    highlights: ["Hoa Tết", "Vườn kiểng", "Cầu Hòa Khánh"],
    bestTime: "Tháng 11 – tháng 1, cao điểm trước Tết",
  },
  {
    id: 6,
    name: "Khu du lịch Xẻo Quýt",
    category: "Sinh thái",
    area: "Cao Lãnh",
    lon: 105.80362,
    lat: 10.3985,
    summary:
      "Rừng tràm nguyên sinh gắn với căn cứ kháng chiến, len lỏi trong hệ thống kênh rạch.",
    description:
      "Xẻo Quýt là khu di tích lịch sử – sinh thái với rừng tràm, lau sậy và đường xuồng chạy xuyên rừng. Trong kháng chiến, nơi đây từng là căn cứ quan trọng. Ngày nay du khách đi thuyền ngắm chim, tham quan nhà trưng bày và tìm hiểu hệ sinh thái ngập nước.",
    highlights: ["Đường xuồng xuyên rừng", "Căn cứ kháng chiến", "Chim nước"],
    bestTime: "Tháng 12 – tháng 4, nước thấp dễ quan sát",
  },
  {
    id: 7,
    name: "Làng cổ Đông Hoà Hiệp",
    category: "Văn hoá",
    area: "Cái Bè",
    lon: 106.00793,
    lat: 10.34652,
    summary:
      "Ngôi làng ven sông Tiền với những ngôi nhà cổ trăm năm và vườn trái cây sum suê.",
    description:
      "Đông Hoà Hiệp còn lưu giữ nhiều ngôi nhà gỗ cổ, giếng xưa và nếp sống miệt vườn đặc trưng. Du khách đạp xe qua các con đường làng, ghé vườn ổi, chôm chôm và nghỉ trong những homestay do chính người dân địa phương vận hành.",
    highlights: ["Nhà cổ trăm năm", "Vườn trái cây", "Homestay miệt vườn"],
    bestTime: "Quanh năm, mùa trái cây tháng 5 – tháng 8",
  },
  {
    id: 8,
    name: "Chợ nổi Cái Bè",
    category: "Văn hoá",
    area: "Cái Bè",
    lon: 106.03906,
    lat: 10.33916,
    summary:
      "Phiên chợ trên sông Tiền họp từ tinh mơ, nơi thuyền trái cây và hàng hoá tấp nập.",
    description:
      "Chợ nổi Cái Bè hình thành từ giao thương đường thuỷ của vùng sông nước. Thuyền lớn bán buôn trái cây, thuyền nhỏ bán đồ ăn sáng và cà phê. Cảnh chợ nhộn nhịp nhất vào sáng sớm, khi mặt trời còn chưa lên khỏi rặng dừa nước.",
    highlights: ["Thuyền trái cây", "Điểm tâm trên sông", "Bình minh sông Tiền"],
    bestTime: "5 – 7 giờ sáng, đặc biệt mùa nước nổi",
  },
  {
    id: 9,
    name: "Chùa Vĩnh Tràng",
    category: "Văn hoá",
    area: "Mỹ Tho",
    lon: 106.37357,
    lat: 10.36284,
    summary:
      "Ngôi chùa cổ nhất Mỹ Tho với kiến trúc giao thoa Á – Âu và khuôn viên rộng rợp bóng mát.",
    description:
      "Chùa Vĩnh Tràng được xây dựng từ thế kỷ 19, nổi bật với cổng Tam quan, chánh điện và những pho tượng Phật lớn. Kiến trúc chùa kết hợp hài hoà giữa truyền thống Việt Nam, Trung Hoa và Pháp. Đây là điểm hành hương và tham quan văn hoá nổi tiếng của Tiền Giang cũ.",
    highlights: ["Cổng Tam quan", "Tượng Phật lớn", "Kiến trúc Á – Âu"],
    bestTime: "Quanh năm, lễ Phật Đản tháng 4 âm lịch",
  },
  {
    id: 10,
    name: "Cù lao Thới Sơn",
    category: "Sinh thái",
    area: "Mỹ Tho",
    lon: 106.3207,
    lat: 10.33241,
    summary:
      "Cù lao giữa sông Tiền với miệt vườn, xe ngựa và những câu đờn ca tài tử.",
    description:
      "Thới Sơn là cù lao nổi tiếng của Mỹ Tho, nơi du khách đi xe ngựa qua những con đường làng, ghé vườn nhãn, uống trà mật ong và nghe đờn ca tài tử. Những chuyến xuồng len qua rạch dừa nước là trải nghiệm đậm chất miền Tây.",
    highlights: ["Xe ngựa", "Đờn ca tài tử", "Vườn nhãn, mật ong"],
    bestTime: "Quanh năm, mùa nước nổi tháng 9 – tháng 11",
  },
  {
    id: 11,
    name: "Khu di tích Rạch Gầm – Xoài Mút",
    category: "Di tích",
    area: "Châu Thành",
    lon: 106.24792,
    lat: 10.32506,
    summary:
      "Di tích lịch sử ghi dấu chiến thắng sông Tiền của nghĩa quân Tây Sơn năm 1785.",
    description:
      "Rạch Gầm – Xoài Mút là đoạn sông Tiền gắn với trận thuỷ chiến lừng lẫy giữa quân Tây Sơn và quân Xiêm. Khu di tích có tượng đài, nhà trưng bày và không gian tưởng niệm bên sông. Đây là điểm dừng chân lịch sử quan trọng trên hành trình khám phá Tiền Giang.",
    highlights: ["Tượng đài chiến thắng", "Nhà trưng bày", "Cảnh quan sông Tiền"],
    bestTime: "Quanh năm, buổi sáng mát mẻ",
  },
  {
    id: 12,
    name: "Biển Tân Thành",
    category: "Biển đảo",
    area: "Gò Công Đông",
    lon: 106.74933,
    lat: 10.31469,
    summary:
      "Bãi biển gần Sài Gòn với hàng dừa ven bờ, hải sản tươi và rừng phòng hộ ngập mặn.",
    description:
      "Tân Thành là bãi biển của vùng Gò Công, nơi cửa sông Tiền đổ ra biển Đông. Bãi cát thoải, sóng êm và những rặng dừa tạo nên khung cảnh bình yên. Du khách thường kết hợp tắm biển, ăn hải sản và khám phá rừng ngập mặn ven bờ.",
    highlights: ["Bãi biển", "Hải sản", "Rừng phòng hộ"],
    bestTime: "Tháng 12 – tháng 4, biển lặng",
  },
  {
    id: 13,
    name: "Khu bảo tồn Đồng Tháp Mười",
    category: "Sinh thái",
    area: "Tân Phước",
    lon: 106.14908,
    lat: 10.53154,
    summary:
      "Mảng rừng tràm và đất ngập nước còn sót lại của vùng Đồng Tháp Mười xưa.",
    description:
      "Khu bảo tồn sinh thái Đồng Tháp Mười bảo vệ hệ sinh thái đất ngập nước, rừng tràm và các loài chim bản địa. Đây là điểm quan sát chim, tìm hiểu sinh thái và cảm nhận vẻ đẹp hoang sơ của vùng đất phèn rộng lớn.",
    highlights: ["Rừng tràm", "Quan sát chim", "Hệ sinh thái ngập nước"],
    bestTime: "Mùa khô tháng 12 – tháng 4",
  },
  {
    id: 14,
    name: "Chùa Kiến An Cung",
    category: "Di tích",
    area: "Sa Đéc",
    lon: 105.76712,
    lat: 10.29459,
    summary:
      "Ngôi chùa Hoa cổ giữa lòng Sa Đéc, nổi tiếng với kiến trúc và nghệ thuật chạm khắc.",
    description:
      "Kiến An Cung được xây dựng từ đầu thế kỷ 20 bởi cộng đồng người Hoa tại Sa Đéc. Chùa nổi bật với mái ngói cong, hoa văn rồng phượng và những bức chạm gỗ tinh xảo. Đây là di tích kiến trúc nghệ thuật tiêu biểu, nằm ngay khu trung tâm gần nhà cổ Huỳnh Thuỷ Lê.",
    highlights: ["Kiến trúc Hoa", "Chạm khắc gỗ", "Không gian cổ kính"],
    bestTime: "Quanh năm, dịp lễ hội đầu năm",
  },
];

export const CATEGORY_COLORS: Record<AttractionCategory, string> = {
  "Sinh thái": "#8fae76",
  "Di tích": "#d2b06b",
  "Văn hoá": "#c98f78",
  "Biển đảo": "#83b3c2",
};
