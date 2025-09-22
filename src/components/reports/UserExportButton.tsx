import React, { useState } from 'react';
import { DownloadIcon, ChevronDownIcon } from 'lucide-react';
import logoUrl from '../../assets/logo.png';

export type ExportableTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  deadline: Date;
  createdAt: Date;
  isCarriedOver?: boolean;
};

function toCsv(tasks: ExportableTask[]): string {
  const headers = ['ID','Title','Status','Priority','Deadline','Created At','Overdue','Carried Over'];
  const rows = tasks.map(t => [
    t.id,
    t.title.replace(/\n/g, ' '),
    t.status,
    t.priority,
    new Date(t.deadline).toISOString(),
    new Date(t.createdAt).toISOString(),
    new Date(t.deadline).getTime() < Date.now() && t.status !== 'completed' ? 'Yes' : 'No',
    t.isCarriedOver ? 'Yes' : 'No'
  ]);
  const content = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');
  return content;
}

function downloadText(filename: string, text: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function UserExportButton({ tasks, filenameBase }: { tasks: ExportableTask[]; filenameBase: string; }) {
  const [open, setOpen] = useState(false);
  const doCsv = () => {
    const csv = toCsv(tasks);
    downloadText(`${filenameBase}.csv`, csv, 'text/csv;charset=utf-8');
    setOpen(false);
  };
  const doJson = () => {
    const json = JSON.stringify(tasks, null, 2);
    downloadText(`${filenameBase}.json`, json, 'application/json;charset=utf-8');
    setOpen(false);
  };
  const toDataUrl = async (url: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    });
  };
  const doPdf = async () => {
    try {
      const mod: any = await import('jspdf');
      const jsPDF = (mod as any).jsPDF || (mod as any).default || mod;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const marginX = 40;
      let y = 40;
      // Logo
      try {
        const dataUrl = await toDataUrl(logoUrl as unknown as string);
        doc.addImage(dataUrl, 'PNG', marginX, y, 120, 40);
      } catch (e) {
        // ignore logo failure
      }
      y += 60;
      doc.setFontSize(16);
      doc.text('My Tasks Report', marginX, y);
      y += 10;
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(new Date().toLocaleString(), marginX, y);
      doc.setTextColor(0);
      y += 20;
      // Table header
      const headers = ['ID','Title','Status','Priority','Deadline','Created'];
      const colWidths = [50, 200, 70, 70, 90, 90];
      let x = marginX;
      doc.setFontSize(11);
      doc.setFillColor(46, 157, 116);
      doc.setTextColor(255);
      doc.rect(marginX, y - 12, colWidths.reduce((a,b)=>a+b,0), 22, 'F');
      x = marginX + 6;
      headers.forEach((h, i) => {
        doc.text(h, x, y);
        x += colWidths[i];
      });
      doc.setTextColor(0);
      y += 16;
      // Rows
      const lineHeight = 16;
      tasks.forEach(t => {
        if (y > 780) { doc.addPage(); y = 40; }
        x = marginX + 6;
        const row = [
          t.id,
          (t.title || '').slice(0,40),
          t.status,
          t.priority,
          new Date(t.deadline).toLocaleDateString(),
          new Date(t.createdAt).toLocaleDateString(),
        ];
        row.forEach((val, i) => {
          doc.text(String(val), x, y);
          x += colWidths[i];
        });
        y += lineHeight;
      });
      doc.save(`${filenameBase}.pdf`);
      setOpen(false);
    } catch (e) {
      // Fallback to print if jsPDF is not installed
      const win = window.open('', '_blank');
      if (!win) return;
      const rows = tasks.map(t => `<tr><td>${t.id}</td><td>${t.title}</td><td>${t.status}</td><td>${t.priority}</td><td>${new Date(t.deadline).toLocaleDateString()}</td><td>${new Date(t.createdAt).toLocaleDateString()}</td></tr>`).join('');
      win.document.write(`<!doctype html><html><head><title>My Tasks Report</title>
        <style>body{font-family:Arial;padding:24px} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ddd;padding:8px;font-size:12px} th{background:#2e9d74;color:#fff;text-align:left}</style>
      </head><body>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><img src="${logoUrl}" style="height:36px"/><h2 style="margin:0">My Tasks Report</h2></div>
        <div style="color:#666;margin-bottom:12px">${new Date().toLocaleString()}</div>
        <table><thead><tr><th>ID</th><th>Title</th><th>Status</th><th>Priority</th><th>Deadline</th><th>Created</th></tr></thead><tbody>${rows}</tbody></table>
      </body></html>`);
      win.document.close();
      win.focus();
      win.print();
      setOpen(false);
    }
  };
  return <div className="relative inline-block text-left">
    <button type="button" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#2e9d74] to-[#8c52ff] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2e9d74]" onClick={() => setOpen(v => !v)}>
      <DownloadIcon className="h-5 w-5 mr-2" />
      Export
      <ChevronDownIcon className="h-5 w-5 ml-2" />
    </button>
    {open && (
      <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-900 ring-1 ring-black ring-opacity-5 z-10">
        <div className="py-1">
          <button onClick={doCsv} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Export as CSV</button>
          <button onClick={doJson} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Export as JSON</button>
          <button onClick={doPdf} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Export as PDF</button>
        </div>
      </div>
    )}
  </div>;
}


