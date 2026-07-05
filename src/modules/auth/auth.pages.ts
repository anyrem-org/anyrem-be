const layout = (title: string, body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} · Remember Anything</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #f7f8fc; color: #0f172a; margin: 0; min-height: 100vh; display: grid; place-items: center; }
    main { max-width: 28rem; background: #fff; border-radius: 1rem; padding: 2rem; box-shadow: 0 10px 40px rgba(15,23,42,.08); text-align: center; }
    h1 { font-size: 1.35rem; margin: 0 0 .75rem; }
    p { margin: 0; color: #64748b; line-height: 1.6; }
    .ok { color: #059669; font-weight: 600; }
    .err { color: #dc2626; font-weight: 600; }
    label { display: block; text-align: left; font-size: .875rem; margin: 1.25rem 0 .35rem; }
    input { width: 100%; box-sizing: border-box; padding: .65rem .75rem; border: 1px solid #e2e8f0; border-radius: .75rem; font-size: 1rem; }
    button { margin-top: 1rem; width: 100%; padding: .7rem 1rem; border: 0; border-radius: .75rem; background: #4f46e5; color: #fff; font-size: .95rem; font-weight: 600; cursor: pointer; }
    button:disabled { opacity: .6; cursor: not-allowed; }
    #msg { margin-top: 1rem; font-size: .875rem; min-height: 1.25rem; }
  </style>
</head>
<body><main>${body}</main></body>
</html>`;

export const verifySuccessPage = () =>
  layout(
    "Email verified",
    `<h1 class="ok">Email verified</h1><p>Your account is active. You can close this tab and sign in to Remember Anything.</p>`,
  );

export const verifyErrorPage = (message: string) =>
  layout(
    "Verification failed",
    `<h1 class="err">Verification failed</h1><p>${escapeHtml(message)}</p>`,
  );

export const resetPasswordPage = (token: string, apiBase: string) =>
  layout(
    "Reset password",
    `<h1>Reset your password</h1>
<p>Choose a new password for your Remember Anything account.</p>
<form id="form">
  <label for="password">New password</label>
  <input id="password" type="password" minlength="10" required autocomplete="new-password" />
  <button type="submit">Update password</button>
  <p id="msg"></p>
</form>
<script>
  const form = document.getElementById("form");
  const msg = document.getElementById("msg");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = document.getElementById("password").value;
    const button = form.querySelector("button");
    button.disabled = true;
    msg.textContent = "Saving…";
    try {
      const res = await fetch(${JSON.stringify(`${apiBase}/auth/reset-password`)}, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: ${JSON.stringify(token)}, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const text = Array.isArray(data.message) ? data.message.join(", ") : (data.message || "Could not reset password.");
        throw new Error(text);
      }
      msg.className = "ok";
      msg.textContent = "Password updated. You can sign in now.";
      form.querySelector("button").remove();
      document.getElementById("password").disabled = true;
    } catch (error) {
      msg.className = "err";
      msg.textContent = error.message || "Could not reset password.";
      button.disabled = false;
    }
  });
</script>`,
  );

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
