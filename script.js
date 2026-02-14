const embeddedPricing = [];

const pricingGrid = document.getElementById("pricing-grid");
const serviceSelect = document.getElementById("service-select");
const dateInput = document.getElementById("date-input");
const timeInput = document.getElementById("time-input");
const dayStrip = document.getElementById("day-strip");
const timeSlots = document.getElementById("time-slots");
const bookingForm = document.getElementById("booking-form");
const bookingSuccess = document.getElementById("booking-success");
const todayBtn = document.getElementById("today-btn");

const formatter = new Intl.NumberFormat("mn-MN");
const PRODUCTS_PER_PAGE = 15;

let productsCache = [];
let allProductsCache = [];
let currentProductsPage = 1;

const timeOptions = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

const SERVICE_IMAGE_MAP = {
  "будаг": ["files/Budag.jpeg"],
  "оффис колор": ["files/OfficeColor.png"],
  "холливуд ороолт": ["files/HollywoodOroolt.jpeg"],
  "элегант ороолт": ["files/EleganceOroolt.jpeg"],
  "оффис ороолт": ["files/OfficeOroolt.jpeg"],
  "эмчилгээний хими": [
    "files/EmchilgeeHimi.jpeg",
    "files/EmchilgeeHimi1.jpg",
    "files/EmchilgeeHimi2.jpg",
  ],
};

let serviceImageModal;
let serviceImageModalTitle;
let serviceImageModalRow;

function normalizeServiceName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[ё]/g, "е")
    .replace(/\s+/g, " ")
    .trim();
}

function getServiceImages(serviceName) {
  const key = normalizeServiceName(serviceName);
  return SERVICE_IMAGE_MAP[key] || [];
}

function createServiceImageButtonMarkup(serviceName) {
  const images = getServiceImages(serviceName);
  if (images.length === 0) return "";
  return `<button class="service-image-btn" type="button" data-service="${encodeURIComponent(serviceName)}">Зураг харах</button>`;
}

function ensureServiceImageModal() {
  if (serviceImageModal) return;

  serviceImageModal = document.createElement("div");
  serviceImageModal.className = "service-image-modal";
  serviceImageModal.setAttribute("aria-hidden", "true");
  serviceImageModal.setAttribute("role", "dialog");
  serviceImageModal.innerHTML = `
    <div class="service-image-modal-backdrop" data-service-image-close></div>
    <div class="service-image-modal-content" role="document">
      <button class="service-image-modal-close" type="button" aria-label="Close" data-service-image-close>×</button>
      <h3 class="service-image-modal-title"></h3>
      <div class="service-image-modal-row"></div>
    </div>
  `;

  document.body.appendChild(serviceImageModal);
  serviceImageModalTitle = serviceImageModal.querySelector(".service-image-modal-title");
  serviceImageModalRow = serviceImageModal.querySelector(".service-image-modal-row");

  serviceImageModal.addEventListener("click", (event) => {
    const target = event.target;
    if (target?.matches("[data-service-image-close]")) {
      closeServiceImageModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && serviceImageModal?.classList.contains("is-open")) {
      closeServiceImageModal();
    }
  });
}

function closeServiceImageModal() {
  if (!serviceImageModal) return;
  serviceImageModal.classList.remove("is-open");
  serviceImageModal.setAttribute("aria-hidden", "true");
  if (serviceImageModalRow) {
    serviceImageModalRow.innerHTML = "";
  }
}

function openServiceImageModal(serviceName) {
  const images = getServiceImages(serviceName);
  if (images.length === 0) return;

  ensureServiceImageModal();

  if (serviceImageModalTitle) {
    serviceImageModalTitle.textContent = serviceName;
  }

  if (serviceImageModalRow) {
    serviceImageModalRow.innerHTML = "";
    images.forEach((src, index) => {
      const img = document.createElement("img");
      img.className = "service-image-modal-item";
      img.src = src;
      img.alt = `${serviceName} зураг ${index + 1}`;
      img.loading = "lazy";
      serviceImageModalRow.appendChild(img);
    });
  }

  serviceImageModal.classList.add("is-open");
  serviceImageModal.setAttribute("aria-hidden", "false");
}

