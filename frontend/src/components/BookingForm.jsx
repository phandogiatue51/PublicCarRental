import React, { useState, useEffect } from 'react';
import { Box, Button, Select, Text, VStack, HStack } from '@chakra-ui/react';
import { bookingAPI, stationAPI } from '../services/api';
import BookingSummaryModal from './BookingSummaryModal';
import '../styles/BookingForm.css';

const BookingForm = ({ modelName, modelId, evRenterId }) => {
    const [formData, setFormData] = useState({
        station: '',
        startDate: '',
        endDate: ''
    });
    const [allStations, setAllStations] = useState([]);
    const [stationsLoading, setStationsLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [bookingSummary, setBookingSummary] = useState(null);
    
    // Debug: Log form data changes
    useEffect(() => {
        console.log('Form data updated:', formData);
    }, [formData]);
    
    // Fetch all stations on component mount
    useEffect(() => {
        const fetchAllStations = async () => {
            try {
                setStationsLoading(true);
                const stations = await stationAPI.getAll();
                console.log('Fetched all stations:', stations);
                setAllStations(stations);
            } catch (error) {
                console.error('Error fetching stations:', error);
            } finally {
                setStationsLoading(false);
            }
        };
        
        fetchAllStations();
    }, []);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Debug: Log stations data
    console.log('BookingForm all stations:', allStations);

    const handleInputChange = (field, value) => {
        console.log('handleInputChange:', field, 'value:', value, 'type:', typeof value);
        console.log('Previous form data:', formData);
        setFormData(prev => {
            const newData = {
                ...prev,
                [field]: value
            };
            console.log('New form data:', newData);
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Debug: Log form data before validation
        console.log('Form validation - station:', formData.station, 'startDate:', formData.startDate, 'endDate:', formData.endDate);
        console.log('Station validation check:', {
            hasStation: !!formData.station,
            isEmpty: formData.station === '',
            isNaN: isNaN(parseInt(formData.station)),
            parsedValue: parseInt(formData.station)
        });
        
        // Validate form
        if (!formData.station || !formData.startDate || !formData.endDate) {
            alert('Please fill in all required fields!');
            return;
        }
        
        // Validate date range
        if (new Date(formData.endDate) <= new Date(formData.startDate)) {
            alert('End date must be after start date!');
            return;
        }
        
        // Validate station ID is a number
        if (!formData.station || formData.station === '' || isNaN(parseInt(formData.station))) {
            alert('Please select a valid station!');
            return;
        }
        
        // Show warning before proceeding
        console.log('Form data:', formData);
        console.log('Station value:', formData.station, 'Type:', typeof formData.station);
        console.log('Available stations:', allStations);
        console.log('Looking for station ID:', formData.station);
        
        // Find the selected station
        const stationId = parseInt(formData.station);
        const selectedStation = allStations.find(s => s.stationId === stationId);
        
        console.log('Found station:', selectedStation);
        console.log('Station ID from form:', stationId);
        console.log('Available station IDs:', allStations.map(s => ({ stationId: s.stationId, name: s.name })));
        
        const stationName = selectedStation ? selectedStation.name : `Station ID: ${stationId}`;
        const confirmMessage = `Are you sure you want to book ${modelName}?\n\nStation: ${stationName}\nStart Date: ${formData.startDate}\nEnd Date: ${formData.endDate}`;
        
        if (window.confirm(confirmMessage)) {
            setLoading(true);
            try {
                // Convert dates to ISO format
                const startTime = new Date(formData.startDate + 'T00:00:00.000Z').toISOString();
                const endTime = new Date(formData.endDate + 'T23:59:59.999Z').toISOString();
                
                // Prepare booking data
                const bookingData = {
                    evRenterId: parseInt(evRenterId) || 1, // Default to 1 if not provided
                    modelId: parseInt(modelId),
                    stationId: stationId, // Use the already parsed stationId
                    startTime: startTime,
                    endTime: endTime
                };
                
                console.log('Sending booking request:', bookingData);
                console.log('Data types:', {
                    evRenterId: typeof bookingData.evRenterId,
                    modelId: typeof bookingData.modelId,
                    stationId: typeof bookingData.stationId,
                    startTime: typeof bookingData.startTime,
                    endTime: typeof bookingData.endTime
                });
                
                // Call API
                const response = await bookingAPI.createBooking(bookingData);
                
                console.log('Booking response:', response);
                
                // Check if response is successful (200)
                if (response && response.invoiceId && response.bookingToken) {
                    // Save response data
                    localStorage.setItem('lastBookingResponse', JSON.stringify(response));
                    
                    try {
                        // Get booking summary from Summary API
                        const summary = await bookingAPI.getBookingSummary(response.bookingToken);
                        console.log('Booking summary:', summary);
                        
                        // Show summary modal with data from Summary API
                        setBookingSummary({
                            bookingToken: summary.bookingToken,
                            invoiceId: response.invoiceId,
                            renterId: parseInt(evRenterId) || 1, // Include renterId for payment
                            message: response.message,
                            stationId: summary.stationId,
                            period: summary.period,
                            totalCost: summary.totalCost,
                            terms: summary.terms,
                            fullResponse: response,
                            // Add additional data for display
                            vehicle: {
                                modelName: modelName || 'Selected Vehicle'
                            },
                            station: {
                                name: selectedStation ? selectedStation.name : 'Selected Station'
                            },
                            startTime: startTime,
                            endTime: endTime
                        });
                        setShowSummaryModal(true);
                        
                    } catch (error) {
                        console.error('Error fetching booking summary:', error);
                        // Fallback: show modal with basic booking response data
                        setBookingSummary({
                            bookingToken: response.bookingToken,
                            invoiceId: response.invoiceId,
                            renterId: parseInt(evRenterId) || 1, // Include renterId for payment
                            message: response.message,
                            fullResponse: response,
                            vehicle: {
                                modelName: modelName || 'Selected Vehicle'
                            },
                            station: {
                                name: selectedStation ? selectedStation.name : 'Selected Station'
                            },
                            startTime: startTime,
                            endTime: endTime,
                            totalCost: 0
                        });
                        setShowSummaryModal(true);
                    }
                    
                } else {
                    // Handle error response (400)
                    const errorMessage = response?.message || 'Booking failed. Please try again.';
                    alert(`Error: ${errorMessage}`);
                }
                
                // Reset form
                setFormData({
                    station: '',
                    startDate: '',
                    endDate: ''
                });
                
            } catch (error) {
                console.error('Booking error:', error);
                alert('Failed to submit booking request. Please try again.');
            } finally {
                setLoading(false);
            }
        } else {
            console.log('Booking cancelled by user');
        }
    };

    return (
        <Box className="booking-form-container">
            <Text className="booking-form-title">Book this car</Text>
            
            <form onSubmit={handleSubmit} className="booking-form">
                <VStack spacing={6} align="stretch">
                    {/* Station and Date Selection in one row */}
                    <HStack spacing={4} className="form-row">
                        <Box className="form-group">
                            <Text className="form-label">
                                Select Station <span className="required">*</span>
                            </Text>
                            <select
                                placeholder="Select pick up station"
                                value={formData.station}
                                onChange={(e) => {
                                    console.log('Select onChange:', e.target.value);
                                    handleInputChange('station', e.target.value);
                                }}
                                className="form-select"
                                required
                                disabled={stationsLoading}
                            >
                                <option value="">
                                    {stationsLoading ? 'Loading stations...' : 'Select pick up station'}
                                </option>
                                {allStations.map((station, index) => {
                                    console.log('Station option:', { id: station.stationId, name: station.name, type: typeof station.stationId });
                                    return (
                                        <option key={index} value={String(station.stationId)}>
                                            {station.name} - {station.address}
                                        </option>
                                    );
                                })}
                            </select>
                        </Box>

                        <Box className="form-group">
                            <Text className="form-label">
                                Start Date <span className="required">*</span>
                            </Text>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => handleInputChange('startDate', e.target.value)}
                                className="form-date-input"
                                min={today}
                                required
                            />
                        </Box>

                        <Box className="form-group">
                            <Text className="form-label">
                                End Date <span className="required">*</span>
                            </Text>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => handleInputChange('endDate', e.target.value)}
                                className="form-date-input"
                                min={formData.startDate || today}
                                required
                            />
                        </Box>
                    </HStack>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        className="booking-submit-btn"
                        size="lg"
                        isLoading={loading}
                        loadingText="Booking..."
                        disabled={loading}
                    >
                        {loading ? 'Booking...' : 'Book Now'}
                    </Button>
                </VStack>
            </form>
            
            {/* Booking Summary Modal */}
            <BookingSummaryModal
                isOpen={showSummaryModal}
                onClose={() => setShowSummaryModal(false)}
                bookingSummary={bookingSummary}
                onConfirm={() => {
                    setShowSummaryModal(false);
                    setBookingSummary(null);
                    alert('Booking confirmed! Redirecting to payment...');
                }}
            />
        </Box>
    );
};

export default BookingForm;
