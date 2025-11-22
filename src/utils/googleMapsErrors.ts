// src/utils/googleMapsErrors.ts

/**
 * Google Maps API Error Handling Utilities
 *
 * Provides user-friendly error messages for common Google Maps API restriction errors
 * that may occur when API keys are properly secured with restrictions.
 */

export interface GoogleMapsErrorInfo {
  userMessage: string;
  technicalDetails?: string;
  recoverable: boolean;
  suggestedAction?: string;
}

/**
 * Common Google Maps API error codes and their meanings
 */
export const GOOGLE_MAPS_ERROR_CODES = {
  // Frontend Map Loading Errors
  RefererNotAllowedMapError: 'RefererNotAllowedMapError',
  ApiNotActivatedMapError: 'ApiNotActivatedMapError',
  ApiTargetBlockedMapError: 'ApiTargetBlockedMapError',
  InvalidKeyMapError: 'InvalidKeyMapError',

  // Backend API Errors
  REQUEST_DENIED: 'REQUEST_DENIED',
  OVER_QUERY_LIMIT: 'OVER_QUERY_LIMIT',
  ZERO_RESULTS: 'ZERO_RESULTS',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  NOT_FOUND: 'NOT_FOUND',
} as const;

/**
 * Parse Google Maps error and return user-friendly information
 */
export function parseGoogleMapsError(error: Error | string): GoogleMapsErrorInfo {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorString = errorMessage.toLowerCase();

  // RefererNotAllowedMapError - HTTP referrer restriction blocking the request
  if (errorString.includes('referernotallowedmaperror') || errorString.includes('referer not allowed')) {
    return {
      userMessage: 'Unable to load map from this website. This site may have been accessed from an unauthorized domain.',
      technicalDetails: 'The Google Maps API key has HTTP referrer restrictions that block requests from this domain.',
      recoverable: false,
      suggestedAction: 'Please access this website from its official domain, or contact support if you believe this is an error.'
    };
  }

  // ApiNotActivatedMapError - API not enabled in Google Cloud Console
  if (errorString.includes('apinotactivatedmaperror') || errorString.includes('api not activated')) {
    return {
      userMessage: 'The mapping service is temporarily unavailable.',
      technicalDetails: 'The required Google Maps API is not activated in the Google Cloud Console.',
      recoverable: false,
      suggestedAction: 'Please contact support to resolve this issue.'
    };
  }

  // ApiTargetBlockedMapError - API restriction blocking specific APIs
  if (errorString.includes('apitargetblockedmaperror') || errorString.includes('api target blocked')) {
    return {
      userMessage: 'Some map features are currently unavailable.',
      technicalDetails: 'The API key has restrictions that block access to required APIs.',
      recoverable: false,
      suggestedAction: 'Please contact support to enable additional map features.'
    };
  }

  // InvalidKeyMapError - API key is invalid
  if (errorString.includes('invalidkeymaperror') || errorString.includes('invalid key')) {
    return {
      userMessage: 'Map authentication failed. Please contact support.',
      technicalDetails: 'The Google Maps API key is invalid or malformed.',
      recoverable: false,
      suggestedAction: 'Contact support to resolve this authentication issue.'
    };
  }

  // REQUEST_DENIED - Backend IP restriction or API restriction
  if (errorString.includes('request_denied') || errorString.includes('request denied')) {
    return {
      userMessage: 'Unable to complete your request at this time.',
      technicalDetails: 'The server\'s request was denied by Google Maps API. This may be due to IP address restrictions or API limits.',
      recoverable: true,
      suggestedAction: 'Please try again in a few moments. If the problem persists, contact support.'
    };
  }

  // OVER_QUERY_LIMIT - Daily quota exceeded
  if (errorString.includes('over_query_limit') || errorString.includes('quota') || errorString.includes('limit exceeded')) {
    return {
      userMessage: 'Our map service has reached its daily usage limit.',
      technicalDetails: 'The Google Maps API daily quota has been exceeded.',
      recoverable: true,
      suggestedAction: 'Please try again tomorrow, or contact support for assistance.'
    };
  }

  // ZERO_RESULTS - No results found (not an error, but informational)
  if (errorString.includes('zero_results')) {
    return {
      userMessage: 'No results found for your search.',
      technicalDetails: 'The search or directions request returned no results.',
      recoverable: true,
      suggestedAction: 'Try a different search location or address.'
    };
  }

  // INVALID_REQUEST - Malformed request
  if (errorString.includes('invalid_request')) {
    return {
      userMessage: 'Invalid search request. Please check your input and try again.',
      technicalDetails: 'The request to Google Maps API was malformed.',
      recoverable: true,
      suggestedAction: 'Please verify your search input and try again.'
    };
  }

  // NOT_FOUND - Place or location not found
  if (errorString.includes('not_found')) {
    return {
      userMessage: 'Location not found.',
      technicalDetails: 'The requested place or location could not be found.',
      recoverable: true,
      suggestedAction: 'Please try a different search term or address.'
    };
  }

  // Authentication failure (from gm_authFailure callback)
  if (errorString.includes('authentication failed') || errorString.includes('auth fail')) {
    return {
      userMessage: 'Map authentication failed. The service may have restrictions that prevent loading.',
      technicalDetails: 'Google Maps API authentication failed, possibly due to API key restrictions.',
      recoverable: false,
      suggestedAction: 'Please contact support if this issue persists.'
    };
  }

  // Network/connection errors
  if (errorString.includes('network') || errorString.includes('connection') || errorString.includes('failed to fetch')) {
    return {
      userMessage: 'Unable to connect to map services. Please check your internet connection.',
      technicalDetails: 'Network error while loading Google Maps API.',
      recoverable: true,
      suggestedAction: 'Check your internet connection and try again.'
    };
  }

  // Generic/unknown error
  return {
    userMessage: 'An unexpected error occurred while loading the map.',
    technicalDetails: errorMessage,
    recoverable: true,
    suggestedAction: 'Please refresh the page and try again. If the problem persists, contact support.'
  };
}

/**
 * Format error info into a user-friendly message
 */
export function formatErrorMessage(errorInfo: GoogleMapsErrorInfo, includeAction: boolean = true): string {
  let message = errorInfo.userMessage;

  if (includeAction && errorInfo.suggestedAction) {
    message += ` ${errorInfo.suggestedAction}`;
  }

  return message;
}

/**
 * Log error to console (development only)
 */
export function logGoogleMapsError(error: Error | string, context?: string): void {
  if (import.meta.env.DEV) {
    const errorInfo = parseGoogleMapsError(error);
    console.group(`[Google Maps Error${context ? `: ${context}` : ''}]`);
    console.error('User Message:', errorInfo.userMessage);
    if (errorInfo.technicalDetails) {
      console.error('Technical Details:', errorInfo.technicalDetails);
    }
    if (errorInfo.suggestedAction) {
      console.info('Suggested Action:', errorInfo.suggestedAction);
    }
    console.error('Original Error:', error);
    console.groupEnd();
  }
}
