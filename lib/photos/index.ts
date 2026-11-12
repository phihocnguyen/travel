import { LOCAL_PHOTOS, type LocalPhoto } from './catalog';
export { LOCAL_PHOTOS, type LocalPhoto } from './catalog';

function byFilename(name: string): LocalPhoto {
  const photo = LOCAL_PHOTOS.find(item => item.source.endsWith(`/${name}`));
  if (!photo) throw new Error(`Missing prepared photo: ${name}`);
  return photo;
}

export const PHOTO_FEATURES = {
  farmer: byFilename('HIU08251.JPG'),
  harvest: byFilename('HIU08245.JPG'),
  mangoes: byFilename('IMG_8471.JPG'),
  mangoTree: byFilename('IMG_8720.CR2'),
  market: byFilename('HIU08319.JPG'),
  marketCrafts: byFilename('HIU08303.JPG'),
  xeoQuyt: byFilename('IMG_8532.CR2'),
  gaoGiong: byFilename('kdl-gao-giong7-17290660912693430604-0-0-1108-1772-crop-17290671767431334158693.jpg'),
  myPhuocThanh: LOCAL_PHOTOS.find(photo => photo.source === 'Khu du lịch sinh thái Mỹ Phước Thành/1.jpg')!,
  nguyenSinhSac: byFilename('Tượng_Nguyễn_Sinh_Sắc_trong_khu_di_tích.jpg'),
  doCongTuong: byFilename('Đền_thờ_ông_bà_Đỗ_Công_Tường_mới.jpg'),
  tapKet: byFilename('Dia-Diem-Tap-Ket-Ra-.jpg'),
  chiBo: byFilename('dt2-17586109343251406392660.webp'),
  mangoTrail: byFilename('Farmstay cắm trại.jpg'),
};

const covers: Record<number, LocalPhoto> = {
  0: PHOTO_FEATURES.nguyenSinhSac, 1: PHOTO_FEATURES.doCongTuong,
  2: PHOTO_FEATURES.tapKet, 3: PHOTO_FEATURES.chiBo, 4: PHOTO_FEATURES.gaoGiong,
  5: PHOTO_FEATURES.xeoQuyt, 6: PHOTO_FEATURES.myPhuocThanh,
  8: PHOTO_FEATURES.mangoTrail, 9: PHOTO_FEATURES.mangoTree, 10: PHOTO_FEATURES.farmer,
  11: PHOTO_FEATURES.market,
};
export function attractionPhotos(id: number): LocalPhoto[] {
  const cover = covers[id];
  const photos = LOCAL_PHOTOS.filter(photo => photo.attractionId === id);
  return cover ? [cover, ...photos.filter(photo => photo.id !== cover.id)] : photos;
}
