import TVLoadingBackButton from "~/app/_components/TVLoadingBackButton";
import { env } from "~/env";

export default function Loading() {
  return (
    <div
      className="absolute left-0 top-0 flex h-screen w-screen items-center justify-center bg-orange-400 bg-cover bg-center backdrop-blur-md backdrop-brightness-50"
      style={{
        backgroundImage: `linear-gradient(
              295deg,
              hsl(240deg 0% 20%) 0%,
              hsl(289deg 0% 21%) 11%,
              hsl(55deg 0% 50%) 100%
            )`,
      }}
    >
      {/* noise background */}
      <div
        className="absolute left-0 top-0 h-screen w-screen opacity-[40%]"
        style={{
          backgroundImage: `url(${env.NEXT_PUBLIC_APP_URL}/noise.png)`,
          backgroundSize: "200px",
        }}
      ></div>

      {/* back button */}
      <TVLoadingBackButton />

      {/* content */}
      <div className="z-20 flex flex-col items-center justify-center gap-6">
        <h2 className="text-5xl font-semibold">Loading</h2>
        <h3 className="text-lg opacity-80">Loading</h3>
      </div>
    </div>
  );
}
