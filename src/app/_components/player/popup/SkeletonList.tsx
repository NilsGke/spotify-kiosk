const skeletonList = (amount: number) => (
  <div className="flex flex-col gap-2">
    {[...Array(amount).keys()].map((i) => (
      <div
        key={i}
        className="min-h-10 w-full max-w-full animate-pulse rounded bg-zinc-800"
      />
    ))}
  </div>
);
export default skeletonList;
