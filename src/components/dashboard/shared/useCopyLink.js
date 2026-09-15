import { useToast } from "../../../context/ToastContext";

// Copies a link with https:// in front, so it's clickable wherever it's
// pasted, and says "copied" only once the clipboard has taken it.
export default function useCopyLink() {
  const { showToast } = useToast();
  return (link, message = "Link copied") => {
    const failed = () => showToast("Couldn't copy — select the link and copy it");
    const text = /^https?:\/\//.test(link) ? link : `https://${link}`;
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => showToast(message), failed);
    else failed();
  };
}
