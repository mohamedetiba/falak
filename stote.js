/**
 * Enterprise Marketing Operations Data Store & Google Sheets Sync Engine
 */

window.AppStore = {
  // Google Apps Script Web App Endpoint URL provided by User
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwUQxXbk7zTr0u86_SK2vvwV8E_GvZsqd3PzOGyjfKGUGxv6qPrIiPjxXOWbzmlGwpLNQ/exec",

  state: {
    currentUser: null,
    users: [],
    workspaces: [],
    spaces: [],
    folders: [],
    lists: [],
    tasks: [],
    subtasks: [],
    comments: [],
    auditLogs: [],
    activeView: "dashboard", // dashboard, board, list, calendar, gantt, review, kpis
    activeSpaceId: "ALL",
    activeFolderId: "ALL",
    activeListId: "ALL",
    filters: {
      searchQuery: "",
      status: "ALL",
      priority: "ALL",
      assigneeId: "ALL",
      platform: "ALL",
      dateRange: "ALL"
    }
  },

  init: function() {
    this.loadFromLocalStorage();
    if (!this.state.users || this.state.users.length === 0) {
      this.seedInitialMockData();
      this.saveToLocalStorage();
    }
  },

  loadFromLocalStorage: function() {
    try {
      const savedState = localStorage.getItem("MARKETING_OPS_SYSTEM_DB_V1");
      if (savedState) {
        const parsed = JSON.parse(savedState);
        this.state.users = parsed.users || [];
        this.state.workspaces = parsed.workspaces || [];
        this.state.spaces = parsed.spaces || [];
        this.state.folders = parsed.folders || [];
        this.state.lists = parsed.lists || [];
        this.state.tasks = parsed.tasks || [];
        this.state.subtasks = parsed.subtasks || [];
        this.state.comments = parsed.comments || [];
        this.state.auditLogs = parsed.auditLogs || [];
      }
      
      const savedUser = localStorage.getItem("MARKETING_OPS_CURRENT_USER");
      if (savedUser) {
        this.state.currentUser = JSON.parse(savedUser);
      }
    } catch (e) {
      console.error("Error loading local storage:", e);
    }
  },

  saveToLocalStorage: function() {
    try {
      const payload = {
        users: this.state.users,
        workspaces: this.state.workspaces,
        spaces: this.state.spaces,
        folders: this.state.folders,
        lists: this.state.lists,
        tasks: this.state.tasks,
        subtasks: this.state.subtasks,
        comments: this.state.comments,
        auditLogs: this.state.auditLogs
      };
      localStorage.setItem("MARKETING_OPS_SYSTEM_DB_V1", JSON.stringify(payload));
      if (this.state.currentUser) {
        localStorage.setItem("MARKETING_OPS_CURRENT_USER", JSON.stringify(this.state.currentUser));
      }
    } catch (e) {
      console.error("Error saving to local storage:", e);
    }
  },

  seedInitialMockData: function() {
    // 10 Key Users covering all requested roles
    this.state.users = [
      { user_id: "USR-001", full_name: "أحمد بن علي", email: "owner@agency.com", role: "Owner", avatar: "https://i.pravatar.cc/150?img=68" },
      { user_id: "USR-002", full_name: "د. سارة محمود", email: "gm@agency.com", role: "GM", avatar: "https://i.pravatar.cc/150?img=47" },
      { user_id: "USR-003", full_name: "عمر الفاروق", email: "ops@agency.com", role: "Ops_Manager", avatar: "https://i.pravatar.cc/150?img=12" },
      { user_id: "USR-004", full_name: "مهندس خالد مصطفى", email: "tech@agency.com", role: "Tech_Lead", avatar: "https://i.pravatar.cc/150?img=60" },
      { user_id: "USR-005", full_name: "طارق زياد", email: "marketing@agency.com", role: "Marketing_Manager", avatar: "https://i.pravatar.cc/150?img=33" },
      { user_id: "USR-006", full_name: "مريم إبراهيم", email: "content@agency.com", role: "Content_Creator", avatar: "https://i.pravatar.cc/150?img=49" },
      { user_id: "USR-007", full_name: "حمزة يوسف", email: "media@agency.com", role: "Media_Buyer", avatar: "https://i.pravatar.cc/150?img=15" },
      { user_id: "USR-008", full_name: "نور الهدى", email: "designer@agency.com", role: "Designer", avatar: "https://i.pravatar.cc/150?img=38" },
      { user_id: "USR-009", full_name: "كريم السعدي", email: "social@agency.com", role: "Social_Media", avatar: "https://i.pravatar.cc/150?img=52" },
      { user_id: "USR-010", full_name: "فاطمة الزهراء", email: "seo@agency.com", role: "SEO_Specialist", avatar: "https://i.pravatar.cc/150?img=26" }
    ];

    // Hierarchy: Workspace -> Space -> Folder -> List
    this.state.workspaces = [
      { workspace_id: "WS-001", name: "Enterprise Marketing Agency HQ" }
    ];

    this.state.spaces = [
      { space_id: "SPC-001", workspace_id: "WS-001", name: "Paid Ads & Performance", color: "#3b82f6", icon: "fa-bullseye" },
      { space_id: "SPC-002", workspace_id: "WS-001", name: "Creative & Content Studio", color: "#ec4899", icon: "fa-palette" },
      { space_id: "SPC-003", workspace_id: "WS-001", name: "Organic Growth & SEO", color: "#10b981", icon: "fa-chart-pie" },
      { space_id: "SPC-004", workspace_id: "WS-001", name: "Tech Development & Automation", color: "#8b5cf6", icon: "fa-laptop-code" }
    ];

    this.state.folders = [
      { folder_id: "FLD-001", space_id: "SPC-001", name: "عميل: متجر النخبة للملابس (E-Commerce)" },
      { folder_id: "FLD-002", space_id: "SPC-001", name: "عميل: أكاديمية المهارات المستقبلية (Leads)" },
      { folder_id: "FLD-003", space_id: "SPC-002", name: "إنتاج محتوى وسائل التواصل الاجتماعي" },
      { folder_id: "FLD-004", space_id: "SPC-003", name: "حملة تحسين المحركات SEO Q3" }
    ];

    this.state.lists = [
      { list_id: "LST-001", folder_id: "FLD-001", name: "حملات Meta & TikTok Ads" },
      { list_id: "LST-002", folder_id: "FLD-001", name: "تصاميم الإعلانات والفيديوهات" },
      { list_id: "LST-003", folder_id: "FLD-002", name: "حملات Google Lead Generation" },
      { list_id: "LST-004", folder_id: "FLD-003", name: "صناعة نصوص السكربتات والبوستات" },
      { list_id: "LST-005", folder_id: "FLD-004", name: "تدقيق الكلمات والمقالات المتوافقة مع SEO" }
    ];

    const now = new Date();
    const in3Hours = new Date(now.getTime() + (3 * 60 * 60 * 1000)).toISOString(); // Critical Red SLA (< 5h)
    const in18Hours = new Date(now.getTime() + (18 * 60 * 60 * 1000)).toISOString(); // Warning Yellow SLA (< 24h)
    const in3Days = new Date(now.getTime() + (72 * 60 * 60 * 1000)).toISOString(); // Normal SLA
    const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString(); // Overdue

    // Initial Marketing Agency Tasks with Custom Fields & Deadlines
    this.state.tasks = [
      {
        task_id: "TSK-1001",
        list_id: "LST-001",
        additional_list_ids: "LST-002",
        title: "إطلاق حملة Meta Conversion لمنتجات الصيف الجديدة",
        description: "مطلوب تجهيز 4 أدسيت واستهداف الجمهور المهتم بالأزياء. الميزانية اليومية 500 دولار.",
        creator_id: "USR-005",
        assignee_ids: "USR-007", // Media Buyer
        status: "In Progress",
        priority: "Urgent",
        start_date: yesterday,
        due_date: in3Hours, // SLA Pulsing Red (<5 hours!)
        estimated_hours: 6,
        logged_hours: 4.5,
        ad_budget: 3500,
        platform: "Meta",
        lead_count: 240,
        client_name: "متجر النخبة للملابس",
        is_review_task: false,
        review_status: "Pending Review",
        manager_feedback: "",
        created_at: yesterday,
        updated_at: now.toISOString()
      },
      {
        task_id: "TSK-1002",
        list_id: "LST-002",
        additional_list_ids: "",
        title: "تصميم 5 فيديو ريلز إعلاني لـ TikTok Ads",
        description: "مقاطع 9:16 ذات طابع حماسي ديناميكي لمنتجات التجميل.",
        creator_id: "USR-003",
        assignee_ids: "USR-008", // Designer
        status: "Review",
        priority: "High",
        start_date: yesterday,
        due_date: in18Hours, // SLA Yellow (<24 hours!)
        estimated_hours: 8,
        logged_hours: 7.0,
        ad_budget: 0,
        platform: "TikTok",
        lead_count: 0,
        client_name: "متجر النخبة للملابس",
        is_review_task: true,
        review_status: "Pending Review",
        manager_feedback: "تأكد من إبراز الشعار في أول 3 ثواني",
        created_at: yesterday,
        updated_at: now.toISOString()
      },
      {
        task_id: "TSK-1003",
        list_id: "LST-004",
        additional_list_ids: "",
        title: "كتابة 10 إعلانات Ad Copy عالي التحويل لمواسم الخصومات",
        description: "استخدام صيغة AIDA و PAS لجذب انتباه العملاء وتخفيض تكلفة الليد.",
        creator_id: "USR-005",
        assignee_ids: "USR-006", // Content Creator
        status: "Completed",
        priority: "Normal",
        start_date: yesterday,
        due_date: in3Days,
        estimated_hours: 5,
        logged_hours: 4.0,
        ad_budget: 0,
        platform: "Meta",
        lead_count: 0,
        client_name: "أكاديمية المهارات المستقبلية",
        is_review_task: false,
        review_status: "Manager Approved",
        manager_feedback: "تم القبول - أسلوب كتابة ممتاز!",
        created_at: yesterday,
        updated_at: now.toISOString()
      },
      {
        task_id: "TSK-1004",
        list_id: "LST-005",
        additional_list_ids: "",
        title: "تحسين SEO لصفحات الهبوط وزيادة سرعة الـ LCP",
        description: "معالجة أخطاء الكود وتحسين الكلمات المفتاحية لمصطلح كورس تسويق رقمي.",
        creator_id: "USR-004",
        assignee_ids: "USR-010", // SEO Specialist
        status: "In Progress",
        priority: "High",
        start_date: yesterday,
        due_date: yesterday, // Overdue Task!
        estimated_hours: 12,
        logged_hours: 14,
        ad_budget: 0,
        platform: "Google",
        lead_count: 45,
        client_name: "أكاديمية المهارات المستقبلية",
        is_review_task: false,
        review_status: "Pending Review",
        manager_feedback: "",
        created_at: yesterday,
        updated_at: now.toISOString()
      },
      {
        task_id: "TSK-1005",
        list_id: "LST-003",
        additional_list_ids: "",
        title: "ربط Make.com Webhook لإرسال Leads تلقائياً إلى CRM",
        description: "إنشاء أوتوميشن فور إدخال النموذج في Google Ads يرسل نوتيفيكيشن للـ Slack.",
        creator_id: "USR-002",
        assignee_ids: "USR-004", // Tech Lead
        status: "Approved",
        priority: "Urgent",
        start_date: yesterday,
        due_date: in3Days,
        estimated_hours: 4,
        logged_hours: 3.5,
        ad_budget: 1200,
        platform: "Google",
        lead_count: 180,
        client_name: "أكاديمية المهارات المستقبلية",
        is_review_task: false,
        review_status: "Manager Approved",
        manager_feedback: "تم ربط الـ Webhook بنجاح وتم الاختبار",
        created_at: yesterday,
        updated_at: now.toISOString()
      }
    ];

    // Initial Comments
    this.state.comments = [
      {
        comment_id: "CMT-001",
        task_id: "TSK-1002",
        author_id: "USR-003",
        content: "برجاء مراجعة الألوان واستخدام Palette الخريفية المعتمدة @نور الهدى",
        is_action_item: true,
        created_at: yesterday
      }
    ];

    // Default Logged in user: General Manager for demo
    this.state.currentUser = this.state.users[1]; // GM
  },

  // State Mutators & Data Sync
  setCurrentUser: function(user) {
    this.state.currentUser = user;
    this.saveToLocalStorage();
  },

  saveTask: function(taskObj) {
    const idx = this.state.tasks.findIndex(t => t.task_id === taskObj.task_id);
    if (idx >= 0) {
      this.state.tasks[idx] = { ...this.state.tasks[idx], ...taskObj, updated_at: new Date().toISOString() };
    } else {
      this.state.tasks.push({
        ...taskObj,
        task_id: "TSK-" + Math.floor(1000 + Math.random() * 9000),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    this.saveToLocalStorage();
    this.syncWithGoogleSheets("saveTask", { task: taskObj });
  },

  updateTaskStatus: function(taskId, newStatus) {
    const task = this.state.tasks.find(t => t.task_id === taskId);
    if (task) {
      task.status = newStatus;
      task.updated_at = new Date().toISOString();

      if (newStatus === "Review") {
        task.is_review_task = true;
        task.review_status = "Pending Review";
      }

      this.addAuditLog(taskId, this.state.currentUser ? this.state.currentUser.user_id : "SYSTEM", `تغيير حالة المهمة إلى ${newStatus}`);
      this.saveToLocalStorage();
      this.syncWithGoogleSheets("updateTaskStatus", { taskId, newStatus, userId: this.state.currentUser.user_id });
    }
  },

  deleteTask: function(taskId) {
    this.state.tasks = this.state.tasks.filter(t => t.task_id !== taskId);
    this.saveToLocalStorage();
    this.syncWithGoogleSheets("deleteTask", { taskId });
  },

  addComment: function(taskId, content, isActionItem) {
    const commentObj = {
      comment_id: "CMT-" + Date.now(),
      task_id: taskId,
      author_id: this.state.currentUser.user_id,
      content: content,
      is_action_item: !!isActionItem,
      created_at: new Date().toISOString()
    };
    this.state.comments.push(commentObj);
    this.saveToLocalStorage();
    this.syncWithGoogleSheets("addComment", { comment: commentObj });
    return commentObj;
  },

  submitReview: function(taskId, reviewStatus, feedback) {
    const task = this.state.tasks.find(t => t.task_id === taskId);
    if (task) {
      task.review_status = reviewStatus;
      task.manager_feedback = feedback;
      if (reviewStatus === "Manager Approved") {
        task.status = "Approved";
      } else if (reviewStatus === "Revision Requested") {
        task.status = "In Progress";
      }
      task.updated_at = new Date().toISOString();

      this.addAuditLog(taskId, this.state.currentUser.user_id, `مراجعة المدير: ${reviewStatus}`);
      this.saveToLocalStorage();
      this.syncWithGoogleSheets("submitReview", { taskId, reviewStatus, feedback, managerId: this.state.currentUser.user_id });
    }
  },

  addAuditLog: function(taskId, userId, action) {
    this.state.auditLogs.unshift({
      audit_id: "AUD-" + Date.now(),
      task_id: taskId,
      user_id: userId,
      action: action,
      timestamp: new Date().toISOString()
    });
  },

  // Async Google Apps Script backend sync helper
  syncWithGoogleSheets: function(action, payload) {
    if (!this.APPS_SCRIPT_URL || this.APPS_SCRIPT_URL.includes("YOUR_SCRIPT_ID")) return;
    
    fetch(this.APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: action, ...payload })
    }).catch(err => console.log("Google Apps Script async sync notice:", err));
  },

  // Helper getters
  getFilteredTasks: function() {
    const f = this.state.filters;
    const user = this.state.currentUser;

    return this.state.tasks.filter(t => {
      // Space/Folder/List hierarchy filter
      if (this.state.activeListId !== "ALL" && t.list_id !== this.state.activeListId) return false;
      
      // Privacy / Assignee filter: non-executive users see tasks assigned to them or created by them
      if (user && user.role !== "Owner" && user.role !== "GM" && user.role !== "Ops_Manager") {
        const assignees = t.assignee_ids ? t.assignee_ids.split(',').map(s => s.trim()) : [];
        if (t.creator_id !== user.user_id && !assignees.includes(user.user_id)) {
          return false;
        }
      }

      // Filter: Search Query
      if (f.searchQuery) {
        const q = f.searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchClient = (t.client_name || "").toLowerCase().includes(q);
        if (!matchTitle && !matchClient) return false;
      }

      // Filter: Status
      if (f.status !== "ALL" && t.status !== f.status) return false;

      // Filter: Priority
      if (f.priority !== "ALL" && t.priority !== f.priority) return false;

      // Filter: Platform
      if (f.platform !== "ALL" && t.platform !== f.platform) return false;

      // Filter: Assignee
      if (f.assigneeId !== "ALL") {
        const assignees = t.assignee_ids ? t.assignee_ids.split(',').map(s => s.trim()) : [];
        if (!assignees.includes(f.assigneeId)) return false;
      }

      return true;
    });
  }
};
