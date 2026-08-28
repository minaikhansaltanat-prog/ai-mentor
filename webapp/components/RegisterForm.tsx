"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { t, type Lang } from "@/lib/i18n";
import LangToggle from "@/components/LangToggle";

type Role = "STUDENT" | "PARENT" | "TEACHER" | "SCHOOL_ADMIN";

export default function RegisterForm({ lang }: { lang: Lang }) {
  const tt = t(lang);
  const router = useRouter();

  const [role, setRole] = useState<Role>("STUDENT");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState("7");
  const [classCode, setClassCode] = useState("");
  const [childPhone, setChildPhone] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload: Record<string, unknown> = { role, name, phone, password };
    if (role === "STUDENT") {
      payload.grade = Number(grade);
      if (classCode) payload.classCode = classCode;
    }
    if (role === "PARENT" && childPhone) payload.childPhone = childPhone;
    if (role === "TEACHER") payload.schoolCode = schoolCode;
    if (role === "SCHOOL_ADMIN") payload.schoolName = schoolName;

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.error === "phone_taken") setError(tt.auth.error.phoneTaken);
      else if (data.error === "code_invalid") setError(tt.auth.error.codeInvalid);
      else setError(tt.auth.error.required);
      return;
    }

    const data = await res.json();
    if (data.schoolCode) {
      setCreatedCode(data.schoolCode);
      setTimeout(() => router.push(data.redirect), 2200);
    } else {
      router.push(data.redirect);
      router.refresh();
    }
  }

  const roleOptions: Role[] = ["STUDENT", "PARENT", "TEACHER", "SCHOOL_ADMIN"];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-gold-200/50 blur-3xl" />
        <div className="absolute bottom-0 -right-24 w-[420px] h-[420px] rounded-full bg-leaf-100/60 blur-3xl" />
      </div>

      <div className="absolute top-5 right-5">
        <LangToggle lang={lang} label={tt.common.langToggle} />
      </div>

      <Link href="/" className="flex items-center gap-2.5 mb-6">
        <span className="w-10 h-10 rounded-2xl bg-gold-500 flex items-center justify-center font-display font-bold text-ink-900">A</span>
        <span className="font-display font-bold text-xl text-ink-900">{tt.appName}</span>
      </Link>

      {createdCode ? (
        <div className="card w-full max-w-sm p-8 text-center">
          <p className="text-ink-600 mb-2">{tt.auth.schoolCreated}:</p>
          <p className="font-display font-bold text-3xl text-gold-600 tracking-widest">{createdCode}</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="card w-full max-w-sm p-7 md:p-8">
          <h1 className="font-display font-bold text-2xl text-ink-900 mb-5">{tt.auth.registerTitle}</h1>

          <p className="text-sm font-semibold text-ink-700 mb-2">{tt.auth.role}</p>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {roleOptions.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`h-11 rounded-xl text-sm font-semibold border transition-colors ${
                  role === r ? "bg-gold-500 border-gold-500 text-ink-900" : "border-ink-200 text-ink-600 hover:border-gold-300"
                }`}
              >
                {tt.roles[r]}
              </button>
            ))}
          </div>

          <label className="block text-sm font-semibold text-ink-700 mb-1.5">{tt.auth.name}</label>
          <input
            className="w-full h-12 rounded-xl border border-ink-200 px-4 mb-4 focus:border-gold-500 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label className="block text-sm font-semibold text-ink-700 mb-1.5">{tt.auth.phone}</label>
          <input
            className="w-full h-12 rounded-xl border border-ink-200 px-4 mb-4 focus:border-gold-500 outline-none"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 777 000 0000"
            required
          />

          <label className="block text-sm font-semibold text-ink-700 mb-1.5">{tt.auth.password}</label>
          <input
            type="password"
            className="w-full h-12 rounded-xl border border-ink-200 px-4 mb-4 focus:border-gold-500 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {role === "STUDENT" && (
            <>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">{tt.auth.grade}</label>
              <select
                className="w-full h-12 rounded-xl border border-ink-200 px-4 mb-4 focus:border-gold-500 outline-none"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              >
                {[5, 6, 7, 8, 9, 10, 11].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">{tt.auth.classCode}</label>
              <input
                className="w-full h-12 rounded-xl border border-ink-200 px-4 mb-4 focus:border-gold-500 outline-none uppercase"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
              />
            </>
          )}

          {role === "PARENT" && (
            <>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">{tt.auth.childPhone}</label>
              <input
                className="w-full h-12 rounded-xl border border-ink-200 px-4 mb-4 focus:border-gold-500 outline-none"
                value={childPhone}
                onChange={(e) => setChildPhone(e.target.value)}
              />
            </>
          )}

          {role === "TEACHER" && (
            <>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">{tt.auth.schoolCode}</label>
              <input
                className="w-full h-12 rounded-xl border border-ink-200 px-4 mb-4 focus:border-gold-500 outline-none uppercase"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
                required
              />
            </>
          )}

          {role === "SCHOOL_ADMIN" && (
            <>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">{tt.auth.schoolName}</label>
              <input
                className="w-full h-12 rounded-xl border border-ink-200 px-4 mb-4 focus:border-gold-500 outline-none"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                required
              />
            </>
          )}

          {error && <p className="text-sm text-red-500 mt-1 mb-2">{error}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary w-full h-12 mt-3 disabled:opacity-60">
            {loading ? tt.common.loading : tt.auth.registerBtn}
          </button>

          <p className="text-sm text-ink-500 mt-5 text-center">
            {tt.auth.haveAccount}{" "}
            <Link href="/login" className="text-gold-600 font-semibold hover:underline">
              {tt.auth.goLogin}
            </Link>
          </p>
        </form>
      )}
    </main>
  );
}
