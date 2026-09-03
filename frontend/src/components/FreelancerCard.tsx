import * as React from "react";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardContent } from "./ui/Card";
import { Star } from "lucide-react";

export interface FreelancerCardProps {
  name: string;
  avatarFallback: string;
  avatarSrc?: string;
  title: string;
  rating: number;
  reviews: number;
  hourlyRate: string;
  skills: string[];
}

export function FreelancerCard({
  name,
  avatarFallback,
  avatarSrc,
  title,
  rating,
  reviews,
  hourlyRate,
  skills,
}: FreelancerCardProps) {
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
            <h3 className="font-bold text-white line-clamp-1">{name}</h3>
            <p className="text-sm text-white/50 line-clamp-1">{title}</p>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-white">{rating}</span>
              <span className="text-white/40 font-medium">({reviews})</span>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {skills.slice(0, 3).map((skill) => (
            <div key={skill} className="bg-white/5 border border-white/10 text-white/70 font-medium text-[11px] px-2.5 py-1 rounded-full group-hover:border-white/20 transition-colors">
              {skill}
            </div>
          ))}
          {skills.length > 3 && (
            <div className="bg-white/5 border border-white/10 text-white/40 font-medium text-[11px] px-2.5 py-1 rounded-full">
              +{skills.length - 3}
            </div>
          )}
        </div>

        {/* Footer: Rate + CTA */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/10 group-hover:border-white/20 transition-colors">
          <div className="text-sm font-black text-white">
            {hourlyRate}
          </div>
          <button className="text-xs h-8 px-4 font-bold rounded-full bg-white/5 text-white/70 group-hover:bg-primary group-hover:text-black transition-all">
            Hire Me
          </button>
        </div>
      </div>
    </div>
  );
}
