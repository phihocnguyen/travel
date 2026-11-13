import { ACTIVITIES, STOPS, WORKERS } from "./world";

export const STORY_SAVE_KEY = "cao-lanh-story-v1";
export type Story = { started: boolean; metFarmer: boolean; harvested: boolean; preparedLotus: boolean; wrapped: boolean; boated: boolean; fished: boolean; finished: boolean };
export const EMPTY_STORY: Story = { started: false, metFarmer: false, harvested: false, preparedLotus: false, wrapped: false, boated: false, fished: false, finished: false };
export const PROLOGUE = [
  { kicker: "MỘT LỜI NHẮN TỪ MIỀN TÂY", title: "Có người đang đợi bạn ở chợ quê.", text: "Dì bán bánh nhắn: “Lâu rồi con chưa về. Ghé Cao Lãnh chơi, phụ dì một tay rồi mình ngồi kể chuyện.”", image: "/explore/map-hut.svg" },
  { kicker: "MỘT GIỎ XOÀI, MỘT CHIẾC BÁNH", title: "Món quà nằm dọc đường đi.", text: "Chú làm vườn giữ một giỏ xoài chín. Cô ở đồng sen nhờ con tách tâm sen cho ấm trà. Mang quà về chợ, phụ dì gói bánh cho buổi gặp mặt nhé.", image: "/explore/harvest-basket.svg" },
  { kicker: "BẢY CHECKPOINT · MỘT LỜI HẸN", title: "Đi một vòng, mang về một câu chuyện.", text: "Gói bánh xong, chèo xuồng qua Xẻo Quýt rồi ghé ao Gáo Giồng ghi lại ba loài cá. Trở về kể dì nghe bên ấm trà sen. Mỗi nhiệm vụ đều được lưu để con tiếp tục lần sau.", image: "/explore/map-tree.svg" },
] as const;

export const CHECKPOINTS = [
  { id: "meet", key: "metFarmer", chapter: "CHƯƠNG 01 · GIỎ XOÀI ĐẦU MÙA", title: "Gặp Chú làm vườn", hint: "Đến vườn xoài, trò chuyện với chú ở bên trái để nhận lời nhắn của dì.", stop: "vuon-xoai" },
  { id: "mango", key: "harvested", chapter: "CHƯƠNG 01 · GIỎ XOÀI ĐẦU MÙA", title: "Hái một giỏ nắng", hint: "Hái đủ 3 trái xoài chín làm quà cho buổi gặp mặt ở chợ.", stop: "vuon-xoai", activity: "vuon-xoai" },
  { id: "lotus", key: "preparedLotus", chapter: "CHƯƠNG 02 · HƯƠNG SEN TRONG ẤM TRÀ", title: "Chuẩn bị trà sen cho dì", hint: "Ghé đồng sen Mỹ Phước, tách tâm 3 hạt sen rồi mang về chợ.", stop: "my-phuoc-thanh", activity: "my-phuoc-thanh" },
  { id: "cake", key: "wrapped", chapter: "CHƯƠNG 03 · BẾP CHỢ QUÊ", title: "Phụ dì gói bánh", hint: "Mang xoài và sen về chợ quê. Trải lá, thêm nhân, gấp và buộc bánh giúp dì.", stop: "cho-que", activity: "cho-que" },
  { id: "boat", key: "boated", chapter: "CHƯƠNG 04 · QUA MIỀN TRÀM XANH", title: "Một chuyến xuồng ba lá", hint: "Bánh đã sẵn sàng. Qua Xẻo Quýt, lái xuồng tránh vật cản và cập bến.", stop: "xeo-quyt", activity: "xeo-quyt" },
  { id: "fish", key: "fished", chapter: "CHƯƠNG 05 · CHUYỆN KỂ BÊN AO", title: "Ghi vào sổ ba loài cá", hint: "Sau chuyến xuồng, ghé ao Gáo Giồng câu đủ 3 loài cá để kể dì nghe.", stop: "gao-giong", activity: "gao-giong" },
  { id: "homecoming", key: "finished", chapter: "CHƯƠNG 06 · LỜI HẸN Ở CHỢ QUÊ", title: "Mang câu chuyện về cho dì", hint: "Trở lại chợ, trò chuyện đến cuối với Dì bán bánh bên ấm trà sen.", stop: "cho-que" },
] as const;

