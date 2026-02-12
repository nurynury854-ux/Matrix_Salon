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

// Initialize booking calendar and time slots
renderDayStrip(new Date());
renderTimeSlots();
initDateInput();

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

// Video toggle support for stylist profiles
document.querySelectorAll('.video-toggle').forEach((btn) => {
  const videoSrc = btn.dataset.video?.trim();
  const videoEl = btn.parentElement?.querySelector('.profile-video');
  if (!videoSrc) {
    // hide button if no video source configured yet
    btn.style.display = 'none';
    return;
  }

  btn.addEventListener('click', () => {
    if (!videoEl) return;
    if (videoEl.style.display === 'none' || videoEl.style.display === '') {
      if (!videoEl.src) videoEl.src = videoSrc;
      videoEl.style.display = 'block';
      btn.textContent = 'Хаах';
    } else {
      videoEl.pause();
      videoEl.style.display = 'none';
      btn.textContent = 'Видео';
    }
  });
});
