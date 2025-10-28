import React, { useState, useEffect } from 'react';
import { 
    Box, 
    VStack, 
    Text, 
    HStack, 
    Alert, 
    AlertIcon,
    Divider,
    Spinner
} from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';
import { ratingsAPI } from '../services/api';

function ModelRatings({ modelId }) {
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRatings = async () => {
            try {
                setLoading(true);
                const data = await ratingsAPI.getByModel(modelId);
                setRatings(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error fetching ratings:', err);
                setError('Failed to load ratings');
            } finally {
                setLoading(false);
            }
        };

        fetchRatings();
    }, [modelId]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <Box textAlign="center" py={8}>
                <Spinner size="xl" />
                <Text mt={4} fontSize="1.4rem">Loading reviews...</Text>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert status="error" borderRadius="md" fontSize="1.3rem">
                <AlertIcon />
                {error}
            </Alert>
        );
    }

    return (
        <Box mt={10} mb={10}>
            <Text fontSize="2.5rem" fontWeight="bold" mb={6} color="gray.800">
                Customer Reviews ({ratings.length})
            </Text>

            {ratings.length === 0 ? (
                <Alert status="info" borderRadius="md" fontSize="1.3rem">
                    <AlertIcon />
                    No reviews yet. Be the first to review this model!
                </Alert>
            ) : (
                <VStack spacing={6} align="stretch">
                    {ratings.map((rating) => (
                        <Box key={rating.ratingId} p={6} borderWidth="1px" borderRadius="lg" boxShadow="sm">
                            {/* Header: Stars and Date */}
                            <HStack justify="space-between" mb={3}>
                                <HStack>
                                    {[...Array(5)].map((_, i) => (
                                        <StarIcon
                                            key={i}
                                            color={i < rating.stars ? "yellow.400" : "gray.300"}
                                            boxSize={5}
                                        />
                                    ))}
                                    <Text fontSize="1.4rem" fontWeight="bold" ml={2}>
                                        {rating.stars}.0
                                    </Text>
                                </HStack>
                                <Text fontSize="1.2rem" color="gray.500">
                                    {formatDate(rating.createdAt)}
                                </Text>
                            </HStack>

                            {/* Reviewer Info */}
                            <Text fontSize="1.5rem" fontWeight="semibold" color="gray.700" mb={2}>
                                {rating.renterName}
                            </Text>

                            {/* Rental Period */}
                            <Text fontSize="1.5rem" color="gray.600" mb={3} fontStyle="italic">
                                Rented from {formatDate(rating.startDate)} to {formatDate(rating.endDate)}
                            </Text>

                            <Divider my={3} />

                            {/* Comment */}
                            {rating.comment && (
                                <Text fontSize="1.75rem" color="gray.800" lineHeight="1.6">
                                    "{rating.comment}"
                                </Text>
                            )}
                        </Box>
                    ))}
                </VStack>
            )}
        </Box>
    );
}

export default ModelRatings;