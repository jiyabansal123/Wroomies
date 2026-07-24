import Link from "next/link";
import { signIn } from "next-auth/react";

import { MatchUser, formatCourse, UserProfile } from "./home-data";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--text-on-brand)] transition hover:-translate-y-0.5 hover:bg-[var(--brand-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

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
    <section className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 backdrop-blur md:p-6">
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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] p-3">
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
          ? "bg-[var(--brand)] text-[var(--text-on-brand)]"
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
  currentUser,
  onClick,
  onSendRequest,
  onAcceptRequest,
  onRejectRequest,
  onMessage,
  onAnalyzeLifestyle,
  aiScore,
  aiMatchLevel,
  aiSummary,
  aiStrengths,
  aiConflicts,
  isAnalyzing = false,
  isAcademicMatch = true,
}: {
  match: MatchUser;
  featured?: boolean;
  currentUser?: UserProfile | null;
  onClick?: () => void;
  onSendRequest?: (email: string) => void;
  onAcceptRequest?: (id: string) => void;
  onRejectRequest?: (id: string) => void;
  onMessage?: (match: MatchUser) => void;
  onAnalyzeLifestyle?: (email: string) => void;
  aiScore?: number;
  aiMatchLevel?: string;
  aiSummary?: string;
  aiStrengths?: string[];
  aiConflicts?: string[];
  isAnalyzing?: boolean;
  isAcademicMatch?: boolean;
}) {
  const renderActions = () => {
    if (match.matchStatus === "accepted") {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMessage?.(match);
          }}
          className={`w-full mt-4 ${primaryButtonClass}`}
        >
          Message
        </button>
      );
    }

    if (match.matchStatus === "pending_sent") {
      return (
        <div className="mt-4 w-full rounded-full border border-[var(--border)] bg-[var(--panel-muted)] px-4 py-2 text-center text-sm font-medium text-[var(--text-muted)]">
          Pending Response
        </div>
      );
    }

    if (match.matchStatus === "pending_received") {
      return (
        <div className="mt-4 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              match.requestId && onAcceptRequest?.(match.requestId);
            }}
            className={`flex-1 ${primaryButtonClass}`}
          >
            Accept
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              match.requestId && onRejectRequest?.(match.requestId);
            }}
            className={`flex-1 ${secondaryButtonClass}`}
          >
            Reject
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSendRequest?.(match.email);
        }}
        className={`w-full mt-4 ${secondaryButtonClass} hover:border-[var(--brand)] hover:text-[var(--brand)]`}
      >
        Request Match
      </button>
    );
  };

  const hasSameYear = currentUser && match.year && String(currentUser.year) === String(match.year);
  const hasSameCourse = currentUser && match.course && currentUser.course?.toString().toLowerCase().trim() === match.course?.toString().toLowerCase().trim();
  const hasSameGender = currentUser && match.gender && currentUser.gender?.toString().toLowerCase().trim() === match.gender?.toString().toLowerCase().trim();

  return (
    <div
      onClick={onClick}
      className={`group block cursor-pointer rounded-xl border p-4 transition hover:-translate-y-1 ${
        featured
          ? "border-[var(--brand)]/30 bg-[var(--panel-muted)]"
          : "border-[var(--border)] bg-[var(--panel-muted)] hover:border-[var(--border-strong)]"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Recommended Student
          </p>
          <h3 className="mt-1.5 text-lg font-semibold tracking-[-0.03em] text-[var(--foreground)]">
            {match.name ?? "Unknown student"}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isAcademicMatch && (
            <div className="rounded-full border border-[var(--brand)]/20 bg-[var(--brand)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--brand)]">
              Academic Match
            </div>
          )}
          {match.matchStatus === "accepted" && (
            <div className="rounded-full bg-[var(--brand)]/10 border border-[var(--brand)]/30 px-2 py-0.5 text-[9px] font-bold text-[var(--brand)] uppercase tracking-wider">
              Matched
            </div>
          )}
        </div>
      </div>

      {/* Middle */}
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--border)]/40 pt-3">
        <div className="rounded-lg bg-[var(--panel-muted)] p-2">
          <p className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Year</p>
          <p className="mt-0.5 text-xs font-semibold text-[var(--foreground)]">
            {match.year ? `Year ${match.year}` : "N/A"}
          </p>
        </div>
        <div className="rounded-lg bg-[var(--panel-muted)] p-2">
          <p className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Course</p>
          <p className="mt-0.5 text-xs font-semibold text-[var(--foreground)] truncate">
            {formatCourse(match.course)}
          </p>
        </div>
        {match.room_number ? (
          <div className="rounded-lg bg-[var(--panel-muted)] p-2">
            <p className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Room</p>
            <p className="mt-0.5 text-xs font-semibold text-[var(--foreground)] truncate">
              {match.room_number}
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-[var(--panel-muted)] p-2 opacity-50">
            <p className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Room</p>
            <p className="mt-0.5 text-xs font-semibold text-[var(--foreground)]">N/A</p>
          </div>
        )}
      </div>

      {/* Why they appeared in results */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {(hasSameYear || (!currentUser && !featured)) && (
          <span className="inline-flex items-center gap-1 rounded-[6px] bg-[var(--brand)]/10 border border-[var(--brand)]/20 px-2 py-0.5 text-[10px] text-[var(--brand)] font-medium">
            ✓ Same Year
          </span>
        )}
        {(hasSameCourse || (!currentUser && match.course)) && (
          <span className="inline-flex items-center gap-1 rounded-[6px] bg-[var(--brand)]/10 border border-[var(--brand)]/20 px-2 py-0.5 text-[10px] text-[var(--brand)] font-medium">
            ✓ Same Course
          </span>
        )}
        {(hasSameGender || (!currentUser && match.gender)) && (
          <span className="inline-flex items-center gap-1 rounded-[6px] bg-[var(--brand)]/10 border border-[var(--brand)]/20 px-2 py-0.5 text-[10px] text-[var(--brand)] font-medium">
            ✓ Same Gender
          </span>
        )}
        {match.is_open_to_switch && (
          <span className="inline-flex items-center gap-1 rounded-[6px] bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 text-[10px] text-sky-400 font-medium">
            ⇄ Open to Switch
          </span>
        )}
      </div>

      {/* AI Lifestyle Compatibility analysis section */}
      {!aiScore && !isAnalyzing ? (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] p-3 text-center">
          <p className="text-xs text-[var(--text-secondary)]">Want a deeper compatibility analysis?</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAnalyzeLifestyle?.(match.email);
            }}
            className="mt-2 w-full inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold transition active:scale-[0.98] border border-[var(--border)] bg-[var(--panel-muted)] text-[var(--foreground)] hover:border-[var(--border-strong)]"
          >
            Analyze
          </button>
        </div>
      ) : null}

      {isAnalyzing ? (
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center animate-pulse">
          <p className="text-xs text-amber-400 flex items-center justify-center gap-2">
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
            Analyzing Lifestyle compatibility with AI... ✨
          </p>
        </div>
      ) : null}

      {aiScore ? (
        <div className="mt-4 rounded-xl border border-[var(--brand)]/15 bg-[var(--brand)]/5 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[var(--brand-soft)] uppercase tracking-wider">
              AI Lifestyle Match
            </span>
            <span className="rounded-full bg-[var(--brand)]/15 px-2 py-0.5 text-xs font-bold text-[var(--brand-soft)]">
              {aiScore}% Fit
            </span>
          </div>
          {aiMatchLevel && (
            <p className="text-[10px] font-semibold text-[var(--brand-soft)] mb-2">{aiMatchLevel}</p>
          )}
          {aiSummary && (
            <div className="mb-3">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Summary</p>
              <p className="text-[10px] leading-4 text-[var(--foreground)]">{aiSummary}</p>
            </div>
          )}
          {(aiStrengths || aiConflicts) && (
            <div className="space-y-2">
              {aiStrengths && aiStrengths.length > 0 && (
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--brand)] mb-1">Strengths</p>
                  <ul className="space-y-0.5">
                    {aiStrengths.map((strength, idx) => (
                      <li key={idx} className="text-[10px] text-[var(--foreground)] flex items-start gap-1">
                        <span className="text-[var(--brand)]">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {aiConflicts && aiConflicts.length > 0 && (
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-amber-400 mb-1">Weaknesses</p>
                  <ul className="space-y-0.5">
                    {aiConflicts.map((conflict, idx) => (
                      <li key={idx} className="text-[10px] text-[var(--foreground)] flex items-start gap-1">
                        <span className="text-amber-400">⚠</span>
                        <span>{conflict}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      {renderActions()}

      <div className="mt-3 text-[10px] font-medium text-[var(--text-muted)] opacity-0 transition group-hover:opacity-100">
        Click to view full comparison →
      </div>
    </div>
  );
}

import { QUESTIONS } from "./home-data";

export function MatchDetailModal({
  match,
  onClose,
  onSendRequest,
  onAcceptRequest,
  onRejectRequest,
  onMessage,
}: {
  match: MatchUser;
  onClose: () => void;
  onSendRequest?: (email: string) => void;
  onAcceptRequest?: (id: string) => void;
  onRejectRequest?: (id: string) => void;
  onMessage?: (match: MatchUser) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative h-full max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 sm:p-8">
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

        <div className="mt-8">
          {match.matchStatus === "accepted" ? (
            <button 
              className={`w-full ${primaryButtonClass}`} 
              onClick={() => { onMessage?.(match); onClose(); }}
            >
              Start Chatting
            </button>
          ) : match.matchStatus === "pending_sent" ? (
            <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] py-3 text-center text-sm font-medium text-[var(--text-muted)]">
              Match Request Pending
            </div>
          ) : match.matchStatus === "pending_received" ? (
            <div className="flex gap-3">
              <button 
                className={`flex-1 ${primaryButtonClass}`} 
                onClick={() => { match.requestId && onAcceptRequest?.(match.requestId); onClose(); }}
              >
                Accept Match
              </button>
              <button 
                className={`flex-1 ${secondaryButtonClass}`} 
                onClick={() => { match.requestId && onRejectRequest?.(match.requestId); onClose(); }}
              >
                Reject
              </button>
            </div>
          ) : (
            <button 
              className={`w-full ${primaryButtonClass}`} 
              onClick={() => { onSendRequest?.(match.email); onClose(); }}
            >
              Send Match Request
            </button>
          )}
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
      </div>
    </div>
  );
}

export function ChatWindow({
  match,
  messages,
  onSendMessage,
  currentUserEmail,
}: {
  match: MatchUser;
  messages: any[];
  onSendMessage: (content: string) => void;
  currentUserEmail: string;
}) {
  const [text, setText] = React.useState("");

  return (
    <div className="flex h-[600px] flex-col rounded-3xl border border-[var(--border)] bg-[var(--panel)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
        <div>
          <h3 className="text-lg font-semibold">{match.name}</h3>
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Year {match.year || "?"} • {formatCourse(match.course)}</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
            <p className="text-sm">No messages yet. Say hi!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_email === currentUserEmail;
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  isMe 
                    ? "bg-[var(--brand)] text-[var(--text-on-brand)]" 
                    : "bg-[var(--panel-muted)] border border-[var(--border)] text-[var(--foreground)]"
                }`}>
                  {m.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-[var(--border)]">
        <form 
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) {
              onSendMessage(text);
              setText("");
            }
          }}
        >
          <input
            className={fieldClass}
            placeholder="Type your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className={primaryButtonClass} type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

