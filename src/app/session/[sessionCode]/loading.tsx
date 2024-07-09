import { IoMdSkipBackward, IoMdSkipForward } from "react-icons/io";
import { MdCircle } from "react-icons/md";
import Container from "~/app/_components/player/Container";

export default function Loading() {
  return (
    <>
      <div className="grid gap-2 p-2 md:grid-cols-[30%,auto] lg:grid lg:grid-cols-[300px,1fr,300px] lg:grid-rows-[calc(100%-80px-0.5rem),80px] xl:grid-cols-[400px,1fr,400px]">
        {/* current song */}
        <Container className="col-start-1 row-start-1 flex flex-col gap-4 lg:col-start-1">
          <div className="aspect-square h-auto w-full animate-pulse overflow-hidden rounded-lg bg-zinc-800"></div>
          <div className="h-6 w-full animate-pulse rounded-md bg-zinc-800"></div>
        </Container>

        {/* search */}
        <Container className="relative grid min-h-[500px] grid-rows-[2.75rem,minmax(0,1fr)] gap-2 overflow-hidden md:col-start-2 md:row-span-2 md:row-start-1 lg:col-start-2 lg:row-span-1 lg:row-start-1">
          <div className="relative">
            <div className="z-10 h-11 w-full rounded-lg border-2 border-zinc-600 bg-transparent p-2 pl-1 text-transparent"></div>
            <input
              className="absolute top-0 z-20 h-11 w-full rounded-lg border-2 border-zinc-600 bg-transparent p-2 text-white"
              type="text"
              placeholder="search... (type @ to search for other things than tracks)"
            />
          </div>

          {/* results */}
          <div className="flex h-full w-full max-w-full flex-grow-0 flex-col gap-2 overflow-y-scroll scrollbar scrollbar-track-transparent scrollbar-thumb-zinc-600">
            <div className="grid h-full w-full grid-cols-1 items-center justify-center justify-items-center gap-4 md:grid-cols-2 md:grid-rows-2">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-1 sm:p-3 md:p-5 lg:p-6">
                start typing to search for a track
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-1 sm:p-3 md:p-5 lg:p-6">
                <h2 className="mb-3 text-center">type @...</h2>
                <div className="flex flex-wrap gap-1"></div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-1 sm:p-3 md:p-5 lg:p-6">
                <h2 className="mb-3 text-center">Your Permissions:</h2>
                <div className="flex flex-wrap justify-center gap-1"></div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-1 sm:p-3 md:p-5 lg:p-6"></div>
            </div>
          </div>
        </Container>

        {/* queue */}
        <Container className="flex h-max min-h-96 flex-col gap-2 overflow-y-scroll scrollbar scrollbar-track-transparent scrollbar-thumb-zinc-600 sm:max-h-full md:col-start-1 md:row-start-2 md:h-auto lg:col-start-3 lg:row-span-2 lg:min-h-0">
          <h2 className="">Currently Playing</h2>
          <div>
            <div className="h-8 w-full animate-pulse rounded bg-zinc-800 p-2"></div>
          </div>

          <h2 className="">Upcoming</h2>
          <div className="flex flex-col  text-sm">
            {[...Array(10).keys()].map((a, i) => (
              <div
                key={i}
                className="h-8 w-full animate-pulse rounded bg-zinc-800 p-2"
              ></div>
            ))}
          </div>
        </Container>

        {/* session controls */}
        <Container className="lg:col-start-1 lg:row-start-2">
          <div className="grid h-full grid-flow-col content-center justify-center gap-3"></div>
        </Container>

        {/* playback controls */}
        <Container className="row-start-2 md:col-start-2 md:row-start-3 lg:col-start-2 lg:row-start-2">
          <div className="grid h-full w-full grid-cols-3 content-center justify-items-center">
            <div className="grid w-full grid-cols-1 grid-rows-2 gap-2 text-xs">
              <div className="h-4 w-40 animate-pulse bg-zinc-800"></div>
              <div className="h-4 w-40 animate-pulse bg-zinc-800"></div>
            </div>
            <div className="grid w-[165px] animate-pulse grid-cols-3 justify-items-center">
              <button
                disabled
                className="brightness-90 hover:brightness-100 active:brightness-90"
              >
                <IoMdSkipBackward className="aspect-square h-6 w-6" />
              </button>

              <button
                disabled
                className="hover:brightness-90 active:brightness-75"
              >
                <MdCircle className="aspect-square h-10 w-10" />
              </button>

              <button
                disabled
                className="brightness-90 hover:brightness-100 active:brightness-90"
              >
                <IoMdSkipForward className="aspect-square h-6 w-6" />
              </button>
            </div>

            <div className="flex h-4 w-full animate-pulse items-center justify-end bg-zinc-800 text-xs"></div>
          </div>
        </Container>
      </div>
    </>
  );
}
