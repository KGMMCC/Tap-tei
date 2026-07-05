export function buildVCard(p: {
  display_name?: string | null;
  username: string;
  contact_email?: string | null;
  phone?: string | null;
  address?: string | null;
  bio?: string | null;
  url?: string | null;
}) {
  const name = p.display_name || p.username;
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCard(name)}`,
    `N:${escapeVCard(name)};;;;`,
  ];
  if (p.contact_email) lines.push(`EMAIL;TYPE=INTERNET:${p.contact_email}`);
  if (p.phone) lines.push(`TEL;TYPE=CELL:${p.phone}`);
  if (p.address) lines.push(`ADR;TYPE=HOME:;;${escapeVCard(p.address)};;;;`);
  if (p.bio) lines.push(`NOTE:${escapeVCard(p.bio)}`);
  if (p.url) lines.push(`URL:${p.url}`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

function escapeVCard(v: string) {
  return v.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

export function downloadVCard(filename: string, vcard: string) {
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
}
