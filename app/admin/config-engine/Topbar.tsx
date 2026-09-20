/**
 * app/admin/config-engine/Topbar.tsx
 *
 * Colors and layout ported from elev8-country-admin-config_3.html's
 * `.topbar` CSS exactly (navy background, 3px green bottom border, 58px
 * height). Deliberately DOES NOT include the mockup's Export JSON/Import
 * JSON/Reset/Save Draft/Review & Publish buttons -- those are the static
 * mockup's client-side-localStorage prototype affordances, and building
 * them here would mean shipping buttons that don't actually do anything
 * yet against this schema (Identity has no separate draft/live state,
 * and Review & Publish belongs to the Review stage once it exists). Adding
 * fake buttons to look more finished would be the wrong kind of progress.
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
      className="flex h-[58px] shrink-0 items-center gap-4 px-5 text-white"
      style={{
        background: "var(--elev8-navy)",
        borderBottom: "3px solid var(--elev8-green)",
      }}
    >
      <div className="flex items-center gap-2 text-[17px] font-extrabold tracking-wide">
        elev8<b style={{ color: "var(--elev8-green)" }}>8</b>
      </div>
      <div
        className="border-l pl-3.5 text-[10px] font-bold uppercase tracking-widest"
        style={{ borderColor: "rgba(255,255,255,.18)", color: "var(--elev8-g400)" }}
      >
        Country Configuration
      </div>
      <div
        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold"
        style={{ background: "rgba(255,255,255,.08)" }}
      >
        <span aria-hidden>🌐</span>
        <span>{countryName}</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2 text-[11px] font-bold" style={{ color: "var(--elev8-g400)" }}>
        <span>{progressPercent}% configured</span>
        <span className="inline-block h-1.5 w-24 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.15)" }}>
          <span
            className="block h-full rounded-full"
            style={{ width: `${progressPercent}%`, background: "var(--elev8-green)" }}
          />
        </span>
      </div>

      <form action="/api/auth/sign-out" method="post">
        <button
          type="submit"
          className="rounded-lg border px-[13px] py-[7px] text-xs font-bold text-white"
          style={{ background: "rgba(255,255,255,.1)", borderColor: "rgba(255,255,255,.16)" }}
        >
          Sign out
        </button>
      </form>

      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold"
        style={{ background: "var(--elev8-green)" }}
      >
        {userInitial}
      </div>
    </div>
  );
}
