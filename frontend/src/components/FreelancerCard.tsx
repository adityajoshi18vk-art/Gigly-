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
    <Card className="flex flex-col h-full group">
      <CardContent className="p-5 flex-1 flex flex-col">
        {/* Header: Avatar + Info */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-14 h-14" fallback={avatarFallback} src={avatarSrc} />
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 line-clamp-1">{name}</h3>
            <p className="text-sm text-slate-500 line-clamp-1">{title}</p>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-medium text-slate-700">{rating}</span>
              <span className="text-slate-400">({reviews})</span>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="default" className="font-medium text-[11px] px-2">
              {skill}
            </Badge>
          ))}
          {skills.length > 3 && (
            <Badge variant="default" className="font-medium text-[11px] px-2 text-slate-500">
              +{skills.length - 3}
            </Badge>
          )}
        </div>

        {/* Footer: Rate + CTA */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-sm font-semibold text-slate-900">
            {hourlyRate}
          </div>
          <Button variant="outline" className="text-xs h-8 px-3 group-hover:border-primary group-hover:text-primary transition-colors">
            Hire Me
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
