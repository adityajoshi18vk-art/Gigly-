import * as React from "react";
import { Avatar } from "./ui/Avatar";
import { Star, ExternalLink, ShieldCheck, Code2, CheckCircle2 } from "lucide-react";

export interface FreelancerCardProps {
  name: string;
  avatarFallback: string;
  avatarSrc?: string;
  title: string;
  rating: number;
  reviews: number;
  hourlyRate: string;
  skills: string[];
  verifiedSkills?: string[];
  domain?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  isVerified?: boolean;
}

const DOMAIN_COLORS: Record<string, string> = {
  "Smart Contracts": "bg-accent/15 text-accent-light border-accent/30",
  "Frontend": "bg-sky-500/15 text-sky-300 border-sky-500/30",
  "Backend": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "Auditing": "bg-rose-500/15 text-rose-300 border-rose-500/30",
  "UI/UX": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Other": "bg-glass-light text-on-surface-variant border-glass-border",
};

export function FreelancerCard({
  name,
  avatarFallback,
  avatarSrc,
  title,
  rating,
  reviews,
  hourlyRate,
  skills,
  verifiedSkills = [],
  domain,
  portfolioUrl,
  githubUrl,
  isVerified,
}: FreelancerCardProps) {
  // Merge skills: show all unique skills, marking verified ones
  const verifiedSet = new Set(verifiedSkills.map((s) => s.toLowerCase()));
  const allSkills = Array.from(
    new Set([...skills, ...verifiedSkills])
  ).slice(0, 6);

  return (
    <div className="relative surface-card-interactive rounded-2xl p-6 hover:shadow-level-2 transition-all duration-300 group overflow-hidden h-full flex flex-col">
      {/* Top subtle highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

      {/* Ambient hover glow */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-accent/10 blur-[50px] rounded-full group-hover:bg-accent/25 transition-colors duration-500 pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header: Avatar + Info */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-14 h-14" fallback={avatarFallback} src={avatarSrc} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-on-surface text-base truncate">{name}</h3>
              {isVerified && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-2 py-0.5 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  ZK-Verified
                </span>
              )}
            </div>
            <p className="text-body-sm text-on-surface-variant truncate">{title}</p>
            <div className="flex items-center gap-1 mt-1 text-xs">
              {reviews > 0 ? (
                <>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-on-surface">{rating}</span>
                  <span className="text-on-surface-variant/60 font-medium">({reviews})</span>
                </>
              ) : (
                <span className="text-on-surface-variant/60 text-[11px] font-medium">Available for hire</span>
              )}
            </div>
          </div>
        </div>

        {/* Domain Badge */}
        {domain && (
          <div className="mb-3">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-sm ${
                DOMAIN_COLORS[domain] || DOMAIN_COLORS["Other"]
              }`}
            >
              {domain}
            </span>
          </div>
        )}

        {/* Skills — verified get green pill with checkmark */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {allSkills.slice(0, 4).map((skill) => {
            const isSkillVerified = verifiedSet.has(skill.toLowerCase());
            return isSkillVerified ? (
              <span
                key={skill}
                className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium text-[11px] px-2.5 py-1 rounded-full backdrop-blur-sm"
              >
                <CheckCircle2 className="w-3 h-3" />
                {skill}
              </span>
            ) : (
              <div key={skill} className="bg-glass-light border border-glass-border text-on-surface-variant font-medium text-[11px] px-2.5 py-1 rounded-full group-hover:border-glass-border-light transition-colors">
                {skill}
              </div>
            );
          })}
          {allSkills.length > 4 && (
            <div className="bg-glass-subtle border border-glass-border text-on-surface-variant/60 font-medium text-[11px] px-2.5 py-1 rounded-full">
              +{allSkills.length - 4}
            </div>
          )}
        </div>

        {/* Footer: Rate + Links + CTA */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-glass-border group-hover:border-glass-border-light transition-colors">
          <div className="flex items-center gap-3">
            <div className="text-sm font-bold font-mono text-on-surface">
              {hourlyRate}
            </div>
            {/* External links */}
            <div className="flex items-center gap-2">
              {portfolioUrl && (
                <a
                  href={portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-on-surface-variant hover:text-accent-light transition-colors"
                  title="Portfolio"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-on-surface-variant hover:text-accent-light transition-colors"
                  title="GitHub"
                >
                  <Code2 className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
          <button className="text-xs h-8 px-4 font-semibold rounded-xl bg-glass-light text-on-surface border border-glass-border group-hover:bg-gradient-to-r group-hover:from-accent group-hover:to-accent-light group-hover:text-white group-hover:border-transparent group-hover:shadow-glow-accent transition-all duration-300">
            Hire Me
          </button>
        </div>
      </div>
    </div>
  );
}