export function storyCheckpoints(story: Story, activities: Record<string, number>) {
  const active = CHECKPOINTS.findIndex(checkpoint => !story[checkpoint.key]);
  return CHECKPOINTS.map((checkpoint, index) => {
    const done = story[checkpoint.key];
    const goal = "activity" in checkpoint ? ACTIVITIES[checkpoint.activity]?.goal ?? 3 : 1;
    const progress = done ? goal : "activity" in checkpoint ? Math.min(goal, activities[checkpoint.activity] ?? 0) : 0;
    return { ...checkpoint, number: index + 1, done, active: index === active, goal, progress };
  });
}

export function currentChapter(story: Story) {
  const next = CHECKPOINTS.find(checkpoint => !story[checkpoint.key]);
  if (next) return next;
  return { id: "complete", chapter: "HẸN GẶP LẠI, CAO LÃNH", title: "Còn nhiều điều để thương", hint: "Tiếp tục câu cá, ghé đồng sen hoặc chơi lại các minigame.", stop: "gao-giong" };
}

export function npcLines(stop: string, worker: number, story: Story): string[] {
  if (stop === "vuon-xoai" && worker === 0) {
    if (story.harvested) return ["Giỏ xoài đầy rồi, con khéo chọn ghê!", story.preparedLotus ? "Mang xoài và sen về chợ giúp dì gói bánh nhé." : "Ghé đồng sen Mỹ Phước, phụ cô tách tâm ba hạt sen cho ấm trà của dì nhé."];
    return [story.metFarmer ? "Con trở lại rồi! Những trái vàng chín vẫn đang đợi trên cây." : "À, người bạn dì nhắc đã đến rồi! Chú để dành mấy trái xoài vừa chín.", "Con hái ba trái vàng bỏ vào giỏ. Trái còn xanh thì để trên cây, mình đợi thêm ít bữa.", "Đủ giỏ rồi ghé chợ quê phụ dì gói bánh. Chuyến đi bắt đầu từ những việc nhỏ vậy đó."];
  }
  if (stop === "cho-que" && worker === 0) {
    if (story.finished) return ["Người bạn khéo tay của dì lại ghé rồi!", "Chợ quê lúc nào cũng có chỗ cho con. Đi chơi thêm rồi về kể dì nghe nhé."];
    if (currentChapter(story).id === "homecoming") return ["Con về rồi! Dì pha trà sen, dọn xoài và bánh. Ngồi kể dì nghe chuyến xuồng với ba loài cá con đã gặp nhé.", "Từ vườn xoài, đồng sen đến rừng tràm và ao quê, mỗi người đã gửi một chút quê mình vào chuyến đi ấy.", "Cảm ơn con đã giữ lời hẹn. Lần sau trở lại, mình lại cùng nhau gói một mẻ bánh mới nhé."];
    if (!story.harvested) return ["Dì mừng vì con ghé! Chú làm vườn đang để dành một giỏ xoài đấy.", "Con có thể thử gói bánh trước, rồi thong thả qua vườn. Dì không vội đâu."];
    if (!story.preparedLotus) return ["Giỏ xoài thơm quá! Còn ấm trà sen để đãi con nữa.", "Qua đồng sen Mỹ Phước phụ cô tách tâm ba hạt sen rồi quay lại giúp dì gói bánh nhé."];
    if (!story.wrapped) return ["Xoài vàng đẹp quá! Con mang cả nắng về chợ rồi.", "Lá chuối, nếp và nhân ở bàn bên kia. Trải lá, thêm nhân, gấp hai mép rồi buộc lạt giúp dì nhé."];
    return ["Chiếc bánh gọn gàng rồi! Giờ con đi chơi một vòng cho biết miền sông nước.", story.boated ? "Ghé ao Gáo Giồng, ghi lại ba loài cá rồi về kể dì nghe. Dì giữ ấm trà chờ con." : "Qua bến xuồng Xẻo Quýt, thử cầm mái chèo. Sau đó ghé ao Gáo Giồng rồi về kể dì nghe nhé."];
  }
  if (stop === "xeo-quyt" && worker === 0) return story.boated
    ? ["Tay chèo vững rồi đó! Con đã đưa xuồng tới cuối lạch.", story.fished ? "Sổ cá cũng đủ rồi. Về chợ kể dì nghe nhé!" : "Ghé ao Gáo Giồng nghỉ chân, thử câu và ghi lại ba loài cá. Có thêm chuyện mang về cho dì đó."]
    : ["Xuồng ba lá nhỏ thôi, nhưng đưa mình đi được nhiều nơi lắm.", "Giữ hướng giữa lạch, tránh những nhánh cây và đám lục bình. Chạm hai bên để lái, con thử nhé."];
  if (stop === "gao-giong" && worker === 0) return story.fished ? ["Sổ đã có cá rô đồng, cá trê và cá lóc rồi!", "Về chợ kể cho dì nghe buổi câu nhé, ấm trà sen đang đợi."] : ["Sau chuyến xuồng, ngồi nghỉ bên ao và ghi vào sổ ba loài cá để kể dì nghe nhé.", "Đợi phao báo cá cắn, rồi kéo đúng lúc kim nằm trong khoảng xanh. Câu được cá nào, sổ sẽ hiện hình và tên cá ấy."];
  if (stop === "my-phuoc-thanh" && worker === 0) return story.preparedLotus ? ["Ba hạt sen đã tách tâm xong. Mang về cho dì pha trà nhé.", "Xoài, trà sen và bánh quê, vậy là đủ một buổi gặp mặt ấm cúng."] : ["Dì nhắn cô để dành ít sen cho buổi gặp mặt của con.", "Con ghé bàn tách tâm ba hạt sen. Xong rồi mang về chợ, phụ dì gói bánh nhé."];
  return WORKERS[stop][worker].lines;
}

