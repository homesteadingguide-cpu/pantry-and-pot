"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const PAYHIP_URL = process.env.NEXT_PUBLIC_PAYHIP_URL || "https://payhip.com";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reason?: "trial" | "expired" | "signin";
}

export function AuthDialog({ open, onOpenChange, reason = "signin" }: Props) {
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !passcode.trim()) {
      toast.error("Enter your email and passcode.");
      return;
    }
    setLoading(true);
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      passcode,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      toast.error("Wrong passcode. Double-check and try again.");
      return;
    }
    toast.success("Welcome! Your 7-day trial has started.");
    onOpenChange(false);
    setEmail("");
    setPasscode("");
    // Reload to refresh data for the new user
    window.location.reload();
  };

  const title =
    reason === "expired"
      ? "Your trial has ended"
      : reason === "trial"
        ? "Start your 7-day free trial"
        : "Sign in to Pantry and Pot";

  const description =
    reason === "expired"
      ? "You can still browse your data, but editing is locked. Subscribe to keep managing your homestead."
      : "Enter your email and the trial passcode to unlock full access for 7 days — no credit card needed.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
            {reason === "expired" ? (
              <Lock className="h-5 w-5" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </div>
          <DialogTitle className="font-serif text-xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="auth-passcode">Passcode</Label>
            <Input
              id="auth-passcode"
              type="password"
              placeholder="Enter the trial passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Don’t have a passcode? Grab one from the shop on homesteadingguide.com.
            </p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Starting trial…
                </>
              ) : reason === "expired" ? (
                "Sign in to continue"
              ) : (
                "Start free trial"
              )}
            </Button>
            {reason === "expired" && (
              <a
                href={PAYHIP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center text-sm text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Or subscribe now →
              </a>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
