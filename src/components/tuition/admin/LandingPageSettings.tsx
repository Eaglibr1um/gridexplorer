import { useState, useEffect } from 'react';
import { Settings, Check } from 'lucide-react';
import { getLandingPagePreference, setLandingPagePreference, getAvailableLandingPages } from '../../../utils/landingPagePreference';

const LandingPageSettings = () => {
  const [currentPreference, setCurrentPreference] = useState<string>('/tuition');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const preference = getLandingPagePreference();
    setCurrentPreference(preference || '/tuition'); // Default to /tuition if no preference
  }, []);

  const handleChange = (value: string) => {
    setCurrentPreference(value);
    setLandingPagePreference(value as any);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const availablePages = getAvailableLandingPages();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          Landing Page Preference
        </h3>
        <p className="text-gray-500 text-sm mt-1">
          Choose where to land upon page visit of /tuition (saved per device)
        </p>
        <p className="text-gray-400 text-xs mt-2 italic">
          💡 To change this later, visit: /tuition?stay=true
        </p>
      </div>
      
      <div className="p-6 space-y-3">
        {availablePages.map((page) => (
          <button
            key={page.value}
            onClick={() => handleChange(page.value)}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              currentPreference === page.value
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-800">{page.label}</div>
                <div className="text-sm text-gray-500 mt-1">{page.description}</div>
              </div>
              {currentPreference === page.value && (
                <div className="p-2 bg-indigo-500 rounded-full">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </button>
        ))}
        {saved && (
          <div className="text-sm text-green-600 font-semibold text-center animate-fade-in">
            ✓ Preference saved!
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPageSettings;

