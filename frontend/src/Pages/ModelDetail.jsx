import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, useColorModeValue, Button, VStack, Text, Alert, AlertIcon } from "@chakra-ui/react";
import HeroPages from "../components/HeroPages";
import Footer from "../components/Footer";
import { modelAPI } from "../services/api";
import '../styles/ModelDetail.css';

function ModelDetail() {
    const { id } = useParams();
    const [model, setModel] = useState(null);
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stationsLoading, setStationsLoading] = useState(false);

    const cardBg = useColorModeValue("white", "navy.800");

    useEffect(() => {
        const fetchModelAndStations = async () => {
            try {
                setLoading(true);

                // Fetch model details
                const response = await modelAPI.getById(id);
                console.log('Model API response:', response);
                const m = response;

                if (!m || !m.name) {
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

                // Fetch stations for this model
                setStationsLoading(true);
                const stationsData = await modelAPI.getStationFromModel(id);
                console.log('Stations API response:', stationsData);
                setStations(stationsData || []);
                setStationsLoading(false);

                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError("Error fetching model details");
                setLoading(false);
                setStationsLoading(false);
            }
        };

        fetchModelAndStations();
    }, [id]);

    const handleOpenInMaps = (station) => {
        const url = `https://www.google.com/maps?q=${station.latitude},${station.longitude}`;
        window.open(url, '_blank');
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error-state">{error}</div>;
    if (!model) return <div className="error-state">Model not found</div>;

    return (
        <>
            <section className="model-detail-page">
                <HeroPages name={`${model.name} Details`} />
                <div className="container">
                    <div className="model-detail-flex">
                        {/* Left Column: Image and Stations */}
                        <div className="left-column" style={{ flex: 1 }}>
                            {/* Image */}
                            <div className="model-detail-image-box">
                                <img
                                    src={model.imagePath}
                                    alt={model.name}
                                    className="model-detail-image"
                                />
                            </div>

                            {/* Station List - positioned under the image */}
                            <div className="stations-section" style={{
                                width: '100%',
                                marginTop: '2rem'
                            }}>
                                <h3 className="stations-title">Available at these stations:</h3>

                                {stationsLoading ? (
                                    <div className="loading">Loading stations...</div>
                                ) : stations.length > 0 ? (
                                    <VStack spacing={3} align="stretch" className="stations-list">
                                        {stations.map((station, index) => (
                                            <Box
                                                key={index}
                                                p={4}
                                                border="1px solid"
                                                borderColor="gray.200"
                                                borderRadius="md"
                                                bg={cardBg}
                                                className="station-card"
                                                style={{
                                                    width: '100%'
                                                }}
                                            >
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    gap: '16px'
                                                }}>
                                                    {/* Station Info */}
                                                    <div style={{ flex: 1 }}>
                                                        <Text fontWeight="bold" fontSize="lg" mb={1}>
                                                            {station.name}
                                                        </Text>
                                                        <Text fontSize="sm" color="gray.600">
                                                            {station.address}
                                                        </Text>
                                                    </div>

                                                    {/* Map Button */}
                                                    <Button
                                                        colorScheme="blue"
                                                        size="sm"
                                                        onClick={() => handleOpenInMaps(station)}
                                                        className="map-button"
                                                        style={{
                                                            whiteSpace: 'nowrap',
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        Open in Maps
                                                    </Button>
                                                </div>
                                            </Box>
                                        ))}
                                    </VStack>
                                ) : (
                                    <Alert status="info" borderRadius="md">
                                        <AlertIcon />
                                        This model is not currently available at any stations.
                                    </Alert>
                                )}
                            </div>
                        </div>

                        {/* Right: Info */}
                        <div className="model-detail-info-box">
                            <h1 className="model-detail-title">{model.name}</h1>
                           

                            <span className="model-detail-brand">{model.brandName}</span>
                            <div className="model-detail-type-price">
                                <span className="model-detail-type">{model.typeName}</span>
                                <span className="model-detail-price">${model.price}/hr</span>
                               
                           </div>

                            { /*
                            <div className="model-detail-features">
                                <div className="feature-item"><b>Fuel:</b> Electric</div>
                                <div className="feature-item"><b>Range:</b> {model.range} km</div>
                                <div className="feature-item"><b>Capacity:</b> {model.capacity} seats</div>
                            </div>
                              */}

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