"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";
import type { Role } from "@prisma/client";
import AvatarCropper from "@/components/AvatarCropper";
import PasswordInput from "@/components/PasswordInput";

type Subject = { code: string; nameKk: string; nameRu: string };
type UserData = {
  id: string;
  name: string;
  lastName: string | null;
  firstName: string | null;
  patronymic: string | null;
  birthDate: string | null;
  email: string | null;
  hasAvatar: boolean;
  favoriteSubjects: string[];
  teacherSubject: string | null;
  teacherCategory: string | null;
  notifyPush: boolean;
  notifyEmail: boolean;
};

export default function AccountForm({
  lang,
  role,
  subjects,
  user,
}: {
  lang: Lang;
  role: Role;
  subjects: Subject[];
  user: UserData;
}) {
  const tt = t(lang);
  const router = useRouter();

  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [patronymic, setPatronymic] = useState(user.patronymic ?? "");
  const [birthDate, setBirthDate] = useState(user.birthDate ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [favoriteSubjects, setFavoriteSubjects] = useState<string[]>(user.favoriteSubjects);
  const [teacherSubject, setTeacherSubject] = useState(user.teacherSubject ?? "");
  const [teacherCategory, setTeacherCategory] = useState(user.teacherCategory ?? "");
  const [notifyPush, setNotifyPush] = useState(user.notifyPush);
  const [notifyEmail, setNotifyEmail] = useState(user.notifyEmail);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function toggleSubject(code: string) {
    setFavoriteSubjects((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lastName,
        firstName,
        patronymic,
        birthDate: birthDate || undefined,
        email: email || undefined,
        favoriteSubjects: role === "STUDENT" ? favoriteSubjects : undefined,
        teacherSubject: role === "TEACHER" ? teacherSubject : undefined,
        teacherCategory: role === "TEACHER" ? teacherCategory : undefined,
        notifyPush,
        notifyEmail,
      }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);
    if (newPassword !== confirmPassword) {
      setPwError(tt.account.passwordMismatch);
      return;
    }
    setPwSaving(true);
    const res = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setPwSaving(false);
    if (!res.ok) {
      setPwError(tt.account.passwordWrong);
      return;
    }
    setPwSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function exportData() {
    const res = await fetch("/api/profile/export");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-ustaz-data.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError(null);
    const res = await fetch("/api/profile/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePassword }),
    });
    setDeleting(false);
    if (!res.ok) {
      setDeleteError(tt.account.passwordWrong);
      return;
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <h1 className="font-display font-bold text-2xl text-ink-900">{tt.account.title}</h1>

      {/* avatar */}
      <div className="card p-6 mt-6">
        <AvatarCropper
          currentAvatarUrl={user.hasAvatar ? `/api/files/avatar/${user.id}` : null}
          fallbackLetter={user.name.trim().charAt(0).toUpperCase() || "?"}
          labels={{
            change: tt.account.avatarChange,
            remove: tt.account.avatarRemove,
            save: tt.account.avatarSave,
            cancel: tt.account.avatarCancel,
            zoom: tt.account.avatarZoom,
            uploading: tt.account.avatarUploading,
            errorType: tt.account.avatarErrorType,
            errorSize: tt.account.avatarErrorSize,
          }}
          onSaved={() => router.refresh()}
        />
      </div>

      {/* profile form */}
      <form onSubmit={saveProfile} className="card p-6 mt-5 space-y-4">
        <h2 className="font-display font-bold text-lg text-ink-900">{tt.account.personalInfo}</h2>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1">{tt.account.lastName}</label>
            <input className="w-full h-11 rounded-xl border border-ink-200 px-3 focus:border-gold-500 outline-none" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1">{tt.account.firstName}</label>
            <input className="w-full h-11 rounded-xl border border-ink-200 px-3 focus:border-gold-500 outline-none" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1">{tt.account.patronymic}</label>
            <input className="w-full h-11 rounded-xl border border-ink-200 px-3 focus:border-gold-500 outline-none" value={patronymic} onChange={(e) => setPatronymic(e.target.value)} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1">{tt.account.birthDate}</label>
            <input type="date" className="w-full h-11 rounded-xl border border-ink-200 px-3 focus:border-gold-500 outline-none" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1">{tt.account.emailOptional}</label>
            <input type="email" className="w-full h-11 rounded-xl border border-ink-200 px-3 focus:border-gold-500 outline-none" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        {role === "STUDENT" && (
          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-2">{tt.account.favoriteSubjects}</label>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <button
                  type="button"
                  key={s.code}
                  onClick={() => toggleSubject(s.code)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                    favoriteSubjects.includes(s.code) ? "bg-gold-500 border-gold-500 text-ink-900" : "border-ink-200 text-ink-600"
                  }`}
                >
                  {lang === "ru" ? s.nameRu : s.nameKk}
                </button>
              ))}
            </div>
          </div>
        )}

        {role === "TEACHER" && (
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-600 mb-1">{tt.account.teacherSubject}</label>
              <input className="w-full h-11 rounded-xl border border-ink-200 px-3 focus:border-gold-500 outline-none" value={teacherSubject} onChange={(e) => setTeacherSubject(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-600 mb-1">{tt.account.teacherCategory}</label>
              <input className="w-full h-11 rounded-xl border border-ink-200 px-3 focus:border-gold-500 outline-none" value={teacherCategory} onChange={(e) => setTeacherCategory(e.target.value)} />
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-ink-600 mb-2">{tt.account.notificationSettings}</p>
          <label className="flex items-center gap-2 text-sm text-ink-700 mb-1.5">
            <input type="checkbox" checked={notifyPush} onChange={(e) => setNotifyPush(e.target.checked)} className="w-4 h-4 accent-gold-500" />
            {tt.account.notifyPush}
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} className="w-4 h-4 accent-gold-500" />
            {tt.account.notifyEmail}
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn btn-primary h-11 px-6 text-sm disabled:opacity-60">
            {saving ? tt.common.loading : tt.common.save}
          </button>
          {saved && <span className="text-sm text-leaf-600">{tt.account.saved}</span>}
        </div>
      </form>

      {/* password */}
      <form onSubmit={changePassword} className="card p-6 mt-5 space-y-3">
        <h2 className="font-display font-bold text-lg text-ink-900">{tt.account.changePassword}</h2>
        <div>
          <label className="block text-xs font-semibold text-ink-600 mb-1">{tt.account.currentPassword}</label>
          <PasswordInput value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" required />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1">{tt.account.newPassword}</label>
            <PasswordInput value={newPassword} onChange={setNewPassword} autoComplete="new-password" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1">{tt.account.confirmPassword}</label>
            <PasswordInput value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" required />
          </div>
        </div>
        {pwError && <p className="text-sm text-red-500">{pwError}</p>}
        {pwSuccess && <p className="text-sm text-leaf-600">{tt.account.passwordChanged}</p>}
        <button type="submit" disabled={pwSaving} className="btn btn-ghost h-11 px-6 text-sm disabled:opacity-60">
          {pwSaving ? tt.common.loading : tt.account.changePassword}
        </button>
      </form>

      {/* danger zone */}
      <div className="card p-6 mt-5 space-y-5">
        <h2 className="font-display font-bold text-lg text-ink-900">{tt.account.dangerZone}</h2>

        <div>
          <p className="text-sm text-ink-600">{tt.account.exportDataDesc}</p>
          <button onClick={exportData} className="btn btn-ghost h-10 px-5 text-sm mt-2">
            {tt.account.exportData}
          </button>
        </div>

        <div className="pt-4 border-t border-ink-100">
          <p className="text-sm text-ink-600">{tt.account.deleteAccountDesc}</p>
          <button onClick={() => setDeleteOpen(true)} className="h-10 px-5 rounded-full border border-red-300 text-red-500 text-sm font-semibold mt-2 hover:bg-red-50 transition-colors">
            {tt.account.deleteAccount}
          </button>
        </div>
      </div>

      {deleteOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full">
            <h3 className="font-display font-bold text-lg text-ink-900">{tt.account.deleteConfirmTitle}</h3>
            <p className="text-sm text-ink-500 mt-1 mb-4">{tt.account.deleteConfirmText}</p>
            <PasswordInput value={deletePassword} onChange={setDeletePassword} autoComplete="current-password" />
            {deleteError && <p className="text-sm text-red-500 mt-2">{deleteError}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteOpen(false)} className="btn btn-ghost h-11 flex-1 text-sm">
                {tt.common.cancel}
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting || !deletePassword}
                className="h-11 flex-1 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deleting ? tt.common.loading : tt.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
