import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

interface Country {
  name: {
    common: string;
    official: string;
  };
  idd: {
    root: string;
    suffixes: string[];
  };
}

interface ExtendedCountry extends Country {
  phoneCode: string;
}

interface CountryCodeSelectorProps {
  value: string;
  onChange: (code: string) => void;
  darkMode: boolean;
  onClose?: () => void;
}

export function CountryCodeSelector({ value, onChange, darkMode, onClose }: CountryCodeSelectorProps) {
  const [countries, setCountries] = useState<ExtendedCountry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchCountries = async () => {
    try {
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,idd');
      const data = await response.json();
      
      // Filter countries that have phone codes and sort by name
      const validCountries: ExtendedCountry[] = data
        .filter((country: Country) => country.idd && country.idd.root && country.idd.suffixes.length > 0)
        .map((country: Country) => ({
          ...country,
          phoneCode: `${country.idd.root}${country.idd.suffixes[0]}`
        }))
        .sort((a: ExtendedCountry, b: ExtendedCountry) => a.name.common.localeCompare(b.name.common));
      
      setCountries(validCountries);
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCountries = countries.filter(country =>
    country.name.common.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.phoneCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCountry = countries.find(country => country.phoneCode === value);

  if (loading) {
    return (
      <div className={`w-32 px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white'}`}>
        <div className="animate-pulse h-4 bg-gray-300 rounded"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-32 px-3 py-2 border rounded-lg text-left flex items-center justify-between focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white'
        }`}
      >
        <span className="truncate">
          {selectedCountry ? selectedCountry.phoneCode : '+91'}
        </span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className={`country-dropdown-scroll absolute bottom-full mb-1 w-64 max-h-60 overflow-y-auto z-20 border rounded-lg shadow-lg ${
            darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
          }`}
        >
          <div className="p-2">
            <input
              type="text"
              placeholder="Search country or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white'
              }`}
            />
          </div>
          
          <div className="max-h-48">
            {filteredCountries.map((country) => (
              <button
                key={`${country.name.common}-${country.phoneCode}`}
                type="button"
                onClick={() => {
                  onChange(country.phoneCode);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                className={`w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center justify-between ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                <span className="truncate">{country.name.common}</span>
                <span className="font-mono text-sm ml-2">{country.phoneCode}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
