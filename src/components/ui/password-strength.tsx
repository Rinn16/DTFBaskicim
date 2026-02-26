"use client";

interface PasswordStrengthProps {
  password: string;
}

interface Rule {
  label: string;
  test: (p: string) => boolean;
}

const rules: Rule[] = [
  { label: "En az 8 karakter", test: (p) => p.length >= 8 },
  { label: "Büyük harf (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "Küçük harf (a-z)", test: (p) => /[a-z]/.test(p) },
  { label: "Rakam (0-9)", test: (p) => /[0-9]/.test(p) },
];

function getStrength(password: string): number {
  return rules.filter((r) => r.test(password)).length;
}

const STRENGTH_LABELS = ["", "Zayıf", "Orta", "İyi", "Güçlü"];
const STRENGTH_COLORS = [
  "",
  "bg-red-500",
  "bg-orange-400",
  "bg-yellow-400",
  "bg-green-500",
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const strength = getStrength(password);

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors ${
              level <= strength
                ? STRENGTH_COLORS[strength]
                : "bg-border"
            }`}
          />
        ))}
      </div>
      {strength > 0 && (
        <p className={`text-xs font-medium ${
          strength === 4
            ? "text-green-600 dark:text-green-400"
            : strength >= 3
            ? "text-yellow-600 dark:text-yellow-400"
            : "text-red-600 dark:text-red-400"
        }`}>
          {STRENGTH_LABELS[strength]}
        </p>
      )}
      {/* Rules checklist */}
      <ul className="space-y-0.5">
        {rules.map((rule) => {
          const passed = rule.test(password);
          return (
            <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${passed ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
              <span>{passed ? "✓" : "○"}</span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
