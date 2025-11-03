import { FormControl, FormLabel, Select } from '@chakra-ui/react';

export default function StatusSelector({ 
  selectedStatus, 
  setSelectedStatus, 
  getNextStatusOptions, 
  currentStatus,
  isDisabled = false
}) {
  const statusOptions = getNextStatusOptions(currentStatus);

  return (
    <FormControl mb={3}>
      <FormLabel>Change Status</FormLabel>
      <Select
        value={selectedStatus}
        onChange={(e) => setSelectedStatus(e.target.value)}
        placeholder="Select next status"
        isDisabled={isDisabled || statusOptions.length === 0}
      >
        {statusOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FormControl>
  );
}