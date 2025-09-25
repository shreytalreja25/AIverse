import { useState } from "react";
import { useNotify } from "../Notify.jsx";
import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";

const fadeUp = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const Card = styled(motion.div)`
  background-color: ${({ theme }) => theme.body === "#121212" ? "#2c2c2c" : "#f9f9f9"};
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: ${fadeUp} 320ms ease both;
  position: relative;
  min-height: 240px;
`;

export default function ActivitiesList({ items = [], city, country, onRefresh, onSelectItem }) {
  const [feedback, setFeedback] = useState(null);
  const { success } = useNotify();

  const openDirections = (place) => {
    const q = encodeURIComponent(`${place}, ${city}, ${country}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  };

  const like = (it) => {
    setFeedback({ type: "like", item: it });
  };
  const dislike = (it) => {
    setFeedback({ type: "dislike", item: it });
    if (onRefresh) onRefresh({ hint: `less like: ${it.title}` });
  };

  const share = async (it) => {
    const url = `${window.location.origin}${window.location.pathname}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: it.title, text: it.description, url });
      } else {
        await navigator.clipboard.writeText(url);
        success("Link copied to clipboard");
      }
    } catch {}
  };

  return (
    <div className="row g-3">
      {items.map((it, idx) => (
        <div className="col-12 col-md-6" key={`${it.place}-${idx}`}>
          <div className="card shadow-sm h-100">
            <div className="card-body d-flex flex-column">
              <h6 className="mb-1">{it.title}</h6>
              <div className="text-muted mb-2">{it.place} — {city}, {country}</div>
              <p className="flex-grow-1">{it.description}</p>
              <div className="d-flex gap-2 mt-2">
                <button className="btn btn-primary" onClick={() => openDirections(it.place)}>
                  <i className="fas fa-map"></i> Directions
                </button>
                <button className="btn btn-outline-secondary" onClick={() => onRefresh && onRefresh({ hint: `more like: ${it.title}` })}>
                  <i className="fas fa-magic"></i> More like this
                </button>
                {onSelectItem && (
                  <button className="btn btn-outline-primary" onClick={() => onSelectItem(it)}>
                    <i className="fas fa-location-dot"></i> View on Map
                  </button>
                )}
                <button className="btn btn-success" onClick={() => share(it)}>
                  <i className="fas fa-share"></i> Share
                </button>
                <button className="btn btn-outline-success" onClick={() => like(it)}>
                  <i className="fas fa-thumbs-up"></i>
                </button>
                <button className="btn btn-outline-danger" onClick={() => dislike(it)}>
                  <i className="fas fa-thumbs-down"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
      {feedback && (
        <div className="col-12"><small className="text-muted">Feedback: {feedback.type} — {feedback.item.title}</small></div>
      )}
    </div>
  );
}


