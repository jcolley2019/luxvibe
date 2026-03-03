import { useState, useEffect } from "react";
import { Cookie, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CookiePolicyModal } from "./CookiePolicyModal";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  
  const [preferences, setPreferences] = useState({
    strictlyNecessary: true,
    analytical: true,
  });

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }

    const handleOpenConsent = () => setIsVisible(true);
    window.addEventListener("open-cookie-consent", handleOpenConsent);
    return () => window.removeEventListener("open-cookie-consent", handleOpenConsent);
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    localStorage.setItem("cookie-preferences", JSON.stringify(preferences));
    setIsVisible(false);
    setShowPreferences(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookie-consent", "rejected");
    setPreferences({
      strictlyNecessary: true,
      analytical: false,
    });
    setIsVisible(false);
    setShowPreferences(false);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  if (!isVisible) return (
    <CookiePolicyModal open={policyOpen} onClose={() => setPolicyOpen(false)} />
  );

  return (
    <>
      <CookiePolicyModal open={policyOpen} onClose={() => setPolicyOpen(false)} />
      
      <div className="fixed bottom-6 left-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-sm w-full">
        <div className="bg-background border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[70vh]">
          {/* Header */}
          <div className="p-6 pb-0">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-muted rounded-xl">
                <Cookie className="w-6 h-6 text-foreground" />
              </div>
              <button 
                onClick={() => setIsVisible(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {showPreferences ? "Manage Cookie Preferences" : "Cookie preferences"}
            </h3>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-2">
            {!showPreferences ? (
              <>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  To learn more about the types of cookies we use, read our{" "}
                  <button 
                    onClick={() => setPolicyOpen(true)}
                    className="underline hover:text-foreground transition-colors"
                  >
                    cookie policy.
                  </button>
                </p>
              </>
            ) : (
              <div className="space-y-4 pb-4">
                <div className="text-sm text-foreground space-y-4">
                  <p className="font-medium">Somebody said ... cookies?</p>
                  <p className="text-muted-foreground leading-relaxed">
                    We are a registered company, incorporated in Ireland with VAT/TAX reference IE3388031IH. Our registered address is located at 4 Waterloo Rd, Ballsbridge, Dublin, D04 AOX3 Ireland.
                  </p>
                  
                  <div>
                    <p className="font-semibold mb-2">Information about use of Cookies</p>
                    <p className="text-muted-foreground leading-relaxed">
                      Our website, demo-whitelabel.nuitee.link, utilizes cookies to differentiate you from other users of our website. This enables us to enhance your browsing experience and make improvements to our site.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">What Are Cookies?</p>
                    <p className="text-muted-foreground leading-relaxed">
                      A cookie is a small file consisting of letters and numbers that we store on your browser or computer's hard drive with your consent. Cookies contain information that is transferred to your computer's hard drive. Cookies play a vital role in ensuring a consistent and efficient experience for users of our website. They are text-only strings of information that our website transfers to the cookie file in your browser's hard disk. This allows the website to remember your identity, either for a single visit or multiple...
                    </p>
                  </div>
                </div>

                {/* Preference Toggles */}
                <div className="space-y-3">
                  <div className="border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <button 
                        onClick={() => toggleSection('strictly')}
                        className="flex items-center gap-2 font-semibold text-sm"
                      >
                        {expandedSections.includes('strictly') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        Strictly Necessary cookies
                      </button>
                      <Switch checked={true} disabled />
                    </div>
                    {expandedSections.includes('strictly') && (
                      <p className="text-xs text-muted-foreground pl-6">
                        These cookies are essential for the proper functioning of the website and cannot be disabled.
                      </p>
                    )}
                  </div>

                  <div className="border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <button 
                        onClick={() => toggleSection('analytical')}
                        className="flex items-center gap-2 font-semibold text-sm"
                      >
                        {expandedSections.includes('analytical') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        Analytical cookies
                      </button>
                      <Switch 
                        checked={preferences.analytical} 
                        onCheckedChange={(v) => setPreferences(p => ({ ...p, analytical: v }))} 
                      />
                    </div>
                    {expandedSections.includes('analytical') && (
                      <p className="text-xs text-muted-foreground pl-6">
                        These cookies collect information about how you use our website. All of the data is anonymized and cannot be used to identify you.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 pt-2">
            <div className="flex gap-3 mb-4">
              <Button
                variant="outline"
                className="flex-1 rounded-xl py-6 text-base font-medium"
                onClick={handleReject}
              >
                Reject
              </Button>
              <Button
                className="flex-1 rounded-xl py-6 text-base font-medium bg-[#0a001a] hover:bg-[#0a001a]/90 text-white"
                onClick={handleAccept}
              >
                Accept
              </Button>
            </div>

            {!showPreferences && (
              <div className="text-center">
                <button 
                  onClick={() => setShowPreferences(true)}
                  className="text-sm font-medium underline hover:text-foreground transition-colors"
                >
                  Cookie preferences
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
