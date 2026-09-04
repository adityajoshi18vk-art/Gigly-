"use client";

import { useState, useEffect, useCallback } from "react";
import { JobData } from "@/components/ActiveJobs";

const CACHE_KEY = "gigly_jobs_cache";
const CACHE_TS_KEY = "gigly_jobs_cache_ts";
const CACHE_TTL_MS = 15_000; // 15 seconds — stale after this, force fresh fetch

function readCache(): JobData[] | null {
  if (typeof window === "undefined") return null;
  try {
    const ts = sessionStorage.getItem(CACHE_TS_KEY);
    if (!ts || Date.now() - Number(ts) > CACHE_TTL_MS) return null; // expired
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (!Array.isArray(parsed)) return null;
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
  } catch {
    return null;
  }
}

function writeCache(jobs: any[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(jobs));
    sessionStorage.setItem(CACHE_TS_KEY, String(Date.now()));
  } catch {}
}

export function clearJobsCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
    sessionStorage.removeItem(CACHE_TS_KEY);
  } catch {}
}

export function useJobs(refreshCounter: number = 0) {
  const cached = readCache();

  const [jobs, setJobs] = useState<JobData[]>(cached ?? []);
  const [loading, setLoading] = useState<boolean>(cached === null);

  const fetchJobs = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

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
          writeCache(data.jobs);
        }
      }
    } catch (err) {
      console.warn("Jobs API fetch error (using cache or fallback):", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs, refreshCounter]);

  return { jobs, loading, refetch: fetchJobs };
}
