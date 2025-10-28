import { Flex, Text, Button, HStack, Select, Card } from "@chakra-ui/react";
import { useColorModeValue } from "@chakra-ui/react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

export default function VehiclePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
}) {
  const textColor = useColorModeValue("secondaryGray.900", "white");

  const pageNumbers = [];
  const maxVisiblePages = 5;

  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
  }

  return (
    <Card mt={4}>
      <Flex justify="space-between" align="center" p={4}>
        <Text fontSize="sm" color={textColor}>
          Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} vehicles
        </Text>

        <HStack spacing={2}>
          <Button
            size="sm"
            onClick={() => onPageChange(1)}
            isDisabled={currentPage === 1}
          >
            First
          </Button>
          <Button
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            isDisabled={currentPage === 1}
          >
            Prev
          </Button>

          {pageNumbers.map((num) => (
            <Button
              key={num}
              size="sm"
              variant={num === currentPage ? "solid" : "outline"}
              colorScheme={num === currentPage ? "blue" : "gray"}
              onClick={() => onPageChange(num)}
            >
              {num}
            </Button>
          ))}

          <Button
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            isDisabled={currentPage === totalPages}
          >
            Next
          </Button>
          <Button
            size="sm"
            onClick={() => onPageChange(totalPages)}
            isDisabled={currentPage === totalPages}
          >
            Last
          </Button>
        </HStack>
      </Flex>
    </Card>
  );
}