import { permanentRedirect } from "next/navigation";
import { env } from "~/env";

export default function page({
  params,
}: {
  params: {
    sessionCode: string;
  };
}) {
  permanentRedirect(`${env.NEXT_PUBLIC_APP_URL}/session/${params.sessionCode}`);
}
