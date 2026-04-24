const state = {
  store: null,
  selectedCategory: '',
  selectedProductId: '',
  paypalButtons: null,
  adminVisible: false,
  playerName: '',
  activeProductInfoId: '',
  selectedPaymentMethod: 'paypal',
  audioEnabled: storageGet('poseidon_sound_enabled', '1') !== '0',
  audioContext: null,
  lastHoverSound: 0,
  lastTypeSound: 0
};

const refs = {
  serverName: document.getElementById('server-name'),
  serverTagline: document.getElementById('server-tagline'),
  serverIpText: document.getElementById('server-ip-text'),
  copyIpBtn: document.getElementById('copy-ip-btn'),
  discordLink: document.getElementById('discord-link'),
  headerLinks: document.getElementById('header-links'),
  metricProducts: document.getElementById('metric-products'),
  metricBuyers: document.getElementById('metric-buyers'),
  categoryList: document.getElementById('category-list'),
  catalog: document.getElementById('catalog'),
  activeCatEyebrow: document.getElementById('active-cat-eyebrow'),
  activeCatName: document.getElementById('active-cat-name'),
  buyersList: document.getElementById('buyers-list'),
  productSelect: document.getElementById('product-select'),
  paymentMethod: document.getElementById('payment-method'),
  checkoutName: document.getElementById('checkout-name'),
  checkoutPrice: document.getElementById('checkout-price'),
  checkoutDescription: document.getElementById('checkout-description'),
  checkoutUser: document.getElementById('checkout-user'),
  paymentStatus: document.getElementById('payment-status'),
  discountBanner: document.getElementById('discount-banner'),
  giftCardPanel: document.getElementById('gift-card-panel'),
  giftCardCode: document.getElementById('gift-card-code'),
  giftCardPayBtn: document.getElementById('gift-card-pay-btn'),
  minecraftNick: document.getElementById('minecraft-nick'),
  checkoutFeedback: document.getElementById('checkout-feedback'),
  entryOverlay: document.getElementById('entry-overlay'),
  playerName: document.getElementById('player-name'),
  enterStoreBtn: document.getElementById('enter-store-btn'),
  loginBtn: document.getElementById('login-btn'),
  adminShell: document.getElementById('admin-shell'),
  adminLogin: document.getElementById('admin-login'),
  adminDashboard: document.getElementById('admin-dashboard'),
  adminUser: document.getElementById('admin-user'),
  adminPass: document.getElementById('admin-pass'),
  adminLoginBtn: document.getElementById('admin-login-btn'),
  adminLogoutBtn: document.getElementById('admin-logout-btn'),
  adminLoginFeedback: document.getElementById('admin-login-feedback'),
  statsGrid: document.getElementById('stats-grid'),
  adminServerName: document.getElementById('admin-server-name'),
  adminServerTagline: document.getElementById('admin-server-tagline'),
  adminServerIp: document.getElementById('admin-server-ip'),
  adminServerDiscord: document.getElementById('admin-server-discord'),
  adminThemePrimary: document.getElementById('admin-theme-primary'),
  adminThemeSecondary: document.getElementById('admin-theme-secondary'),
  adminThemeAccent: document.getElementById('admin-theme-accent'),
  adminThemeBg: document.getElementById('admin-theme-bg'),
  adminThemePanel: document.getElementById('admin-theme-panel'),
  adminDiscordColor: document.getElementById('admin-discord-color'),
  adminLogoSize: document.getElementById('admin-logo-size'),
  adminLogoPulse: document.getElementById('admin-logo-pulse'),
  adminHeroTitle: document.getElementById('admin-hero-title'),
  adminHeroSubtitle: document.getElementById('admin-hero-subtitle'),
  adminTermsText: document.getElementById('admin-terms-text'),
  adminPrivacyText: document.getElementById('admin-privacy-text'),
  adminRefundsText: document.getElementById('admin-refunds-text'),
  adminLinkList: document.getElementById('admin-link-list'),
  addLinkBtn: document.getElementById('add-link-btn'),
  productEditor: document.getElementById('product-editor'),
  addProductBtn: document.getElementById('add-product-btn'),
  addGiftCardBtn: document.getElementById('add-gift-card-btn'),
  giftCardEditor: document.getElementById('gift-card-editor'),
  addDiscountBtn: document.getElementById('add-discount-btn'),
  discountEditor: document.getElementById('discount-editor'),
  addCategoryBtn: document.getElementById('add-category-btn'),
  categoryEditor: document.getElementById('category-editor'),
  saveStoreBtn: document.getElementById('save-store-btn'),
  adminSaveFeedback: document.getElementById('admin-save-feedback'),
  salesTableBody: document.getElementById('sales-table-body'),
  termsCardTitle: document.getElementById('terms-card-title'),
  termsCardText: document.getElementById('terms-card-text'),
  privacyCardTitle: document.getElementById('privacy-card-title'),
  privacyCardText: document.getElementById('privacy-card-text'),
  refundsCardTitle: document.getElementById('refunds-card-title'),
  refundsCardText: document.getElementById('refunds-card-text'),
  productCardTemplate: document.getElementById('product-card-template'),
  productInfoModal: document.getElementById('product-info-modal'),
  productInfoClose: document.getElementById('product-info-close'),
  productInfoIcon: document.getElementById('product-info-icon'),
  productInfoBadge: document.getElementById('product-info-badge'),
  productInfoTitle: document.getElementById('product-info-title'),
  productInfoSubtitle: document.getElementById('product-info-subtitle'),
  productInfoPrice: document.getElementById('product-info-price'),
  productInfoDescription: document.getElementById('product-info-description'),
  productInfoStickers: document.getElementById('product-info-stickers'),
  productInfoSections: document.getElementById('product-info-sections'),
  productInfoGallery: document.getElementById('product-info-gallery'),
  soundToggle: document.getElementById('sound-toggle')
};

const FALLBACK_ICONS = {
  ranks: '👑', prefix: '🏷️', cosmetics: '✨', keys: '🗝️', donations: '💙', more: '⚡', unban: '⛔'
};

function safeText(v) { return String(v ?? ''); }
function storageGet(key, fallback = '') { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } }
function storageSet(key, value) { try { localStorage.setItem(key, value); } catch {} }

async function api(path, options = {}) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function formatPrice(price, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(price || 0));
}

function normalizePercent(value) {
  const n = Number(value || 0);
  return Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));
}

function getActiveDiscounts() {
  return (state.store?.discounts || []).filter((discount) => discount.active !== false && normalizePercent(discount.percent) > 0);
}

function renderDiscountBanner() {
  if (!refs.discountBanner) return;
  const active = getActiveDiscounts();
  refs.discountBanner.innerHTML = '';
  if (!active.length) {
    refs.discountBanner.classList.add('hidden');
    return;
  }
  const strong = document.createElement('strong');
  strong.textContent = 'Descuentos activos';
  const span = document.createElement('span');
  span.textContent = active.map((discount) => `${discount.name || 'Descuento'} ${normalizePercent(discount.percent)}%`).join(' • ');
  refs.discountBanner.append(strong, span);
  refs.discountBanner.classList.remove('hidden');
}