function formatRange(min, max) {
  if (min === undefined || min === null) {
    // Single price mode
    return `${formatter.format(max)} ₮`;
  }
  if (min === max) {
    return `${formatter.format(min)} ₮`;
  }
  return `${formatter.format(min)} – ${formatter.format(max)} ₮`;
}

function formatPrice(price) {
  return `${formatter.format(price)} ₮`;
}

function renderPricing(pricingData) {
  if (!pricingGrid) return;
  pricingGrid.innerHTML = "";
  
  if (serviceSelect) {
    serviceSelect.innerHTML = '<option value="">Үйлчилгээ сонгох</option>';
  }

  // Render each category
  Object.values(pricingData).forEach((category, categoryIndex) => {
    // Category header
    const categoryHeader = document.createElement("div");
    categoryHeader.className = "pricing-category-header";
    categoryHeader.textContent = category.category;
    pricingGrid.appendChild(categoryHeader);

    // Check if category has subcategories (new structure)
    if (category.subcategories) {
      category.subcategories.forEach((subcategory, subIndex) => {
        const subcategoryId = `subcategory-${categoryIndex}-${subIndex}`;

        // Subcategory header (collapsible)
        const subcategoryHeader = document.createElement("div");
        subcategoryHeader.className = "pricing-subcategory-header";
        subcategoryHeader.innerHTML = `
          <button class="subcategory-toggle" data-subcategory="${subcategoryId}" type="button">
            <div class="group-header">
              <h3>${subcategory.name}</h3>
              <span class="toggle-icon">▼</span>
            </div>
          </button>
        `;
        pricingGrid.appendChild(subcategoryHeader);

        const subcategoryContainer = document.createElement("div");
        subcategoryContainer.id = subcategoryId;
        subcategoryContainer.className = "subcategory-services hidden";

        // Render services in subcategory
        subcategory.services.forEach((service) => {
          const imageButtonMarkup = createServiceImageButtonMarkup(service.name);
          if (service.variants) {
            // Service with variants - collapsible
            const groupId = `group-${service.name.replace(/\s+/g, "-")}`;
            const groupCard = document.createElement("div");
            groupCard.className = "price-card price-group";

            // Calculate min/max from variants (or just use first price if single price)
            let minPrice = Infinity;
            let maxPrice = 0;
            service.variants.forEach((variant) => {
              if (variant.price !== undefined) {
                minPrice = Math.min(minPrice, variant.price);
                maxPrice = Math.max(maxPrice, variant.price);
              } else {
                minPrice = Math.min(minPrice, variant.min);
                maxPrice = Math.max(maxPrice, variant.max);
              }
            });

            const priceDisplay = minPrice === maxPrice ? formatPrice(maxPrice) : formatRange(minPrice, maxPrice);

            groupCard.innerHTML = `
              <button class="group-toggle" data-group="${groupId}" type="button">
                <div class="group-header">
                  <h4>${service.name}</h4>
                  <span class="toggle-icon">▼</span>
                </div>
                <div class="price">${priceDisplay}</div>
                <div class="muted">${service.variants.length} сонголт</div>
              </button>
              ${imageButtonMarkup}
            `;
            subcategoryContainer.appendChild(groupCard);

            // Variants container
            const variantsContainer = document.createElement("div");
            variantsContainer.id = groupId;
            variantsContainer.className = "price-variants hidden";

            service.variants.forEach((variant) => {
              const variantCard = document.createElement("div");
              variantCard.className = "price-variant";
              const priceText = variant.price !== undefined ? formatPrice(variant.price) : formatRange(variant.min, variant.max);
              variantCard.innerHTML = `
                <div class="variant-name">${variant.type}</div>
                <div class="price">${priceText}</div>
              `;
              variantsContainer.appendChild(variantCard);

              // Add to service select
              if (serviceSelect) {
                const option = document.createElement("option");
                option.value = `${service.name} - ${variant.type}`;
                option.textContent = `${service.name} (${variant.type}) - ${priceText}`;
                serviceSelect.appendChild(option);
              }
            });

            groupCard.appendChild(variantsContainer);
          } else {
            // Single service without variants
            const card = document.createElement("div");
            card.className = "price-card";
            const priceText = service.price !== undefined ? formatPrice(service.price) : formatRange(service.min, service.max);
            card.innerHTML = `
              <h4>${service.name}</h4>
              <div class="price">${priceText}</div>
              <div class="muted">Үнэ</div>
              ${imageButtonMarkup}
            `;
            subcategoryContainer.appendChild(card);

            // Add to service select
            if (serviceSelect) {
              const option = document.createElement("option");
              option.value = service.name;
              option.textContent = `${service.name} - ${priceText}`;
              serviceSelect.appendChild(option);
            }
          }
        });

        pricingGrid.appendChild(subcategoryContainer);
      });
    } else {
      // Old structure with services or variants
      category.services.forEach((service) => {
        const imageButtonMarkup = createServiceImageButtonMarkup(service.name);
        if (service.variants) {
          // Service with variants - collapsible
          const groupId = `group-${service.name.replace(/\s+/g, "-")}`;
          const groupCard = document.createElement("div");
          groupCard.className = "price-card price-group";

          // Calculate min/max from variants
          let minPrice = Infinity;
          let maxPrice = 0;
          service.variants.forEach((variant) => {
            if (variant.price !== undefined) {
              minPrice = Math.min(minPrice, variant.price);
              maxPrice = Math.max(maxPrice, variant.price);
            } else {
              minPrice = Math.min(minPrice, variant.min);
              maxPrice = Math.max(maxPrice, variant.max);
            }
          });

          const priceDisplay = minPrice === maxPrice ? formatPrice(maxPrice) : formatRange(minPrice, maxPrice);

          groupCard.innerHTML = `
            <button class="group-toggle" data-group="${groupId}" type="button">
              <div class="group-header">
                <h4>${service.name}</h4>
                <span class="toggle-icon">▼</span>
              </div>
              <div class="price">${priceDisplay}</div>
              <div class="muted">${service.variants.length} сонголт</div>
            </button>
            ${imageButtonMarkup}
          `;
          pricingGrid.appendChild(groupCard);

          // Variants container
          const variantsContainer = document.createElement("div");
          variantsContainer.id = groupId;
          variantsContainer.className = "price-variants hidden";

          service.variants.forEach((variant) => {
            const variantCard = document.createElement("div");
            variantCard.className = "price-variant";
            const priceText = variant.price !== undefined ? formatPrice(variant.price) : formatRange(variant.min, variant.max);
            variantCard.innerHTML = `
              <div class="variant-name">${variant.type}</div>
              <div class="price">${priceText}</div>
            `;
            variantsContainer.appendChild(variantCard);

            // Add to service select
            if (serviceSelect) {
              const option = document.createElement("option");
              option.value = `${service.name} - ${variant.type}`;
              option.textContent = `${service.name} (${variant.type}) - ${priceText}`;
              serviceSelect.appendChild(option);
            }
          });

          groupCard.appendChild(variantsContainer);
        } else {
          // Single service without variants
          const card = document.createElement("div");
          card.className = "price-card";
          const priceText = service.price !== undefined ? formatPrice(service.price) : formatRange(service.min, service.max);
          card.innerHTML = `
            <h4>${service.name}</h4>
            <div class="price">${priceText}</div>
            <div class="muted">Үнэ</div>
            ${imageButtonMarkup}
          `;
          pricingGrid.appendChild(card);

          // Add to service select
          if (serviceSelect) {
            const option = document.createElement("option");
            option.value = service.name;
            option.textContent = `${service.name} - ${priceText}`;
            serviceSelect.appendChild(option);
          }
        }
      });
    }
  });

  // Attach toggle listeners
  document.querySelectorAll(".group-toggle").forEach((btn) => {
    btn.addEventListener("click", toggleGroup);
  });

  document.querySelectorAll(".subcategory-toggle").forEach((btn) => {
    btn.addEventListener("click", toggleSubcategory);
  });

  document.querySelectorAll(".service-image-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const serviceName = decodeURIComponent(btn.dataset.service || "");
      openServiceImageModal(serviceName);
    });
  });
}

