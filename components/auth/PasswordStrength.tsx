'use client';

function getStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Fraca', color: '#EF4444' };
  if (score <= 2) return { score: 2, label: 'Razo\u00e1vel', color: '#F59E0B' };
  if (score <= 3) return { score: 3, label: 'Boa', color: '#EAB308' };
  if (score <= 4) return { score: 4, label: 'Forte', color: '#22C55E' };
  return { score: 5, label: 'Excelente', color: '#10B981' };
}

export default function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const { score, label, color } = getStrength(password);

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i <= score ? color : 'rgba(255,255,255,0.08)',
            }}
          />
        ))}
      </div>
      <p className="text-xs transition-colors" style={{ color }}>
        {label}
      </p>
    </div>
  );
}
