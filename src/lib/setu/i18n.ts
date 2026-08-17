export type Language = "en" | "hi" | "gu";

/**
 * UI strings for the assistant. Security terminology is kept explicit and
 * unambiguous in every language — meaning is never softened by translation.
 */
const EN = {
    localeTag: "en-IN",
    languageLabel: "Language",
    conversation: "Secure conversation",
    gatewayActive: "Gateway active",
    clear: "Clear",
    emptyTitle: "No questions yet",
    emptyBody:
      "Ask about leave, LTC, transfers, attendance or welfare schemes — or use a demo scenario.",
    placeholder: "Type or speak your question…",
    send: "Send",
    yourQuestion: "Your question",
    loading: "Scanning input, checking authorisation and retrieving authorised sources…",
    micStart: "Start voice input",
    micStop: "Stop voice input",
    listening: "Listening…",
    micUnsupported: "Voice input is not supported by this browser.",
    micDenied: "Microphone permission was denied. Enable it in your browser settings to speak.",
    micNoSpeech: "No speech was detected. Please try again.",
    micNetwork: "Speech recognition could not reach the network. Please try again.",
    micError: "Voice input could not be completed. You can type your question instead.",
    micHint: "Speech is converted to text only. Review and edit it before sending.",
    inputWarning:
      "Never enter passwords, OTPs or access tokens. The gateway blocks and discards them.",
    answer: "Answer",
    sources: "Sources",
    viewSource: "View source",
    confidence: "Confidence",
    securityPassed: "Security check passed",
    securityProtected: "Request protected",
    securityBlocked: "Request blocked",
    accessAuthorised: "Access authorised",
    accessDenied: "Access denied",
    humanApproval: "Human approval required",
    requestReview: "Request human review",
    reportAnswer: "Report incorrect answer",
    outputRedacted: "Output redacted",
    lowConfidence:
      "Low confidence. Human verification is recommended before acting on this answer.",
    piiProtected:
      "Sensitive personal information was detected and protected. Only the redacted text reached the AI system.",
    credentialBlocked:
      "Sensitive credentials cannot be processed by SetuAI. The value was blocked before reaching the AI system and was not stored.",
    blockedGeneric:
      "This request cannot be processed because it contains information or requests that require additional authorization.",
    conflict: "Policy conflict detected",
    oldPolicy: "Old version",
    newPolicy: "New version",
    noSource:
      "No authoritative source was found, so no answer is asserted. SetuAI does not invent government rules.",
    gatewayError:
      "The security gateway could not complete this request. Please retry; if the problem persists, contact your department IT desk.",
    monitoringNote: "Security monitoring is used to protect government information.",
    trace: "Gateway controls applied",
};

export type Strings = typeof EN;

