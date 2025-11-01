import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, Text, Spinner, HStack } from '@chakra-ui/react';
import Chart from 'react-apexcharts';
import { staffDashboardAPI } from '../../../../services/api';

const AvailableByModelBar = ({ stationId, top = 10 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await staffDashboardAPI.getAvailableVehicles(stationId);
        if (!active) return;
        setItems(Array.isArray(res) ? res : (res.result || []));
      } catch (e) {
        if (active) setError(e.message || 'Failed to load data');
      } finally {
        if (active) setLoading(false);
      }
    };
    if (stationId) load();
    return () => { active = false; };
  }, [stationId]);

  const { categories, series } = useMemo(() => {
    const countByModel = new Map();
    for (const v of items) {
      const model = v.modelName || v.vehicleModel || 'Unknown Model';
      countByModel.set(model, (countByModel.get(model) || 0) + 1);
    }
    const sorted = [...countByModel.entries()].sort((a, b) => b[1] - a[1]).slice(0, top);
    return {
      categories: sorted.map(([m]) => m),
      series: [{ name: 'Available', data: sorted.map(([, c]) => c) }],
    };
  }, [items, top]);

  const maxValue = Math.max(...(series[0]?.data || [1]), 5);

  const options = {
    chart: { id: 'available-by-model', toolbar: { show: false } },
    xaxis: { 
      categories,
      min: 0,
      max: maxValue,
      tickAmount: maxValue,
      labels: {
        formatter: (val) => Math.round(val)
      }
    },
    colors: ['#319795'],
    dataLabels: { enabled: true },
    plotOptions: { bar: { horizontal: true } },
    grid: { strokeDashArray: 3 },
  };

  return (
    <Card shadow="md" borderRadius="lg">
      <CardBody>
        <Text fontSize="lg" fontWeight="bold" mb={4}>Available by Model</Text>
        {loading ? (
          <HStack spacing={3} justify="center" py={8}>
            <Spinner />
            <Text>Loading...</Text>
          </HStack>
        ) : error ? (
          <Text color="red.500">{error}</Text>
        ) : (
          <Chart options={options} series={series} type="bar" height={320} />
        )}
      </CardBody>
    </Card>
  );
};

export default AvailableByModelBar;