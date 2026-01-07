import { FaImage } from "react-icons/fa";
import { twMerge } from "tailwind-merge";

const FallbackImage = ({ className }: { className?: string }) => (
  <div className={twMerge("rounded bg-zinc-700 p-[1%]", className)}>
    <FaImage className="size-full text-zinc-400" />
  </div>
);

export default FallbackImage;
