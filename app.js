/**
 * Main Controller Script for ClickUp-Inspired Enterprise Marketing System
 */
https://script.google.com/macros/s/AKfycbyjqAf1a6EcNV-tbAQ-zmg7iCOFQcxjDk_FV3gsH5KtmtfrMoJPZ0SrpE7jwW2zbxPElg/exec
document.addEventListener("DOMContentLoaded", function() {
  window.AppStore.init();
  window.AppController.init();
});

window.AppController = {
  init: function() {
    this.renderUserBadge();
    this.renderRoleSwitcher();
    this.setupEventListeners();
    this.renderActiveView();
    this.checkSLAAlerts();
  },

  renderUserBadge: function() {
    const user = window.AppStore.state.currentUser;
    if (!user) return;

    document.getElementById("user-avatar-img").src = user.avatar || "https://i.pravatar.cc/150";
    document.getElementById("user-display-name").textContent = user.full_name;

    const roleInfo = window.KPIEngine.roles[user.role] || { title: user.role };
    document.getElementById("user-role-name").textContent = roleInfo.title;
  },

  renderRoleSwitcher: function() {
    const select = document.getElementById("role-simulator-select");
    if (!select) return;

    select.innerHTML = "";
    window.AppStore.state.users.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u.user_id;
      const roleTitle = window.KPIEngine.roles[u.role] ? window.KPIEngine.roles[u.role].title : u.role;
      opt.textContent = `${u.full_name} (${roleTitle})`;
      if (window.AppStore.state.currentUser && window.AppStore.state.currentUser.user_id === u.user_id) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  },

  switchUserRoleSim: function(userId) {
    const targetUser = window.AppStore.state.users.find(u => u.user_id === userId);
    if (targetUser) {
      window.AppStore.setCurrentUser(targetUser);
      this.renderUserBadge();
      this.renderActiveView();
      alert(`تم التبديل بنجاح لرؤية النظام كـ: ${targetUser.full_name} (${targetUser.role})`);
    }
  },

  setupEventListeners: function() {
    const self = this;

    // View Navigation Buttons
    document.querySelectorAll(".view-tab").forEach(tab => {
      tab.addEventListener("click", function() {
        document.querySelectorAll(".view-tab").forEach(t => t.classList.remove("active"));
        this.classList.add("active");
        window.AppStore.state.activeView = this.dataset.view;
        self.renderActiveView();
      });
    });

    // Sidebar Nav Items
    document.querySelectorAll(".nav-item[data-view]").forEach(item => {
      item.addEventListener("click", function() {
        document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
        this.classList.add("active");
        window.AppStore.state.activeView = this.dataset.view;
        
        // sync top view tab if matching
        const topTab = document.querySelector(`.view-tab[data-view="${this.dataset.view}"]`);
        if (topTab) {
          document.querySelectorAll(".view-tab").forEach(t => t.classList.remove("active"));
          topTab.classList.add("active");
        }
        self.renderActiveView();
      });
    });

    // Role Switcher Select
    const roleSelect = document.getElementById("role-simulator-select");
    if (roleSelect) {
      roleSelect.addEventListener("change", function() {
        self.switchUserRoleSim(this.value);
      });
    }

    // Filter Inputs
    const searchInput = document.getElementById("filter-search");
    if (searchInput) {
      searchInput.addEventListener("input", function() {
        window.AppStore.state.filters.searchQuery = this.value;
        self.renderActiveView();
      });
    }

    const statusFilter = document.getElementById("filter-status");
    if (statusFilter) {
      statusFilter.addEventListener("change", function() {
        window.AppStore.state.filters.status = this.value;
        self.renderActiveView();
      });
    }

    const priorityFilter = document.getElementById("filter-priority");
    if (priorityFilter) {
      priorityFilter.addEventListener("change", function() {
        window.AppStore.state.filters.priority = this.value;
        self.renderActiveView();
      });
    }

    const platformFilter = document.getElementById("filter-platform");
    if (platformFilter) {
      platformFilter.addEventListener("change", function() {
        window.AppStore.state.filters.platform = this.value;
        self.renderActiveView();
      });
    }

    // Password Visibility Toggle
    const pwdToggleBtn = document.getElementById("toggle-pwd-btn");
    if (pwdToggleBtn) {
      pwdToggleBtn.addEventListener("click", function() {
        const pwdInput = document.getElementById("login-password");
        if (pwdInput.type === "password") {
          pwdInput.type = "text";
          this.innerHTML = `<i class="fas fa-eye-slash"></i>`;
        } else {
          pwdInput.type = "password";
          this.innerHTML = `<i class="fas fa-eye"></i>`;
        }
      });
    }
  },

  renderActiveView: function() {
    const view = window.AppStore.state.activeView;
    const contentArea = document.getElementById("main-content-area");
    if (!contentArea) return;

    contentArea.innerHTML = "";

    if (view === "dashboard") {
      this.renderMainDashboard(contentArea);
    } else if (view === "board") {
      this.renderKanbanBoard(contentArea);
    } else if (view === "list") {
      this.renderListView(contentArea);
    } else if (view === "calendar") {
      this.renderCalendarView(contentArea);
    } else if (view === "gantt") {
      this.renderGanttView(contentArea);
    } else if (view === "review") {
      this.renderReviewQueue(contentArea);
    } else if (view === "kpis") {
      this.renderKPIAnalyticsView(contentArea);
    }
  },

  // 1. Dashboard View (Tailored by Role: GM/Owner vs Employee)
  renderMainDashboard: function(container) {
    const user = window.AppStore.state.currentUser;
    const allTasks = window.AppStore.state.tasks;
    const allUsers = window.AppStore.state.users;

    const isExecutive = user.role === "Owner" || user.role === "GM" || user.role === "Ops_Manager";

    if (isExecutive) {
      // Executive Dashboard for Owner & GM
      const overview = window.KPIEngine.calculateExecutiveOverview(allUsers, allTasks);

      container.innerHTML = `
        <div class="dashboard-header" style="margin-bottom: 1.5rem;">
          <h2><i class="fas fa-crown" style="color: var(--accent-purple); margin-left: 0.5rem;"></i> داشبورد الإدارة العليا - ${user.full_name}</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem;">نظرة شاملة على أداء الوكالة والمهام التأخيرية وحجم مجهود كل موظف</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card blue">
            <div class="stat-header">
              <span class="stat-title">إجمالي مهام الشركة</span>
              <div class="stat-icon" style="color: var(--accent-blue);"><i class="fas fa-layer-group"></i></div>
            </div>
            <div class="stat-value">${overview.totalTasks}</div>
            <div class="stat-desc">موزعة على كافة الأقسام</div>
          </div>

          <div class="stat-card yellow">
            <div class="stat-header">
              <span class="stat-title">مهام قيد الإنجاز</span>
              <div class="stat-icon" style="color: var(--accent-yellow);"><i class="fas fa-spinner"></i></div>
            </div>
            <div class="stat-value">${overview.inProgressCount}</div>
            <div class="stat-desc">جاري العمل عليها الآن</div>
          </div>

          <div class="stat-card red">
            <div class="stat-header">
              <span class="stat-title">المهام المتأخرة (SLA Overdue)</span>
              <div class="stat-icon" style="color: var(--accent-red);"><i class="fas fa-exclamation-circle"></i></div>
            </div>
            <div class="stat-value">${overview.overdueCount}</div>
            <div class="stat-desc">تتطلب تدخل سريع من مدير العمليات</div>
          </div>

          <div class="stat-card green">
            <div class="stat-header">
              <span class="stat-title">الميزانية الإعلانية النشطة</span>
              <div class="stat-icon" style="color: var(--accent-green);"><i class="fas fa-dollar-sign"></i></div>
            </div>
            <div class="stat-value">$${overview.totalAdBudget.toLocaleString()}</div>
            <div class="stat-desc">إجمالي صرف الحملات</div>
          </div>
        </div>

        <!-- Employee Performance & Workload Matrix Table -->
        <div style="background: var(--bg-card); border-radius: 14px; padding: 1.25rem; border: var(--glass-border); margin-top: 1.5rem;">
          <h3 style="font-size: 1rem; margin-bottom: 1rem;"><i class="fas fa-users-cog"></i> ميزان مجهود الموظفين وتقييم المدير العام</h3>
          <table class="custom-table">
            <thead>
              <tr>
                <th>الموظف</th>
                <th>الوظيفة</th>
                <th>إجمالي المهام</th>
                <th>المنجز</th>
                <th>المتأخر</th>
                <th>معدل الالتزام</th>
                <th>تقييم الأداء</th>
                <th>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              ${overview.staffKPIs.map(s => `
                <tr>
                  <td style="font-weight: 700;">${s.userName}</td>
                  <td><span class="user-role-tag">${s.roleTitle}</span></td>
                  <td>${s.totalAssigned}</td>
                  <td style="color: var(--accent-green); font-weight: 700;">${s.totalCompleted}</td>
                  <td style="color: ${s.totalDelayed > 0 ? 'var(--accent-red)' : 'var(--text-muted)'}; font-weight: 700;">${s.totalDelayed}</td>
                  <td>${s.onTimeRate}%</td>
                  <td><span class="${s.badgeClass}"><i class="fas ${s.badgeIcon}"></i> ${s.performanceBadge} (${s.overallScore}%)</span></td>
                  <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="window.AppController.openEmployeeModal('${s.userId}')"><i class="fas fa-chart-pie"></i> تفاصيل KPIs</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      // Individual Staff Member Dashboard
      const kpis = window.KPIEngine.calculateEmployeeKPIs(user, allTasks);
      const myTasks = window.AppStore.getFilteredTasks();

      container.innerHTML = `
        <div class="dashboard-header" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2>مرحباً، ${user.full_name} 👋</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem;">لوحة التحكم الشخصية وقياس الإنتاجية اليومية</p>
          </div>
          <button class="btn btn-primary" onclick="window.AppController.openTaskModal()"><i class="fas fa-plus"></i> إضافة مهمة جديدة لنفسك</button>
        </div>

        <div class="stats-grid">
          <div class="stat-card blue">
            <div class="stat-header">
              <span class="stat-title">مهامي المنجزة</span>
              <div class="stat-icon" style="color: var(--accent-blue);"><i class="fas fa-check-circle"></i></div>
            </div>
            <div class="stat-value">${kpis.totalCompleted} / ${kpis.totalAssigned}</div>
            <div class="stat-desc">نسبة الإنجاز: ${kpis.completionRate}%</div>
          </div>

          <div class="stat-card ${kpis.overdueCount > 0 ? 'red' : 'green'}">
            <div class="stat-header">
              <span class="stat-title">المهام المتأخرة</span>
              <div class="stat-icon" style="color: ${kpis.overdueCount > 0 ? 'var(--accent-red)' : 'var(--accent-green)'};"><i class="fas fa-clock"></i></div>
            </div>
            <div class="stat-value">${kpis.overdueCount}</div>
            <div class="stat-desc">${kpis.overdueCount > 0 ? 'يرجى إنهاؤها فوراً!' : 'ممتاز! لا يوجد أي تأخير'}</div>
          </div>

          <div class="stat-card purple">
            <div class="stat-header">
              <span class="stat-title">تقييمك الحالي</span>
              <div class="stat-icon" style="color: var(--accent-purple);"><i class="fas fa-award"></i></div>
            </div>
            <div class="stat-value" style="font-size: 1.5rem;"><span class="${kpis.badgeClass}"><i class="fas ${kpis.badgeIcon}"></i> ${kpis.performanceBadge}</span></div>
            <div class="stat-desc">النقاط الكلية: ${kpis.overallScore} / 100</div>
          </div>
        </div>

        <!-- Role Specific KPIs Grid -->
        <h3 style="margin: 1.5rem 0 1rem; font-size: 1rem;"><i class="fas fa-bullseye"></i> مؤشرات الأداء الخاصة بوظيفتك (${kpis.roleTitle})</h3>
        <div class="stats-grid">
          ${kpis.roleKPIs.map(rk => `
            <div class="stat-card" style="border-right: 4px solid ${rk.color};">
              <div class="stat-header">
                <span class="stat-title">${rk.label}</span>
                <div class="stat-icon" style="color: ${rk.color};"><i class="fas ${rk.icon}"></i></div>
              </div>
              <div class="stat-value" style="color: ${rk.color};">${rk.value}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
  },

  // 2. ClickUp Kanban Board View
  renderKanbanBoard: function(container) {
    const tasks = window.AppStore.getFilteredTasks();
    const statuses = ["Backlog", "In Progress", "Review", "Approved", "Completed"];

    const boardHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <h3><i class="fas fa-columns"></i> لوحة المهام (Kanban Board)</h3>
        <button class="btn btn-primary" onclick="window.AppController.openTaskModal()"><i class="fas fa-plus"></i> مهمة جديدة</button>
      </div>

      <div class="kanban-board">
        ${statuses.map(st => {
          const colTasks = tasks.filter(t => t.status === st);
          return `
            <div class="kanban-column" data-status="${st}">
              <div class="column-header">
                <span class="column-title"><i class="fas fa-circle" style="font-size: 0.6rem; color: ${this.getStatusColor(st)};"></i> ${this.getStatusTranslation(st)}</span>
                <span class="column-badge">${colTasks.length}</span>
              </div>
              <div class="task-list-container">
                ${colTasks.map(t => this.renderTaskCard(t)).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.innerHTML = boardHTML;
  },

  // Render individual Task Card with SLA Colors (Yellow 24h, Red 5h)
  renderTaskCard: function(task) {
    const now = new Date();
    const dueDate = task.due_date ? new Date(task.due_date) : null;

    let slaClass = "";
    let slaBadgeHTML = "";

    if (dueDate && task.status !== "Completed" && task.status !== "Approved") {
      const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (diffHours < 0) {
        slaClass = "sla-critical";
        slaBadgeHTML = `<span class="due-critical"><i class="fas fa-exclamation-triangle"></i> متأخرة!</span>`;
      } else if (diffHours <= 5) {
        slaClass = "sla-critical"; // 5 Hours Red Glow
        slaBadgeHTML = `<span class="due-critical"><i class="fas fa-fire"></i> ينتهي خلال ${Math.round(diffHours)} ساعات!</span>`;
      } else if (diffHours <= 24) {
        slaClass = "sla-warning"; // 24 Hours Yellow Glow
        slaBadgeHTML = `<span class="due-warning"><i class="fas fa-hourglass-half"></i> باقي ${Math.round(diffHours)} ساعة</span>`;
      } else {
        slaBadgeHTML = `<span><i class="far fa-calendar-alt"></i> ${dueDate.toLocaleDateString('ar-EG')}</span>`;
      }
    }

    return `
      <div class="task-card ${slaClass}" onclick="window.AppController.openTaskDetailModal('${task.task_id}')">
        <div class="task-tags">
          <span class="priority-badge priority-${task.priority}">${task.priority}</span>
          ${task.platform ? `<span class="tag tag-platform">${task.platform}</span>` : ''}
          ${task.client_name ? `<span class="tag tag-client">${task.client_name}</span>` : ''}
        </div>
        <div class="task-title">${task.title}</div>
        <div class="task-meta">
          <div class="task-due-date">${slaBadgeHTML}</div>
          <div style="font-weight: 600;">${task.logged_hours || 0} / ${task.estimated_hours || 0}h</div>
        </div>
      </div>
    `;
  },

  // 3. ClickUp Table / List View
  renderListView: function(container) {
    const tasks = window.AppStore.getFilteredTasks();

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <h3><i class="fas fa-list-ul"></i> عرض القائمة والجداول (List / Table View)</h3>
        <button class="btn btn-primary" onclick="window.AppController.openTaskModal()"><i class="fas fa-plus"></i> مهمة جديدة</button>
      </div>

      <table class="custom-table">
        <thead>
          <tr>
            <th>كود المهمة</th>
            <th>عنوان المهمة</th>
            <th>العميل</th>
            <th>المنصة</th>
            <th>الميزانية</th>
            <th>الأولوية</th>
            <th>الحالة</th>
            <th>تاريخ التسليم</th>
            <th>الخيارات</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map(t => `
            <tr>
              <td><code>${t.task_id}</code></td>
              <td style="font-weight: 700; cursor: pointer;" onclick="window.AppController.openTaskDetailModal('${t.task_id}')">${t.title}</td>
              <td>${t.client_name || '-'}</td>
              <td><span class="tag tag-platform">${t.platform || 'General'}</span></td>
              <td style="color: var(--accent-green); font-weight: 700;">${t.ad_budget ? '$' + t.ad_budget : '-'}</td>
              <td><span class="priority-badge priority-${t.priority}">${t.priority}</span></td>
              <td><span class="column-badge" style="background: ${this.getStatusColor(t.status)}; color: #fff;">${this.getStatusTranslation(t.status)}</span></td>
              <td>${t.due_date ? new Date(t.due_date).toLocaleDateString('ar-EG') : '-'}</td>
              <td>
                <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="window.AppController.openTaskDetailModal('${t.task_id}')"><i class="fas fa-eye"></i> عرض</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  // 4. Manager Review Queue
  renderReviewQueue: function(container) {
    const tasks = window.AppStore.state.tasks.filter(t => t.status === "Review" || t.is_review_task);

    container.innerHTML = `
      <div class="dashboard-header" style="margin-bottom: 1.5rem;">
        <h2><i class="fas fa-glasses" style="color: var(--accent-yellow);"></i> قائمة مراجعة المدير (Manager Review Queue)</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem;">تظهر جميع المخرجات من التصاميم والإعلانات والنصوص بانتظار الاعتماد أو طلب التعديل</p>
      </div>

      <div style="display: grid; gap: 1rem;">
        ${tasks.length === 0 ? `<p style="color: var(--text-muted);">لا توجد مهام تنتظر المراجعة حالياً.</p>` : ''}
        ${tasks.map(t => `
          <div style="background: var(--bg-card); border-radius: 12px; padding: 1.25rem; border: var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                <span class="priority-badge priority-${t.priority}">${t.priority}</span>
                <span class="tag tag-client">${t.client_name || 'General'}</span>
              </div>
              <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem;">${t.title}</h3>
              <p style="font-size: 0.85rem; color: var(--text-muted);">${t.description}</p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-success" onclick="window.AppController.approveReview('${t.task_id}')"><i class="fas fa-check"></i> اعتماد المخرج</button>
              <button class="btn btn-danger" onclick="window.AppController.requestRevision('${t.task_id}')"><i class="fas fa-redo"></i> طلب تعديلات</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // 5. Calendar View
  renderCalendarView: function(container) {
    container.innerHTML = `
      <div style="background: var(--bg-card); padding: 2rem; border-radius: 14px; text-align: center; border: var(--glass-border);">
        <i class="far fa-calendar-alt" style="font-size: 3rem; color: var(--accent-purple); margin-bottom: 1rem;"></i>
        <h2>عرض التقويم الجدولي (Calendar View)</h2>
        <p style="color: var(--text-muted);">يتم مزامنة جميع Deadlines والتسليما مباشرة على الأيام</p>
      </div>
    `;
  },

  // 6. Gantt Chart View
  renderGanttView: function(container) {
    container.innerHTML = `
      <div style="background: var(--bg-card); padding: 2rem; border-radius: 14px; text-align: center; border: var(--glass-border);">
        <i class="fas fa-stream" style="font-size: 3rem; color: var(--accent-blue); margin-bottom: 1rem;"></i>
        <h2>مخطط جانت وتتبع الاعتماديات (Gantt Chart & Dependencies)</h2>
        <p style="color: var(--text-muted);">رؤية التتابع الزمني والارتباطات بين مهام التصميم والإعلانات الأوتوماتيكية</p>
      </div>
    `;
  },

  // Task Creation Modal
  openTaskModal: function() {
    const modal = document.getElementById("task-modal");
    if (modal) modal.classList.add("active");
  },

  closeTaskModal: function() {
    const modal = document.getElementById("task-modal");
    if (modal) modal.classList.remove("active");
  },

  saveTaskFromForm: function(e) {
    e.preventDefault();
    const taskObj = {
      title: document.getElementById("task-title-input").value,
      client_name: document.getElementById("task-client-input").value,
      platform: document.getElementById("task-platform-input").value,
      ad_budget: parseFloat(document.getElementById("task-budget-input").value || 0),
      priority: document.getElementById("task-priority-input").value,
      due_date: document.getElementById("task-duedate-input").value,
      estimated_hours: parseFloat(document.getElementById("task-hours-input").value || 2),
      assignee_ids: document.getElementById("task-assignee-input").value,
      status: "In Progress",
      creator_id: window.AppStore.state.currentUser.user_id
    };

    window.AppStore.saveTask(taskObj);
    this.closeTaskModal();
    this.renderActiveView();
    alert("تم حفظ المهمة بنجاح ومزامنتها!");
  },

  // Review Actions
  approveReview: function(taskId) {
    window.AppStore.submitReview(taskId, "Manager Approved", "تم اعتماد المخرج بدون ملاحظات");
    this.renderActiveView();
    alert("تم اعتماد المهمة بنجاح وتحويلها لـ Approved!");
  },

  requestRevision: function(taskId) {
    const feedback = prompt("اكتب الملاحظات والتعديلات المطلوبة من الموظف:");
    if (feedback) {
      window.AppStore.submitReview(taskId, "Revision Requested", feedback);
      this.renderActiveView();
      alert("تم إرجاع المهمة للموظف مع الملاحظات!");
    }
  },

  // Helper translations
  getStatusTranslation: function(st) {
    const map = { "Backlog": "قائمة الانتظار", "In Progress": "قيد التنفيذ", "Review": "مراجعة المدير", "Approved": "معتمدة جاهزة", "Completed": "مكتملة" };
    return map[st] || st;
  },

  getStatusColor: function(st) {
    const map = { "Backlog": "#94a3b8", "In Progress": "#3b82f6", "Review": "#f59e0b", "Approved": "#8b5cf6", "Completed": "#10b981" };
    return map[st] || "#3b82f6";
  },

  checkSLAAlerts: function() {
    // Audio / visual alert trigger for critical tasks
    const tasks = window.AppStore.state.tasks;
    const now = new Date();
    let criticalCount = 0;

    tasks.forEach(t => {
      if (t.due_date && t.status !== "Completed" && t.status !== "Approved") {
        const diffHours = (new Date(t.due_date).getTime() - now.getTime()) / (1000 * 60 * 60);
        if (diffHours > 0 && diffHours <= 5) {
          criticalCount++;
        }
      }
    });

    if (criticalCount > 0) {
      console.log(`[SLA ALERT]: يوجد ${criticalCount} مهام ينتهي موعدها خلال أقل من 5 ساعات!`);
    }
  }
};
