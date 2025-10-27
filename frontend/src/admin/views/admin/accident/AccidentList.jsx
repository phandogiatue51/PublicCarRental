import {
  Box, Button, Flex, Icon, Table, Tbody, Td, Text, Th, Thead, Tr, 
  useColorModeValue, Spinner, Alert, AlertIcon, AlertTitle, 
  AlertDescription, Badge, Image, Menu, MenuButton, MenuList, 
  MenuItem, useDisclosure, Modal, ModalOverlay, ModalContent, 
  ModalHeader, ModalBody, ModalCloseButton
} from '@chakra-ui/react';
import {
  createColumnHelper, flexRender, getCoreRowModel, 
  getSortedRowModel, useReactTable
} from '@tanstack/react-table';
import { useState, useEffect } from 'react';
import { accidentAPI } from '../../../../services/api';
import { MdEdit, MdDelete, MdAdd, MdVisibility, MdMoreVert } from 'react-icons/md';
import AccidentModal from './AccidentModal';
import StatusUpdateModal from './StatusUpdateModal';

import Card from '../../../components/card/Card';

const columnHelper = createColumnHelper();

export default function AccidentList() {
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sorting, setSorting] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedAccident, setSelectedAccident] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const { isOpen: isImageModalOpen, onOpen: onImageModalOpen, onClose: onImageModalClose } = useDisclosure();
  
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const brandColor = useColorModeValue('brand.500', 'white');

