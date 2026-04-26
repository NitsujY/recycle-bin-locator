import type { GeolocationError } from "../types/index";

const POSITION_OPTIONS: PositionOptions = {
  timeout: 10000,
  enableHighAccuracy: false,
  maximumAge: 60000,
};

/**
 * Requests the user's current geolocation position.
 *
 * Wraps `navigator.geolocation.getCurrentPosition` with a 10-second timeout.
 * Rejects with a typed `GeolocationError` on permission denial, unavailability,
 * or timeout. Also rejects if the Geolocation API is not supported by the browser.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export function requestPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      const error: GeolocationError = {
        code: "POSITION_UNAVAILABLE",
        message: "Geolocation is not supported by this browser.",
      };
      reject(error);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(position);
      },
      (positionError) => {
        let error: GeolocationError;

        switch (positionError.code) {
          case positionError.PERMISSION_DENIED:
            error = {
              code: "PERMISSION_DENIED",
              message:
                "Location access was denied. Please enter an address to search.",
            };
            break;
          case positionError.POSITION_UNAVAILABLE:
            error = {
              code: "POSITION_UNAVAILABLE",
              message:
                "Location information is unavailable. Please enter an address to search.",
            };
            break;
          case positionError.TIMEOUT:
            error = {
              code: "TIMEOUT",
              message:
                "Location detection timed out. Please enter an address to search.",
            };
            break;
          default:
            error = {
              code: "POSITION_UNAVAILABLE",
              message:
                "An unknown location error occurred. Please enter an address to search.",
            };
        }

        reject(error);
      },
      POSITION_OPTIONS,
    );
  });
}
