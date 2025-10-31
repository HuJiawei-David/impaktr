'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, Key, CheckCircle, X as XIcon } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AttendanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (code: string) => Promise<void>;
  eventTitle?: string;
}

export function AttendanceDialog({
  isOpen,
  onClose,
  onConfirm,
  eventTitle
}: AttendanceDialogProps) {
  const [attendanceCode, setAttendanceCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (!isSubmitting) {
      setAttendanceCode('');
      setError(null);
      setIsSuccess(false);
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
      await onConfirm(attendanceCode.trim());
      setIsSuccess(true);
      // Auto close after 2 seconds on success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark attendance');
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

              {/* Requirements Info */}
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                  <div className="font-medium">Requirements:</div>
                  <div>✓ Event has started</div>
                  <div>✓ Attendance tracking is enabled</div>
                  <div>✓ You are a registered participant</div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
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
                      Marking...
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
