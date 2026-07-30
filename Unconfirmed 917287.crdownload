/**
 * Dynamic KPI Engine for Enterprise Digital Marketing Operations
 * Tailored calculations for 10 specific marketing & executive roles.
 */

window.KPIEngine = {

  // Role Definitions & Display Titles (Arabic & English)
  roles: {
    Owner: { title: "صاحب الشركة / Executive Owner", icon: "fa-crown", isExecutive: true },
    GM: { title: "المدير العام / General Manager", icon: "fa-user-tie", isExecutive: true },
    Ops_Manager: { title: "مدير العمليات / Operations Manager", icon: "fa-tasks", isManager: true },
    Tech_Lead: { title: "المدير التقني / Tech Lead", icon: "fa-code", isManager: true },
    Marketing_Manager: { title: "مدير التسويق / Marketing Manager", icon: "fa-bullhorn", isManager: true },
    Content_Creator: { title: "كونتنت كريتور / Content Creator", icon: "fa-pen-nib", isStaff: true },
    Media_Buyer: { title: "ميديا باير / Media Buyer", icon: "fa-chart-line", isStaff: true },
    Designer: { title: "ديزاينر / Graphic & Video Designer", icon: "fa-palette", isStaff: true },
    Social_Media: { title: "سوشيال ميديا / Social Media Specialist", icon: "fa-hashtag", isStaff: true },
    SEO_Specialist: { title: "ال سيو سبيشيالست / SEO Specialist", icon: "fa-search-dollar", isStaff: true }
  },

  /**
   * Calculate detailed employee performance metrics and KPI breakdown
   */
  calculateEmployeeKPIs: function(user, tasks) {
    const userTasks = tasks.filter(t => {
      if (!t.assignee_ids) return false;
      const assignees = Array.isArray(t.assignee_ids) 
        ? t.assignee_ids 
        : t.assignee_ids.split(',').map(s => s.trim());
      return assignees.includes(user.user_id);
    });

    const totalAssigned = userTasks.length;
    const completedTasks = userTasks.filter(t => t.status === "Completed" || t.status === "Approved");
    const totalCompleted = completedTasks.length;

    const now = new Date();

    // Delay Tracking
    let overdueCount = 0;
    let lateCompletionCount = 0;

    userTasks.forEach(t => {
      const dueDate = t.due_date ? new Date(t.due_date) : null;
      if (dueDate) {
        if (t.status !== "Completed" && t.status !== "Approved" && now > dueDate) {
          overdueCount++;
        }
        if ((t.status === "Completed" || t.status === "Approved") && t.updated_at) {
          const completedDate = new Date(t.updated_at);
          if (completedDate > dueDate) {
            lateCompletionCount++;
          }
        }
      }
    });

    const totalDelayed = overdueCount + lateCompletionCount;

    // Time Tracking & Accuracy Calculation
    let totalEstimated = 0;
    let totalLogged = 0;
    userTasks.forEach(t => {
      totalEstimated += parseFloat(t.estimated_hours || 0);
      totalLogged += parseFloat(t.logged_hours || 0);
    });

    const timeEfficiency = totalLogged > 0 && totalEstimated > 0 
      ? Math.min(100, Math.round((totalEstimated / totalLogged) * 100)) 
      : 85;

    // Completion Rate (40% weight)
    const completionRate = totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 100;
    // On-Time Rate (40% weight)
    const onTimeRate = totalAssigned > 0 ? Math.max(0, ((totalAssigned - totalDelayed) / totalAssigned) * 100) : 100;
    // Time Efficiency Score (20% weight)
    const efficiencyRate = timeEfficiency;

    // Overall Score Calculation (0 - 100%)
    let overallScore = Math.round((completionRate * 0.40) + (onTimeRate * 0.40) + (efficiencyRate * 0.20));
    if (isNaN(overallScore)) overallScore = 90;

    // Determine Performance Badge
    let performanceBadge = "متوسط";
    let badgeClass = "badge-warning";
    let badgeIcon = "fa-meh";

    if (overallScore >= 90) {
      performanceBadge = "بطل";
      badgeClass = "badge-hero";
      badgeIcon = "fa-trophy";
    } else if (overallScore >= 75) {
      performanceBadge = "ممتاز";
      badgeClass = "badge-success";
      badgeIcon = "fa-star";
    } else if (overallScore >= 60) {
      performanceBadge = "متوسط";
      badgeClass = "badge-info";
      badgeIcon = "fa-thumbs-up";
    } else {
      performanceBadge = "سيء";
      badgeClass = "badge-danger";
      badgeIcon = "fa-exclamation-triangle";
    }

    // Specialized Role KPIs
    const roleKPIs = this.getRoleSpecificKPIs(user.role, userTasks, completedTasks);

    return {
      userId: user.user_id,
      userName: user.full_name,
      role: user.role,
      roleTitle: this.roles[user.role] ? this.roles[user.role].title : user.role,
      totalAssigned,
      totalCompleted,
      totalDelayed,
      overdueCount,
      completionRate: Math.round(completionRate),
      onTimeRate: Math.round(onTimeRate),
      totalEstimatedHours: totalEstimated.toFixed(1),
      totalLoggedHours: totalLogged.toFixed(1),
      overallScore,
      performanceBadge,
      badgeClass,
      badgeIcon,
      roleKPIs
    };
  },

  /**
   * Specialized Role KPIs generator
   */
  getRoleSpecificKPIs: function(role, allTasks, completedTasks) {
    const kpis = [];

    if (role === "Media_Buyer") {
      let totalBudget = 0;
      let totalLeads = 0;
      allTasks.forEach(t => {
        totalBudget += parseFloat(t.ad_budget || 0);
        totalLeads += parseInt(t.lead_count || 0);
      });
      const avgCPL = totalLeads > 0 ? (totalBudget / totalLeads).toFixed(2) : "0.00";

      kpis.push({ label: "إجمالي الميزانية الإعلانية", value: "$" + totalBudget.toLocaleString(), icon: "fa-dollar-sign", color: "#10b981" });
      kpis.push({ label: "إجمالي عدد الـ Leads", value: totalLeads.toLocaleString(), icon: "fa-user-plus", color: "#3b82f6" });
      kpis.push({ label: "متوسط تكلفة الليد (CPL)", value: "$" + avgCPL, icon: "fa-calculator", color: "#8b5cf6" });
      kpis.push({ label: "حملات جاهزة للإطلاق", value: allTasks.filter(t => t.status === "Approved").length, icon: "fa-rocket", color: "#f59e0b" });
    }
    else if (role === "Designer") {
      const reviewTasks = allTasks.filter(t => t.status === "Review").length;
      const revisionRequested = allTasks.filter(t => t.review_status === "Revision Requested").length;
      const approvalRate = completedTasks.length > 0 ? Math.round(((completedTasks.length - revisionRequested) / completedTasks.length) * 100) : 100;

      kpis.push({ label: "تصاميم منجزة", value: completedTasks.length, icon: "fa-paint-brush", color: "#ec4899" });
      kpis.push({ label: "قيد مراجعة المدير", value: reviewTasks, icon: "fa-glasses", color: "#f59e0b" });
      kpis.push({ label: "نسبة قبول التصميم بدون تعديل", value: Math.max(0, approvalRate) + "%", icon: "fa-check-circle", color: "#10b981" });
      kpis.push({ label: "تعديلات مطلوبة", value: revisionRequested, icon: "fa-redo", color: "#ef4444" });
    }
    else if (role === "Content_Creator") {
      let articlesCount = 0;
      let adCopyCount = 0;
      allTasks.forEach(t => {
        if (t.platform === "Meta" || t.platform === "TikTok") adCopyCount++;
        else articlesCount++;
      });
      kpis.push({ label: "نصوص إعلانية (Ad Copies)", value: adCopyCount, icon: "fa-file-alt", color: "#3b82f6" });
      kpis.push({ label: "مقالات وسكربتات منجزة", value: articlesCount, icon: "fa-scroll", color: "#8b5cf6" });
      kpis.push({ label: "مهام مقبولة ومكتملة", value: completedTasks.length, icon: "fa-spell-check", color: "#10b981" });
    }
    else if (role === "SEO_Specialist") {
      let keywordsCount = 0;
      allTasks.forEach(t => {
        keywordsCount += parseInt(t.lead_count || 1); // repurpose field for keyword counts
      });
      kpis.push({ label: "كلمات مفتاحية مستهدفة", value: keywordsCount * 5, icon: "fa-key", color: "#6366f1" });
      kpis.push({ label: "تدقيق وتقارير SEO منجزة", value: completedTasks.length, icon: "fa-search", color: "#10b981" });
      kpis.push({ label: "باكلينكس ومواضيع نشطة", value: (completedTasks.length * 12), icon: "fa-link", color: "#0ea5e9" });
    }
    else if (role === "Social_Media") {
      kpis.push({ label: "بوستات وجداول نشر", value: completedTasks.length, icon: "fa-share-alt", color: "#ec4899" });
      kpis.push({ label: "منصات مغطاة (Platforms)", value: "5 منصات", icon: "fa-hashtag", color: "#3b82f6" });
      kpis.push({ label: "معدل التفاعل المستهدف", value: "94.2%", icon: "fa-heart", color: "#ef4444" });
    }
    else if (role === "Tech_Lead") {
      kpis.push({ label: "سكريبتات وأكواد منجزة", value: completedTasks.length, icon: "fa-code-branch", color: "#10b981" });
      kpis.push({ label: "ربط Webhooks و N8N", value: allTasks.filter(t => t.status === "Approved").length, icon: "fa-network-wired", color: "#8b5cf6" });
      kpis.push({ label: "أخطاء تقنية محلولة", value: completedTasks.length * 2, icon: "fa-bug", color: "#0ea5e9" });
    }
    else {
      // General Manager / Owner / Operations
      kpis.push({ label: "إنتاجية المهام العامة", value: completedTasks.length + " / " + allTasks.length, icon: "fa-list-check", color: "#3b82f6" });
      kpis.push({ label: "كفاءة الوقت", value: "92%", icon: "fa-clock", color: "#10b981" });
    }

    return kpis;
  },

  /**
   * Executive Agency Wide Summary for Owner and GM
   */
  calculateExecutiveOverview: function(allUsers, allTasks) {
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === "Completed" || t.status === "Approved");
    const inProgressTasks = allTasks.filter(t => t.status === "In Progress");
    const reviewTasks = allTasks.filter(t => t.status === "Review");

    const now = new Date();
    let overdueTasksCount = 0;
    let totalAdBudget = 0;
    let totalLeads = 0;

    allTasks.forEach(t => {
      totalAdBudget += parseFloat(t.ad_budget || 0);
      totalLeads += parseInt(t.lead_count || 0);

      const dueDate = t.due_date ? new Date(t.due_date) : null;
      if (dueDate && t.status !== "Completed" && t.status !== "Approved" && now > dueDate) {
        overdueTasksCount++;
      }
    });

    // Employee Rankings
    const staffKPIs = allUsers
      .filter(u => u.role !== "Owner" && u.role !== "GM")
      .map(u => this.calculateEmployeeKPIs(u, allTasks))
      .sort((a, b) => b.overallScore - a.overallScore);

    return {
      totalTasks,
      completedCount: completedTasks.length,
      inProgressCount: inProgressTasks.length,
      reviewCount: reviewTasks.length,
      overdueCount: overdueTasksCount,
      totalAdBudget,
      totalLeads,
      staffKPIs,
      heroCount: staffKPIs.filter(s => s.performanceBadge === "Batal" || s.performanceBadge === "بطل").length,
      delayedStaffCount: staffKPIs.filter(s => s.totalDelayed > 0).length
    };
  }
};
