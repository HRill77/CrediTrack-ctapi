import React, { useEffect, useRef } from "react";
import Viewer from "viewerjs";
import "viewerjs/dist/viewer.css";

interface ImageViewerProps {
  images: File[];
  open: boolean;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  open,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);

  useEffect(() => {
    if (!open || !containerRef.current) return;

    viewerRef.current = new Viewer(containerRef.current, {
      hidden() {
        onClose();
        viewerRef.current?.destroy();
      },
    });

    viewerRef.current.show();

    return () => {
      viewerRef.current?.destroy();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={{ display: "none" }}>
      <div ref={containerRef}>
        {images.map((file, index) => (
          <img
            key={index}
            src={URL.createObjectURL(file)}
            alt={`viewer-${index}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageViewer;
