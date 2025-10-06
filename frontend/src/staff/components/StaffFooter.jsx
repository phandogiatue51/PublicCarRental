import React, { useState, useEffect } from 'react';
import { Box, Text, Flex, useColorModeValue, Spinner } from '@chakra-ui/react';
import { staffAPI } from '../../services/api'; 

const StaffFooter = () => {
    const [staffInfo, setStaffInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const bgColor = useColorModeValue('gray.100', 'gray.700');
    const textColor = useColorModeValue('gray.600', 'gray.300');

    useEffect(() => {
        const fetchStaffInfo = async () => {
            try {
                const staffId = sessionStorage.getItem('staffId');
                
                if (!staffId) {
                    setError('No staff ID found');
                    setLoading(false);
                    return;
                }

                const data = await staffAPI.getById(staffId);
                setStaffInfo(data);
            } catch (err) {
                setError(err.message || 'Failed to load staff information');
                console.error('Error fetching staff info:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStaffInfo();
    }, []);

    return (
        <Box
            bg={bgColor}
            borderTop="1px"
            borderColor={useColorModeValue('gray.200', 'gray.600')}
            p={4}
            mt="auto"
        >
            <Flex
                justify="space-between"
                align="center"
                maxW="1200px"
                mx="auto"
                direction={{ base: 'column', md: 'row' }}
                gap={2}
            >
                <Text color={textColor} fontSize="sm">
                    Staff Portal System
                </Text>
                
                {loading ? (
                    <Flex align="center" gap={2}>
                        <Spinner size="sm" />
                        <Text color={textColor} fontSize="sm">Loading staff info...</Text>
                    </Flex>
                ) : error ? (
                    <Text color="red.500" fontSize="sm">
                        Error: {error}
                    </Text>
                ) : staffInfo ? (
                    <Flex 
                        gap={4} 
                        direction={{ base: 'column', sm: 'row' }}
                        align={{ base: 'flex-start', sm: 'center' }}
                        textAlign={{ base: 'left', sm: 'center' }}
                    >
                        <Text color={textColor} fontSize="sm">
                            <strong>Staff ID:</strong> {staffInfo.staffId}
                        </Text>
                        <Text color={textColor} fontSize="sm">
                            <strong>Name:</strong> {staffInfo.fullName}
                        </Text>
                        <Text color={textColor} fontSize="sm">
                            <strong>Station ID:</strong> {staffInfo.stationId}
                        </Text>
                    </Flex>
                ) : null}
            </Flex>
        </Box>
    );
};

export default StaffFooter;