function generateGiftCode() {
  const chunk = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GIFT-${chunk()}-${chunk()}`;
}

function ensureAudio() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!state.audioContext || state.audioContext.state === 'closed') {
      state.audioContext = new Ctx();
    }
    if (state.audioContext.state === 'suspended') state.audioContext.resume().catch(() => {});
    return state.audioContext;
  } catch {
    return null;
  }
}

function playUiSound(type) {
  if (!state.audioEnabled) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  const tones = { click: [620, 0.03, 0.045], hover: [420, 0.012, 0.03], type: [760, 0.018, 0.02] };
  const [freq, gainValue, duration] = tones[type] || tones.click;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type === 'hover' ? 'sine' : 'triangle';
  osc.frequency.value = freq;
  gain.gain.value = 0.0001;
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.exponentialRampToValueAtTime(Math.max(gainValue, 0.0001), now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.start(now);
  osc.stop(now + duration + 0.01);
}

function syncSoundToggle() {
  if (!refs.soundToggle) return;
  refs.soundToggle.textContent = state.audioEnabled ? '🔊 Sonido' : '🔇 Sonido';
  refs.soundToggle.setAttribute('aria-pressed', String(state.audioEnabled));
}

function setSoundEnabled(enabled) {
  state.audioEnabled = Boolean(enabled);
  storageSet('poseidon_sound_enabled', state.audioEnabled ? '1' : '0');
  syncSoundToggle();
}

function initSoundSystem() {
  syncSoundToggle();
  const prime = () => ensureAudio();
  document.addEventListener('click', prime, { once: true, capture: true });
  document.addEventListener('keydown', prime, { once: true, capture: true });
  document.addEventListener('click', (e) => {
    if (e.target.closest('button, .button, .pill, .copy-mini, .product-info-btn, .select-product-btn, .discord-pill, .server-pill, .sound-toggle')) {
      playUiSound('click');
    }
  }, { capture: true });
  document.addEventListener('pointerenter', (e) => {
    if (e.target.closest('button, .button, .pill, a, input, select, textarea, .product-card, .product-edit-card')) {
      const now = Date.now();
      if (now - state.lastHoverSound > 90) {
        state.lastHoverSound = now;
        playUiSound('hover');
      }
    }
  }, true);
  document.addEventListener('input', (e) => {
    if (e.target.matches('input, textarea')) {
      const now = Date.now();
      if (now - state.lastTypeSound > 120) {
        state.lastTypeSound = now;
        playUiSound('type');
      }
    }
  }, true);
}

function updatePaymentMethodUI() {
  const method = state.selectedPaymentMethod || 'paypal';
  const giftCardMode = method === 'gift_card';
  refs.giftCardPanel?.classList.toggle('hidden', !giftCardMode);
  const paypalContainer = document.getElementById('paypal-button-container');
  if (paypalContainer) paypalContainer.classList.toggle('hidden', giftCardMode);
  if (giftCardMode) {
    refs.paymentStatus.textContent = 'Pago con tarjeta de regalo';
    refs.paymentStatus.style.color = 'var(--cyan)';
    refs.checkoutFeedback.textContent = 'Ingresa el código y canjea el saldo de la tarjeta.';
  } else {
    updatePaymentStatus();
    renderPayPalButtons().catch(() => {});
  }
}

async function redeemGiftCard() {
  try {
    const product = getSelectedProduct();
    const minecraftNick = refs.minecraftNick.value.trim();
    const code = refs.giftCardCode.value.trim();
    if (minecraftNick.length < 3) {
      refs.checkoutFeedback.textContent = 'Ingresa un usuario válido antes de canjear.';
      return;
    }
    if (!product) {
      refs.checkoutFeedback.textContent = 'Selecciona un producto primero.';
      return;
    }
    if (!code) {
      refs.checkoutFeedback.textContent = 'Escribe el código de la tarjeta.';
      return;
    }
    const result = await api('/api/redeem-gift-card', {
      method: 'POST',
      body: JSON.stringify({ minecraftNick, productId: product.id, code })
    });
    refs.checkoutFeedback.textContent = `Canje completado. Saldo restante: ${formatPrice(result.giftCard.balance, product.currency)}.`;
    refs.giftCardCode.value = '';
    await bootstrap();
  } catch (e) {
    refs.checkoutFeedback.textContent = e.message || 'No se pudo canjear la tarjeta.';
  }
}

function getSelectedProduct() {
  return state.store?.products.find((p) => p.id === state.selectedProductId) || null;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseRichText(value) {
  const lines = String(value ?? '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let current = null;
  const flush = () => {
    if (current) blocks.push(current);
    current = null;
  };
  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      if (current) current.paragraphs.push('');
      continue;
    }
    const title = line.match(/^##\s*(.+)$/);
    if (title) {
      flush();
      current = { type: 'section', title: title[1].trim(), paragraphs: [] };
      continue;
    }
    if (!current) current = { type: 'body', title: '', paragraphs: [] };
    current.paragraphs.push(line);
  }
  flush();
  return blocks;
}

function renderRichText(value) {
  const blocks = parseRichText(value);
  if (!blocks.length) return '';
  return blocks.map((block) => {
    const body = block.paragraphs
      .join('\n')
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => p.startsWith('- ')
        ? `<ul>${p.split(/\n/).map((item) => item.trim()).filter(Boolean).map((item) => `<li>${escapeHtml(item.replace(/^[-]\s*/, ''))}</li>`).join('')}</ul>`
        : `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
      .join('');
    return block.title ? `<h4>${escapeHtml(block.title)}</h4>${body}` : body;
  }).join('');
}

function normalizeInfo(info = {}, fallback = {}) {
  const stickers = Array.isArray(info.stickers) ? info.stickers : String(info.stickers || '').split(',').map((s) => s.trim()).filter(Boolean);
  const gallery = Array.isArray(info.gallery) ? info.gallery : String(info.gallery || '').split(',').map((s) => s.trim()).filter(Boolean);
  const sections = Array.isArray(info.sections) ? info.sections : [];
  return {
    title: String(info.title || fallback.name || '').trim(),
    subtitle: String(info.subtitle || fallback.badge || '').trim(),
    description: String(info.description || fallback.description || '').trim(),
    stickers: stickers.slice(0, 12),
    gallery: gallery.slice(0, 3),
    sections: sections.slice(0, 3).map((section) => ({
      title: String(section?.title || '').trim(),
      text: String(section?.text || '').trim()
    })).filter((section) => section.title || section.text)
  };
}

function getProductInfo(product) {
  return normalizeInfo(product?.info || {}, product || {});
}

