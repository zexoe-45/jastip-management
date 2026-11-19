// Menampilkan menu Atur Role hanya untuk admin dan super admin.
(async function initRoleNavigation() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.user) return;
    const { data: profile, error } = await supabaseClient
      .from("profiles").select("role").eq("id", session.user.id).maybeSingle();
    if (error) throw error;
    if (!profile || !["admin", "super_admin"].includes(profile.role)) return;

    const insertMenu = () => {
      const sidebar = document.querySelector("#sidebar");
      if (!sidebar || sidebar.querySelector('[data-role-menu="true"]')) return false;
      const systemTitle = [...sidebar.querySelectorAll(".nav-title")].find(el => el.textContent.trim() === "Sistem");
      if (!systemTitle) return false;
      const link = document.createElement("a");
      link.className = "nav-link" + (location.pathname.endsWith("/roles.html") || location.pathname.endsWith("roles.html") ? " active" : "");
      link.href = "roles.html";
      link.dataset.roleMenu = "true";
      link.innerHTML = '♙ <span>Atur Role</span>';
      link.addEventListener("click", () => window.closeSidebar?.());
      sidebar.insertBefore(link, systemTitle);
      return true;
    };

    if (insertMenu()) return;
    const root = document.getElementById("app");
    if (!root) return;
    const observer = new MutationObserver(() => {
      if (insertMenu()) observer.disconnect();
    });
    observer.observe(root, { childList: true, subtree: true });
  } catch (error) {
    console.error("Menu Atur Role tidak dapat dimuat:", error);
  }
})();