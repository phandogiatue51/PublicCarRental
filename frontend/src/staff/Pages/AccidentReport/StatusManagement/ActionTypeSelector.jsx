import { FormControl, FormLabel, Select } from '@chakra-ui/react';

export default function ActionTypeSelector({ 
  actionType, 
  setActionType, 
  isDisabled = false 
}) {
  const actionOptions = [
    { value: "0", label: "💰 Refund Contracts" },
    { value: "1", label: "🔄 Replace Vehicles" },
    { value: "2", label: "🛠️ Repair Only" }
  ];

  return (
    <FormControl mb={3}>
      <FormLabel>Action Type</FormLabel>
      <Select
        value={actionType}
        onChange={(e) => setActionType(e.target.value)}
        placeholder="Select action"
        isDisabled={isDisabled}
      >
        {actionOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FormControl>
  );
}