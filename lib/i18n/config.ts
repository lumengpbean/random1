export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const dictionary = {
  en: {
    brand: "Satirical Commons",
    submitDisclaimer: "Satire disclaimer: Submissions must be clearly satirical and must not impersonate real institutions.",
    nav: { home: "Home", preprints: "Preprints", journal: "Journal", submit: "Submit", admin: "Admin" }
  },
  zh: {
    brand: "讽刺公社",
    submitDisclaimer: "讽刺声明：投稿必须明确为讽刺，不得冒充真实机构。",
    nav: { home: "首页", preprints: "预印本", journal: "期刊", submit: "投稿", admin: "管理" }
  }
} as const;
