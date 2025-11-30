// src/components/UI/OpeningHoursDisplay.tsx
import React from 'react';
import { PlaceOpeningHours, PlaceDetails } from '../../types'; // Adjust path as needed
import { escapeHTMLSafe } from '../../utils'; // Adjust path

interface OpeningHoursDisplayProps {
  openingHours?: PlaceOpeningHours | null;
  businessStatus?: PlaceDetails['business_status'] | null;
}

const OpeningHoursDisplay: React.FC<OpeningHoursDisplayProps> = ({
  openingHours,
  businessStatus,
}) => {
  let overallStatusText = '';
  let overallStatusClass = 'text-gray-600 dark:text-gray-400'; // Default for "unavailable"

  if (businessStatus && businessStatus !== "OPERATIONAL") {
    switch (businessStatus) {
      case "CLOSED_TEMPORARILY": {
        overallStatusText = "Temporarily Closed";
        overallStatusClass = 'text-yellow-600 dark:text-yellow-400 font-semibold';
        break;
      }
      case "CLOSED_PERMANENTLY": {
        overallStatusText = "Permanently Closed";
        overallStatusClass = 'text-red-600 dark:text-red-400 font-semibold';
        break;
      }
      default: {
        // For other non-operational statuses
        const formattedStatus = String(businessStatus).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        overallStatusText = "Status: " + escapeHTMLSafe(formattedStatus);
        overallStatusClass = 'text-orange-600 dark:text-orange-400 font-semibold';
      }
    }
  } else if (openingHours && typeof openingHours.open_now === 'boolean') {
    overallStatusText = openingHours.open_now ? 'Open Now' : 'Closed Now';
    overallStatusClass = openingHours.open_now
      ? 'text-green-600 dark:text-green-400 font-semibold'
      : 'text-red-600 dark:text-red-400 font-semibold';
  } else if (!openingHours?.weekday_text?.length && !businessStatus) {
    overallStatusText = 'Hours status unavailable';
  }


  // Standard English day names order for display (Monday first)
  const displayDayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const todayJsIndex = new Date().getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  // Map JS Sunday=0..Saturday=6 to displayDayOrder Monday=0..Sunday=6 index
  const todayNameInOrder = displayDayOrder[(todayJsIndex + 6) % 7];


  const hasWeekdayText = openingHours?.weekday_text && openingHours.weekday_text.length > 0;

  let processedHours: Array<{
    shortName: string;
    fullName: string;
    hours: string;
    isToday: boolean;
  }> = [];

  if (hasWeekdayText) {
    processedHours = openingHours.weekday_text!.map((line) => {
      const parts = line.split(/:\s*(.*)/s); 
      const dayNameStr = parts[0].trim();
      const hours = parts.length > 1 ? parts.slice(1).join(': ').trim() : 'Closed';
      const isToday = dayNameStr === todayNameInOrder;

      return {
        shortName: dayNameStr.substring(0, 3),
        fullName: dayNameStr,
        hours: hours.toLowerCase() === 'open 24 hours' ? '24 Hours' : hours,
        isToday: isToday,
      };
    });

    // Ensure the display order is Mon, Tue, Wed...
    processedHours.sort((a, b) => {
      return displayDayOrder.indexOf(a.fullName) - displayDayOrder.indexOf(b.fullName);
    });
  }

  return (
    <div id="opening-hours-display" className="space-y-2">
      {overallStatusText && (
        <p id="opening-hours-status" className={`text-center text-sm sm:text-md font-medium mb-2 ${overallStatusClass}`}>
          {overallStatusText}
        </p>
      )}

      {hasWeekdayText && processedHours.length > 0 ? (
        <div id="opening-hours-grid" className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-gray-700 shadow-sm">
          {processedHours.map((dayInfo) => (
            <div
              key={dayInfo.fullName}
              className={`day-cell flex flex-col items-center justify-start p-1 sm:p-1.5 text-center min-h-[50px] sm:min-h-[60px]
                ${dayInfo.isToday ? 'bg-blue-50 dark:bg-blue-800/70 ring-1 ring-blue-500 dark:ring-blue-600 ring-inset relative z-10' : 'bg-white dark:bg-gray-600/60'}
              `}
            >
              <span
                id={`hours-day-name-${dayInfo.shortName.toLowerCase()}`}
                className={`day-name font-semibold text-[0.6rem] sm:text-[0.65rem] uppercase mb-0.5
                  ${dayInfo.isToday ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-300'}
                `}
              >
                {dayInfo.shortName}
              </span>
              <span
                id={`hours-day-times-${dayInfo.shortName.toLowerCase()}`}
                className={`day-hours text-[0.55rem] sm:text-[0.65rem] leading-tight whitespace-pre-line text-center break-words
                ${dayInfo.hours.toLowerCase() === 'closed' ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-gray-200'}
              `}>
                {/* Replace multiple hyphen variants for consistent line break */}
                {dayInfo.hours.replace(/–| जाम/g, "\n").replace(" - ", "\n").replace(" to ", "\n")}
              </span>
            </div>
          ))}
        </div>
      ) : (
        // Only show this if there was no specific status text and no weekday_text
        (!overallStatusText || overallStatusText === 'Hours status unavailable') && (
          <p id="hours-unavailable-message" className="text-xs text-gray-500 dark:text-gray-400 text-center italic py-2">Weekly hours not available.</p>
        )
      )}
    </div>
  );
};

export default OpeningHoursDisplay;