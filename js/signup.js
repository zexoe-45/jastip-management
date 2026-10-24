const signupForm = document.getElementById("signupForm");
signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const errorEl = document.getElementById("signupError");
  const submit = signupForm.querySelector('button[type="submit"]');
  errorEl.textContent = "";
  const fullname = document.getElementById("fullname").value.trim();
  const email = document.getElementById("email").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  if (password.length < 6) {
    errorEl.textContent = "Password minimal 6 karakter.";
    return;
  }
  submit.disabled = true;
  submit.textContent = "Membuat akun...";
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullname, username } }
    });
    if (error) throw error;
    if (data.session) {
      localStorage.setItem(STORAGE_KEYS.session, data.user.id);
      location.href = "dashboard.html";
      return;
    }
    errorEl.textContent = "Pendaftaran berhasil. Periksa email untuk verifikasi, lalu masuk.";
  } catch (error) {
    errorEl.textContent = error.message || "Pendaftaran gagal.";
  } finally {
    submit.disabled = false;
    submit.textContent = "Daftar Sekarang";
  }
});
(async () => {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) location.href = "dashboard.html";
})();
