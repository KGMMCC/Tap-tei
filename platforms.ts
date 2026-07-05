import { Globe, Instagram, Linkedin, Youtube, Github, Twitter, Facebook, MessageCircle, Music2, Send, Phone, Mail, type LucideIcon } from "lucide-react";

export const PLATFORMS: { value: string; label: string; icon: LucideIcon; placeholder: string }[] = [
  { value: "website", label: "Website", icon: Globe, placeholder: "https://example.com" },
  { value: "instagram", label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/username" },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "https://linkedin.com/in/username" },
  { value: "twitter", label: "X / Twitter", icon: Twitter, placeholder: "https://x.com/username" },
  { value: "youtube", label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/@channel" },
  { value: "github", label: "GitHub", icon: Github, placeholder: "https://github.com/username" },
  { value: "facebook", label: "Facebook", icon: Facebook, placeholder: "https://facebook.com/username" },
  { value: "tiktok", label: "TikTok", icon: Music2, placeholder: "https://tiktok.com/@username" },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle, placeholder: "https://wa.me/15551234567" },
  { value: "telegram", label: "Telegram", icon: Send, placeholder: "https://t.me/username" },
  { value: "phone", label: "Phone", icon: Phone, placeholder: "tel:+15551234567" },
  { value: "email", label: "Email", icon: Mail, placeholder: "mailto:you@example.com" },
];

export function iconForPlatform(p: string): LucideIcon {
  return PLATFORMS.find((x) => x.value === p)?.icon ?? Globe;
}
export function labelForPlatform(p: string): string {
  return PLATFORMS.find((x) => x.value === p)?.label ?? p;
}