function openProductInfo(productId) {
  const product = state.store?.products.find((p) => p.id === productId);
  if (!product || !refs.productInfoModal) return;
  const info = getProductInfo(product);
  state.activeProductInfoId = product.id;

  if (refs.productInfoIcon) {
    refs.productInfoIcon.innerHTML = '';
    const src = product.image?.src || info.gallery[0] || '';
    if (src) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = product.name;
      img.loading = 'lazy';
      refs.productInfoIcon.appendChild(img);
    } else {
      refs.productInfoIcon.textContent = product.name.charAt(0).toUpperCase();
    }
  }

  if (refs.productInfoBadge) refs.productInfoBadge.textContent = product.badge || 'Detalles';
  if (refs.productInfoTitle) refs.productInfoTitle.textContent = info.title || product.name;
  if (refs.productInfoSubtitle) refs.productInfoSubtitle.textContent = info.subtitle || product.badge || '';
  if (refs.productInfoPrice) refs.productInfoPrice.textContent = formatPrice(product.price, product.currency);
  if (refs.productInfoDescription) refs.productInfoDescription.innerHTML = renderRichText(info.description || product.description || '');

  if (refs.productInfoStickers) {
    refs.productInfoStickers.innerHTML = '';
    if (info.stickers.length) {
      info.stickers.forEach((sticker) => {
        const span = document.createElement('span');
        span.className = 'product-info-sticker';
        span.textContent = sticker;
        refs.productInfoStickers.appendChild(span);
      });
    } else {
      refs.productInfoStickers.innerHTML = '<span class="helper">Sin stickers</span>';
    }
  }

  if (refs.productInfoSections) {
    refs.productInfoSections.innerHTML = '';
    if (info.sections.length) {
      info.sections.forEach((section) => {
        const box = document.createElement('div');
        box.className = 'product-info-section';
        const titleHtml = section.title ? `<h4>${escapeHtml(section.title)}</h4>` : '';
        const textHtml = section.text ? `<p>${escapeHtml(section.text).replace(/\n/g, '<br>')}</p>` : '';
        box.innerHTML = `${titleHtml}${textHtml}`;
        refs.productInfoSections.appendChild(box);
      });
    } else {
      refs.productInfoSections.innerHTML = '<div class="helper">No hay secciones extra todavía.</div>';
    }
  }

  if (refs.productInfoGallery) {
    refs.productInfoGallery.innerHTML = '';
    const images = info.gallery.slice(0, 3);
    if (images.length) {
      images.forEach((src) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = product.name;
        img.loading = 'lazy';
        refs.productInfoGallery.appendChild(img);
      });
    } else {
      refs.productInfoGallery.innerHTML = '<div class="helper">Máximo 3 imágenes al final.</div>';
    }
  }

  refs.productInfoModal.classList.remove('hidden');
  refs.productInfoModal.setAttribute('aria-hidden', 'false');
}

function closeProductInfo() {
  if (!refs.productInfoModal) return;
  refs.productInfoModal.classList.add('hidden');
  refs.productInfoModal.setAttribute('aria-hidden', 'true');
  state.activeProductInfoId = '';
}

function getPayPalClientId() {
  return String(state.store?.paypalClientId || '').trim();
}

function applyTheme(store) {
  const theme = store?.theme || {};
  const root = document.documentElement;
  if (theme.primary) root.style.setProperty('--blue', theme.primary);
  if (theme.secondary) root.style.setProperty('--cyan', theme.secondary);
  if (theme.accent) root.style.setProperty('--violet', theme.accent);
  if (theme.background) root.style.setProperty('--bg', theme.background);
  if (theme.panel) root.style.setProperty('--panel', theme.panel);
  if (theme.discord) root.style.setProperty('--discord-blue', theme.discord);
  if (theme.logoSize) root.style.setProperty('--logo-size', `${Number(theme.logoSize)}px`);
  document.body.classList.toggle('logo-pulse-enabled', Boolean(theme.logoPulse));
}

function updatePaymentStatus() {
  if (!refs.paymentStatus) return;

  if (state.selectedPaymentMethod === 'gift_card') {
    refs.paymentStatus.textContent = 'Pago con tarjeta de regalo';
    refs.paymentStatus.style.color = 'var(--cyan)';
    return;
  }

  const env = String(state.store?.paypalEnv || '').toLowerCase();
  const clientId = getPayPalClientId();
  const ready = Boolean(clientId && env === 'live');

  if (!ready) {
    refs.paymentStatus.textContent = clientId ? 'Sandbox activo: cambia a live' : 'PayPal no está configurado';
    refs.paymentStatus.style.color = clientId ? 'var(--gold)' : 'var(--danger)';
    return;
  }

  refs.paymentStatus.textContent = 'Pagos en vivo activos';
  refs.paymentStatus.style.color = 'var(--cyan)';
}

function setPlayerName(name, persist = true) {
  const normalized = String(name ?? '').trim().slice(0, 20);
  state.playerName = normalized;
  if (persist) storageSet('poseidon_player_name', normalized);
  if (refs.minecraftNick && refs.minecraftNick.value !== normalized) refs.minecraftNick.value = normalized;
  if (refs.playerName && refs.playerName.value !== normalized) refs.playerName.value = normalized;
  if (refs.checkoutUser) refs.checkoutUser.textContent = normalized ? `Usuario: ${normalized}` : 'Usuario: —';
}

function showEntryOverlay() { refs.entryOverlay?.classList.remove('hidden'); }
function hideEntryOverlay() { refs.entryOverlay?.classList.add('hidden'); }

function renderQuickLinks() {
  if (!refs.headerLinks) return;
  refs.headerLinks.innerHTML = '';
  (state.store?.links || []).forEach((link) => {
    const a = document.createElement('a');
    a.className = 'pill pill-sm';
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.textContent = link.label;
    refs.headerLinks.appendChild(a);
  });
}

function renderLegalCards() {
  const content = state.store?.content || {};
  if (refs.termsCardText) refs.termsCardText.textContent = content.terms || refs.termsCardText.textContent;
  if (refs.privacyCardText) refs.privacyCardText.textContent = content.privacy || refs.privacyCardText.textContent;
  if (refs.refundsCardText) refs.refundsCardText.textContent = content.refunds || refs.refundsCardText.textContent;
}

function renderCategories() {
  const categories = state.store?.categories || [];
  refs.categoryList.innerHTML = '';
  categories.forEach((cat) => {
    const isSoon = cat.status === 'coming-soon';
    const isActive = state.selectedCategory === cat.id;
    const btn = document.createElement('button');
    btn.className = `cat-item ${isActive ? 'active' : ''}`;
    btn.disabled = isSoon;
    const iconHtml = cat.icon
      ? `<img class="cat-icon" src="${cat.icon}" alt="${cat.name}" />`
      : `<span class="cat-icon-emoji">${FALLBACK_ICONS[cat.id] || '🎮'}</span>`;
    const badgeHtml = isSoon ? `<span class="cat-badge">Pronto</span>` : '';
    btn.innerHTML = `${iconHtml}<span class="cat-info"><span class="cat-name">${cat.name}</span>${badgeHtml}</span>`;
    btn.addEventListener('click', () => {
      if (isSoon) return;
      state.selectedCategory = cat.id;
      renderCategories();
      renderCatalog();
      const first = (state.store?.products || []).find((p) => p.categoryId === cat.id);
      if (first) {
        state.selectedProductId = first.id;
        refs.productSelect.value = first.id;
        updateCheckoutSummary();
      }
    });
    refs.categoryList.appendChild(btn);
  });
}

