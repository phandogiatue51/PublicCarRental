import React, { useState, useEffect } from 'react';
import { Box, Text, VStack, HStack, Image, Badge, Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { modelAPI } from '../services/api';
import '../styles/MaybeYouWillLike.css';

const MaybeYouWillLike = ({ currentModelId, currentBrandName }) => {
    const [similarModels, setSimilarModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSimilarModels = async () => {
            try {
                setLoading(true);
                // Fetch all models
                const response = await modelAPI.getAll();
                console.log('Raw API response:', response);
                
                // Handle different response formats
                let models = [];
                if (Array.isArray(response)) {
                    models = response;
                } else if (response && Array.isArray(response.result)) {
                    models = response.result;
                } else if (response && Array.isArray(response.data)) {
                    models = response.data;
                }
                
                console.log('Processed models:', models);
                console.log('Current model ID:', currentModelId);
                console.log('Current brand:', currentBrandName);
                
                // First try to get models from same brand
                let similar = models.filter(model => 
                    model.id !== currentModelId && 
                    model.brandName === currentBrandName
                );
                
                console.log('Same brand models:', similar);
                
                // If not enough models from same brand, add other models
                if (similar.length < 4) {
                    const otherModels = models.filter(model => 
                        model.id !== currentModelId && 
                        model.brandName !== currentBrandName
                    );
                    similar = [...similar, ...otherModels].slice(0, 4);
                }
                
                // If still no models, show any available models (except current)
                if (similar.length === 0) {
                    similar = models.filter(model => model.id !== currentModelId).slice(0, 4);
                }
                
                console.log('Final similar models:', similar);
                setSimilarModels(similar);
            } catch (error) {
                console.error('Error fetching similar models:', error);
            } finally {
                setLoading(false);
            }
        };

        if (currentModelId) {
            fetchSimilarModels();
        }
    }, [currentModelId, currentBrandName]);

    const handleModelClick = (modelId) => {
        navigate(`/model/${modelId}`);
    };

    if (loading) {
        return (
            <Box className="maybe-you-will-like">
                <Text className="section-title">Maybe you will like</Text>
                <Text>Loading similar models...</Text>
            </Box>
        );
    }

    if (similarModels.length === 0) {
        return (
            <Box className="maybe-you-will-like">
                <Text className="section-title">Maybe you will like</Text>
                <Text color="gray.500" textAlign="center" py={4}>
                    No similar models found
                </Text>
            </Box>
        );
    }

    return (
        <Box className="maybe-you-will-like">
            <Text className="section-title">Maybe you will like</Text>
            <HStack spacing={4} className="models-grid" overflowX="auto">
                {similarModels.map((model) => (
                    <Box
                        key={model.id}
                        className="model-card"
                        onClick={() => handleModelClick(model.id)}
                        cursor="pointer"
                    >
                        <Image
                            src={model.imageUrl}
                            alt={model.name}
                            className="model-image"
                            fallbackSrc="/rent-icon.png"
                        />
                        <VStack spacing={2} className="model-info">
                            <Text className="model-name" noOfLines={2}>
                                {model.name}
                            </Text>
                            <Text className="model-brand" color="blue.500">
                                {model.brandName}
                            </Text>
                            <HStack spacing={2}>
                                <Badge colorScheme="green" className="price-badge">
                                    {model.pricePerHour.toLocaleString()}VND/hr
                                </Badge>
                                
                            </HStack>
                        </VStack>
                    </Box>
                ))}
            </HStack>
        </Box>
    );
};

export default MaybeYouWillLike;
