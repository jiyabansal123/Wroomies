import Link from "next/link";
import { signIn } from "next-auth/react";

import { MatchUser, formatCourse } from "./home-data";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--text-on-brand)] shadow-[0_12px_30px_rgba(240,96,79,0.24)] transition hover:-translate-y-0.5 hover:bg-[var(--brand-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--panel-muted)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]/40 hover:bg-[var(--panel)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 disabled:cursor-not-allowed disabled:opacity-60";

export const fieldClass =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-muted)] hover:border-[var(--border-strong)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20";

export function SectionShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--card-shadow)] backdrop-blur md:p-6">
      <div className="mb-5 space-y-2">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{hint}</p>
    </div>
  );
}

export function ProgressPill({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-full border border-[var(--border)] bg-[var(--panel-muted)] px-3 py-2">
      <span className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
        {label}
      </span>
      <span className="ml-2 text-sm font-semibold text-[var(--foreground)]">
        {value}%
      </span>
    </div>
  );
}

export function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-[var(--brand)] text-[var(--text-on-brand)] shadow-[0_10px_30px_rgba(240,96,79,0.24)]"
          : "bg-[var(--panel-muted)] text-[var(--text-secondary)] hover:bg-[var(--panel)] hover:text-[var(--foreground)]"
      }`}
    >
      {label}
    </button>
  );
}

export function MatchCard({
  match,
  featured = false,
  onClick,
}: {
  match: MatchUser;
  featured?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`group block cursor-pointer rounded-xl border p-4 transition hover:-translate-y-1 ${
        featured
          ? "border-[var(--brand)]/30 bg-[linear-gradient(180deg,rgba(240,96,79,0.12),rgba(19,22,31,0.92))] shadow-[0_20px_60px_rgba(240,96,79,0.18)]"
          : "border-[var(--border)] bg-[var(--panel-muted)] shadow-[var(--card-shadow)] hover:border-[var(--border-strong)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            {featured ? "Best Match" : "Recommended"}
          </p>
          <h3 className="mt-1.5 text-lg font-semibold tracking-[-0.03em] text-[var(--foreground)]">
            {match.name ?? "Unknown student"}
          </h3>
          <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{match.email}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--brand-soft)]">
            {match.totalScore}% Fit
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-2.5">
          <p className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Year/Course</p>
          <p className="mt-0.5 text-base font-bold text-[var(--foreground)]">{match.primaryScore}%</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-2.5">
          <p className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Lifestyle</p>
          <p className="mt-0.5 text-base font-bold text-[var(--foreground)]">{match.preferenceScore}%</p>
        </div>
      </div>

      <div className="mt-4 text-[11px] font-semibold text-[var(--foreground)] transition group-hover:text-[var(--brand-soft)]">
        View full comparison →
      </div>
    </div>
  );
}

import { QUESTIONS } from "./home-data";

export function MatchDetailModal({
  match,
  onClose,
}: {
  match: MatchUser;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative h-full max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-2xl sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel-muted)] text-[var(--foreground)] hover:bg-[var(--panel)]"
        >
          ✕
        </button>

        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Match Profile</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">{match.name || "Student Profile"}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="rounded-full border border-[var(--border)] bg-[var(--panel-muted)] px-2.5 py-0.5 text-xs">{match.email}</div>
            <div className="rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/10 px-2.5 py-0.5 text-xs font-bold text-[var(--brand-soft)]">
              {match.totalScore}% Overall Match
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard label="Year" value={`Year ${match.year || "?"}`} hint="Academic Progress" />
          <StatCard label="Course" value={formatCourse(match.course)} hint="Area of Study" />
          <StatCard label="Room" value={match.room_number || "None"} hint="Current Assignment" />
          <StatCard label="Switching" value={match.is_open_to_switch ? "Ready" : "No"} hint="Flexible on Room" />
        </div>

        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold tracking-[-0.03em]">Questionnaire Answers</h3>
          <div className="grid gap-2">
            {QUESTIONS.map((q) => {
              const answerValue = match.preferences?.[q.id];
              const option = q.options.find((o) => o.value === answerValue);
              return (
                <div key={q.id} className="rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{q.question}</p>
                  <p className="mt-1.5 text-sm font-medium text-[var(--foreground)]">{option?.label || "Not answered"}</p>
                </div>
              );
            })}
          </div>
        </div>

        <button className={`mt-8 w-full ${primaryButtonClass}`} onClick={onClose}>
          Close Details
        </button>
      </div>
    </div>
  );
}

function MiniMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 font-medium text-[var(--foreground)]">{value}</p>
    </div>
  );
}

export function LoadingView({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 text-[var(--foreground)]">
      <div className="w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-8 text-center shadow-[var(--card-shadow)]">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full border border-[var(--border-strong)] bg-[var(--panel-muted)]" />
        <p className="text-lg font-medium">{message}</p>
      </div>
    </main>
  );
}

export function AuthView() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-0 opacity-90" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,rgba(240,96,79,0.28),transparent_58%)]" />
        <div className="absolute left-[-120px] top-32 h-72 w-72 rounded-full bg-[rgba(250,177,72,0.16)] blur-[120px]" />
        <div className="absolute bottom-[-140px] right-[-100px] h-80 w-80 rounded-full bg-[rgba(124,156,255,0.18)] blur-[140px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full text-center">
          <section className="rounded-[48px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(19,22,31,0.88))] p-10 shadow-[var(--card-shadow)] backdrop-blur md:p-16">
            <h1 className="text-6xl font-semibold tracking-[-0.08em] text-[var(--foreground)] md:text-8xl">
              wroomies
            </h1>
            <p className="mt-4 text-xl tracking-tight text-[var(--text-secondary)] md:text-2xl">
              find your ride or die
            </p>

            <div className="mt-12 flex flex-col items-center gap-6">
              <button 
                className={`${primaryButtonClass} scale-110 px-10 py-4 shadow-[0_20px_60px_rgba(240,96,79,0.35)]`} 
                onClick={() => signIn("azure-ad")}
              >
                Continue with Bennett email
              </button>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Only Bennett accounts can join
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