const HI: Strings = {
    localeTag: "hi-IN",
    languageLabel: "भाषा",
    conversation: "सुरक्षित संवाद",
    gatewayActive: "गेटवे सक्रिय",
    clear: "साफ़ करें",
    emptyTitle: "अभी कोई प्रश्न नहीं",
    emptyBody:
      "अवकाश, एलटीसी, स्थानांतरण, उपस्थिति या कल्याण योजनाओं के बारे में पूछें — या डेमो परिदृश्य चुनें।",
    placeholder: "अपना प्रश्न लिखें या बोलें…",
    send: "भेजें",
    yourQuestion: "आपका प्रश्न",
    loading: "इनपुट की जाँच, प्राधिकरण सत्यापन और अधिकृत स्रोतों की खोज जारी है…",
    micStart: "ध्वनि इनपुट शुरू करें",
    micStop: "ध्वनि इनपुट बंद करें",
    listening: "सुन रहा है…",
    micUnsupported: "यह ब्राउज़र ध्वनि इनपुट का समर्थन नहीं करता।",
    micDenied: "माइक्रोफ़ोन की अनुमति अस्वीकृत है। बोलने के लिए ब्राउज़र सेटिंग में अनुमति दें।",
    micNoSpeech: "कोई आवाज़ नहीं मिली। कृपया पुनः प्रयास करें।",
    micNetwork: "ध्वनि पहचान नेटवर्क तक नहीं पहुँच सकी। कृपया पुनः प्रयास करें।",
    micError: "ध्वनि इनपुट पूरा नहीं हो सका। आप प्रश्न टाइप कर सकते हैं।",
    micHint: "आवाज़ केवल टेक्स्ट में बदली जाती है। भेजने से पहले उसे जाँचें और संपादित करें।",
    inputWarning:
      "पासवर्ड, ओटीपी या एक्सेस टोकन कभी दर्ज न करें। गेटवे उन्हें ब्लॉक कर देता है।",
    answer: "उत्तर",
    sources: "स्रोत",
    viewSource: "स्रोत देखें",
    confidence: "विश्वास स्तर",
    securityPassed: "सुरक्षा जाँच उत्तीर्ण",
    securityProtected: "अनुरोध सुरक्षित किया गया",
    securityBlocked: "अनुरोध अवरुद्ध",
    accessAuthorised: "पहुँच अधिकृत",
    accessDenied: "पहुँच अस्वीकृत",
    humanApproval: "मानवीय अनुमोदन आवश्यक",
    requestReview: "मानवीय समीक्षा का अनुरोध करें",
    reportAnswer: "गलत उत्तर की सूचना दें",
    outputRedacted: "आउटपुट संपादित (redacted)",
    lowConfidence: "विश्वास स्तर कम है। कार्रवाई से पहले मानवीय सत्यापन की सलाह दी जाती है।",
    piiProtected:
      "संवेदनशील व्यक्तिगत जानकारी पाई गई और सुरक्षित की गई। केवल संपादित पाठ ही एआई तक पहुँचा।",
    credentialBlocked:
      "संवेदनशील क्रेडेंशियल SetuAI द्वारा संसाधित नहीं किए जा सकते। मान एआई तक पहुँचने से पहले अवरुद्ध किया गया और संग्रहीत नहीं किया गया।",
    blockedGeneric:
      "यह अनुरोध संसाधित नहीं किया जा सकता क्योंकि इसमें ऐसी जानकारी या माँग है जिसके लिए अतिरिक्त प्राधिकरण आवश्यक है।",
    conflict: "नीति विरोध पाया गया",
    oldPolicy: "पुराना संस्करण",
    newPolicy: "नया संस्करण",
    noSource:
      "कोई आधिकारिक स्रोत नहीं मिला, इसलिए कोई उत्तर नहीं दिया गया। SetuAI सरकारी नियम स्वयं नहीं बनाता।",
    gatewayError:
      "सुरक्षा गेटवे यह अनुरोध पूरा नहीं कर सका। पुनः प्रयास करें; समस्या बनी रहे तो विभागीय आईटी डेस्क से संपर्क करें।",
    monitoringNote: "सरकारी सूचना की सुरक्षा हेतु सुरक्षा निगरानी लागू है।",
    trace: "लागू गेटवे नियंत्रण",
};