export type StorySave = { version: 1; story: Story; visited: string[]; activities: Record<string, number>; mangoes: number[]; quizzes: Record<string, number> };
export function parseStorySave(value: unknown): StorySave | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<StorySave>;
  if (raw.version !== 1 || !raw.story || typeof raw.story !== "object") return null;
  const story = { ...EMPTY_STORY };
  for (const key of Object.keys(story) as (keyof Story)[]) story[key] = raw.story[key] === true;
  const activities: Record<string, number> = {}, quizzes: Record<string, number> = {};
  for (const stop of STOPS) {
    const n = raw.activities?.[stop.id];
    if (typeof n === "number" && Number.isFinite(n)) activities[stop.id] = Math.max(0, Math.min(ACTIVITIES[stop.id]?.goal ?? 3, Math.floor(n)));
    const q = raw.quizzes?.[stop.id];
    if (typeof q === "number" && Number.isFinite(q)) quizzes[stop.id] = Math.max(0, Math.min(3, Math.floor(q)));
  }
  const mangoes = Array.isArray(raw.mangoes) ? [...new Set(raw.mangoes.filter(n => Number.isInteger(n) && n >= 0 && n <= 2))] : [];
  activities["vuon-xoai"] = mangoes.length;
  // Extend existing saves without losing completed checkpoints or replay progress.
  story.harvested ||= mangoes.length === 3;
  story.wrapped ||= activities["cho-que"] === 3;
  story.boated ||= activities["xeo-quyt"] === 1;
  const legacyEnding = story.finished && !("preparedLotus" in raw.story) && !("fished" in raw.story);
  story.preparedLotus ||= activities["my-phuoc-thanh"] === 3 || legacyEnding;
  story.fished ||= activities["gao-giong"] === 3 || legacyEnding;
  if (CHECKPOINTS.slice(0, -1).some(checkpoint => !story[checkpoint.key])) story.finished = false;
  return { version: 1, story, visited: STOPS.filter(s => Array.isArray(raw.visited) && raw.visited.includes(s.id)).map(s => s.id), activities, mangoes, quizzes };
}