function toggleGroup(event) {
  const button = event.currentTarget;
  const groupId = button.dataset.group;
  const container = document.getElementById(groupId);
  const icon = button.querySelector(".toggle-icon");

  if (container) {
    container.classList.toggle("hidden");
    icon.textContent = container.classList.contains("hidden") ? "▼" : "▲";
  }
}

function toggleSubcategory(event) {
  const button = event.currentTarget;
  const subcategoryId = button.dataset.subcategory;
  const container = document.getElementById(subcategoryId);
  const icon = button.querySelector(".toggle-icon");

  if (container) {
    container.classList.toggle("hidden");
    if (icon) {
      icon.textContent = container.classList.contains("hidden") ? "▼" : "▲";
    }
  }
}

async function loadPricing() {
  try {
    const response = await fetch("data/pricing.json");
    if (!response.ok) throw new Error("Failed to load pricing");
    const data = await response.json();
    renderPricing(data);
  } catch (error) {
    console.error("Error loading pricing:", error);
  }
}

async function loadProducts() {
  try {
    const response = await fetch("data/products.json");
    if (!response.ok) throw new Error("Failed to load products");
    const data = await response.json();
    renderProducts(data);
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

function getProductPrefix(category) {
  const match = category.match(/^(\d+)\s/);
  return match ? match[1] : null;
}

function renderProductFilters(products) {
  const filtersContainer = document.getElementById("products-filters");
  if (!filtersContainer) return;

  // Extract unique prefixes and sort them
  const prefixes = new Set();
  let hasOther = false;
  
  products.forEach((product) => {
    const prefix = getProductPrefix(product.category);
    if (prefix) {
      prefixes.add(prefix);
    } else {
      hasOther = true;
    }
  });

  const sortedPrefixes = Array.from(prefixes).sort((a, b) => parseInt(a) - parseInt(b));

  filtersContainer.innerHTML = '<div class="filter-buttons">';
  
  // Add "All" button
  const allBtn = document.createElement("button");
  allBtn.className = "filter-btn active";
  allBtn.dataset.filter = "all";
  allBtn.textContent = "Бүгд";
  filtersContainer.appendChild(allBtn);

  // Add prefix buttons
  sortedPrefixes.forEach((prefix) => {
    const btn = document.createElement("button");
    btn.className = "filter-btn";
    btn.dataset.filter = prefix;
    btn.textContent = prefix;
    filtersContainer.appendChild(btn);
  });

  // Add "Бусад" (Other) button if there are products without numeric prefix
  if (hasOther) {
    const otherBtn = document.createElement("button");
    otherBtn.className = "filter-btn";
    otherBtn.dataset.filter = "other";
    otherBtn.textContent = "Бусад";
    filtersContainer.appendChild(otherBtn);
  }

  filtersContainer.innerHTML += "</div>";

  // Add filter event listeners
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      filterProducts(filter);
      
      // Update active button
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

function filterProducts(prefix) {
  if (prefix === "all") {
    productsCache = allProductsCache;
  } else if (prefix === "other") {
    productsCache = allProductsCache.filter((product) => {
      return getProductPrefix(product.category) === null;
    });
  } else {
    productsCache = allProductsCache.filter((product) => {
      return getProductPrefix(product.category) === prefix;
    });
  }
  currentProductsPage = 1;
  renderProductsPage(currentProductsPage);
}

function renderProducts(data) {
  const productsGrid = document.getElementById("products-grid");
  if (!productsGrid) return;
  allProductsCache = Array.isArray(data.products) ? data.products : [];
  productsCache = allProductsCache;
  currentProductsPage = 1;
  renderProductFilters(allProductsCache);
  renderProductsPage(currentProductsPage);
}

function renderProductsPage(page) {
  const productsGrid = document.getElementById("products-grid");
  if (!productsGrid) return;
  productsGrid.innerHTML = "";

  const totalProducts = productsCache.length;
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE) || 1;
  const safePage = Math.min(Math.max(page, 1), totalPages);
  currentProductsPage = safePage;

  const startIndex = (safePage - 1) * PRODUCTS_PER_PAGE;
  const visibleProducts = productsCache.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

  visibleProducts.forEach((product) => {
    const productCard = document.createElement("div");
    productCard.className = "product-card";
    const priceDisplay = formatter.format(product.price);
    productCard.innerHTML = `
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23161f1a%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2214%22 fill=%22%2364d39a%22 text-anchor=%22middle%22 dy=%22.3em%22%3EAmos Professional%3C/text%3E%3C/svg%3E'" />
      </div>
      <div class="product-info">
        <div class="product-category">${product.category}</div>
        <h4>${product.name}</h4>
        <div class="product-price">${priceDisplay} ₮</div>
      </div>
    `;
    productsGrid.appendChild(productCard);
  });

  renderProductsPagination(totalPages);
}

function renderProductsPagination(totalPages) {
  const pagination = document.getElementById("products-pagination");
  if (!pagination) return;
  pagination.innerHTML = "";

  if (totalPages <= 1) {
    pagination.style.display = "none";
    return;
  }

  pagination.style.display = "flex";

  for (let page = 1; page <= totalPages; page += 1) {
    const pageButton = document.createElement("button");
    pageButton.type = "button";
    pageButton.className = "page-btn";
    if (page === currentProductsPage) {
      pageButton.classList.add("active");
      pageButton.setAttribute("aria-current", "page");
    }
    pageButton.textContent = page;
    pageButton.addEventListener("click", () => {
      renderProductsPage(page);
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
    });
    pagination.appendChild(pageButton);
  }
}

function getDayLabel(date) {
  const options = { weekday: "short", month: "numeric", day: "numeric" };
  return date.toLocaleDateString("mn-MN", options);
}

function formatDateInput(date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
}

function renderDayStrip(startDate = new Date()) {
  dayStrip.innerHTML = "";
  const today = new Date(startDate);
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() + i);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day-btn";
    btn.dataset.date = formatDateInput(day);
    btn.innerHTML = `<div>${getDayLabel(day)}</div>`;
    btn.addEventListener("click", () => selectDay(btn.dataset.date));
    dayStrip.appendChild(btn);
  }
  selectDay(formatDateInput(today));
}

