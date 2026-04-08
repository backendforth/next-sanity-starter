export const defaultCookieSections = JSON.stringify(
  [
    {
      id: "necessary",
      title: "Strictly Necessary",
      description:
        "Essential for basic website functionality and cannot be disabled.",
      linkedCategory: "necessary",
      cookieTable: {
        headers: {
          name: "Name",
          domain: "Domain",
          desc: "Description",
        },
        body: [],
      },
    },
    {
      id: "analytics",
      title: "Analytics",
      description:
        "Helps us understand usage patterns and improve the website experience.",
      linkedCategory: "analytics",
      cookieTable: {
        headers: {
          name: "Name",
          domain: "Domain",
          desc: "Description",
        },
        body: [],
      },
    },
  ],
  null,
  2,
);
