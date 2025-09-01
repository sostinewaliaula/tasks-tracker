import React, { useState } from 'react';
import { DownloadIcon, ChevronDownIcon } from 'lucide-react';
export function ExportOptions() {
  const [isOpen, setIsOpen] = useState(false);
  const handleExport = (format: string) => {
    // In a real app, this would trigger the export functionality
    alert(`Exporting as ${format}...`);
    setIsOpen(false);
  };
  return <div className="relative inline-block text-left">
      <div>
        <button type="button" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#2e9d74] to-[#8c52ff] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2e9d74]" onClick={() => setIsOpen(!isOpen)}>
          <DownloadIcon className="h-5 w-5 mr-2" />
          Export Report
          <ChevronDownIcon className="h-5 w-5 ml-2" />
        </button>
      </div>
      {isOpen && <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10" onBlur={() => setIsOpen(false)}>
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <button onClick={() => handleExport('PDF')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">
              Export as PDF
            </button>
            <button onClick={() => handleExport('Excel')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">
              Export as Excel
            </button>
            <button onClick={() => handleExport('CSV')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">
              Export as CSV
            </button>
          </div>
        </div>}
    </div>;
}