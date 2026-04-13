import { auth } from "@/statix/lib/auth";

async function seedAdmin() {
  const email = process.env.INITIAL_ADMIN_EMAIL;

  if (!email) {
    console.log("INITIAL_ADMIN_EMAIL tanımlı değil, atlanıyor.");
    return;
  }

  const headers = new Headers();
  const { users } = await auth.api.listUsers({ query: { searchValue: email, searchField: "email" }, headers });
  const user = users?.[0];

  if (!user) {
    console.log(`Kullanıcı bulunamadı: ${email}`);
    console.log("Önce OTP veya sosyal giriş ile hesap oluşturun.");
    return;
  }

  await auth.api.setRole({ body: { userId: user.id, role: "admin" }, headers });
  console.log(`✓ ${email} admin yapıldı.`);
}

seedAdmin().catch((err) => {
  console.error("Hata:", err);
  process.exit(1);
});
