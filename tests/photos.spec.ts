import { test, expect } from '@playwright/test';
import { readdir, access } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { LOCAL_PHOTOS, attractionPhotos, PHOTO_FEATURES } from '../lib/photos';

test('every supplied destination photo has a readable optimized derivative without upscaling', async () => {
  const folders = [...new Set(LOCAL_PHOTOS.map(photo => photo.source.split('/')[0]))];
  const supplied = (await Promise.all(folders.map(async folder => (await readdir(path.join('public', folder))).filter(name => /\.(jpe?g|png|webp|cr2)$/i.test(name)).map(name => `${folder}/${name}`)))).flat().sort();
  expect(LOCAL_PHOTOS.map(photo => photo.source).sort()).toEqual(supplied);
  expect(new Set(LOCAL_PHOTOS.map(photo => photo.id)).size).toBe(LOCAL_PHOTOS.length);
  for (const photo of LOCAL_PHOTOS) {
    await access(path.join('public', photo.source));
    const optimized = await sharp(path.join('public', photo.src)).metadata();
    const thumbnail = await sharp(path.join('public', photo.thumbnail)).metadata();
    expect([optimized.width, optimized.height]).toEqual([photo.width, photo.height]);
    expect(Math.max(photo.width, photo.height)).toBeLessThanOrEqual(2560);
    expect(Math.max(thumbnail.width!, thumbnail.height!)).toBeLessThanOrEqual(720);
    if (!/\.cr2$/i.test(photo.source)) {
      const original = await sharp(path.join('public', photo.source)).metadata();
      expect(Math.max(photo.width, photo.height)).toBeLessThanOrEqual(Math.max(original.width!, original.height!));
    }
  }
});

test('map covers use the correct destination collection and ambiguous architecture stays separate', () => {
  for (const id of [0, 1, 2, 3, 4, 5, 6, 7, 8, 11]) {
    expect(attractionPhotos(id).every(photo => photo.attractionId === id)).toBe(true);
  }
  expect(attractionPhotos(5)[0].id).toBe(PHOTO_FEATURES.xeoQuyt.id);
  expect(attractionPhotos(11)[0].id).toBe(PHOTO_FEATURES.market.id);
  expect(attractionPhotos(3).some(photo => photo.group === 'kien-truc')).toBe(false);
  expect(LOCAL_PHOTOS.filter(photo => /\.cr2$/i.test(photo.source))).toHaveLength(2);
});

test('photo library shows every collection, keeps 16:9 frames and opens uncropped photos on desktop and mobile', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/auth/session', route => route.fulfill({ json: { user: null } }));
  await page.route('**/api/auth/presence', route => route.fulfill({ status: 204 }));
  await page.goto('/');
  const library = page.locator('[data-photo-library]');
  await library.scrollIntoViewIfNeeded();
  await expect(library.locator('[data-library-photo]')).toHaveCount(12);
  await library.getByRole('button', { name: 'Chợ quê Tân Thuận Đông', exact: true }).click();
  await expect(library.locator('[data-library-photo]')).toHaveCount(4);
  const first = library.locator('[data-library-photo]').first();
  const frame = await first.locator('.photo-library-image').boundingBox();
  expect(frame!.width / frame!.height).toBeCloseTo(16 / 9, 2);
  await first.click();
  const dialog = page.locator('dialog[data-photo-lightbox]');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('img')).toHaveCSS('object-fit', 'scale-down');
  const original = await dialog.locator('img').getAttribute('src');
  await page.keyboard.press('ArrowRight');
  await expect(dialog.locator('img')).not.toHaveAttribute('src', original!);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(first).toBeFocused();
  await library.getByRole('button', { name: 'Tất cả', exact: true }).click();
  while (await library.getByRole('button', { name: /Xem thêm khung hình/ }).count()) {
    await library.getByRole('button', { name: /Xem thêm khung hình/ }).click();
  }
  await expect(library.locator('[data-library-photo]')).toHaveCount(LOCAL_PHOTOS.length);
  await library.getByRole('button', { name: 'Vườn xoài & con người', exact: true }).click();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await library.scrollIntoViewIfNeeded();
  await expect.poll(() => library.locator('img').first().evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.addStyleTag({ content: 'nextjs-portal { display:none!important; }' });
  await page.screenshot({ path: 'test-results/photos-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await library.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await library.locator('[data-library-photo]').first().click();
  await expect(dialog).toBeVisible();
  expect((await dialog.boundingBox())!.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'test-results/photos-mobile-lightbox.png' });
  await dialog.getByRole('button', { name: 'Đóng ảnh', exact: true }).click();
});

test('map photo albums preserve the destination dialog and scroll lock when closing a nested lightbox', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      return type.includes('webgl') ? null : original.apply(this, [type, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.route('**/geo/**', route => route.abort());
  await page.route('**/api/auth/session', route => route.fulfill({ json: { user: null } }));
  await page.goto('/map');
  await expect(page.locator('[data-map-intro]')).toHaveCount(0, { timeout: 30000 });
  await page.evaluate(() => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * .22));
  await page.getByRole('button', { name: 'Khám phá ↗', exact: true }).click();
  const destination = page.locator('[role="dialog"][aria-labelledby="checkpoint-title"]');
  await expect(destination).toBeVisible();
  const image = destination.locator('.destination-photo-main');
  const bounds = await image.boundingBox();
  expect(bounds!.width / bounds!.height).toBeCloseTo(16 / 9, 2);
  await destination.getByRole('button', { name: /Xem ảnh 2:/ }).click();
  await image.click();
  await expect(page.locator('dialog[data-photo-lightbox]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[data-photo-lightbox]')).toHaveCount(0);
  await expect(destination).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('hidden');
  await page.addStyleTag({ content: 'nextjs-portal { display:none!important; }' });
  await page.screenshot({ path: 'test-results/photos-map.png' });
  await destination.getByRole('button', { name: 'Đóng thông tin điểm đến', exact: true }).click();
  await expect(destination).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden');
});
