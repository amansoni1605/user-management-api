import React from "react";
import { Button } from "react-bootstrap";

const ShareButtons = () => {
  const currentUrl = encodeURIComponent(window.location.href);
  const shareText = encodeURIComponent("Check out this page!");

  return (
    <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
      {/* Facebook Share */}
      <Button
        variant="primary"
        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`, '_blank')}
      >
        Share on Facebook
      </Button>

      {/* WhatsApp Share */}
      <Button
        variant="success"
        onClick={() => window.open(`https://api.whatsapp.com/send?text=${shareText} ${currentUrl}`, '_blank')}
      >
        Share on WhatsApp
      </Button>

      {/* Twitter Share */}
      <Button
        variant="info"
        onClick={() => window.open(`https://twitter.com/intent/tweet?url=${currentUrl}&text=${shareText}`, '_blank')}
      >
        Share on Twitter
      </Button>

      {/* LinkedIn Share */}
      <Button
        variant="primary"
        onClick={() => window.open(`https://www.linkedin.com/shareArticle?url=${currentUrl}&title=${shareText}`, '_blank')}
      >
        Share on LinkedIn
      </Button>
    </div>
  );
};

export default ShareButtons;
