import React from 'react';
import { Grid, FormControl, Select, HStack, Button, Icon, Input } from '@chakra-ui/react';
import { MdFilterList, MdClear } from 'react-icons/md';

const ContractFilters = ({
  filters,
  filterOptions,
  onFilterChange,
  onApplyFilter,
  onClearFilter,
  isFilterActive,
  loading
}) => {
  return (
    <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr auto auto auto auto auto" }} gap={4}>


      {/* Renter Filter */}
      <FormControl>
        <Select
          value={filters.renterId}
          onChange={(e) => onFilterChange('renterId', e.target.value)}
          placeholder="All Renters"
        >
          {filterOptions.renters.map(renter => (
            <option key={renter.renterId} value={renter.renterId}>
              {renter.fullName} (ID: {renter.renterId})
            </option>
          ))}
        </Select>
      </FormControl>

      {/* Vehicle Filter */}
      <FormControl>
        <Select
          value={filters.vehicleId}
          onChange={(e) => onFilterChange('vehicleId', e.target.value)}
          placeholder="All Vehicles"
        >
          {filterOptions.vehicles?.map(vehicle => (
            <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
              {vehicle.modelName} - {vehicle.licensePlate} (ID: {vehicle.vehicleId})
            </option>
          ))}
        </Select>
      </FormControl>

      <FormControl>
        <Input
          type="date"
          placeholder='Start Date'
          value={filters.startDate || ''}
          onChange={(e) => onFilterChange('startDate', e.target.value)}
        />
      </FormControl>

      <FormControl>
        <Input
          type="date"
          placeholder='End Date'
          value={filters.endDate || ''}
          onChange={(e) => onFilterChange('endDate', e.target.value)}
        />
      </FormControl>

      <FormControl>
        <Select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          placeholder="All Status"
        >
          {filterOptions.statuses.map(status => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>
      </FormControl>

      <HStack>
        <Button
          leftIcon={<Icon as={MdFilterList} />}
          colorScheme="blue"
          onClick={onApplyFilter}
          isDisabled={loading}
        >
          Apply Filters
        </Button>
        <Button
          leftIcon={<Icon as={MdClear} />}
          variant="outline"
          onClick={onClearFilter}
          isDisabled={loading || !isFilterActive}
        >
          Clear
        </Button>
      </HStack>
    </Grid>
  );
};

export default ContractFilters;