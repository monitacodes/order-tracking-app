
const STATUSES = {
  RECEIVED: { text: "Order Accepted", icon: "📋", color: "text-primary" },
  PREPARING: { text: "Order is being prepared", icon: "☕", color: "text-warning" },
  HANDED_OVER: { text: "Handed over to delivery rider", icon: "🚴", color: "text-info" },
  ARRIVING: { text: "Rider arriving soon", icon: "🛵", color: "text-info" },
  DELIVERED: { text: "Order Delivered! Enjoy!", icon: "🌿🎉", color: "text-success" },
  CANCELLED: { text: "Order Cancelled", icon: "❌", color: "text-danger" }
};

// Trackers
let menuData = [];
const activeOrders = new Map();

// 1. ASYNC/FETCH: menu structure containing unique logos for items
async function fetchMenu() {
  try {
    const mockMenu = [
      { id: "item1", name: "Espresso", price: 3.50, logo: "☕" },
      { id: "item2", name: "Caramel Macchiato", price: 4.80, logo: "🥛" },
      { id: "item3", name: "Chai Latte", price: 4.50, logo: "🍂" },
      { id: "item4", name: "Strawberry Açaí Refresher", price: 5.20, logo: "🍓" },
      { id: "item5", name: "Butter Croissant", price: 3.00, logo: "🥐" }
    ];
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockMenu), 600); // Network latency simulation
    });
  } catch (error) {
    console.error("Error fetching Bean Sprout Cafe menu:", error);
  }
}

// form inputs including the unique logo for each menu item
function renderMenuInputs(items) {
  const container = document.getElementById('menuItemsContainer');
  container.innerHTML = ''; 
  
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'mb-3 row align-items-center bg-light p-2 rounded mx-0 border-start border-3 border-success';
    div.innerHTML = `
      <div class="col-sm-7 d-flex align-items-center px-1">
        <span class="menu-logo-badge">${item.logo}</span>
        <div>
          <div class="fw-semibold text-dark-brown small-title">${item.name}</div>
          <small class="text-muted">$${item.price.toFixed(2)}</small>
        </div>
      </div>
      <div class="col-sm-5 pe-1">
        <input type="number" class="form-control quantity-input text-center" 
               id="${item.id}" data-price="${item.price}" data-name="${item.name}" data-logo="${item.logo}"
               min="0" max="10" value="0">
      </div>
    `;
    container.append(div);
  });

  document.querySelectorAll('.quantity-input').forEach(input => {
    input.addEventListener('input', calculateFormTotal);
  });
  
  document.getElementById('placeOrderBtn').disabled = false;
}

// checkout basket 
function calculateFormTotal() {
  let total = 0;
  document.querySelectorAll('.quantity-input').forEach(input => {
    const qty = parseInt(input.value) || 0;
    const price = parseFloat(input.dataset.price);
    total += qty * price;
  });
  document.getElementById('formTotal').innerText = `$${total.toFixed(2)}`;
}

//  TIMERS & WORKFLOW 
function runOrderWorkflow(orderId) {
  const executionSteps = [
    { status: STATUSES.PREPARING, delay: 3500 },
    { status: STATUSES.HANDED_OVER, delay: 7000 },
    { status: STATUSES.ARRIVING, delay: 11000 },
    { status: STATUSES.DELIVERED, delay: 15000 }
  ];

  executionSteps.forEach(step => {
    const timerId = setTimeout(() => {
      const order = activeOrders.get(orderId);
      if (order && order.status !== 'CANCELLED') {
        updateOrderCardDOM(orderId, step.status);
      }
    }, step.delay);

    activeOrders.get(orderId).timers.push(timerId);
  });
}

