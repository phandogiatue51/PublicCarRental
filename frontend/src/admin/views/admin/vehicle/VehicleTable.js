import {
  Table, Tbody, Td, Th, Thead, Tr, Flex, Text, Icon, Badge, VStack, Progress, Tooltip, Button, useColorModeValue,
} from "@chakra-ui/react";
import {
  createColumnHelper, flexRender, getCoreRowModel, useReactTable, getSortedRowModel,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import {
  MdDriveEta, MdLocationOn, MdBattery6Bar, MdEdit, MdDelete,
} from "react-icons/md";
import Card from "../../../components/card/Card";

const columnHelper = createColumnHelper();

export default function VehicleTable({ vehicles, onEdit, onDelete }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const [sorting, setSorting] = useState([]);

  const getStatusColor = (status) => {
    switch (status) {
      case 0: return "orange";
      case 1: return "blue";
      case 2: return "purple";
      case 3: return "red";
      case 4: return "orange";
      case 5: return "green";
      default: return "gray";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0: return "To Be Rented";
      case 1: return "Renting";
      case 2: return "Charging";
      case 3: return "To Be Checkup";
      case 4: return "In Maintenance";
      case 5: return "Available";
      default: return "Unknown";
    }
  };

  const getBatteryColor = (level) => {
    if (level >= 80) return "green";
    if (level >= 50) return "yellow";
    if (level >= 20) return "orange";
    return "red";
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("vehicleId", {
        header: () => <Text color="gray.400" fontSize="12px">ID</Text>,
        cell: (info) => (
          <Text color={textColor} fontSize="sm" fontWeight="700">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("licensePlate", {
        header: () => <Text color="gray.400" fontSize="12px">LICENSE PLATE</Text>,
        cell: (info) => (
          <Flex align="center" gap={2}>
            <Icon as={MdDriveEta} color="gray.500" />
            <Text color={textColor} fontSize="sm" fontWeight="700">
              {info.getValue()}
            </Text>
          </Flex>
        ),
      }),
      columnHelper.accessor("modelName", {
        header: () => <Text color="gray.400" fontSize="12px">MODEL</Text>,
        cell: (info) => (
          <Text color={textColor} fontSize="sm" fontWeight="700">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("batteryLevel", {
        header: () => <Text color="gray.400" fontSize="12px">BATTERY</Text>,
        cell: (info) => {
          const level = info.getValue();
          return (
            <Flex align="center" gap={2}>
              <Icon as={MdBattery6Bar} color={`${getBatteryColor(level)}.500`} />
              <VStack spacing={1} align="start">
                <Text color={textColor} fontSize="sm" fontWeight="bold">
                  {level}%
                </Text>
                <Progress
                  value={level}
                  size="sm"
                  colorScheme={getBatteryColor(level)}
                  width="60px"
                  borderRadius="md"
                />
              </VStack>
            </Flex>
          );
        },
      }),
      columnHelper.accessor("stationName", {
        header: () => <Text color="gray.400" fontSize="12px">STATION</Text>,
        cell: (info) => (
          <Flex align="center" gap={2}>
            <Icon as={MdLocationOn} color="gray.500" />
            <Text color={textColor} fontSize="sm">
              {info.getValue()}
            </Text>
          </Flex>
        ),
      }),
      columnHelper.accessor("status", {
        header: () => <Text color="gray.400" fontSize="12px">STATUS</Text>,
        cell: (info) => (
          <Badge
            colorScheme={getStatusColor(info.getValue())}
            variant="solid"
            px={3}
            py={1}
            borderRadius="full"
            fontSize="xs"
            fontWeight="bold"
          >
            {getStatusText(info.getValue())}
          </Badge>
        ),
      }),
      columnHelper.accessor("actions", {
        header: () => <Text color="gray.400" fontSize="12px">ACTIONS</Text>,
        cell: (info) => (
          <Flex align="center" gap={2}>
            <Tooltip label="Edit Vehicle">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Icon as={MdEdit} />}
                colorScheme="blue"
                onClick={() => onEdit(info.row.original)}
              >
                Edit
              </Button>
            </Tooltip>
            <Tooltip label="Delete Vehicle">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Icon as={MdDelete} />}
                colorScheme="red"
                onClick={() => onDelete(info.row.original.vehicleId)}
              >
                Delete
              </Button>
            </Tooltip>
          </Flex>
        ),
      }),
    ],
    [textColor, onEdit, onDelete]
  );

  const table = useReactTable({
    data: vehicles,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card>
      <Table variant="simple" color="gray.500" mb="24px" mt="12px">
        <Thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Th
                  key={header.id}
                  borderColor={borderColor}
                  cursor={header.column.getCanSort() ? "pointer" : "default"}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <Flex align="center" gap={2}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: "▲",
                      desc: "▼",
                    }[header.column.getIsSorted()] ?? null}
                  </Flex>
                </Th>
              ))}
            </Tr>
          ))}
        </Thead>
        <Tbody>
          {table.getRowModel().rows.map((row) => (
            <Tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <Td key={cell.id} borderColor="transparent">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Card>
  );
}