import React from "react";

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
      <div className="w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full border border-[var(--border-strong)] bg-[var(--panel-muted)]" />
        <p className="text-lg font-medium">{message}</p>
      </div>
    </main>
  );
}

export function AuthView({ onDemoLogin }: { onDemoLogin: () => void }) {
  return (
    <main className="relative min-h-screen overflow-hidden text-[var(--foreground)]" style={{ background: 'linear-gradient(135deg, #f5f2f8 0%, #ebe8f0 50%, #e8e4ec 100%)' }}>
      <div className="relative mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full text-center">
          <section className="rounded-[48px] border border-[var(--border)] bg-[var(--panel)] p-10 md:p-16 shadow-lg">
            <h1 className="text-6xl font-semibold tracking-[-0.08em] text-[var(--brand)] md:text-8xl">
              wroomies
            </h1>
            <p className="mt-4 text-xl tracking-tight text-[var(--text-secondary)] md:text-2xl">
              find your ride or die
            </p>

            <div className="mt-12 flex flex-col items-center gap-6">
              <button 
                className={`${primaryButtonClass} scale-110 px-10 py-4`} 
                onClick={() => signIn("azure-ad")}
              >
                Continue with Bennett email
              </button>
              <button 
                className={`${secondaryButtonClass} scale-105 border-[var(--brand)]/30 bg-[var(--brand)]/5 px-8 py-3`}
                onClick={onDemoLogin}
              >
                Try Demo Experience
              </button>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Only Bennett accounts can join
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
