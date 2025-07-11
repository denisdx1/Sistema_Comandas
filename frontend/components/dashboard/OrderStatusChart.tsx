'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

interface OrderStatusChartProps {
  
  pendientes: number;
  enPreparacion: number;
  listas: number;
  entregadas: number;
  loading?: boolean;
}

export function OrderStatusChart({ 

  pendientes, 
  enPreparacion, 
  listas, 
  entregadas,
  loading = false 
}: OrderStatusChartProps) {
  // Estado para los datos del gráfico
  const [chartData, setChartData] = useState({
    labels: ['Pendientes', 'En Preparación', 'Listas', 'Entregadas'],
    datasets: [
      {
        data: [0, 0, 0, 0],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)', // Amber para pendientes
          'rgba(59, 130, 246, 0.8)', // Blue para en preparación
          'rgba(139, 92, 246, 0.8)', // Purple para listas
          'rgba(16, 185, 129, 0.8)', // Green para entregadas
        ],
        borderColor: [
          'rgba(245, 158, 11, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(16, 185, 129, 1)',
        ],
        borderWidth: 1,
      },
    ],
  });

  // Opciones del gráfico
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  // Actualizar los datos cuando cambien las props
  useEffect(() => {
    if (!loading) {
      setChartData({
        ...chartData,
        datasets: [
          {
            ...chartData.datasets[0],
            data: [pendientes, enPreparacion, listas, entregadas],
          },
        ],
      });
    }
  }, [pendientes, enPreparacion, listas, entregadas, loading]);

  return (
    <Card className="rounded-xl shadow-md overflow-hidden">
      <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-indigo-400"></div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Estado de Órdenes</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="h-32 w-32 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin"></div>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <Doughnut data={chartData} options={options} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}