function renderCatalog() {
  if (!state.store) return;
  const cat = state.store.categories.find((c) => c.id === state.selectedCategory);
  refs.activeCatEyebrow.textContent = 'Storefront';
  refs.activeCatName.textContent = cat ? cat.name : 'Productos';
  const products = state.selectedCategory ? state.store.products.filter((p) => p.categoryId === state.selectedCategory) : state.store.products;
  refs.catalog.innerHTML = '';

  products.forEach((product) => {
    const frag = refs.productCardTemplate.content.cloneNode(true);
    const card = frag.querySelector('.product-card');
    const art = frag.querySelector('.product-art');
    const glow = frag.querySelector('.product-glow');
    const badge = frag.querySelector('.product-badge');
    const title = frag.querySelector('h4');
    const price = frag.querySelector('strong');
    const desc = frag.querySelector('.product-description');
    const featList = frag.querySelector('.feature-list');
    const btn = frag.querySelector('.select-product-btn');
    const infoBtn = frag.querySelector('.product-info-btn');

    const imgSrc = product.image?.src || '';
    art.innerHTML = '';
    if (imgSrc) {
      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = product.name;
      img.loading = 'lazy';
      img.decoding = 'async';
      art.appendChild(img);
    } else if (product.image?.from) {
      art.style.background = `linear-gradient(135deg, ${product.image.from}, ${product.image.to})`;
    }
    if (product.image?.accent) glow.style.background = `radial-gradient(circle, ${product.image.accent}, transparent 65%)`;
    art.appendChild(glow);

    badge.textContent = product.badge;
    title.textContent = product.name;
    price.textContent = formatPrice(product.price, product.currency);
    desc.textContent = product.description;
    (product.features || []).forEach((f) => {
      const li = document.createElement('li');
      li.textContent = f;
      featList.appendChild(li);
    });
    if (state.selectedProductId === product.id) card.style.borderColor = 'rgba(84,229,255,0.5)';
    btn.addEventListener('click', () => {
      refs.productSelect.value = product.id;
      state.selectedProductId = product.id;
      updateCheckoutSummary();
      renderCatalog();
    });
    infoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openProductInfo(product.id);
    });
    refs.catalog.appendChild(frag);
  });
}

function renderBuyers() {
  refs.buyersList.innerHTML = '';
  const buyers = state.store?.buyers || [];
  if (!buyers.length) {
    refs.buyersList.innerHTML = '<div class="buyer-item"><p>Todavía no hay compras registradas.</p></div>';
    return;
  }
  buyers.forEach((b) => {
    const item = document.createElement('article');
    item.className = 'buyer-item';
    item.innerHTML = `<strong>${safeText(b.minecraftNick)}</strong><p>${safeText(b.productName)}</p><small>${formatPrice(b.amount, b.currency)}</small>`;
    refs.buyersList.appendChild(item);
  });
}

