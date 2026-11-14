export type TourStop = { time: string; title: string; detail: string; image: string; alt: string };
export type ChatAnswer = { text: string; links?: { label: string; href: string }[]; tour?: { title: string; duration: string; intro: string; hotel: string; hotelDetail: string; hotelImage: string; meals: string; budget: string; notes: string; stops: TourStop[] } };
export const CHAT_TOPICS = ["Khám phá Cao Lãnh", "Gợi ý lịch trình du lịch", "Sự kiện và đặt vé", "Thử thách cover nhạc UGC"] as const;
