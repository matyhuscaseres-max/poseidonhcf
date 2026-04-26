require('dotenv').config();

const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const COMMAND_QUEUE_FILE = path.join(DATA_DIR, 'command-queue.json');

const ADMIN_USER = String(process.env.ADMIN_USER || 'maty').trim();
const ADMIN_PASS = String(process.env.ADMIN_PASS || 'maty1234@').trim();
const FALLBACK_ADMIN_USER = 'maty';
const FALLBACK_ADMIN_PASS = 'maty1234@';
const SESSION_SECRET = process.env.SESSION_SECRET || 'poseidon-hcf-session';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_ENV = String(process.env.PAYPAL_ENV || 'live').toLowerCase();
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;
const PLUGIN_SHARED_SECRET = String(process.env.PLUGIN_SHARED_SECRET || 'poseidon-hcf-plugin-secret');
const PAYPAL_BASE = PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));
app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));

function defaultStore() {
  return {
    server: {
      name: 'Poseidon HCF',
      ip: 'play.poseidonhcf.xyz',
      discord: 'https://dsc.gg/poseidonhcf',
      tagline: 'Oceanic Commerce for Bedrock HCF'
    },
    theme: {
      primary: '#297bff',
      secondary: '#54e5ff',
      accent: '#7b6dff',
      background: '#04101d',
      panel: '#0d1a30',
      discord: '#5865F2',
      logoSize: 132,
      logoPulse: false
    },
    content: {
      heroTitle: 'Poseidon HCF',
      heroSubtitle: 'Tienda premium para Bedrock con acceso rápido, productos digitales y un panel fácil de editar.',
      terms: 'Todas las compras son digitales y voluntarias. Al pagar confirmas que la información del checkout es correcta y que autorizas el cobro.',
      privacy: 'Tratamos los datos personales de acuerdo con la Ley 1581 de 2012, el Decreto 1377 de 2013 y el Decreto 1074 de 2015. Recolectamos únicamente la información necesaria para procesar compras, validar pagos, gestionar soporte y mantener el historial de pedidos. El titular puede conocer, actualizar, rectificar y solicitar la supresión de sus datos, salvo cuando exista un deber legal o contractual de conservarlos. Esta tienda no vende datos personales y aplica medidas razonables de seguridad y confidencialidad.',
      refunds: 'Los reembolsos se revisan caso por caso cuando exista un error comprobable, una entrega fallida o un cobro duplicado.'
    },
    giftCards: [],
    rewardCodes: [],
    links: [],
    discounts: [],
    categories: [
      { id: 'ranks', name: 'Rangos', status: 'active' },
      { id: 'prefix', name: 'Prefix', status: 'active' },
      { id: 'cosmetics', name: 'Cosméticos', status: 'active' },
      { id: 'keys', name: 'Keys', status: 'active' },
      { id: 'donations', name: 'Donaciones', status: 'active' },
      { id: 'more', name: 'Más', status: 'active' },
      { id: 'unban', name: 'Unban', status: 'active' }
    ],
    products: [
      { id: 'poseidonplus', categoryId: 'ranks', name: 'PoseidonPlus', price: 2.99, currency: 'USD', badge: 'Rango', description: 'Rango inicial con estilo premium para empezar fuerte.', features: ['Kit inicial', 'Tag especial', 'Acceso rápido'], image: { src: '/assets/ranks/POSEIDON-PLUS-18-4-2026.gif', from: '#35e8ff', to: '#7c5cff', accent: 'rgba(53,232,255,.45)' } },
      { id: 'poseidon', categoryId: 'ranks', name: 'Poseidon', price: 4.99, currency: 'USD', badge: 'Rango', description: 'El rango clásico de la network con buenas ventajas.', features: ['Mejor kit', 'Beneficios HCF', 'Soporte prioritario'], image: { src: '/assets/ranks/POSEIDON-18-4-2026.gif', from: '#2d7bff', to: '#35e8ff', accent: 'rgba(124,92,255,.42)' } },
      { id: 'neptuno', categoryId: 'ranks', name: 'Neptuno', price: 6.99, currency: 'USD', badge: 'Rango', description: 'Un escalón más arriba con presencia elegante.', features: ['Tag premium', 'Key bonus', 'Acceso especial'], image: { src: '/assets/ranks/NEPTUNO-18-4-2026.gif', from: '#34c7ff', to: '#4d6cff', accent: 'rgba(52,199,255,.45)' } },
      { id: 'zeus', categoryId: 'ranks', name: 'Zeus', price: 9.99, currency: 'USD', badge: 'Rango', description: 'Uno de los rangos top para los más activos.', features: ['Cosmético básico', 'Kit pro', 'VIP support'], image: { src: '/assets/ranks/ZEUS-18-4-2026.gif', from: '#f4c96b', to: '#7c5cff', accent: 'rgba(244,201,107,.35)' } },
      { id: 'coral', categoryId: 'ranks', name: 'Coral', price: 1.99, currency: 'USD', badge: 'Rango', description: 'Opción barata para una network pequeña.', features: ['Precio low cost', 'Tag coral', 'Spawn perks'], image: { src: '/assets/ranks/CORAL-18-4-2026.gif', from: '#ff8ab3', to: '#35e8ff', accent: 'rgba(255,138,179,.4)' } },
      { id: 'prefix-dev', categoryId: 'prefix', name: 'Prefix en desarrollo', price: 0.99, currency: 'USD', badge: 'Dev', description: 'Sección reservada para prefix futuros.', features: ['Placeholder', 'En desarrollo', 'Editable luego'], image: { from: '#8892ff', to: '#35e8ff', accent: 'rgba(136,146,255,.4)' } },
      { id: 'cosmetic-dev', categoryId: 'cosmetics', name: 'Cosméticos en desarrollo', price: 0.99, currency: 'USD', badge: 'Dev', description: 'Bloque para cosméticos más adelante.', features: ['Placeholder', 'Editable', 'Visual limpio'], image: { from: '#7c5cff', to: '#35e8ff', accent: 'rgba(124,92,255,.4)' } },
      { id: 'koth', categoryId: 'keys', name: 'KOTH Key', price: 0.79, currency: 'USD', badge: 'Key', description: 'Key para loot KOTH.', features: ['Loot KOTH', 'Muy barata', 'Entrega rápida'], image: { from: '#f4c96b', to: '#ff8ab3', accent: 'rgba(244,201,107,.42)' } },
      { id: 'abilitys', categoryId: 'keys', name: 'ABILITYS Key', price: 0.99, currency: 'USD', badge: 'Key', description: 'Key enfocada en abilitys.', features: ['Abilitys', 'Precio bajo', 'Buen margen'], image: { from: '#35e8ff', to: '#7c5cff', accent: 'rgba(53,232,255,.45)' } },
      { id: 'aaa2026', categoryId: 'keys', name: '2026 AAA Key', price: 1.29, currency: 'USD', badge: 'Key', description: 'Key especial edición 2026 AAA.', features: ['Edición limitada', 'Loot especial', 'Más atractiva'], image: { from: '#2c7bff', to: '#f4c96b', accent: 'rgba(44,123,255,.45)' } },
      { id: 'supporter', categoryId: 'donations', name: 'Donación Supporter', price: 1.00, currency: 'USD', badge: 'Donate', description: 'Aporte simple para apoyar el proyecto.', features: ['Apoyo al server', 'Sin obligación', 'Ayuda real'], image: { from: '#f4c96b', to: '#35e8ff', accent: 'rgba(244,201,107,.35)' } },
      { id: 'boost', categoryId: 'donations', name: 'Donación Boost', price: 3.00, currency: 'USD', badge: 'Donate', description: 'Aporte medio para ayudar al crecimiento.', features: ['Ayuda extra', 'Apoyo directo', 'Muy útil'], image: { from: '#ff8ab3', to: '#7c5cff', accent: 'rgba(255,138,179,.35)' } },
      { id: 'ppkg', categoryId: 'more', name: 'PPKG EnderChest', price: 2.49, currency: 'USD', badge: 'Extra', description: 'EnderChest que da abilitys.', features: ['EnderChest', 'Abilitys', 'Buen precio'], image: { from: '#35e8ff', to: '#f4c96b', accent: 'rgba(53,232,255,.38)' } },
      { id: 'unmute', categoryId: 'unban', name: 'Unmute', price: 3.99, currency: 'USD', badge: 'Unban', description: 'Desmuteo para restaurar tu chat y volver a hablar en el servidor.', features: ['Desmuteo rápido', 'Nick vinculado', 'Entrega automática'], image: { src: '/assets/unban/unbanlogo.png', from: '#34c7ff', to: '#7b6dff', accent: 'rgba(52,199,255,.42)' } },
      { id: 'unban', categoryId: 'unban', name: 'Unban', price: 7.99, currency: 'USD', badge: 'Unban', description: 'Desbaneo estándar para volver a entrar con la cuenta sancionada.', features: ['Desbaneo estándar', 'Válido para Minecraft', 'Proceso simple'], image: { src: '/assets/unban/unbanlogo.png', from: '#2d7bff', to: '#35e8ff', accent: 'rgba(45,123,255,.42)' } },
      { id: 'unstrike', categoryId: 'unban', name: 'Unstrike', price: 5.99, currency: 'USD', badge: 'Unban', description: 'Quita una sanción tipo strike y deja el historial listo para seguir jugando.', features: ['Retiro de strike', 'Historial limpio', 'Atención prioritaria'], image: { src: '/assets/unban/unbanlogo.png', from: '#f4c96b', to: '#ff8ab3', accent: 'rgba(244,201,107,.36)' } },
      { id: 'unban-cheats', categoryId: 'unban', name: 'Unban para Cheats', price: 12.99, currency: 'USD', badge: 'Unban', description: 'Opción especial para sanciones relacionadas con cheats.', features: ['Revisión manual', 'Sanciones graves', 'Mayor prioridad'], image: { src: '/assets/unban/unbanlogo.png', from: '#ff8ab3', to: '#7c5cff', accent: 'rgba(255,138,179,.38)' } }
    ]
  };
}