function populateProductSelect() {
  refs.productSelect.innerHTML = '';
  (state.store?.products || []).forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.name} - ${formatPrice(p.price, p.currency)}`;
    refs.productSelect.appendChild(opt);
  });
  state.selectedProductId = state.store?.products?.[0]?.id || '';
  refs.productSelect.value = state.selectedProductId;
}

function updateCheckoutSummary() {
  const product = getSelectedProduct();
  if (!product) {
    refs.checkoutName.textContent = 'Selecciona un producto';
    refs.checkoutPrice.textContent = '$0.00';
    refs.checkoutDescription.textContent = 'Tu compra se reflejará una vez el pago sea completado.';
    if (refs.checkoutUser) refs.checkoutUser.textContent = state.playerName ? `Usuario: ${state.playerName}` : 'Usuario: —';
    return;
  }
  refs.checkoutName.textContent = product.name;
  refs.checkoutPrice.textContent = formatPrice(product.price, product.currency);
  refs.checkoutDescription.textContent = product.description;
  if (refs.checkoutUser) refs.checkoutUser.textContent = state.playerName ? `Usuario: ${state.playerName}` : 'Usuario: —';
  renderCatalog();
}

function updateHero() {
  if (!state.store?.server) return;
  refs.serverName.textContent = state.store.server.name;
  refs.serverTagline.textContent = state.store.server.tagline || '';
  refs.serverIpText.textContent = state.store.server.ip;
  if (refs.discordLink) refs.discordLink.href = state.store.server.discord;
  refs.metricProducts.textContent = String(state.store.products.length);
  refs.metricBuyers.textContent = String((state.store.buyers || []).length);
  renderDiscountBanner();
  renderQuickLinks();
  renderLegalCards();
  updatePaymentStatus();
}

async function loadPayPalSdk() {
  if (state.selectedPaymentMethod === 'gift_card') return false;
  const env = String(state.store?.paypalEnv || '').toLowerCase();
  const clientId = getPayPalClientId();

  if (!clientId) {
    refs.paymentStatus.textContent = 'PayPal no está configurado';
    refs.paymentStatus.style.color = 'var(--danger)';
    refs.checkoutFeedback.textContent = 'Configura un Client ID y Secret reales de PayPal para activar el botón.';
    return false;
  }

  if (env !== 'live') {
    refs.paymentStatus.textContent = 'Sandbox activo: cambia a live';
    refs.paymentStatus.style.color = 'var(--gold)';
    refs.checkoutFeedback.textContent = 'La tienda está en sandbox. Cambia PAYPAL_ENV a live para cobrar dinero real.';
    return false;
  }

  if (window.paypal) return true;

  const existing = document.querySelector('script[src*="paypal.com/sdk/js"]');
  if (existing) existing.remove();

  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });

  refs.paymentStatus.textContent = 'Pagos en vivo activos';
  refs.paymentStatus.style.color = 'var(--cyan)';
  return true;
}

async function renderPayPalButtons() {
  const container = document.getElementById('paypal-button-container');
  if (!container) return;
  container.innerHTML = '';
  state.paypalButtons = null;

  if (state.selectedPaymentMethod === 'gift_card') return;

  const env = String(state.store?.paypalEnv || '').toLowerCase();
  if (env && env !== 'live') {
    refs.checkoutFeedback.textContent = 'Sandbox activo: cambia a live para cobrar dinero real.';
    return;
  }

  if (!window.paypal) {
    try {
      await loadPayPalSdk();
    } catch {
      refs.checkoutFeedback.textContent = 'PayPal no pudo cargar. Revisa el Client ID o la conexión.';
      return;
    }
  }

  if (!window.paypal) {
    refs.checkoutFeedback.textContent = 'PayPal todavía no cargó.';
    return;
  }

  const product = getSelectedProduct();
  if (!product) {
    refs.checkoutFeedback.textContent = 'Selecciona un producto primero.';
    return;
  }

  state.paypalButtons = window.paypal.Buttons({
    style: { layout: 'vertical', color: 'gold', shape: 'pill', label: 'paypal' },
    onClick() {
      const nick = refs.minecraftNick.value.trim();
      if (nick.length < 3) {
        refs.checkoutFeedback.textContent = 'Ingresa un usuario válido antes de pagar.';
        return false;
      }
      if (!getSelectedProduct()) {
        refs.checkoutFeedback.textContent = 'Selecciona un producto.';
        return false;
      }
      return true;
    },
    async createOrder() {
      const selected = getSelectedProduct();
      const nick = refs.minecraftNick.value.trim();
      if (!selected) throw new Error('No hay producto seleccionado');
      const data = await api('/api/create-order', {
        method: 'POST',
        body: JSON.stringify({ minecraftNick: nick, productId: selected.id })
      });
      refs.checkoutFeedback.textContent = 'Orden creada. Completa el pago en PayPal.';
      return data.id;
    },
    async onApprove(data) {
      const capture = await api('/api/capture-order', {
        method: 'POST',
        body: JSON.stringify({ orderId: data.orderID })
      });
      refs.checkoutFeedback.textContent = capture.duplicate
        ? 'Este pago ya había sido procesado.'
        : `Pago completado para ${safeText(capture.order?.minecraftNick)}.`;
      await bootstrap();
    },
    onCancel() {
      refs.checkoutFeedback.textContent = 'Pago cancelado.';
    },
    onError(err) {
      refs.checkoutFeedback.textContent = err?.message || 'No se pudo procesar el pago.';
      console.error('PayPal error:', err);
    }
  });

  state.paypalButtons.render('#paypal-button-container');
}

function renderAdminStats(stats) {
  refs.statsGrid.innerHTML = '';
  [
    { label: 'Ventas completadas', value: stats.totalSales },
    { label: 'Ingresos', value: formatPrice(stats.totalRevenue) },
    { label: 'Compradores', value: stats.buyers.length },
    { label: 'Gift cards vendidas', value: stats.giftCardSales || 0 },
    { label: 'Descuentos activos', value: getActiveDiscounts().length },
    { label: 'Productos activos', value: state.store.products.length }
  ].forEach((s) => {
    const card = document.createElement('article');
    card.className = 'stat-card';
    card.innerHTML = `<small>${safeText(s.label)}</small><strong>${safeText(s.value)}</strong>`;
    refs.statsGrid.appendChild(card);
  });
}

function createCategoryCard(category = {}) {
  const defaults = {
    id: `category-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: 'Nueva categoría',
    status: 'active',
    icon: '',
  };
  const c = { ...defaults, ...category };
  const row = document.createElement('article');
  row.className = 'product-edit-card category-edit-card';
  row.innerHTML = `
    <div class="product-edit-head">
      <strong>${safeText(c.name)}</strong>
      <button class="button ghost remove-btn" type="button">Eliminar</button>
    </div>
    <div class="product-edit-grid">
      <input class="input category-id" placeholder="ID" value="${safeText(c.id).replace(/"/g, '&quot;')}" />
      <input class="input category-name" placeholder="Nombre" value="${safeText(c.name).replace(/"/g, '&quot;')}" />
      <select class="input category-status">
        <option value="active">active</option>
        <option value="inactive">inactive</option>
        <option value="hidden">hidden</option>
      </select>
      <input class="input category-icon" placeholder="URL icono / GIF / PNG" value="${safeText(c.icon || '').replace(/"/g, '&quot;')}" />
      <p class="helper">Las categorías quedan visibles y clicables; el estado solo sirve para organizar el panel.</p>
    </div>
  `;
  row.querySelector('.category-status').value = String(c.status || 'active');
  row.querySelector('.remove-btn').addEventListener('click', () => row.remove());
  row.querySelector('.category-name').addEventListener('input', (e) => {
    row.querySelector('.product-edit-head strong').textContent = e.target.value || 'Nueva categoría';
  });
  return row;
}

function readCategoriesFromEditor() {
  return [...refs.categoryEditor.querySelectorAll('.category-edit-card')].map((card) => {
    const id = card.querySelector('.category-id').value.trim();
    const name = card.querySelector('.category-name').value.trim();
    const status = card.querySelector('.category-status').value;
    const icon = card.querySelector('.category-icon').value.trim();
    return {
      id: id || `category-${Date.now()}`,
      name: name || 'Categoría',
      status: status || 'active',
      icon
    };
  });
}

