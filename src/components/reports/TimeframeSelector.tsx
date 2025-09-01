import React from 'react';
import { CalendarIcon } from 'lucide-react';
type TimeframeSelectorProps = {
  value: 'week' | 'month' | 'quarter';
  onChange: (value: 'week' | 'month' | 'quarter') => void;
};
export function TimeframeSelector({
  value,
  onChange
}: TimeframeSelectorProps) {
  return <div>
      <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700">
        Time Period
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <CalendarIcon className="h-5 w-5 text-gray-400" />
        </div>
        <select id="timeframe" name="timeframe" className="focus:ring-[#2e9d74] focus:border-[#2e9d74] block w-full pl-10 sm:text-sm border-gray-300 rounded-md" value={value} onChange={e => onChange(e.target.value as any)}>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
        </select>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Select time period for report data
      </p>
    </div>;
}