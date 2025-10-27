import React from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
    Box, Text, HStack, Badge, Icon, Flex, useColorModeValue, Grid, GridItem
} from '@chakra-ui/react';
import {
    MdPerson, MdDriveEta, MdLocationOn, MdSchedule, MdAttachMoney,
    MdAssignment, MdBusiness
} from 'react-icons/md';

const ContractDetailModal = ({ isOpen, onClose, contract }) => {
    const textColor = useColorModeValue('secondaryGray.900', 'white');
    const cardBg = useColorModeValue('gray.50', 'gray.700');
    const greenBg = useColorModeValue('green.50', 'green.900');
    const greenBorder = useColorModeValue('green.200', 'green.700');

    if (!contract) return null;

    // Get status badge color
    const getStatusColor = (status) => {
        switch (status) {
            case 0: return 'orange'; // ToBeConfirmed - màu cam cho chờ xác nhận
            case 1: return 'green'; // Active - màu xanh lá cho đang hoạt động
            case 2: return 'purple'; // Completed - màu tím cho hoàn thành
            case 3: return 'red'; // Cancelled - màu đỏ cho đã hủy
            case 4: return 'teal'; // Confirmed - màu xanh ngọc cho đã xác nhận
            default: return 'gray';
        }
    };

    // Get status text
    const getStatusText = (status) => {
        switch (status) {
            case 0: return 'To Be Confirmed';
            case 1: return 'Active';
            case 2: return 'Completed';
            case 3: return 'Cancelled';
            case 4: return 'Confirmed';
            default: return 'Unknown';
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return 'N/A';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size="3xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <Flex align="center" gap={3}>
                        <Icon as={MdAssignment} color="blue.500" boxSize={6} />
                        <Text fontSize="xl" fontWeight="bold" color={textColor}>
                            Contract Details
                        </Text>
                        <Badge
                            colorScheme={getStatusColor(contract.status)}
                            variant="solid"
                            px={3}
                            py={1}
                            borderRadius="full"
                            fontSize="sm"
                            fontWeight="bold"
                        >
                            {getStatusText(contract.status)}
                        </Badge>
                    </Flex>
                </ModalHeader>
                <ModalCloseButton />

                <ModalBody pb={6}>
                    <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                        <GridItem colSpan={1}>
                            <Text fontSize="lg" fontWeight="bold" color={textColor} mb={3}>
                                Contract Information
                            </Text>
                            <Box w="100%" p={4} bg={cardBg} borderRadius="md">
                                <HStack justify="space-between" mb={2}>
                                    <Text fontWeight="semibold" color={textColor}>Contract ID:</Text>
                                    <Text color={textColor}>{contract.contractId}</Text>
                                </HStack>
                            </Box>
                        </GridItem>

                        <GridItem colSpan={2}>
                            <Text fontSize="lg" fontWeight="bold" color={textColor} mb={3}>
                                Rental Period
                            </Text>
                            <Box w="100%" p={4} bg={cardBg} borderRadius="md">
                                <HStack mb={2}>
                                    <Icon as={MdSchedule} color="teal.500" boxSize={5} />
                                    <Text fontWeight="semibold" color={textColor}>Start Time:</Text>
                                    <Text color={textColor}>
                                        {formatDate(contract.startTime)}
                                    </Text>
                                </HStack>
                                <HStack>
                                    <Icon as={MdSchedule} color="teal.500" boxSize={5} />
                                    <Text fontWeight="semibold" color={textColor}>End Time:</Text>
                                    <Text color={textColor}>
                                        {formatDate(contract.endTime)}
                                    </Text>
                                </HStack>
                            </Box>
                        </GridItem>

                        <GridItem colSpan={1}>
                            <Text fontSize="lg" fontWeight="bold" color={textColor} mb={3}>
                                Renter Information
                            </Text>
                            <Box w="100%" p={4} bg={cardBg} borderRadius="md">
                                <HStack mb={2}>
                                    <Icon as={MdBusiness} color="blue.500" boxSize={5} />
                                    <Text fontWeight="semibold" color={textColor}>Renter ID:</Text>
                                    <Text color={textColor}>{contract.evRenterId}</Text>
                                </HStack>
                                <HStack>
                                    <Icon as={MdPerson} color="blue.500" boxSize={5} />
                                    <Text fontWeight="semibold" color={textColor}>Renter Name:</Text>
                                    <Text color={textColor}>
                                        {contract.evRenterName}
                                    </Text>
                                </HStack>
                            </Box>
                        </GridItem>

                        {/* Staff Information */}
                        <GridItem colSpan={2}>
                            <Text fontSize="lg" fontWeight="bold" color={textColor} mb={3}>
                                Staff Information
                            </Text>
                            <Box w="100%" p={4} bg={cardBg} borderRadius="md">
                                <HStack mb={2}>
                                    <Icon as={MdBusiness} color="green.500" boxSize={5} />
                                    <Text fontWeight="semibold" color={textColor}>Staff ID:</Text>
                                    <Text color={textColor}>{contract.staffId}</Text>
                                </HStack>
                                <HStack>
                                    <Icon as={MdPerson} color="green.500" boxSize={5} />
                                    <Text fontWeight="semibold" color={textColor}>Staff Name:</Text>
                                    <Text color={textColor}>
                                        {contract.staffName}
                                    </Text>
                                </HStack>
                            </Box>
                        </GridItem>

                        {/* Vehicle Information */}
                        <GridItem colSpan={1}>
                            <Text fontSize="lg" fontWeight="bold" color={textColor} mb={3}>
                                Vehicle Information
                            </Text>
                            <Box w="100%" p={4} bg={cardBg} borderRadius="md">
                                <HStack mb={2}>
                                    <Icon as={MdBusiness} color="purple.500" boxSize={5} />
                                    <Text fontWeight="semibold" color={textColor}>Vehicle ID:</Text>
                                    <Text color={textColor}>{contract.vehicleId}</Text>
                                </HStack>
                                <HStack>
                                    <Icon as={MdDriveEta} color="purple.500" boxSize={5} />
                                    <Text fontWeight="semibold" color={textColor}>License Plate:</Text>
                                    <Text color={textColor} fontSize="lg">
                                        {contract.vehicleLicensePlate}
                                    </Text>
                                </HStack>
                            </Box>
                        </GridItem>

                        {/* Station Information */}
                        <GridItem colSpan={2}>
                            <Text fontSize="lg" fontWeight="bold" color={textColor} mb={3}>
                                Station Information
                            </Text>
                            <Box w="100%" p={4} bg={cardBg} borderRadius="md">
                                <HStack mb={2}>
                                    <Icon as={MdBusiness} color="orange.500" boxSize={5} />
                                    <Text fontWeight="semibold" color={textColor}>Station ID:</Text>
                                    <Text color={textColor}>{contract.stationId}</Text>
                                </HStack>
                                <HStack>
                                    <Icon as={MdLocationOn} color="orange.500" boxSize={5} />
                                    <Text fontWeight="semibold" color={textColor}>Station Name:</Text>
                                    <Text color={textColor}>
                                        {contract.stationName}
                                    </Text>
                                </HStack>
                            </Box>
                        </GridItem>

                        <GridItem colSpan={3}>
                            <Text fontSize="lg" fontWeight="bold" color={textColor} mb={3}>
                                Financial Information
                            </Text>
                            <Box w="100%" p={4} bg={greenBg} borderRadius="md" border="1px" borderColor={greenBorder}>
                                <HStack justify="center">
                                    <Icon as={MdAttachMoney} color="green.500" boxSize={6} />
                                    <Text fontSize="xl" fontWeight="bold" color="green.600">
                                        Total Cost: {formatCurrency(contract.totalCost)}
                                    </Text>
                                </HStack>
                            </Box>
                        </GridItem>
                    </Grid>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default ContractDetailModal;