import React, { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

const LightboxComponent = ({ imageUrl }) => {
  console.log({ imageUrl });
  const [open, setOpen] = useState(false);

  const view = imageUrl?.split("/")[7]?.split("-")[0].toLowerCase();
  console.log({ view });

  return (
    <>
      <img
        src={imageUrl}
        alt="Capture photo to preview image"
        style={{
          maxWidth: "200px",
          maxHeight: "200px",
          cursor: "pointer",
        }}
        onClick={() => setOpen(true)}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `/assets/images/${view}View.png` || ""; // Fallback image
        }}
      />

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[{ src: imageUrl }]}
      />
    </>
  );
};

export default LightboxComponent;
