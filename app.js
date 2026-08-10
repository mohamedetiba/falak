/**
 * app.js — Falak Business Solutions — Complete Operations Management System
 * Full CRUD for Employees, Clients, Projects, Tasks + Kanban Drag&Drop + Handover + KPIs
 */

window.APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyL-cX0UWmMp5MbKW2mxzp7jQtDBiz8e_QXU-ujNfBcR-28LZekirwXhr5PmNGVGkDc9A/exec";

/* ═══════════════════════════════════════════════
   1. GLOBAL APPLICATION STORE
   ═══════════════════════════════════════════════ */
window.AppStore = {
  state: {
    currentUser: null,
    users: [], clients: [], projects: [], tasks: [],
    taskComments: [], handovers: [], kpis: [],
    historyLog: [], notifications: [], files: [], settings: [],
    activeView: "dashboard",
    filters: { searchQuery: "", taskType: "ALL", priority: "ALL", status: "ALL", clientId: "ALL", projectId: "ALL", assigneeId: "ALL", myTasksOnly: false }
  },

  init() {
    const saved = localStorage.getItem("FALAK_USER_SESSION");
    if (saved) { try { this.state.currentUser = JSON.parse(saved); } catch(e) { localStorage.removeItem("FALAK_USER_SESSION"); } }
  },

  saveSession(user) { this.state.currentUser = user; localStorage.setItem("FALAK_USER_SESSION", JSON.stringify(user)); },
  clearSession() { this.state.currentUser = null; localStorage.removeItem("FALAK_USER_SESSION"); },

  async api(action, payload = {}) {
    if (!window.APPS_SCRIPT_URL || window.APPS_SCRIPT_URL.includes("YOUR_")) return { ok: false, offline: true };
    try {
      const r = await fetch(window.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, ...payload })
      });
      return await r.json();
    } catch(e) { return { ok: false, error: e.toString() }; }
  },

  async loadAll() {
    const r = await this.api("getInitialData");
    if (r && r.ok) {
      ["users","clients","projects","tasks","taskComments","handovers","kpis","historyLog","notifications","files","settings"]
        .forEach(k => { if (r[k]) this.state[k] = r[k]; });
      return true;
    }
    return false;
  },

  // Permission helpers
  can(action) {
    const u = this.state.currentUser;
    if (!u) return false;
    const role = u.role;
    const perms = {
      manage_employees: ["CEO"],
      manage_clients: ["CEO", "Sales/Marketing Manager"],
      create_projects: ["CEO", "Sales/Marketing Manager", "Team Leader"],
      create_tasks: ["CEO", "Sales/Marketing Manager", "Team Leader"],
      approve_reject: ["CEO", "Sales/Marketing Manager", "Team Leader"],
      view_all_dashboard: ["CEO"],
      view_history: ["CEO"],
      delete_task: ["CEO"]
    };
    return perms[action] ? perms[action].includes(role) : true;
  },

  getUserName(userId) {
    const u = this.state.users.find(x => x.user_id === userId);
    return u ? u.full_name : userId;
  },

  getClientName(clientId) {
    const c = this.state.clients.find(x => x.client_id === clientId);
    return c ? c.client_name : clientId;
  },

  getProjectName(projectId) {
    const p = this.state.projects.find(x => x.project_id === projectId);
    return p ? p.project_name : projectId;
  }
};

/* ═══════════════════════════════════════════════
   2. UTILITY HELPERS
   ═══════════════════════════════════════════════ */
const U = {
  statusAr: { "To Do":"قائمة الانتظار", "In Progress":"قيد التنفيذ", "Under Review":"قيد المراجعة", "Completed":"مكتملة", "Rejected":"مرفوضة", "On Hold":"معلّقة" },
  statusColor: { "To Do":"#94A3B8", "In Progress":"#2A5FA8", "Under Review":"#D9B96B", "Completed":"#16A34A", "Rejected":"#DC2626", "On Hold":"#6B7280" },
  priorityBg: { "عاجل":"bg-red-100 text-red-700", "مرتفع":"bg-orange-100 text-orange-700", "متوسط":"bg-blue-100 text-blue-700", "منخفض":"bg-gray-100 text-gray-700" },
  priorityDot: { "عاجل":"bg-red-500", "مرتفع":"bg-orange-500", "متوسط":"bg-blue-500", "منخفض":"bg-gray-400" },
  roleAr: { "CEO":"الرئيس التنفيذي", "Sales/Marketing Manager":"مدير التسويق والمبيعات", "Team Leader":"قائد فريق", "Executive":"موظف تنفيذي" },
  taskTypes: ["ميديا باينج","جرافيك ديزاين","مونتاج/فيديو","سيو","كتابة محتوى","سوشيال ميديا","تطوير ويب","متجر إلكتروني","تصوير","استشارات"],
  projectTypes: ["متجر إلكتروني","حملة إعلانية","هوية بصرية","سيو","إدارة سوشيال","إنتاج فيديو","موقع ويب","استشارة"],
  departments: ["Management","Marketing","Technology","Design","Content","SEO"],
  roles: ["CEO","Sales/Marketing Manager","Team Leader","Executive"],
  statuses: ["To Do","In Progress","Under Review","Completed"],
  priorities: ["عاجل","مرتفع","متوسط","منخفض"],

  fmtDate(d) { return d ? new Date(d).toLocaleDateString('ar-EG') : '—'; },
  isLate(t) { return t.is_late === "Yes" || (t.due_date && new Date(t.due_date) < new Date() && t.status !== "Completed" && t.status !== "Rejected"); },
  genId(prefix) { return prefix + "-" + Math.floor(1000 + Math.random() * 9000); },

  toast(msg, type = "info") {
    let c = document.querySelector(".toast-container");
    if (!c) { c = document.createElement("div"); c.className = "toast-container"; document.body.appendChild(c); }
    const t = document.createElement("div");
    t.className = `toast toast-${type}`;
    const icon = type === "success" ? "fa-check-circle" : type === "error" ? "fa-exclamation-circle" : "fa-info-circle";
    t.innerHTML = `<i class="fas ${icon}"></i> <span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  },

  modal(title, bodyHTML, footerHTML = "") {
    document.getElementById("global-modal")?.remove();
    const m = document.createElement("div");
    m.id = "global-modal";
    m.className = "modal-overlay";
    m.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100 mx-4">
        <div class="sticky top-0 bg-white flex items-center justify-between p-5 border-b border-gray-100 rounded-t-2xl z-10">
          <h3 class="font-bold text-navy-900 text-lg">${title}</h3>
          <button onclick="document.getElementById('global-modal').remove()" class="w-8 h-8 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 flex items-center justify-center transition"><i class="fas fa-times"></i></button>
        </div>
        <div class="p-5">${bodyHTML}</div>
        ${footerHTML ? `<div class="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-100 flex justify-end gap-2 rounded-b-2xl">${footerHTML}</div>` : ""}
      </div>`;
    m.addEventListener("click", e => { if (e.target === m) m.remove(); });
    document.body.appendChild(m);
    return m;
  },

  closeModal() { document.getElementById("global-modal")?.remove(); },

  field(label, id, type = "text", value = "", required = true, extra = "") {
    return `<div class="mb-3">
      <label class="block text-xs font-bold text-gray-600 mb-1">${label}${required ? ' <span class="text-red-500">*</span>' : ''}</label>
      <input type="${type}" id="${id}" value="${value}" ${required ? 'required' : ''} ${extra} class="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-navy-700 focus:bg-white transition">
    </div>`;
  },

  select(label, id, options, selected = "", required = true) {
    const opts = options.map(o => {
      const val = typeof o === "object" ? o.value : o;
      const text = typeof o === "object" ? o.text : o;
      return `<option value="${val}" ${val === selected ? 'selected' : ''}>${text}</option>`;
    }).join("");
    return `<div class="mb-3">
      <label class="block text-xs font-bold text-gray-600 mb-1">${label}${required ? ' <span class="text-red-500">*</span>' : ''}</label>
      <select id="${id}" ${required ? 'required' : ''} class="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-navy-700 focus:bg-white transition">${opts}</select>
    </div>`;
  },

  textarea(label, id, value = "", rows = 3, required = false) {
    return `<div class="mb-3">
      <label class="block text-xs font-bold text-gray-600 mb-1">${label}</label>
      <textarea id="${id}" rows="${rows}" ${required ? 'required' : ''} class="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-navy-700 focus:bg-white transition">${value}</textarea>
    </div>`;
  },

  btn(text, onclick, style = "primary") {
    const cls = style === "primary" ? "bg-navy-900 hover:bg-navy-800 text-white" : style === "danger" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700";
    return `<button onclick="${onclick}" class="px-5 py-2.5 ${cls} rounded-xl text-sm font-bold shadow-sm transition">${text}</button>`;
  }
};