function mergeDefaults(base, defaults) {
  const out = Array.isArray(defaults) ? [...defaults] : { ...defaults };
  if (Array.isArray(defaults)) return Array.isArray(base) ? base : out;
  for (const key of Object.keys(defaults)) {
    if (base && Object.prototype.hasOwnProperty.call(base, key)) {
      if (typeof defaults[key] === 'object' && defaults[key] && !Array.isArray(defaults[key])) {
        out[key] = mergeDefaults(base[key], defaults[key]);
      } else {
        out[key] = base[key];
      }
    }
  }
  return out;
}

function normalizeStore(input) {
  const d = defaultStore();
  const store = input && typeof input === 'object' ? input : {};
  const normalized = {
    ...d,
    ...store,
    server: mergeDefaults(store.server, d.server),
    theme: mergeDefaults(store.theme, d.theme),
    content: mergeDefaults(store.content, d.content),
    links: Array.isArray(store.links) ? store.links.map((link) => ({
      label: String(link?.label || '').trim(),
      url: String(link?.url || '').trim(),
      icon: String(link?.icon || '').trim()
    })).filter((link) => link.label && link.url) : d.links,
    discounts: Array.isArray(store.discounts) ? store.discounts : d.discounts,
    categories: Array.isArray(store.categories) ? store.categories : d.categories,
    products: Array.isArray(store.products) ? store.products : d.products,
    giftCards: Array.isArray(store.giftCards) ? store.giftCards : d.giftCards,
    rewardCodes: Array.isArray(store.rewardCodes) ? store.rewardCodes : d.rewardCodes
  };

  normalized.products = normalized.products.map((product, index) => {
    const rawInfo = product?.info && typeof product.info === 'object' ? product.info : {};
    const stickers = Array.isArray(rawInfo.stickers)
      ? rawInfo.stickers
      : String(rawInfo.stickers || '').split(',').map((s) => s.trim()).filter(Boolean);
    const gallery = Array.isArray(rawInfo.gallery)
      ? rawInfo.gallery
      : String(rawInfo.gallery || '').split(',').map((s) => s.trim()).filter(Boolean);
    const sections = Array.isArray(rawInfo.sections)
      ? rawInfo.sections
      : [];
    return {
      id: String(product?.id || `product-${index + 1}`).trim(),
      categoryId: String(product?.categoryId || 'more').trim(),
      name: String(product?.name || `Producto ${index + 1}`).trim(),
      price: Number(product?.price || 0),
      currency: String(product?.currency || 'USD').trim(),
      badge: String(product?.badge || 'Item').trim(),
      description: String(product?.description || '').trim(),
      commandTemplate: String(product?.commandTemplate || '').trim(),
      allowCustomAmount: Boolean(product?.allowCustomAmount),
      minPrice: Math.max(0, Number(product?.minPrice ?? product?.price ?? 0)),
      features: Array.isArray(product?.features)
        ? product.features.map((f) => String(f).trim()).filter(Boolean)
        : String(product?.features || '').split(',').map((f) => f.trim()).filter(Boolean),
      image: product?.image && typeof product.image === 'object'
        ? {
            src: String(product.image.src || '').trim(),
            from: String(product.image.from || '#297bff').trim(),
            to: String(product.image.to || '#54e5ff').trim(),
            accent: String(product.image.accent || 'rgba(84,229,255,.35)').trim()
          }
        : { src: '', from: '#297bff', to: '#54e5ff', accent: 'rgba(84,229,255,.35)' },
      info: {
        title: String(rawInfo.title || product?.name || '').trim(),
        subtitle: String(rawInfo.subtitle || product?.badge || '').trim(),
        description: String(rawInfo.description || product?.description || '').trim(),
        stickers: stickers.slice(0, 12),
        gallery: gallery.slice(0, 3),
        sections: sections.slice(0, 3).map((section) => ({
          title: String(section?.title || '').trim(),
          text: String(section?.text || '').trim()
        })).filter((section) => section.title || section.text)
      }
    };
  });

  normalized.categories = normalized.categories.map((category, index) => {
    const rawStatus = String(category?.status || 'active').trim().toLowerCase();
    const status = rawStatus === 'coming-soon' ? 'active' : (rawStatus || 'active');
    return {
      id: String(category?.id || `category-${index + 1}`).trim(),
      name: String(category?.name || `Categoría ${index + 1}`).trim(),
      status,
      icon: String(category?.icon || '').trim()
    };
  });

  normalized.discounts = normalized.discounts.map((discount, index) => normalizeDiscount(discount, index));
  normalized.rewardCodes = normalized.rewardCodes.map((rewardCode, index) => normalizeRewardCode(rewardCode, index));

  return normalized;
}

