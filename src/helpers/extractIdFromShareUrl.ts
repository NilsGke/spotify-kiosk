/**
 * @author google gemini
 */
export default function extractIdFromShareUrl(url: string): string | null {
  // Regular expressions to match different Spotify URL formats
  const spotifyUrlPatterns = [
    // https://open.spotify.com/track/<ID>?si=<...>&utm_source=<...>
    // https://open.spotify.com/embed/track/<ID>
    /^https:\/\/open\.spotify\.com\/(track\/|embed\/)track\/([^?#]+)\??.*$/,
    // https://open.spotify.com/playlist/<ID>/<trackNumber>
    /^https:\/\/open\.spotify\.com\/playlist\/([^?#]+)\/(\d+)/,
    // https://open.spotify.com/album/<ID>/track/<trackNumber>
    /^https:\/\/open\.spotify\.com\/album\/([^?#]+)\/track\/(\d+)/,
  ];

  for (const pattern of spotifyUrlPatterns) {
    const match = url.match(pattern);
    if (match) {
      // Extract the song ID from the matched group
      return match[1] ?? match[2] ?? null; // Use the first or second group depending on the pattern
    }
  }

  // URL doesn't match any of the Spotify URL patterns
  return null;
}
