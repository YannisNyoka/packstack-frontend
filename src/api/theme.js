import { apiFetch, apiUpload } from './client.js';

export function getTheme() {
  return apiFetch('/settings/theme');
}

export function updateTheme(data) {
  return apiFetch('/settings/theme', { method: 'PATCH', body: data });
}

function uploadImage(path, file) {
  const formData = new FormData();
  formData.append('image', file);
  return apiUpload(path, formData);
}

export function uploadLogo(file) {
  return uploadImage('/settings/theme/logo', file);
}

export function uploadBanner(file) {
  return uploadImage('/settings/theme/banner', file);
}

export function uploadHeroVideo(file) {
  const formData = new FormData();
  formData.append('video', file);
  return apiUpload('/settings/theme/hero-video', formData);
}
