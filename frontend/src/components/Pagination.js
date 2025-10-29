// components/Pagination.js
import React, { useMemo } from 'react';
import { Flex, Button, HStack, Text, Select, Icon } from '@chakra-ui/react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  startIndex,
  endIndex
}) => {
  const pageNumbers = useMemo(() => {
    const maxVisiblePages = 5;
    const pages = [];

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage, endPage;

      if (currentPage <= 3) {
        startPage = 1;
        endPage = maxVisiblePages;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - maxVisiblePages + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - 2;
        endPage = currentPage + 2;
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  const goToFirstPage = () => onPageChange(1);
  const goToLastPage = () => onPageChange(totalPages);
  const goToPreviousPage = () => onPageChange(Math.max(currentPage - 1, 1));
  const goToNextPage = () => onPageChange(Math.min(currentPage + 1, totalPages));

  if (totalItems === 0) return null; 

  return (
    <Flex
      justify="space-between"
      align="center"
      w="100%"
      px="24px"
      py="16px"
      borderTop="1px"
      borderColor="gray.200"
      flexDirection={{ base: 'column', md: 'row' }}
      gap={4}
    >
      <Flex align="center">
        <Text fontSize="sm" mr={2}>
          Show:
        </Text>
        <Select
          value={pageSize}
          onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
          size="sm"
          w="auto"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </Select>
        <Text fontSize="sm" ml={2}>
          rows per page
        </Text>
      </Flex>

      <Flex align="center" gap={2}>
        <Text fontSize="sm">
          Showing {startIndex + 1} - {Math.min(endIndex, totalItems)} of {totalItems}
        </Text>
        <HStack spacing={1}>
          <Button
            size="sm"
            variant="outline"
            onClick={goToFirstPage}
            isDisabled={currentPage === 1}
          >
            <Icon as={MdChevronLeft} />
            <Icon as={MdChevronLeft} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={goToPreviousPage}
            isDisabled={currentPage === 1}
          >
            <Icon as={MdChevronLeft} />
          </Button>

          {pageNumbers.map((page) => (
            <Button
              key={page}
              size="sm"
              variant={currentPage === page ? 'solid' : 'outline'}
              colorScheme={currentPage === page ? 'blue' : 'gray'}
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ))}

          <Button
            size="sm"
            variant="outline"
            onClick={goToNextPage}
            isDisabled={currentPage === totalPages}
          >
            <Icon as={MdChevronRight} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={goToLastPage}
            isDisabled={currentPage === totalPages}
          >
            <Icon as={MdChevronRight} />
            <Icon as={MdChevronRight} />
          </Button>
        </HStack>
      </Flex>
    </Flex>
  );
};

export default Pagination;