import { CgUsb } from "react-icons/cg";
import { FaCar, FaChromecast } from "react-icons/fa";
import { FiSmartphone, FiTablet, FiTv } from "react-icons/fi";
import type { IconType } from "react-icons/lib";
import { LuGamepad2, LuRadioReceiver } from "react-icons/lu";
import { MdMusicVideo, MdOutlineSpeaker } from "react-icons/md";
import { RiComputerLine } from "react-icons/ri";

// list from: https://github.com/spotify/web-api/issues/687#issuecomment-358783650

type SpotifyDeviceType =
  | "computer"
  | "tablet"
  | "smartphone"
  | "speaker"
  | "tv"
  | "avr"
  | "stb"
  | "audio_dongle"
  | "game_console"
  | "cast_video"
  | "cast_audio"
  | "automobile";

export const spotifyDeviceTypes: {
  type: SpotifyDeviceType;
  icon: IconType;
  description: string;
}[] = [
  {
    type: "computer",
    icon: RiComputerLine,
    description: "Laptop or desktop computer device",
  },
  {
    type: "tablet",
    icon: FiTablet,
    description: "Tablet PC device",
  },
  {
    type: "smartphone",
    icon: FiSmartphone,
    description: "Smartphone device",
  },
  {
    type: "speaker",
    icon: MdOutlineSpeaker,
    description: "Speaker device",
  },
  {
    type: "tv",
    icon: FiTv,
    description: "Television device",
  },
  {
    type: "avr",
    icon: LuRadioReceiver,
    description: "Audio/Video receiver device",
  },
  {
    type: "stb",
    icon: LuRadioReceiver,
    description: "Set-Top Box device",
  },
  {
    type: "audio_dongle",
    icon: CgUsb,
    description: "Audio dongle device",
  },
  {
    type: "game_console",
    icon: LuGamepad2,
    description: "Game console device",
  },
  {
    type: "cast_video",
    icon: FaChromecast,
    description: "Chromecast device",
  },
  {
    type: "cast_audio",
    icon: MdMusicVideo,
    description: "Cast for audio device",
  },
  {
    type: "automobile",
    icon: FaCar,
    description: "Car device",
  },
];

export default SpotifyDeviceType;
