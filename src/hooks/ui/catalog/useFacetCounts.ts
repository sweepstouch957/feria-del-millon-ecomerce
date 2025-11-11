"use client";

export function useFacetCounts(rows: any[]) {
  const techniques = new Map<string, number>();
  const pavilions = new Map<string, { id: string; name: string; count: number }>();

  for (const r of rows || []) {
    const techKey = r?.techniqueInfo?.name ?? "—";
    techniques.set(techKey, (techniques.get(techKey) ?? 0) + 1);

    if (r?.pavilionInfo?._id) {
      const pid = String(r.pavilionInfo._id);
      const name = r.pavilionInfo.name ?? "—";
      const prev = pavilions.get(pid);
      pavilions.set(pid, { id: pid, name, count: (prev?.count ?? 0) + 1 });
    }
  }

  return {
    techniques: Array.from(techniques.entries()).map(([name, count]) => ({ name, count })),
    pavilions: Array.from(pavilions.values()),
  };
}
