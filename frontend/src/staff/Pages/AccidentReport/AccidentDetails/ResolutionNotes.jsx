import { FormControl, FormLabel, Textarea } from '@chakra-ui/react';

export default function ResolutionNotes({ 
  resolutionNote, 
  setResolutionNote, 
  existingNote = '',
  isDisabled = false 
}) {
  return (
    <FormControl mb={3}>
      <FormLabel>Resolution Notes</FormLabel>
      <Textarea
        value={resolutionNote || existingNote || ''}
        onChange={(e) => setResolutionNote(e.target.value)}
        placeholder="Add resolution notes (Optional)(e.g., call repair team, contact customer, etc.)"
        size="sm"
        isDisabled={isDisabled}
      />
    </FormControl>
  );
}