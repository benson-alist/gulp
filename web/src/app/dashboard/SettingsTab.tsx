"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Avatar from "@/components/Avatar";

/**
 * Dashboard settings surface: profile (name, email, avatar), password change,
 * and irreversible account deletion with typed handle confirmation.
 */
export default function SettingsTab() {
  const router = useRouter();
  const { user, refresh, logout } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteErr, setDeleteErr] = useState("");

  const [signOutBusy, setSignOutBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.display_name);
    setEmail(user.email);
  }, [user]);

  if (!user) return null;

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileBusy(true);
    setProfileErr("");
    setProfileMsg("");
    try {
      await api.updateMe({
        display_name: displayName.trim(),
        email: email.trim().toLowerCase(),
      });
      await refresh();
      setProfileMsg("Profile saved.");
    } catch (err) {
      setProfileErr(
        err instanceof Error ? err.message : "Could not save profile.",
      );
    } finally {
      setProfileBusy(false);
    }
  }

  async function onAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setProfileBusy(true);
    setProfileErr("");
    setProfileMsg("");
    try {
      const { url } = await api.uploadImage(file);
      await api.updateMe({ avatar_url: url });
      await refresh();
      setProfileMsg("Photo updated.");
    } catch (err) {
      setProfileErr(
        err instanceof Error ? err.message : "Could not upload photo.",
      );
    } finally {
      setProfileBusy(false);
    }
  }

  async function onClearAvatar() {
    setProfileBusy(true);
    setProfileErr("");
    setProfileMsg("");
    try {
      await api.updateMe({ avatar_url: null });
      await refresh();
      setProfileMsg("Photo removed.");
    } catch (err) {
      setProfileErr(
        err instanceof Error ? err.message : "Could not remove photo.",
      );
    } finally {
      setProfileBusy(false);
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setPwErr("New passwords do not match.");
      return;
    }
    if (newPw.length < 8) {
      setPwErr("New password must be at least 8 characters.");
      return;
    }
    setPwBusy(true);
    setPwErr("");
    setPwMsg("");
    try {
      await api.changePassword({
        current_password: currentPw,
        new_password: newPw,
      });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setPwMsg("Password updated.");
    } catch (err) {
      setPwErr(
        err instanceof Error ? err.message : "Could not change password.",
      );
    } finally {
      setPwBusy(false);
    }
  }

  async function onDeleteAccount() {
    const u = user;
    if (!u || deleteConfirm !== u.username) return;
    setDeleteBusy(true);
    setDeleteErr("");
    try {
      await api.deleteMe({ confirm_username: deleteConfirm });
      await logout();
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await logout();
        router.replace("/login");
        return;
      }
      setDeleteErr(
        err instanceof Error ? err.message : "Could not delete account.",
      );
    } finally {
      setDeleteBusy(false);
    }
  }

  async function onSignOut() {
    setSignOutBusy(true);
    try {
      await logout();
      router.replace("/");
      router.refresh();
    } finally {
      setSignOutBusy(false);
    }
  }

  const inputCls =
    "w-full px-4 py-2.5 rounded-lg border border-[color:var(--border)] outline-none focus:border-[color:var(--foreground)] bg-[color:var(--background)] text-sm";

  return (
    <div className="grid gap-6 max-w-xl">
      <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
        <h2 className="font-bold text-lg">Profile</h2>
        <p className="text-sm text-[color:var(--muted)] mt-1">
          How you show up on listings, bids, and your public shelf.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <Avatar
            displayName={user.display_name}
            username={user.username}
            avatarUrl={user.avatar_url}
            sizePx={64}
          />
          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer text-xs mono uppercase tracking-wider px-3 py-1.5 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-ink)] transition">
              Upload photo
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={onAvatarPick}
                disabled={profileBusy}
              />
            </label>
            {user.avatar_url && (
              <button
                type="button"
                onClick={onClearAvatar}
                disabled={profileBusy}
                className="text-xs mono uppercase tracking-wider px-3 py-1.5 rounded-full border border-[color:var(--border)] hover:bg-[color:var(--background)] transition disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
        </div>
        <form onSubmit={onSaveProfile} className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className="mono text-[10px] uppercase text-[color:var(--muted)]">
              Display name
            </span>
            <input
              className={inputCls}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={128}
              required
            />
          </label>
          <label className="grid gap-1">
            <span className="mono text-[10px] uppercase text-[color:var(--muted)]">
              Email
            </span>
            <input
              type="email"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          {profileErr && (
            <div role="alert" className="text-sm text-[color:var(--danger)] mono">
              {profileErr}
            </div>
          )}
          {profileMsg && (
            <div className="text-sm text-[color:var(--success)] mono">{profileMsg}</div>
          )}
          <button
            type="submit"
            disabled={profileBusy}
            className="min-h-[44px] rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] font-semibold hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-ink)] transition disabled:opacity-50"
          >
            {profileBusy ? "Saving…" : "Save profile"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
        <h2 className="font-bold text-lg">Password</h2>
        <p className="text-sm text-[color:var(--muted)] mt-1">
          You will stay signed in after a successful change.
        </p>
        <form onSubmit={onChangePassword} className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className="mono text-[10px] uppercase text-[color:var(--muted)]">
              Current password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              className={inputCls}
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
            />
          </label>
          <label className="grid gap-1">
            <span className="mono text-[10px] uppercase text-[color:var(--muted)]">
              New password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              className={inputCls}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              minLength={8}
              required
            />
          </label>
          <label className="grid gap-1">
            <span className="mono text-[10px] uppercase text-[color:var(--muted)]">
              Confirm new password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              className={inputCls}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              minLength={8}
              required
            />
          </label>
          {pwErr && (
            <div role="alert" className="text-sm text-[color:var(--danger)] mono">
              {pwErr}
            </div>
          )}
          {pwMsg && (
            <div className="text-sm text-[color:var(--success)] mono">{pwMsg}</div>
          )}
          <button
            type="submit"
            disabled={pwBusy}
            className="min-h-[44px] rounded-full border border-[color:var(--foreground)] font-semibold hover:bg-[color:var(--foreground)] hover:text-[color:var(--background)] transition disabled:opacity-50"
          >
            {pwBusy ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
        <h2 className="font-bold text-lg">Session</h2>
        <p className="text-sm text-[color:var(--muted)] mt-1">
          Signed in as{" "}
          <span className="font-semibold text-[color:var(--foreground)]">
            @{user.username}
          </span>
          . Signing out clears the cookie on this device only.
        </p>
        <button
          type="button"
          onClick={onSignOut}
          disabled={signOutBusy}
          className="mt-4 min-h-[44px] px-4 rounded-full border border-[color:var(--foreground)] font-semibold hover:bg-[color:var(--foreground)] hover:text-[color:var(--background)] transition disabled:opacity-50"
        >
          {signOutBusy ? "Signing out…" : "Sign out"}
        </button>
      </section>

      <section className="rounded-2xl border border-dashed border-[color:var(--danger)]/50 bg-[color:var(--card)]/80 p-5">
        <h2 className="font-bold text-lg text-[color:var(--danger)]">Danger zone</h2>
        <p className="text-sm text-[color:var(--muted)] mt-1">
          Deletes your account, your listings, and every bid you have placed.
          This cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => {
            setDeleteOpen(true);
            setDeleteConfirm("");
            setDeleteErr("");
          }}
          className="mt-4 min-h-[44px] px-4 rounded-full bg-[color:var(--danger)] text-[color:var(--background)] font-semibold hover:opacity-90 transition"
        >
          Delete account…
        </button>
      </section>

      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)] p-5 shadow-lg">
            <h3 id="delete-title" className="font-black text-lg">
              Delete your account?
            </h3>
            <p className="text-sm text-[color:var(--muted)] mt-2">
              Type your handle{" "}
              <span className="font-mono font-semibold">@{user.username}</span>{" "}
              to confirm.
            </p>
            <input
              className={`${inputCls} mt-3`}
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={user.username}
              autoComplete="off"
            />
            {deleteErr && (
              <div role="alert" className="mt-2 text-sm text-[color:var(--danger)] mono">
                {deleteErr}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="min-h-[44px] px-4 rounded-full border border-[color:var(--border)] font-semibold hover:bg-[color:var(--card)] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteBusy || deleteConfirm !== user.username}
                onClick={onDeleteAccount}
                className="min-h-[44px] px-4 rounded-full bg-[color:var(--danger)] text-[color:var(--background)] font-semibold disabled:opacity-40 transition"
              >
                {deleteBusy ? "Deleting…" : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
