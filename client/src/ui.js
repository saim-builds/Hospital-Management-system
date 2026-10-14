export const inputCls = "mt-2 w-full rounded-xl border border-[#C5D6DD] bg-white px-4 py-3 text-sm";
export const primaryBtn =
    "rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60";
export const ghostBtn = "rounded-xl border border-line bg-white px-5 py-3 text-sm font-bold";
export const money = (minor, currency) =>
  new Intl.NumberFormat("en", { style: "currency", currency }).format(minor / 100);