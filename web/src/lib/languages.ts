/**
 * ISO 639-1 language codes with English names.
 *
 * The translation backend accepts any language string, but the canonical
 * two-letter ISO 639-1 code is the most reliable value to send. Each entry
 * exposes a `code` (the value sent to the backend), an English `name`, and a
 * optional `native` name used to enrich the picker UI.
 */

export interface Language {
  /** ISO 639-1 two-letter code, sent to the backend as the `language` value. */
  code: string;
  /** English display name. */
  name: string;
  /** Native name (optional, for richer UI). */
  native?: string;
}

/**
 * Languages surfaced at the top of the picker for fast access. These mirror
 * the most commonly requested translation pairs and are a subset of `LANGUAGES`.
 */
export const POPULAR_LANGUAGE_CODES = [
  "en",
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "ru",
  "ja",
  "ko",
  "zh",
  "ar",
  "hi",
] as const;

export const LANGUAGES: Language[] = [
  { code: "aa", name: "Afar", native: "Afaraf" },
  { code: "ab", name: "Abkhazian", native: "Аҧсуа" },
  { code: "ae", name: "Avestan", native: "Avesta" },
  { code: "af", name: "Afrikaans", native: "Afrikaans" },
  { code: "ak", name: "Akan", native: "Akan" },
  { code: "am", name: "Amharic", native: "አማርኛ" },
  { code: "an", name: "Aragonese", native: "Aragonés" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "as", name: "Assamese", native: "অসমীয়া" },
  { code: "av", name: "Avaric", native: "Авар" },
  { code: "ay", name: "Aymara", native: "Aymar aru" },
  { code: "az", name: "Azerbaijani", native: "Azərbaycan" },
  { code: "ba", name: "Bashkir", native: "Башҡорт" },
  { code: "be", name: "Belarusian", native: "Беларуская" },
  { code: "bg", name: "Bulgarian", native: "Български" },
  { code: "bh", name: "Bihari", native: "भोजपुरी" },
  { code: "bi", name: "Bislama", native: "Bislama" },
  { code: "bm", name: "Bambara", native: "Bamanankan" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "bo", name: "Tibetan", native: "བོད་ཡིག" },
  { code: "br", name: "Breton", native: "Brezhoneg" },
  { code: "bs", name: "Bosnian", native: "Bosanski" },
  { code: "ca", name: "Catalan", native: "Català" },
  { code: "ce", name: "Chechen", native: "Нохчийн" },
  { code: "ch", name: "Chamorro", native: "Chamoru" },
  { code: "co", name: "Corsican", native: "Corsu" },
  { code: "cr", name: "Cree", native: "Nēhiyaw" },
  { code: "cs", name: "Czech", native: "Čeština" },
  { code: "cu", name: "Church Slavic", native: "Словѣньскъ" },
  { code: "cv", name: "Chuvash", native: "Чӑвашла" },
  { code: "cy", name: "Welsh", native: "Cymraeg" },
  { code: "da", name: "Danish", native: "Dansk" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "dv", name: "Divehi", native: "ދިވެހި" },
  { code: "dz", name: "Dzongkha", native: "རྫོང་ཁ" },
  { code: "ee", name: "Ewe", native: "Eʋegbe" },
  { code: "el", name: "Greek", native: "Ελληνικά" },
  { code: "en", name: "English", native: "English" },
  { code: "eo", name: "Esperanto", native: "Esperanto" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "et", name: "Estonian", native: "Eesti" },
  { code: "eu", name: "Basque", native: "Euskara" },
  { code: "fa", name: "Persian", native: "فارسی" },
  { code: "ff", name: "Fulah", native: "Fulfulde" },
  { code: "fi", name: "Finnish", native: "Suomi" },
  { code: "fj", name: "Fijian", native: "Vosa Vakaviti" },
  { code: "fo", name: "Faroese", native: "Føroyskt" },
  { code: "fr", name: "French", native: "Français" },
  { code: "fy", name: "Western Frisian", native: "Frysk" },
  { code: "ga", name: "Irish", native: "Gaeilge" },
  { code: "gd", name: "Scottish Gaelic", native: "Gàidhlig" },
  { code: "gl", name: "Galician", native: "Galego" },
  { code: "gn", name: "Guarani", native: "Avañe'ẽ" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "gv", name: "Manx", native: "Gaelg" },
  { code: "ha", name: "Hausa", native: "Hausa" },
  { code: "he", name: "Hebrew", native: "עברית" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "ho", name: "Hiri Motu", native: "Hiri Motu" },
  { code: "hr", name: "Croatian", native: "Hrvatski" },
  { code: "ht", name: "Haitian Creole", native: "Kreyòl Ayisyen" },
  { code: "hu", name: "Hungarian", native: "Magyar" },
  { code: "hy", name: "Armenian", native: "Հայերեն" },
  { code: "hz", name: "Herero", native: "Otjiherero" },
  { code: "ia", name: "Interlingua", native: "Interlingua" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "ie", name: "Interlingue", native: "Interlingue" },
  { code: "ig", name: "Igbo", native: "Igbo" },
  { code: "ii", name: "Sichuan Yi", native: "ꆈꌠꉙ" },
  { code: "ik", name: "Inupiaq", native: "Iñupiaq" },
  { code: "io", name: "Ido", native: "Ido" },
  { code: "is", name: "Icelandic", native: "Íslenska" },
  { code: "it", name: "Italian", native: "Italiano" },
  { code: "iu", name: "Inuktitut", native: "ᐃᓄᒃᑎᑐᑦ" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "jv", name: "Javanese", native: "Basa Jawa" },
  { code: "ka", name: "Georgian", native: "ქართული" },
  { code: "kg", name: "Kongo", native: "Kikongo" },
  { code: "ki", name: "Kikuyu", native: "Gĩkũyũ" },
  { code: "kj", name: "Kuanyama", native: "Kuanyama" },
  { code: "kk", name: "Kazakh", native: "Қазақ" },
  { code: "kl", name: "Kalaallisut", native: "Kalaallisut" },
  { code: "km", name: "Khmer", native: "ខ្មែរ" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "kr", name: "Kanuri", native: "Kanuri" },
  { code: "ks", name: "Kashmiri", native: "कश्मीरी" },
  { code: "ku", name: "Kurdish", native: "Kurdî" },
  { code: "kv", name: "Komi", native: "Коми" },
  { code: "kw", name: "Cornish", native: "Kernewek" },
  { code: "ky", name: "Kyrgyz", native: "Кыргызча" },
  { code: "la", name: "Latin", native: "Latina" },
  { code: "lb", name: "Luxembourgish", native: "Lëtzebuergesch" },
  { code: "lg", name: "Ganda", native: "Luganda" },
  { code: "li", name: "Limburgish", native: "Limburgs" },
  { code: "ln", name: "Lingala", native: "Lingála" },
  { code: "lo", name: "Lao", native: "ລາວ" },
  { code: "lt", name: "Lithuanian", native: "Lietuvių" },
  { code: "lu", name: "Luba-Katanga", native: "Tshiluba" },
  { code: "lv", name: "Latvian", native: "Latviešu" },
  { code: "mg", name: "Malagasy", native: "Malagasy" },
  { code: "mh", name: "Marshallese", native: "Kajin M̧ajeļ" },
  { code: "mi", name: "Maori", native: "Te Reo Māori" },
  { code: "mk", name: "Macedonian", native: "Македонски" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "mn", name: "Mongolian", native: "Монгол" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu" },
  { code: "mt", name: "Maltese", native: "Malti" },
  { code: "my", name: "Burmese", native: "မြန်မာ" },
  { code: "na", name: "Nauru", native: "Dorerin Naoero" },
  { code: "nb", name: "Norwegian Bokmål", native: "Norsk Bokmål" },
  { code: "nd", name: "North Ndebele", native: "isiNdebele" },
  { code: "ne", name: "Nepali", native: "नेपाली" },
  { code: "ng", name: "Ndonga", native: "Owambo" },
  { code: "nl", name: "Dutch", native: "Nederlands" },
  { code: "nn", name: "Norwegian Nynorsk", native: "Norsk Nynorsk" },
  { code: "no", name: "Norwegian", native: "Norsk" },
  { code: "nr", name: "South Ndebele", native: "isiNdebele" },
  { code: "nv", name: "Navajo", native: "Diné bizaad" },
  { code: "ny", name: "Chichewa", native: "Chichewa" },
  { code: "oc", name: "Occitan", native: "Occitan" },
  { code: "oj", name: "Ojibwa", native: "ᐊᓂᔑᓈᐯᒧᐎᓐ" },
  { code: "om", name: "Oromo", native: "Afaan Oromoo" },
  { code: "or", name: "Oriya", native: "ଓଡ଼ିଆ" },
  { code: "os", name: "Ossetian", native: "Ирон" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "pi", name: "Pali", native: "पालि" },
  { code: "pl", name: "Polish", native: "Polski" },
  { code: "ps", name: "Pashto", native: "پښتو" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "qu", name: "Quechua", native: "Runa Simi" },
  { code: "rm", name: "Romansh", native: "Rumantsch" },
  { code: "rn", name: "Kirundi", native: "Ikirundi" },
  { code: "ro", name: "Romanian", native: "Română" },
  { code: "ru", name: "Russian", native: "Русский" },
  { code: "rw", name: "Kinyarwanda", native: "Kinyarwanda" },
  { code: "sa", name: "Sanskrit", native: "संस्कृतम्" },
  { code: "sc", name: "Sardinian", native: "Sardu" },
  { code: "sd", name: "Sindhi", native: "سنڌي" },
  { code: "se", name: "Northern Sami", native: "Davvisámegiella" },
  { code: "sg", name: "Sango", native: "Sängö" },
  { code: "si", name: "Sinhala", native: "සිංහල" },
  { code: "sk", name: "Slovak", native: "Slovenčina" },
  { code: "sl", name: "Slovenian", native: "Slovenščina" },
  { code: "sm", name: "Samoan", native: "Gagana Samoa" },
  { code: "sn", name: "Shona", native: "ChiShona" },
  { code: "so", name: "Somali", native: "Soomaali" },
  { code: "sq", name: "Albanian", native: "Shqip" },
  { code: "sr", name: "Serbian", native: "Српски" },
  { code: "ss", name: "Swati", native: "SiSwati" },
  { code: "st", name: "Southern Sotho", native: "Sesotho" },
  { code: "su", name: "Sundanese", native: "Basa Sunda" },
  { code: "sv", name: "Swedish", native: "Svenska" },
  { code: "sw", name: "Swahili", native: "Kiswahili" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "tg", name: "Tajik", native: "Тоҷикӣ" },
  { code: "th", name: "Thai", native: "ไทย" },
  { code: "ti", name: "Tigrinya", native: "ትግርኛ" },
  { code: "tk", name: "Turkmen", native: "Türkmen" },
  { code: "tl", name: "Tagalog", native: "Tagalog" },
  { code: "tn", name: "Tswana", native: "Setswana" },
  { code: "to", name: "Tongan", native: "Faka-Tonga" },
  { code: "tr", name: "Turkish", native: "Türkçe" },
  { code: "ts", name: "Tsonga", native: "Xitsonga" },
  { code: "tt", name: "Tatar", native: "Татар" },
  { code: "ty", name: "Tahitian", native: "Reo Tahiti" },
  { code: "ug", name: "Uyghur", native: "ئۇيغۇرچە" },
  { code: "uk", name: "Ukrainian", native: "Українська" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "uz", name: "Uzbek", native: "Oʻzbek" },
  { code: "ve", name: "Venda", native: "Tshivenḓa" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt" },
  { code: "vo", name: "Volapük", native: "Volapük" },
  { code: "wa", name: "Walloon", native: "Walon" },
  { code: "wo", name: "Wolof", native: "Wolof" },
  { code: "xh", name: "Xhosa", native: "isiXhosa" },
  { code: "yi", name: "Yiddish", native: "ייִדיש" },
  { code: "yo", name: "Yoruba", native: "Yorùbá" },
  { code: "za", name: "Zhuang", native: "Vahcuengh" },
  { code: "zh", name: "Chinese", native: "中文" },
  { code: "zu", name: "Zulu", native: "isiZulu" },
];

/** Lookup map for O(1) code -> language resolution. */
export const LANGUAGE_BY_CODE: Record<string, Language> = LANGUAGES.reduce(
  (acc, lang) => {
    acc[lang.code] = lang;
    return acc;
  },
  {} as Record<string, Language>,
);

/** Popular languages, derived from `POPULAR_LANGUAGE_CODES` preserving order. */
export const POPULAR_LANGUAGES: Language[] = POPULAR_LANGUAGE_CODES
  .map((code) => LANGUAGE_BY_CODE[code])
  .filter((l): l is Language => Boolean(l));

/**
 * Resolve a code (or arbitrary string) into a display language. Falls back to a
 * synthesized entry so the UI never shows a raw/unknown code without context.
 */
export function resolveLanguage(code: string | null | undefined): Language | null {
  if (!code) return null;
  const lower = code.toLowerCase();
  return LANGUAGE_BY_CODE[lower] ?? { code: lower, name: lower.toUpperCase() };
}
