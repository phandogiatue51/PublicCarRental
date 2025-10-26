import React from 'react';
import { Box, Button, Text, VStack, HStack, Badge, Alert, AlertIcon } from '@chakra-ui/react';
import BookingSummaryModal from './BookingSummaryModal';
import '../styles/BookingForm.css';

const BookingFormUI = ({
    formData = { station: '', startDate: '', endDate: '' },
    allStations = [], 
    stationsLoading = false, 
    loading = false, 
    availabilityLoading = false, 
    stationAvailability = {}, 
    isStationAvailable = false, 
    showSummaryModal = false, 
    bookingSummary = null,
    onInputChange = () => {}, 
    onSubmit = () => {}, 
    onCloseModal = () => {}, 
    onConfirmBooking = () => {}
}) => {
    const getMinDateTimeLocal = () => {
        const now = new Date();
        now.setMinutes(0, 0, 0);
        return now.toISOString().slice(0,16);
    };

    const minDateTimeLocal = getMinDateTimeLocal();

    return (
        <Box className="booking-form-container">
            <Text className="booking-form-title">Book this car</Text>
            <form onSubmit={onSubmit} className="booking-form">
                <VStack spacing={6} align="stretch">
                    <HStack spacing={4} className="form-row">
                        <Box className="form-group">
                            <Text className="form-label">Select Station <span className="required">*</span></Text>
                           <select
                                value={formData.station}
                                onChange={(e) => onInputChange('station', e.target.value)}
                                className="form-select"
                                required
                                disabled={stationsLoading}
                            >
                                <option value="">
                                    {stationsLoading ? 'Loading stations...' : 'Select pick up station'}
                                </option>
                                {allStations.map((station, index) => (
                                    <option key={index} value={String(station.stationId)}>
                                        {station.name} - {station.address}
                                    </option>
                                ))}
                            </select>
                        </Box>

                        <Box className="form-group">
                            <Text className="form-label">Start Date <span className="required">*</span></Text>
                            <input
                                type="datetime-local"
                                value={formData.startDate}
                                onChange={(e) => onInputChange('startDate', e.target.value)}
                                className="form-date-input"
                                min={minDateTimeLocal}
                                required
                            />
                        </Box>

                        <Box className="form-group">
                            <Text className="form-label">End Date <span className="required">*</span></Text>
                            <input
                                type="datetime-local"
                                value={formData.endDate}
                                onChange={(e) => onInputChange('endDate', e.target.value)}
                                className="form-date-input"
                                min={formData.startDate || minDateTimeLocal}
                                required
                            />
                        </Box>
                    </HStack>

                    <Button
                        type="submit"
                        className="booking-submit-btn"
                        size="lg"
                        isLoading={loading}
                        loadingText="Booking..."
                        disabled={loading || !isStationAvailable}
                        colorScheme={isStationAvailable ? "blue" : "gray"}
                    >
                        {(() => {
                            if (loading) return "Booking...";
                            if (!isStationAvailable && formData.station) return "No Vehicles Available";
                            if (!formData.station) return "Book Now";
                            
                            const availableCount = stationAvailability[parseInt(formData.station)] || 0;
                            
                            if (availableCount === 1) return "Only 1 left! Book Now!";
                            if (availableCount === 2) return "Only 2 left! Book Now!";
                            if (availableCount === 3) return "Only 3 left! Book Now!";
                            return `${availableCount} Available - Book Now!`;
                        })()}
                    </Button>
                </VStack>
            </form>
            
            <BookingSummaryModal
                isOpen={showSummaryModal}
                onClose={onCloseModal}
                bookingSummary={bookingSummary}
                onConfirm={onConfirmBooking}
            />
        </Box>
    );
};

export default BookingFormUI;