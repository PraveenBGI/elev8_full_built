import Image from "next/image";

/**
 * app/admin/config-engine/Topbar.tsx
 *
 * Revised to use the real brand: public/elev8-logo.png (the actual logo,
 * not a text approximation of it), and a light chrome instead of the
 * earlier invented dark navy bar -- the real logo is designed for a
 * white/light background, so forcing it onto a dark navy strip fought
 * the actual brand rather than using it. Colors and weights per direct
 * feedback: no icons/emoji, moderate font weight (500/600, never
 * 700/800), a single green accent border as the one deliberate color
 * moment rather than a fully colored bar.
 */

export function Topbar({
  countryName,
  progressPercent,
  userInitial,
}: {
  countryName: string;
  progressPercent: number;
  userInitial: string;
}) {
  return (
    <div
      className="flex h-16 shrink-0 items-center gap-5 border-b bg-white px-6"
      style={{ borderColor: "var(--elev8-green)", borderBottomWidth: 3 }}
    >
      <Image src="/elev8-logo.png" alt="elev8" width={92} height={46} priority />

      <div
        className="border-l pl-4 text-[11px] font-medium tracking-wide"
        style={{ borderColor: "var(--elev8-g200)", color: "var(--elev8-g500)" }}
      >
        Country Configuration
      </div>

      <div
        className="rounded-full px-3 py-1 text-[13px] font-medium"
        style={{ background: "var(--elev8-g50)", color: "var(--elev8-ink)" }}
      >
        {countryName}
      </div>

      <div className="flex-1" />

      <div
        className="flex items-center gap-2 text-[12px] font-medium"
        style={{ color: "var(--elev8-g500)" }}
      >
        <span>{progressPercent}% configured</span>
        <span
          className="inline-block h-1.5 w-24 overflow-hidden rounded-full"
          style={{ background: "var(--elev8-g100)" }}
        >
          <span
            className="block h-full rounded-full"
            style={{ width: `${progressPercent}%`, background: "var(--elev8-green)" }}
          />
        </span>
      </div>

      <form action="/api/auth/sign-out" method="post">
        <button
          type="submit"
          className="rounded-md border px-3 py-1.5 text-[13px] font-medium"
          style={{ borderColor: "var(--elev8-g200)", color: "var(--elev8-ink)" }}
        >
          Sign out
        </button>
      </form>

      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-medium text-white"
        style={{ background: "var(--elev8-blue)" }}
      >
        {userInitial}
      </div>
    </div>
  );
}