function renderTimeSlots() {
  timeSlots.innerHTML = "";
  timeOptions.forEach((time) => {
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = "time-slot";
    slot.textContent = time;
    slot.addEventListener("click", () => selectTime(time, slot));
    timeSlots.appendChild(slot);
  });
}

function selectDay(dateString) {
  dateInput.value = dateString;
  Array.from(dayStrip.children).forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.date === dateString);
  });
  timeInput.value = "";
  Array.from(timeSlots.children).forEach((slot) => slot.classList.remove("active"));
}

function selectTime(time, element) {
  timeInput.value = time;
  Array.from(timeSlots.children).forEach((slot) => slot.classList.remove("active"));
  element.classList.add("active");
}

function initDateInput() {
  const today = new Date();
  dateInput.min = formatDateInput(today);
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 30);
  dateInput.max = formatDateInput(maxDate);
  dateInput.value = formatDateInput(today);
  dateInput.addEventListener("change", (event) => selectDay(event.target.value));
}

todayBtn?.addEventListener("click", () => {
  renderDayStrip(new Date());
});

bookingForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!serviceSelect.value || !dateInput.value || !timeInput.value) {
    bookingSuccess.textContent = "Та үйлчилгээ, өдөр, цагаа бүрэн сонгоно уу.";
    return;
  }
  const name = document.getElementById("name-input").value.trim();
  const phone = document.getElementById("phone-input").value.trim();
  bookingSuccess.textContent = `${name} танд ${dateInput.value} өдөр ${timeInput.value} цагт захиалга бүртгэгдлээ. Бид утсаар баталгаажуулна (${phone}).`;
  bookingForm.reset();
  initDateInput();
  renderDayStrip(new Date());
  renderTimeSlots();
});

