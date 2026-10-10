// Interfaz y lógica del asistente: muestra mensajes, abre nodos del menú y entiende texto libre.
import { CFG } from '../config.js';
import { $, esc, money, norm, whatsappLink, resizeImage } from '../utils.js';
import { ROOT, buildMenu, findNode, productCards } from './menu.js';
import { reservationCode, receiptWhatsappText, downloadReceiptImage } from '../receipt.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Devuelve { announceReservation(order) } para que la tienda avise cuando se hizo una reserva.
export function initChat(state, { reserve }) {
  const box = $('#chat');
  const msgs = $('#msgs');
  const getMenu = () => buildMenu(state.products);

  // ---------- Mensajes ----------
  function say(html, who) {
    const div = document.createElement('div');
    div.className = 'm ' + who;
    div.innerHTML = html;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // Mensaje del bot con indicador "escribiendo..."
  async function botSay(html) {
    const typing = document.createElement('div');
    typing.className = 'm bot';
    typing.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;
    await wait(600);
    typing.remove();
    say(html, 'bot');
  }

  // ---------- Menú ----------
  const optionButton = (node, extraClass = '') =>
    `<button type="button" class="opt ${extraClass}" data-node="${esc(node.id)}">${esc(node.label)}</button>`;

  // Botones de un nodo: sus hijos (si es grupo) y los de navegación (volver / menú principal)
  function optionsHtml(node, menu) {
    const buttons = node.children.map((id) => {
      const child = menu.get(id);
      return optionButton(child, child.kind === 'group' ? 'group' : '');
    });
    if (node.parent) {
      const parent = menu.get(node.parent);
      if (parent.id !== ROOT) buttons.push(optionButton({ id: parent.id, label: 'Volver a ' + parent.label }, 'nav'));
      buttons.push(optionButton({ id: ROOT, label: 'Menú principal' }, 'nav'));
    }
    return `<div class="opts">${buttons.join('')}</div>`;
  }

  async function openNode(id, { echo = false } = {}) {
    const menu = getMenu();
    const node = menu.get(id) || menu.get(ROOT);
    if (echo && node.id !== ROOT) say(esc(node.label), 'user');
    const content = node.render ? node.render() : node.text;
    await botSay(content + optionsHtml(node, menu));
  }

  // ---------- Producto en detalle ----------
  async function showDetail(id) {
    const p = state.products.find((x) => x.id === id);
    if (!p) return;
    say('Detalle de ' + esc(p.name), 'user');
    await botSay(
      (p.image ? `<img class="big" src="${p.image}" alt="">` : '') +
        `<b>${esc(p.name)}</b>\nCategoría: ${esc(p.category)}\nPrecio: <b>${money(p.price)}</b>\n` +
        (p.sizes ? `Talles: ${esc(p.sizes)}\n` : '') +
        `<div class="opts">` +
        (p.stock > 0 ? `<button type="button" class="opt" data-reserve="${p.id}">Reservar</button>` : '<small>Sin stock</small>') +
        `<a class="opt" target="_blank" rel="noopener" href="${whatsappLink(CFG.whatsapp, 'Hola! Quiero pedir: ' + p.name)}">Pedir por WhatsApp</a>` +
        `<button type="button" class="opt nav" data-node="${ROOT}">Menú principal</button></div>`
    );
  }

  // ---------- Texto libre ----------
  function findProduct(text) {
    const words = text.split(/\s+/).filter((w) => w.length > 3);
    return state.products.find((p) => words.some((w) => norm(p.name).includes(w)));
  }

  async function handleText(question) {
    const text = norm(question);
    if (/^(hola|buen|que tal)/.test(text)) return openNode(ROOT);

    const node = findNode(getMenu(), text);
    if (node) return openNode(node.id);

    const product = findProduct(text);
    if (product) return botSay('Mirá este:' + productCards([product]));

    const menu = getMenu();
    return botSay('No estoy seguro de entender. Elegí una opción del menú:' + optionsHtml(menu.get(ROOT), menu));
  }

  // ---------- Reserva hecha: el bot pide el comprobante ----------
  let lastReservation = null;

  function announceReservation(order) {
    lastReservation = order;
    box.classList.add('on');
    botSay(
      `Tu reserva <b>${esc(reservationCode(order.id))}</b> quedó registrada.\n` +
        'Enviame el comprobante de reserva por WhatsApp para confirmarla.' +
        '<div class="opts">' +
        `<a class="opt" target="_blank" rel="noopener" href="${whatsappLink(CFG.whatsapp, receiptWhatsappText(order))}">Enviar comprobante por WhatsApp</a>` +
        '<button type="button" class="opt" data-receipt>Descargar comprobante</button>' +
        `<button type="button" class="opt nav" data-node="${ROOT}">Menú principal</button></div>`
    );
  }

  // ---------- Eventos ----------
  // Un solo listener para todos los botones que aparecen dentro de los mensajes
  msgs.addEventListener('click', (e) => {
    const el = e.target.closest('[data-node], [data-detail], [data-reserve], [data-receipt]');
    if (!el) return;
    if (el.dataset.node) openNode(el.dataset.node, { echo: true });
    else if (el.dataset.detail) showDetail(Number(el.dataset.detail));
    else if (el.dataset.reserve) reserve(Number(el.dataset.reserve));
    else if ('receipt' in el.dataset && lastReservation) downloadReceiptImage(lastReservation);
  });

  $('#chatBtn').addEventListener('click', () => {
    box.classList.toggle('on');
    if (!msgs.children.length) openNode(ROOT);
  });
  $('#chatMenu').addEventListener('click', () => openNode(ROOT));
  $('#chatClose').addEventListener('click', () => box.classList.remove('on'));

  $('#chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#chatInput');
    const question = input.value.trim();
    if (!question) return;
    say(esc(question), 'user');
    input.value = '';
    handleText(question);
  });

  $('#chatImage').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await resizeImage(file);
    e.target.value = '';
    say(`<img class="big" src="${dataUrl}" alt="">`, 'user');
    await wait(700);
    say(
      'Linda foto. Mandanosla por ' +
        `<a target="_blank" rel="noopener" href="${whatsappLink(CFG.whatsapp, 'Hola! Quiero consultar por una prenda.')}">WhatsApp</a>` +
        ' y te buscamos algo igual o parecido.',
      'bot'
    );
  });

  return { announceReservation };
}
