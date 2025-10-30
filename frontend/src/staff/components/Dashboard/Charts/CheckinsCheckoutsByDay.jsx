import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, Text, Spinner, HStack } from '@chakra-ui/react';
import Chart from 'react-apexcharts';
import { staffDashboardAPI } from '../../../../services/api';

const formatDateKey = (iso) => {
  try {
    const d = new Date(iso);
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  } catch {
    return null;
  }
};

const buildPastDaysRange = (days = 7) => {
  const arr = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    d.setDate(today.getDate() - i);
    arr.push(new Date(d));
  }
  return arr;
};

const CheckinsCheckoutsByDay = ({ stationId, days = 7, count = 100 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [checkouts, setCheckouts] = useState([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [inRes, outRes] = await Promise.all([
          staffDashboardAPI.getIncomingCheckins(stationId, count),
          staffDashboardAPI.getIncomingCheckouts(stationId, count),
        ]);
        if (!active) return;
        setCheckins(Array.isArray(inRes) ? inRes : (inRes.result || []));
        setCheckouts(Array.isArray(outRes) ? outRes : (outRes.result || []));
      } catch (e) {
        if (active) setError(e.message || 'Failed to load data');
      } finally {
        if (active) setLoading(false);
      }
    };
    if (stationId) load();
    return () => { active = false; };
  }, [stationId, count]);

  const { categories, series } = useMemo(() => {
    const daysRange = buildPastDaysRange(days);
    const keyList = daysRange.map(d => d.toISOString().slice(0, 10));
    const inCountByDay = Object.fromEntries(keyList.map(k => [k, 0]));
    const outCountByDay = Object.fromEntries(keyList.map(k => [k, 0]));

    for (const it of checkins) {
      const key = formatDateKey(it.scheduledTime || it.expectedCheckinTime);
      if (key && key in inCountByDay) inCountByDay[key]++;
    }
    for (const it of checkouts) {
      const key = formatDateKey(it.scheduledTime || it.expectedCheckoutTime);
      if (key && key in outCountByDay) outCountByDay[key]++;
    }

    return {
      categories: daysRange.map(d => d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })),
      series: [
        { name: 'Check-ins', data: keyList.map(k => inCountByDay[k]) },
        { name: 'Check-outs', data: keyList.map(k => outCountByDay[k]) },
      ]
    };
  }, [checkins, checkouts, days]);

  const options = {
    chart: { id: 'checkins-checkouts', toolbar: { show: false } },
    xaxis: { categories },
    colors: ['#38A169', '#805AD5'],
    dataLabels: { enabled: false },
    stroke: { curve: 'straight' },
    legend: { position: 'top' },
    grid: { strokeDashArray: 3 },
  };

  return (
    <Card shadow="md" borderRadius="lg">
      <CardBody minH="360px">
        <Text fontSize="lg" fontWeight="bold" mb={4}>Check-ins/Check-outs by Day</Text>
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

export default CheckinsCheckoutsByDay;