const fetchAccidents = async () => {
  try {
    setLoading(true);
    setError(null);
    console.log('Fetching accidents from API...');
    const data = await accidentAPI.getAll();
    console.log('Accidents fetched successfully:', data);
    
    const formattedData = data.map(accident => ({
      ...accident,
      reportedAt: accident.reportedAt === '0001-01-01T00:00:00' 
        ? new Date().toISOString() 
        : accident.reportedAt
    }));
    
    setAccidents(formattedData);
  } catch (err) {
    console.error('Error fetching accidents:', err);
    let errorMessage = 'Failed to fetch accident reports';
    
    if (err.message.includes('404')) {
      errorMessage = 'Accident API endpoint not found. Please check the backend URL.';
    } else if (err.message.includes('Unable to connect')) {
      errorMessage = 'Cannot connect to the server. Please check if the backend is running';
    } else if (err.message.includes('CORS')) {
      errorMessage = 'CORS error. Please check backend CORS configuration.';
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchAccidents();
  }, []);

const getStatusColor = (status) => {
  const statusValue = typeof status === 'number' 
    ? mapStatusNumberToString(status) 
    : status;
  
  const colors = {
    'Reported': 'blue',
    'UnderInvestigation': 'orange',
    'RepairApproved': 'yellow',
    'UnderRepair': 'purple',
    'Repaired': 'green'
  };
  return colors[statusValue] || 'gray';
};

const mapStatusNumberToString = (statusNumber) => {
  const statusMap = {
    0: 'Reported',
    1: 'UnderInvestigation',
    2: 'RepairApproved',
    3: 'UnderRepair',
    4: 'Repaired'
  };
  return statusMap[statusNumber] || 'Reported';
};

  const columns = [
    columnHelper.accessor('accidentId', {
      id: 'accidentId',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          ID
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm" fontWeight="700">
          #{info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('vehicleId', {
      id: 'vehicleId',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          VEHICLE ID
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm" fontWeight="600">
          VEH-{info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('contractId', {
      id: 'contractId',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          CONTRACT ID
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm">
          {info.getValue() ? `CONT-${info.getValue()}` : 'N/A'}
        </Text>
      ),
    }),
    columnHelper.accessor('description', {
      id: 'description',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          DESCRIPTION
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm" noOfLines={2} maxW="200px">
          {info.getValue() || 'No description'}
        </Text>
      ),
    }),
    columnHelper.accessor('location', {
      id: 'location',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          LOCATION
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm">
          {info.getValue() || 'Unknown'}
        </Text>
      ),
    }),
    columnHelper.accessor('reportedAt', {
      id: 'reportedAt',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          REPORTED AT
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm">
          {new Date(info.getValue()).toLocaleDateString()}
        </Text>
      ),
    }),
    columnHelper.accessor('status', {
    id: 'status',
    header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
        STATUS
        </Text>
    ),
    cell: (info) => {
        const statusValue = info.getValue();
        const statusText = typeof statusValue === 'number' 
        ? mapStatusNumberToString(statusValue) 
        : statusValue;
        
        return (
        <Badge 
            colorScheme={getStatusColor(statusValue)} 
            fontSize="xs" 
            px={2} 
            py={1} 
            borderRadius="full"
        >
            {statusText.replace(/([A-Z])/g, ' $1').trim()}
        </Badge>
        );
    },
    }),
    columnHelper.accessor('imageUrl', {
      id: 'image',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          IMAGE
        </Text>
      ),
      cell: (info) => (
        info.getValue() ? (
          <Image
            src={info.getValue()}
            alt="Accident"
            boxSize="40px"
            objectFit="cover"
            borderRadius="md"
            cursor="pointer"
            onClick={() => {
              setImagePreview(info.getValue());
              onImageModalOpen();
            }}
            _hover={{ opacity: 0.8 }}
          />
        ) : (
          <Text color="gray.500" fontSize="sm">No Image</Text>
        )
      ),
    }),
    columnHelper.accessor('actions', {
      id: 'actions',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          ACTIONS
        </Text>
      ),
      cell: (info) => (
        <Menu>
          <MenuButton
            as={Button}
            variant="ghost"
            size="sm"
            px={2}
          >
            <Icon as={MdMoreVert} />
          </MenuButton>
          <MenuList>
            <MenuItem 
              icon={<MdVisibility />}
              onClick={() => handleView(info.row.original)}
            >
              View Details
            </MenuItem>
            <MenuItem 
              icon={<MdEdit />}
              onClick={() => handleStatusUpdate(info.row.original)}
            >
              Update Status
            </MenuItem>
            <MenuItem 
              icon={<MdDelete />}
              color="red.500"
              onClick={() => handleDelete(info.row.original.accidentId)}
            >
              Delete Report
            </MenuItem>
          </MenuList>
        </Menu>
      ),
    }),
  ];

  const table = useReactTable({
    data: accidents,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  const handleView = (accident) => {
    setSelectedAccident(accident);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleStatusUpdate = (accident) => {
    setSelectedAccident(accident);
    setIsStatusModalOpen(true);
  };

  const handleDelete = async (accidentId) => {
    if (window.confirm('Are you sure you want to delete this accident report?')) {
      try {
        await accidentAPI.deleteReport(accidentId);
        await fetchAccidents(); 
      } catch (err) {
        setError(err.message || 'Failed to delete accident report');
      }
    }
  };

  const handleAdd = () => {
    setSelectedAccident(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsStatusModalOpen(false);
    setSelectedAccident(null);
    setIsEditMode(false);
  };

  const handleModalSuccess = () => {
    fetchAccidents();
  };

  if (loading) {
    return (
      <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
        <Card>
          <Flex justify="center" align="center" minH="200px">
            <Spinner size="xl" color={brandColor} />
            <Text ml={4} color={textColor}>
              Loading accident reports...
            </Text>
          </Flex>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
        <Card>
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Flex justify="center" mt={4}>
            <Button onClick={fetchAccidents} colorScheme="blue">
              Retry
            </Button>
          </Flex>
        </Card>
      </Box>
    );
  }

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <Flex direction="column" gap="20px" me="auto">
        <Flex
          mt="45px"
          justifyContent="space-between"
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'start', md: 'center' }}
        >
          <Text color={textColor} fontSize="2xl" ms="24px" fontWeight="700">
            Accident Report Management
          </Text>
          <Button
            leftIcon={<Icon as={MdAdd} />}
            colorScheme="blue"
            variant="solid"
            onClick={handleAdd}
            me="24px"
          >
            Create New Report
          </Button>
        </Flex>

        <Flex gap="4" wrap="wrap">
          <Card p="4" minW="200px">
            <Text color="gray.500" fontSize="sm">Total Reports</Text>
            <Text color={textColor} fontSize="2xl" fontWeight="700">{accidents.length}</Text>
          </Card>
          <Card p="4" minW="200px">
            <Text color="gray.500" fontSize="sm">Under Investigation</Text>
            <Text color="orange.500" fontSize="2xl" fontWeight="700">
              {accidents.filter(a => a.status === 'UnderInvestigation').length}
            </Text>
          </Card>
          <Card p="4" minW="200px">
            <Text color="gray.500" fontSize="sm">Under Repair</Text>
            <Text color="purple.500" fontSize="2xl" fontWeight="700">
              {accidents.filter(a => a.status === 'UnderRepair').length}
            </Text>
          </Card>
          <Card p="4" minW="200px">
            <Text color="gray.500" fontSize="sm">Repaired</Text>
            <Text color="green.500" fontSize="2xl" fontWeight="700">
              {accidents.filter(a => a.status === 'Repaired').length}
            </Text>
          </Card>
        </Flex>

        {/* Table Card */}
        <Card>
          <Box overflowX="auto">
            <Table variant="simple" color="gray.500" mb="24px" mt="12px">
              <Thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <Tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <Th
                        key={header.id}
                        colSpan={header.colSpan}
                        pe="10px"
                        borderColor={borderColor}
                        cursor="pointer"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <Flex
                          justifyContent="space-between"
                          align="center"
                          fontSize={{ sm: '10px', lg: '12px' }}
                          color="gray.400"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
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
                      <Td
                        key={cell.id}
                        fontSize={{ sm: '14px' }}
                        borderColor="transparent"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </Td>
                    ))}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Card>
      </Flex>

      <AccidentModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        accident={selectedAccident}
        isEdit={isEditMode}
      />

      <StatusUpdateModal
        isOpen={isStatusModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        accident={selectedAccident}
      />

      <Modal isOpen={isImageModalOpen} onClose={onImageModalClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Accident Image</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Image
              src={imagePreview}
              alt="Accident Preview"
              w="100%"
              h="auto"
              borderRadius="md"
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}