export default function checkForTokenError(error: { message: string }) {
  return error.message.startsWith("Bad or expired token.");
}
