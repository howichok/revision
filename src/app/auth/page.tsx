"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  AlertCircle,
  MailCheck,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { storage } from "@/lib/storage";
import type { UserProfile } from "@/lib/types";

type Mode = "login" | "register";
type ViewState = "form" | "loading" | "success" | "forgot" | "verify";

const EASE_PREMIUM = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

function TypewriterLabel({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState(text);
  const prevText = useRef(text);
  const rafRef = useRef<number | null>(null);

  const animate = useCallback((oldText: string, newText: string) => {
    let phase: "deleting" | "typing" = "deleting";
    let cursor = oldText.length;
    const deleteSpeed = 28;
    const typeSpeed = 38;
    let lastTime = 0;

    function step(time: number) {
      if (time - lastTime < (phase === "deleting" ? deleteSpeed : typeSpeed)) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      lastTime = time;

      if (phase === "deleting") {
        cursor--;
        setDisplayed(oldText.slice(0, cursor));
        if (cursor <= 0) {
          phase = "typing";
          cursor = 0;
        }
        rafRef.current = requestAnimationFrame(step);
      } else {
        cursor++;
        setDisplayed(newText.slice(0, cursor));
        if (cursor < newText.length) {
          rafRef.current = requestAnimationFrame(step);
        }
      }
    }

    rafRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    if (text !== prevText.current) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      animate(prevText.current, text);
      prevText.current = text;
    }
  }, [text, animate]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <span className="inline-flex items-center justify-center">
      {displayed}
    </span>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("register");
  const [viewState, setViewState] = useState<ViewState>("form");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [nicknameOnly, setNicknameOnly] = useState(false);
  const [error, setError] = useState("");
  const [copyKey, setCopyKey] = useState(0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmed = nickname.trim();
    if (!trimmed) {
      setError("Enter a nickname to continue.");
      return;
    }
    if (trimmed.length < 2) {
      setError("Nickname needs to be at least 2 characters.");
      return;
    }

    setViewState("loading");

    setTimeout(() => {
      const profile: UserProfile = {
        nickname: trimmed,
        email: email.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      storage.setUser(profile);

      setViewState("success");

      setTimeout(() => {
        const onboarding = storage.getOnboarding();
        if (onboarding && onboarding.completedAt) {
          router.push("/home");
        } else if (onboarding && !onboarding.completedAt) {
          router.push("/onboarding/focus");
        } else {
          router.push("/onboarding");
        }
      }, 1200);
    }, 1500);
  }

  function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setViewState("loading");
    setTimeout(() => setViewState("verify"), 1500);
  }

  function handleNicknameOnlyToggle() {
    setNicknameOnly(true);
    setEmail("");
    setPassword("");
    setError("");
    setCopyKey((k) => k + 1);
  }

  function handleFullModeToggle() {
    setNicknameOnly(false);
    setError("");
    setCopyKey((k) => k + 1);
  }

  const ctaLabel = nicknameOnly
    ? mode === "login"
      ? "Continue with nickname"
      : "Start with nickname"
    : mode === "register"
    ? "Create Account"
    : "Sign In";

  const titleText = nicknameOnly
    ? mode === "login"
      ? "Welcome back"
      : "Quick start"
    : mode === "register"
    ? "Create your account"
    : "Hey again";

  const subtitleText = nicknameOnly
    ? mode === "login"
      ? "Continue with your nickname and we\u2019ll pick up where you left off."
      : "Just pick a nickname and you\u2019re in. No email needed."
    : mode === "register"
    ? "Pick a nickname and you\u2019re good to go. Quick and easy."
    : "Enter your details to pick up where you left off.";

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-6">
      <div className="absolute top-[-30%] left-[50%] -translate-x-1/2 w-[600px] h-[500px] bg-accent/3 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_PREMIUM }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-10">
          <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
            <span className="text-accent font-bold text-base">K</span>
          </div>
          <span className="font-semibold text-foreground tracking-tight">Kosti</span>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8">
          <AnimatePresence mode="wait">
            {/* ── Loading state ── */}
            {viewState === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <Loader2 size={32} className="text-accent animate-spin mb-4" />
                <p className="text-sm text-muted">
                  {nicknameOnly ? "Getting things ready..." : mode === "register" ? "Setting up your account..." : "Signing you in..."}
                </p>
              </motion.div>
            )}

            {/* ── Success state ── */}
            {viewState === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <CheckCircle2 size={48} className="text-success mb-4" />
                </motion.div>
                <h2 className="text-lg font-semibold mb-1">You&apos;re in!</h2>
                <p className="text-sm text-muted">Redirecting you now...</p>
              </motion.div>
            )}

            {/* ── Verify / check your email state ── */}
            {viewState === "verify" && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center text-center py-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
                  <MailCheck size={28} className="text-accent" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Check your email</h2>
                <p className="text-sm text-muted mb-6 leading-relaxed">
                  If that email is in our system, you&apos;ll get a link to reset your password.
                  Check your spam folder too.
                </p>
                <Button
                  variant="ghost"
                  onClick={() => setViewState("form")}
                >
                  Back to sign in
                </Button>
              </motion.div>
            )}

            {/* ── Forgot password state ── */}
            {viewState === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleForgotSubmit} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Forgot your password?</h2>
                    <p className="text-sm text-muted">
                      No worries. Enter your email and we&apos;ll send a reset link.
                    </p>
                  </div>

                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Your email address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11"
                      autoFocus
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    Send Reset Link
                  </Button>

                  <button
                    type="button"
                    onClick={() => setViewState("form")}
                    className="text-sm text-muted-foreground hover:text-muted transition-colors cursor-pointer w-full text-center"
                  >
                    Back to sign in
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── Main form state ── */}
            {viewState === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Tabs — hidden in nickname-only mode */}
                <AnimatePresence>
                  {!nicknameOnly && (
                    <motion.div
                      initial={{ opacity: 1, height: "auto", marginBottom: 32 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.3, ease: EASE_PREMIUM }}
                      className="overflow-hidden"
                    >
                      <div className="flex bg-surface rounded-xl p-1">
                        {(["register", "login"] as Mode[]).map((m) => (
                          <button
                            key={m}
                            onClick={() => { setMode(m); setError(""); }}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                              mode === m
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-muted"
                            }`}
                          >
                            {m === "register" ? "New Here" : "Welcome Back"}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Persistent form — no key-swap re-mount on nicknameOnly toggle */}
                <AnimatePresence mode="wait">
                  <motion.form
                    key={mode}
                    initial={{ opacity: 0, x: mode === "register" ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: mode === "register" ? 10 : -10 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >
                    {/* Title / subtitle with subtle cross-fade */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`copy-${copyKey}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: EASE_PREMIUM }}
                      >
                        <h2 className="text-xl font-semibold mb-1">{titleText}</h2>
                        <p className="text-sm text-muted">{subtitleText}</p>
                      </motion.div>
                    </AnimatePresence>

                    <div className="space-y-3">
                      {/* Nickname — always visible, the anchor field */}
                      <div className="relative">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                          placeholder="Your nickname"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          className="pl-11"
                          autoFocus
                        />
                      </div>

                      {/* Email — separate wrapper, exits first (no delay) */}
                      <AnimatePresence>
                        {!nicknameOnly && (
                          <motion.div
                            key="email-field"
                            initial={{ opacity: 0, y: -16, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto", marginTop: 12 }}
                            exit={{ opacity: 0, y: -20, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.32, ease: EASE_PREMIUM }}
                            className="overflow-hidden"
                          >
                            <div className="relative">
                              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                              <Input
                                placeholder={mode === "register" ? "Email (optional)" : "Email"}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-11"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Password — exits with a slight delay after email */}
                      <AnimatePresence>
                        {!nicknameOnly && (
                          <motion.div
                            key="password-field"
                            initial={{ opacity: 0, y: -16, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto", marginTop: 12, transition: { duration: 0.32, ease: EASE_PREMIUM } }}
                            exit={{ opacity: 0, y: -20, height: 0, marginTop: 0, transition: { duration: 0.32, delay: 0.07, ease: EASE_PREMIUM } }}
                            className="overflow-hidden"
                          >
                            <div className="relative">
                              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                              <Input
                                placeholder={mode === "register" ? "Password (optional for now)" : "Password"}
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-11 pr-11"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted transition-colors cursor-pointer"
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>

                            {/* Password strength hint for register */}
                            {mode === "register" && password.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="flex gap-1.5 mt-2"
                              >
                                {[1, 2, 3, 4].map((level) => (
                                  <div
                                    key={level}
                                    className={`h-1 flex-1 rounded-full transition-colors ${
                                      password.length >= level * 3
                                        ? level <= 1
                                          ? "bg-danger"
                                          : level <= 2
                                          ? "bg-warning"
                                          : "bg-success"
                                        : "bg-border/50"
                                    }`}
                                  />
                                ))}
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Remember me + forgot password — collapses with stagger after password */}
                    <AnimatePresence>
                      {!nicknameOnly && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto", transition: { duration: 0.28, ease: EASE_PREMIUM } }}
                          exit={{ opacity: 0, height: 0, transition: { duration: 0.28, delay: 0.12, ease: EASE_PREMIUM } }}
                          className="flex items-center justify-between overflow-hidden"
                        >
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div
                              className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
                                rememberMe
                                  ? "bg-accent border-accent"
                                  : "border-border group-hover:border-border-light"
                              }`}
                              onClick={() => setRememberMe(!rememberMe)}
                            >
                              {rememberMe && (
                                <motion.svg
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  width="10"
                                  height="10"
                                  viewBox="0 0 10 10"
                                >
                                  <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                </motion.svg>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">Stay signed in</span>
                          </label>

                          {mode === "login" && (
                            <button
                              type="button"
                              onClick={() => setViewState("forgot")}
                              className="text-xs text-accent hover:text-accent/80 transition-colors cursor-pointer"
                            >
                              Forgot password?
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Error */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-sm text-danger bg-danger/10 rounded-lg px-3 py-2.5"
                      >
                        <AlertCircle size={14} className="shrink-0" />
                        {error}
                      </motion.div>
                    )}

                    <Button type="submit" size="lg" className="w-full group">
                      <TypewriterLabel text={ctaLabel} />
                      <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5 shrink-0" />
                    </Button>

                    {/* Divider + toggle */}
                    <div className="relative my-1">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-card px-3 text-xs text-muted-foreground">or</span>
                      </div>
                    </div>

                    {nicknameOnly ? (
                      <button
                        type="button"
                        onClick={handleFullModeToggle}
                        className="w-full py-2.5 text-sm text-muted-foreground hover:text-muted border border-border rounded-xl hover:border-border-light transition-all cursor-pointer"
                      >
                        Use email and password instead
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNicknameOnlyToggle}
                        className="w-full py-2.5 text-sm text-muted-foreground hover:text-muted border border-border rounded-xl hover:border-border-light transition-all cursor-pointer"
                      >
                        Just continue with nickname
                      </button>
                    )}
                  </motion.form>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Everything is saved locally on this device for now.
        </p>
      </motion.div>
    </div>
  );
}