// Only load pricing if element exists on this page
if (document.getElementById("pricing-grid")) {
  loadPricing();
}

// Only load products if element exists on this page
if (document.getElementById("products-grid")) {
  loadProducts();
}

// Initialize booking calendar and time slots (only on pages that contain booking UI)
if (dayStrip && timeSlots && dateInput) {
  renderDayStrip(new Date());
  renderTimeSlots();
  initDateInput();
}

// Team modal functionality - only initialize if elements exist on this page
const teamModal = document.getElementById("team-modal");
const teamModalName = document.getElementById("team-modal-name");
const teamModalRole = document.getElementById("team-modal-role");
const teamModalSkill = document.getElementById("team-modal-skill");
const teamModalEducation = document.getElementById("team-modal-education");
const teamModalQualification = document.getElementById("team-modal-qualification");
const teamButtons = document.querySelectorAll(".team-more-btn");

if (teamButtons.length > 0 && teamModal) {
  function openTeamModal(button) {
    if (!teamModal || !button) return;
    teamModalName.textContent = button.dataset.name || "";
    teamModalRole.textContent = button.dataset.role || "";
    teamModalSkill.textContent = button.dataset.skill || "";
    teamModalEducation.textContent = button.dataset.education || "";
    teamModalQualification.textContent = button.dataset.qualification || "";
    teamModal.classList.add("is-open");
    teamModal.setAttribute("aria-hidden", "false");
  }

  function closeTeamModal() {
    if (!teamModal) return;
    teamModal.classList.remove("is-open");
    teamModal.setAttribute("aria-hidden", "true");
  }

  teamButtons.forEach((button) => {
    button.addEventListener("click", () => openTeamModal(button));
  });

  teamModal?.addEventListener("click", (event) => {
    const target = event.target;
    if (target?.matches("[data-team-modal-close]")) {
      closeTeamModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && teamModal?.classList.contains("is-open")) {
      closeTeamModal();
    }
  });
}

