import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_SC } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });
const serif = Noto_Serif_SC({ variable: "--font-serif", subsets: ["latin"], weight: ["600", "700"] });

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og.png`;
  return {
    title: "D先生个人成长与决策系统",
    description: "教育观察、个人成长、行动卡与决策复盘的长期系统。",
    openGraph: { title: "D先生个人成长与决策系统", description: "少采集，多行动。", images: [{ url: image, width: 1733, height: 907 }] },
    twitter: { card: "summary_large_image", title: "D先生个人成长与决策系统", description: "少采集，多行动。", images: [image] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body className={`${geist.variable} ${mono.variable} ${serif.variable}`}>{children}</body></html>;
}
