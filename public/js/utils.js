// Funciones de ayuda compartidas
export const $ = (selector, root = document) => root.querySelector(selector);

// Escapa texto para insertarlo de forma segura en HTML
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const money = (n) => '$' + Number(n || 0).toLocaleString('es-AR');

// Minúsculas y sin tildes, para comparar texto escrito por el cliente
export const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const whatsappLink = (number, text) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

// Achica una imagen y la devuelve como data URL JPEG
export function resizeImage(file, maxSize = 600, quality = 0.7) {
  return new Promise((resolve) => {
    if (!file || !file.size) return resolve('');
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = img.width * k;
        canvas.height = img.height * k;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
