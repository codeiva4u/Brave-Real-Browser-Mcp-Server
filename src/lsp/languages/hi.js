/**
 * Hindi Language Pack for LSP - हिंदी भाषा पैक
 */

module.exports = {
  tools: {
    browser_init: { label: 'ब्राउज़र शुरू करें', detail: 'Brave ब्राउज़र स्टेल्थ मोड में', documentation: 'Brave ब्राउज़र को एंटी-डिटेक्शन के साथ लॉन्च करता है।', parameters: { headless: 'बिना विंडो चलाएं', proxy: 'प्रॉक्सी कॉन्फ़िगरेशन', turnstile: 'Turnstile ऑटो-सॉल्वर', enableBlocker: 'एड ब्लॉकिंग' } },
    navigate: { label: 'URL पर जाएं', detail: 'वेबपेज पर जाएं', documentation: 'ब्राउज़र को URL पर ले जाता है।', parameters: { url: 'जाने का URL', waitUntil: 'नेविगेशन पूरा कब', timeout: 'अधिकतम समय' } },
    get_content: { label: 'कंटेंट लें', detail: 'पेज से कंटेंट', documentation: 'पेज कंटेंट प्राप्त करता है।', parameters: { format: 'फॉर्मेट', selector: 'CSS selector' } },
    wait: { label: 'इंतजार करें', detail: 'एलीमेंट का इंतजार', documentation: 'शर्त पूरी होने तक रुकता है।', parameters: { type: 'इंतजार प्रकार', value: 'Selector या समय', timeout: 'अधिकतम' } },
    click: { label: 'क्लिक करें', detail: 'मानव-जैसा क्लिक', documentation: 'ghost-cursor से क्लिक करता है।', parameters: { selector: 'एलीमेंट selector', humanLike: 'वास्तविक मूवमेंट', clickCount: 'क्लिक संख्या', delay: 'देरी' } },
    type: { label: 'टाइप करें', detail: 'इनपुट में टाइप', documentation: 'वास्तविक कीस्ट्रोक के साथ टाइप करता है।', parameters: { selector: 'इनपुट selector', text: 'टेक्स्ट', delay: 'कीस्ट्रोक देरी', clear: 'पहले साफ करें' } },
    browser_close: { label: 'ब्राउज़र बंद करें', detail: 'बंद और क्लीनअप', documentation: 'ब्राउज़र बंद करता है।', parameters: { force: 'फोर्स क्लोज़' } },
    solve_captcha: { label: 'CAPTCHA हल करें', detail: 'ऑटो-सॉल्व', documentation: 'Turnstile, reCAPTCHA हल करता है।', parameters: { type: 'CAPTCHA प्रकार', timeout: 'अधिकतम समय' } },
    random_scroll: { label: 'रैंडम स्क्रॉल', detail: 'मानव-जैसा स्क्रॉल', documentation: 'रैंडम स्क्रॉल करता है।', parameters: { direction: 'दिशा', amount: 'मात्रा', smooth: 'स्मूथ' } },
    find_element: { label: 'एलीमेंट खोजें', detail: 'पेज पर खोजें', documentation: 'selector/xpath से खोजता है।', parameters: { selector: 'CSS selector', xpath: 'XPath', text: 'टेक्स्ट', multiple: 'सभी लौटाएं' } },
    save_content_as_markdown: { label: 'MD में सेव', detail: 'Markdown एक्सपोर्ट', documentation: 'Markdown फाइल में सेव करता है।', parameters: { filename: 'फाइलनेम', selector: 'कंटेंट selector', includeImages: 'इमेज शामिल', includeMeta: 'मेटा शामिल' } },
    redirect_tracer: { label: 'रीडायरेक्ट ट्रेस', detail: 'रीडायरेक्ट फॉलो', documentation: 'सभी रीडायरेक्ट ट्रेस करता है।', parameters: { url: 'ट्रेस URL', maxRedirects: 'अधिकतम', includeHeaders: 'हेडर शामिल' } },
    search_regex: { label: 'Regex सर्च', detail: 'पैटर्न से खोज', documentation: 'regex से खोजता है।', parameters: { pattern: 'पैटर्न', flags: 'फ्लैग्स', source: 'सोर्स' } },
    extract_json: { label: 'JSON निकालें', detail: 'JSON डेटा', documentation: 'JSON निकालता है।', parameters: { source: 'सोर्स', selector: 'selector', jsonPath: 'JSONPath' } },
    scrape_meta_tags: { label: 'Meta Tags', detail: 'मेटा डेटा', documentation: 'Meta, OG, Twitter डेटा।', parameters: { types: 'प्रकार' } },
    press_key: { label: 'की प्रेस', detail: 'कीबोर्ड इनपुट', documentation: 'की प्रेस करता है।', parameters: { key: 'की', modifiers: 'मॉडिफायर', count: 'संख्या' } },
    progress_tracker: { label: 'प्रोग्रेस ट्रैक', detail: 'ऑटोमेशन मॉनिटर', documentation: 'प्रोग्रेस ट्रैक करता है।', parameters: { action: 'एक्शन', taskName: 'टास्क नाम', progress: 'प्रतिशत' } },
    deep_analysis: { label: 'गहरा विश्लेषण', detail: 'पेज विश्लेषण', documentation: 'SEO, परफॉर्मेंस विश्लेषण।', parameters: { types: 'प्रकार', detailed: 'विस्तृत' } },
    network_recorder: { label: 'नेटवर्क रिकॉर्ड', detail: 'रिक्वेस्ट कैप्चर', documentation: 'नेटवर्क रिकॉर्ड करता है।', parameters: { action: 'एक्शन', filter: 'फ़िल्टर' } },
    link_harvester: { label: 'लिंक्स निकालें', detail: 'सभी लिंक्स', documentation: 'सभी लिंक्स निकालता है।', parameters: { types: 'प्रकार', selector: 'कंटेनर', includeText: 'टेक्स्ट शामिल' } },
    cookie_manager: { label: 'कुकीज़ मैनेज', detail: 'कुकी ऑपरेशन', documentation: 'कुकीज़ मैनेज करता है।', parameters: { action: 'एक्शन', name: 'नाम', value: 'वैल्यू', domain: 'डोमेन' } },
    file_downloader: { label: 'फाइल डाउनलोड', detail: 'URL से डाउनलोड', documentation: 'फाइल्स डाउनलोड करता है।', parameters: { url: 'फाइल URL', filename: 'नाम', directory: 'डायरेक्टरी' } },
    iframe_handler: { label: 'iFrame हैंडल', detail: 'iFrame ऑपरेशन', documentation: 'iFrame हैंडल करता है।', parameters: { action: 'एक्शन', selector: 'selector', index: 'इंडेक्स' } },
    stream_extractor: { label: 'स्ट्रीम निकालें', detail: 'वीडियो/ऑडियो URL', documentation: 'स्ट्रीम URLs निकालता है।', parameters: { types: 'प्रकार', quality: 'क्वालिटी' } },
    js_scrape: { label: 'JS स्क्रैप', detail: 'JS कंटेंट', documentation: 'JS-रेंडर्ड कंटेंट।', parameters: { selector: 'selector', waitForJS: 'JS इंतजार', timeout: 'अधिकतम' } },
    execute_js: { label: 'JS चलाएं', detail: 'JavaScript रन', documentation: 'कस्टम JS चलाता है।', parameters: { code: 'कोड', returnValue: 'रिज़ल्ट लौटाएं' } },
    player_api_hook: { label: 'Player Hook', detail: 'वीडियो प्लेयर', documentation: 'प्लेयर में हुक करता है।', parameters: { playerType: 'प्लेयर', action: 'एक्शन' } },
    form_automator: { label: 'फॉर्म ऑटोमेट', detail: 'फॉर्म भरें', documentation: 'फॉर्म भरता और सबमिट करता है।', parameters: { selector: 'फॉर्म selector', data: 'डेटा', submit: 'सबमिट', humanLike: 'मानव देरी' } }
  },
  diagnostics: {
    browserNotInit: 'ब्राउज़र इनिशियलाइज़ नहीं। पहले browser_init करें।',
    invalidSelector: 'अमान्य CSS selector।',
    missingUrl: 'URL आवश्यक है।',
    invalidUrl: 'अमान्य URL फॉर्मेट।',
    timeoutTooLong: 'टाइमआउट बहुत लंबा।',
    missingRequired: 'आवश्यक पैरामीटर गायब।',
    invalidJson: 'अमान्य JSON।',
    selectorNotFound: 'एलीमेंट नहीं मिला।',
    unknownTool: 'अज्ञात टूल।',
    deprecatedTool: 'यह टूल deprecated है।'
  },
  snippets: { basicFlow: 'बेसिक ऑटोमेशन', loginFlow: 'लॉगिन ऑटोमेशन', scrapeFlow: 'स्क्रैपिंग वर्कफ्लो', captchaFlow: 'CAPTCHA वर्कफ्लो', downloadFlow: 'डाउनलोड ऑटोमेशन' },
  ui: { autocompletePlaceholder: 'टूल टाइप करें...', noSuggestions: 'कोई सुझाव नहीं', loading: 'लोड हो रहा...', error: 'त्रुटि', warning: 'चेतावनी', info: 'जानकारी' }
};
