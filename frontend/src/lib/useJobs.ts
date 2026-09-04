"use client";

import { useState, useEffect, useCallback } from "react";
import { JobData } from "@/components/ActiveJobs";

const CACHE_KEY = "gigly_jobs_cache";

export function useJobs(refreshCounter: number = 0) {
  // Initialize from cache for instant 0ms render
  const [jobs, setJobs] = useState<JobData[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed.map((j: any) => ({
            id: Number(j.id),
            client: j.client,
            freelancer: j.freelancer,
            amount: BigInt(j.amount || "0"),
            releasedAmount: BigInt(j.releasedAmount || "0"),
            submittedAt: BigInt(j.submittedAt || "0"),
            status: Number(j.status),
            taskTitle: j.taskTitle || `Job #${j.id}`,
            submissionLink: j.submissionLink || "",
          }));
        }
      }
    } catch {
      // Ignore sessionStorage parsing errors
    }
    return [];
  });

  // If we have cached jobs, don't show the initial full-screen spinner
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      return !cached || cached === "[]";
    } catch {
      return true;
    }
  });

  const fetchJobs = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch("/api/jobs", { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.jobs)) {
          const formatted: JobData[] = data.jobs.map((j: any) => ({
            id: Number(j.id),
            client: j.client,
            freelancer: j.freelancer,
            amount: BigInt(j.amount || "0"),
            releasedAmount: BigInt(j.releasedAmount || "0"),
            submittedAt: BigInt(j.submittedAt || "0"),
            status: Number(j.status),
            taskTitle: j.taskTitle || `Job #${j.id}`,
            submissionLink: j.submissionLink || "",
          }));

          setJobs(formatted);
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data.jobs));
          } catch {}
        }
      }
    } catch (err) {
      console.warn("Fast jobs API fetch error (using cache or fallback):", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs, refreshCounter]);

  return { jobs, loading, refetch: fetchJobs };
}
