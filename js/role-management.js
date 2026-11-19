// Halaman pengelolaan role menggunakan RPC yang dilindungi di database.
(function initRoleManagement() {
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));

  async function loadRolePage() {
    const content = document.querySelector("#app .content");
    if (!content) return false;
    document.querySelector(".topbar h2")?.replaceChildren(document.createTextNode("Atur Role"));
    content.innerHTML = `
      <div class="page-head">
        <div><h1>Atur Role Pengguna</h1><p>Kelola hak akses akun yang terdaftar pada Jastip Zhar.</p></div>
        <button class="btn btn-secondary" type="button" onclick="loadRoleProfiles()">↻ Muat Ulang</button>
      </div>
      <div class="card">
        <div class="card-head"><h3>Daftar Pengguna</h3><span class="muted" id="roleCount">Memuat data...</span></div>
        <div id="roleNotice" class="muted" style="padding:16px">Mengambil data pengguna...</div>
        <div class="table-wrap" id="roleTableWrap" style="display:none">
          <table><thead><tr><th>Nama</th><th>Email</th><th>Role Saat Ini</th><th>Ubah Role</th><th>Tanggal Daftar</th></tr></thead>
          <tbody id="roleTableBody"></tbody></table>
        </div>
      </div>
      <p class="muted" style="margin-top:12px;font-size:12px">Catatan: perubahan role dibatasi oleh izin database. Admin tidak dapat mengubah akun Super Admin.</p>`;
    await loadRoleProfiles();
    return true;
  }

  window.loadRoleProfiles = async function() {
    const notice = document.getElementById("roleNotice");
    const tableWrap = document.getElementById("roleTableWrap");
    const body = document.getElementById("roleTableBody");
    if (!notice || !body) return;
    notice.style.display = "block";
    notice.textContent = "Mengambil data pengguna...";
    tableWrap.style.display = "none";
    const { data, error } = await supabaseClient.rpc("list_role_profiles");
    if (error) {
      notice.textContent = error.message || "Tidak dapat memuat daftar pengguna.";
      return;
    }
    const { data: { user } } = await supabaseClient.auth.getUser();
    const { data: ownProfile } = await supabaseClient.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const isSuperAdmin = ownProfile?.role === "super_admin";
    document.getElementById("roleCount").textContent = data.length + " akun";
    if (!data.length) {
      notice.textContent = "Belum ada akun terdaftar.";
      return;
    }
    body.innerHTML = data.map(profile => {
      const isSelf = profile.id === user.id;
      const roleOptions = ["user", "admin", ...(isSuperAdmin ? ["super_admin"] : [])];
      const options = roleOptions.map(role => `<option value="${role}" ${profile.role === role ? "selected" : ""}>${role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : "User"}</option>`).join("");
      const date = profile.created_at ? new Date(profile.created_at).toLocaleDateString("id-ID", {day:"2-digit",month:"short",year:"numeric"}) : "-";
      return `<tr>
        <td><b>${escapeHtml(profile.full_name || "Tanpa nama")}</b>${isSelf ? '<div class="muted" style="font-size:11px">Akun Anda</div>' : ""}</td>
        <td>${escapeHtml(profile.email || "-")}</td>
        <td>${escapeHtml(profile.role)}</td>
        <td><select aria-label="Ubah role untuk ${escapeHtml(profile.email || profile.id)}" onchange="changeProfileRole('${profile.id}', this.value, this)" ${isSelf ? "disabled" : ""}>${options}</select></td>
        <td>${date}</td>
      </tr>`;
    }).join("");
    notice.style.display = "none";
    tableWrap.style.display = "block";
  };

  window.changeProfileRole = async function(userId, newRole, select) {
    if (!confirm("Yakin ingin mengubah role akun ini menjadi " + newRole + "?")) {
      await loadRoleProfiles();
      return;
    }
    select.disabled = true;
    const { error } = await supabaseClient.rpc("set_profile_role", {
      target_user_id: userId,
      new_role: newRole
    });
    if (error) {
      alert(error.message || "Role gagal diperbarui.");
    } else {
      alert("Role pengguna berhasil diperbarui.");
    }
    await loadRoleProfiles();
  };

  const root = document.getElementById("app");
  if (!root) return;
  const observer = new MutationObserver(async () => {
    if (document.querySelector("#app .content")) {
      observer.disconnect();
      await loadRolePage();
    }
  });
  observer.observe(root, { childList: true, subtree: true });
  if (document.querySelector("#app .content")) {
    observer.disconnect();
    loadRolePage();
  }
})();