import { HStack, Select, Button, Card } from "@chakra-ui/react";

export default function VehicleFilter({ filters, options, onFilterChange, onClear }) {
  const handleFilterUpdate = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    onFilterChange(newFilters);
  };

  return (
    <Card mb={4} p={4}>
      <HStack spacing={4} wrap="wrap">
        <Select
          placeholder="Type"
          value={filters.type}
          onChange={(e) => handleFilterUpdate('type', e.target.value)}
          width="180px" 
          flex={1}
        >
          {options.types.map(type => (
            <option key={type.typeId} value={type.typeId}>
              {type.name}
            </option>
          ))}
        </Select>

        <Select
          placeholder="Brand"
          value={filters.brand}
          onChange={(e) => handleFilterUpdate('brand', e.target.value)}
          width="180px"
          flex={1}
        >
          {options.brands.map(brand => (
            <option key={brand.brandId} value={brand.brandId}>
              {brand.name}
            </option>
          ))}
        </Select>

        <Select
          placeholder="Model"
          value={filters.model}
          onChange={(e) => handleFilterUpdate('model', e.target.value)}
          width="180px"
          flex={1}
          isDisabled={!options.filteredModels.length}
        >
          {options.filteredModels.map(model => (
            <option key={model.modelId} value={model.modelId}>
              {model.name}
            </option>
          ))}
        </Select>

        <Select
          placeholder="Station"
          value={filters.station}
          onChange={(e) => handleFilterUpdate('station', e.target.value)}
          width="180px"
          flex={1}
        >
          {options.stations.map(station => (
            <option key={station.stationId} value={station.stationId}>
              {station.name}
            </option>
          ))}
        </Select>

        <Select
          placeholder="Status"
          value={filters.status}
          onChange={(e) => handleFilterUpdate('status', e.target.value)}
          width="180px"
          flex={1}
        >
          <option value="0">To Be Rented</option>
          <option value="1">Renting</option>
          <option value="2">Charging</option>
          <option value="3">To Be Checkup</option>
          <option value="4">In Maintenance</option>
          <option value="5">Available</option>
        </Select>

        <Button colorScheme="blue" onClick={() => onFilterChange(filters)}>
          Apply Filter
        </Button>
        <Button variant="outline" onClick={onClear}>
          Clear
        </Button>
      </HStack>
    </Card>
  );
}