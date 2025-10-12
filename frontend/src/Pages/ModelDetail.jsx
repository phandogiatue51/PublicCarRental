import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, useColorModeValue } from "@chakra-ui/react";
import HeroPages from "../components/HeroPages";
import Footer from "../components/Footer";
import { modelAPI } from "../services/api";
import "../styles/ModelDetail.css";

function ModelDetail() {
  const { id } = useParams();
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cardBg = useColorModeValue("white", "navy.800");

  useEffect(() => {
    const fetchModel = async () => {
      try {
        const response = await modelAPI.getById(id);
        console.log('Model API response:', response); // Debug log
        const m = response;
        if (!m || !m.name) { // Check for valid data
          setError("Model not found");
          setLoading(false);
          return;
        }
        setModel({
          name: m.name,
          brandName: m.brandName,
          typeName: m.typeName,
          price: m.pricePerHour,
          imagePath: m.imageUrl,
          range: m.range || 0,
          capacity: m.capacity || 0,
          description: m.description || "",
        });
        setLoading(false);
      } catch (err) {
        setError("Error fetching model details");
        setLoading(false);
      }
    };
    fetchModel();
  }, [id]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!model) return <div className="error-state">Model not found</div>;

  return (
    <>
      <section className="model-detail-page">
        <HeroPages name={`${model.name} Details`} />
        <div className="container">
          <div className="model-detail-flex">
            {/* Left: Image */}
            <div className="model-detail-image-box">
              <img
                src={model.imagePath}
                alt={model.name}
                className="model-detail-image"
              />
            </div>
            {/* Right: Info */}
            <div className="model-detail-info-box">
              <h2 className="model-detail-title">{model.name}</h2>
              <span className="model-detail-brand">{model.brandName}</span>
              <div className="model-detail-type-price">
                <span className="model-detail-type">{model.typeName}</span>
                <span className="model-detail-price">${model.price}/hr</span>
              </div>
              <div className="model-detail-features">
                <div className="feature-item"><b>Fuel:</b> Electric</div>
                <div className="feature-item"><b>Range:</b> {model.range} km</div>
                <div className="feature-item"><b>Capacity:</b> {model.capacity} seats</div>
              </div>
              <div className="model-detail-description">
                <b>Description:</b>
                <p>{model.description || "Experience the future of driving with our premium electric vehicle. Featuring cutting-edge technology, superior comfort, and eco-friendly performance."}</p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </section>
    </>
  );
}

export default ModelDetail;
