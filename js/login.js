const loginForm = document.getElementById("loginForm");
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const errorEl = document.getElementById("loginError");
  const submit = loginForm.querySelector('button[type="submit"]');
  errorEl.textContent = "";
  submit.disabled = true;
  submit.textContent = "Memproses...";
  try {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    localStorage.setItem(STORAGE_KEYS.session, data.user.id);
    location.href = "dashboard.html";
  } catch (error) {
    errorEl.textContent = error.message || "Login gagal. Periksa email dan password.";
  } finally {
    submit.disabled = false;
    submit.textContent = "Masuk";
  }
});
(async () => {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) location.href = "dashboard.html";
})();