// Video popup support for stylist profiles
const videoButtons = document.querySelectorAll(".video-toggle");

if (videoButtons.length > 0) {
  const videoModal = document.createElement("div");
  videoModal.className = "video-popup-modal";
  videoModal.setAttribute("aria-hidden", "true");
  videoModal.setAttribute("role", "dialog");
  videoModal.innerHTML = `
    <div class="video-popup-backdrop" data-video-close></div>
    <div class="video-popup-content" role="document">
      <button class="video-popup-close" type="button" aria-label="Close" data-video-close>×</button>
      <video class="video-popup-player" controls playsinline preload="metadata"></video>
    </div>
  `;
  document.body.appendChild(videoModal);

  const videoPlayer = videoModal.querySelector(".video-popup-player");

  function closeVideoModal() {
    videoModal.classList.remove("is-open");
    videoModal.setAttribute("aria-hidden", "true");
    if (videoPlayer) {
      videoPlayer.pause();
      videoPlayer.removeAttribute("src");
      videoPlayer.load();
    }
  }

  function openVideoModal(videoSrc) {
    if (!videoPlayer || !videoSrc) return;
    videoPlayer.src = videoSrc;
    videoModal.classList.add("is-open");
    videoModal.setAttribute("aria-hidden", "false");

    const playPromise = videoPlayer.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // If autoplay is blocked, keep modal open and let user press play.
      });
    }
  }

  videoButtons.forEach((btn) => {
    const videoSrc = btn.dataset.video?.trim();
    if (!videoSrc) {
      btn.style.display = "none";
      return;
    }

    btn.addEventListener("click", () => openVideoModal(videoSrc));
  });

  videoModal.addEventListener("click", (event) => {
    const target = event.target;
    if (target?.matches("[data-video-close]")) {
      closeVideoModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && videoModal.classList.contains("is-open")) {
      closeVideoModal();
    }
  });
}

