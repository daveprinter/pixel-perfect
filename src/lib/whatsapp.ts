export function waLink(number: string | undefined, message: string) {
  const n = (number ?? "").replace(/[^0-9]/g, "");
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}
