'use client';

import React, { useState } from 'react';
import { ChevronDown, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { countryCodes, type CountryCode } from '@/constants/country-codes';

interface PhoneInputProps {
  id?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function PhoneInput({
  id,
  label,
  value = '',
  onChange,
  placeholder = 'Enter phone number',
  error,
  required = false,
  className = ''
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(countryCodes[0]); // Default to USA
  const [phoneNumber, setPhoneNumber] = useState(value);

  const handleCountryChange = (country: CountryCode) => {
    setSelectedCountry(country);
    const fullNumber = country.dialCode + phoneNumber.replace(/^\+\d+/, '');
    onChange?.(fullNumber);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value.replace(/^\+\d+/, ''); // Remove existing country code
    setPhoneNumber(number);
    const fullNumber = selectedCountry.dialCode + number;
    onChange?.(fullNumber);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="flex">
        {/* Country Code Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-10 px-3 border-r-0 rounded-r-none border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedCountry.dialCode}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 max-h-60 overflow-y-auto">
            {countryCodes.map((country) => (
              <DropdownMenuItem
                key={country.code}
                onClick={() => handleCountryChange(country)}
                className="flex items-center space-x-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span className="text-lg">{country.flag}</span>
                <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {country.name}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {country.dialCode}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Phone Number Input */}
        <Input
          id={id}
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          className={`h-10 rounded-l-none border-l-0 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          }`}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
