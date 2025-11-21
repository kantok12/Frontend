import { useQuery } from '@tanstack/react-query';
import apiService from '../services/api';

type Params = {
  cartera_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
};

export default function useResumenPersonalPorCliente(carteraId?: number, fechaInicio?: string, fechaFin?: string) {
  return useQuery(
    ['resumen-personal', carteraId, fechaInicio, fechaFin],
    async () => {
      const params: Params = {};
      if (typeof carteraId !== 'undefined') params.cartera_id = carteraId;
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;
      const resp = await apiService.getResumenPersonalPorCliente(params);
      return resp;
    },
    { staleTime: 60_000 }
  );
}