const GU: Strings = {
    localeTag: "gu-IN",
    languageLabel: "ભાષા",
    conversation: "સુરક્ષિત વાતચીત",
    gatewayActive: "ગેટવે સક્રિય",
    clear: "સાફ કરો",
    emptyTitle: "હજી કોઈ પ્રશ્ન નથી",
    emptyBody:
      "રજા, એલટીસી, બદલી, હાજરી કે કલ્યાણ યોજનાઓ વિશે પૂછો — અથવા ડેમો પરિદૃશ્ય પસંદ કરો.",
    placeholder: "તમારો પ્રશ્ન લખો અથવા બોલો…",
    send: "મોકલો",
    yourQuestion: "તમારો પ્રશ્ન",
    loading: "ઇનપુટ તપાસ, અધિકૃતતા ચકાસણી અને અધિકૃત સ્રોતોની શોધ ચાલુ છે…",
    micStart: "વૉઇસ ઇનપુટ શરૂ કરો",
    micStop: "વૉઇસ ઇનપુટ બંધ કરો",
    listening: "સાંભળી રહ્યું છે…",
    micUnsupported: "આ બ્રાઉઝર વૉઇસ ઇનપુટને સપોર્ટ કરતું નથી.",
    micDenied: "માઇક્રોફોનની પરવાનગી નકારાઈ છે. બોલવા માટે બ્રાઉઝર સેટિંગમાં પરવાનગી આપો.",
    micNoSpeech: "કોઈ અવાજ મળ્યો નથી. કૃપા કરીને ફરી પ્રયાસ કરો.",
    micNetwork: "વૉઇસ ઓળખ નેટવર્ક સુધી પહોંચી શકી નથી. ફરી પ્રયાસ કરો.",
    micError: "વૉઇસ ઇનપુટ પૂર્ણ થઈ શક્યું નથી. તમે પ્રશ્ન ટાઇપ કરી શકો છો.",
    micHint: "અવાજ ફક્ત ટેક્સ્ટમાં રૂપાંતરિત થાય છે. મોકલતા પહેલાં તપાસો અને સંપાદિત કરો.",
    inputWarning:
      "પાસવર્ડ, ઓટીપી કે એક્સેસ ટોકન ક્યારેય દાખલ ન કરો. ગેટવે તેમને બ્લોક કરે છે.",
    answer: "જવાબ",
    sources: "સ્રોત",
    viewSource: "સ્રોત જુઓ",
    confidence: "વિશ્વાસ સ્તર",
    securityPassed: "સુરક્ષા ચકાસણી પાસ",
    securityProtected: "વિનંતી સુરક્ષિત કરાઈ",
    securityBlocked: "વિનંતી બ્લોક કરાઈ",
    accessAuthorised: "પ્રવેશ અધિકૃત",
    accessDenied: "પ્રવેશ નામંજૂર",
    humanApproval: "માનવ મંજૂરી જરૂરી",
    requestReview: "માનવ સમીક્ષાની વિનંતી કરો",
    reportAnswer: "ખોટા જવાબની જાણ કરો",
    outputRedacted: "આઉટપુટ સંપાદિત (redacted)",
    lowConfidence: "વિશ્વાસ સ્તર ઓછું છે. પગલાં લેતા પહેલાં માનવ ચકાસણી સૂચવાય છે.",
    piiProtected:
      "સંવેદનશીલ વ્યક્તિગત માહિતી મળી અને સુરક્ષિત કરાઈ. ફક્ત સંપાદિત લખાણ જ એઆઈ સુધી પહોંચ્યું.",
    credentialBlocked:
      "સંવેદનશીલ ક્રેડેન્શિયલ SetuAI દ્વારા પ્રોસેસ કરી શકાતા નથી. મૂલ્ય એઆઈ સુધી પહોંચે તે પહેલાં બ્લોક કરાયું અને સંગ્રહાયું નથી.",
    blockedGeneric:
      "આ વિનંતી પ્રોસેસ કરી શકાતી નથી કારણ કે તેમાં એવી માહિતી કે માંગ છે જેને વધારાની અધિકૃતતા જરૂરી છે.",
    conflict: "નીતિ વિરોધાભાસ મળ્યો",
    oldPolicy: "જૂનું સંસ્કરણ",
    newPolicy: "નવું સંસ્કરણ",
    noSource:
      "કોઈ અધિકૃત સ્રોત મળ્યો નથી, તેથી કોઈ જવાબ આપવામાં આવ્યો નથી. SetuAI સરકારી નિયમો જાતે બનાવતું નથી.",
    gatewayError:
      "સુરક્ષા ગેટવે આ વિનંતી પૂર્ણ કરી શક્યું નથી. ફરી પ્રયાસ કરો; સમસ્યા રહે તો વિભાગીય આઈટી ડેસ્કનો સંપર્ક કરો.",
    monitoringNote: "સરકારી માહિતીની સુરક્ષા માટે સુરક્ષા મોનિટરિંગ લાગુ છે.",
  trace: "લાગુ ગેટવે નિયંત્રણો",
};

export const STRINGS: Record<Language, Strings> = { en: EN, hi: HI, gu: GU };

export function t(language: Language): Strings {
  return STRINGS[language] ?? STRINGS.en;
}

export const LANGUAGE_OPTIONS: { value: Language; label: string; speech: string }[] = [
  { value: "en", label: "English", speech: "en-IN" },
  { value: "hi", label: "हिन्दी", speech: "hi-IN" },
  { value: "gu", label: "ગુજરાતી", speech: "gu-IN" },
];

export function speechLocale(language: Language): string {
  return LANGUAGE_OPTIONS.find((l) => l.value === language)?.speech ?? "en-IN";
}

export const LANGUAGE_NAME: Record<Language, string> = {
  en: "English",
  hi: "Hindi",
  gu: "Gujarati",
};
