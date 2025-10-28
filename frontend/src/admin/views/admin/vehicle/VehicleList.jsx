import { useState, useEffect, useCallback } from "react";
import { Box, useToast, useColorModeValue } from "@chakra-ui/react";
import { vehicleAPI, typeAPI, brandAPI, modelAPI, stationAPI } from "../../../../services/api";
import VehicleHeader from "./VehicleHeader";
import VehicleFilter from "./VehicleFilter";
import VehicleTable from "./VehicleTable";
import VehiclePagination from "./VehiclePagination";
import VehicleModal from "./VehicleModal";
import LoadingState from "./../../../../components/LoadingState";
import ErrorState from "./../../../../components/ErrorState";

export default function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    model: "",
    type: "",
    brand: "",
    status: "",
    station: ""
  });
  
  // Options for filters
  const [options, setOptions] = useState({
    types: [],
    brands: [],
    models: [],
    stations: [],
    filteredModels: []
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const toast = useToast();
  const textColor = useColorModeValue("secondaryGray.900", "white");

  const fetchVehiclesWithFilters = useCallback(async (filterParams = {}) => {
      try {
        setLoading(true);
        setError(null);
        
        const vehiclesRes = await vehicleAPI.filter(filterParams);
        
        setVehicles(vehiclesRes || []);
      } catch (err) {
        console.error("Error fetching filtered vehicles:", err);
        setError(err.message || "Failed to fetch vehicles");
      } finally {
        setLoading(false);
      }
    }, []);

  // Fetch all data
const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [typesRes, brandsRes, modelsRes, stationsRes] = await Promise.all([
        typeAPI.getAll(),
        brandAPI.getAll(),
        modelAPI.getAll(),
        stationAPI.getAll()
      ]);

      const vehiclesRes = await vehicleAPI.getAll();
      
      setVehicles(vehiclesRes || []);
      setOptions({
        types: typesRes || [],
        brands: brandsRes || [],
        models: modelsRes || [],
        stations: stationsRes || [],
        filteredModels: modelsRes || []
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);

    const apiFilters = {
      typeId: newFilters.type ? parseInt(newFilters.type) : null,
      brandId: newFilters.brand ? parseInt(newFilters.brand) : null,
      modelId: newFilters.model ? parseInt(newFilters.model) : null,
      status: newFilters.status ? parseInt(newFilters.status) : null,
      stationId: newFilters.station ? parseInt(newFilters.station) : null,
    };

    fetchVehiclesWithFilters(apiFilters);

    if (newFilters.type || newFilters.brand) {
      const filtered = options.models.filter(model => 
        (!newFilters.type || model.typeId.toString() === newFilters.type) &&
        (!newFilters.brand || model.brandId.toString() === newFilters.brand) 
      );
      setOptions(prev => ({ ...prev, filteredModels: filtered }));
      
      if (newFilters.model && !filtered.some(m => m.modelId.toString() === newFilters.model)) {
        setFilters(prev => ({ ...prev, model: "" }));
      }
    } else {
      setOptions(prev => ({ ...prev, filteredModels: prev.models }));
    }
  }, [options.models, fetchVehiclesWithFilters]);

  const filteredVehicles = vehicles.filter(vehicle => {
    return (
      (!filters.model || vehicle.modelId?.toString() === filters.model) &&
      (!filters.type || vehicle.typeId?.toString() === filters.type) &&
      (!filters.brand || vehicle.brandId?.toString() === filters.brand) &&
      (!filters.status || vehicle.status?.toString() === filters.status) &&
      (!filters.station || vehicle.stationId?.toString() === filters.station)
    );
  });

  const totalItems = filteredVehicles.length;

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);
  const totalPages = Math.ceil(totalItems / pageSize);

  // Vehicle actions
  const handleAdd = useCallback(() => {
    setSelectedVehicle(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((vehicle) => {
    setSelectedVehicle(vehicle);
    setIsEditMode(true);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (vehicleId) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        await vehicleAPI.delete(vehicleId);
        await fetchData();
        toast({
          title: "Success",
          description: "Vehicle deleted successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (err) {
        toast({
          title: "Error",
          description: err.message || "Failed to delete vehicle",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [toast, fetchData]);

  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
    setIsEditMode(false);
  }, []);

  const handleModalSuccess = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const handleClearFilters = useCallback(() => {
    setFilters({ model: "", type: "", brand: "", status: "" });
    setOptions(prev => ({ ...prev, filteredModels: prev.models }));
    setCurrentPage(1);
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <VehicleHeader onRefresh={handleRefresh} onAdd={handleAdd} />
      
      <VehicleFilter
        filters={filters}
        options={options}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      <VehicleTable
        vehicles={paginatedVehicles}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <VehiclePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      <VehicleModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        vehicle={selectedVehicle}
        isEdit={isEditMode}
      />
    </Box>
  );
}