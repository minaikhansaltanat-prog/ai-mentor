import { getLang } from "@/lib/lang-server";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const lang = await getLang();
  return <LoginForm lang={lang} />;
}
