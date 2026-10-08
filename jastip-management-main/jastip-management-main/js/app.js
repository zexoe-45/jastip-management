if (!requireLogin()) throw new Error("not logged");
const page = document.body.dataset.page;
const customerData = () => Store.get(STORAGE_KEYS.customers, []);
const batchData = () => Store.get(STORAGE_KEYS.batches, []);
const orderData = () => Store.get(STORAGE_KEYS.orders, []);
function shell(title, content) {
  return `<div class="layout"><aside class="sidebar" id="sidebar">
 <div class="brand"><div class="brand-mark">J</div><div><b>Jastip<span>Pro</span></b><small>Management System</small></div></div>
 <div class="nav-title">Menu Utama</div>
 <a class="nav-link ${page === "dashboard" ? "active" : ""}" href="dashboard.html">▦ <span>Dashboard</span></a>
 <a class="nav-link ${page === "customer" ? "active" : ""}" href="customer.html">♙ <span>Customer</span></a>
 <a class="nav-link ${page === "batch" ? "active" : ""}" href="batch.html">◫ <span>Batch Jastip</span></a>
 <a class="nav-link ${["order", "order-form", "order-detail"].includes(page) ? "active" : ""}" href="order.html">☷ <span>Order</span></a>
 <div class="nav-title">Sistem</div><a class="nav-link ${page === "settings" ? "active" : ""}" href="settings.html">⚙ <span>Pengaturan</span></a>
 <div class="sidebar-footer"><button class="btn btn-secondary btn-block" onclick="logout()">Keluar</button></div>
 </aside><main class="main"><header class="topbar"><button class="mobile-menu" onclick="toggleSidebar()">☰</button><h2>${title}</h2><div class="user-box">Admin · Demo</div></header><section class="content">${content}</section></main></div>`;
}
function logout() {
  localStorage.removeItem(STORAGE_KEYS.session);
  location.href = "landing.html";
}
function toggleSidebar() {
  qs("#sidebar")?.classList.toggle("open");
}
function init() {
  if (page === "dashboard") renderDashboard();
  if (page === "customer") renderCustomers();
  if (page === "batch") renderBatches();
  if (page === "order") renderOrders();
  if (page === "order-form") renderOrderForm();
  if (page === "order-detail") renderOrderDetail();
  if (page === "settings") renderSettings();
}
function renderDashboard() {
  const orders = orderData(),
    customers = customerData(),
    batches = batchData();
  const active = orders.filter(
      (o) => !["Selesai", "Dibatalkan"].includes(o.orderStatus),
    ).length,
    unpaid = orders.filter((o) => paymentStatus(o) !== "Lunas").length,
    shipping = orders.filter(
      (o) => o.orderStatus === "Dalam Perjalanan",
    ).length,
    done = orders.filter((o) => o.orderStatus === "Selesai").length;
  const transaction = orders.reduce((s, o) => s + orderTotal(o), 0),
    fee = orders.reduce((s, o) => s + Number(o.fee || 0), 0);
  const recent = [...orders]
    .sort((a, b) => b.orderDate.localeCompare(a.orderDate))
    .slice(0, 5);
  const statuses = [
    "Pesanan Masuk",
    "Barang Dibeli",
    "Dalam Perjalanan",
    "Barang Sampai",
    "Selesai",
    "Dibatalkan",
  ];
  const content = `<div class="page-head"><div><h1>Dashboard</h1><p>Ringkasan operasional jastip hari ini.</p></div><div class="actions"><a class="btn btn-primary" href="order-form.html">+ Buat Order</a></div></div>
 <div class="cards">${stat("Total Customer", customers.length, "♙")}${stat("Total Order", orders.length, "☷")}${stat("Order Aktif", active, "◷")}${stat("Order Belum Lunas", unpaid, "Rp")}${stat("Dalam Perjalanan", shipping, "→")}${stat("Order Selesai", done, "✓")}${stat("Total Nilai Transaksi", money(transaction), "Rp")}${stat("Estimasi Fee Jastip", money(fee), "★")}</div>
 <div class="grid-2"><div class="card table-card"><div class="card-head"><h3>Recent Orders</h3><a class="btn btn-secondary btn-sm" href="order.html">Lihat Semua</a></div><div class="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Pembayaran</th><th>Status</th></tr></thead><tbody>${recent.map((o) => `<tr><td><a href="order-detail.html?id=${o.id}"><b>${o.id}</b></a></td><td>${esc(customerName(o.customerId))}</td><td>${money(orderTotal(o))}</td><td>${badge(paymentStatus(o))}</td><td>${badge(o.orderStatus)}</td></tr>`).join("")}</tbody></table></div></div>
 <div class="card"><div class="card-head"><h3>Order Status Summary</h3></div><div class="detail-list">${statuses.map((s) => `<div class="detail-row"><span>${s}</span><b>${orders.filter((o) => o.orderStatus === s).length}</b></div>`).join("")}</div></div></div>
 <div class="card" style="margin-top:18px"><div class="card-head"><h3>Status Batch Jastip</h3></div><div class="table-wrap"><table><thead><tr><th>Batch</th><th>Lokasi</th><th>Status</th><th>Quota</th><th>Sisa</th></tr></thead><tbody>${batches.map((b) => `<tr><td>${esc(b.name)}</td><td>${esc(b.location)}</td><td>${badge(b.status)}</td><td>${b.quota}</td><td>${batchRemaining(b)}</td></tr>`).join("")}</tbody></table></div></div>`;
  document.getElementById("app").innerHTML = shell("Dashboard", content);
}
function stat(label, value, icon) {
  return `<div class="card"><span class="stat-icon">${icon}</span><div class="stat-label">${label}</div><div class="stat-value">${value}</div></div>`;
}
function renderCustomers() {
  const data = customerData();
  const q = getParam("q") || "";
  const rows = data.filter((c) =>
    (c.name + c.whatsapp + c.city).toLowerCase().includes(q.toLowerCase()),
  );
  const content = `<div class="page-head"><div><h1>Customer</h1><p>Kelola data pelanggan jastip.</p></div><button class="btn btn-primary" onclick="openCustomerModal()">+ Tambah Customer</button></div>
 <div class="toolbar"><input id="customerSearch" value="${esc(q)}" placeholder="Cari nama, WhatsApp, kota..."></div>
 <div class="card table-card"><div class="table-wrap"><table><thead><tr><th>Nama</th><th>WhatsApp</th><th>Kota</th><th>Alamat</th><th>Catatan</th><th>Aksi</th></tr></thead><tbody>${rows.length ? rows.map((c) => `<tr><td><b>${esc(c.name)}</b></td><td>${esc(c.whatsapp)}</td><td>${esc(c.city)}</td><td>${esc(c.address)}</td><td>${esc(c.note || "—")}</td><td><button class="btn btn-secondary btn-sm" onclick="openCustomerModal('${c.id}')">Edit</button> <button class="btn btn-danger btn-sm" onclick="deleteCustomer('${c.id}')">Hapus</button></td></tr>`).join("") : `<tr><td colspan="6"><div class="empty">Customer tidak ditemukan.</div></td></tr>`}</tbody></table></div></div>${modalHTML()}`;
  document.getElementById("app").innerHTML = shell("Customer", content);
  
  // Add event listener after render
  const searchInput = document.getElementById("customerSearch");
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener("input", function(e) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        filterCustomer(e.target.value);
      }, 300);
    });
  }
}
function filterCustomer(q) {
  const url = new URL(location.href);
  q ? url.searchParams.set("q", q) : url.searchParams.delete("q");
  history.replaceState({}, "", url);
  
  // Update table only, not entire page
  const data = customerData();
  const rows = data.filter((c) =>
    (c.name + c.whatsapp + c.city).toLowerCase().includes(q.toLowerCase()),
  );
  
  const tableBody = document.querySelector(".table-card tbody");
  if (tableBody) {
    tableBody.innerHTML = rows.length ? rows.map((c) => `<tr><td><b>${esc(c.name)}</b></td><td>${esc(c.whatsapp)}</td><td>${esc(c.city)}</td><td>${esc(c.address)}</td><td>${esc(c.note || "—")}</td><td><button class="btn btn-secondary btn-sm" onclick="openCustomerModal('${c.id}')">Edit</button> <button class="btn btn-danger btn-sm" onclick="deleteCustomer('${c.id}')">Hapus</button></td></tr>`).join("") : `<tr><td colspan="6"><div class="empty">Customer tidak ditemukan.</div></td></tr>`;
  }
}
function modalHTML() {
  return `<div id="modal" class="modal-backdrop"><div class="modal"><div id="modalContent"></div></div></div>`;
}
function openModal(html) {
  qs("#modalContent").innerHTML = html;
  qs("#modal").classList.add("show");
}
function closeModal() {
  qs("#modal")?.classList.remove("show");
}
function openCustomerModal(id = "") {
  const c = customerData().find((x) => x.id === id) || {
    name: "",
    whatsapp: "",
    address: "",
    city: "",
    note: "",
  };
  openModal(
    `<div class="modal-head"><h3>${id ? "Edit" : "Tambah"} Customer</h3><button class="close" onclick="closeModal()">×</button></div><form onsubmit="saveCustomer(event,'${id}')"><div class="form-grid"><label>Nama<input name="name" required value="${esc(c.name)}"></label><label>WhatsApp<input name="whatsapp" required value="${esc(c.whatsapp)}"></label><label>Kota<input name="city" required value="${esc(c.city)}"></label><label>Alamat<input name="address" required value="${esc(c.address)}"></label><label class="full">Catatan<textarea name="note">${esc(c.note)}</textarea></label></div><br><button class="btn btn-primary btn-block">Simpan</button></form>`,
  );
}
function saveCustomer(e, id) {
  e.preventDefault();
  const f = new FormData(e.target),
    arr = customerData();
  const obj = {
    id: id || uid("CUST"),
    name: f.get("name").trim(),
    whatsapp: f.get("whatsapp").trim(),
    address: f.get("address").trim(),
    city: f.get("city").trim(),
    note: f.get("note").trim(),
  };
  if (id) {
    const i = arr.findIndex((x) => x.id === id);
    arr[i] = obj;
  } else arr.push(obj);
  Store.set(STORAGE_KEYS.customers, arr);
  closeModal();
  toast("Customer berhasil disimpan");
  setTimeout(renderCustomers, 300);
}
function deleteCustomer(id) {
  const has = orderData().some((o) => o.customerId === id);
  if (has) {
    alert(
      "Customer tidak dapat dihapus karena masih memiliki order. Hapus/ubah order terkait terlebih dahulu.",
    );
    return;
  }
  if (confirm("Hapus customer ini?")) {
    Store.set(
      STORAGE_KEYS.customers,
      customerData().filter((x) => x.id !== id),
    );
    toast("Customer dihapus");
    setTimeout(renderCustomers, 300);
  }
}
function renderBatches() {
  const data = batchData();
  const q = getParam("q") || "",
    status = getParam("status") || "";
  const rows = data.filter(
    (b) =>
      (b.name + b.location).toLowerCase().includes(q.toLowerCase()) &&
      (!status || b.status === status),
  );
  const statuses = [
    "Upcoming",
    "Open",
    "Closed",
    "Shopping",
    "Shipping",
    "Completed",
  ];
  const content = `<div class="page-head"><div><h1>Batch Jastip</h1><p>Kelola perjalanan, quota, dan status batch.</p></div><button class="btn btn-primary" onclick="openBatchModal()">+ Tambah Batch</button></div>
 <div class="toolbar"><input id="batchSearch" value="${esc(q)}" placeholder="Cari batch/lokasi..."><select id="batchStatus" onchange="filterBatchStatus(this.value)"><option value="">Semua Status</option>${statuses.map((s) => `<option ${s === status ? "selected" : ""}>${s}</option>`).join("")}</select></div>
 <div class="card table-card"><div class="table-wrap"><table><thead><tr><th>Batch</th><th>Lokasi</th><th>Deadline</th><th>Status</th><th>Quota</th><th>Terpakai</th><th>Sisa</th><th>Aksi</th></tr></thead><tbody>${rows.length ? rows.map((b) => `<tr><td><b>${esc(b.name)}</b></td><td>${esc(b.location)}</td><td>${dateId(b.deadline)}</td><td>${badge(b.status)}</td><td>${b.quota}</td><td>${batchCount(b.id)}</td><td><b>${batchRemaining(b)}</b></td><td><button class="btn btn-secondary btn-sm" onclick="openBatchModal('${b.id}')">Edit</button> <button class="btn btn-danger btn-sm" onclick="deleteBatch('${b.id}')">Hapus</button></td></tr>`).join("") : `<tr><td colspan="8"><div class="empty">Batch tidak ditemukan.</div></td></tr>`}</tbody></table></div></div>${modalHTML()}`;
  document.getElementById("app").innerHTML = shell("Batch Jastip", content);
  
  // Add event listener after render
  const searchInput = document.getElementById("batchSearch");
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener("input", function(e) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        filterBatch(e.target.value);
      }, 300);
    });
  }
}
function filterBatch(q) {
  const u = new URL(location.href);
  q ? u.searchParams.set("q", q) : u.searchParams.delete("q");
  history.replaceState({}, "", u);
  
  // Update table only, not entire page
  const data = batchData();
  const status = getParam("status") || "";
  const rows = data.filter(
    (b) =>
      (b.name + b.location).toLowerCase().includes(q.toLowerCase()) &&
      (!status || b.status === status),
  );
  
  const tableBody = document.querySelector(".table-card tbody");
  if (tableBody) {
    tableBody.innerHTML = rows.length ? rows.map((b) => `<tr><td><b>${esc(b.name)}</b></td><td>${esc(b.location)}</td><td>${dateId(b.deadline)}</td><td>${badge(b.status)}</td><td>${b.quota}</td><td>${batchCount(b.id)}</td><td><b>${batchRemaining(b)}</b></td><td><button class="btn btn-secondary btn-sm" onclick="openBatchModal('${b.id}')">Edit</button> <button class="btn btn-danger btn-sm" onclick="deleteBatch('${b.id}')">Hapus</button></td></tr>`).join("") : `<tr><td colspan="8"><div class="empty">Batch tidak ditemukan.</div></td></tr>`;
  }
}
function filterBatchStatus(s) {
  const u = new URL(location.href);
  s ? u.searchParams.set("status", s) : u.searchParams.delete("status");
  history.replaceState({}, "", u);
  renderBatches();
}
function openBatchModal(id = "") {
  const b = batchData().find((x) => x.id === id) || {
    name: "",
    location: "",
    openDate: "",
    deadline: "",
    estimatedArrival: "",
    quota: 10,
    status: "Upcoming",
  };
  const statuses = [
    "Upcoming",
    "Open",
    "Closed",
    "Shopping",
    "Shipping",
    "Completed",
  ];
  openModal(
    `<div class="modal-head"><h3>${id ? "Edit" : "Tambah"} Batch</h3><button class="close" onclick="closeModal()">×</button></div><form onsubmit="saveBatch(event,'${id}')"><div class="form-grid"><label>Nama Batch<input name="name" required value="${esc(b.name)}"></label><label>Lokasi<input name="location" required value="${esc(b.location)}"></label><label>Tanggal Buka<input type="date" name="openDate" required value="${b.openDate}"></label><label>Deadline<input type="date" name="deadline" required value="${b.deadline}"></label><label>Estimasi Tiba<input type="date" name="estimatedArrival" required value="${b.estimatedArrival}"></label><label>Quota<input type="number" min="1" name="quota" required value="${b.quota}"></label><label>Status<select name="status">${statuses.map((s) => `<option ${s === b.status ? "selected" : ""}>${s}</option>`).join("")}</select></label></div><br><button class="btn btn-primary btn-block">Simpan</button></form>`,
  );
}
function saveBatch(e, id) {
  e.preventDefault();
  const f = new FormData(e.target),
    arr = batchData();
  const old = arr.find((x) => x.id === id);
  const quota = Number(f.get("quota"));
  if (quota < (old ? batchCount(id) : 0)) {
    alert("Quota tidak boleh lebih kecil dari jumlah order aktif.");
    return;
  }
  const obj = {
    id: id || uid("BATCH"),
    name: f.get("name").trim(),
    location: f.get("location").trim(),
    openDate: f.get("openDate"),
    deadline: f.get("deadline"),
    estimatedArrival: f.get("estimatedArrival"),
    quota,
    status: f.get("status"),
  };
  if (id) arr[arr.findIndex((x) => x.id === id)] = obj;
  else arr.push(obj);
  Store.set(STORAGE_KEYS.batches, arr);
  closeModal();
  toast("Batch berhasil disimpan");
  setTimeout(renderBatches, 300);
}
function deleteBatch(id) {
  if (orderData().some((o) => o.batchId === id)) {
    alert("Batch tidak dapat dihapus karena sudah memiliki order.");
    return;
  }
  if (confirm("Hapus batch ini?")) {
    Store.set(
      STORAGE_KEYS.batches,
      batchData().filter((x) => x.id !== id),
    );
    toast("Batch dihapus");
    setTimeout(renderBatches, 300);
  }
}
function renderOrders() {
  const orders = orderData(),
    q = getParam("q") || "",
    os = getParam("os") || "",
    ps = getParam("ps") || "";
  const rows = orders.filter((o) => {
    const text = (
      o.id +
      " " +
      customerName(o.customerId) +
      " " +
      batchName(o.batchId)
    ).toLowerCase();
    return (
      text.includes(q.toLowerCase()) &&
      (!os || o.orderStatus === os) &&
      (!ps || paymentStatus(o) === ps)
    );
  });
  const orderStatuses = [
    "Pesanan Masuk",
    "Barang Dibeli",
    "Dalam Perjalanan",
    "Barang Sampai",
    "Selesai",
    "Dibatalkan",
  ];
  const content = `<div class="page-head"><div><h1>Order Jastip</h1><p>Kelola pesanan, status, dan pembayaran.</p></div><a class="btn btn-primary" href="order-form.html">+ Buat Order</a></div>
 <div class="toolbar"><input id="orderSearch" value="${esc(q)}" placeholder="Cari nomor/customer/batch..."><select id="orderStatusFilter" onchange="filterOrderOS(this.value)"><option value="">Semua Order Status</option>${orderStatuses.map((s) => `<option ${s === os ? "selected" : ""}>${s}</option>`).join("")}</select><select id="paymentStatusFilter" onchange="filterOrderPS(this.value)"><option value="">Semua Payment Status</option>${["Belum Bayar", "DP", "Lunas"].map((s) => `<option ${s === ps ? "selected" : ""}>${s}</option>`).join("")}</select></div>
 <div class="card table-card"><div class="table-wrap"><table><thead><tr><th>Nomor</th><th>Customer</th><th>Batch</th><th>Tanggal</th><th>Total</th><th>Payment</th><th>Order Status</th><th>Aksi</th></tr></thead><tbody>${rows.length ? rows.map((o) => `<tr><td><b>${o.id}</b></td><td>${esc(customerName(o.customerId))}</td><td>${esc(batchName(o.batchId))}</td><td>${dateId(o.orderDate)}</td><td>${money(orderTotal(o))}</td><td>${badge(paymentStatus(o))}</td><td>${badge(o.orderStatus)}</td><td><a class="btn btn-secondary btn-sm" href="order-detail.html?id=${o.id}">Detail</a></td></tr>`).join("") : `<tr><td colspan="8"><div class="empty">Order tidak ditemukan.</div></td></tr>`}</tbody></table></div></div>`;
  document.getElementById("app").innerHTML = shell("Order Jastip", content);
  
  // Add event listener after render
  const searchInput = document.getElementById("orderSearch");
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener("input", function(e) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        filterOrderSearch(e.target.value);
      }, 300);
    });
  }
}
function setOrderFilter(key, val) {
  const u = new URL(location.href);
  val ? u.searchParams.set(key, val) : u.searchParams.delete(key);
  history.replaceState({}, "", u);
  
  // Update table only
  const orders = orderData(),
    q = getParam("q") || "",
    os = getParam("os") || "",
    ps = getParam("ps") || "";
  const rows = orders.filter((o) => {
    const text = (
      o.id +
      " " +
      customerName(o.customerId) +
      " " +
      batchName(o.batchId)
    ).toLowerCase();
    return (
      text.includes(q.toLowerCase()) &&
      (!os || o.orderStatus === os) &&
      (!ps || paymentStatus(o) === ps)
    );
  });
  
  const tableBody = document.querySelector(".table-card tbody");
  if (tableBody) {
    tableBody.innerHTML = rows.length ? rows.map((o) => `<tr><td><b>${o.id}</b></td><td>${esc(customerName(o.customerId))}</td><td>${esc(batchName(o.batchId))}</td><td>${dateId(o.orderDate)}</td><td>${money(orderTotal(o))}</td><td>${badge(paymentStatus(o))}</td><td>${badge(o.orderStatus)}</td><td><a class="btn btn-secondary btn-sm" href="order-detail.html?id=${o.id}">Detail</a></td></tr>`).join("") : `<tr><td colspan="8"><div class="empty">Order tidak ditemukan.</div></td></tr>`;
  }
}
const filterOrderSearch = (q) => setOrderFilter("q", q),
  filterOrderOS = (s) => setOrderFilter("os", s),
  filterOrderPS = (s) => setOrderFilter("ps", s);
