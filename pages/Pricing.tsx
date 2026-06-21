import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getPlans, createFreeSubscription } from "../lib/api";
import { callEdgeFunction } from "../lib/api";
import type { Plan } from "../lib/database.types";
import { Check, Loader2, Sparkles } from "lucide-react";

type PlanWithFeatures = Plan & {
  featureList: string[];
};

const FEATURE_MAP: Record<string, string[]> = {
  free: [
    "Up to 50 inquiries/month",
    "1 user (you)",
    "Basic inquiry tracking",
    "Kanban board view",
    "CSV export",
    "Email support",
  ],
  pro: [
    "Up to 500 inquiries/month",
    "Up to 5 team members",
    "All Free features",
    "WhatsApp deep links",
    "Quick reply templates",
    "Priority support",
  ],
  enterprise: [
    "Unlimited inquiries",
    "Unlimited team members",
    "All Pro features",
    "Custom integrations",
    "Dedicated account manager",
    "99.9% SLA",
  ],
};

function getFeatureList(plan: Plan): string[] {
  return FEATURE_MAP[plan.slug] ?? [];
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function Pricing() {
  const { user, businessId } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNewSignup = searchParams.get("new") === "true";

  const [plans, setPlans] = useState<PlanWithFeatures[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPlans()
      .then((data) => {
        const mapped = data.map((p) => ({
          ...p,
          featureList: getFeatureList(p),
        }));
        setPlans(mapped);

        // If user just signed up and there's a free plan, auto-subscribe
        if (isNewSignup && businessId) {
          const freePlan = mapped.find((p) => p.slug === "free");
          if (freePlan) {
            // Skip auto-subscribe; let user pick
          }
        }
      })
      .catch((err) => console.error("Failed to load plans", err))
      .finally(() => setLoading(false));
  }, [isNewSignup, businessId]);

  const handleSubscribe = async (plan: PlanWithFeatures) => {
    if (!businessId) {
      navigate("/signup");
      return;
    }

    if (plan.price_monthly_cents === 0) {
      // Free plan — create subscription directly
      setSubscribing(plan.id);
      setError(null);
      try {
        await createFreeSubscription(businessId);
        navigate("/dashboard");
      } catch (err) {
        setError("Failed to activate Free plan. Please try again.");
      } finally {
        setSubscribing(null);
      }
      return;
    }

    // Paid plan — create Stripe Checkout Session
    setSubscribing(plan.id);
    setError(null);
    try {
      const { url } = await callEdgeFunction<{ url: string }>(
        "stripe-create-checkout",
        {
          price_id: plan.stripe_price_id_monthly,
        }
      );
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start checkout"
      );
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="font-heading font-bold text-xl text-accent">
          LeadDesk
        </span>
        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm text-secondary hover:text-foreground transition-colors cursor-pointer"
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="text-sm text-secondary hover:text-foreground transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all duration-150 cursor-pointer"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-16 text-center">
        {isNewSignup && (
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Almost done! Pick your plan to get started
          </div>
        )}
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-secondary max-w-2xl mx-auto">
          Choose the plan that fits your business. No hidden fees. Upgrade or
          downgrade anytime.
        </p>
      </section>

      {/* ── Plan Cards ── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive text-center">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => {
            const isFree = plan.price_monthly_cents === 0;
            const isPopular = plan.slug === "pro";

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-xl border transition-all duration-200 flex flex-col ${
                  isPopular
                    ? "border-accent shadow-lg ring-1 ring-accent/20 scale-[1.02]"
                    : "border-border shadow-md hover:shadow-lg"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </div>
                )}

                <div className="p-6 lg:p-8 flex-1 flex flex-col">
                  {/* Plan name */}
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
                    {plan.name}
                  </h3>

                  {plan.description && (
                    <p className="text-sm text-secondary mb-4">
                      {plan.description}
                    </p>
                  )}

                  {/* Price */}
                  <div className="mb-6">
                    <span className="font-heading text-4xl font-bold text-foreground">
                      {isFree ? "$0" : formatPrice(plan.price_monthly_cents)}
                    </span>
                    {!isFree && (
                      <span className="text-secondary text-sm ml-1.5">
                        /month
                      </span>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1" role="list">
                    {plan.featureList.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm text-foreground"
                      >
                        <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={subscribing === plan.id}
                    className={`w-full py-3 rounded-lg font-semibold text-sm transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      isPopular
                        ? "bg-accent text-white hover:opacity-90"
                        : "bg-foreground text-white hover:opacity-90"
                    }`}
                  >
                    {subscribing === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing…
                      </>
                    ) : isFree ? (
                      "Start Free"
                    ) : user ? (
                      "Subscribe"
                    ) : (
                      "Get Started"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust/Footer */}
        <p className="text-center text-sm text-secondary mt-10">
          All plans include a 14-day free trial. Cancel anytime. No credit card
          required for the Free plan.
        </p>
      </section>
    </div>
  );
}
