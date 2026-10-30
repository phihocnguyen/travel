export type AttractionCategory =
  | "Ecology"
  | "Heritage"
  | "Culture"
  | "Coast";

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
    name: "Tram Chim National Park",
    category: "Ecology",
    area: "Tam Nong",
    lon: 105.50011,
    lat: 10.72989,
    summary:
      "A vast wetland where melaleuca forest, sedge meadows and sarus cranes share the same horizon.",
    description:
      "Tram Chim is one of the most important wetlands in the Mekong Delta. In the dry season the water retreats to reveal fields of sedge, drawing hundreds of waterbird species. It is one of the rare places where visitors can watch sarus cranes in the wild.",
    highlights: ["Sarus cranes", "Lotus ponds", "Birdwatching towers"],
    bestTime: "December – April, the dry season when birds gather",
  },
  {
    id: 1,
    name: "Gao Giong Melaleuca Forest",
    category: "Ecology",
    area: "Cao Lanh",
    lon: 105.61012,
    lat: 10.58323,
    summary:
      "A green melaleuca forest threaded with canals, a familiar escape in the western delta.",
    description:
      "Gao Giong is an eco-tourism site often called the green lung of Dong Thap. Visitors glide through the melaleuca forest in a three-plank sampan, listen to birds calling and taste straw-roasted snakehead fish. The stilt huts along the canals are ideal for watching the sunset.",
    highlights: ["Sampan rides", "Waterbirds", "Countryside cuisine"],
    bestTime: "Flood season, August – November",
  },
  {
    id: 2,
    name: "Go Thap Relic Site",
    category: "Heritage",
    area: "Thap Muoi",
    lon: 105.82746,
    lat: 10.60654,
    summary:
      "An archaeological and spiritual complex in the heart of Dong Thap Muoi, linked to Oc Eo culture.",
    description:
      "Go Thap is a cluster of ancient towers, shrines and archaeological remains dating back thousands of years. Every lunar March the Go Thap festival draws crowds offering incense. Surrounding the site are lotus fields and the characteristic acid sulphate soils of Thap Muoi.",
    highlights: ["Ancient tower", "Go Thap festival", "Lotus fields"],
    bestTime: "Lunar March, during the festival",
  },
  {
    id: 3,
    name: "Nguyen Sinh Sac Memorial Tomb",
    category: "Heritage",
    area: "Cao Lanh",
    lon: 105.63166,
    lat: 10.4472,
    summary:
      "A memorial to the father of President Ho Chi Minh, set in a quiet, tree-shaded garden.",
    description:
      "The site includes the tomb of scholar Nguyen Sinh Sac, an exhibition house and a solemn memorial space. It is a key cultural and historical destination in Dong Thap, often visited together with nearby pagodas and the Dong Thap Museum.",
    highlights: ["Scholar's tomb", "Exhibition house", "Memorial garden"],
    bestTime: "Year round, dress respectfully",
  },
  {
    id: 4,
    name: "Huynh Thuy Le Ancient House",
    category: "Culture",
    area: "Sa Dec",
    lon: 105.7683,
    lat: 10.29392,
    summary:
      "A century-old house blending French and Chinese architecture, tied to Marguerite Duras' love story.",
    description:
      "Set beside the Sa Dec river, the house was built in the early 20th century with rare timber and intricate carvings. It once inspired Marguerite Duras' novel The Lover. Nearby stands Kien An Cung pagoda, a landmark of Sa Dec architecture.",
    highlights: ["French–Chinese architecture", "The Duras story", "Kien An Cung pagoda"],
    bestTime: "Year round, mornings are quieter",
  },
  {
    id: 5,
    name: "Sa Dec Flower Village",
    category: "Culture",
    area: "Sa Dec",
    lon: 105.74972,
    lat: 10.31538,
    summary:
      "The largest flower-growing area in the delta, at its brightest in the weeks before Tet.",
    description:
      "Tan Quy Dong flower village sits along the Tien River, where hundreds of households grow flowers for the whole of southern Vietnam. Visitors can walk or cycle between the flower beds, visit bonsai gardens and stop at Hoa Khanh bridge. The Tet season is when the village is at its most colourful.",
    highlights: ["Tet flowers", "Bonsai gardens", "Hoa Khanh bridge"],
    bestTime: "November – January, the peak before Tet",
  },
  {
    id: 6,
    name: "Xeo Quyt Eco-Tourism Site",
    category: "Ecology",
    area: "Cao Lanh",
    lon: 105.80362,
    lat: 10.3985,
    summary:
      "Primary melaleuca forest and a wartime base, hidden among a maze of canals.",
    description:
      "Xeo Quyt is a historical and ecological site with melaleuca forest, reeds and boat paths cutting through the trees. During the war it served as an important base. Today visitors take boats to watch birds, tour the exhibition house and learn about the wetland ecosystem.",
    highlights: ["Forest boat paths", "Wartime base", "Waterbirds"],
    bestTime: "December – April, low water makes wildlife easier to spot",
  },
  {
    id: 7,
    name: "Dong Hoa Hiep Ancient Village",
    category: "Culture",
    area: "Cai Be",
    lon: 106.00793,
    lat: 10.34652,
    summary:
      "A river village on the Tien with century-old houses and lush fruit orchards.",
    description:
      "Dong Hoa Hiep preserves old wooden houses, ancient wells and the rhythms of orchard life. Visitors cycle along village lanes, stop at guava and rambutan gardens, and stay in homestays run by local families.",
    highlights: ["Century-old houses", "Fruit orchards", "Garden homestays"],
    bestTime: "Year round, fruit season May – August",
  },
  {
    id: 8,
    name: "Cai Be Floating Market",
    category: "Culture",
    area: "Cai Be",
    lon: 106.03906,
    lat: 10.33916,
    summary:
      "A river market on the Tien that opens at dawn, busy with fruit boats and traders.",
    description:
      "Cai Be floating market grew from the waterborne trade of the delta. Large boats sell fruit wholesale while small boats serve breakfast and coffee. The market is liveliest in the early morning, before the sun clears the water coconut palms.",
    highlights: ["Fruit boats", "Breakfast on the river", "Sunrise on the Tien"],
    bestTime: "5 – 7 am, especially during flood season",
  },
  {
    id: 9,
    name: "Vinh Trang Pagoda",
    category: "Culture",
    area: "My Tho",
    lon: 106.37357,
    lat: 10.36284,
    summary:
      "My Tho's oldest pagoda, where Asian and European architecture meet in a shady garden.",
    description:
      "Built in the 19th century, Vinh Trang pagoda is known for its triple gate, main hall and large Buddha statues. Its architecture blends Vietnamese, Chinese and French influences. It remains a famous pilgrimage and cultural site of the former Tien Giang province.",
    highlights: ["Triple gate", "Large Buddha statues", "Asian–European architecture"],
    bestTime: "Year round, Buddha's birthday in lunar April",
  },
  {
    id: 10,
    name: "Thoi Son Islet",
    category: "Ecology",
    area: "My Tho",
    lon: 106.3207,
    lat: 10.33241,
    summary:
      "An islet in the Tien River with orchards, horse carts and southern folk music.",
    description:
      "Thoi Son is a well-known islet of My Tho, where visitors ride horse carts along village lanes, visit longan orchards, sip honey tea and listen to don ca tai tu folk music. Sampan rides through water coconut creeks are a quintessential delta experience.",
    highlights: ["Horse carts", "Folk music", "Longan orchards and honey"],
    bestTime: "Year round, flood season September – November",
  },
  {
    id: 11,
    name: "Rach Gam – Xoai Mut Monument",
    category: "Heritage",
    area: "Chau Thanh",
    lon: 106.24792,
    lat: 10.32506,
    summary:
      "A historical site marking the Tay Son victory on the Tien River in 1785.",
    description:
      "Rach Gam – Xoai Mut is the stretch of the Tien River tied to the famous naval battle between the Tay Son and Siamese forces. The site has a monument, an exhibition house and a memorial space beside the river. It is a key historical stop on any journey through Tien Giang.",
    highlights: ["Victory monument", "Exhibition house", "Tien River views"],
    bestTime: "Year round, cool mornings",
  },
  {
    id: 12,
    name: "Tan Thanh Beach",
    category: "Coast",
    area: "Go Cong Dong",
    lon: 106.74933,
    lat: 10.31469,
    summary:
      "A beach near Saigon with coconut palms, fresh seafood and mangrove forest.",
    description:
      "Tan Thanh is the beach of the Go Cong area, where the Tien River meets the East Sea. The sand is gently sloping, the waves are calm and coconut palms frame a peaceful scene. Visitors often combine a swim with seafood and a walk through the coastal mangroves.",
    highlights: ["Beach", "Seafood", "Protective mangrove forest"],
    bestTime: "December – April, calm seas",
  },
  {
    id: 13,
    name: "Dong Thap Muoi Nature Reserve",
    category: "Ecology",
    area: "Tan Phuoc",
    lon: 106.14908,
    lat: 10.53154,
    summary:
      "A remaining patch of melaleuca forest and wetland from the old Dong Thap Muoi.",
    description:
      "The Dong Thap Muoi Nature Reserve protects wetland habitat, melaleuca forest and native bird species. It is a place to watch birds, learn about the ecosystem and feel the quiet beauty of the vast acid sulphate plain.",
    highlights: ["Melaleuca forest", "Birdwatching", "Wetland ecosystem"],
    bestTime: "Dry season, December – April",
  },
  {
    id: 14,
    name: "Kien An Cung Pagoda",
    category: "Heritage",
    area: "Sa Dec",
    lon: 105.76712,
    lat: 10.29459,
    summary:
      "An old Chinese pagoda in central Sa Dec, known for its architecture and wood carvings.",
    description:
      "Kien An Cung was built in the early 20th century by the Chinese community of Sa Dec. It stands out for its curved tiled roof, dragon and phoenix motifs and refined wooden carvings. The pagoda is a fine example of artistic architecture, close to the Huynh Thuy Le ancient house.",
    highlights: ["Chinese architecture", "Wood carvings", "Old-world atmosphere"],
    bestTime: "Year round, especially during the New Year festival",
  },
];

export const CATEGORY_COLORS: Record<AttractionCategory, string> = {
  Ecology: "#8fae76",
  Heritage: "#d2b06b",
  Culture: "#c98f78",
  Coast: "#83b3c2",
};
