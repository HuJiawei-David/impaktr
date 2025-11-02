'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, Key, CheckCircle, X as XIcon, MapPin, Navigation, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { calculateDistance } from '@/lib/utils';

interface AttendanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (code: string, coordinates?: { lat: number; lng: number }) => Promise<void>;
  eventTitle?: string;
  isVirtual?: boolean;
  hasCoordinates?: boolean; // Whether the event has location coordinates (for location verification)
  eventCoordinates?: { lat: number; lng: number }; // Event location coordinates for comparison
}

export function AttendanceDialog({
  isOpen,
  onClose,
  onConfirm,
  eventTitle,
  isVirtual = false,
  hasCoordinates = false,
  eventCoordinates
}: AttendanceDialogProps) {
  const [attendanceCode, setAttendanceCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);

  // Check location permission status when dialog opens
  React.useEffect(() => {
    if (isOpen && !isVirtual && eventCoordinates) {
      checkLocationPermission();
    }
  }, [isOpen, isVirtual, eventCoordinates]);

  const checkLocationPermission = async () => {
    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setLocationPermission(result.state);
        
        // Listen for permission changes
        result.addEventListener('change', () => {
          setLocationPermission(result.state);
        });
      } else {
        setLocationPermission('unknown');
      }
    } catch (err) {
      console.log('[Attendance] Permission API not supported');
      setLocationPermission('unknown');
    }
  };

  // Note: We'll get user location on-demand when they try to submit, not immediately on open

  if (!isOpen) return null;

  const handleClose = () => {
    if (!isSubmitting) {
      setAttendanceCode('');
      setError(null);
      setIsSuccess(false);
      setUserCoordinates(null);
      setDistance(null);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!attendanceCode.trim()) {
      setError('Please enter the attendance code');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Only require location if event is non-virtual AND has valid coordinates
      // If event doesn't have coordinates, location verification is not possible/required
      let coordinates: { lat: number; lng: number } | undefined;
      
      // Check if event has valid coordinates (both lat and lng must be valid numbers)
      const hasValidCoordinates = eventCoordinates && 
        typeof eventCoordinates.lat === 'number' && 
        typeof eventCoordinates.lng === 'number' &&
        !isNaN(eventCoordinates.lat) && 
        !isNaN(eventCoordinates.lng);
      
      if (!isVirtual && hasValidCoordinates) {
        // For non-virtual events WITH coordinates, location is REQUIRED for attendance verification
        // Always fetch fresh location to ensure accuracy
        setIsGettingLocation(true);
        try {
          // Check if geolocation is supported
          if (!navigator.geolocation) {
            throw new Error('Geolocation is not supported by your browser. Please use a modern browser (Chrome, Firefox, Safari, or Edge).');
          }

          console.log('[Attendance] Requesting user location for verification...');
          
          // Get user's current position using browser's geolocation API
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            // Use standard geolocation API with optimal settings
            navigator.geolocation.getCurrentPosition(
              (position) => {
                console.log('[Attendance] Location received successfully:', {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  timestamp: position.timestamp
                });
                resolve(position);
              },
              (error) => {
                console.error('[Attendance] Geolocation API error:', {
                  code: error.code,
                  message: error.message,
                  PERMISSION_DENIED: error.code === 1,
                  POSITION_UNAVAILABLE: error.code === 2,
                  TIMEOUT: error.code === 3
                });
                reject(error);
              },
              { 
                timeout: 30000,  // Increased timeout to 30 seconds for better reliability
                enableHighAccuracy: true,  // Use GPS if available
                maximumAge: 60000  // Accept cached position if less than 1 minute old
              }
            );
          });
          
          coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          // Validate coordinates are valid numbers
          if (isNaN(coordinates.lat) || isNaN(coordinates.lng)) {
            throw new Error('Invalid location data received. Please ensure location services are enabled.');
          }
          
          // Store user coordinates and calculate distance
          setUserCoordinates(coordinates);
          const calculatedDistance = calculateDistance(
            coordinates.lat,
            coordinates.lng,
            eventCoordinates.lat,
            eventCoordinates.lng
          );
          setDistance(calculatedDistance);
          
          console.log('[Attendance] Distance from event:', calculatedDistance.toFixed(3), 'km (', (calculatedDistance * 1000).toFixed(0), 'meters)');
          
          // Check if within 200 meters (0.2 km)
          if (calculatedDistance > 0.2) {
            const distanceInMeters = (calculatedDistance * 1000).toFixed(0);
            setError(
              `You are too far from the event location. Distance: ${distanceInMeters} meters. ` +
              `Please be within 200 meters of the event location to mark attendance.`
            );
            setIsSubmitting(false);
            setIsGettingLocation(false);
            return;
          }
          
          console.log('[Attendance] Location verified successfully within 200 meters');
          setIsGettingLocation(false);
        } catch (locationError: any) {
          console.error('[Attendance] Geolocation error:', locationError);
          console.error('[Attendance] Error details:', {
            code: locationError.code,
            message: locationError.message,
            PERMISSION_DENIED: locationError.code === 1,
            POSITION_UNAVAILABLE: locationError.code === 2,
            TIMEOUT: locationError.code === 3
          });
          
          // Provide user-friendly error messages based on error type
          let errorMessage = 'Unable to get your location.';
          let showGuide = false;
          
          // GeolocationPositionError has constant values:
          // PERMISSION_DENIED = 1
          // POSITION_UNAVAILABLE = 2
          // TIMEOUT = 3
          if (locationError.code !== undefined) {
            console.log('[Attendance] Error code:', locationError.code);
            switch (locationError.code) {
              case 1: // PERMISSION_DENIED
                errorMessage = 'Location permission was denied.';
                showGuide = true;
                setLocationPermission('denied');
                break;
              case 2: // POSITION_UNAVAILABLE
                errorMessage = 'Location information is unavailable. Please ensure your device has location services (GPS) enabled.';
                break;
              case 3: // TIMEOUT
                errorMessage = 'Location request timed out. Please try again and ensure your GPS is enabled.';
                break;
              default:
                errorMessage = locationError.message || 'Unable to get your location. Please ensure location services are enabled.';
            }
          } else if (locationError instanceof Error) {
            errorMessage = locationError.message;
          } else if (locationError && typeof locationError === 'object' && 'message' in locationError) {
            errorMessage = String(locationError.message);
          }
          
          setError(errorMessage);
          setShowPermissionGuide(showGuide);
          setIsSubmitting(false);
          setIsGettingLocation(false);
          return;
        }
      }
      // For virtual events or events without coordinates, location is not required

      await onConfirm(attendanceCode.trim(), coordinates);
      setIsSuccess(true);
      // Auto close after 2 seconds on success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark attendance. Please try again.');
      setIsGettingLocation(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && attendanceCode.trim() && !isSubmitting && !isSuccess) {
      handleSubmit(e);
    }
    if (e.key === 'Escape' && !isSubmitting) {
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {/* Icon and Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Mark Attendance
          </h3>
        </div>
        
        {/* Success Message */}
        {isSuccess ? (
          <div className="py-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
                  Attendance Marked Successfully!
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Your attendance has been recorded. The organizer can see your attendance timestamp.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Description */}
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              Enter the attendance code provided by the event organizer to mark your attendance.
            </p>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="attendance-code" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Attendance Code
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <Input
                    id="attendance-code"
                    type="text"
                    value={attendanceCode}
                    onChange={(e) => {
                      setAttendanceCode(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="pl-10"
                    autoFocus
                    autoComplete="off"
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter the 6-digit attendance code displayed by the organizer
                </p>
              </div>

              {/* Location Permission Warning */}
              {!isVirtual && eventCoordinates && typeof eventCoordinates.lat === 'number' && typeof eventCoordinates.lng === 'number' && locationPermission === 'denied' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-red-900 dark:text-red-300 mb-2">
                        Location Permission Required
                      </div>
                      <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                        Location access is blocked for this site. You need to enable it to mark attendance.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPermissionGuide(!showPermissionGuide)}
                        className="text-xs"
                      >
                        {showPermissionGuide ? 'Hide Guide' : 'Show How to Enable'}
                      </Button>
                      {showPermissionGuide && (
                        <div className="mt-3 p-3 bg-white dark:bg-red-950/50 rounded text-xs space-y-2">
                          <p className="font-semibold">Chrome / Edge / Brave:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Click the 🔒 lock icon or ⓘ info icon in the address bar</li>
                            <li>Find "Location" in the permissions list</li>
                            <li>Change it from "Block" to "Allow"</li>
                            <li>Refresh this page and try again</li>
                          </ol>
                          <p className="font-semibold mt-3">Safari:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Open Safari → Settings → Websites → Location</li>
                            <li>Find this website in the list</li>
                            <li>Change permission to "Allow"</li>
                            <li>Refresh this page and try again</li>
                          </ol>
                          <p className="font-semibold mt-3">Firefox:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Click the 🔒 lock icon in the address bar</li>
                            <li>Click "Clear cookies and site data"</li>
                            <li>Refresh the page and allow location when prompted</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Location Verification Info */}
              {!isVirtual && eventCoordinates && typeof eventCoordinates.lat === 'number' && typeof eventCoordinates.lng === 'number' && locationPermission !== 'denied' && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                        Location Verification Required
                      </div>
                      <div className="space-y-2 text-xs text-blue-700 dark:text-blue-300">
                        {locationPermission === 'granted' && (
                          <div className="flex items-center gap-2 p-2 bg-green-100 dark:bg-green-900/40 rounded text-green-700 dark:text-green-300">
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                            <span>Location permission granted ✓</span>
                          </div>
                        )}
                        {isGettingLocation && (
                          <div className="flex items-center gap-2 p-2 bg-blue-100 dark:bg-blue-900/40 rounded">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                            <span>Getting your current location...</span>
                          </div>
                        )}
                        {userCoordinates && !isGettingLocation && distance !== null && (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2 p-2 bg-white dark:bg-blue-950/50 rounded">
                              <Navigation className="w-4 h-4 flex-shrink-0" />
                              <div className="flex-1">
                                <span className="font-medium">Your distance from event: </span>
                                <span className="font-bold text-base">
                                  {(distance * 1000).toFixed(0)} meters
                                </span>
                              </div>
                            </div>
                            {distance <= 0.2 ? (
                              <div className="flex items-center gap-2 p-2 bg-green-100 dark:bg-green-900/40 rounded text-green-700 dark:text-green-300">
                                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                <span className="font-medium">You are within 200 meters - attendance allowed! ✓</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 p-2 bg-red-100 dark:bg-red-900/40 rounded text-red-700 dark:text-red-300">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span className="font-medium">You must be within 200 meters to mark attendance</span>
                              </div>
                            )}
                          </div>
                        )}
                        {!isGettingLocation && !userCoordinates && (
                          <div className="text-xs opacity-90 p-2 bg-blue-100 dark:bg-blue-900/40 rounded">
                            <p className="font-medium mb-1">📍 Location verification will start when you click "Mark Attendance"</p>
                            <p>You must be within 200 meters of the event location. {locationPermission === 'prompt' && 'You will be asked to allow location access.'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Requirements Info */}
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1.5">
                  <div className="font-semibold text-sm mb-2">Requirements:</div>
                  <div className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Event has started</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Attendance tracking is enabled</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>✓</span>
                    <span>You are a registered participant</span>
                  </div>
                  {!isVirtual && eventCoordinates && typeof eventCoordinates.lat === 'number' && typeof eventCoordinates.lng === 'number' && (
                    <>
                      <div className="flex items-start gap-2">
                        <span>✓</span>
                        <span>Location services enabled (required for verification)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className={userCoordinates && distance !== null ? (distance <= 0.2 ? '✓' : '✗') : '○'}>
                          {userCoordinates && distance !== null ? (distance <= 0.2 ? '✓' : '✗') : '○'}
                        </span>
                        <div className="flex-1">
                          <span>Within 200 meters of event location</span>
                          {userCoordinates && distance !== null && (
                            <span className={`ml-2 font-bold ${distance <= 0.2 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                              (Current: {(distance * 1000).toFixed(0)}m)
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && !showPermissionGuide && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                      {locationPermission === 'denied' && (
                        <button
                          type="button"
                          onClick={() => setShowPermissionGuide(true)}
                          className="text-xs text-red-700 dark:text-red-300 underline mt-1 hover:text-red-800 dark:hover:text-red-200"
                        >
                          Click here to see how to enable location access
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !attendanceCode.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white border-0"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {isGettingLocation ? 'Getting Location...' : 'Marking...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Attendance
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
