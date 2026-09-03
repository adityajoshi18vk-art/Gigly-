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
    <Card className="flex flex-col h-full group">
      <CardContent className="p-5 flex-1 flex flex-col">
        {/* Header: Avatar + Info */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-14 h-14" fallback={avatarFallback} src={avatarSrc} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 line-clamp-1">{name}</h3>
              {isVerified && (
                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  ZK-Verified
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 line-clamp-1">{title}</p>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-medium text-slate-700">{rating}</span>
              <span className="text-slate-400">({reviews})</span>
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
        <div className="flex flex-wrap gap-1.5 mb-5">
          {allSkills.slice(0, 4).map((skill) => {
            const isSkillVerified = verifiedSet.has(skill.toLowerCase());
            return isSkillVerified ? (
              <span
                key={skill}
                className="inline-flex items-center gap-0.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
              >
                <CheckCircle2 className="w-3 h-3" />
                {skill}
              </span>
            ) : (
              <Badge key={skill} variant="default" className="font-medium text-[11px] px-2">
                {skill}
              </Badge>
            );
          })}
          {allSkills.length > 4 && (
            <Badge variant="default" className="font-medium text-[11px] px-2 text-slate-500">
              +{allSkills.length - 4}
            </Badge>
          )}
        </div>

        {/* Footer: Rate + Links + CTA */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-slate-900">
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
                  className="text-slate-400 hover:text-primary transition-colors"
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
                  className="text-slate-400 hover:text-primary transition-colors"
                  title="GitHub"
                >
                  <Code2 className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
          <Button variant="outline" className="text-xs h-8 px-3 group-hover:border-primary group-hover:text-primary transition-colors">
            Hire Me
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