function createDiscountCard(discount = {}) {
  const defaults = {
    id: `discount-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: 'Nuevo descuento',
    percent: 10,
    active: true,
    description: '',
    scope: 'global',
    categoryId: ''
  };
  const d = { ...defaults, ...discount };
  const row = document.createElement('article');
  row.className = 'product-edit-card discount-edit-card';
  row.innerHTML = `
    <div class="product-edit-head">
      <strong>${safeText(d.name)}</strong>
      <button class="button ghost remove-btn" type="button">Eliminar</button>
    </div>
    <div class="product-edit-grid">
      <input class="input discount-id" placeholder="ID" value="${safeText(d.id).replace(/"/g, '&quot;')}" />
      <input class="input discount-name" placeholder="Nombre" value="${safeText(d.name).replace(/"/g, '&quot;')}" />
      <input class="input discount-percent" type="number" min="0" max="100" step="0.1" placeholder="Porcentaje" value="${normalizePercent(d.percent)}" />
      <label class="toggle-row"><input class="discount-active" type="checkbox" ${d.active !== false ? 'checked' : ''} /> <span>Activo</span></label>
      <select class="input discount-scope">
        <option value="global">global</option>
        <option value="category">category</option>
      </select>
      <input class="input discount-category" placeholder="ID de categoría (opcional)" value="${safeText(d.categoryId || '').replace(/"/g, '&quot;')}" />
      <textarea class="textarea discount-description" placeholder="Descripción / texto visible">${safeText(d.description || '')}</textarea>
    </div>
  `;
  row.querySelector('.discount-scope').value = String(d.scope || 'global');
  row.querySelector('.remove-btn').addEventListener('click', () => row.remove());
  row.querySelector('.discount-name').addEventListener('input', (e) => {
    row.querySelector('.product-edit-head strong').textContent = e.target.value || 'Nuevo descuento';
  });
  return row;
}

function readDiscountsFromEditor() {
  return [...refs.discountEditor.querySelectorAll('.discount-edit-card')].map((card) => ({
    id: card.querySelector('.discount-id').value.trim() || `discount-${Date.now()}`,
    name: card.querySelector('.discount-name').value.trim() || 'Descuento',
    percent: normalizePercent(card.querySelector('.discount-percent').value),
    active: Boolean(card.querySelector('.discount-active').checked),
    scope: card.querySelector('.discount-scope').value || 'global',
    categoryId: card.querySelector('.discount-category').value.trim(),
    description: card.querySelector('.discount-description').value.trim(),
    updatedAt: new Date().toISOString()
  }));
}

function createLinkRow(link = { label: '', url: '' }) {
  const row = document.createElement('div');
  row.className = 'editor-row compact link-row';
  row.innerHTML = `
    <input class="input link-label" placeholder="Etiqueta" value="${safeText(link.label).replace(/"/g, '&quot;')}" />
    <input class="input link-url" placeholder="URL" value="${safeText(link.url).replace(/"/g, '&quot;')}" />
    <button class="button ghost remove-btn" type="button">Eliminar</button>
  `;
  row.querySelector('.remove-btn').addEventListener('click', () => row.remove());
  return row;
}

function createProductCard(product = {}) {
  const defaults = {
    id: `product-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    categoryId: state.store?.categories?.find((c) => c.status === 'active')?.id || 'more',
    name: 'Nuevo producto',
    price: 0,
    currency: 'USD',
    badge: 'Item',
    description: '',
    features: [],
    commandTemplate: '',
    image: { src: '', from: '#297bff', to: '#54e5ff', accent: 'rgba(84,229,255,.35)' },
    info: { title: '', subtitle: '', description: '', stickers: [], gallery: [], sections: [] }
  };

  const p = {
    ...defaults,
    ...product,
    image: { ...defaults.image, ...(product.image || {}) },
    info: normalizeInfo(product.info || {}, product)
  };

  const sectionRows = (p.info.sections.length ? p.info.sections : [{ title: '', text: '' }, { title: '', text: '' }, { title: '', text: '' }]).slice(0, 3);
  while (sectionRows.length < 3) sectionRows.push({ title: '', text: '' });
  const galleryValues = [...p.info.gallery, '', ''].slice(0, 3);

  const card = document.createElement('article');
  card.className = 'product-edit-card';
  card.innerHTML = `
    <div class="product-edit-head">
      <strong>${safeText(p.name)}</strong>
      <button class="button ghost remove-btn" type="button">Eliminar</button>
    </div>
    <div class="product-edit-grid">
      <input class="input product-id" placeholder="ID" value="${safeText(p.id).replace(/"/g, '&quot;')}" />
      <input class="input product-name" placeholder="Nombre" value="${safeText(p.name).replace(/"/g, '&quot;')}" />
      <select class="input product-category"></select>
      <input class="input product-price" type="number" step="0.01" placeholder="Precio" value="${Number(p.price || 0)}" />
      <input class="input product-currency" placeholder="Moneda" value="${safeText(p.currency).replace(/"/g, '&quot;')}" />
      <input class="input product-badge" placeholder="Badge" value="${safeText(p.badge).replace(/"/g, '&quot;')}" />
      <input class="input product-image-src" placeholder="GIF / imagen" value="${safeText(p.image.src).replace(/"/g, '&quot;')}" />
      <input class="input product-image-from" placeholder="Color 1" value="${safeText(p.image.from).replace(/"/g, '&quot;')}" />
      <input class="input product-image-to" placeholder="Color 2" value="${safeText(p.image.to).replace(/"/g, '&quot;')}" />
      <input class="input product-image-accent" placeholder="Glow" value="${safeText(p.image.accent).replace(/"/g, '&quot;')}" />
      <textarea class="textarea product-desc" placeholder="Descripción breve">${safeText(p.description)}</textarea>
      <textarea class="textarea product-features" placeholder="Características separadas por coma">${Array.isArray(p.features) ? p.features.join(', ') : safeText(p.features)}</textarea>
      <textarea class="textarea product-command-template" placeholder="Un comando por línea. Variables: {nick} {player} {product} {productId} {orderId} {amount}">${safeText(p.commandTemplate || '')}</textarea>
      <p class="helper">Se envía al plugin cuando el pago se confirma. Una línea = un comando.</p>
    </div>
    <div class="product-edit-info">
      <div class="panel-head"><p class="eyebrow">Editar descripcion</p><h3>Botón !</h3></div>
      <div class="product-edit-grid info-grid">
        <input class="input product-info-title" placeholder="Título grande" value="${safeText(p.info.title || '').replace(/"/g, '&quot;')}" />
        <input class="input product-info-subtitle" placeholder="Subtítulo" value="${safeText(p.info.subtitle || '').replace(/"/g, '&quot;')}" />
        <textarea class="textarea product-info-description" placeholder="Descripción larga con títulos usando ## titulo">${safeText(p.info.description || '')}</textarea>
        <textarea class="textarea product-info-stickers" placeholder="Stickers separados por coma">${Array.isArray(p.info.stickers) ? p.info.stickers.join(', ') : safeText(p.info.stickers || '')}</textarea>
        <input class="input product-info-gallery-1" placeholder="Imagen 1" value="${safeText(galleryValues[0] || '').replace(/"/g, '&quot;')}" />
        <input class="input product-info-gallery-2" placeholder="Imagen 2" value="${safeText(galleryValues[1] || '').replace(/"/g, '&quot;')}" />
        <input class="input product-info-gallery-3" placeholder="Imagen 3" value="${safeText(galleryValues[2] || '').replace(/"/g, '&quot;')}" />
      </div>
      <div class="product-edit-sections">
        ${sectionRows.map((section, idx) => `
          <div class="product-edit-section">
            <input class="input product-info-section-title" placeholder="Título ${idx + 1}" value="${safeText(section.title || '').replace(/"/g, '&quot;')}" />
            <textarea class="textarea product-info-section-text" placeholder="Texto ${idx + 1}">${safeText(section.text || '')}</textarea>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const select = card.querySelector('.product-category');
  (state.store?.categories || []).forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    if (cat.id === p.categoryId) opt.selected = true;
    select.appendChild(opt);
  });

  card.querySelector('.remove-btn').addEventListener('click', () => card.remove());
  card.querySelector('.product-name').addEventListener('input', (e) => {
    card.querySelector('.product-edit-head strong').textContent = e.target.value || 'Nuevo producto';
  });

  return card;
}


