import { DiscordIcon } from "@/app/login/discord";
import "@/app/globals.css";
import Link from "next/link";

export const rerouteUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://dnd-init-tracker-production-682f.up.railway.app";

export default function Login() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col gap-20">
        <h1 className="text-5xl">Welcome to LiDnD.</h1>

        <Link
          className={
            "shadow p-5 rounded-md text-center text-white flex overflow-hidden border-2 hover:bg-gray-200 transition-all"
          }
          href={`/login/discord`}
        >
          <DiscordIcon className="max-w-40" />
        </Link>
      </div>
    </main>
  );
}
