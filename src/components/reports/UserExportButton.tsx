import React, { useState } from 'react';
import { DownloadIcon, ChevronDownIcon } from 'lucide-react';
import logoUrl from '../../assets/logo.png';
import { jsPDF } from 'jspdf';

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
  const loadImage = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
  const doPdf = async () => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
      const marginX = 40;
      const marginY = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const availableWidth = pageWidth - marginX * 2;
      let y = marginY;
      // Logo
      try {
        const img = await loadImage(logoUrl as unknown as string);
        doc.addImage(img, 'PNG', marginX, y, 140, 45);
      } catch (e) {
        // ignore logo failure
      }
      y += 65;
      doc.setFontSize(16);
      doc.text('My Tasks Report', marginX, y);
      y += 10;
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(new Date().toLocaleString(), marginX, y);
      doc.setTextColor(0);
      y += 24;

      const headers = ['ID','Title','Status','Priority','Deadline','Created'];
      const statusW = 90, priorityW = 80, dateW = 110, createdW = 110, idW = 60;
      const titleW = availableWidth - (idW + statusW + priorityW + dateW + createdW);
      const colWidths = [idW, titleW, statusW, priorityW, dateW, createdW];

      const drawHeader = () => {
        const headerHeight = 28;
        // Draw background bar
        doc.setFillColor(46, 157, 116);
        doc.rect(marginX, y, availableWidth, headerHeight, 'F');
        // Header text
        let x = marginX + 8;
        const textY = y + 18; // baseline inside header
        doc.setFontSize(11);
        doc.setTextColor(255);
        headers.forEach((h, i) => {
          doc.text(h, x, textY);
          x += colWidths[i];
        });
        // Move y below header with small padding
        doc.setTextColor(0);
        y += headerHeight + 6;
      };

      drawHeader();

      const lineGap = 4;
      const baseLine = 12;
      doc.setFontSize(10);
      tasks.forEach((t) => {
        // compute wrapped title
        const titleLines = doc.splitTextToSize(t.title || '', titleW - 12);
        const rowHeight = Math.max(baseLine, titleLines.length * (baseLine + lineGap));
        if (y + rowHeight + marginY > pageHeight) {
          doc.addPage('a4', 'landscape');
          y = marginY;
          drawHeader();
        }
        let x = marginX + 8;
        const cells = [
          String(t.id),
          titleLines,
          String(t.status),
          String(t.priority),
          new Date(t.deadline).toLocaleDateString(),
          new Date(t.createdAt).toLocaleDateString(),
        ];
        cells.forEach((val, i) => {
          if (Array.isArray(val)) {
            let ly = y;
            val.forEach((ln) => { doc.text(String(ln), x, ly); ly += baseLine + lineGap; });
          } else {
            doc.text(String(val), x, y);
          }
          x += colWidths[i];
        });
        y += rowHeight + 2;
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


