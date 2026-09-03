import * as React from "react";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardContent } from "./ui/Card";
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
  "Smart Contracts": "bg-violet-100 text-violet-700 border-violet-200",
  "Frontend": "bg-sky-100 text-sky-700 border-sky-200",
  "Backend": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Auditing": "bg-rose-100 text-rose-700 border-rose-200",
  "UI/UX": "bg-amber-100 text-amber-700 border-amber-200",
  "Other": "bg-gray-100 text-gray-600 border-gray-200",
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
    <div className="relative bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-5 shadow-xl hover:border-primary/50 transition-all duration-300 group overflow-hidden h-full flex flex-col">
      {/* Hover Glow */}
      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500" />
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/20 blur-[50px] rounded-full group-hover:bg-primary/40 transition-colors duration-500" />

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header: Avatar + Info */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-14 h-14 border border-white/10" fallback={avatarFallback} src={avatarSrc} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white line-clamp-1">{name}</h3>
              {isVerified && (
                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50/10 border border-emerald-500/20 rounded-full px-1.5 py-0.5 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  ZK-Verified
                </span>
              )}
            </div>
            <p className="text-sm text-white/50 line-clamp-1">{title}</p>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-white">{rating}</span>
              <span className="text-white/40 font-medium">({reviews})</span>
            </div>
          </div>
        </div>

        {/* Domain Badge */}
        {domain && (
          <div className="mb-3">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                DOMAIN_COLORS[domain] || DOMAIN_COLORS["Other"]
              }`}
            >
              {domain}
            </span>
          </div>
        )}

        {/* Skills — verified get green/gold badge with checkmark */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {allSkills.slice(0, 4).map((skill) => {
            const isSkillVerified = verifiedSet.has(skill.toLowerCase());
            return isSkillVerified ? (
              <span
                key={skill}
                className="inline-flex items-center gap-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium text-[11px] px-2.5 py-1 rounded-full"
              >
                <CheckCircle2 className="w-3 h-3" />
                {skill}
              </span>
            ) : (
              <div key={skill} className="bg-white/5 border border-white/10 text-white/70 font-medium text-[11px] px-2.5 py-1 rounded-full group-hover:border-white/20 transition-colors">
                {skill}
              </div>
            );
          })}
          {allSkills.length > 4 && (
            <div className="bg-white/5 border border-white/10 text-white/40 font-medium text-[11px] px-2.5 py-1 rounded-full">
              +{allSkills.length - 4}
            </div>
          )}
        </div>

        {/* Footer: Rate + Links + CTA */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/10 group-hover:border-white/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="text-sm font-black text-white">
              {hourlyRate}
            </div>
            {/* External links */}
            <div className="flex items-center gap-1.5">
              {portfolioUrl && (
                <a
                  href={portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-white/40 hover:text-white transition-colors"
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
                  className="text-white/40 hover:text-white transition-colors"
                  title="GitHub"
                >
                  <Code2 className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
          </div>
          <button className="text-xs h-8 px-4 font-bold rounded-full bg-white/5 text-white/70 group-hover:bg-primary group-hover:text-black transition-all">
            Hire Me
          </button>
        </div>
      </div>
    </div>
  );
}