/* ═══════════════════════════════════════════════
   3. MAIN APP CONTROLLER
   ═══════════════════════════════════════════════ */
window.App = {
  async init() {
    this.bindEvents();
    if (window.AppStore.state.currentUser) { this.showApp(); await this.refresh(); }
    else this.showLogin();
  },

  async refresh() {
    U.toast("جاري تحميل البيانات...", "info");
    const ok = await window.AppStore.loadAll();
    if (ok) { U.toast("تم تحميل البيانات بنجاح", "success"); }
    else { U.toast("تعذر الاتصال بالخادم — وضع محلي", "error"); }
    this.renderHeader();
    this.renderView();
    this.updateNotifCount();
  },

  bindEvents() {
    const self = this;
    // Login form
    document.getElementById("login-form")?.addEventListener("submit", e => { e.preventDefault(); self.handleLogin(); });
    // Sidebar nav
    document.querySelectorAll("[data-nav-view]").forEach(el => {
      el.addEventListener("click", function(e) {
        e.preventDefault();
        document.querySelectorAll("[data-nav-view]").forEach(l => l.classList.remove("active-nav"));
        this.classList.add("active-nav");
        window.AppStore.state.activeView = this.dataset.navView;
        self.renderView();
      });
    });
    // Password toggle
    document.getElementById("toggle-pwd-btn")?.addEventListener("click", function() {
      const p = document.getElementById("login-password");
      p.type = p.type === "password" ? "text" : "password";
      this.innerHTML = `<i class="fas fa-eye${p.type === 'text' ? '-slash' : ''}"></i>`;
    });
    // Dark mode
    document.getElementById("dark-mode-toggle")?.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      localStorage.setItem("FALAK_DARK", document.body.classList.contains("dark") ? "1" : "0");
    });
    if (localStorage.getItem("FALAK_DARK") === "1") document.body.classList.add("dark");
  },

  showLogin() { document.getElementById("login-view").classList.remove("hidden"); document.getElementById("app-view").classList.add("hidden"); },
  showApp() { document.getElementById("login-view").classList.add("hidden"); document.getElementById("app-view").classList.remove("hidden"); },

  async handleLogin() {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    const btn = document.getElementById("login-btn");
    const errBox = document.getElementById("login-error-msg");

    btn.disabled = true; btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> جاري التحقق...`;
    errBox.classList.add("hidden");

    let r = await window.AppStore.api("login", { username, password });

    // Offline fallback
    if (!r || !r.ok) {
      const validUsers = { admin: "CEO", marketing_manager: "Sales/Marketing Manager", tech_lead: "Team Leader", media_buyer: "Executive", graphic_designer: "Executive", web_dev: "Executive" };
      if (validUsers[username.toLowerCase()] && (password === "admin123" || password === "123456")) {
        r = { ok: true, user: { user_id: "USR-0001", username, full_name: username === "admin" ? "أحمد بن علي القحطاني" : username, email: `${username}@falak.com`, role: validUsers[username.toLowerCase()], department: "Management", job_title: U.roleAr[validUsers[username.toLowerCase()]], avatar_url: "https://i.pravatar.cc/150?img=68" } };
      }
    }

    btn.disabled = false; btn.innerHTML = `تسجيل الدخول <i class="fas fa-arrow-left"></i>`;

    if (r?.ok && r.user) {
      window.AppStore.saveSession(r.user);
      this.showApp();
      await this.refresh();
      U.toast(`مرحباً بك يا ${r.user.full_name}`, "success");
    } else {
      errBox.textContent = r?.error || "اسم المستخدم أو كلمة المرور غير صحيحة";
      errBox.classList.remove("hidden");
    }
  },

  logout() { window.AppStore.clearSession(); this.showLogin(); U.toast("تم تسجيل الخروج", "info"); },

  renderHeader() {
    const u = window.AppStore.state.currentUser;
    if (!u) return;
    const av = document.getElementById("header-user-avatar");
    const nm = document.getElementById("header-user-name");
    const rl = document.getElementById("header-user-role");
    if (av) av.src = u.avatar_url || "https://i.pravatar.cc/150";
    if (nm) nm.textContent = u.full_name;
    if (rl) rl.textContent = `${u.job_title || U.roleAr[u.role] || u.role}`;

    // Role-based visibility
    document.querySelectorAll(".role-admin-only").forEach(el => el.classList.toggle("hidden", u.role !== "CEO"));
    document.querySelectorAll(".role-manager-only").forEach(el => el.classList.toggle("hidden", !["CEO","Sales/Marketing Manager","Team Leader"].includes(u.role)));
  },

  updateNotifCount() {
    const el = document.getElementById("notif-count");
    if (!el) return;
    const u = window.AppStore.state.currentUser;
    const count = window.AppStore.state.notifications.filter(n => n.user_id === u?.user_id && n.is_read === "FALSE").length;
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  },

  /* ─── VIEW ROUTER ─── */
  renderView() {
    const c = document.getElementById("main-render-container");
    if (!c) return;
    c.innerHTML = "";

    const v = window.AppStore.state.activeView;
    const views = {
      dashboard: () => Views.dashboard(c),
      kanban: () => Views.kanban(c),
      projects: () => Views.projects(c),
      clients: () => Views.clients(c),
      employees: () => Views.employees(c),
      leaderboard: () => Views.leaderboard(c),
      profile: () => Views.profile(c),
      history: () => Views.history(c)
    };
    (views[v] || views.dashboard)();
  }
};

/* ═══════════════════════════════════════════════
   4. ALL VIEW RENDERERS
   ═══════════════════════════════════════════════ */
const Views = {

  /* ─── 4.1 DASHBOARD ─── */
  dashboard(c) {
    const u = window.AppStore.state.currentUser;
    const S = window.AppStore.state;
    const tasks = S.tasks;
    const isExec = u.role === "CEO" || u.role === "Sales/Marketing Manager";
    const myTasks = tasks.filter(t => t.assigned_to === u.user_id);

    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === "To Do").length,
      inProgress: tasks.filter(t => t.status === "In Progress").length,
      review: tasks.filter(t => t.status === "Under Review").length,
      done: tasks.filter(t => t.status === "Completed").length,
      late: tasks.filter(t => U.isLate(t)).length
    };

    if (isExec) {
      c.innerHTML = `
        <div class="space-y-6">
          <div class="bg-gradient-to-l from-navy-900 to-navy-700 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-black mb-1"><i class="fas fa-crown text-beige-500 ml-2"></i> لوحة الإدارة العليا — فلك</h1>
              <p class="text-gray-300 text-sm">مراقبة الأداء العام، المشاريع، والفريق</p>
            </div>
            <button onclick="window.App.refresh()" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold border border-white/20 transition"><i class="fas fa-sync-alt ml-1"></i> تحديث</button>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            ${this._statCard("إجمالي المهام", stats.total, "fas fa-tasks", "navy")}
            ${this._statCard("قائمة الانتظار", stats.todo, "fas fa-inbox", "slate")}
            ${this._statCard("قيد التنفيذ", stats.inProgress, "fas fa-spinner", "blue")}
            ${this._statCard("قيد المراجعة", stats.review, "fas fa-eye", "amber")}
            ${this._statCard("مكتملة", stats.done, "fas fa-check-circle", "green")}
            ${this._statCard("متأخرة", stats.late, "fas fa-exclamation-triangle", "red")}
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 class="font-bold text-navy-900 mb-3 text-sm"><i class="fas fa-building text-green-600 ml-1"></i> العملاء النشطون</h3>
              <div class="text-3xl font-black text-navy-900">${S.clients.length}</div>
              <p class="text-xs text-gray-400 mt-1">عميل مسجل في النظام</p>
            </div>
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 class="font-bold text-navy-900 mb-3 text-sm"><i class="fas fa-project-diagram text-purple-600 ml-1"></i> المشاريع النشطة</h3>
              <div class="text-3xl font-black text-navy-900">${S.projects.length}</div>
              <p class="text-xs text-gray-400 mt-1">مشروع جاري العمل عليه</p>
            </div>
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 class="font-bold text-navy-900 mb-3 text-sm"><i class="fas fa-users text-cyan-600 ml-1"></i> فريق العمل</h3>
              <div class="text-3xl font-black text-navy-900">${S.users.length}</div>
              <p class="text-xs text-gray-400 mt-1">موظف في الفريق</p>
            </div>
          </div>

          ${stats.late > 0 ? `
          <div class="bg-red-50 border border-red-200 p-4 rounded-2xl">
            <h3 class="font-bold text-red-700 mb-3 text-sm"><i class="fas fa-exclamation-triangle ml-1"></i> ⚠️ مهام متأخرة تحتاج تدخل فوري (${stats.late})</h3>
            <div class="space-y-2">
              ${tasks.filter(t => U.isLate(t)).slice(0, 5).map(t => `
                <div class="flex items-center justify-between bg-white p-3 rounded-xl border border-red-100 text-sm">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-red-500"></span>
                    <span class="font-bold text-navy-900">${t.title}</span>
                    <span class="text-xs text-gray-400">(${window.AppStore.getUserName(t.assigned_to)})</span>
                  </div>
                  <span class="text-xs text-red-600 font-bold">الموعد: ${U.fmtDate(t.due_date)}</span>
                </div>
              `).join("")}
            </div>
          </div>` : ""}
        </div>`;
    } else {
      const score = this._calcKPI(u.user_id);
      c.innerHTML = `
        <div class="space-y-6">
          <div class="bg-gradient-to-l from-navy-900 to-navy-700 text-white p-6 rounded-2xl shadow-lg flex justify-between items-center">
            <div>
              <h1 class="text-2xl font-bold mb-1">أهلاً بك، ${u.full_name} 👋</h1>
              <p class="text-gray-300 text-sm">${u.job_title || u.role} | ${u.department || 'العمليات'}</p>
            </div>
            <div class="text-center bg-white/10 px-5 py-3 rounded-xl border border-white/20">
              <div class="text-xs text-beige-400 font-bold">نقاط الأداء</div>
              <div class="text-3xl font-black text-beige-500">${score.total}</div>
              <span class="text-xs ${score.cls} font-bold px-2 py-0.5 rounded-full">${score.badge}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            ${this._statCard("مهامي", myTasks.length, "fas fa-tasks", "navy")}
            ${this._statCard("قيد التنفيذ", myTasks.filter(t=>t.status==="In Progress").length, "fas fa-spinner", "blue")}
            ${this._statCard("مكتملة", myTasks.filter(t=>t.status==="Completed").length, "fas fa-check", "green")}
            ${this._statCard("متأخرة", myTasks.filter(t=>U.isLate(t)).length, "fas fa-clock", "red")}
          </div>

          <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 class="font-bold text-navy-900 mb-4"><i class="fas fa-list-check text-beige-500 ml-1"></i> مهامي المخصصة</h3>
            <div class="space-y-2">
              ${myTasks.length === 0 ? '<p class="text-gray-400 text-sm">لا توجد مهام مخصصة لك حالياً</p>' : ""}
              ${myTasks.map(t => `
                <div class="p-3 rounded-xl border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer" onclick="Views.openTaskDetail('${t.task_id}')">
                  <div class="flex items-center gap-3">
                    <span class="w-2.5 h-2.5 rounded-full ${U.priorityDot[t.priority] || 'bg-gray-400'}"></span>
                    <div>
                      <div class="font-bold text-navy-900 text-sm">${t.title}</div>
                      <div class="text-xs text-gray-400">${t.task_type} | ${U.fmtDate(t.due_date)}</div>
                    </div>
                  </div>
                  <span class="px-2.5 py-1 text-xs rounded-full text-white font-bold" style="background:${U.statusColor[t.status]}">${U.statusAr[t.status]}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>`;
    }
  },

  _statCard(label, value, icon, color) {
    const colors = { navy:"border-r-navy-700 text-navy-900", blue:"border-r-blue-600 text-blue-600", green:"border-r-green-600 text-green-600", red:"border-r-red-600 text-red-600", amber:"border-r-amber-500 text-amber-600", slate:"border-r-slate-400 text-slate-600", cyan:"border-r-cyan-600 text-cyan-600", purple:"border-r-purple-600 text-purple-600" };
    return `<div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 border-r-4 ${colors[color] || ''}">
      <div class="text-gray-500 text-[10px] font-bold mb-1"><i class="${icon} ml-1"></i> ${label}</div>
      <div class="text-2xl font-black">${value}</div>
    </div>`;
  },

  /* ─── 4.2 EMPLOYEES MANAGEMENT ─── */
  employees(c) {
    const users = window.AppStore.state.users;
    c.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h2 class="text-lg font-bold text-navy-900"><i class="fas fa-users-cog text-cyan-600 ml-2"></i> إدارة الموظفين والصلاحيات</h2>
            <p class="text-xs text-gray-500 mt-1">إضافة وتعديل وحذف الموظفين وتحديد أدوارهم وصلاحياتهم</p>
          </div>
          ${window.AppStore.can("manage_employees") ? `<button onclick="Views.openEmployeeModal()" class="px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold shadow transition"><i class="fas fa-user-plus ml-1"></i> موظف جديد</button>` : ""}
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table class="w-full text-right text-sm">
            <thead class="bg-navy-900 text-white text-xs">
              <tr>
                <th class="p-3">الموظف</th>
                <th class="p-3">المسمى الوظيفي</th>
                <th class="p-3">القسم</th>
                <th class="p-3">الدور</th>
                <th class="p-3">الحالة</th>
                <th class="p-3">إجراءات</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              ${users.length === 0 ? '<tr><td colspan="6" class="p-6 text-center text-gray-400">لا يوجد موظفين — قم بتشغيل seedDemoData() في Google Apps Script</td></tr>' : ""}
              ${users.map(u => `
                <tr class="hover:bg-gray-50 transition">
                  <td class="p-3">
                    <div class="flex items-center gap-3">
                      <img src="${u.avatar_url || 'https://i.pravatar.cc/40'}" class="w-9 h-9 rounded-full object-cover border border-gray-200">
                      <div>
                        <div class="font-bold text-navy-900">${u.full_name}</div>
                        <div class="text-xs text-gray-400">${u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td class="p-3 text-xs font-semibold text-gray-700">${u.job_title || '—'}</td>
                  <td class="p-3 text-xs">${u.department || '—'}</td>
                  <td class="p-3"><span class="px-2 py-1 text-[10px] font-bold rounded-full bg-navy-900 text-beige-400">${U.roleAr[u.role] || u.role}</span></td>
                  <td class="p-3"><span class="px-2 py-1 text-[10px] font-bold rounded-full ${u.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${u.status === 'Active' ? 'نشط' : 'معطل'}</span></td>
                  <td class="p-3">
                    ${window.AppStore.can("manage_employees") ? `
                    <div class="flex gap-1">
                      <button onclick="Views.openEmployeeModal('${u.user_id}')" class="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-bold"><i class="fas fa-edit"></i></button>
                    </div>` : '<span class="text-xs text-gray-400">—</span>'}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  openEmployeeModal(userId) {
    const user = userId ? window.AppStore.state.users.find(u => u.user_id === userId) : null;
    const isEdit = !!user;
    const title = isEdit ? `<i class="fas fa-user-edit text-blue-600 ml-2"></i> تعديل بيانات: ${user.full_name}` : `<i class="fas fa-user-plus text-green-600 ml-2"></i> إضافة موظف جديد`;

    const body = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        ${U.field("الاسم الكامل", "emp-name", "text", user?.full_name || "")}
        ${U.field("اسم المستخدم", "emp-username", "text", user?.username || "")}
        ${!isEdit ? U.field("كلمة المرور", "emp-password", "password", "") : '<input type="hidden" id="emp-password" value="">'}
        ${U.field("البريد الإلكتروني", "emp-email", "email", user?.email || "")}
        ${U.field("رقم الجوال", "emp-phone", "tel", user?.phone || "", false)}
        ${U.select("الدور / الصلاحية", "emp-role", U.roles, user?.role || "Executive")}
        ${U.select("القسم", "emp-dept", U.departments, user?.department || "")}
        ${U.field("المسمى الوظيفي", "emp-title", "text", user?.job_title || "")}
        ${U.field("رابط الصورة", "emp-avatar", "url", user?.avatar_url || "", false)}
      </div>
      ${U.textarea("الوصف الوظيفي", "emp-desc", user?.job_description || "", 3, false)}
    `;

    const footer = `
      ${U.btn("إلغاء", "U.closeModal()", "secondary")}
      ${U.btn(isEdit ? '<i class="fas fa-save ml-1"></i> حفظ التعديلات' : '<i class="fas fa-plus ml-1"></i> إضافة الموظف', `Views.saveEmployee('${userId || ''}')`)}
    `;

    U.modal(title, body, footer);
  },

  async saveEmployee(userId) {
    const data = {
      user_id: userId || U.genId("USR"),
      full_name: document.getElementById("emp-name").value,
      username: document.getElementById("emp-username").value,
      password: document.getElementById("emp-password").value,
      email: document.getElementById("emp-email").value,
      phone: document.getElementById("emp-phone").value,
      role: document.getElementById("emp-role").value,
      department: document.getElementById("emp-dept").value,
      job_title: document.getElementById("emp-title").value,
      avatar_url: document.getElementById("emp-avatar").value,
      job_description: document.getElementById("emp-desc").value,
      status: "Active"
    };

    if (!data.full_name || !data.username) { U.toast("يرجى ملء الحقول المطلوبة", "error"); return; }

    U.closeModal();
    U.toast("جاري الحفظ...", "info");
    const r = await window.AppStore.api(userId ? "updateUser" : "addUser", { userData: data });

    if (r?.ok) {
      U.toast(userId ? "تم تعديل بيانات الموظف بنجاح" : "تم إضافة الموظف بنجاح", "success");
      await window.App.refresh();
    } else {
      // Offline: add locally
      if (!userId) window.AppStore.state.users.push(data);
      else { const idx = window.AppStore.state.users.findIndex(u => u.user_id === userId); if (idx >= 0) Object.assign(window.AppStore.state.users[idx], data); }
      U.toast("تم الحفظ محلياً (الخادم غير متصل)", "info");
      window.App.renderView();
    }
  },

  /* ─── 4.3 CLIENTS ─── */
  clients(c) {
    const clients = window.AppStore.state.clients;
    c.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h2 class="text-lg font-bold text-navy-900"><i class="fas fa-building text-green-600 ml-2"></i> دليل العملاء والشركات</h2>
            <p class="text-xs text-gray-500 mt-1">${clients.length} عميل مسجل</p>
          </div>
          ${window.AppStore.can("manage_clients") ? `<button onclick="Views.openClientModal()" class="px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold shadow transition"><i class="fas fa-plus ml-1"></i> عميل جديد</button>` : ""}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${clients.length === 0 ? '<p class="text-gray-400 text-sm col-span-3">لا يوجد عملاء</p>' : ""}
          ${clients.map(cl => {
            const projCount = window.AppStore.state.projects.filter(p => p.client_id === cl.client_id).length;
            const taskCount = window.AppStore.state.tasks.filter(t => t.client_id === cl.client_id).length;
            return `
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 text-beige-500 flex items-center justify-center font-black text-xl shadow">${cl.client_name?.charAt(0) || 'C'}</div>
                <div>
                  <h3 class="font-bold text-navy-900">${cl.client_name}</h3>
                  <p class="text-xs text-gray-500">${cl.industry || '—'} | ${cl.company || ''}</p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="bg-gray-50 p-2 rounded-lg text-center"><span class="font-black text-navy-900 block text-lg">${projCount}</span>مشروع</div>
                <div class="bg-gray-50 p-2 rounded-lg text-center"><span class="font-black text-navy-900 block text-lg">${taskCount}</span>مهمة</div>
              </div>
              <div class="text-xs text-gray-500 space-y-1 border-t border-gray-50 pt-2">
                <div><i class="fas fa-user text-gray-400 ml-1"></i> ${cl.contact_person || '—'}</div>
                <div><i class="fas fa-phone text-gray-400 ml-1"></i> ${cl.phone || '—'}</div>
                <div><i class="fas fa-envelope text-gray-400 ml-1"></i> ${cl.email || '—'}</div>
              </div>
              ${window.AppStore.can("manage_clients") ? `<button onclick="Views.openClientModal('${cl.client_id}')" class="w-full py-2 text-xs font-bold text-navy-900 bg-beige-100 hover:bg-beige-200 rounded-xl transition"><i class="fas fa-edit ml-1"></i> تعديل</button>` : ""}
            </div>`;
          }).join("")}
        </div>
      </div>`;
  },

  openClientModal(clientId) {
    const cl = clientId ? window.AppStore.state.clients.find(x => x.client_id === clientId) : null;
    const isEdit = !!cl;
    const title = isEdit ? `<i class="fas fa-edit text-blue-600 ml-2"></i> تعديل عميل: ${cl.client_name}` : `<i class="fas fa-plus text-green-600 ml-2"></i> عميل جديد`;

    const body = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        ${U.field("اسم العميل / الشركة", "cl-name", "text", cl?.client_name || "")}
        ${U.field("اسم الشركة", "cl-company", "text", cl?.company || "", false)}
        ${U.select("الصناعة / المجال", "cl-industry", ["E-Commerce","Education","Healthcare","Retail","F&B","Real Estate","Technology","أخرى"], cl?.industry || "")}
        ${U.field("جهة الاتصال", "cl-contact", "text", cl?.contact_person || "", false)}
        ${U.field("رقم الجوال", "cl-phone", "tel", cl?.phone || "", false)}
        ${U.field("البريد الإلكتروني", "cl-email", "email", cl?.email || "", false)}
      </div>
      ${U.textarea("ملاحظات", "cl-notes", cl?.notes || "", 2, false)}
    `;

    const footer = `${U.btn("إلغاء", "U.closeModal()", "secondary")} ${U.btn(isEdit ? "حفظ التعديلات" : "إضافة العميل", `Views.saveClient('${clientId || ''}')`)}`;
    U.modal(title, body, footer);
  },

  async saveClient(clientId) {
    const data = {
      client_id: clientId || U.genId("CLT"),
      client_name: document.getElementById("cl-name").value,
      company: document.getElementById("cl-company").value,
      industry: document.getElementById("cl-industry").value,
      contact_person: document.getElementById("cl-contact").value,
      phone: document.getElementById("cl-phone").value,
      email: document.getElementById("cl-email").value,
      notes: document.getElementById("cl-notes").value,
      status: "Active",
      created_by: window.AppStore.state.currentUser.user_id,
      created_at: new Date().toISOString()
    };
    if (!data.client_name) { U.toast("يرجى إدخال اسم العميل", "error"); return; }
    U.closeModal(); U.toast("جاري الحفظ...", "info");
    const r = await window.AppStore.api(clientId ? "updateClient" : "addClient", { clientData: data });
    if (r?.ok) { U.toast("تم حفظ العميل بنجاح", "success"); await window.App.refresh(); }
    else { if (!clientId) window.AppStore.state.clients.push(data); U.toast("تم الحفظ محلياً", "info"); window.App.renderView(); }
  },

  /* ─── 4.4 PROJECTS ─── */
  projects(c) {
    const projects = window.AppStore.state.projects;
    c.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h2 class="text-lg font-bold text-navy-900"><i class="fas fa-project-diagram text-purple-600 ml-2"></i> المشاريع (${projects.length})</h2>
            <p class="text-xs text-gray-500 mt-1">جميع المشاريع النشطة والمكتملة</p>
          </div>
          ${window.AppStore.can("create_projects") ? `<button onclick="Views.openProjectModal()" class="px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold shadow transition"><i class="fas fa-plus ml-1"></i> مشروع جديد</button>` : ""}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${projects.length === 0 ? '<p class="text-gray-400 text-sm">لا توجد مشاريع</p>' : ""}
          ${projects.map(p => {
            const clientName = window.AppStore.getClientName(p.client_id);
            const taskCount = window.AppStore.state.tasks.filter(t => t.project_id === p.project_id).length;
            const doneTasks = window.AppStore.state.tasks.filter(t => t.project_id === p.project_id && t.status === "Completed").length;
            const progress = taskCount > 0 ? Math.round((doneTasks / taskCount) * 100) : (p.progress || 0);
            return `
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3 hover:shadow-md transition">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full">${p.project_type || 'مشروع'}</span>
                <span class="text-[10px] text-gray-400">${U.fmtDate(p.start_date)} ➔ ${U.fmtDate(p.due_date)}</span>
              </div>
              <h3 class="font-bold text-navy-900">${p.project_name}</h3>
              <p class="text-xs text-gray-500">${clientName} | ${taskCount} مهمة (${doneTasks} مكتملة)</p>
              <div>
                <div class="flex justify-between text-xs font-bold mb-1"><span>التقدم</span><span>${progress}%</span></div>
                <div class="w-full bg-gray-100 h-2 rounded-full"><div class="bg-gradient-to-r from-navy-700 to-beige-500 h-full rounded-full transition-all" style="width:${progress}%"></div></div>
              </div>
              <div class="flex gap-2 pt-1">
                ${window.AppStore.can("create_projects") ? `<button onclick="Views.openProjectModal('${p.project_id}')" class="flex-1 py-2 text-xs font-bold text-navy-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition"><i class="fas fa-edit ml-1"></i> تعديل</button>` : ""}
                <button onclick="window.AppStore.state.activeView='kanban'; window.App.renderView();" class="flex-1 py-2 text-xs font-bold text-white bg-navy-900 hover:bg-navy-800 rounded-xl transition"><i class="fas fa-columns ml-1"></i> الكانبان</button>
              </div>
            </div>`;
          }).join("")}
        </div>
      </div>`;
  },

  openProjectModal(projectId) {
    const p = projectId ? window.AppStore.state.projects.find(x => x.project_id === projectId) : null;
    const isEdit = !!p;
    const clientOpts = [{value:"", text:"اختر عميل..."}, ...window.AppStore.state.clients.map(c => ({value: c.client_id, text: c.client_name}))];
    const leaderOpts = [{value:"", text:"اختر قائد الفريق..."}, ...window.AppStore.state.users.filter(u => ["CEO","Sales/Marketing Manager","Team Leader"].includes(u.role)).map(u => ({value: u.user_id, text: u.full_name}))];

    const body = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        ${U.field("اسم المشروع", "prj-name", "text", p?.project_name || "")}
        ${U.select("العميل", "prj-client", clientOpts, p?.client_id || "")}
        ${U.select("نوع المشروع", "prj-type", U.projectTypes, p?.project_type || "")}
        ${U.select("قائد الفريق", "prj-leader", leaderOpts, p?.team_leader_id || "")}
        ${U.field("تاريخ البداية", "prj-start", "date", p?.start_date?.split('T')[0] || "")}
        ${U.field("الموعد النهائي", "prj-due", "date", p?.due_date?.split('T')[0] || "")}
        ${U.field("الميزانية ($)", "prj-budget", "number", p?.budget || "", false)}
      </div>
      ${U.textarea("وصف المشروع", "prj-desc", p?.description || "", 3, false)}
    `;
    const footer = `${U.btn("إلغاء", "U.closeModal()", "secondary")} ${U.btn(isEdit ? "حفظ التعديلات" : "إنشاء المشروع", `Views.saveProject('${projectId || ''}')`)}`;
    U.modal(isEdit ? "تعديل المشروع" : "<i class='fas fa-plus text-green-600 ml-2'></i> مشروع جديد", body, footer);
  },

  async saveProject(projectId) {
    const data = {
      project_id: projectId || U.genId("PRJ"),
      project_name: document.getElementById("prj-name").value,
      client_id: document.getElementById("prj-client").value,
      project_type: document.getElementById("prj-type").value,
      team_leader_id: document.getElementById("prj-leader").value,
      start_date: document.getElementById("prj-start").value,
      due_date: document.getElementById("prj-due").value,
      budget: document.getElementById("prj-budget").value,
      description: document.getElementById("prj-desc").value,
      status: "In Progress", progress: 0,
      created_by: window.AppStore.state.currentUser.user_id,
      created_at: new Date().toISOString()
    };
    if (!data.project_name) { U.toast("يرجى إدخال اسم المشروع", "error"); return; }
    U.closeModal(); U.toast("جاري الحفظ...", "info");
    const r = await window.AppStore.api(projectId ? "updateProject" : "addProject", { projectData: data });
    if (r?.ok) { U.toast("تم حفظ المشروع بنجاح", "success"); await window.App.refresh(); }
    else { if (!projectId) window.AppStore.state.projects.push(data); U.toast("تم الحفظ محلياً", "info"); window.App.renderView(); }
  },

  /* ─── 4.5 KANBAN BOARD + TASK CRUD ─── */
  kanban(c) {
    const tasks = this._filteredTasks();
    const f = window.AppStore.state.filters;

    const clientOpts = [{value:"ALL",text:"كل العملاء"}, ...window.AppStore.state.clients.map(cl => ({value:cl.client_id, text:cl.client_name}))];
    const assigneeOpts = [{value:"ALL",text:"كل الموظفين"}, ...window.AppStore.state.users.map(u => ({value:u.user_id, text:u.full_name}))];

    c.innerHTML = `
      <div class="space-y-4">
        <!-- Filters Bar -->
        <div class="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-2">
          <input type="text" placeholder="🔍 بحث..." value="${f.searchQuery}" oninput="Views._filter('searchQuery',this.value)" class="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm w-48 focus:outline-none focus:border-navy-700">
          <select onchange="Views._filter('taskType',this.value)" class="px-2 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs">
            <option value="ALL">كل التخصصات</option>
            ${U.taskTypes.map(t => `<option value="${t}" ${f.taskType===t?'selected':''}>${t}</option>`).join("")}
          </select>
          <select onchange="Views._filter('priority',this.value)" class="px-2 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs">
            <option value="ALL">كل الأولويات</option>
            ${U.priorities.map(p => `<option value="${p}" ${f.priority===p?'selected':''}>${p}</option>`).join("")}
          </select>
          <button onclick="Views._toggleMy()" class="px-3 py-2 rounded-xl text-xs font-bold border transition ${f.myTasksOnly ? 'bg-navy-900 text-white border-navy-900' : 'bg-gray-50 text-gray-600 border-gray-200'}"><i class="fas fa-user-check ml-1"></i> مهامي</button>

          <div class="flex-1"></div>
          ${window.AppStore.can("create_tasks") ? `<button onclick="Views.openTaskModal()" class="px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold shadow transition"><i class="fas fa-plus ml-1"></i> مهمة جديدة</button>` : ""}
        </div>

        <!-- Kanban Columns -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
          ${U.statuses.map(s => this._kanbanCol(s, tasks.filter(t => t.status === s))).join("")}
        </div>
      </div>`;
  },

  _kanbanCol(status, tasks) {
    const titles = { "To Do":"قائمة الانتظار", "In Progress":"قيد التنفيذ", "Under Review":"قيد المراجعة", "Completed":"مكتملة" };
    const borders = { "To Do":"border-t-slate-400", "In Progress":"border-t-blue-600", "Under Review":"border-t-amber-500", "Completed":"border-t-green-600" };
    return `
      <div class="bg-gray-50 p-2.5 rounded-2xl border ${borders[status]} border-t-4 min-h-[450px]"
           data-status="${status}"
           ondragover="event.preventDefault(); this.classList.add('drag-over')"
           ondragleave="this.classList.remove('drag-over')"
           ondrop="Views._handleDrop(event, '${status}'); this.classList.remove('drag-over')">
        <div class="flex items-center justify-between mb-2.5 px-1">
          <h4 class="font-bold text-navy-900 text-xs">${titles[status]}</h4>
          <span class="bg-white text-navy-900 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">${tasks.length}</span>
        </div>
        <div class="space-y-2">
          ${tasks.map(t => this._taskCard(t)).join("")}
        </div>
      </div>`;
  },

  _taskCard(t) {
    const late = U.isLate(t);
    return `
      <div class="bg-white p-3 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition ${late ? 'task-card-late' : ''}"
           draggable="true"
           data-task-id="${t.task_id}"
           ondragstart="event.dataTransfer.setData('taskId','${t.task_id}'); this.classList.add('dragging')"
           ondragend="this.classList.remove('dragging')"
           onclick="Views.openTaskDetail('${t.task_id}')">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${U.priorityBg[t.priority] || ''}">${t.priority}</span>
          <span class="text-[9px] text-gray-400 font-semibold">${t.task_type}</span>
        </div>
        <h5 class="font-bold text-navy-900 text-xs mb-1.5 leading-snug">${t.title}</h5>
        ${late ? '<div class="text-[10px] text-red-600 font-bold mb-1"><i class="fas fa-exclamation-triangle"></i> متأخرة!</div>' : ''}
        <div class="flex items-center justify-between text-[10px] text-gray-400 pt-1.5 border-t border-gray-50">
          <span><i class="far fa-calendar-alt ml-1"></i>${U.fmtDate(t.due_date)}</span>
          <span class="font-semibold">${window.AppStore.getUserName(t.assigned_to).split(' ')[0]}</span>
        </div>
      </div>`;
  },

  async _handleDrop(e, newStatus) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    const task = window.AppStore.state.tasks.find(t => t.task_id === taskId);
    if (!task || task.status === newStatus) return;

    const oldStatus = task.status;
    task.status = newStatus;
    if (newStatus === "Completed") task.completed_at = new Date().toISOString();

    window.App.renderView();
    U.toast(`تم نقل المهمة إلى: ${U.statusAr[newStatus]}`, "success");

    await window.AppStore.api("updateTaskStatus", { taskId, newStatus, userId: window.AppStore.state.currentUser.user_id });
  },

  openTaskModal(taskId) {
    const t = taskId ? window.AppStore.state.tasks.find(x => x.task_id === taskId) : null;
    const isEdit = !!t;

    const clientOpts = [{value:"",text:"اختر..."}, ...window.AppStore.state.clients.map(c => ({value:c.client_id, text:c.client_name}))];
    const projectOpts = [{value:"",text:"اختر..."}, ...window.AppStore.state.projects.map(p => ({value:p.project_id, text:p.project_name}))];
    const userOpts = [{value:"",text:"اختر..."}, ...window.AppStore.state.users.map(u => ({value:u.user_id, text:`${u.full_name} (${u.job_title || u.role})`}))];

    const body = `
      ${U.field("عنوان المهمة", "tsk-title", "text", t?.title || "")}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        ${U.select("نوع المهمة / التخصص", "tsk-type", U.taskTypes, t?.task_type || "")}
        ${U.select("الأولوية", "tsk-priority", U.priorities, t?.priority || "متوسط")}
        ${U.select("العميل", "tsk-client", clientOpts, t?.client_id || "")}
        ${U.select("المشروع", "tsk-project", projectOpts, t?.project_id || "")}
        ${U.select("تعيين إلى", "tsk-assignee", userOpts, t?.assigned_to || "")}
        ${U.field("الموعد النهائي", "tsk-due", "date", t?.due_date?.split('T')[0] || "")}
        ${U.field("الساعات المقدرة", "tsk-hours", "number", t?.estimated_hours || "", false)}
      </div>
      ${U.textarea("وصف المهمة", "tsk-desc", t?.description || "", 3, false)}
    `;
    const footer = `${U.btn("إلغاء", "U.closeModal()", "secondary")} ${U.btn(isEdit ? "حفظ التعديلات" : '<i class="fas fa-plus ml-1"></i> إنشاء المهمة', `Views.saveTask('${taskId || ''}')`)}`;
    U.modal(isEdit ? "تعديل المهمة" : "<i class='fas fa-plus text-green-600 ml-2'></i> مهمة جديدة", body, footer);
  },

  async saveTask(taskId) {
    const data = {
      task_id: taskId || U.genId("TSK"),
      title: document.getElementById("tsk-title").value,
      task_type: document.getElementById("tsk-type").value,
      priority: document.getElementById("tsk-priority").value,
      client_id: document.getElementById("tsk-client").value,
      project_id: document.getElementById("tsk-project").value,
      assigned_to: document.getElementById("tsk-assignee").value,
      due_date: document.getElementById("tsk-due").value,
      estimated_hours: document.getElementById("tsk-hours").value,
      description: document.getElementById("tsk-desc").value,
      status: taskId ? (window.AppStore.state.tasks.find(t=>t.task_id===taskId)?.status || "To Do") : "To Do",
      assigned_by: window.AppStore.state.currentUser.user_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (!data.title) { U.toast("يرجى إدخال عنوان المهمة", "error"); return; }
    U.closeModal(); U.toast("جاري الحفظ...", "info");
    const r = await window.AppStore.api(taskId ? "updateTask" : "addTask", { taskData: data });
    if (r?.ok) { U.toast("تم حفظ المهمة بنجاح", "success"); await window.App.refresh(); }
    else {
      if (!taskId) window.AppStore.state.tasks.push(data);
      else { const idx = window.AppStore.state.tasks.findIndex(t => t.task_id === taskId); if (idx >= 0) Object.assign(window.AppStore.state.tasks[idx], data); }
      U.toast("تم الحفظ محلياً", "info"); window.App.renderView();
    }
  },

  /* ─── Task Detail Modal ─── */
  openTaskDetail(taskId) {
    const t = window.AppStore.state.tasks.find(x => x.task_id === taskId);
    if (!t) return;
    const comments = window.AppStore.state.taskComments.filter(c => c.task_id === taskId);
    const late = U.isLate(t);

    const body = `
      <div class="space-y-4">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="px-3 py-1 text-xs rounded-full text-white font-bold" style="background:${U.statusColor[t.status]}">${U.statusAr[t.status]}</span>
          <span class="px-2 py-1 text-[10px] font-bold rounded ${U.priorityBg[t.priority]}">${t.priority}</span>
          <span class="px-2 py-1 text-[10px] bg-gray-100 text-gray-600 rounded font-bold">${t.task_type}</span>
          ${late ? '<span class="px-2 py-1 text-[10px] bg-red-100 text-red-700 rounded font-bold">⚠️ متأخرة</span>' : ''}
        </div>

        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="bg-gray-50 p-3 rounded-xl"><span class="text-gray-500 block mb-1">العميل</span><span class="font-bold text-navy-900">${window.AppStore.getClientName(t.client_id)}</span></div>
          <div class="bg-gray-50 p-3 rounded-xl"><span class="text-gray-500 block mb-1">المشروع</span><span class="font-bold text-navy-900">${window.AppStore.getProjectName(t.project_id)}</span></div>
          <div class="bg-gray-50 p-3 rounded-xl"><span class="text-gray-500 block mb-1">المسؤول</span><span class="font-bold text-navy-900">${window.AppStore.getUserName(t.assigned_to)}</span></div>
          <div class="bg-gray-50 p-3 rounded-xl"><span class="text-gray-500 block mb-1">الموعد النهائي</span><span class="font-bold ${late ? 'text-red-600' : 'text-navy-900'}">${U.fmtDate(t.due_date)}</span></div>
        </div>

        ${t.description ? `<div class="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed">${t.description}</div>` : ''}

        <!-- Status Change -->
        <div class="border-t border-gray-100 pt-3">
          <label class="text-xs font-bold text-gray-600 mb-2 block">تغيير الحالة:</label>
          <div class="flex gap-2 flex-wrap">
            ${U.statuses.map(s => `<button onclick="Views._changeStatus('${taskId}','${s}')" class="px-3 py-1.5 text-xs rounded-xl font-bold transition ${t.status === s ? 'bg-navy-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">${U.statusAr[s]}</button>`).join("")}
          </div>
        </div>

        <!-- Comments -->
        <div class="border-t border-gray-100 pt-3">
          <h4 class="text-xs font-bold text-gray-600 mb-2"><i class="fas fa-comments text-blue-600 ml-1"></i> التعليقات (${comments.length})</h4>
          <div class="space-y-2 mb-3 max-h-40 overflow-y-auto">
            ${comments.map(cm => `
              <div class="bg-gray-50 p-2.5 rounded-xl text-xs">
                <span class="font-bold text-navy-900">${window.AppStore.getUserName(cm.user_id)}</span>
                <span class="text-gray-400 text-[10px] mr-2">${U.fmtDate(cm.created_at)}</span>
                <p class="text-gray-700 mt-1">${cm.comment_text}</p>
              </div>
            `).join("")}
          </div>
          <div class="flex gap-2">
            <input type="text" id="comment-text" placeholder="أضف تعليق..." class="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-navy-700">
            <button onclick="Views._addComment('${taskId}')" class="px-4 py-2 bg-navy-900 text-white rounded-xl text-xs font-bold"><i class="fas fa-paper-plane"></i></button>
          </div>
        </div>
      </div>`;

    const footer = `
      ${U.btn("إلغاء", "U.closeModal()", "secondary")}
      ${U.btn('<i class="fas fa-edit ml-1"></i> تعديل', `U.closeModal(); Views.openTaskModal('${taskId}')`)}
      ${U.btn('<i class="fas fa-paper-plane ml-1"></i> تسليم ➔', `U.closeModal(); Views.openHandoverModal('${taskId}')`)}
    `;

    U.modal(`<i class="fas fa-clipboard-list text-beige-500 ml-2"></i> ${t.title}`, body, footer);
  },

  async _changeStatus(taskId, newStatus) {
    const t = window.AppStore.state.tasks.find(x => x.task_id === taskId);
    if (!t || t.status === newStatus) return;
    t.status = newStatus;
    if (newStatus === "Completed") t.completed_at = new Date().toISOString();
    U.closeModal();
    U.toast(`تم تغيير الحالة إلى: ${U.statusAr[newStatus]}`, "success");
    window.App.renderView();
    await window.AppStore.api("updateTaskStatus", { taskId, newStatus, userId: window.AppStore.state.currentUser.user_id });
  },

  async _addComment(taskId) {
    const text = document.getElementById("comment-text")?.value;
    if (!text) return;
    const comment = { comment_id: U.genId("CMT"), task_id: taskId, user_id: window.AppStore.state.currentUser.user_id, comment_text: text, created_at: new Date().toISOString() };
    window.AppStore.state.taskComments.push(comment);
    U.closeModal();
    this.openTaskDetail(taskId);
    await window.AppStore.api("addComment", { commentData: comment });
  },

  /* ─── Handover Modal ─── */
  openHandoverModal(taskId) {
    const task = window.AppStore.state.tasks.find(t => t.task_id === taskId);
    if (!task) return;

    const body = `
      <div class="bg-blue-50 border border-blue-200 p-3 rounded-xl mb-4 text-xs text-blue-800">
        <i class="fas fa-info-circle ml-1"></i> سيتم إكمال المهمة الحالية وإنشاء مهمة جديدة للموظف والمرحلة التالية تلقائياً
      </div>
      ${U.select("التخصص / المرحلة التالية", "ho-stage", U.taskTypes, "")}
      ${U.select("تعيين إلى موظف", "ho-user", window.AppStore.state.users.map(u => ({value:u.user_id, text:`${u.full_name} (${u.job_title || u.role})`})), "")}
      ${U.textarea("ملاحظات التسليم (إلزامية)", "ho-notes", "", 3, true)}
    `;
    const footer = `${U.btn("إلغاء", "U.closeModal()", "secondary")} ${U.btn('<i class="fas fa-paper-plane ml-1"></i> تأكيد التسليم', `Views._submitHandover('${taskId}')`)}`;
    U.modal(`<i class="fas fa-exchange-alt text-beige-500 ml-2"></i> تسليم للمرحلة التالية`, body, footer);
  },

  async _submitHandover(taskId) {
    const stage = document.getElementById("ho-stage").value;
    const toUser = document.getElementById("ho-user").value;
    const notes = document.getElementById("ho-notes").value;
    if (!notes) { U.toast("ملاحظات التسليم إلزامية", "error"); return; }

    const task = window.AppStore.state.tasks.find(t => t.task_id === taskId);
    const hData = {
      task_id: taskId, project_id: task?.project_id, client_id: task?.client_id,
      task_title: task?.title, from_user_id: window.AppStore.state.currentUser.user_id,
      to_user_id: toUser, from_stage: task?.task_type, to_stage: stage, notes
    };

    U.closeModal(); U.toast("جاري التسليم...", "info");
    const r = await window.AppStore.api("handoverTask", { handoverData: hData });
    if (r?.ok) { U.toast("تم التسليم بنجاح!", "success"); await window.App.refresh(); }
    else {
      if (task) task.status = "Completed";
      const newTask = { task_id: U.genId("TSK"), title: `[تسليم] ${stage}: ${task?.title}`, task_type: stage, assigned_to: toUser, assigned_by: hData.from_user_id, status: "To Do", priority: task?.priority || "متوسط", project_id: task?.project_id, client_id: task?.client_id, parent_task_id: taskId, created_at: new Date().toISOString() };
      window.AppStore.state.tasks.push(newTask);
      U.toast("تم التسليم محلياً", "info"); window.App.renderView();
    }
  },

  /* ─── 4.6 LEADERBOARD ─── */
  leaderboard(c) {
    const users = window.AppStore.state.users;
    const ranked = users.map(u => ({ ...u, ...this._calcKPI(u.user_id) })).sort((a,b) => b.total - a.total);
    const first = ranked[0] || {};

    c.innerHTML = `
      <div class="space-y-6">
        <div class="bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 p-8 rounded-3xl text-center space-y-3 border border-amber-200">
          <div class="text-5xl">🏆</div>
          <span class="px-4 py-1 bg-navy-900 text-beige-400 text-xs font-black rounded-full inline-block">موظف الشهر</span>
          <h2 class="text-3xl font-black text-navy-900">${first.full_name || '—'}</h2>
          <p class="text-sm font-bold text-navy-800">${first.job_title || ''} | النقاط: ${first.total || 0} / 100</p>
        </div>

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 class="font-bold text-navy-900 mb-4"><i class="fas fa-list-ol text-amber-500 ml-2"></i> ترتيب الفريق</h3>
          <div class="space-y-2">
            ${ranked.map((u, i) => `
              <div class="p-3 rounded-xl border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition">
                <div class="flex items-center gap-3">
                  <span class="w-8 h-8 rounded-full font-black text-sm flex items-center justify-center ${i===0?'bg-amber-400 text-navy-900':i===1?'bg-gray-300 text-gray-800':i===2?'bg-amber-700 text-white':'bg-gray-100 text-gray-600'}">${i+1}</span>
                  <img src="${u.avatar_url || 'https://i.pravatar.cc/40'}" class="w-9 h-9 rounded-full object-cover border">
                  <div>
                    <div class="font-bold text-navy-900 text-sm">${u.full_name}</div>
                    <div class="text-xs text-gray-400">${u.job_title || u.role}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="font-black text-navy-900 text-sm">${u.total}</span>
                  <span class="text-xs ${u.cls} font-bold px-2 py-0.5 rounded-full">${u.badge}</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>`;
  },

  /* ─── 4.7 PROFILE ─── */
  profile(c) {
    const u = window.AppStore.state.currentUser;
    const score = this._calcKPI(u.user_id);
    const myTasks = window.AppStore.state.tasks.filter(t => t.assigned_to === u.user_id);
    const done = myTasks.filter(t => t.status === "Completed").length;

    c.innerHTML = `
      <div class="space-y-4 max-w-3xl mx-auto">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center space-y-3">
          <img src="${u.avatar_url || 'https://i.pravatar.cc/150'}" class="w-20 h-20 rounded-full mx-auto border-4 border-beige-500 object-cover shadow">
          <h2 class="text-xl font-bold text-navy-900">${u.full_name}</h2>
          <p class="text-xs text-gray-500">${u.job_title || u.role} — ${u.department || ''}</p>
          <div class="flex justify-center gap-4 mt-2">
            <div class="text-center"><span class="block text-2xl font-black text-navy-900">${myTasks.length}</span><span class="text-[10px] text-gray-400">مهمة كلية</span></div>
            <div class="text-center"><span class="block text-2xl font-black text-green-600">${done}</span><span class="text-[10px] text-gray-400">مكتملة</span></div>
            <div class="text-center"><span class="block text-2xl font-black text-beige-500">${score.total}</span><span class="text-[10px] text-gray-400">النقاط</span></div>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 class="font-bold text-navy-900 mb-2 text-sm"><i class="fas fa-user-tag text-teal-600 ml-1"></i> الوصف الوظيفي</h3>
          <p class="text-sm text-gray-600 leading-relaxed">${u.job_description || 'مسؤول عن تنفيذ المهام المسندة وإدارتها وفق أعلى معايير الجودة.'}</p>
        </div>

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 class="font-bold text-navy-900 mb-3 text-sm"><i class="fas fa-lock text-red-600 ml-1"></i> تغيير كلمة المرور</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${U.field("كلمة المرور الحالية", "pwd-old", "password", "")}
            ${U.field("كلمة المرور الجديدة", "pwd-new", "password", "")}
          </div>
          <button onclick="Views._changePwd()" class="mt-2 px-4 py-2 bg-navy-900 text-white rounded-xl text-xs font-bold shadow"><i class="fas fa-save ml-1"></i> تحديث</button>
        </div>
      </div>`;
  },

  async _changePwd() {
    const r = await window.AppStore.api("changePassword", { userId: window.AppStore.state.currentUser.user_id, oldPassword: document.getElementById("pwd-old").value, newPassword: document.getElementById("pwd-new").value });
    U.toast(r?.ok ? "تم تحديث كلمة المرور بنجاح" : (r?.error || "فشل التحديث"), r?.ok ? "success" : "error");
  },

  /* ─── 4.8 HISTORY ─── */
  history(c) {
    const logs = window.AppStore.state.historyLog;
    c.innerHTML = `
      <div class="space-y-4">
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h2 class="text-lg font-bold text-navy-900"><i class="fas fa-history text-red-600 ml-2"></i> السجل التاريخي (Audit Trail)</h2>
          <p class="text-xs text-gray-500 mt-1">سجل غير قابل للتعديل لجميع العمليات</p>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table class="w-full text-right text-xs">
            <thead class="bg-navy-900 text-white">
              <tr><th class="p-3">التاريخ</th><th class="p-3">المستخدم</th><th class="p-3">الإجراء</th><th class="p-3">الكيان</th><th class="p-3">التفاصيل</th></tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              ${logs.length === 0 ? '<tr><td colspan="5" class="p-6 text-center text-gray-400">لا توجد سجلات بعد</td></tr>' : ""}
              ${logs.slice(0, 100).map(l => `
                <tr class="hover:bg-gray-50">
                  <td class="p-3 text-gray-400 font-mono text-[10px]">${l.timestamp ? new Date(l.timestamp).toLocaleString('ar-EG') : ''}</td>
                  <td class="p-3 font-bold text-navy-900">${l.user_name || l.user_id}</td>
                  <td class="p-3"><span class="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px]">${l.action_type}</span></td>
                  <td class="p-3 text-gray-600">${l.entity_type || ''}</td>
                  <td class="p-3 text-gray-700 max-w-xs truncate">${l.details || ''}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  /* ─── HELPER FUNCTIONS ─── */
  _filteredTasks() {
    const f = window.AppStore.state.filters;
    const u = window.AppStore.state.currentUser;
    return window.AppStore.state.tasks.filter(t => {
      if (f.myTasksOnly && t.assigned_to !== u.user_id) return false;
      if (f.taskType !== "ALL" && t.task_type !== f.taskType) return false;
      if (f.priority !== "ALL" && t.priority !== f.priority) return false;
      if (f.searchQuery) { const q = f.searchQuery.toLowerCase(); if (!t.title.toLowerCase().includes(q) && !(t.description||"").toLowerCase().includes(q)) return false; }
      return true;
    });
  },

  _filter(key, val) { window.AppStore.state.filters[key] = val; window.App.renderView(); },
  _toggleMy() { window.AppStore.state.filters.myTasksOnly = !window.AppStore.state.filters.myTasksOnly; window.App.renderView(); },

  _calcKPI(userId) {
    const tasks = window.AppStore.state.tasks.filter(t => t.assigned_to === userId);
    if (tasks.length === 0) return { total: 90, badge: "ممتاز 🏆", cls: "bg-amber-100 text-amber-700" };
    const done = tasks.filter(t => t.status === "Completed");
    const onTime = done.filter(t => !t.completed_at || !t.due_date || new Date(t.completed_at) <= new Date(t.due_date)).length;
    const rate = (done.length / tasks.length) * 100;
    const otRate = done.length > 0 ? (onTime / done.length) * 100 : 100;
    const total = Math.round(rate * 0.5 + otRate * 0.5);
    let badge = "متوسط 👍", cls = "bg-blue-100 text-blue-700";
    if (total >= 90) { badge = "ممتاز 🏆"; cls = "bg-amber-100 text-amber-700"; }
    else if (total >= 75) { badge = "جيد جداً ⭐"; cls = "bg-green-100 text-green-700"; }
    else if (total < 60) { badge = "يحتاج تحسين ⚠️"; cls = "bg-red-100 text-red-700"; }
    return { total, badge, cls };
  }
};

/* ═══════════════════════════════════════════════
   5. BOOT
   ═══════════════════════════════════════════════ */
function startFalakApp() {
  window.AppStore.init();
  window.App.init();
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  setTimeout(startFalakApp, 1);
} else {
  document.addEventListener("DOMContentLoaded", startFalakApp);
}
