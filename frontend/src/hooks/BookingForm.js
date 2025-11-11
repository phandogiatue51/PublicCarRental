import React, { useState, useEffect } from 'react';
import { bookingAPI, stationAPI, modelAPI } from '../services/api';
import BookingFormUI from '../components/BookingFormUI';  

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
    const [stationAvailability, setStationAvailability] = useState({});
    const [availabilityLoading, setAvailabilityLoading] = useState(false);

    useEffect(() => {
    const fetchStationsForModel = async () => {
        try {
            setStationsLoading(true);
            const stations = await modelAPI.getStationFromModel(parseInt(modelId)); 
            setAllStations(stations || []);
        } catch (error) {
            console.error('Error fetching stations for model:', error);
            setAllStations([]);
        } finally {
            setStationsLoading(false);
        }
    };
    
    if (modelId) {
        fetchStationsForModel();
    }
}, [modelId]);

    useEffect(() => {
        const fetchAvailability = async () => {
            if (formData.startDate && formData.endDate && allStations.length > 0) {
                setAvailabilityLoading(true);
                const availabilityMap = {};
                
                for (const station of allStations) {
                    try {
                        const startTime = new Date(formData.startDate).toISOString();
                        const endTime = new Date(formData.endDate).toISOString();
                        const count = await modelAPI.getAvailableCount(
                            parseInt(modelId), 
                            station.stationId, 
                            startTime, 
                            endTime
                        );
                        availabilityMap[station.stationId] = count;
                    } catch (error) {
                        availabilityMap[station.stationId] = 0;
                    }
                }
                
                setStationAvailability(availabilityMap);
                setAvailabilityLoading(false);
            }
        };
        fetchAvailability();
    }, [formData.startDate, formData.endDate, allStations, modelId]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
            e.preventDefault();
            
            console.log('Form validation - station:', formData.station, 'startDate:', formData.startDate, 'endDate:', formData.endDate);
            console.log('Station validation check:', {
                hasStation: !!formData.station,
                isEmpty: formData.station === '',
                isNaN: isNaN(parseInt(formData.station)),
                parsedValue: parseInt(formData.station)
            });
            
            if (!formData.station || !formData.startDate || !formData.endDate) {
                alert('Please fill in all required fields!');
                return;
            }
            
            if (new Date(formData.endDate) <= new Date(formData.startDate)) {
                alert('End date must be after start date!');
                return;
            }
            
            if (!formData.station || formData.station === '' || isNaN(parseInt(formData.station))) {
                alert('Please select a valid station!');
                return;
            }
            
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
            
            setLoading(true);
            try {
                // Convert datetime-local strings to ISO (Date will treat them as local time)
                const startTime = new Date(formData.startDate).toISOString();
                const endTime = new Date(formData.endDate).toISOString();
                
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
        };

    const isStationAvailable = formData.station ? 
        (stationAvailability[parseInt(formData.station)] || 0) > 0 : false;

    return (
        <BookingFormUI
            formData={formData}
            allStations={allStations}
            stationsLoading={stationsLoading}
            loading={loading}
            availabilityLoading={availabilityLoading}
            stationAvailability={stationAvailability}
            isStationAvailable={isStationAvailable}
            showSummaryModal={showSummaryModal}
            bookingSummary={bookingSummary}
            modelName={modelName}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onCloseModal={() => setShowSummaryModal(false)}
            onConfirmBooking={() => {
                setShowSummaryModal(false);
                setBookingSummary(null);
                alert('Booking confirmed! Redirecting to payment...');
            }}
        />
    );
};

export default BookingForm;