function renderOrderForm() {
  const id = getParam("id"),
    old = orderData().find((o) => o.id === id),
    customers = customerData(),
    batches = batchData();
  const o = old || {
    customerId: "",
    batchId: "",
    orderDate: new Date().toISOString().slice(0, 10),
    items: [{ productName: "", qty: 1, unitPrice: 0 }],
    fee: 0,
    shippingCost: 0,
    paidAmount: 0,
    note: "",
  };
  const content = `<div class="page-head"><div><h1>${id ? "Edit" : "Buat"} Order</h1><p>Order hanya dapat dibuat pada batch Open dan quota masih tersedia.</p></div></div>
 <form id="orderForm" class="card form-card" onsubmit="saveOrder(event,'${id || ""}')">
 <div class="form-grid"><label>Customer<select name="customerId" required><option value="">Pilih customer</option>${customers.map((c) => `<option value="${c.id}" ${c.id === o.customerId ? "selected" : ""}>${esc(c.name)} — ${esc(c.whatsapp)}</option>`).join("")}</select></label>
 <label>Batch Jastip<select name="batchId" required><option value="">Pilih batch</option>${batches
   .map((b) => {
     const allowed =
       b.status === "Open" && (batchRemaining(b) > 0 || b.id === o.batchId);
     return `<option value="${b.id}" ${b.id === o.batchId ? "selected" : ""} ${allowed ? "" : "disabled"}>${esc(b.name)} — sisa ${batchRemaining(b)}</option>`;
   })
   .join("")}</select></label>
 <label>Tanggal Order<input type="date" name="orderDate" required value="${o.orderDate}"></label><label>Catatan<textarea name="note">${esc(o.note || "")}</textarea></label></div>
 <div class="section-title">Daftar Produk</div><div id="items">${o.items.map((i, n) => itemRow(i, n)).join("")}</div>
 <button type="button" class="btn btn-secondary btn-sm" onclick="addItem()">+ Tambah Item</button>
 <div class="section-title">Biaya & Pembayaran</div><div class="form-grid"><label>Fee Jastip (Rp)<input id="fee" type="number" min="0" value="${o.fee}" oninput="updateCalc()"></label><label>Ongkir (Rp)<input id="shipping" type="number" min="0" value="${o.shippingCost}" oninput="updateCalc()"></label><label>Paid Amount / Pembayaran Saat Ini (Rp)<input id="paid" type="number" min="0" value="${id ? 0 : o.paidAmount}" ${id ? "" : "required"}><small class="muted">${id ? "Untuk edit, gunakan tombol Catat Pembayaran di halaman detail." : ""}</small></label></div>
 <div class="summary" style="margin-top:15px"><div class="summary-line"><span>Subtotal</span><b id="subtotal">Rp0</b></div><div class="summary-line"><span>Fee</span><b id="feeShow">Rp0</b></div><div class="summary-line"><span>Ongkir</span><b id="shipShow">Rp0</b></div><div class="summary-line total"><span>Total</span><b id="total">Rp0</b></div></div>
 <br><div class="actions"><a href="order.html" class="btn btn-secondary">Kembali</a><button class="btn btn-primary">Simpan Order</button></div></form>`;
  document.getElementById("app").innerHTML = shell("Form Order", content);
  updateCalc();
}
function itemRow(i, n) {
  return `<div class="item-row"><label>Nama Produk<input name="productName" required value="${esc(i.productName)}" oninput="updateCalc()"></label><label>Qty<input name="qty" type="number" min="1" required value="${i.qty}" oninput="updateCalc()"></label><label>Harga Satuan<input name="unitPrice" type="number" min="1" required value="${i.unitPrice}" oninput="updateCalc()"></label><div><small class="muted">Subtotal</small><div class="money item-subtotal">${money(itemSubtotal(i))}</div></div><button type="button" class="btn btn-danger" onclick="removeItem(this)">×</button></div>`;
}
function addItem() {
  qs("#items").insertAdjacentHTML(
    "beforeend",
    itemRow({ productName: "", qty: 1, unitPrice: 0 }, Date.now()),
  );
  updateCalc();
}
function removeItem(btn) {
  if (document.querySelectorAll("#items .item-row").length <= 1) {
    alert("Minimal 1 item.");
    return;
  }
  btn.closest(".item-row").remove();
  updateCalc();
}
function readItems() {
  return [...document.querySelectorAll("#items .item-row")].map((r) => ({
    productName: r.querySelector('[name="productName"]').value.trim(),
    qty: Number(r.querySelector('[name="qty"]').value),
    unitPrice: Number(r.querySelector('[name="unitPrice"]').value),
  }));
}
function updateCalc() {
  const items = readItems();
  const sub = items.reduce((s, i) => s + itemSubtotal(i), 0),
    fee = Number(qs("#fee")?.value || 0),
    ship = Number(qs("#shipping")?.value || 0);
  document
    .querySelectorAll(".item-subtotal")
    .forEach((x, n) => (x.textContent = money(itemSubtotal(items[n]))));
  if (qs("#subtotal")) qs("#subtotal").textContent = money(sub);
  if (qs("#feeShow")) qs("#feeShow").textContent = money(fee);
  if (qs("#shipShow")) qs("#shipShow").textContent = money(ship);
  if (qs("#total")) qs("#total").textContent = money(sub + fee + ship);
}
function saveOrder(e, id) {
  e.preventDefault();
  const f = new FormData(e.target),
    items = readItems(),
    b = batchData().find((x) => x.id === f.get("batchId"));
  if (
    !items.length ||
    items.some((i) => !i.productName || i.qty < 1 || i.unitPrice <= 0)
  ) {
    alert("Minimal 1 item, quantity minimal 1, harga harus lebih dari 0.");
    return;
  }
  if (!b) {
    alert("Batch tidak valid.");
    return;
  }
  if (!id && (b.status !== "Open" || batchRemaining(b) <= 0)) {
    alert(
      "Order hanya boleh dibuat pada batch Open yang masih memiliki quota.",
    );
    return;
  }
  const arr = orderData(),
    old = arr.find((x) => x.id === id);
  const base = {
    id: id || orderNumber(),
    customerId: f.get("customerId"),
    batchId: f.get("batchId"),
    orderDate: f.get("orderDate"),
    items,
    fee: Number(qs("#fee").value || 0),
    shippingCost: Number(qs("#shipping").value || 0),
    paidAmount: id ? old.paidAmount : Number(qs("#paid").value || 0),
    orderStatus: old?.orderStatus || "Pesanan Masuk",
    note: f.get("note"),
  };
  const total = orderTotal(base);
  if (base.paidAmount < 0 || base.paidAmount > total) {
    alert("Pembayaran tidak boleh negatif atau melebihi total.");
    return;
  }
  if (id) arr[arr.findIndex((x) => x.id === id)] = base;
  else arr.push(base);
  Store.set(STORAGE_KEYS.orders, arr);
  toast("Order berhasil disimpan");
  location.href = `order-detail.html?id=${base.id}`;
}
function renderOrderDetail() {
  const id = getParam("id"),
    o = orderData().find((x) => x.id === id);
  if (!o) {
    document.getElementById("app").innerHTML = shell(
      "Order",
      '<div class="card"><div class="empty">Order tidak ditemukan.</div></div>',
    );
    return;
  }
  const total = orderTotal(o),
    pay = paymentStatus(o),
    statuses = [
      "Pesanan Masuk",
      "Barang Dibeli",
      "Dalam Perjalanan",
      "Barang Sampai",
      "Selesai",
    ];
  const next = statuses.indexOf(o.orderStatus),
    canAdvance =
      next >= 0 &&
      next < statuses.length - 1 &&
      !["Selesai", "Dibatalkan"].includes(o.orderStatus);
  const content = `<div class="page-head"><div><h1>Detail Order</h1><p>${o.id}</p></div><div class="actions"><a class="btn btn-secondary" href="order.html">Kembali</a>${!["Selesai", "Dibatalkan"].includes(o.orderStatus) ? `<a class="btn btn-secondary" href="order-form.html?id=${o.id}">Edit</a>` : ""}</div></div>
 <div class="detail-grid"><div class="card"><div class="card-head"><h3>Informasi Order</h3></div><div class="detail-list"><div class="detail-row"><span>Nomor</span><b>${o.id}</b></div><div class="detail-row"><span>Customer</span><b>${esc(customerName(o.customerId))}</b></div><div class="detail-row"><span>Batch</span><b>${esc(batchName(o.batchId))}</b></div><div class="detail-row"><span>Tanggal</span><b>${dateId(o.orderDate)}</b></div><div class="detail-row"><span>Order Status</span><b>${badge(o.orderStatus)}</b></div><div class="detail-row"><span>Payment Status</span><b>${badge(pay)}</b></div><div class="detail-row"><span>Catatan</span><b>${esc(o.note || "—")}</b></div></div></div>
 <div class="card"><div class="card-head"><h3>Ringkasan Pembayaran</h3></div><div class="summary"><div class="summary-line"><span>Subtotal</span><b>${money(total - o.fee - o.shippingCost)}</b></div><div class="summary-line"><span>Fee</span><b>${money(o.fee)}</b></div><div class="summary-line"><span>Ongkir</span><b>${money(o.shippingCost)}</b></div><div class="summary-line total"><span>Total</span><b>${money(total)}</b></div><div class="summary-line"><span>Sudah Dibayar</span><b>${money(o.paidAmount)}</b></div><div class="summary-line"><span>Sisa</span><b>${money(remaining(o))}</b></div></div><br><button class="btn btn-primary btn-block" onclick="openPaymentModal('${o.id}')" ${pay === "Lunas" ? "disabled" : ""}>Catat Pembayaran</button></div></div>
 <div class="card" style="margin-top:18px"><div class="card-head"><h3>Item Produk</h3></div><div class="table-wrap"><table><thead><tr><th>Produk</th><th>Qty</th><th>Harga Satuan</th><th>Subtotal</th></tr></thead><tbody>${o.items.map((i) => `<tr><td>${esc(i.productName)}</td><td>${i.qty}</td><td>${money(i.unitPrice)}</td><td>${money(itemSubtotal(i))}</td></tr>`).join("")}</tbody></table></div></div>
 <div class="card" style="margin-top:18px"><div class="card-head"><h3>Workflow Status</h3></div><div class="actions">${canAdvance ? `<button class="btn btn-primary" onclick="advanceOrder('${o.id}')">→ ${statuses[next + 1]}</button>` : ""}${!["Selesai", "Dibatalkan"].includes(o.orderStatus) ? `<button class="btn btn-danger" onclick="cancelOrder('${o.id}')">Batalkan Order</button>` : ""}${o.orderStatus === "Selesai" || o.orderStatus === "Dibatalkan" ? badge("Status Final") : ""}</div></div>${modalHTML()}`;
  document.getElementById("app").innerHTML = shell("Detail Order", content);
}
function advanceOrder(id) {
  const arr = orderData(),
    o = arr.find((x) => x.id === id),
    steps = [
      "Pesanan Masuk",
      "Barang Dibeli",
      "Dalam Perjalanan",
      "Barang Sampai",
      "Selesai",
    ],
    i = steps.indexOf(o.orderStatus);
  if (i < 0 || i >= steps.length - 1) return;
  o.orderStatus = steps[i + 1];
  Store.set(STORAGE_KEYS.orders, arr);
  toast("Status order diperbarui");
  setTimeout(renderOrderDetail, 300);
}
function cancelOrder(id) {
  if (!confirm("Batalkan order ini? Status Dibatalkan bersifat final.")) return;
  const arr = orderData(),
    o = arr.find((x) => x.id === id);
  o.orderStatus = "Dibatalkan";
  Store.set(STORAGE_KEYS.orders, arr);
  toast("Order dibatalkan");
  setTimeout(renderOrderDetail, 300);
}
function openPaymentModal(id) {
  const o = orderData().find((x) => x.id === id);
  openModal(
    `<div class="modal-head"><h3>Catat Pembayaran</h3><button class="close" onclick="closeModal()">×</button></div><p class="muted">Sudah dibayar: ${money(o.paidAmount)} · Sisa: ${money(remaining(o))}</p><form onsubmit="savePayment(event,'${id}')"><label>Nominal pembayaran<input name="amount" type="number" min="1" max="${remaining(o)}" required autofocus></label><br><button class="btn btn-primary btn-block">Tambahkan Pembayaran</button></form>`,
  );
}
function savePayment(e, id) {
  e.preventDefault();
  const amount = Number(new FormData(e.target).get("amount")),
    arr = orderData(),
    o = arr.find((x) => x.id === id),
    rem = remaining(o);
  if (amount <= 0 || amount > rem) {
    alert("Nominal pembayaran harus lebih dari 0 dan tidak melebihi sisa.");
    return;
  }
  o.paidAmount += amount;
  Store.set(STORAGE_KEYS.orders, arr);
  closeModal();
  toast("Pembayaran berhasil dicatat");
  setTimeout(renderOrderDetail, 300);
}
function renderSettings() {
  const content = `<div class="page-head"><div><h1>Pengaturan</h1><p>Pengaturan demo dan data aplikasi.</p></div></div>
 <div class="card settings-list"><div><h3>Reset Demo Data</h3><p class="muted">Menghapus data aplikasi lalu mengembalikan customer, batch, dan order ke kondisi awal demo.</p><div class="danger-box"><b>Perhatian</b><p>Data yang kamu buat sendiri akan hilang dari browser ini.</p><button class="btn btn-danger" onclick="resetDemo()">Reset Demo Data</button></div></div>
 <div><h3>Informasi LocalStorage</h3><p class="muted">Key aplikasi: <code>jastip_customers</code>, <code>jastip_batches</code>, <code>jastip_orders</code>, <code>jastip_settings</code>, dan sesi demo.</p></div>
 <div><h3>Login Demo</h3><p class="muted">Username: <b>admin</b> · Password: <b>admin123</b>. Ini hanya demo login, bukan authentication production.</p></div></div>`;
  document.getElementById("app").innerHTML = shell("Pengaturan", content);
}
function resetDemo() {
  if (!confirm("Reset semua data demo?")) return;
  Store.clearApp();
  seedDemoData(true);
  localStorage.setItem(STORAGE_KEYS.session, "admin");
  toast("Demo data berhasil direset");
  setTimeout(() => (location.href = "dashboard.html"), 500);
}
init();