// ─── Keune Products ─────────────────────────────────────────
(function initKeune() {
  const keuneGrid = document.getElementById("keune-grid");
  const keuneFilters = document.getElementById("keune-filters");
  if (!keuneGrid) return; // Not on the Keune page

  let keuneAll = [];
  let keuneFiltered = [];

  // Detail modal (created once)
  let keuneModal = null;

  function ensureKeuneModal() {
    if (keuneModal) return;
    keuneModal = document.createElement("div");
    keuneModal.className = "keune-modal";
    keuneModal.setAttribute("aria-hidden", "true");
    keuneModal.innerHTML = `
      <div class="keune-modal-backdrop" data-keune-close></div>
      <div class="keune-modal-body">
        <button class="keune-modal-close" type="button" aria-label="Close" data-keune-close>×</button>
        <img src="" alt="" />
      </div>
    `;
    document.body.appendChild(keuneModal);

    keuneModal.addEventListener("click", (e) => {
      if (e.target.matches("[data-keune-close]")) closeKeuneModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && keuneModal?.classList.contains("is-open")) closeKeuneModal();
    });
  }

  function openKeuneModal(src, alt) {
    ensureKeuneModal();
    const img = keuneModal.querySelector(".keune-modal-body img");
    img.src = src;
    img.alt = alt;
    keuneModal.classList.add("is-open");
    keuneModal.setAttribute("aria-hidden", "false");
  }

  function closeKeuneModal() {
    if (!keuneModal) return;
    keuneModal.classList.remove("is-open");
    keuneModal.setAttribute("aria-hidden", "true");
  }

  // Brand image lightbox
  document.querySelectorAll(".keune-brand-img").forEach((img) => {
    img.addEventListener("click", () => openKeuneModal(img.src, img.alt || "Keune"));
  });

  // Category filters
  function renderKeuneFilters() {
    if (!keuneFilters) return;
    const categories = [...new Set(keuneAll.map((p) => p.category))].sort();
    keuneFilters.innerHTML = "";

    const allBtn = document.createElement("button");
    allBtn.className = "filter-btn active";
    allBtn.textContent = "Бүгд";
    allBtn.addEventListener("click", () => {
      keuneFiltered = keuneAll;
      renderKeuneGrid();
      setActiveFilter(allBtn);
    });
    keuneFilters.appendChild(allBtn);

    categories.forEach((cat) => {
      const btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.textContent = cat;
      btn.addEventListener("click", () => {
        keuneFiltered = keuneAll.filter((p) => p.category === cat);
        renderKeuneGrid();
        setActiveFilter(btn);
      });
      keuneFilters.appendChild(btn);
    });
  }

  function setActiveFilter(activeBtn) {
    keuneFilters.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    activeBtn.classList.add("active");
  }

  // Product grid
  function renderKeuneGrid() {
    keuneGrid.innerHTML = "";

    keuneFiltered.forEach((product) => {
      const card = document.createElement("div");
      card.className = "keune-card";

      const hasDetail = !!product.detailImage;

      card.innerHTML = `
        <img class="keune-card-img" src="${product.image}" alt="${product.name}"
             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22260%22 height=%22260%22%3E%3Crect fill=%22%23121f1a%22 width=%22260%22 height=%22260%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2214%22 fill=%22%2364d39a%22 text-anchor=%22middle%22 dy=%22.3em%22%3EKeune%3C/text%3E%3C/svg%3E'" />
        <div class="keune-card-body">
          <span class="keune-card-cat">${product.category}</span>
          <h4>${product.name}</h4>
          <p class="keune-card-desc">${product.description}</p>
          ${hasDetail ? '<span class="keune-card-badge">Дэлгэрэнгүй харах →</span>' : ""}
        </div>
      `;

      if (hasDetail) {
        card.addEventListener("click", () => openKeuneModal(product.detailImage, product.name + " дэлгэрэнгүй"));
      }

      keuneGrid.appendChild(card);
    });
  }

  // Load data
  async function loadKeuneProducts() {
    try {
      const res = await fetch("data/keune-products.json");
      if (!res.ok) throw new Error("Failed to load Keune products");
      const data = await res.json();
      keuneAll = Array.isArray(data.products) ? data.products : [];
      keuneFiltered = keuneAll;
      renderKeuneFilters();
      renderKeuneGrid();
    } catch (err) {
      console.error("Error loading Keune products:", err);
      keuneGrid.innerHTML = '<p style="text-align:center;color:var(--muted);">Бүтээгдэхүүнийг ачаалахад алдаа гарлаа.</p>';
    }
  }

  loadKeuneProducts();
})();