function createGiftCardCard(card = {}) {
  const defaults = {
    id: `giftcard-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    code: generateGiftCode(),
    originalBalance: 0,
    balance: 0,
    active: true,
    note: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const c = { ...defaults, ...card };
  const balance = Number(c.balance ?? c.originalBalance ?? 0);
  const originalBalance = Number(c.originalBalance ?? balance);

  const row = document.createElement('article');
  row.className = 'product-edit-card gift-card-edit-card';
  row.dataset.originalBalance = String(originalBalance);
  row.dataset.createdAt = c.createdAt;
  row.innerHTML = `
    <div class="product-edit-head">
      <strong>${safeText(c.code)}</strong>
      <button class="button ghost remove-btn" type="button">Eliminar</button>
    </div>
    <div class="product-edit-grid">
      <input class="input giftcard-code" placeholder="Código" value="${safeText(String(c.code || '').trim().toUpperCase()).replace(/"/g, '&quot;')}" />
      <input class="input giftcard-balance" type="number" step="0.01" min="0" placeholder="Saldo" value="${Number.isFinite(balance) ? balance : 0}" />
      <label class="toggle-row"><input class="giftcard-active" type="checkbox" ${c.active !== false ? 'checked' : ''} /> <span>Activa</span></label>
      <input class="input giftcard-note" placeholder="Nota / cliente" value="${safeText(c.note || '').replace(/"/g, '&quot;')}" />
    </div>
  `;

  row.querySelector('.remove-btn').addEventListener('click', () => row.remove());
  row.querySelector('.giftcard-code').addEventListener('input', (e) => {
    row.querySelector('.product-edit-head strong').textContent = e.target.value || 'Gift card';
  });
  return row;
}

function readGiftCardsFromEditor() {
  return [...refs.giftCardEditor.querySelectorAll('.gift-card-edit-card')].map((card) => {
    const code = card.querySelector('.giftcard-code').value.trim().toUpperCase().replace(/\s+/g, '');
    const balance = Number(card.querySelector('.giftcard-balance').value || 0);
    const active = Boolean(card.querySelector('.giftcard-active').checked);
    const note = card.querySelector('.giftcard-note').value.trim();
    const originalBalance = Number(card.dataset.originalBalance || balance);
    return {
      id: code ? `giftcard-${code}` : `giftcard-${Date.now()}`,
      code: code || generateGiftCode(),
      originalBalance: Number.isFinite(originalBalance) ? originalBalance : balance,
      balance: Number.isFinite(balance) ? balance : 0,
      active,
      note,
      createdAt: card.dataset.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}

function fillAdminForm(store, orders) {
  refs.adminServerName.value = store.server.name || '';
  refs.adminServerTagline.value = store.server.tagline || '';
  refs.adminServerIp.value = store.server.ip || '';
  refs.adminServerDiscord.value = store.server.discord || '';

  refs.adminThemePrimary.value = store.theme.primary || '#297bff';
  refs.adminThemeSecondary.value = store.theme.secondary || '#54e5ff';
  refs.adminThemeAccent.value = store.theme.accent || '#7b6dff';
  refs.adminThemeBg.value = store.theme.background || '#04101d';
  refs.adminThemePanel.value = store.theme.panel || '#0d1a30';
  refs.adminDiscordColor.value = store.theme.discord || '#5865F2';
  refs.adminLogoSize.value = store.theme.logoSize || 132;
  refs.adminLogoPulse.checked = Boolean(store.theme.logoPulse);

  refs.adminHeroTitle.value = store.content.heroTitle || '';
  refs.adminHeroSubtitle.value = store.content.heroSubtitle || '';
  refs.adminTermsText.value = store.content.terms || '';
  refs.adminPrivacyText.value = store.content.privacy || '';
  refs.adminRefundsText.value = store.content.refunds || '';

  refs.adminLinkList.innerHTML = '';
  (store.links || []).forEach((link) => refs.adminLinkList.appendChild(createLinkRow(link)));

  if (refs.discountEditor) {
    refs.discountEditor.innerHTML = '';
    (store.discounts || []).forEach((discount) => refs.discountEditor.appendChild(createDiscountCard(discount)));
  }

  if (refs.categoryEditor) {
    refs.categoryEditor.innerHTML = '';
    (store.categories || []).forEach((category) => refs.categoryEditor.appendChild(createCategoryCard(category)));
  }

  refs.productEditor.innerHTML = '';
  (store.products || []).forEach((product) => refs.productEditor.appendChild(createProductCard(product)));

  if (refs.giftCardEditor) {
    refs.giftCardEditor.innerHTML = '';
    (store.giftCards || []).forEach((giftCard) => refs.giftCardEditor.appendChild(createGiftCardCard(giftCard)));
  }

  refs.salesTableBody.innerHTML = '';
  orders.forEach((o) => {
    const row = document.createElement('tr');
    const paymentLabel = o.paymentMethod === 'gift_card' ? 'Tarjeta de regalo' : 'PayPal';
    row.innerHTML = `<td>${safeText(o.minecraftNick)}</td><td>${safeText(o.productName)}</td><td>${formatPrice(o.amount, o.currency)} • ${paymentLabel}</td><td>${safeText(o.status)}</td><td>${new Date(o.completedAt || o.createdAt).toLocaleString()}</td>`;
    refs.salesTableBody.appendChild(row);
  });
}

function readLinksFromEditor() {
  return [...refs.adminLinkList.querySelectorAll('.link-row')].map((row) => ({
    label: row.querySelector('.link-label').value.trim(),
    url: row.querySelector('.link-url').value.trim()
  })).filter((link) => link.label && link.url);
}

function readProductsFromEditor() {
  return [...refs.productEditor.querySelectorAll('.product-edit-card')].map((card) => {
    const id = card.querySelector('.product-id').value.trim();
    const name = card.querySelector('.product-name').value.trim();
    const categoryId = card.querySelector('.product-category').value;
    const price = Number(card.querySelector('.product-price').value || 0);
    const currency = card.querySelector('.product-currency').value.trim() || 'USD';
    const badge = card.querySelector('.product-badge').value.trim() || 'Item';
    const description = card.querySelector('.product-desc').value.trim();
    const features = card.querySelector('.product-features').value.split(',').map((f) => f.trim()).filter(Boolean);
    const commandTemplate = card.querySelector('.product-command-template').value.trim();
    const image = {
      src: card.querySelector('.product-image-src').value.trim(),
      from: card.querySelector('.product-image-from').value.trim() || '#297bff',
      to: card.querySelector('.product-image-to').value.trim() || '#54e5ff',
      accent: card.querySelector('.product-image-accent').value.trim() || 'rgba(84,229,255,.35)'
    };
    const info = {
      title: card.querySelector('.product-info-title').value.trim(),
      subtitle: card.querySelector('.product-info-subtitle').value.trim(),
      description: card.querySelector('.product-info-description').value.trim(),
      stickers: card.querySelector('.product-info-stickers').value.split(',').map((s) => s.trim()).filter(Boolean),
      gallery: [
        card.querySelector('.product-info-gallery-1').value.trim(),
        card.querySelector('.product-info-gallery-2').value.trim(),
        card.querySelector('.product-info-gallery-3').value.trim()
      ].filter(Boolean).slice(0, 3),
      sections: [...card.querySelectorAll('.product-edit-section')].map((section) => ({
        title: section.querySelector('.product-info-section-title').value.trim(),
        text: section.querySelector('.product-info-section-text').value.trim()
      })).filter((section) => section.title || section.text).slice(0, 3)
    };
    return { id: id || `product-${Date.now()}`, categoryId, name: name || 'Producto', price, currency, badge, description, features, commandTemplate, image, info };
  });
}

async function loginAdmin() {
  try {
    await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: refs.adminUser.value.trim(), password: refs.adminPass.value })
    });
    refs.adminLoginFeedback.textContent = 'Acceso concedido.';
    await loadAdminDashboard();
  } catch (e) {
    refs.adminLoginFeedback.textContent = e.message;
  }
}

async function loadAdminDashboard() {
  try {
    const data = await api('/api/admin/dashboard');
    refs.adminLogin.classList.add('hidden');
    refs.adminDashboard.classList.remove('hidden');
    renderAdminStats(data.stats);
    fillAdminForm(data.store, data.orders);
  } catch {
    refs.adminLogin.classList.remove('hidden');
    refs.adminDashboard.classList.add('hidden');
  }
}

async function saveStore() {
  try {
    const payload = {
      server: {
        name: refs.adminServerName.value.trim(),
        ip: refs.adminServerIp.value.trim(),
        discord: refs.adminServerDiscord.value.trim(),
        tagline: refs.adminServerTagline.value.trim()
      },
      theme: {
        primary: refs.adminThemePrimary.value,
        secondary: refs.adminThemeSecondary.value,
        accent: refs.adminThemeAccent.value,
        background: refs.adminThemeBg.value,
        panel: refs.adminThemePanel.value,
        discord: refs.adminDiscordColor.value,
        logoSize: Number(refs.adminLogoSize.value || 132),
        logoPulse: Boolean(refs.adminLogoPulse.checked)
      },
      content: {
        heroTitle: refs.adminHeroTitle.value.trim(),
        heroSubtitle: refs.adminHeroSubtitle.value.trim(),
        terms: refs.adminTermsText.value.trim(),
        privacy: refs.adminPrivacyText.value.trim(),
        refunds: refs.adminRefundsText.value.trim()
      },
      links: readLinksFromEditor(),
      discounts: readDiscountsFromEditor(),
      categories: readCategoriesFromEditor(),
      products: readProductsFromEditor(),
      giftCards: readGiftCardsFromEditor()
    };
    await api('/api/admin/store', { method: 'PUT', body: JSON.stringify(payload) });
    refs.adminSaveFeedback.textContent = 'Tienda actualizada correctamente.';
    await bootstrap();
    await loadAdminDashboard();
  } catch (e) {
    refs.adminSaveFeedback.textContent = e.message;
  }
}

async function bootstrap() {
  state.store = await api('/api/store');
  applyTheme(state.store);

  if (!state.selectedCategory) {
    const first = state.store?.categories?.find((c) => c.status === 'active');
    state.selectedCategory = first?.id || state.store?.categories?.[0]?.id || '';
  }
  renderDiscountBanner();

  const firstProduct = state.store?.products?.[0];
  if (!state.selectedProductId && firstProduct) state.selectedProductId = firstProduct.id;

  if (refs.paymentMethod) {
    refs.paymentMethod.value = state.selectedPaymentMethod || 'paypal';
  }
  updateHero();
  renderCategories();
  populateProductSelect();
  updateCheckoutSummary();
  renderCatalog();
  renderBuyers();
  updatePaymentMethodUI();

  if (state.selectedPaymentMethod === 'paypal') {
    await loadPayPalSdk();
    await renderPayPalButtons();
  }
}

function initEntryFlow() {
  const saved = storageGet('poseidon_player_name', '');
  if (saved) {
    setPlayerName(saved, false);
    hideEntryOverlay();
  } else {
    showEntryOverlay();
  }
  if (refs.minecraftNick.value) setPlayerName(refs.minecraftNick.value, false);
}

function enterStore() {
  const name = refs.playerName.value.trim() || refs.minecraftNick.value.trim();
  if (name.length < 3) {
    refs.checkoutFeedback.textContent = 'Escribe un usuario válido para entrar.';
    return;
  }
  setPlayerName(name);
  hideEntryOverlay();
  refs.checkoutFeedback.textContent = 'Usuario listo para comprar.';
  refs.minecraftNick.focus();
}

refs.productSelect.addEventListener('change', () => {
  state.selectedProductId = refs.productSelect.value;
  updateCheckoutSummary();
  if (state.selectedPaymentMethod === 'paypal') renderPayPalButtons();
});

refs.paymentMethod?.addEventListener('change', () => {
  state.selectedPaymentMethod = refs.paymentMethod.value || 'paypal';
  updatePaymentMethodUI();
});

refs.minecraftNick.addEventListener('input', () => setPlayerName(refs.minecraftNick.value));
refs.enterStoreBtn?.addEventListener('click', enterStore);
refs.giftCardPayBtn?.addEventListener('click', redeemGiftCard);
refs.playerName?.addEventListener('keydown', (e) => { if (e.key === 'Enter') enterStore(); });

refs.copyIpBtn?.addEventListener('click', () => {
  navigator.clipboard?.writeText(state.store?.server?.ip || refs.serverIpText.textContent || '').catch(() => {});
  refs.checkoutFeedback.textContent = 'IP copiada.';
});

refs.discordLink?.addEventListener('click', () => {
  refs.checkoutFeedback.textContent = 'Abriendo Discord...';
});

refs.loginBtn.addEventListener('click', () => {
  state.adminVisible = !state.adminVisible;
  refs.adminShell.style.display = state.adminVisible ? 'block' : 'none';
  if (state.adminVisible) {
    refs.adminShell.scrollIntoView({ behavior: 'smooth' });
    loadAdminDashboard().catch(() => {});
  }
});

refs.adminLoginBtn.addEventListener('click', loginAdmin);
refs.adminLogoutBtn.addEventListener('click', async () => {
  await api('/api/admin/logout', { method: 'POST' });
  refs.adminLogin.classList.remove('hidden');
  refs.adminDashboard.classList.add('hidden');
});
refs.saveStoreBtn.addEventListener('click', saveStore);
refs.soundToggle?.addEventListener('click', () => setSoundEnabled(!state.audioEnabled));
refs.addLinkBtn.addEventListener('click', () => refs.adminLinkList.appendChild(createLinkRow()));
refs.addDiscountBtn?.addEventListener('click', () => refs.discountEditor.appendChild(createDiscountCard()));
refs.addCategoryBtn?.addEventListener('click', () => refs.categoryEditor.appendChild(createCategoryCard()));
refs.addProductBtn.addEventListener('click', () => refs.productEditor.appendChild(createProductCard()));
refs.addGiftCardBtn?.addEventListener('click', () => refs.giftCardEditor.appendChild(createGiftCardCard()));
refs.productInfoClose?.addEventListener('click', closeProductInfo);
refs.productInfoModal?.addEventListener('click', (e) => {
  if (e.target?.dataset?.closeProductInfo !== undefined) closeProductInfo();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeProductInfo();
});

initSoundSystem();

bootstrap()
  .then(() => {
    initEntryFlow();
    if (!state.playerName && refs.playerName) refs.playerName.focus();
  })
  .catch((e) => {
    console.error(e);
    refs.checkoutFeedback.textContent = e.message || 'No se pudo cargar la tienda.';
    showEntryOverlay();
  });
