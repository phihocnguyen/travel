import { ACTIVITIES, INTERIOR, PHOTO_SPOTS, QUIZZES, STOPS, WORKERS, WORLD, XEO_QUYT_RIVER, isHouse, isRiver, type Stop } from "./world";

export type Point = { x: number; y: number };
type Footprint = { x: number; y: number; width: number; height: number };
const touches = (x: number, y: number, box: Footprint, radius = 9) =>
  x + radius > box.x && x - radius < box.x + box.width && y + radius > box.y && y - radius < box.y + box.height;

export function stopFootprint(stop: Stop): Footprint {
  const width = stop.kind === "market" ? 140 : stop.kind === "mango" ? 86 : 110;
  const height = stop.kind === "temple" || stop.kind === "memorial" ? 76 : 48;
  return { x: stop.x - width / 2, y: stop.y + 28 - height, width, height };
}

export function isWorldBlocked(x: number, y: number) {
  return isRiver(x, y) || isHouse(x, y) || STOPS.some(stop => touches(x, y, stopFootprint(stop)));
}

export function isInteriorBlocked(stop: Stop, x: number, y: number) {
  const boxes: Footprint[] = [];
  if (stop.kind === "temple" || stop.kind === "memorial") {
    boxes.push({ x: 70, y: 48, width: 820, height: 175 }, { x: 460, y: 246, width: 40, height: 85 });
  }
  if (stop.kind === "market") {
    for (const [cx, cy] of [[180, 160], [480, 120], [780, 160], [95, 345], [270, 75], [660, 85], [820, 350]]) {
      boxes.push({ x: cx - 39, y: cy - 24, width: 78, height: 53 });
    }
  }
  // Photo displays have solid bases; visitors approach them from the paths.
  for (const spot of PHOTO_SPOTS[stop.id]) {
    boxes.push({ x: spot.x - 21, y: spot.y - 19, width: 42, height: 38 });
  }
  for (const worker of WORKERS[stop.id]) boxes.push({ x: worker.x - 10, y: worker.y - 5, width: 20, height: 18 });
  const activity = ACTIVITIES[stop.id];
  if (activity) boxes.push({ x: activity.x - 30, y: activity.y - 9, width: 60, height: 30 });
  const quiz = QUIZZES[stop.id];
  if (quiz) boxes.push({ x: quiz.x - 28, y: quiz.y - 11, width: 56, height: 26 });
  const huts: Partial<Record<string, Point[]>> = {
    "xeo-quyt": [{x:748,y:124}], "vuon-xoai": [{x:780,y:325}], "my-phuoc-thanh": [{x:785,y:125}],
  };
  for (const hut of huts[stop.id] ?? []) boxes.push({x:hut.x-39,y:hut.y-24,width:78,height:53});
  const trunks: Point[] = [];
  if (stop.kind === "mango") {
    for (let tx=115;tx<900;tx+=145) for (const ty of [105,405,545]) trunks.push({x:tx,y:ty});
    for (const [tx,ty] of [[80,160],[260,100],[690,110],[845,210],[115,515],[840,500],[90,250],[300,105],[630,105],[820,265]]) trunks.push({x:tx,y:ty});
    boxes.push({x:58,y:198,width:75,height:170},{x:220,y:496,width:80,height:18});
  }
  if (stop.kind === "forest") {
    for (let tx=225;tx<940;tx+=82) trunks.push({x:tx,y:105},{x:tx+37,y:535});
  }
  if (stop.id === "xeo-quyt") {
    boxes.push({x:635,y:365,width:125,height:37});
    for (const tx of [305,812]) trunks.push({x:tx,y:280},{x:tx+25,y:320});
  }
  if (stop.kind === "lotus") {
    for (const tx of [90,870]) trunks.push({x:tx,y:430},{x:tx+30,y:500});
    for (const [tx,ty] of [[150,390],[350,410],[570,395],[790,425]]) boxes.push({x:tx-34,y:ty-8,width:68,height:19});
  }
  for (const trunk of trunks) boxes.push({x:trunk.x-5,y:trunk.y+2,width:10,height:12});
  return boxes.some(box => touches(x, y, box));
}

export function checkpointGuidance(stop: Stop, chapterId: string, inside: Stop | null, player: Point) {
  if (inside && inside.id !== stop.id) return { ...INTERIOR.exit, label: "Ra bản đồ để tiếp tục", scene: inside.id };
  if (inside) {
    const goal = chapterId === "meet" || chapterId === "homecoming" ? WORKERS[stop.id][0] : ACTIVITIES[stop.id];
    const center=goal??INTERIOR.entry;
    const approach=[{x:center.x,y:center.y+45},{x:center.x+45,y:center.y},{x:center.x-45,y:center.y},{x:center.x,y:center.y-45}]
      .find(point=>!isInteriorBlocked(inside,point.x,point.y))??INTERIOR.entry;
    return { ...approach, label: goal?.name ?? stop.short, scene: inside.id };
  }
  const island = XEO_QUYT_RIVER.island;
  const onIsland = player.x >= island.left && player.x <= island.right && player.y >= island.top && player.y <= island.bottom;
  if (stop.id === "xeo-quyt" && !onIsland) return { ...XEO_QUYT_RIVER.eastDock, label: "Lên xuồng sang Xẻo Quýt", scene: null };
  if (stop.id !== "xeo-quyt" && onIsland) return { ...XEO_QUYT_RIVER.westDock, label: "Lên xuồng về bờ", scene: null };
  return { x: stop.x, y: stop.y + 65, label: stop.short, scene: null };
}

export const sceneSize = (inside: Stop | null) => inside ? INTERIOR : WORLD;
