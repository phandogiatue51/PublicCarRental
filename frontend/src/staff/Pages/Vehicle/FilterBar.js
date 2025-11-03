import React from 'react';
import { HStack, Select, Button, Input, Flex } from '@chakra-ui/react';

const FilterBar = ({ 
    filter, 
    setFilter, 
    models, 
    types, 
    brands, 
    stations, 
    presetStationId,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    onCheckAvailability,
    showAvailableOnly,
    onShowAllVehicles
}) => {
    const onFilterChange = (key) => (e) => {
        const value = e.target.value;
        setFilter(prev => {
            const newFilter = { ...prev, [key]: value };

            // If brand changes, clear model selection only if the current model doesn't belong to the new brand
            if (key === 'brandId') {
                const currentModel = models.find(m => m.modelId === parseInt(prev.modelId));
                if (currentModel && currentModel.brandId !== parseInt(value)) {
                    newFilter.modelId = '';
                }
            }

            return newFilter;
        });
    };

    const handleStartTimeChange = (e) => {
        setStartTime(e.target.value);
    };

    const handleEndTimeChange = (e) => {
        setEndTime(e.target.value);
    };

    const clearAllFilters = () => {
        setFilter({ modelId: '', typeId: '', brandId: '', stationId: '', status: '' });
        setStartTime('');
        setEndTime('');
        if (showAvailableOnly) {
            onShowAllVehicles();
        }
    };

    // Get models to display - all models if no brand selected, filtered by brand if brand selected
    const displayModels = filter.brandId
        ? models.filter(model => model.brandId === parseInt(filter.brandId))
        : models;

    return (
        <Flex direction="column" gap={4}>
            {/* First row - Vehicle filters */}
            <HStack spacing={3}>
                {/* Brand dropdown - optional */}
                <Select 
                    placeholder="All Brands"
                    value={filter.brandId}
                    onChange={onFilterChange('brandId')}
                    size="sm"
                    flex={1}
                >
                    {brands.map(b => (<option key={b.brandId} value={b.brandId}>{b.name}</option>))}
                </Select>

                {/* Model dropdown - shows all models by default, filtered when brand is selected */}
                <Select
                    placeholder="All Models"
                    value={filter.modelId}
                    onChange={onFilterChange('modelId')}
                    size="sm"
                    flex={1}
                >
                    {displayModels.map(m => (<option key={m.modelId} value={m.modelId}>{m.name}</option>))}
                </Select>

                <Select 
                    placeholder="All Types"
                    value={filter.typeId}
                    onChange={onFilterChange('typeId')}
                    size="sm"
                    flex={1}
                >
                    {types.map(t => (<option key={t.typeId} value={t.typeId}>{t.name}</option>))}
                </Select>

                {!presetStationId && (
                    <Select 
                        placeholder="All Stations"
                        value={filter.stationId}
                        onChange={onFilterChange('stationId')}
                        size="sm"
                        flex={1}
                    >
                        {stations.map(s => (<option key={s.stationId} value={s.stationId}>{s.name}</option>))}
                    </Select>
                )}

                <Select 
                    placeholder="All Status" 
                    value={filter.status}
                    onChange={onFilterChange('status')}
                    size="sm"
                    flex={1}
                >
                    <option value="0">To Be Rented</option>
                    <option value="1">Renting</option>
                    <option value="2">Charging</option>
                    <option value="3">To Be Checkup</option>
                    <option value="4">In Maintenance</option>
                    <option value="5">Available</option>
                </Select>
            </HStack>

            {/* Second row - Date filters and actions */}
            <HStack spacing={3}>
                <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={handleStartTimeChange}
                    placeholder="Start Time"
                    size="sm"
                    flex={1}
                />
                <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={handleEndTimeChange}
                    placeholder="End Time"
                    size="sm"
                    flex={1}
                />
                
                {showAvailableOnly ? (
                    <Button 
                        onClick={onShowAllVehicles} 
                        colorScheme="blue" 
                        variant="outline"
                        size="sm"
                        flex={1}
                    >
                        Show All Vehicles
                    </Button>
                ) : (
                    <Button
                        colorScheme="green"
                        onClick={onCheckAvailability}
                        size="sm"
                        flex={1}
                    >
                        Check Availability
                    </Button>
                )}

                <Button 
                    onClick={clearAllFilters} 
                    size="sm" 
                    colorScheme='blue'
                    flex={1}
                >
                    Clear All
                </Button>
            </HStack>
        </Flex>
    );
};

export default FilterBar;