const embeddedPricing = [
  {
    service: "CICA нөхөн сэргээх эмчилгээ",
    min: 154000,
    max: 198000,
  },
  {
    service: "CMC тэжээл",
    min: 132000,
    max: 132000,
  },
  {
    service: "Афра хими",
    min: 319000,
    max: 352000,
  },
  {
    service: "будаг",
    min: 88000,
    max: 200000,
  },
  {
    service: "будаг/уг",
    min: 135000,
    max: 135000,
  },
  {
    service: "гоёл/зас",
    min: 71500,
    max: 99000,
  },
  {
    service: "о/кол/сор",
    min: 380000,
    max: 460000,
  },
  {
    service: "омбре",
    min: 500000,
    max: 640000,
  },
  {
    service: "сахал",
    min: 16500,
    max: 16500,
  },
  {
    service: "сор",
    min: 120000,
    max: 190000,
  },
  {
    service: "т/ тос",
    min: 49500,
    max: 49500,
  },
  {
    service: "том хүн",
    min: 49500,
    max: 88000,
  },
  {
    service: "тэжээл",
    min: 44000,
    max: 88000,
  },
  {
    service: "угаалт",
    min: 22000,
    max: 22000,
  },
  {
    service: "х/ цэвэрлэгээ",
    min: 88000,
    max: 88000,
  },
  {
    service: "хими арчилт",
    min: 154000,
    max: 154000,
  },
  {
    service: "хими/sika",
    min: 220000,
    max: 255000,
  },
  {
    service: "хурим",
    min: 154000,
    max: 198000,
  },
  {
    service: "хусалт",
    min: 22000,
    max: 22000,
  },
  {
    service: "хэлбэрт",
    min: 33000,
    max: 50000,
  },
  {
    service: "хүүхэд",
    min: 44000,
    max: 283508,
  },
  {
    service: "чолк/т",
    min: 33000,
    max: 33000,
  },
  {
    service: "шулуун/хими",
    min: 352000,
    max: 396000,
  },
  {
    service: "эр/ хими",
    min: 132000,
    max: 154000,
  },
];

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
  if (min === max) {
    return `${formatter.format(min)} ₮`;
  }
  return `${formatter.format(min)} – ${formatter.format(max)} ₮`;
}

function renderPricing(pricing) {
  pricingGrid.innerHTML = "";
  serviceSelect.innerHTML = '<option value="">Үйлчилгээ сонгох</option>';

  pricing.forEach((item) => {
    const card = document.createElement("div");
    card.className = "price-card";
    card.innerHTML = `
      <h4>${item.service}</h4>
      <div class="price">${formatRange(item.min, item.max)}</div>
      <div class="muted">Үнийн хүрээ</div>
    `;
    pricingGrid.appendChild(card);

    const option = document.createElement("option");
    option.value = item.service;
    option.textContent = `${item.service} (${formatRange(item.min, item.max)})`;
    serviceSelect.appendChild(option);
  });
}

async function loadPricing() {
  try {
    const response = await fetch("data/pricing.json");
    if (!response.ok) throw new Error("Failed to load pricing");
    const data = await response.json();
    renderPricing(data);
  } catch (error) {
    renderPricing(embeddedPricing);
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
