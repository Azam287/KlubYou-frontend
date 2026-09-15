import { useRef, useState } from "react";
import Icon from "../../common/Icon";
import { MAX_IMAGE_MB, imageFileProblem } from "../../../lib/page";

// Choose, replace or remove one picture. Used for the header image (wide) and
// the profile photo (round); without a picture, the page falls back to its
// colours or your initial, so there's never an empty grey box.
export default function ImageField({
  label,
  image,
  onChange,
  round = false,
  emptyText = "No image yet",
  uploadTip = "Choose a photo",
  removeTip = "Take the image off",
}) {
  const input = useRef(null);
  const [problem, setProblem] = useState("");

  const choose = (file) => {
    const why = imageFileProblem(file);
    if (why) {
      setProblem(why);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProblem("");
      onChange(String(reader.result));
    };
    reader.onerror = () => setProblem("That image couldn't be read. Try another one.");
    reader.readAsDataURL(file);
  };

  return (
    <div className={`ctrl img-field${round ? " round" : ""}`}>
      <span className="lbl">{label}</span>
      <div className="img-field-row">
        <div
          className={`hi-box${image ? " has" : ""}`}
          style={image ? { backgroundImage: `url(${image})` } : undefined}
        >
          {!image && <span>{emptyText}</span>}
        </div>

        <div className="hi-actions">
          {/* A real button opens the file picker, so it can be reached from
              the keyboard; the file input itself stays out of sight. */}
          <button
            className="btn btn-ghost btn-sm"
            data-tip={uploadTip}
            onClick={() => input.current?.click()}
          >
            <Icon name="upload" size={15} strokeWidth={1.9} /> {image ? "Replace" : "Upload"}
          </button>
          {image && (
            <button
              className="btn btn-ghost btn-sm"
              data-tip={removeTip}
              onClick={() => {
                setProblem("");
                onChange("");
              }}
            >
              Remove
            </button>
          )}
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            aria-label={`Choose a file for ${label.toLowerCase()}`}
            onChange={(e) => {
              choose(e.target.files?.[0]);
              // Choosing the same file again should still fire.
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <p className={`hint${problem ? " warn" : ""}`}>
        {problem || `JPG, PNG, WebP or GIF, up to ${MAX_IMAGE_MB} MB.`}
      </p>
    </div>
  );
}
