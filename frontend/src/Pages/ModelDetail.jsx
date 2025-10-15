import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, useColorModeValue, Button, VStack, Text, Alert, AlertIcon } from "@chakra-ui/react";
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

    if (loading) return <div style={{ paddingTop: '100px', textAlign: 'center', fontSize: '1.6rem' }}>Loading...</div>;
    if (error) return <div style={{ paddingTop: '100px', textAlign: 'center', fontSize: '1.6rem', color: '#e53e3e' }}>{error}</div>;
    if (!model) return <div style={{ paddingTop: '100px', textAlign: 'center', fontSize: '1.6rem', color: '#e53e3e' }}>Model not found</div>;

    return (
        <>
            <section className="model-detail-page" style={{ paddingTop: '100px', minHeight: '100vh' }}>
                {/* ĐÃ XÓA HeroPages COMPONENT Ở ĐÂY */}

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
                                <h3 className="stations-title" style={{
                                    fontSize: '2rem',
                                    fontWeight: 'bold',
                                    marginBottom: '1.5rem',
                                    color: '#2d3748'
                                }}>
                                    Available at these stations:
                                </h3>

                                {stationsLoading ? (
                                    <div style={{
                                        textAlign: 'center',
                                        fontSize: '1.6rem',
                                        padding: '2rem'
                                    }}>
                                        Loading stations...
                                    </div>
                                ) : stations.length > 0 ? (
                                    <div className="stations-container">
                                        <div
                                            className="stations-scrollable"
                                            style={{
                                                maxHeight: '400px',
                                                overflowY: 'auto',
                                                paddingRight: '10px',
                                                marginTop: '1rem'
                                            }}
                                        >
                                            <VStack spacing={4} align="stretch" className="stations-list">
                                                {stations.map((station, index) => (
                                                    <Box
                                                        key={index}
                                                        p={5}
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
                                                            gap: '20px'
                                                        }}>
                                                            {/* Station Info */}
                                                            <div style={{ flex: 1 }}>
                                                                <Text fontWeight="bold" fontSize="1.5rem" mb={2}>
                                                                    {station.name}
                                                                </Text>
                                                                <Text fontSize="1.2rem" color="gray.600">
                                                                    {station.address}
                                                                </Text>
                                                            </div>

                                                            {/* Map Button */}
                                                            <Button
                                                                colorScheme="blue"
                                                                size="lg"
                                                                onClick={() => handleOpenInMaps(station)}
                                                                className="map-button"
                                                                style={{
                                                                    whiteSpace: 'nowrap',
                                                                    flexShrink: 0,
                                                                    fontSize: '1.1rem',
                                                                    padding: '0.75rem 1.5rem'
                                                                }}
                                                            >
                                                                Open in Maps
                                                            </Button>
                                                        </div>
                                                    </Box>
                                                ))}
                                            </VStack>
                                        </div>
                                        {stations.length > 3 && (
                                            <div style={{
                                                textAlign: 'center',
                                                marginTop: '1rem',
                                                fontSize: '1.2rem',
                                                color: '#718096',
                                                fontStyle: 'italic'
                                            }}>
                                                Scroll down to see more stations ({stations.length - 3} more)
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Alert status="info" borderRadius="md" fontSize="1.3rem">
                                        <AlertIcon />
                                        This model is not currently available at any stations.
                                    </Alert>
                                )}
                            </div>
                        </div>

                        {/* Right: Info */}
                        <div className="model-detail-info-box">
                            <h1 className="model-detail-title" style={{ fontSize: '3.8rem' }}>{model.name}</h1>


                            <span className="model-detail-brand" style={{ fontSize: '1.9rem' }}>{model.brandName}</span>
                            <div className="model-detail-type-price">
                                <span className="model-detail-type" style={{ fontSize: '1.8rem' }}>{model.typeName}</span>
                                <span className="model-detail-price" style={{ fontSize: '2.1rem' }}>${model.price}/hr</span>

                            </div>

                            { /*
                            <div className="model-detail-features">
                                <div className="feature-item"><b>Fuel:</b> Electric</div>
                                <div className="feature-item"><b>Range:</b> {model.range} km</div>
                                <div className="feature-item"><b>Capacity:</b> {model.capacity} seats</div>
                            </div>
                              */}

                            <div className="model-detail-description" style={{ fontSize: '1.6rem' }}>
                                <b style={{ fontSize: '1.7rem' }}>Description:</b>
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