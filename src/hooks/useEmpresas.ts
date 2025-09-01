import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';
import { Empresa, EmpresaForm } from '../types';

export const useEmpresas = (page = 1, limit = 10, search = '', filtro = '') => {
  return useQuery({
    queryKey: ['empresas', page, limit, search, filtro],
    queryFn: () => apiService.getEmpresas(page, limit, search, filtro),
    keepPreviousData: true,
  });
};

export const useEmpresaById = (id: string) => {
  return useQuery({
    queryKey: ['empresas', id],
    queryFn: () => apiService.getEmpresaById(id),
    enabled: !!id,
  });
};

export const useCreateEmpresa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (empresaData: EmpresaForm) => apiService.createEmpresa(empresaData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });
};

export const useUpdateEmpresa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Empresa> }) =>
      apiService.updateEmpresa(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      queryClient.invalidateQueries({ queryKey: ['empresas', id] });
    },
  });
};

export const useDeleteEmpresa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteEmpresa(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });
};

export const useEmpresaPersonal = (id: string) => {
  return useQuery({
    queryKey: ['empresas', id, 'personal'],
    queryFn: () => apiService.getEmpresaPersonal(id),
    enabled: !!id,
  });
};
