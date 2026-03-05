import { BASE } from './client';

export const reportsApi = {
  export: async (fy: number, format: 'pdf' | 'csv', token: string): Promise<void> => {
    const res = await fetch(`${BASE}/reports/export?fy=${fy}&format=${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Export failed: ${res.status}`);

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capital-gains-report-fy${fy}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
