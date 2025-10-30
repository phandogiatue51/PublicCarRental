import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, Text, Spinner, HStack } from '@chakra-ui/react';
import Chart from 'react-apexcharts';
import { staffDashboardAPI } from '../../../../services/api';

const BatteryDistributionDonut = ({ stationId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await staffDashboardAPI.getLowBatteryVehicles(stationId);
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

  const { labels, series } = useMemo(() => {
    const buckets = [0, 0, 0, 0]; // <=15, 16-30, 31-50, >50
    for (const v of items) {
      const p = typeof v.batteryLevel === 'number' ? v.batteryLevel : (v.batteryPercent ?? v.battery ?? 0);
      if (p <= 15) buckets[0]++;
      else if (p <= 30) buckets[1]++;
      else if (p <= 50) buckets[2]++;
      else buckets[3]++;
    }
    return {
      labels: ['0-15%', '16-30%', '31-50%', '>50%'],
      series: buckets,
    };
  }, [items]);

  const options = {
    labels,
    legend: { position: 'bottom' },
    colors: ['#E53E3E', '#DD6B20', '#D69E2E', '#38A169'],
    dataLabels: { enabled: true },
  };

  return (
    <Card shadow="md" borderRadius="lg">
      <CardBody minH="360px">
        <Text fontSize="lg" fontWeight="bold" mb={4}>Battery Distribution</Text>
        {loading ? (
          <HStack spacing={3} justify="center" py={8}>
            <Spinner />
            <Text>Loading...</Text>
          </HStack>
        ) : error ? (
          <Text color="red.500">{error}</Text>
        ) : (
          <Chart options={options} series={series} type="donut" height={335} />
        )}
      </CardBody>
    </Card>
  );
};

export default BatteryDistributionDonut;


