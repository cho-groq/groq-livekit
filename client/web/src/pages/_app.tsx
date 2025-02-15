import { CloudProvider } from "@/cloud/useCloud";
import type { AppProps } from "next/app";
import "@/styles/fonts.css";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CloudProvider>
      <Component {...pageProps} />
    </CloudProvider>
  );
}