// 3. DOM APPEND/UPDATE ACTIONS
function createOrderCardDOM(order) {
  const grid = document.getElementById('ordersGrid');
  const card = document.createElement('div');
  card.className = 'col';
  card.id = `card-${order.id}`;

  const itemsHTML = order.items.map(i => `
    <div class="d-flex justify-content-between small text-muted my-1">
      <span>${i.logo} ${i.name} <strong class="text-dark">x${i.quantity}</strong></span>
      <span>$${(i.price * i.quantity).toFixed(2)}</span>
    </div>
  `).join('');

  card.innerHTML = `
    <div class="card h-100 shadow-sm border-0 order-card">
      <div class="card-body d-flex flex-column justify-content-between">
        <div>
          <div class="d-flex justify-content-between align-items-start mb-2 border-bottom pb-2">
            <div>
              <h6 class="fw-bold mb-0 text-dark-brown">Order ID: #${order.idStr}</h6>
              <small class="text-muted" style="font-size: 11px;">📅 ${order.timestamp}</small>
            </div>
            <span class="badge bg-success text-white">Active</span>
          </div>
          
          <div class="my-2 py-1">
            ${itemsHTML}
            <div class="d-flex justify-content-between fw-bold text-dark-brown border-top pt-2 mt-2">
              <span>Basket Total:</span>
              <span>$${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="text-center py-3 my-2 bg-light rounded tracking-status-block border">
          <span class="status-icon" id="icon-${order.id}">${STATUSES.RECEIVED.icon}</span>
          <p class="fw-bold mb-0 text-dark-brown" id="status-${order.id}">${STATUSES.RECEIVED.text}</p>
        </div>

        <button class="btn btn-outline-danger btn-sm w-100 py-2 mt-1" id="cancel-btn-${order.id}" onclick="cancelOrder('${order.id}')">
          🛑 Cancel Preparation
        </button>
      </div>
    </div>
  `;

  grid.append(card);
  toggleEmptyState();
}

function updateOrderCardDOM(orderId, statusObject) {
  const order = activeOrders.get(orderId);
  if (!order) return;

  order.status = statusObject.text;

  const statusLabel = document.getElementById(`status-${orderId}`);
  const iconLabel = document.getElementById(`icon-${orderId}`);
  const cancelBtn = document.getElementById(`cancel-btn-${orderId}`);
  const cardElement = document.querySelector(`#card-${orderId} .order-card`);
  const badgeElement = document.querySelector(`#card-${orderId} .badge`);

  if (statusLabel) statusLabel.innerText = statusObject.text;
  if (iconLabel) iconLabel.innerHTML = statusObject.icon;

  if (statusObject.text === STATUSES.DELIVERED.text) {
    if (cancelBtn) cancelBtn.remove();
    if (badgeElement) {
      badgeElement.className = "badge bg-secondary";
      badgeElement.innerText = "Completed";
    }
    activeOrders.delete(orderId);
    toggleEmptyState();
  } else if (statusObject.text === STATUSES.CANCELLED.text) {
    if (cancelBtn) cancelBtn.remove();
    if (badgeElement) {
      badgeElement.className = "badge bg-danger";
      badgeElement.innerText = "Cancelled";
    }
    if (cardElement) cardElement.classList.add('cancelled');
    
    setTimeout(() => {
      document.getElementById(`card-${orderId}`)?.remove();
      toggleEmptyState();
    }, 4000);
  }
}

// 4. ACTION & SUBMISSIONS
window.cancelOrder = function(orderId) {
  const order = activeOrders.get(orderId);
  if (!order) return;

  order.timers.forEach(clearTimeout);
  updateOrderCardDOM(orderId, STATUSES.CANCELLED);
  activeOrders.delete(orderId);
};

function toggleEmptyState() {
  const grid = document.getElementById('ordersGrid');
  const emptyState = document.getElementById('emptyState');
  const counter = document.getElementById('activeCounter');
  
  const count = grid.children.length;
  counter.innerText = `${count} Active Trackers`;
  emptyState.style.display = count === 0 ? 'block' : 'none';
}

document.getElementById('orderForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const selectedItems = [];
  let totalOrderAmount = 0;

  document.querySelectorAll('.quantity-input').forEach(input => {
    const quantity = parseInt(input.value) || 0;
    if (quantity > 0) {
      const price = parseFloat(input.dataset.price);
      const name = input.dataset.name;
      const logo = input.dataset.logo;
      totalOrderAmount += quantity * price;
      selectedItems.push({ name, quantity, price, logo });
    }
  });

  if (selectedItems.length === 0) {
    alert("Your basket is empty! Please select at least one farm-fresh beverage.");
    return;
  }

  const uniqueId = Date.now();
  const dateObject = new Date();
  
  const orderPayload = {
    id: uniqueId,
    idStr: "BS-" + Math.floor(1000 + Math.random() * 9000), 
    timestamp: dateObject.toLocaleDateString() + ' ' + dateObject.toLocaleTimeString(),
    items: selectedItems,
    total: totalOrderAmount,
    status: STATUSES.RECEIVED.text,
    timers: []
  };

  activeOrders.set(uniqueId, orderPayload);
  createOrderCardDOM(orderPayload);
  runOrderWorkflow(uniqueId);

  this.reset();
  document.getElementById('formTotal').innerText = "$0.00";
});

window.addEventListener('DOMContentLoaded', async () => {
  menuData = await fetchMenu();
  renderMenuInputs(menuData);
});