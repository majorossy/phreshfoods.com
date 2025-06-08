// src/components/UI/OpeningHoursDisplay.tsx
import React from 'react';
import { PlaceOpeningHours, PlaceDetails } from '../../types'; // Adjust path as needed
import { escapeHTMLSafe } from '../../utils'; // Adjust path

interface OpeningHoursDisplayProps {
  openingHours?: PlaceOpeningHours | null;
  businessStatus?: PlaceDetails['business_status'] | null;
  // Or you could pass the whole placeDetails:
  // placeDetails?: PlaceDetails | null;
}

const OpeningHoursDisplay: React.FC<OpeningHoursDisplayProps> = ({
  openingHours,
  businessStatus,
}) => {
  let overallStatusText = '';
  let overallStatusClass = 'text-gray-600 dark:text-gray-400';

  if (businessStatus && businessStatus !== "OPERATIONAL") {
    switch (businessStatus) {
      case "CLOSED_TEMPORARILY":
        overallStatusText = "Temporarily Closed";
        overallStatusClass = 'text-yellow-600 dark:text-yellow-400 font-semibold';
        break;
      case "CLOSED_PERMANENTLY":
        overallStatusText = "Permanently Closed";
        overallStatusClass = 'text-red-600 dark:text-red-400 font-semibold';
        break;
      default:
        overallStatusText = "Status: " + escapeHTMLSafe(String(businessStatus).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()));
        overallStatusClass = 'text-orange-600 dark:text-orange-400 font-semibold';
    }
  } else if (openingHours && typeof openingHours.open_now === 'boolean') {
    overallStatusText = openingHours.open_now ? 'Open Now' : 'Closed Now';
    overallStatusClass = openingHours.open_now
      ? 'text-green-600 dark:text-green-400 font-semibold'
      : 'text-red-600 dark:text-red-400 font-semibold';
  } else if (!openingHours && !businessStatus) {
    // Only show "unavailable" if neither opening_hours nor business_status is present
    overallStatusText = 'Hours status unavailable';
  }


  // Recreate the days order for consistent display, today first
  const daysOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayIndex = new Date().getDay();
  // Rotate array so today is first
  const orderedDaysForDisplay = [
    ...daysOrder.slice(todayIndex),
    ...daysOrder.slice(0, todayIndex)
  ];

  const hasWeekdayText = openingHours?.weekday_text && openingHours.weekday_text.length === 7;

  return (
    <div className="space-y-3">
      {overallStatusText && (
        <p className={`text-center text-md font-medium mb-3 ${overallStatusClass}`}>
          {overallStatusText}
        </p>
      )}

      {hasWeekdayText ? (
        <ul className="space-y-1.5 text-sm">
          {orderedDaysForDisplay.map(dayFullName => {
            // Find the corresponding hours string from weekday_text
            // weekday_text might not be ordered, so we find it by day name
            const hoursLine = openingHours!.weekday_text!.find(line => line.startsWith(dayFullName));
            if (!hoursLine) return null;

            const [day, ...hoursParts] = hoursLine.split(/:\s*(.*)/s);
            const hoursString = hoursParts.join(': ').trim();
            const isToday = dayFullName === daysOrder[todayIndex];

            return (
              <li key={dayFullName} className={`flex justify-between items-center p-1 rounded ${isToday ? 'bg-blue-50 dark:bg-blue-900/30 font-semibold' : ''}`}>
                <span className={`capitalize ${isToday ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300'}`}>{day}:</span>
                <span className={`text-right ${
                  hoursString.toLowerCase() === 'closed' ? 'text-red-500 dark:text-red-400'
                  : hoursString.toLowerCase() === 'open 24 hours' ? 'text-green-500 dark:text-green-400'
                  : 'text-gray-800 dark:text-gray-100'
                }`}>
                  {hoursString.toLowerCase() === 'open 24 hours' ? '24 Hours' : hoursString}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        // Only show this if there was no overall status either (or if it was generic)
        (!overallStatusText || overallStatusText === 'Hours status unavailable') && (
          <p className="text-gray-500 dark:text-gray-400 text-center">Weekly hours not available.</p>
        )
      )}
    </div>
  );
};

export default OpeningHoursDisplay;