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
  Object.values(pricingData).forEach((category) => {
    // Category header
    const categoryHeader = document.createElement("div");
    categoryHeader.className = "pricing-category-header";
    categoryHeader.textContent = category.category;
    pricingGrid.appendChild(categoryHeader);

    // Check if category has subcategories (new structure)
    if (category.subcategories) {
      category.subcategories.forEach((subcategory) => {
        // Subcategory header
        const subcategoryHeader = document.createElement("div");
        subcategoryHeader.className = "pricing-subcategory-header";
        subcategoryHeader.innerHTML = `
          <h3>${subcategory.name}</h3>
        `;
        pricingGrid.appendChild(subcategoryHeader);

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

            pricingGrid.appendChild(variantsContainer);
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

          pricingGrid.appendChild(variantsContainer);
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

loadPricing();
renderDayStrip(new Date());
renderTimeSlots();
initDateInput();

const teamModal = document.getElementById("team-modal");
const teamModalName = document.getElementById("team-modal-name");
const teamModalRole = document.getElementById("team-modal-role");
const teamModalSkill = document.getElementById("team-modal-skill");
const teamModalEducation = document.getElementById("team-modal-education");
const teamModalQualification = document.getElementById("team-modal-qualification");
const teamButtons = document.querySelectorAll(".team-more-btn");

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
