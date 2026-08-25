"use client";

import { Instagram, Facebook, Youtube, MessageCircle } from "lucide-react";
import { useSiteContent } from "@provider/siteConfigProvider";

export default function ContactSection({ brand }: { brand: any }) {
  const { contact, social } = useSiteContent();
  const socials = [
    { url: social.instagram, Icon: Instagram, label: "Instagram" },
    { url: social.facebook, Icon: Facebook, label: "Facebook" },
    { url: social.whatsapp, Icon: MessageCircle, label: "WhatsApp" },
    { url: social.youtube, Icon: Youtube, label: "YouTube" },
  ].filter((s) => s.url);
  return (
    <section className="py-20 bg-gradient-to-r from-black via-neutral-900 to-black text-white relative overflow-hidden">
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-0 left-0 w-full h-full opacity-15" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className={`inline-flex items-center px-4 py-2 ${brand.badgeBg} backdrop-blur-sm rounded-full ${brand.badgeBorder} mb-6`}>
          <span className="text-sm font-medium">{contact.badge}</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold mb-6">{contact.title}</h2>
        <p className={`text-xl mb-12 ${brand.textMuted} max-w-2xl mx-auto`}>
          {contact.subtitle}
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <div className={`rounded-2xl p-6 border ${brand.cardBorder} ${brand.cardBg} backdrop-blur`}>
            <h3 className="font-semibold mb-2">Email</h3>
            <p className="text-neutral-300">{contact.email}</p>
          </div>
          <div className={`rounded-2xl p-6 border ${brand.cardBorder} ${brand.cardBg} backdrop-blur`}>
            <h3 className="font-semibold mb-2">Teléfono</h3>
            <p className="text-neutral-300">{contact.phone}</p>
          </div>
        </div>

        {socials.length > 0 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            {socials.map(({ url, Icon, label }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={`w-12 h-12 rounded-full border ${brand.cardBorder} ${brand.cardBg} backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors`}
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}