function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify(defaultStore(), null, 2));
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(COMMAND_QUEUE_FILE)) {
    fs.writeFileSync(COMMAND_QUEUE_FILE, JSON.stringify({ items: [] }, null, 2));
  }
}

function loadStore() {
  ensureData();
  const parsed = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  const store = normalizeStore(parsed);
  store.giftCards = Array.isArray(store.giftCards) ? store.giftCards.map(normalizeGiftCard) : [];
  store.rewardCodes = Array.isArray(store.rewardCodes) ? store.rewardCodes.map(normalizeRewardCode) : [];
  return store;
}

function saveStore(store) {
  const normalized = normalizeStore(store);
  normalized.giftCards = Array.isArray(store?.giftCards) ? store.giftCards.map(normalizeGiftCard) : [];
  normalized.rewardCodes = Array.isArray(store?.rewardCodes) ? store.rewardCodes.map(normalizeRewardCode) : [];
  fs.writeFileSync(STORE_FILE, JSON.stringify(normalized, null, 2));
}

function loadOrders() {
  ensureData();
  return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
}

function saveOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function generateGiftCode() {
  return `GIFT-${crypto.randomBytes(3).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

function normalizeGiftCard(card, index = 0) {
  const balance = Number(card?.balance ?? card?.remainingBalance ?? card?.price ?? 0);
  const originalBalance = Number(card?.originalBalance ?? card?.balance ?? card?.price ?? balance);
  const code = String(card?.code || '').trim().toUpperCase();
  return {
    id: String(card?.id || `giftcard-${index + 1}`).trim(),
    code: code || generateGiftCode(),
    originalBalance: Number.isFinite(originalBalance) ? originalBalance : 0,
    balance: Number.isFinite(balance) ? balance : 0,
    active: card?.active !== false,
    note: String(card?.note || '').trim(),
    createdAt: String(card?.createdAt || new Date().toISOString()),
    updatedAt: String(card?.updatedAt || new Date().toISOString())
  };
}

function normalizeDiscount(discount, index = 0) {
  const percent = Number(discount?.percent ?? discount?.value ?? 0);
  return {
    id: String(discount?.id || `discount-${index + 1}`).trim(),
    name: String(discount?.name || discount?.label || `Descuento ${index + 1}`).trim(),
    percent: Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0)),
    active: discount?.active !== false,
    description: String(discount?.description || '').trim(),
    scope: String(discount?.scope || 'global').trim(),
    categoryId: String(discount?.categoryId || '').trim(),
    createdAt: String(discount?.createdAt || new Date().toISOString()),
    updatedAt: String(discount?.updatedAt || new Date().toISOString())
  };
}

function normalizeRewardCode(rewardCode, index = 0) {
  const claims = Array.isArray(rewardCode?.claims)
    ? rewardCode.claims.map((claim) => ({
        minecraftNick: String(claim?.minecraftNick || '').trim(),
        claimedAt: String(claim?.claimedAt || new Date().toISOString())
      })).filter((claim) => claim.minecraftNick)
    : [];

  return {
    id: String(rewardCode?.id || `reward-code-${index + 1}`).trim(),
    code: String(rewardCode?.code || '').trim().toUpperCase().replace(/\s+/g, ''),
    productId: String(rewardCode?.productId || '').trim(),
    maxUses: Math.max(1, Number(rewardCode?.maxUses ?? 1) || 1),
    active: rewardCode?.active !== false,
    note: String(rewardCode?.note || '').trim(),
    successMessage: String(rewardCode?.successMessage || '').trim(),
    expiresAt: String(rewardCode?.expiresAt || '').trim(),
    claims,
    createdAt: String(rewardCode?.createdAt || new Date().toISOString()),
    updatedAt: String(rewardCode?.updatedAt || new Date().toISOString())
  };
}

function findGiftCard(store, code) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return null;
  const cards = Array.isArray(store.giftCards) ? store.giftCards : [];
  return cards.find((card) => String(card.code || '').trim().toUpperCase() === normalized) || null;
}

function findRewardCode(store, code) {
  const normalized = String(code || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!normalized) return null;
  const rewardCodes = Array.isArray(store.rewardCodes) ? store.rewardCodes : [];
  return rewardCodes.find((rewardCode) => String(rewardCode.code || '').trim().toUpperCase() === normalized) || null;
}

function isRewardCodeExpired(rewardCode) {
  if (!rewardCode?.expiresAt) return false;
  const expiresAt = Date.parse(rewardCode.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt < Date.now();
}

function getRewardCodeUses(rewardCode) {
  return Array.isArray(rewardCode?.claims) ? rewardCode.claims.length : 0;
}


function normalizeCommandQueueItem(item, index = 0) {
  const status = String(item?.status || 'pending').trim().toLowerCase();
  return {
    id: String(item?.id || `cmd-${index + 1}`).trim(),
    orderId: String(item?.orderId || '').trim(),
    productId: String(item?.productId || '').trim(),
    productName: String(item?.productName || '').trim(),
    minecraftNick: String(item?.minecraftNick || '').trim(),
    command: String(item?.command || '').trim(),
    status: ['pending', 'processing', 'done', 'failed'].includes(status) ? status : 'pending',
    attempts: Number(item?.attempts || 0),
    createdAt: String(item?.createdAt || new Date().toISOString()),
    lockedAt: String(item?.lockedAt || ''),
    lastError: String(item?.lastError || '')
  };
}

function loadCommandQueue() {
  ensureData();
  try {
    const parsed = JSON.parse(fs.readFileSync(COMMAND_QUEUE_FILE, 'utf8'));
    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    return { items: items.map(normalizeCommandQueueItem) };
  } catch {
    return { items: [] };
  }
}

function saveCommandQueue(queue) {
  const items = Array.isArray(queue?.items) ? queue.items.map(normalizeCommandQueueItem) : [];
  fs.writeFileSync(COMMAND_QUEUE_FILE, JSON.stringify({ items }, null, 2));
}

function renderCommandTemplate(template, order, product) {
  const replacements = {
    '{nick}': order.minecraftNick,
    '{player}': order.minecraftNick,
    '{product}': product.name,
    '{productId}': product.id,
    '{orderId}': order.orderId,
    '{internalId}': order.internalId,
    '{amount}': Number(order.amount || 0).toFixed(2),
    '{currency}': order.currency || product.currency || 'USD'
  };

  let output = String(template || '');
  for (const [token, value] of Object.entries(replacements)) {
    output = output.split(token).join(String(value));
  }
  return output.trim();
}

function resolveOrderAmount(product, customAmount) {
  const basePrice = Number(product?.price || 0);
  if (!product?.allowCustomAmount) {
    return basePrice;
  }

  const minPrice = Math.max(0, Number(product?.minPrice ?? product?.price ?? 0));
  const amount = Number(customAmount);
  if (!Number.isFinite(amount) || amount < minPrice) {
    throw new Error(`Custom amount must be at least ${minPrice.toFixed(2)}`);
  }
  return Number(amount.toFixed(2));
}

function enqueueCommandsForOrder(order, product) {
  const template = String(product?.commandTemplate || '').trim();
  if (!template) return [];

  const commands = template
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => renderCommandTemplate(line, order, product))
    .filter(Boolean);

  if (!commands.length) return [];

  const queue = loadCommandQueue();
  const createdAt = new Date().toISOString();
  const entries = commands.map((command, index) => ({
    id: `cmd-${crypto.randomUUID()}`,
    orderId: order.orderId,
    productId: product.id,
    productName: product.name,
    minecraftNick: order.minecraftNick,
    command,
    status: 'pending',
    attempts: 0,
    createdAt,
    lockedAt: '',
    lastError: '',
    sequence: index + 1,
    totalCommands: commands.length
  }));

  queue.items.push(...entries);
  saveCommandQueue(queue);
  return entries;
}

function getPluginSecret(req) {
  return String(req.header('x-plugin-secret') || req.header('authorization') || req.query.secret || '').replace(/^Bearer\s+/i, '').trim();
}

function requirePlugin(req, res, next) {
  if (PLUGIN_SHARED_SECRET && getPluginSecret(req) === PLUGIN_SHARED_SECRET) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

function claimCommandBatch(limit = 10) {
  const queue = loadCommandQueue();
  const now = Date.now();
  const staleMs = 5 * 60 * 1000;
  let changed = false;

  queue.items = queue.items.map((item) => {
    if (item.status === 'processing' && item.lockedAt) {
      const lockedTime = Date.parse(item.lockedAt);
      if (Number.isFinite(lockedTime) && now - lockedTime > staleMs) {
        changed = true;
        return { ...item, status: 'pending', lockedAt: '', lastError: '' };
      }
    }
    return item;
  });

  const selected = [];
  for (const item of queue.items) {
    if (selected.length >= limit) break;
    if (item.status !== 'pending') continue;
    item.status = 'processing';
    item.lockedAt = new Date().toISOString();
    item.attempts = Number(item.attempts || 0) + 1;
    selected.push({ ...item });
    changed = true;
  }

  if (changed) saveCommandQueue(queue);
  return selected;
}
function addCapturedOrder({ minecraftNick, product, paymentMethod, giftCardCode = '', giftCardId = '', amountOverride = null }) {
  const orders = loadOrders();
  const amount = amountOverride === null ? Number(product.price) : Number(amountOverride);
  const completedAt = new Date().toISOString();
  const order = {
    internalId: crypto.randomUUID(),
    orderId: `${paymentMethod}-${crypto.randomUUID()}`,
    minecraftNick: String(minecraftNick).trim(),
    productId: product.id,
    productName: product.name,
    amount,
    currency: product.currency || 'USD',
    status: 'captured',
    paymentMethod,
    giftCardCode,
    giftCardId,
    createdAt: completedAt,
    completedAt
  };
  orders.push(order);
  saveOrders(orders);
  enqueueCommandsForOrder(order, product);
  return order;
}

function requireAdmin(req, res, next) {
  if (req.session?.admin) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

function formatMoney(v, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(v || 0));
}

async function paypalAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials are missing');
  }
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const resp = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  if (!resp.ok) throw new Error(`PayPal token request failed: ${resp.status}`);
  const data = await resp.json();
  return data.access_token;
}

async function paypalCreateOrder(amount, currency, note) {
  const token = await paypalAccessToken();
  const resp = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: currency, value: Number(amount || 0).toFixed(2) }, description: note }],
      application_context: {
        brand_name: 'Poseidon HCF',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW'
      }
    })
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`PayPal create order failed: ${resp.status} ${text}`);
  }
  return resp.json();
}

async function paypalCaptureOrder(orderId) {
  const token = await paypalAccessToken();
  const resp = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`PayPal capture failed: ${resp.status} ${text}`);
  }
  return resp.json();
}

app.get('/api/store', (req, res) => {
  const store = loadStore();
  const orders = loadOrders().filter((o) => o.status === 'captured');
  const buyers = orders.slice().reverse().slice(0, 12).map((o) => ({
    minecraftNick: o.minecraftNick,
    productName: o.productName,
    amount: o.amount,
    currency: o.currency,
    completedAt: o.completedAt
  }));

  res.json({
    server: store.server,
    theme: store.theme,
    content: store.content,
    links: store.links,
    discounts: store.discounts,
    categories: store.categories,
    products: store.products,
    giftCards: store.giftCards,
    buyers,
    paypalClientId: PAYPAL_CLIENT_ID,
    paypalEnv: PAYPAL_ENV,
    paypalReady: Boolean(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET)
  });
});

app.post('/api/create-order', async (req, res) => {
  try {
    const { minecraftNick, productId, customAmount } = req.body || {};
    if (!minecraftNick || String(minecraftNick).trim().length < 3) {
      return res.status(400).json({ error: 'Minecraft nick is required' });
    }
    const store = loadStore();
    const product = store.products.find((p) => p.id === productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const amount = resolveOrderAmount(product, customAmount);
    const order = await paypalCreateOrder(amount, product.currency || 'USD', `${product.name} • ${minecraftNick}`);

    const orders = loadOrders();
    orders.push({
      internalId: crypto.randomUUID(),
      orderId: order.id,
      minecraftNick: String(minecraftNick).trim(),
      productId: product.id,
      productName: product.name,
      amount,
      currency: product.currency || 'USD',
      status: 'created',
      createdAt: new Date().toISOString(),
      paypal: { id: order.id }
    });
    saveOrders(orders);

    res.json({ id: order.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/capture-order', async (req, res) => {
  try {
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    const orders = loadOrders();
    const idx = orders.findIndex((o) => o.orderId === orderId);
    if (idx === -1) return res.status(404).json({ error: 'Order not found' });

    const existing = orders[idx];
    if (existing.status === 'captured') {
      return res.json({ duplicate: true, order: existing });
    }

    const capture = await paypalCaptureOrder(orderId);
    const completedAt = new Date().toISOString();
    orders[idx] = {
      ...existing,
      status: 'captured',
      completedAt,
      paypal: capture
    };
    saveOrders(orders);

    const store = loadStore();
    const product = store.products.find((item) => item.id === existing.productId);
    if (product) {
      enqueueCommandsForOrder(orders[idx], product);
    }

    res.json({ duplicate: false, order: orders[idx], capture });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/redeem-gift-card', (req, res) => {
  try {
    const { minecraftNick, productId, code, customAmount } = req.body || {};
    if (!minecraftNick || String(minecraftNick).trim().length < 3) {
      return res.status(400).json({ error: 'Minecraft nick is required' });
    }
    if (!code || !String(code).trim()) {
      return res.status(400).json({ error: 'Gift card code is required' });
    }

    const store = loadStore();
    const product = store.products.find((p) => p.id === productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const amount = resolveOrderAmount(product, customAmount);

    const giftCard = findGiftCard(store, code);
    if (!giftCard) return res.status(404).json({ error: 'Gift card not found' });
    if (!giftCard.active) return res.status(400).json({ error: 'Gift card is disabled' });

    const price = amount;
    const balance = Number(giftCard.balance || 0);
    if (balance < price) {
      return res.status(400).json({ error: 'Gift card balance is not enough' });
    }

    giftCard.balance = Number((balance - price).toFixed(2));
    giftCard.updatedAt = new Date().toISOString();
    if (giftCard.balance <= 0) giftCard.active = false;
    store.giftCards = store.giftCards.map((card) => card.id === giftCard.id ? giftCard : card);
    saveStore(store);

    const order = addCapturedOrder({
      minecraftNick,
      product,
      paymentMethod: 'gift_card',
      giftCardCode: giftCard.code,
      giftCardId: giftCard.id,
      amountOverride: amount
    });

    res.json({ ok: true, order, giftCard: { code: giftCard.code, balance: giftCard.balance, active: giftCard.active } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/redeem-reward-code', (req, res) => {
  try {
    const { minecraftNick, code } = req.body || {};
    if (!minecraftNick || String(minecraftNick).trim().length < 3) {
      return res.status(400).json({ error: 'Minecraft nick is required' });
    }
    if (!code || !String(code).trim()) {
      return res.status(400).json({ error: 'Reward code is required' });
    }

    const store = loadStore();
    const rewardCode = findRewardCode(store, code);
    if (!rewardCode) return res.status(404).json({ error: 'Reward code not found' });
    if (!rewardCode.active) return res.status(400).json({ error: 'Reward code is disabled' });
    if (isRewardCodeExpired(rewardCode)) return res.status(400).json({ error: 'Reward code has expired' });

    const uses = getRewardCodeUses(rewardCode);
    if (uses >= Number(rewardCode.maxUses || 1)) {
      return res.status(400).json({ error: 'Reward code has reached its usage limit' });
    }

    const product = store.products.find((item) => item.id === rewardCode.productId);
    if (!product) return res.status(404).json({ error: 'Reward product not found' });

    rewardCode.claims = [...(rewardCode.claims || []), {
      minecraftNick: String(minecraftNick).trim(),
      claimedAt: new Date().toISOString()
    }];
    rewardCode.updatedAt = new Date().toISOString();
    if (getRewardCodeUses(rewardCode) >= Number(rewardCode.maxUses || 1)) {
      rewardCode.active = false;
    }

    store.rewardCodes = store.rewardCodes.map((item) => item.id === rewardCode.id ? rewardCode : item);
    saveStore(store);

    const order = addCapturedOrder({
      minecraftNick,
      product,
      paymentMethod: 'reward_code',
      amountOverride: 0
    });

    res.json({
      ok: true,
      order,
      reward: {
        code: rewardCode.code,
        productName: product.name,
        successMessage: rewardCode.successMessage || `Felicidades, canjeaste ${product.name}.`
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = String(username || '').trim();
  const pass = String(password || '').trim();
  const valid = (user === ADMIN_USER && pass === ADMIN_PASS) || (user === FALLBACK_ADMIN_USER && pass === FALLBACK_ADMIN_PASS);
  if (valid) {
    req.session.admin = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/admin/dashboard', requireAdmin, (req, res) => {
  const store = loadStore();
  const orders = loadOrders().slice().reverse();
  const captured = orders.filter((o) => o.status === 'captured');
  const totalRevenue = captured.reduce((sum, o) => sum + Number(o.amount || 0), 0);
  const giftCardSales = captured.filter((o) => o.paymentMethod === 'gift_card').length;
  const rewardCodeRedemptions = captured.filter((o) => o.paymentMethod === 'reward_code').length;

  res.json({
    store,
    orders,
    stats: {
      totalSales: captured.length,
      totalRevenue,
      giftCardSales,
      rewardCodeRedemptions,
      buyers: captured.map((o) => o.minecraftNick)
    }
  });
});

app.put('/api/admin/store', requireAdmin, (req, res) => {
  try {
    const payload = req.body || {};
    const store = loadStore();

    if (payload.server) store.server = { ...store.server, ...payload.server };
    if (payload.theme) store.theme = { ...store.theme, ...payload.theme };
    if (payload.content) store.content = { ...store.content, ...payload.content };
    if (Array.isArray(payload.links)) store.links = payload.links;
    if (Array.isArray(payload.discounts)) store.discounts = payload.discounts;
    if (Array.isArray(payload.categories)) store.categories = payload.categories;
    if (Array.isArray(payload.products)) store.products = payload.products;
    if (Array.isArray(payload.giftCards)) store.giftCards = payload.giftCards;
    if (Array.isArray(payload.rewardCodes)) store.rewardCodes = payload.rewardCodes;

    saveStore(store);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/plugin/claim', requirePlugin, (req, res) => {
  try {
    const limit = Math.max(1, Math.min(50, Number(req.body?.limit ?? req.query.limit ?? 10) || 10));
    const items = claimCommandBatch(limit);
    res.json({ ok: true, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/plugin/ack', requirePlugin, (req, res) => {
  try {
    const ids = new Set((req.body?.ids || []).map((id) => String(id).trim()).filter(Boolean));
    const queue = loadCommandQueue();
    const before = queue.items.length;
    queue.items = queue.items.filter((item) => !ids.has(item.id));
    saveCommandQueue(queue);
    res.json({ ok: true, removed: before - queue.items.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/plugin/health', requirePlugin, (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.get('/', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
app.get('/terms.html', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'terms.html')));
app.get('/privacy.html', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'privacy.html')));
app.get('/refunds.html', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'refunds.html')));

app.get('/healthz', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  ensureData();
  console.log(`Poseidon HCF running at ${PUBLIC_URL}`);
});
