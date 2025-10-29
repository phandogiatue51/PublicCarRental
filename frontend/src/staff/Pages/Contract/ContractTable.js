// components/ContractsTable.js
import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Text,
  Icon,
  Box,
  Badge,
  Button,
  Tooltip,
} from '@chakra-ui/react';
import { flexRender } from '@tanstack/react-table';
import { MdSchedule, MdPhotoLibrary, MdVisibility, MdDirectionsCar, MdExitToApp } from 'react-icons/md';

const ContractsTable = ({ 
  table, 
  columns, 
  borderColor, 
  textColor, 
  onView, 
  onImageView, 
  onHandover, 
  onReturn,
  getStatusColor,
  getStatusText,
  formatDate 
}) => {
  return (
    <Box overflowX="auto">
      <Table variant="simple" color="gray.500" mb="24px">
        <Thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Th
                  key={header.id}
                  colSpan={header.colSpan}
                  pe="10px"
                  borderColor={borderColor}
                  cursor={header.column.getCanSort() ? 'pointer' : 'default'}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <Flex
                    justifyContent="space-between"
                    align="center"
                    fontSize={{ sm: "10px", lg: "12px" }}
                    color="gray.400"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {{
                      asc: ' 🔼',
                      desc: ' 🔽',
                    }[header.column.getIsSorted()] ?? null}
                  </Flex>
                </Th>
              ))}
            </Tr>
          ))}
        </Thead>
        <Tbody>
          {table.getRowModel().rows.length === 0 ? (
            <Tr>
              <Td colSpan={columns.length} textAlign="center" py={8}>
                <Text color="gray.500">No contracts found</Text>
              </Td>
            </Tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <Tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <Td
                    key={cell.id}
                    fontSize="sm"
                    border="none"
                    borderBottom="1px"
                    borderColor={borderColor}
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </Td>
                ))}
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </Box>
  );
};

export default ContractsTable;