// Menú del asistente, definido como un árbol de nodos.
//
//  - kind "group": muestra un texto y botones con sus hijos (se abre al tocarlo).
//  - kind "leaf":  muestra su contenido final.
//  - re:           palabras que activan el nodo si el cliente escribe en vez de tocar.
//
// Para agregar un tema nuevo, sumá una línea add({...}) más abajo.
import { CFG } from '../config.js';
import { esc, money, norm, escapeRegExp, whatsappLink } from '../utils.js';

export const ROOT = 'root';

// ---------- Piezas de HTML reutilizables ----------
const waAnchor = (label, text) =>
  `<a target="_blank" rel="noopener" href="${whatsappLink(CFG.whatsapp, text)}">${label}</a>`;

export const productCards = (list) =>
  '<div class="carousel">' +
  list
    .map(
      (p) => `<div class="pcard">
        ${p.image ? `<img src="${p.image}" alt="">` : '<div class="ph">LPRK</div>'}
        <b>${esc(p.name)}</b>
        <span>${money(p.price)}</span>
        <button type="button" data-detail="${p.id}">Ver detalle</button>
        <a target="_blank" rel="noopener" href="${whatsappLink(CFG.whatsapp, 'Hola! Me interesa: ' + p.name)}">WhatsApp</a>
      </div>`
    )
    .join('') +
  '</div>';

// ---------- Construcción del árbol ----------
export function buildMenu(products) {
  const nodes = new Map();
  const add = (node) => {
    nodes.set(node.id, { children: [], ...node });
    if (node.parent) nodes.get(node.parent).children.push(node.id);
  };

  add({
    id: ROOT,
    kind: 'group',
    label: 'Menú principal',
    text: `Hola, soy el asistente de ${esc(CFG.nombre)}. ¿Sobre qué querés consultar?`,
  });

  // Grupo: Productos (una opción por cada categoría cargada)
  add({
    id: 'productos',
    parent: ROOT,
    kind: 'group',
    label: 'Productos',
    re: /producto|prenda|ropa/,
    text: products.length ? '¿Qué querés ver?' : 'Estamos cargando productos, volvé pronto.',
  });
  [...new Set(products.map((p) => p.category))].forEach((category) =>
    add({
      id: 'cat:' + category,
      parent: 'productos',
      kind: 'leaf',
      label: category,
      re: new RegExp(escapeRegExp(norm(category).slice(0, 5))),
      render: () => `Esto tenemos en <b>${esc(category)}</b>:` + productCards(products.filter((p) => p.category === category)),
    })
  );
  if (products.length) {
    add({
      id: 'catalogo',
      parent: 'productos',
      kind: 'leaf',
      label: 'Ver todo el catálogo',
      re: /catalogo|ver todo|novedades|mostrame|que (tienen|venden)/,
      render: () => 'Estas son nuestras prendas:' + productCards(products.slice(0, 8)),
    });
  }

  // Grupo: Envíos y pagos
  add({ id: 'envios-pagos', parent: ROOT, kind: 'group', label: 'Envíos y pagos', text: '¿Qué querés saber?' });
  add({ id: 'envios', parent: 'envios-pagos', kind: 'leaf', label: 'Envíos', re: /envio|despacho|correo|entrega/, text: esc(CFG.envios) });
  add({ id: 'pagos', parent: 'envios-pagos', kind: 'leaf', label: 'Formas de pago', re: /pago|tarjeta|transfer|efectivo|cuota|mercado/, text: esc(CFG.pagos) });
  add({ id: 'cambios', parent: 'envios-pagos', kind: 'leaf', label: 'Cambios y devoluciones', re: /cambio|devoluc/, text: esc(CFG.cambios) });

  // Grupo: Nuestro local
  add({ id: 'local', parent: ROOT, kind: 'group', label: 'Nuestro local', text: '¿Qué querés saber?' });
  add({ id: 'horarios', parent: 'local', kind: 'leaf', label: 'Horarios', re: /horario|abierto|abren|cierran|hora/, text: esc(CFG.horario) });
  add({ id: 'ubicacion', parent: 'local', kind: 'leaf', label: 'Ubicación', re: /direcci|ubicaci|donde|local|retiro/, text: esc(CFG.direccion) });

  // Temas sueltos
  add({
    id: 'talles',
    parent: ROOT,
    kind: 'leaf',
    label: 'Talles y medidas',
    re: /talle|medida|size/,
    render: () =>
      'Cada producto indica sus talles. Si dudás cuál te queda, pasanos tus medidas por ' +
      waAnchor('WhatsApp', 'Hola! Quiero consultar por talles.') + '.',
  });
  add({
    id: 'persona',
    parent: ROOT,
    kind: 'leaf',
    label: 'Hablar con una persona',
    re: /humano|persona|asesor|vendedor|whats/,
    render: () => 'Con gusto: podés ' + waAnchor('escribirnos por WhatsApp', 'Hola! Quiero hacer una consulta.') + ' y te atiende una persona.',
  });

  return nodes;
}

// ---------- Búsqueda por texto libre ----------
// Primero los temas puntuales (hojas) y después los grupos.
export function findNode(nodes, text) {
  const candidates = [...nodes.values()].filter((n) => n.re);
  const leaf = candidates.find((n) => n.kind === 'leaf' && n.re.test(text));
  return leaf || candidates.find((n) => n.kind === 'group' && n.re.test(text));
}
