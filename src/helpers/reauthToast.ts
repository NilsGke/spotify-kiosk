import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import toast from "react-simple-toasts";
import { env } from "~/env";

export default function reauthToast(redirectUrl: string) {
  toast("You need to reauthenticate yourself! Click here to do so.", {
    clickable: true,
    onClick: () =>
      SpotifyApi.performUserAuthorization(
        env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
        redirectUrl,
        ["user-read-playback-state", "user-modify-playback-state"],
        env.NEXT_PUBLIC_APP_URL + "/api/reauth",
      ).catch((e) => {
        console.error(e);
        toast("Failed to reauthenticate.");
      }),
  });
}

export function hostNeedsToReauthToast() {
  toast("the host needs to reauthenticate themselves");
}
