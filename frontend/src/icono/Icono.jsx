import React from "react";
const paths = {
  eyeoff:
    "M3 3l18 18 M10.6 5.1 12 5c6 0 10 7 10 7a21 21 0 0 1-3.2 3.8 M6.2 6.2A24 24 0 0 0 2 12s4 7 10 7a13 13 0 0 0 5.8-1.8 M10 10a3 3 0 0 0 4 4",
  home: "m3 10 9-7 9 7v10H3Z M9 20v-7h6v7",
  cart: "M2 3h3l3 12h11l3-9H6 M9 20h.01 M18 20h.01",
  box: "m12 2 9 5v10l-9 5-9-5V7Z M3 7l9 5 9-5 M12 12v10 M7 4.8l9 5",
  chart: "M4 21V13h3v8 M10 21V7h3v14 M16 21V3h3v18",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 4a4 4 0 0 1 0 7 M22 21v-2a4 4 0 0 0-3-3.9",
  file: "M14 2H5v20h14V7Z M14 2v6h5 M8 12h8 M8 16h8",
  search: "M21 21l-5-5 M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
  chevron: "m9 5 7 7-7 7",
  down: "m6 9 6 6 6-6",
  plus: "M12 5v14 M5 12h14",
  minus: "M5 12h14",
  close: "m6 6 12 12 M6 18 18 6",
  trash: "M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7",
  edit: "m15 4 5 5 M4 20l4-1L21 6l-4-4L4 15Z",
  cash: "M3 5h18v14H3Z M7 9h.01 M17 15h.01 M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
  card: "M2 5h20v14H2Z M2 9h20 M5 15h4",
  receipt: "M4 2h16v20l-4-2-4 2-4-2-4 2Z M8 7h8 M8 11h8 M8 15h4",
  scan: "M8 3H3v5 M16 3h5v5 M3 16v5h5 M21 16v5h-5 M7 7v10 M10 7v10 M14 7v10 M17 7v10",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 2h6l1 3 3 1 3 4-2 3v3l-4 4h-3l-3 2-4-3-1-3-3-1V9l3-1 1-3Z",
  logout: "M9 4H3v16h6 M9 12h12 m-5-5 5 5-5 5",
  store:
    "M3 10v11h18V10 M2 10l2-7h16l2 7 M2 10c0 4 5 4 5 0 0 4 5 4 5 0 0 4 5 4 5 0 0 4 5 4 5 0 M9 21v-7h6v7",
  arrow: "M4 12h16 m-6-6 6 6-6 6",
  trend: "m3 17 6-6 4 4 8-10 M15 5h6v6",
  download: "M12 3v12 m-5-5 5 5 5-5 M3 16v5h18v-5",
  print: "M6 8V2h12v6 M6 17H3V8h18v9h-3 M6 14h12v8H6Z M17 11h.01",
  check: "m4 12 5 5L20 6",
  warning: "m12 3 10 18H2Z M12 9v5 M12 17h.01",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12 M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
  lock: "M5 10h14v12H5Z M8 10V6a4 4 0 0 1 8 0v4 M12 15v3",
  refresh: "M20 7a9 9 0 1 0 1 9 M20 2v6h-6",
  menu: "M3 6h18 M3 12h18 M3 18h18",
  calendar: "M3 5h18v16H3Z M7 2v6 M17 2v6 M3 10h18",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l4 2",
  phone: "M7 2H3c-2 9 10 21 19 19v-4l-5-3-3 3-7-7 3-3Z",
};

export default function Icono({ name = "box" }) {
  return (
    <span className="dp-icon">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={paths[name] || paths.box} />
      </svg>
    </span>
  );
}
